const PENDING_INPUT_KEY = 'pendingInput';
const MAX_BASE64_LENGTH = 4 * 1024 * 1024;
const MAX_IMAGE_SIDE = 2048;
const JPEG_QUALITY = 0.85;
const API_TIMEOUT_MS = 120000;
const MAX_REMOTE_IMAGE_BYTES = 20 * 1024 * 1024;
const ALLOWED_IMAGE_MIMES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

// IndexedDB 常量（与 background.js 一致）
const DB_NAME = 'promptlens';
const DB_VERSION = 2;
const STORE_NAME = 'pending-payloads';

let maxImageSide = 2048;
let jpegQuality = 0.85;

/* ── IndexedDB helpers ────────────────────────────────── */

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains('history-items')) {
        db.createObjectStore('history-items', { keyPath: 'id' });
      }
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

const resultStatus = document.getElementById('result-status');
const loadingPanel = document.getElementById('loading-panel');
const loadingText = document.getElementById('loading-text');
const stepRead = document.getElementById('step-read');
const stepImage = document.getElementById('step-image');
const stepApi = document.getElementById('step-api');
const errorPanel = document.getElementById('error-panel');
const errorTitleText = document.getElementById('error-title-text');
const errorMessage = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');
const resultContent = document.getElementById('result-content');

const elements = {
  previewImage: document.getElementById('preview-image'),
  promptZh: document.getElementById('prompt-zh'),
  promptEn: document.getElementById('prompt-en'),
  promptVariantsCard: document.getElementById('prompt-variants-card'),
  promptVariantsList: document.getElementById('prompt-variants-list'),
  marketingDiagnosisCard: document.getElementById('marketing-diagnosis-card'),
  marketingDiagnosisSections: document.getElementById('marketing-diagnosis-sections'),
  promptTags: document.getElementById('prompt-tags'),
  negativePrompt: document.getElementById('negative-prompt'),
  jsonPrompt: document.getElementById('json-prompt'),
  rawJson: document.getElementById('raw-json'),
  templateName: document.getElementById('template-name'),
  templateDescription: document.getElementById('template-description'),
  copyAll: document.getElementById('copy-all'),
  downloadJson: document.getElementById('download-json'),
  downloadMarkdown: document.getElementById('download-markdown'),
  usageCard: document.getElementById('usage-card'),
  usagePrompt: document.getElementById('usage-prompt'),
  usageCompletion: document.getElementById('usage-completion'),
  usageTotal: document.getElementById('usage-total'),
  usageTime: document.getElementById('usage-time'),
  marketingContextCard: document.getElementById('marketing-context-card'),
  marketingContextInput: document.getElementById('marketing-context-input'),
  marketingContextStart: document.getElementById('marketing-context-start'),
  marketingContextSkip: document.getElementById('marketing-context-skip'),
  nextStepTitle: document.getElementById('next-step-title'),
  nextStepDescription: document.getElementById('next-step-description'),
  nextStepList: document.getElementById('next-step-list')
};

/* ── Step SVG icons ───────────────────────────────────── */

const STEP_ICONS = {
  pending: '<svg class="progress-step-icon" viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="10" r="3" opacity="0.3"/></svg>',
  active: '<svg class="progress-step-icon" viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="10" r="3"/></svg>',
  done: '<svg class="progress-step-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>'
};

/* ── Progress / state helpers ─────────────────────────── */

function setStepState(stepEl, state) {
  stepEl.className = `progress-step progress-step--${state}`;
  const icon = stepEl.querySelector('.progress-step-icon');
  if (icon) {
    icon.outerHTML = STEP_ICONS[state] || STEP_ICONS.pending;
  }
}

function setLoading(text, activeStep) {
  loadingPanel.hidden = false;
  errorPanel.hidden = true;
  resultContent.hidden = true;
  hideMarketingContextCard();
  loadingText.textContent = text;
  if (resultStatus) {
    resultStatus.textContent = text;
    resultStatus.dataset.tone = 'neutral';
  }

  const steps = [stepRead, stepImage, stepApi];
  const activeIdx = steps.indexOf(activeStep);

  steps.forEach((step, i) => {
    if (i < activeIdx) {
      setStepState(step, 'done');
    } else if (i === activeIdx) {
      setStepState(step, 'active');
    } else {
      setStepState(step, 'pending');
    }
  });
}

