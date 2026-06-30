const PENDING_INPUT_KEY = 'pendingInput';
const MAX_BASE64_LENGTH = 4 * 1024 * 1024;
const MAX_IMAGE_SIDE = 2048;
const JPEG_QUALITY = 0.85;
const API_TIMEOUT_MS = 120000;
const MAX_REMOTE_IMAGE_BYTES = 20 * 1024 * 1024;
const ALLOWED_IMAGE_MIMES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

// IndexedDB 常量（与 background.js 一致）
const DB_NAME = 'promptcard-lite';
const DB_VERSION = 1;
const STORE_NAME = 'pending-payloads';

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

async function idbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbDelete(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ── DOM refs ─────────────────────────────────────────── */

const elements = {
  status: document.getElementById('result-status'),
  previewImage: document.getElementById('preview-image'),
  promptZh: document.getElementById('prompt-zh'),
  promptEn: document.getElementById('prompt-en'),
  promptTags: document.getElementById('prompt-tags'),
  negativePrompt: document.getElementById('negative-prompt'),
  jsonPrompt: document.getElementById('json-prompt'),
  rawJson: document.getElementById('raw-json'),
  errorDetail: document.getElementById('error-detail')
};

/* ── Rendering helpers ────────────────────────────────── */

function setStatus(message, tone = 'neutral') {
  elements.status.textContent = message;
  elements.status.dataset.tone = tone;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value || '';
  }
}

function renderResult(result, rawText) {
  setStatus('分析完成。', 'success');
  setText('prompt-zh', result.prompt_zh || '');
  setText('prompt-en', result.prompt_en || '');
  setText('prompt-tags', Array.isArray(result.prompt_tags) ? result.prompt_tags.join(', ') : '');
  setText('negative-prompt', result.negative_prompt || '');
  setText('json-prompt', JSON.stringify(result.json_prompt || {}, null, 2));
  setText('raw-json', rawText || JSON.stringify(result, null, 2));
}

function renderError(error) {
  setStatus('处理失败。', 'error');
  elements.errorDetail.textContent = error instanceof Error ? error.stack || error.message : String(error);
}

function setupCopyButtons() {
  document.querySelectorAll('[data-copy-target]').forEach(button => {
    button.addEventListener('click', async () => {
      const targetId = button.getAttribute('data-copy-target');
      const target = document.getElementById(targetId);
      const text = target ? target.textContent : '';
      await navigator.clipboard.writeText(text || '');
      const oldText = button.textContent;
      button.textContent = '已复制';
      window.setTimeout(() => {
        button.textContent = oldText;
      }, 1200);
    });
  });
}

/* ── Storage / pending input ──────────────────────────── */

async function loadPendingInput() {
  const stored = await chrome.storage.session.get(PENDING_INPUT_KEY);
  await chrome.storage.session.remove(PENDING_INPUT_KEY);
  const input = stored[PENDING_INPUT_KEY];
  if (!input) {
    throw new Error('没有找到待分析输入。请回到网页右键图片或框选截图。');
  }
  return input;
}

async function loadJobPayload(jobId) {
  const payload = await idbGet(jobId);
  await idbDelete(jobId);
  return payload;
}

/* ── Image validation ─────────────────────────────────── */

/**
 * 校验 data URL 的 MIME 类型：拒绝 SVG 和非 png/jpeg/webp。
 */
function validateDataUrlMime(dataUrl) {
  if (!dataUrl.startsWith('data:')) {
    throw new Error('不是有效的 data URL。');
  }
  const match = dataUrl.match(/^data:([^;]+);/);
  if (!match) {
    throw new Error('无法解析 data URL 的 MIME 类型。');
  }
  const mime = match[1].toLowerCase();
  if (mime === 'image/svg+xml') {
    throw new Error('不支持 SVG 图片。请使用"框选截图并分析"截取图片区域。');
  }
  if (!ALLOWED_IMAGE_MIMES.has(mime)) {
    throw new Error(`不支持的图片类型（${mime}）。仅支持 PNG、JPEG、WebP。`);
  }
}

/**
 * 完整校验 data URL：MIME 白名单 + base64 解码字节估算 <= 20MB + 总长度合理。
 * 必须在 loadImage 前调用。
 */
