const MENU_ANALYZE_IMAGE = 'analyze-image';
const MENU_CAPTURE_SELECTION = 'capture-selection';
const PENDING_INPUT_KEY = 'pendingInput';
const DB_NAME = 'promptcard-lite';
const DB_VERSION = 1;
const STORE_NAME = 'pending-payloads';
const MAX_DECODED_IMAGE_BYTES = 20 * 1024 * 1024; // 20MB

/* ── IndexedDB helpers ────────────────────────────────── */

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbPut(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ── Helpers ──────────────────────────────────────────── */

/**
 * 严格校验 data:image URL：MIME 白名单、base64 解码字节 <= 20MB、总长度合理。
 * 不满足时抛出 Error。
 */
function validateDataUrlStrict(dataUrl) {
  const match = String(dataUrl).match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/s);
  if (!match) {
    throw new Error('不支持的图片格式。仅支持 PNG、JPEG、WebP data URL。');
  }
  const base64 = match[2];
  // base64 每 4 字符编码 3 原始字节
  const estimatedBytes = Math.floor(base64.length * 3 / 4);
  if (estimatedBytes > MAX_DECODED_IMAGE_BYTES) {
    throw new Error('图片文件过大（超过 20MB）。请使用更小的图片。');
  }
  // 总 dataUrl 长度不应远超 base64 部分加上前缀开销
  const maxTotalLength = base64.length + 64; // "data:image/jpeg;base64," ≈ 23 字符
  if (dataUrl.length > maxTotalLength) {
    throw new Error('data URL 格式异常。');
  }
}

function generateJobId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2) + '-' + Math.random().toString(36).slice(2);
}

/**
 * 为给定 URL 的 origin 动态请求 optional_host_permissions。
 * data: / blob: 等非 http(s) 协议直接返回 true。
 */
async function ensureOriginPermission(urlString) {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return true;
    }
    const origin = url.origin + '/*';
    const has = await chrome.permissions.contains({ origins: [origin] });
    if (has) return true;
    return chrome.permissions.request({ origins: [origin] });
  } catch {
    return true;
  }
}

/* ── Context menus ────────────────────────────────────── */

chrome.runtime.onInstalled.addListener(() => {
  registerContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  registerContextMenus();
});

function registerContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ANALYZE_IMAGE,
      title: '分析这张图片',
      contexts: ['image']
    });
    chrome.contextMenus.create({
      id: MENU_CAPTURE_SELECTION,
      title: '框选截图并分析',
      contexts: ['page', 'image']
    });
  });
}

/* ── Menu click handler ───────────────────────────────── */

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_ANALYZE_IMAGE) {
    handleAnalyzeImage(info, tab).catch(error => openErrorResult(error.message));
    return;
  }
  if (info.menuItemId === MENU_CAPTURE_SELECTION) {
    startSelection(tab).catch(error => openErrorResult(error.message));
  }
});

/* ── SELECTION_COMPLETE handler (top-level for SW lifecycle) ── */

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message && message.type === 'SELECTION_COMPLETE') {
    handleSelectionComplete(message, sender).catch(error => openErrorResult(error.message));
  }
});

/* ── Business logic ───────────────────────────────────── */

async function handleAnalyzeImage(info, tab) {
  const srcUrl = info.srcUrl || '';
  const pageUrl = tab && tab.url ? tab.url : '';

  if (!srcUrl) {
    await setPendingInput({
      type: 'error',
      message: '没有找到可分析的图片地址。请尝试框选截图并分析。'
    });
    await openResultPage();
    return;
  }

  if (srcUrl.startsWith('blob:')) {
    await setPendingInput({
      type: 'error',
      message: '暂不支持直接读取 blob 图片。请返回页面，使用"框选截图并分析"截取图片区域。'
    });
    await openResultPage();
    return;
  }

  if (srcUrl.startsWith('data:image/')) {
    // 严格校验 data URL 的 MIME 白名单、base64 大小和总长度
    validateDataUrlStrict(srcUrl);

    // 大 payload 存 IndexedDB，session 只存 jobId
    const jobId = generateJobId();
    await idbPut(jobId, { dataUrl: srcUrl });
    await setPendingInput({
      type: 'data_url',
      jobId,
      pageUrl
    });
    await openResultPage();
    return;
  }

  // http/https 图片 URL — 动态请求图片来源 origin 权限
  const granted = await ensureOriginPermission(srcUrl);
  if (!granted) {
    await setPendingInput({
      type: 'error',
      message: '需要图片来源网站的访问权限才能读取图片。请授权后重试，或使用"框选截图并分析"。'
    });
    await openResultPage();
    return;
  }

  await setPendingInput({
    type: 'image_url',
    srcUrl,
    pageUrl
  });
  await openResultPage();
}

async function startSelection(tab) {
  if (!tab || typeof tab.id !== 'number') {
    throw new Error('无法访问当前标签页。');
  }

  // 注入 selection.css，确保框选遮罩有样式
  await chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    files: ['selection.css']
  });

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });

  await chrome.tabs.sendMessage(tab.id, {
    type: 'START_SELECTION'
  });
}

async function handleSelectionComplete(message, sender) {
  const tab = sender.tab;
  if (!tab || typeof tab.windowId !== 'number') {
    throw new Error('无法获取当前窗口用于截图。');
  }

  const rect = message.rect;
  if (!rect || rect.width < 20 || rect.height < 20) {
    throw new Error('选区太小，请重新选择更大的区域。');
  }

  const screenshotDataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
    format: 'jpeg',
    quality: 85
  });

  // 截图 payload 存 IndexedDB，避免 storage.session 配额溢出
  const jobId = generateJobId();
  await idbPut(jobId, { screenshotDataUrl });

  await setPendingInput({
    type: 'screenshot_selection',
    jobId,
    rect,
    pageUrl: tab.url || ''
  });

  await openResultPage();
}

async function setPendingInput(input) {
  await chrome.storage.session.remove(PENDING_INPUT_KEY);
  await chrome.storage.session.set({
    [PENDING_INPUT_KEY]: {
      ...input,
      createdAt: Date.now()
    }
  });
}

async function openResultPage() {
  await chrome.tabs.create({
    url: chrome.runtime.getURL('result.html')
  });
}

async function openErrorResult(message) {
  await setPendingInput({
    type: 'error',
    message: message || '操作失败。'
  });
  await openResultPage();
}