function showError(title, message) {
  loadingPanel.hidden = true;
  errorPanel.hidden = false;
  resultContent.hidden = true;
  hideMarketingContextCard();
  if (resultStatus) {
    resultStatus.textContent = title;
    resultStatus.dataset.tone = 'error';
  }
  errorTitleText.textContent = title;
  errorMessage.textContent = message;
}

function showMarketingContextCard() {
  loadingPanel.hidden = true;
  errorPanel.hidden = true;
  resultContent.hidden = true;
  elements.marketingContextCard.hidden = false;
  if (resultStatus) {
    resultStatus.textContent = '可选填写业务背景。';
    resultStatus.dataset.tone = 'neutral';
  }
}

function hideMarketingContextCard() {
  elements.marketingContextCard.hidden = true;
}

function showResult() {
  loadingPanel.hidden = true;
  errorPanel.hidden = true;
  resultContent.hidden = false;
  hideMarketingContextCard();
  if (resultStatus) {
    resultStatus.textContent = '分析完成。';
    resultStatus.dataset.tone = 'success';
  }
}

function setStatus(message, tone = 'neutral') {
  // 兼容旧调用，同时更新页面标题下方状态
  if (resultStatus) {
    resultStatus.textContent = message;
    resultStatus.dataset.tone = tone;
  }
  loadingText.textContent = message;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value || '';
  }
}

let currentResult = null;
let currentRawText = '';
let currentTemplate = null;
let currentUsage = null;
let currentResponseTimeMs = null;
let currentBusinessContext = null;

function renderUsage(usage, responseTimeMs) {
  if (!usage && !responseTimeMs) {
    elements.usageCard.hidden = true;
    return;
  }
  elements.usageCard.hidden = false;
  elements.usagePrompt.textContent = usage && Number.isFinite(Number(usage.prompt_tokens)) ? String(usage.prompt_tokens) : '-';
  elements.usageCompletion.textContent = usage && Number.isFinite(Number(usage.completion_tokens)) ? String(usage.completion_tokens) : '-';
  elements.usageTotal.textContent = usage && Number.isFinite(Number(usage.total_tokens)) ? String(usage.total_tokens) : '-';
  elements.usageTime.textContent = responseTimeMs ? `${Math.round(responseTimeMs)} ms` : '-';
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text || '';
  return element;
}

async function copyTextWithFeedback(button, text) {
  const oldText = button.textContent;
  try {
    await navigator.clipboard.writeText(text || '');
    button.textContent = '已复制';
  } catch {
    button.textContent = '复制失败';
  }
  window.setTimeout(() => {
    button.textContent = oldText;
  }, 1200);
}

function renderPromptVariants(result) {
  const variants = window.PromptVariants.normalizePromptVariants(result);
  elements.promptVariantsList.replaceChildren();

  const visibleVariants = variants.filter(variant => variant && variant.isComplete);
  if (!visibleVariants.length) {
    elements.promptVariantsCard.hidden = true;
    return variants;
  }

  visibleVariants.forEach(variant => {
    const card = document.createElement('section');
    card.className = `prompt-variant prompt-variant--${variant.id}`;

    const header = document.createElement('div');
    header.className = 'prompt-variant-header';

    const titleBox = document.createElement('div');
    titleBox.append(
      createTextElement('h3', '', variant.title),
      createTextElement('p', 'prompt-variant-intent', variant.prompt_zh_summary || variant.intent)
    );

    const actions = document.createElement('div');
    actions.className = 'button-row';

    const copyPromptButton = document.createElement('button');
    copyPromptButton.type = 'button';
    copyPromptButton.className = 'copy-button';
    copyPromptButton.textContent = '复制提示词';
    copyPromptButton.addEventListener('click', () => copyTextWithFeedback(copyPromptButton, variant.prompt_en));

    const copyCardButton = document.createElement('button');
    copyCardButton.type = 'button';
    copyCardButton.className = 'copy-button';
    copyCardButton.textContent = '复制卡片';
    copyCardButton.addEventListener('click', () => {
      copyTextWithFeedback(copyCardButton, window.PromptVariants.formatPromptVariantCard(variant));
    });

    actions.append(copyPromptButton, copyCardButton);
    header.append(titleBox, actions);

    const prompt = createTextElement('pre', 'prompt-variant-prompt', variant.prompt_en);

    const meta = document.createElement('dl');
    meta.className = 'prompt-variant-meta';

    const metaRows = [
      ['标签', variant.tags.join(', ')],
      ['反向提示词', variant.negative_prompt],
      ['适用场景', variant.use_cases.join(', ')]
    ];

    metaRows.forEach(([labelText, valueText]) => {
      if (!valueText) return;
      const row = document.createElement('div');
      row.append(createTextElement('dt', '', labelText), createTextElement('dd', '', valueText));
      meta.appendChild(row);
    });

    card.append(header, prompt, meta);
    elements.promptVariantsList.appendChild(card);
  });

  elements.promptVariantsCard.hidden = false;
  return variants;
}

