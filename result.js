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
const t = (key, params) => window.PromptLensI18n.t(key, params);
const localizedError = (key, params = {}) => window.PromptLensI18n.createError(key, params);

let maxImageSide = 2048;
let jpegQuality = 0.85;

function localizedErrorMessage(error) {
  if (error && error.i18nKey) return t(error.i18nKey, error.i18nParams || {});
  return error instanceof Error ? error.message : String(error);
}

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
  marketingContextExample: document.getElementById('marketing-context-example'),
  marketingContextStart: document.getElementById('marketing-context-start'),
  marketingContextSkip: document.getElementById('marketing-context-skip'),
  nextStepTitle: document.getElementById('next-step-title'),
  nextStepDescription: document.getElementById('next-step-description'),
  nextStepList: document.getElementById('next-step-list'),
  chatgptAssistCard: document.getElementById('chatgpt-assist-card'),
  chatgptSend: document.getElementById('chatgpt-send'),
  chatgptDownloadImage: document.getElementById('chatgpt-download-image'),
  chatgptCopyInstruction: document.getElementById('chatgpt-copy-instruction'),
  chatgptOpen: document.getElementById('chatgpt-open'),
  chatgptCopyOpen: document.getElementById('chatgpt-copy-open'),
  chatgptInstructionOutput: document.getElementById('chatgpt-instruction-output'),
  chatgptAssistStatus: document.getElementById('chatgpt-assist-status')
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
  if (elements.chatgptAssistCard) elements.chatgptAssistCard.hidden = true;
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
  if (elements.chatgptAssistCard) elements.chatgptAssistCard.hidden = true;
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
    resultStatus.textContent = t('resultStatusOptionalBusiness');
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
  if (elements.chatgptAssistCard) elements.chatgptAssistCard.hidden = true;
  hideMarketingContextCard();
  if (resultStatus) {
    resultStatus.textContent = t('resultStatusComplete');
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
let currentAssistImage = null;
let currentAssistInstruction = '';
let currentError = null;
let currentLoadingState = null;
let currentAssistStatus = null;

function setLocalizedLoading(key, activeStep, params = {}) {
  currentLoadingState = { key, activeStep, params };
  setLoading(t(key, params), activeStep);
}

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
    button.textContent = t('commonCopied');
    window.setTimeout(() => {
      button.textContent = oldText;
    }, 1200);
    return true;
  } catch {
    button.textContent = t('commonCopyFailed');
    window.setTimeout(() => {
      button.textContent = oldText;
    }, 1200);
    return false;
  }
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
    const variantExplanation = window.PromptLensI18n.getLanguage() === 'en'
      ? variant.intent || variant.prompt_zh_summary
      : variant.prompt_zh_summary || variant.intent;
    titleBox.append(
      createTextElement('h3', '', variant.title),
      createTextElement('p', 'prompt-variant-intent', variantExplanation)
    );

    const actions = document.createElement('div');
    actions.className = 'button-row';

    const copyPromptButton = document.createElement('button');
    copyPromptButton.type = 'button';
    copyPromptButton.className = 'copy-button';
    copyPromptButton.textContent = t('copyPrompt');
    copyPromptButton.addEventListener('click', () => copyTextWithFeedback(copyPromptButton, variant.prompt_en));

    const copyCardButton = document.createElement('button');
    copyCardButton.type = 'button';
    copyCardButton.className = 'copy-button';
    copyCardButton.textContent = t('copyCard');
    copyCardButton.addEventListener('click', () => {
      copyTextWithFeedback(copyCardButton, window.PromptVariants.formatPromptVariantCard(variant));
    });

    actions.append(copyPromptButton, copyCardButton);
    header.append(titleBox, actions);

    const prompt = createTextElement('pre', 'prompt-variant-prompt', variant.prompt_en);

    const meta = document.createElement('dl');
    meta.className = 'prompt-variant-meta';

    const metaRows = [
      [t('fieldTags'), variant.tags.join(', ')],
      [t('fieldNegativePrompt'), variant.negative_prompt],
      [t('variantUseCases'), variant.use_cases.join(', ')]
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
      scoreRing.setAttribute('aria-label', t('marketingScoreAria', { score: readinessScore.toFixed(1) }));
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
        item.label === t('marketingQuickJudgement') ? 'marketing-diagnosis-quick-judgement' : '',
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
  currentError = error;
  showError(t('errorAnalysisFailed'), localizedErrorMessage(error));
}