function validateDataUrl(dataUrl) {
  validateDataUrlMime(dataUrl);
  const parsed = dataUrl.match(/^data:[^;]+;base64,(.+)$/s);
  if (!parsed) {
    throw new Error('data URL 不是 base64 编码。');
  }
  const base64 = parsed[1];
  // base64 每 4 字符编码 3 原始字节
  const estimatedBytes = Math.floor(base64.length * 3 / 4);
  if (estimatedBytes > MAX_REMOTE_IMAGE_BYTES) {
    throw new Error('图片文件过大（超过 20MB）。请使用更小的图片。');
  }
  // 总 dataUrl 长度合理性检查
  const maxTotalLength = base64.length + 64;
  if (dataUrl.length > maxTotalLength) {
    throw new Error('data URL 格式异常。');
  }
}

/**
 * 校验远端图片响应的 content-type / content-length 头。
 */
function validateRemoteResponse(response) {
  const contentType = response.headers.get('content-type');
  if (contentType) {
    const mime = contentType.split(';')[0].trim().toLowerCase();
    if (mime === 'image/svg+xml') {
      throw new Error('不支持 SVG 图片。请使用"框选截图并分析"截取图片区域。');
    }
    if (mime.startsWith('image/') && !ALLOWED_IMAGE_MIMES.has(mime)) {
      throw new Error(`不支持的图片类型（${mime}）。仅支持 PNG、JPEG、WebP。`);
    }
  }
  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_REMOTE_IMAGE_BYTES) {
    throw new Error('图片文件过大（超过 20MB）。请使用更小的图片。');
  }
}

/**
 * 校验下载后的 blob 大小和 MIME。
 */
function validateBlob(blob) {
  if (blob.size > MAX_REMOTE_IMAGE_BYTES) {
    throw new Error('图片文件过大（超过 20MB）。请使用更小的图片。');
  }
  if (blob.type) {
    const mime = blob.type.split(';')[0].trim().toLowerCase();
    if (mime === 'image/svg+xml') {
      throw new Error('不支持 SVG 图片。');
    }
    if (mime.startsWith('image/') && !ALLOWED_IMAGE_MIMES.has(mime)) {
      throw new Error(`不支持的图片类型（${mime}）。仅支持 PNG、JPEG、WebP。`);
    }
  }
}

/* ── Image preparation ────────────────────────────────── */

async function prepareImage(input) {
  if (input.type === 'error') {
    throw new Error(input.message || '输入无效。');
  }

  if (input.type === 'image_url') {
    setStatus('正在读取图片...');
    const url = new URL(input.srcUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('不支持的图片 URL 协议。');
    }
    const response = await fetch(input.srcUrl);
    if (!response.ok) {
      throw new Error('无法读取此图片，可能受防盗链、登录态或权限限制。请返回页面，使用"框选截图并分析"截取图片区域。');
    }
    validateRemoteResponse(response);
    const blob = await response.blob();
    validateBlob(blob);
    return blobToPreparedImage(blob);
  }

  if (input.type === 'data_url') {
    setStatus('正在解析图片...');
    validateDataUrl(input.dataUrl);
    return normalizeImageDataUrl(input.dataUrl);
  }

  if (input.type === 'screenshot_selection') {
    setStatus('正在裁剪截图...');
    return cropScreenshot(input.screenshotDataUrl, input.rect);
  }

  throw new Error(`不支持的输入类型：${input.type}`);
}

async function blobToPreparedImage(blob) {
  const dataUrl = await blobToDataUrl(blob);
  return normalizeImageDataUrl(dataUrl);
}

async function cropScreenshot(screenshotDataUrl, rect) {
  validateDataUrlMime(screenshotDataUrl);
  const image = await loadImage(screenshotDataUrl);
  const dpr = Number(rect.devicePixelRatio || 1);
  const sx = Math.max(0, Math.round(rect.x * dpr));
  const sy = Math.max(0, Math.round(rect.y * dpr));
  const sw = Math.min(image.naturalWidth - sx, Math.round(rect.width * dpr));
  const sh = Math.min(image.naturalHeight - sy, Math.round(rect.height * dpr));

  if (sw < 1 || sh < 1) {
    throw new Error('选区无效，请重新框选截图。');
  }

  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
  const croppedDataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  return normalizeImageDataUrl(croppedDataUrl);
}