function getMarketingReadinessScore(result) {
  const score = result &&
    result.marketing_diagnosis &&
    result.marketing_diagnosis.marketing_diagnosis &&
    result.marketing_diagnosis.marketing_diagnosis.marketing_readiness_score;
  const overall = Number(score && score.overall);
  return Number.isFinite(overall) && overall >= 1 && overall <= 5 ? overall : null;
}

function renderMarketingDiagnosis(result, template) {
  const isMarketingTemplate = window.PromptTemplates.isMarketingDiagnosisTemplate(template);
  if (!isMarketingTemplate || !window.PromptMarketingDiagnosis.hasMarketingDiagnosis(result)) {
    elements.marketingDiagnosisCard.hidden = true;
    elements.marketingDiagnosisSections.replaceChildren();
    return;
  }

  const sections = window.PromptMarketingDiagnosis.getMarketingDiagnosisSections(result);
  const readinessScore = getMarketingReadinessScore(result);
  elements.marketingDiagnosisSections.replaceChildren();

  sections.forEach((section, index) => {
    const card = document.createElement('section');
    card.className = 'marketing-diagnosis-section';
    card.dataset.section = section.kicker;

    const header = document.createElement('div');
    header.className = 'marketing-diagnosis-section-head';
    const titleBox = document.createElement('div');
    titleBox.append(
      createTextElement('span', 'card-kicker', section.kicker),
      createTextElement('h3', '', section.title)
    );
    header.appendChild(titleBox);

    if (index === 0 && readinessScore) {
      const scoreRing = createTextElement('div', 'marketing-diagnosis-score-ring', readinessScore.toFixed(1));
      scoreRing.setAttribute('aria-label', `营销准备度评分 ${readinessScore.toFixed(1)} / 5`);
      header.appendChild(scoreRing);
    }

    card.appendChild(header);

    const list = document.createElement('dl');
    section.items.forEach(item => {
      if (!item.value) return;
      const row = document.createElement('div');
      row.appendChild(createTextElement('dt', '', item.label));
      const value = createTextElement(
        'dd',
        item.label === '快速判断' ? 'marketing-diagnosis-quick-judgement' : '',
        item.value
      );
      row.appendChild(value);
      list.appendChild(row);
    });
    card.appendChild(list);
    elements.marketingDiagnosisSections.appendChild(card);
  });

  elements.marketingDiagnosisCard.hidden = false;
}

function getVisiblePromptText(value) {
  if (currentTemplate && window.PromptTemplates.isMarketingDiagnosisTemplate(currentTemplate.id)) {
    return window.PromptMarketingDiagnosis.normalizeSafeMarketingText(value);
  }
  return value || '';
}

function renderResult(result, rawText, template) {
  currentResult = result;
  currentRawText = rawText || JSON.stringify(result, null, 2);
  currentTemplate = template || currentTemplate;

  if (currentTemplate) {
    elements.templateName.textContent = currentTemplate.name;
    elements.templateDescription.textContent = currentTemplate.description;
    renderNextStepHint(currentTemplate);
  }

  renderMarketingDiagnosis(result, currentTemplate);
  setText('prompt-zh', getVisiblePromptText(result.prompt_zh || ''));
  setText('prompt-en', getVisiblePromptText(result.prompt_en || ''));
  renderPromptVariants(result);
  setText('prompt-tags', Array.isArray(result.prompt_tags) ? result.prompt_tags.join(', ') : '');
  setText('negative-prompt', result.negative_prompt || '');
  setText('json-prompt', JSON.stringify(result.json_prompt || {}, null, 2));
  setText('raw-json', currentRawText);
  renderUsage(currentUsage, currentResponseTimeMs);
  showResult();
}