function renderNextStepHint(template) {
  if (!elements.nextStepTitle || !elements.nextStepDescription || !elements.nextStepList) return;
  const isMarketing = template && window.PromptTemplates.isMarketingDiagnosisTemplate(template.id);
  const content = isMarketing ? {
    title: t('resultNextStepMarketingTitle'),
    description: t('resultNextStepMarketingDescription'),
    steps: [t('resultNextStepMarketing1'), t('resultNextStepMarketing2'), t('resultNextStepMarketing3')]
  } : {
    title: t('resultNextStepPromptTitle'),
    description: t('resultNextStepPromptDescription'),
    steps: [t('resultNextStepPrompt1'), t('resultNextStepPrompt2'), t('resultNextStepPrompt3')]
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
    throw localizedError('errorNoExportResult');
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
  return window.PromptResultFormat.buildMarkdown(data, { businessContext: currentBusinessContext || '' });
}

function buildCopyAllText() {
  return window.PromptResultFormat.buildCopyText(buildExportData());
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
    button.textContent = t('commonCompleted');
  } catch {
    button.textContent = t('commonFailed');
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
    throw localizedError('errorNoPendingInput');
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
    throw localizedError('errorInvalidDataUrl');
  }
  const match = dataUrl.match(/^data:([^;]+);/);
  if (!match) {
    throw localizedError('errorCannotParseMime');
  }
  const mime = match[1].toLowerCase();
  if (mime === 'image/svg+xml') {
    throw localizedError('errorSvgUnsupportedSelection');
  }
  if (!ALLOWED_IMAGE_MIMES.has(mime)) {
    throw localizedError('errorUnsupportedImageType', { type: mime });
  }
}

function validateDataUrl(dataUrl) {
  validateDataUrlMime(dataUrl);
  const parsed = dataUrl.match(/^data:[^;]+;base64,(.+)$/s);
  if (!parsed) {
    throw localizedError('errorDataUrlNotBase64');
  }
  const base64 = parsed[1];
  const estimatedBytes = Math.floor(base64.length * 3 / 4);
  if (estimatedBytes > MAX_REMOTE_IMAGE_BYTES) {
    throw localizedError('errorImageTooLarge');
  }
  const maxTotalLength = base64.length + 64;
  if (dataUrl.length > maxTotalLength) {
    throw localizedError('errorDataUrlMalformed');
  }
}

function validateRemoteResponse(response) {
  const contentType = response.headers.get('content-type');
  if (contentType) {
    const mime = contentType.split(';')[0].trim().toLowerCase();
    if (mime === 'image/svg+xml') {
      throw localizedError('errorSvgUnsupportedSelection');
    }
    if (mime.startsWith('image/') && !ALLOWED_IMAGE_MIMES.has(mime)) {
      throw localizedError('errorUnsupportedImageType', { type: mime });
    }
  }
  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_REMOTE_IMAGE_BYTES) {
    throw localizedError('errorImageTooLarge');
  }
}

function validateBlob(blob) {
  if (blob.size > MAX_REMOTE_IMAGE_BYTES) {
    throw localizedError('errorImageTooLarge');
  }
  if (blob.type) {
    const mime = blob.type.split(';')[0].trim().toLowerCase();
    if (mime === 'image/svg+xml') {
      throw localizedError('errorSvgUnsupportedSelection');
    }
    if (mime.startsWith('image/') && !ALLOWED_IMAGE_MIMES.has(mime)) {
      throw localizedError('errorUnsupportedImageType', { type: mime });
    }
  }
}