/**
 * 归一化图片为 image/jpeg，确保 base64 <= MAX_BASE64_LENGTH。
 * 已是 JPEG 且在限制内则直接通过，否则迭代压缩（逐步降尺寸 + 降质量）。
 * 仍超限则抛错。
 */
async function normalizeImageDataUrl(dataUrl) {
  validateDataUrl(dataUrl);
  const image = await loadImage(dataUrl);
  const parsed = parseDataUrl(dataUrl);

  // 已是 JPEG 且满足尺寸和大小限制 — 直接通过
  if (parsed.mimeType === 'image/jpeg' &&
      parsed.base64.length <= MAX_BASE64_LENGTH &&
      Math.max(image.naturalWidth, image.naturalHeight) <= MAX_IMAGE_SIDE) {
    return {
      mimeType: 'image/jpeg',
      dataUrl,
      base64: parsed.base64
    };
  }

  setStatus('正在压缩图片...');

  let scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  let quality = JPEG_QUALITY;

  for (let attempt = 0; attempt < 6; attempt++) {
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    const resultDataUrl = canvas.toDataURL('image/jpeg', quality);
    const resultParsed = parseDataUrl(resultDataUrl);

    if (resultParsed.base64.length <= MAX_BASE64_LENGTH) {
      return {
        mimeType: 'image/jpeg',
        dataUrl: resultDataUrl,
        base64: resultParsed.base64
      };
    }

    // 缩小尺寸和质量，继续迭代
    scale *= 0.7;
    quality = Math.max(0.3, quality * 0.8);
  }

  throw new Error('图片压缩后仍然超过大小限制，请使用更小的图片或更小的选区。');
}

/* ── Low-level helpers ────────────────────────────────── */

function parseDataUrl(dataUrl) {
  const match = String(dataUrl).match(/^data:([^;]+);base64,(.*)$/);
  if (!match) {
    throw new Error('图片 data URL 格式无效。');
  }
  return {
    mimeType: match[1],
    base64: match[2]
  };
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('读取图片失败。'));
    reader.readAsDataURL(blob);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('图片加载失败。'));
    image.src = src;
  });
}

/* ── Config / API ─────────────────────────────────────── */

async function loadConfig() {
  const config = await chrome.storage.local.get({
    apiBaseUrl: '',
    apiKey: '',
    apiModel: ''
  });
  const apiBaseUrl = String(config.apiBaseUrl || '').trim();
  const apiKey = String(config.apiKey || '').trim();
  const apiModel = String(config.apiModel || '').trim();

  if (!apiBaseUrl || !apiKey || !apiModel) {
    throw new Error('请先打开设置页，填写 AI Base URL、API Key 和 Model。');
  }

  // 请求前再次校验 API Base URL 协议
  try {
    const url = new URL(apiBaseUrl);
    if (url.protocol !== 'https:' &&
        !(url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1'))) {
      throw new Error('AI Base URL 必须使用 https（本地开发可使用 http://localhost 或 http://127.0.0.1）。');
    }
  } catch (error) {
    if (error.message.includes('AI Base URL')) throw error;
    throw new Error('AI Base URL 格式无效。');
  }

  return { apiBaseUrl, apiKey, apiModel };
}

function buildChatCompletionsUrl(baseUrl) {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  if (/\/chat\/completions$/i.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed}/chat/completions`;
}

function buildReversePromptInstruction() {
  return [
    'You are a reverse prompt analyst for image generation.',
    'Analyze the provided image and infer a practical image-generation prompt that could recreate it.',
    'Return valid JSON only. Do not use markdown fences.',
    'Do not invent brands, named artists, exact camera models, exact locations, hidden objects, or unreadable text.',
    'If something is uncertain, use broader but visually useful wording.',
    'Use Simplified Chinese for prompt_zh.',
    'Use English for prompt_en, prompt_tags, negative_prompt, and json_prompt.',
    'Return exactly this JSON shape:',
    '{',
    '  "prompt_zh": "中文反向提示词，具体描述主体、构图、光线、风格、色彩和细节。",',
    '  "prompt_en": "English reverse prompt describing subject, composition, lighting, style, colors, and details.",',
    '  "prompt_tags": ["tag1", "tag2", "tag3", "tag4"],',
    '  "negative_prompt": "English negative prompt for artifacts, low quality, distortion, bad anatomy, wrong text, watermark.",',
    '  "json_prompt": {',
    '    "subject": "...",',
    '    "composition": "...",',
    '    "lighting": "...",',
    '    "style": "...",',
    '    "colors": ["..."],',
    '    "aspect_ratio": "..."',
    '  }',
    '}'
  ].join('\n');
}

async function callVisionApi(preparedImage) {
  const config = await loadConfig();
  const url = buildChatCompletionsUrl(config.apiBaseUrl);
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  // 所有图片统一为 image/jpeg
  const body = {
    model: config.apiModel,
    temperature: 0.2,
    max_tokens: 2500,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: buildReversePromptInstruction()
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${preparedImage.base64}`
            }
          }
        ]
      }
    ]
  };

  try {
    setStatus('正在调用 AI 模型...');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    const responseText = await response.text();
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('API 鉴权失败。请检查 API Key、模型权限或 Base URL。');
      }
      throw new Error(`API 请求失败（${response.status}）。请检查配置或稍后重试。`);
    }

    const responseJson = JSON.parse(responseText);
    const rawText = extractAssistantText(responseJson);
    const parsed = extractJSON(rawText);
    if (!parsed) {
      throw new Error(`模型没有返回可解析的 JSON。原始返回：\n${rawText}`);
    }
    return { parsed, rawText };
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw new Error('API 请求超时。请换更小的选区，或使用响应更快的模型。');
    }
    if (error.message && error.message.includes('Failed to fetch')) {
      throw new Error('无法连接到 AI API。请检查 Base URL 是否正确，以及是否已在设置中保存并授权网络权限。');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function extractAssistantText(responseJson) {
  const choices = responseJson && responseJson.choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new Error('API 响应中没有 choices。');
  }
  const content = choices[0] && choices[0].message && choices[0].message.content;
  if (typeof content === 'string') {
    return content.trim();
  }
  if (Array.isArray(content)) {
    return content.map(item => typeof item.text === 'string' ? item.text : '').join('\n').trim();
  }
  throw new Error('API 响应中没有可读取的 message.content。');
}