function renderError(error) {
  const message = error instanceof Error ? error.message : String(error);
  showError('分析失败', message);
}

function renderNextStepHint(template) {
  if (!elements.nextStepTitle || !elements.nextStepDescription || !elements.nextStepList) return;
  const isMarketing = template && window.PromptTemplates.isMarketingDiagnosisTemplate(template.id);
  const content = isMarketing ? {
    title: '把诊断变成团队 Brief',
    description: '这份结果适合发给老板、设计师、投放同事或客户，用来决定下一轮低成本改图方向。',
    steps: ['下载 Markdown Brief 作为沟通材料。', '复制低成本改图建议进入下一轮素材调整。', '如果业务背景不完整，返回上一页重新分析并补充更多上下文。']
  } : {
    title: '把图片变成可复用 Prompt',
    description: '这份结果适合复制到 Midjourney、即梦、可灵、Stable Diffusion、Flux 或其他图像生成工具继续试跑。',
    steps: ['优先复制英文 Prompt。', '复制 Tags 做风格参考。', '使用 Recreate 或 Creative variants 做复刻和扩写。']
  };
  elements.nextStepTitle.textContent = content.title;
  elements.nextStepDescription.textContent = content.description;
  elements.nextStepList.replaceChildren();
  content.steps.forEach(step => {
    const item = document.createElement('li');
    item.textContent = step;
    elements.nextStepList.appendChild(item);
  });
}

/* ── Copy buttons ─────────────────────────────────────── */

function setupCopyButtons() {
  document.querySelectorAll('[data-copy-target]').forEach(button => {
    button.addEventListener('click', async event => {
      event.preventDefault();
      event.stopPropagation();

      const targetId = button.getAttribute('data-copy-target');
      const target = document.getElementById(targetId);
      const text = target ? target.textContent : '';
      await copyTextWithFeedback(button, text || '');
    });
  });
}

/* ── Export helpers ────────────────────────────────────── */

function buildExportData() {
  if (!currentResult) {
    throw new Error('当前没有可导出的结果。');
  }
  return {
    app: 'PromptLens',
    exportedAt: new Date().toISOString(),
    template: currentTemplate ? {
      id: currentTemplate.id,
      name: currentTemplate.name,
      description: currentTemplate.description
    } : null,
    result: currentResult
  };
}

function buildMarkdownExport() {
  const data = buildExportData();
  const result = data.result;
  if (data.template && window.PromptTemplates.isMarketingDiagnosisTemplate(data.template.id)) {
    return window.PromptMarketingDiagnosis.buildMarketingDiagnosisMarkdown(result, {
      app: data.app,
      exportedAt: data.exportedAt,
      templateName: data.template.name,
      businessContext: currentBusinessContext || ''
    });
  }
  const tags = Array.isArray(result.prompt_tags) ? result.prompt_tags.join(', ') : '';
  const variants = window.PromptVariants.normalizePromptVariants(result);
  const variantsMarkdown = window.PromptVariants.formatPromptVariantsMarkdown(variants);
  const sections = [
    '# 图片提示词分析结果',
    '',
    `- 应用：${data.app}`,
    `- 导出时间：${data.exportedAt}`,
    `- 模板：${data.template ? data.template.name : '未知'}`,
    '',
    '## 英文提示词',
    '',
    result.prompt_en || '',
    '',
    '## 中文提示词',
    '',
    result.prompt_zh || '',
    '',
    '## 标签',
    '',
    tags,
    '',
    '## 反向提示词',
    '',
    result.negative_prompt || '',
    '',
    '## 结构化提示词',
    '',
    '```json',
    JSON.stringify(result.json_prompt || {}, null, 2),
    '```',
    ''
  ];
  if (variantsMarkdown) {
    sections.push(variantsMarkdown, '');
  }
  return sections.join('\n');
}