/* ── Image preparation ────────────────────────────────── */

async function prepareImage(input) {
  if (input.type === 'error') {
    if (input.messageKey) throw localizedError(input.messageKey, input.messageParams || {});
    throw new Error(input.message || t('errorOperationFailed'));
  }

  if (input.type === 'image_url') {
    setLocalizedLoading('resultLoadingReadImage', stepImage);
    const url = new URL(input.srcUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw localizedError('errorRemoteImageProtocol');
    }
    const response = await fetch(input.srcUrl);
    if (!response.ok) {
      throw localizedError('errorRemoteImageRead');
    }
    validateRemoteResponse(response);
    const blob = await response.blob();
    validateBlob(blob);
    return blobToPreparedImage(blob);
  }

  if (input.type === 'data_url') {
    setLocalizedLoading('resultLoadingParseImage', stepImage);
    validateDataUrl(input.dataUrl);
    return normalizeImageDataUrl(input.dataUrl);
  }

  if (input.type === 'screenshot_selection') {
    setLocalizedLoading('resultLoadingCropScreenshot', stepImage);
    return cropScreenshot(input.screenshotDataUrl, input.rect);
  }

  throw localizedError('errorUnsupportedInputType', { type: input.type });
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
    throw localizedError('errorInvalidSelection');
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

  setLocalizedLoading('resultLoadingCompressImage', stepImage);

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

  throw localizedError('errorCompressedImageTooLarge');
}

/* ── Low-level helpers ────────────────────────────────── */

function parseDataUrl(dataUrl) {
  const match = String(dataUrl).match(/^data:([^;]+);base64,(.*)$/);
  if (!match) {
    throw localizedError('errorInvalidImageDataUrl');
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
    reader.onerror = () => reject(localizedError('errorReadImage'));
    reader.readAsDataURL(blob);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(localizedError('errorLoadImage'));
    image.src = src;
  });
}

/* ── Config / API ─────────────────────────────────────── */