function extractJSON(text) {
  const source = String(text || '').trim();
  try {
    return JSON.parse(source);
  } catch {}

  const fenceMatch = source.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {}
  }

  const start = source.indexOf('{');
  const end = source.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(source.slice(start, end + 1));
    } catch {}
  }

  return null;
}

/* ── Schema validation ────────────────────────────────── */

/**
 * 校验模型返回的 JSON 是否包含所有必需字段且类型正确。
 * 缺字段或类型错误时抛出异常，阻止显示"分析完成"。
 */
function validateResultSchema(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('模型返回的 JSON 不是对象。');
  }
  if (typeof parsed.prompt_zh !== 'string' || !parsed.prompt_zh.trim()) {
    throw new Error('模型返回缺少 prompt_zh 字段或字段为空。');
  }
  if (typeof parsed.prompt_en !== 'string' || !parsed.prompt_en.trim()) {
    throw new Error('模型返回缺少 prompt_en 字段或字段为空。');
  }
  if (!Array.isArray(parsed.prompt_tags)) {
    throw new Error('模型返回缺少 prompt_tags 数组字段。');
  }
  if (typeof parsed.negative_prompt !== 'string') {
    throw new Error('模型返回缺少 negative_prompt 字段。');
  }
  if (!parsed.json_prompt || typeof parsed.json_prompt !== 'object') {
    throw new Error('模型返回缺少 json_prompt 对象字段。');
  }
}

/* ── Main ─────────────────────────────────────────────── */

async function main() {
  setupCopyButtons();
  const input = await loadPendingInput();

  // 如果有 jobId，从 IndexedDB 加载大 payload 并删除
  if (input.jobId) {
    const payload = await loadJobPayload(input.jobId);
    if (payload) {
      if (payload.screenshotDataUrl) input.screenshotDataUrl = payload.screenshotDataUrl;
      if (payload.dataUrl) input.dataUrl = payload.dataUrl;
    }
  }

  const prepared = await prepareImage(input);
  elements.previewImage.src = prepared.dataUrl;
  const { parsed, rawText } = await callVisionApi(prepared);
  validateResultSchema(parsed);
  renderResult(parsed, rawText);
}

main().catch(renderError);