function buildCopyAllText() {
  const result = buildExportData().result;
  if (currentTemplate && window.PromptTemplates.isMarketingDiagnosisTemplate(currentTemplate.id)) {
    return window.PromptMarketingDiagnosis.buildMarketingDiagnosisCopyText(result);
  }
  const tags = Array.isArray(result.prompt_tags) ? result.prompt_tags.join(', ') : '';
  const variants = window.PromptVariants.normalizePromptVariants(result);
  const variantsMarkdown = window.PromptVariants.formatPromptVariantsMarkdown(variants);
  const sections = [
    '英文提示词',
    result.prompt_en || '',
    '',
    '中文提示词',
    result.prompt_zh || '',
    '',
    '标签',
    tags,
    '',
    '反向提示词',
    result.negative_prompt || '',
    '',
    '结构化提示词',
    JSON.stringify(result.json_prompt || {}, null, 2)
  ];
  if (variantsMarkdown) {
    sections.push('', variantsMarkdown);
  }
  return sections.join('\n');
}

function makeExportFilename(extension) {
  const stamp = new Date().toISOString().slice(0, 16).replace(/:/g, '-');
  return `promptlens-${stamp}.${extension}`;
}

function downloadText(filename, text, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function withButtonFeedback(button, action) {
  const oldText = button.textContent;
  try {
    await action();
    button.textContent = '已完成';
  } catch {
    button.textContent = '失败';
  }
  window.setTimeout(() => {
    button.textContent = oldText;
  }, 1200);
}

function setupExportButtons() {
  elements.copyAll.addEventListener('click', () => {
    withButtonFeedback(elements.copyAll, () => navigator.clipboard.writeText(buildCopyAllText()));
  });

  elements.downloadJson.addEventListener('click', () => {
    withButtonFeedback(elements.downloadJson, () => {
      downloadText(makeExportFilename('json'), JSON.stringify(buildExportData(), null, 2), 'application/json;charset=utf-8');
    });
  });

  elements.downloadMarkdown.addEventListener('click', () => {
    withButtonFeedback(elements.downloadMarkdown, () => {
      downloadText(makeExportFilename('md'), buildMarkdownExport(), 'text/markdown;charset=utf-8');
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

function validateDataUrl(dataUrl) {
  validateDataUrlMime(dataUrl);
  const parsed = dataUrl.match(/^data:[^;]+;base64,(.+)$/s);
  if (!parsed) {
    throw new Error('data URL 不是 base64 编码。');
  }
  const base64 = parsed[1];
  const estimatedBytes = Math.floor(base64.length * 3 / 4);
  if (estimatedBytes > MAX_REMOTE_IMAGE_BYTES) {
    throw new Error('图片文件过大（超过 20MB）。请使用更小的图片。');
  }
  const maxTotalLength = base64.length + 64;
  if (dataUrl.length > maxTotalLength) {
    throw new Error('data URL 格式异常。');
  }
}

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
    setLoading('正在读取图片...', stepImage);
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
    setLoading('正在解析图片...', stepImage);
    validateDataUrl(input.dataUrl);
    return normalizeImageDataUrl(input.dataUrl);
  }

  if (input.type === 'screenshot_selection') {
    setLoading('正在裁剪截图...', stepImage);
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
  const croppedDataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
  return normalizeImageDataUrl(croppedDataUrl);
}

async function normalizeImageDataUrl(dataUrl) {
  validateDataUrl(dataUrl);
  const image = await loadImage(dataUrl);
  const parsed = parseDataUrl(dataUrl);

  if (parsed.mimeType === 'image/jpeg' &&
      parsed.base64.length <= MAX_BASE64_LENGTH &&
      Math.max(image.naturalWidth, image.naturalHeight) <= maxImageSide) {
    return {
      mimeType: 'image/jpeg',
      dataUrl,
      base64: parsed.base64
    };
  }

  setLoading('正在压缩图片...', stepImage);

  let scale = Math.min(1, maxImageSide / Math.max(image.naturalWidth, image.naturalHeight));
  let quality = jpegQuality;

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

function buildReversePromptInstruction(template, businessContext = '') {
  return window.PromptTemplates.buildFinalPrompt(template, { businessContext });
}

async function callVisionApi(preparedImage, template) {
  const config = await loadConfig();
  const url = buildChatCompletionsUrl(config.apiBaseUrl);
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  const body = {
    model: config.apiModel,
    temperature: 0.2,
    max_tokens: 3500,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: buildReversePromptInstruction(template, currentBusinessContext)
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
    setLoading('正在调用 AI 模型分析图片...', stepApi);
    const startedAt = performance.now();
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
    return { parsed, rawText, usage: responseJson.usage || null, responseTimeMs: performance.now() - startedAt };
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw new Error('API 请求超时（2 分钟）。请换更小的选区，或使用响应更快的模型。');
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
  if (currentTemplate && window.PromptTemplates.isMarketingDiagnosisTemplate(currentTemplate)) {
    window.PromptMarketingDiagnosis.validateMarketingDiagnosisResult(parsed);
  }
}

/* ── Main ─────────────────────────────────────────────── */

let currentInput = null;

async function loadRuntimeSettings() {
  const stored = await chrome.storage.local.get({ maxImageSide: 2048, jpegQuality: 0.85 });
  maxImageSide = Math.min(4096, Math.max(512, Number(stored.maxImageSide) || 2048));
  jpegQuality = Math.min(0.95, Math.max(0.4, Number(stored.jpegQuality) || 0.85));
}

function safeHttpUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

async function maybeSaveHistory(input, result, template) {
  if (!window.PromptHistory || !await window.PromptHistory.isHistoryEnabled()) return;
  const imageUrl = input.type === 'image_url' ? safeHttpUrl(input.srcUrl) : '';
  const pageUrl = safeHttpUrl(input.pageUrl);
  const sourceDomain = window.PromptHistory.sourceDomainFromUrl(pageUrl || imageUrl || input.pageUrl || input.srcUrl || '');
  await window.PromptHistory.addHistoryItem({
    sourceDomain,
    imageUrl,
    pageUrl,
    inputType: input.type,
    templateId: template.id,
    templateName: template.name,
    promptEn: result.prompt_en || '',
    promptZh: result.prompt_zh || '',
    promptTags: Array.isArray(result.prompt_tags) ? result.prompt_tags : [],
    negativePrompt: result.negative_prompt || '',
    jsonPrompt: result.json_prompt || {},
    rawText: currentRawText,
    usage: currentUsage,
    responseTimeMs: currentResponseTimeMs,
    result
  });
}

function waitForMarketingContext() {
  if (currentBusinessContext !== null) {
    return Promise.resolve(currentBusinessContext);
  }
  return new Promise(resolve => {
    showMarketingContextCard();
    elements.marketingContextInput.focus();

    const cleanup = () => {
      elements.marketingContextStart.removeEventListener('click', onStart);
      elements.marketingContextSkip.removeEventListener('click', onSkip);
    };
    const onStart = () => {
      cleanup();
      const value = String(elements.marketingContextInput.value || '').trim().slice(0, 1200);
      elements.marketingContextInput.value = '';
      resolve(value);
    };
    const onSkip = () => {
      cleanup();
      elements.marketingContextInput.value = '';
      resolve('');
    };

    elements.marketingContextStart.addEventListener('click', onStart);
    elements.marketingContextSkip.addEventListener('click', onSkip);
  });
}

async function analyzeInput(input) {
  const prepared = await prepareImage(input);
  elements.previewImage.src = prepared.dataUrl;

  const template = await window.PromptTemplates.getActiveTemplate();
  currentTemplate = template;
  elements.templateName.textContent = template.name;
  elements.templateDescription.textContent = template.description;

  if (window.PromptTemplates.isMarketingDiagnosisTemplate(template)) {
    currentBusinessContext = await waitForMarketingContext();
  } else {
    currentBusinessContext = '';
  }

  const { parsed, rawText, usage, responseTimeMs } = await callVisionApi(prepared, template);
  currentUsage = usage;
  currentResponseTimeMs = responseTimeMs;
  validateResultSchema(parsed);
  await maybeSaveHistory(input, parsed, template);
  renderResult(parsed, rawText, template);
}

async function main() {
  setupCopyButtons();
  setupExportButtons();
  setLoading('正在读取待分析输入...', stepRead);

  const input = await loadPendingInput();
  await loadRuntimeSettings();

  if (input.jobId) {
    const payload = await loadJobPayload(input.jobId);
    if (payload) {
      if (payload.screenshotDataUrl) input.screenshotDataUrl = payload.screenshotDataUrl;
      if (payload.dataUrl) input.dataUrl = payload.dataUrl;
    }
  }

  currentInput = { ...input };
  await analyzeInput(currentInput);
}

retryBtn.addEventListener('click', () => {
  if (!currentInput) {
    showError('无法重试', '没有可重试的输入。请回到网页右键图片或框选截图。');
    return;
  }
  currentBusinessContext = null;
  analyzeInput({ ...currentInput }).catch(renderError);
});

main().catch(renderError);