async function loadConfig() {
  const config = await chrome.storage.local.get({
    apiBaseUrl: '',
    apiKey: '',
    apiModel: '',
    analysisMode: 'api'
  });
  const analysisMode = config.analysisMode === 'chatgpt_assist' ? 'chatgpt_assist' : 'api';
  const apiBaseUrl = String(config.apiBaseUrl || '').trim();
  const apiKey = String(config.apiKey || '').trim();
  const apiModel = String(config.apiModel || '').trim();

  if (analysisMode === 'chatgpt_assist') {
    return { analysisMode, apiBaseUrl, apiKey, apiModel };
  }

  if (!apiBaseUrl || !apiKey || !apiModel) {
    throw localizedError('errorApiConfigMissing');
  }

  try {
    const url = new URL(apiBaseUrl);
    if (url.protocol !== 'https:' &&
        !(url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1'))) {
      throw localizedError('errorApiHttpsRequired');
    }
  } catch (error) {
    if (error && error.i18nKey === 'errorApiHttpsRequired') throw error;
    throw localizedError('errorApiUrlInvalid');
  }

  return { analysisMode, apiBaseUrl, apiKey, apiModel };
}

function buildChatCompletionsUrl(baseUrl) {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  if (/\/chat\/completions$/i.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed}/chat/completions`;
}

/* ── ChatGPT Assist instruction builder ──────────────── */

function isMarketingTemplate(template) {
  return window.PromptTemplates.isMarketingDiagnosisTemplate(template);
}

function buildChatGptAssistInstruction(template, businessContext = '', outputLanguage = window.PromptLensI18n.getLanguage()) {
  const context = String(businessContext || '').trim();
  const useEnglish = outputLanguage === 'en';
  const sharedEvidenceRules = useEnglish ? [
    'If no image is actually attached to the conversation, ask me to upload it before analyzing anything.',
    'Base every answer strictly on visible image evidence. Do not identify real people or infer sensitive attributes such as age, ethnicity, health, politics, religion, or financial status.',
    'Describe text only when it is clearly readable. Mark blurred, obscured, or uncertain text as uncertain instead of guessing.'
  ] : [
    '如果当前对话中没有实际附加图片，请先提醒我上传图片，不要凭空分析。',
    '请严格基于图片可见内容回答；不要识别真实人物身份，不要推断年龄、种族、健康、政治、宗教、财务状况等敏感属性。',
    '如果图片中有文字，只描述清晰可读的文字；模糊、被遮挡或无法确认的文字请标为“不确定”，不要猜测。'
  ];
  if (isMarketingTemplate(template)) {
    return (useEnglish ? [
      'Analyze the commercial visual I uploaded using only visible evidence and the business context below.',
      ...sharedEvidenceRules,
      '',
      'Business context:',
      context || 'Not provided. Base the diagnosis only on visible image evidence.',
      '',
      'Use clear Markdown level-two headings for these seven sections:',
      '1. Owner-friendly summary',
      '2. Visible content and style',
      '3. Visual marketing diagnosis',
      '4. Target audience and offer assessment',
      '5. Low-cost visual revision suggestions',
      '6. Markdown Brief for designers or media buyers',
      '7. Reusable English image-generation Prompt',
      '',
      'Use cautious language such as “may”, “appears to”, and “based on visible elements” for audience, offer, conversion risk, and business intent. Do not present inference as fact.',
      'If business context is empty, do not invent brands, prices, sales, or advertising data.'
    ] : [
      '请分析我上传的这张商业视觉图。请严格基于图片可见内容，并结合我提供的业务背景。',
      ...sharedEvidenceRules,
      '',
      '业务背景：',
      context || '未提供，请只基于图片可见内容判断。',
      '',
      '请用清晰的 Markdown 二级标题输出以上 7 个部分：',
      '1. 老板能看懂的摘要',
      '2. 画面内容与风格描述',
      '3. 视觉营销诊断',
      '4. 目标人群与卖点判断',
      '5. 低成本改图建议',
      '6. 可交给设计师 / 投放同事的 Markdown Brief',
      '7. 可直接复用的英文生成 Prompt',
      '',
      '涉及目标人群、卖点、转化风险、商业意图时，请使用“可能”“看起来”“从画面推测”等谨慎措辞，并说明依据来自哪些可见元素。不要把推测写成事实。',
      '如果业务背景为空，请只基于图片判断，不要编造品牌、价格、销量或投放数据。'
    ]).join('\n');
  }

  const lines = useEnglish ? [
    'Analyze the image I uploaded. Base every statement on visible evidence and do not invent hidden details.',
    ...sharedEvidenceRules,
    '',
    'Use this Markdown structure:',
    '1. Chinese Prompt in Simplified Chinese',
    '2. English Prompt',
    '3. Tags: 6-10 English tags covering subject, style, lighting, composition, mood, and visual technique',
    '4. Negative Prompt in English',
    '5. Final reusable English Prompt without platform-specific parameters',
    '6. Three distinct variants, each with an English Prompt, use cases, and Negative Prompt',
    '',
    'Write headings, explanations, and use cases in English. Clearly mark uncertain details as uncertain.'
  ] : [
    '请分析我上传的这张图片。请严格基于图片可见内容，不要编造不可见信息。',
    ...sharedEvidenceRules,
    '',
    '请输出以下 Markdown 结构：',
    '1. 中文提示词',
    '2. English Prompt',
    '3. Tags：6-10 个英文标签，覆盖主体、风格、光线、构图、情绪和视觉技法',
    '4. Negative Prompt',
    '5. 可直接复制到图像生成工具的最终英文 Prompt，不包含平台专属参数',
    '6. 3 个不同风格变体：每个包含英文 Prompt、适用场景、Negative Prompt',
    '',
    '如果存在不确定内容，请明确写出“不确定”。'
  ];

  if (template && template.instruction) {
    lines.push(...(useEnglish ? [
      '',
      'Selected output template requirements:',
      String(template.instruction).trim(),
      '',
      'These requirements come from PromptLens structured API templates. Do not output JSON or field names such as prompt_en, prompt_zh, prompt_tags, negative_prompt, json_prompt, or prompt_variants. Map the requirements into the Markdown sections above.',
      'Keep the selected template style while following the structure above. Stay grounded in visible evidence and do not invent unavailable information.'
    ] : [
      '',
      '所选输出模板要求：',
      String(template.instruction).trim(),
      '',
      '上面的模板要求来自 PromptLens 的结构化 API 模板。请不要输出 JSON，也不要输出 prompt_en、prompt_zh、prompt_tags、negative_prompt、json_prompt 或 prompt_variants 等字段名；请把这些要求映射到上面的 Markdown 小节中。',
      '请在满足上述结构的同时，保留这个模板要求的输出风格；严格基于图片可见内容回答，不要编造图片中不存在的信息。'
    ]));
  }

  return lines.join('\n');
}

/* ── ChatGPT Assist helpers ──────────────────────────── */

function makeTimestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\..+$/, '').replace('T', '-');
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function downloadPreparedImage(preparedImage) {
  const bytes = base64ToBytes(preparedImage.base64);
  const blob = new Blob([bytes], { type: 'image/jpeg' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `promptlens-chatgpt-image-${makeTimestamp()}.jpg`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function showAssistStatus(message, tone) {
  if (!elements.chatgptAssistStatus) return;
  elements.chatgptAssistStatus.hidden = false;
  elements.chatgptAssistStatus.className = `status-banner status-banner--${tone}`;
  elements.chatgptAssistStatus.textContent = message;
}

function showLocalizedAssistStatus(key, tone, params = {}) {
  currentAssistStatus = { key, tone, params };
  showAssistStatus(t(key, params), tone);
}

function renderChatGptAssistPanel(preparedImage, instruction) {
  currentResult = null;
  currentRawText = '';
  currentAssistImage = preparedImage;
  currentAssistInstruction = instruction;

  loadingPanel.hidden = true;
  errorPanel.hidden = true;
  if (resultContent) resultContent.hidden = true;
  if (elements.chatgptAssistCard) elements.chatgptAssistCard.hidden = false;
  if (elements.chatgptInstructionOutput) elements.chatgptInstructionOutput.value = instruction;
  hideMarketingContextCard();
  showLocalizedAssistStatus('chatgptAssistReady', 'success');
}

function openChatGpt() {
  const url = 'https://chatgpt.com/';
  if (chrome && chrome.tabs && chrome.tabs.create) {
    chrome.tabs.create({ url });
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

/* ── Reverse prompt instruction ──────────────────────── */

function buildReversePromptInstruction(template, businessContext = '', outputLanguage = window.PromptLensI18n.getLanguage()) {
  return window.PromptTemplates.buildFinalPrompt(template, {
    businessContext,
    outputLanguage
  });
}

async function callVisionApi(preparedImage, template, outputLanguage) {
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
            text: buildReversePromptInstruction(template, currentBusinessContext, outputLanguage)
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
    setLocalizedLoading('resultLoadingCallModel', stepApi);
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
        throw localizedError('errorApiAuth');
      }
      throw localizedError('errorApiRequest', { status: response.status });
    }

    const responseJson = JSON.parse(responseText);
    const rawText = extractAssistantText(responseJson);
    const parsed = extractJSON(rawText);
    if (!parsed) {
      throw localizedError('errorApiJson', { detail: rawText });
    }
    return { parsed, rawText, usage: responseJson.usage || null, responseTimeMs: performance.now() - startedAt };
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw localizedError('errorApiTimeout');
    }
    if (error.message && error.message.includes('Failed to fetch')) {
      throw localizedError('errorApiConnect');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function extractAssistantText(responseJson) {
  const choices = responseJson && responseJson.choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    throw localizedError('errorApiChoices');
  }
  const content = choices[0] && choices[0].message && choices[0].message.content;
  if (typeof content === 'string') {
    return content.trim();
  }
  if (Array.isArray(content)) {
    return content.map(item => typeof item.text === 'string' ? item.text : '').join('\n').trim();
  }
  throw localizedError('errorApiContent');
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
    throw localizedError('errorSchemaObject');
  }
  if (typeof parsed.prompt_zh !== 'string' || !parsed.prompt_zh.trim()) {
    throw localizedError('errorSchemaPromptZh');
  }
  if (typeof parsed.prompt_en !== 'string' || !parsed.prompt_en.trim()) {
    throw localizedError('errorSchemaPromptEn');
  }
  if (!Array.isArray(parsed.prompt_tags)) {
    throw localizedError('errorSchemaTags');
  }
  if (typeof parsed.negative_prompt !== 'string') {
    throw localizedError('errorSchemaNegative');
  }
  if (!parsed.json_prompt || typeof parsed.json_prompt !== 'object') {
    throw localizedError('errorSchemaJsonPrompt');
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

async function maybeSaveHistory(input, result, template, contentLanguage) {
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
    contentLanguage,
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

function fillMarketingContextExample() {
  if (!elements.marketingContextInput) return;
  elements.marketingContextInput.value = t('businessContextExample');
  elements.marketingContextInput.focus();
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

  // ChatGPT Assist 分流
  setLocalizedLoading('resultLoadingPrepareChatgpt', stepApi);
  const config = await loadConfig();
  if (config.analysisMode === 'chatgpt_assist') {
    let businessContext = '';
    if (window.PromptTemplates.isMarketingDiagnosisTemplate(template)) {
      businessContext = await waitForMarketingContext();
      currentBusinessContext = businessContext;
    }
    const instruction = buildChatGptAssistInstruction(template, businessContext, window.PromptLensI18n.getLanguage());
    renderChatGptAssistPanel(prepared, instruction);
    return;
  }

  // API 自动分析路径
  if (window.PromptTemplates.isMarketingDiagnosisTemplate(template)) {
    currentBusinessContext = await waitForMarketingContext();
  } else {
    currentBusinessContext = '';
  }

  const outputLanguage = window.PromptLensI18n.getLanguage();
  const { parsed, rawText, usage, responseTimeMs } = await callVisionApi(prepared, template, outputLanguage);
  currentUsage = usage;
  currentResponseTimeMs = responseTimeMs;
  validateResultSchema(parsed);
  // ChatGPT Assist mode does not save history because PromptLens does not receive the ChatGPT web reply.
  const displayTemplate = await window.PromptTemplates.getTemplateById(template.id);
  await maybeSaveHistory(input, parsed, displayTemplate, outputLanguage);
  renderResult(parsed, rawText, displayTemplate);
}

/* ── ChatGPT Auto Send helpers ──────────────────────── */

// ChatGPT 自动发送消息类型（与 background.js 一致）
const PROMPTLENS_CHATGPT_PAYLOAD_SAVE = 'PROMPTLENS_CHATGPT_PAYLOAD_SAVE';
const PROMPTLENS_CHATGPT_STATUS = 'PROMPTLENS_CHATGPT_STATUS';
const CHATGPT_STATUS_KEY_PREFIX = 'chatgpt-status:';
const CHATGPT_STATUS_POLL_INTERVAL_MS = 1000;
const CHATGPT_STATUS_POLL_MAX_ATTEMPTS = 45;

function buildChatGptTransferPayload() {
  if (!currentAssistImage || !currentAssistImage.base64 || !currentAssistInstruction) {
    throw localizedError('errorAssistNotReady');
  }
  return {
    imageBase64: currentAssistImage.base64,
    mimeType: 'image/jpeg',
    filename: `promptlens-chatgpt-image-${makeTimestamp()}.jpg`,
    instruction: currentAssistInstruction
  };
}

async function requestChatGptPermission() {
  const origins = ['https://chatgpt.com/*'];
  const hasPermission = await chrome.permissions.contains({ origins });
  if (hasPermission) return true;
  showLocalizedAssistStatus('chatgptAssistPermissionNeeded', 'info');
  return chrome.permissions.request({ origins });
}

function getChatGptStatusMessage(status) {
  const messages = {
    permission_denied: { tone: 'warning', key: 'chatgptAssistPermissionDenied' },
    payload_missing: { tone: 'warning', key: 'chatgptAssistPayloadExpired' },
    tab_open_failed: { tone: 'error', key: 'chatgptAssistTabOpenFailed' },
    script_injection_failed: { tone: 'warning', key: 'chatgptAssistConnectFailed' },
    input_not_found: { tone: 'warning', key: 'chatgptAssistInputNotFound' },
    instruction_failed: { tone: 'warning', key: 'chatgptAssistInstructionFailed' },
    image_input_not_found: { tone: 'warning', key: 'chatgptAssistImageInputNotFound' },
    image_attach_failed: { tone: 'warning', key: 'chatgptAssistImageAttachFailed' },
    partial_success_instruction_only: { tone: 'warning', key: 'chatgptAssistImageAttachFailed' },
    success_instruction_only: { tone: 'info', key: 'chatgptAssistInstructionOnly' },
    success_instruction_and_image: { tone: 'success', key: 'chatgptAssistSuccess' }
  };
  const match = messages[status] || { tone: 'warning', key: 'chatgptAssistAutoFailed' };
  return { tone: match.tone, key: match.key, message: t(match.key) };
}

async function pollChatGptStatus(jobId) {
  const statusKey = CHATGPT_STATUS_KEY_PREFIX + jobId;
  for (let attempt = 0; attempt < CHATGPT_STATUS_POLL_MAX_ATTEMPTS; attempt++) {
    await new Promise(resolve => setTimeout(resolve, CHATGPT_STATUS_POLL_INTERVAL_MS));
    const stored = await chrome.storage.session.get({ [statusKey]: null });
    const entry = stored[statusKey];
    if (entry && entry.status) {
      const msg = getChatGptStatusMessage(entry.status);
      showLocalizedAssistStatus(msg.key, msg.tone);
      return;
    }
  }
}

async function sendToChatGpt() {
  const granted = await requestChatGptPermission();
  if (!granted) {
    showLocalizedAssistStatus('chatgptAssistPermissionDenied', 'warning');
    return;
  }

  const response = await chrome.runtime.sendMessage({
    type: 'PROMPTLENS_CHATGPT_PAYLOAD_SAVE',
    payload: buildChatGptTransferPayload()
  });
  if (!response || !response.ok) {
    throw new Error(response && response.error || t('chatgptAssistTabOpenFailed'));
  }
  showLocalizedAssistStatus('chatgptAssistOpenedWaiting', 'info');
  pollChatGptStatus(response.jobId);
}

/* ── ChatGPT Assist event listeners ──────────────────── */

if (elements.chatgptSend) {
  elements.chatgptSend.addEventListener('click', () => {
    sendToChatGpt().catch(error => {
      showLocalizedAssistStatus('chatgptAssistAutoError', 'error', { detail: error.message });
    });
  });
}

if (elements.chatgptDownloadImage) {
  elements.chatgptDownloadImage.addEventListener('click', () => {
    if (!currentAssistImage) {
      showLocalizedAssistStatus('chatgptAssistImageNotReady', 'warning');
      return;
    }
    try {
      downloadPreparedImage(currentAssistImage);
      showLocalizedAssistStatus('chatgptAssistImageDownloadStarted', 'success');
    } catch (error) {
      showLocalizedAssistStatus('chatgptAssistImageDownloadFailed', 'error');
    }
  });
}

if (elements.chatgptCopyInstruction) {
  elements.chatgptCopyInstruction.addEventListener('click', () => {
    copyTextWithFeedback(elements.chatgptCopyInstruction, currentAssistInstruction).then(copied => {
      if (!copied) {
        showLocalizedAssistStatus('chatgptAssistCopyBlocked', 'warning');
      }
    });
  });
}

if (elements.chatgptOpen) {
  elements.chatgptOpen.addEventListener('click', () => {
    try {
      openChatGpt();
      showLocalizedAssistStatus('chatgptAssistOpenedManual', 'info');
    } catch (error) {
      showLocalizedAssistStatus('chatgptAssistTabOpenFailed', 'error');
    }
  });
}

if (elements.chatgptCopyOpen) {
  elements.chatgptCopyOpen.addEventListener('click', async () => {
    let copied = true;
    try {
      await navigator.clipboard.writeText(currentAssistInstruction || '');
    } catch {
      copied = false;
    }
    try {
      openChatGpt();
      showLocalizedAssistStatus(copied ? 'chatgptAssistCopiedAndOpened' : 'chatgptAssistOpenedCopyBlocked', copied ? 'info' : 'warning');
    } catch {
      showLocalizedAssistStatus(copied ? 'chatgptAssistCopiedOpenFailed' : 'chatgptAssistCopyAndOpenFailed', 'error');
    }
  });
}

async function rerenderLocalizedResult() {
  window.PromptLensI18n.apply(document);
  if (currentTemplate) {
    currentTemplate = await window.PromptTemplates.getTemplateById(currentTemplate.id);
    elements.templateName.textContent = currentTemplate.name;
    elements.templateDescription.textContent = currentTemplate.description;
    renderNextStepHint(currentTemplate);
  }
  if (currentResult) {
    renderMarketingDiagnosis(currentResult, currentTemplate);
    renderPromptVariants(currentResult);
  }
  if (currentAssistImage && currentTemplate) {
    currentAssistInstruction = buildChatGptAssistInstruction(
      currentTemplate,
      currentBusinessContext || '',
      window.PromptLensI18n.getLanguage()
    );
    elements.chatgptInstructionOutput.value = currentAssistInstruction;
  }
  if (currentAssistStatus && !elements.chatgptAssistStatus.hidden) {
    showAssistStatus(t(currentAssistStatus.key, currentAssistStatus.params), currentAssistStatus.tone);
  }
  if (!errorPanel.hidden && currentError) {
    renderError(currentError);
  } else if (!resultContent.hidden && currentResult) {
    showResult();
  } else if (!elements.marketingContextCard.hidden) {
    showMarketingContextCard();
  } else if (!loadingPanel.hidden && currentLoadingState) {
    setLoading(t(currentLoadingState.key, currentLoadingState.params), currentLoadingState.activeStep);
  }
}

async function main() {
  await window.PromptLensI18n.init();
  setupCopyButtons();
  setupExportButtons();
  setLocalizedLoading('resultStatusReadingInput', stepRead);
  window.PromptLensI18n.onChange(() => {
    rerenderLocalizedResult().catch(() => {});
  });

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
    showError(t('errorCannotRetry'), t('errorNoRetryInput'));
    return;
  }
  currentError = null;
  currentBusinessContext = null;
  analyzeInput({ ...currentInput }).catch(renderError);
});

if (elements.marketingContextExample) {
  elements.marketingContextExample.addEventListener('click', fillMarketingContextExample);
}

main().catch(renderError);
