const DEFAULT_CONFIG = {
  apiBaseUrl: '',
  apiKey: '',
  apiModel: '',
  activeTemplateId: window.PromptTemplates.DEFAULT_TEMPLATE_ID,
  analysisMode: 'api'
};

const t = (key, params) => window.PromptLensI18n.t(key, params);

const PROVIDER_PRESETS = [
  { id: 'custom', nameKey: 'providerCustomName', baseUrl: '' },
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1' },
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1' },
  { id: 'alibaba', name: 'Alibaba DashScope', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
  { id: 'siliconflow', name: 'SiliconFlow', baseUrl: 'https://api.siliconflow.cn/v1' },
  { id: 'groq', name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1' },
  { id: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1' },
  { id: 'ollama', nameKey: 'providerOllamaLocalName', baseUrl: 'http://localhost:11434/v1' }
];

/* ── DOM refs ──────────────────────────────────────────── */

const form = document.getElementById('options-form');
const uiLanguageSelect = document.getElementById('ui-language');
const providerPresetSelect = document.getElementById('provider-preset');
const baseUrlInput = document.getElementById('api-base-url');
const apiKeyInput = document.getElementById('api-key');
const modelInput = document.getElementById('api-model');
const templateSelect = document.getElementById('prompt-template');
const templateHint = document.getElementById('template-hint');
const templateNameInput = document.getElementById('template-name-input');
const templateDescriptionInput = document.getElementById('template-description-input');
const templateInstructionInput = document.getElementById('template-instruction-input');
const templateEditorHint = document.getElementById('template-editor-hint');
const copyTemplateButton = document.getElementById('copy-template');
const newTemplateButton = document.getElementById('new-template');
const deleteTemplateButton = document.getElementById('delete-template');
const exportTemplatesButton = document.getElementById('export-templates');
const importTemplatesButton = document.getElementById('import-templates');
const templateImportFile = document.getElementById('template-import-file');
const saveTemplateButton = document.getElementById('save-template');
const historyEnabledInput = document.getElementById('history-enabled');
const clearHistoryButton = document.getElementById('clear-history');
const maxImageSideInput = document.getElementById('max-image-side');
const jpegQualityInput = document.getElementById('jpeg-quality');
const toggleApiKeyButton = document.getElementById('toggle-api-key');
const resetFormButton = document.getElementById('reset-form');
const editConfigButton = document.getElementById('edit-config');
const grantImageButton = document.getElementById('grant-image-permission');

const analysisModeApiInput = document.getElementById('analysis-mode-api');
const analysisModeChatGptInput = document.getElementById('analysis-mode-chatgpt');
const analysisModeNote = document.getElementById('analysis-mode-note');
const apiConfigModeHint = document.getElementById('api-config-mode-hint');

const configSummary = document.getElementById('config-summary');
const summaryUrl = document.getElementById('summary-url');
const summaryModel = document.getElementById('summary-model');
const summaryTemplate = document.getElementById('summary-template');

const permImageDesc = document.getElementById('perm-image-desc');
const permImageBadge = document.getElementById('perm-image-badge');
const permStatusBanner = document.getElementById('perm-status-banner');
const configStatusBanner = document.getElementById('config-status-banner');

const firstSuccessToggle = document.getElementById('first-success-toggle');
const firstSuccessBody = document.getElementById('first-success-body');
const firstSuccessStepConfig = document.getElementById('first-success-step-config');
const firstSuccessStepAnalyze = document.getElementById('first-success-step-analyze');
const firstSuccessStepOutput = document.getElementById('first-success-step-output');

const FIRST_SUCCESS_COLLAPSED_KEY = 'firstSuccessChecklistCollapsed';

/* ── Debounce helper ──────────────────────────────────────── */

function debounce(fn, ms) {
  let timer = null;
  return function (...args) {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn.apply(this, args), ms);
  };
}

const debouncedRefreshChecklistState = debounce(() => {
  refreshChecklistState().catch(() => {});
}, 250);

/* ── Status helpers ────────────────────────────────────── */

const ICONS = {
  success: '<svg class="status-banner-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>',
  error: '<svg class="status-banner-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>',
  warning: '<svg class="status-banner-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>',
  info: '<svg class="status-banner-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>'
};

function showBanner(el, message, tone) {
  el.hidden = false;
  el.className = `status-banner status-banner--${tone}`;
  el.innerHTML = ICONS[tone] || '';
  const text = document.createElement('span');
  text.textContent = message;
  el.appendChild(text);
}

function hideBanner(el) {
  el.hidden = true;
  el.innerHTML = '';
}

let currentConfigStatus = null;
let currentPermStatus = null;

function localizeStatus(status) {
  if (status.actionKey) {
    const detail = status.error && status.error.i18nKey
      ? t(status.error.i18nKey, status.error.i18nParams || {})
      : status.error && status.error.message ? status.error.message : t('commonUnknown');
    return t('optionsErrorWithDetail', { action: t(status.actionKey), detail });
  }
  return t(status.key, status.params || {});
}

function renderLocalizedStatus(el, status) {
  if (!status) return;
  showBanner(el, localizeStatus(status), status.tone);
}

function showLocalizedConfigStatus(key, tone, params = {}) {
  currentConfigStatus = { key, tone, params };
  renderLocalizedStatus(configStatusBanner, currentConfigStatus);
}

function showConfigActionError(actionKey, error) {
  currentConfigStatus = { actionKey, error, tone: 'error' };
  renderLocalizedStatus(configStatusBanner, currentConfigStatus);
}

function showLocalizedPermStatus(key, tone, params = {}) {
  currentPermStatus = { key, tone, params };
  renderLocalizedStatus(permStatusBanner, currentPermStatus);
}

function showPermActionError(actionKey, error) {
  currentPermStatus = { actionKey, error, tone: 'error' };
  renderLocalizedStatus(permStatusBanner, currentPermStatus);
}

/* ── Provider presets ─────────────────────────────────── */

function populateProviderPresets() {
  providerPresetSelect.replaceChildren();
  PROVIDER_PRESETS.forEach(provider => {
    const option = document.createElement('option');
    option.value = provider.id;
    option.textContent = provider.nameKey ? t(provider.nameKey) : provider.name;
    providerPresetSelect.appendChild(option);
  });
}

function syncProviderPresetFromUrl() {
  const value = baseUrlInput.value.trim().replace(/\/+$/, '');
  const matched = PROVIDER_PRESETS.find(provider => provider.baseUrl && provider.baseUrl.replace(/\/+$/, '') === value);
  providerPresetSelect.value = matched ? matched.id : 'custom';
}

/* ── Provider recipe examples ─────────────────────────── */

const PROVIDER_RECIPES = [
  {
    nameKey: 'providerRecipeCustomName',
    baseUrl: 'https://your-provider.example/v1',
    modelKey: 'providerRecipeCustomModel',
    checkKey: 'providerRecipeCustomCheck',
    cautionKey: 'providerRecipeCustomCaution'
  },
  {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    modelKey: 'providerRecipeOpenaiModel',
    checkKey: 'providerRecipeOpenaiCheck',
    cautionKey: 'providerRecipeOpenaiCaution'
  },
  {
    nameKey: 'providerOllamaLocalName',
    baseUrl: 'http://localhost:11434/v1',
    modelKey: 'providerRecipeOllamaModel',
    checkKey: 'providerRecipeOllamaCheck',
    cautionKey: 'providerRecipeOllamaCaution'
  },
  {
    nameKey: 'providerRecipeRouterName',
    baseUrlKey: 'providerRecipeRouterUrl',
    modelKey: 'providerRecipeRouterModel',
    checkKey: 'providerRecipeRouterCheck',
    cautionKey: 'providerRecipeRouterCaution'
  },
  {
    nameKey: 'providerRecipeDeepseekName',
    baseUrl: 'https://api.deepseek.com/v1',
    modelKey: 'providerRecipeDeepseekModel',
    checkKey: 'providerRecipeDeepseekCheck',
    cautionKey: 'providerRecipeDeepseekCaution'
  }
];

function renderProviderRecipes() {
  const list = document.getElementById('provider-recipes-list');
  if (!list) return;
  list.replaceChildren();
  PROVIDER_RECIPES.forEach(recipe => {
    const card = document.createElement('article');
    card.className = 'provider-recipe-card';
    const title = document.createElement('h4');
    title.textContent = recipe.nameKey ? t(recipe.nameKey) : recipe.name;
    const dl = document.createElement('dl');
    [
      [t('providerRecipeBaseUrl'), recipe.baseUrlKey ? t(recipe.baseUrlKey) : recipe.baseUrl],
      [t('providerRecipeModel'), t(recipe.modelKey)],
      [t('providerRecipeCheck'), t(recipe.checkKey)],
      [t('providerRecipeCaution'), t(recipe.cautionKey)]
    ].forEach(([label, value]) => {
      const row = document.createElement('div');
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = label;
      dd.textContent = value;
      row.append(dt, dd);
      dl.appendChild(row);
    });
    card.append(title, dl);
    list.appendChild(card);
  });
}

/* ── Template helpers ─────────────────────────────────── */

async function getSelectedTemplate() {
  return window.PromptTemplates.getTemplateById(templateSelect.value);
}

async function updateTemplateHint() {
  const template = await getSelectedTemplate();
  templateHint.textContent = template.description;
  templateNameInput.value = template.name;
  templateDescriptionInput.value = template.description;
  templateInstructionInput.value = template.instruction;

  const isBuiltIn = Boolean(template.builtIn);
  templateNameInput.disabled = isBuiltIn;
  templateDescriptionInput.disabled = isBuiltIn;
  templateInstructionInput.disabled = isBuiltIn;
  saveTemplateButton.disabled = isBuiltIn;
  deleteTemplateButton.disabled = isBuiltIn;
  templateEditorHint.textContent = isBuiltIn
    ? t('customTemplateBuiltInReadonly')
    : t('customTemplateInstructionLimit', { limit: window.PromptTemplates.INSTRUCTION_MAX_LENGTH });
}

async function populateTemplateSelect(selectedId) {
  const templates = await window.PromptTemplates.listTemplates();
  templateSelect.replaceChildren();
  templates.forEach(template => {
    const option = document.createElement('option');
    option.value = template.id;
    option.textContent = `${template.name} — ${template.description}`;
    templateSelect.appendChild(option);
  });
  templateSelect.value = selectedId || templateSelect.value || window.PromptTemplates.DEFAULT_TEMPLATE_ID;
  if (!templateSelect.value) {
    templateSelect.value = window.PromptTemplates.DEFAULT_TEMPLATE_ID;
  }
  await updateTemplateHint();
}

async function saveCurrentCustomTemplate() {
  hideBanner(configStatusBanner);
  const template = await getSelectedTemplate();
  if (template.builtIn) {
    showLocalizedConfigStatus('errorTemplateBuiltInEdit', 'warning');
    return;
  }
  const updated = await window.PromptTemplates.updateCustomTemplate(template.id, {
    name: templateNameInput.value,
    description: templateDescriptionInput.value,
    instruction: templateInstructionInput.value
  });
  await populateTemplateSelect(updated.id);
  showLocalizedConfigStatus('optionsStatusTemplateSaved', 'success');
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

/* ── Config summary ────────────────────────────────────── */

async function showSummary(config) {
  const mode = normalizeAnalysisMode(config.analysisMode);
  if (mode === 'chatgpt_assist') {
    summaryUrl.textContent = t('analysisModeChatgptSummary');
    summaryModel.textContent = t('analysisModeNoApiKey');
    const template = await window.PromptTemplates.getTemplateById(config.activeTemplateId);
    summaryTemplate.textContent = template.name;
    configSummary.hidden = false;
    form.hidden = true;
    return;
  }
  if (!config.apiBaseUrl || !config.apiModel) {
    configSummary.hidden = true;
    form.hidden = false;
    return;
  }
  summaryUrl.textContent = config.apiBaseUrl;
  summaryModel.textContent = config.apiModel;
  const template = await window.PromptTemplates.getTemplateById(config.activeTemplateId);
  summaryTemplate.textContent = template.name;
  configSummary.hidden = false;
  form.hidden = true;
}

function hideSummary() {
  configSummary.hidden = true;
  form.hidden = false;
}

/* ── Permission status ─────────────────────────────────── */

async function refreshPermissionStatus() {
  try {
    const has = await chrome.permissions.contains({ origins: ['<all_urls>'] });
    if (has) {
      permImageDesc.textContent = t('imagePermissionGrantedDescription');
      permImageBadge.className = 'badge badge--success';
      permImageBadge.replaceChildren();
      permImageBadge.append(Object.assign(document.createElement('span'), { className: 'badge-dot' }), document.createTextNode(` ${t('statusGranted')}`));
      grantImageButton.textContent = t('imagePermissionGrantedButton');
      grantImageButton.disabled = true;
      grantImageButton.className = 'secondary-button';
    } else {
      permImageDesc.textContent = t('imagePermissionMissingDescription');
      permImageBadge.className = 'badge badge--warning';
      permImageBadge.replaceChildren();
      permImageBadge.append(Object.assign(document.createElement('span'), { className: 'badge-dot' }), document.createTextNode(` ${t('statusNotGranted')}`));
      grantImageButton.textContent = t('imagePermissionGrant');
      grantImageButton.disabled = false;
      grantImageButton.className = 'primary-button';
    }
  } catch {
    permImageDesc.textContent = t('imagePermissionCheckFailed');
    permImageBadge.className = 'badge badge--error';
    permImageBadge.replaceChildren();
    permImageBadge.append(Object.assign(document.createElement('span'), { className: 'badge-dot' }), document.createTextNode(` ${t('statusCheckFailed')}`));
  }
}

/* ── URL validation ────────────────────────────────────── */

function validateApiBaseUrl(urlString) {
  let url;
  try {
    url = new URL(urlString);
  } catch {
    return 'errorApiUrlInvalid';
  }
  if (url.protocol === 'https:') return null;
  if (url.protocol === 'http:') {
    const hostname = url.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return null;
    return 'errorApiHttpsRequired';
  }
  return 'errorApiProtocolInvalid';
}

async function requestApiOriginPermission(apiBaseUrl) {
  try {
    const url = new URL(apiBaseUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return true;
    const origin = url.origin + '/*';
    const has = await chrome.permissions.contains({ origins: [origin] });
    if (has) return true;
    return chrome.permissions.request({ origins: [origin] });
  } catch {
    return true;
  }
}

function trimConfig(config) {
  return {
    apiBaseUrl: String(config.apiBaseUrl || '').trim(),
    apiKey: String(config.apiKey || '').trim(),
    apiModel: String(config.apiModel || '').trim(),
    activeTemplateId: String(config.activeTemplateId || window.PromptTemplates.DEFAULT_TEMPLATE_ID).trim(),
    analysisMode: normalizeAnalysisMode(config.analysisMode)
  };
}

/* ── Analysis mode helpers ───────────────────────────── */

function normalizeAnalysisMode(value) {
  return value === 'chatgpt_assist' ? 'chatgpt_assist' : 'api';
}

function getAnalysisMode() {
  return analysisModeChatGptInput && analysisModeChatGptInput.checked ? 'chatgpt_assist' : 'api';
}

function renderAnalysisMode(mode) {
  const normalized = normalizeAnalysisMode(mode);
  if (analysisModeApiInput) analysisModeApiInput.checked = normalized === 'api';
  if (analysisModeChatGptInput) analysisModeChatGptInput.checked = normalized === 'chatgpt_assist';
  if (analysisModeNote) analysisModeNote.hidden = normalized !== 'chatgpt_assist';
  if (apiConfigModeHint) {
    apiConfigModeHint.textContent = normalized === 'chatgpt_assist'
      ? t('apiConfigModeHintChatgpt')
      : t('apiConfigModeHintApi');
  }
  baseUrlInput.required = normalized === 'api';
  apiKeyInput.required = normalized === 'api';
  modelInput.required = normalized === 'api';
}

async function persistAnalysisModeFromSelection() {
  const analysisMode = getAnalysisMode();
  renderAnalysisMode(analysisMode);
  await chrome.storage.local.set({ analysisMode: getAnalysisMode() });
  await refreshChecklistState();
}

/* ── First success checklist ──────────────────────────── */

function getCurrentFormConfig() {
  return trimConfig({
    apiBaseUrl: baseUrlInput.value,
    apiKey: apiKeyInput.value,
    apiModel: modelInput.value,
    activeTemplateId: templateSelect.value,
    analysisMode: getAnalysisMode()
  });
}

function isCompleteConfig(config) {
  if (normalizeAnalysisMode(config.analysisMode) === 'chatgpt_assist') return true;
  return Boolean(config.apiBaseUrl && config.apiKey && config.apiModel);
}

function setStepState(stepEl, state, label) {
  if (!stepEl) return;
  stepEl.dataset.state = state;
  const stateEl = stepEl.querySelector('.step-state');
  if (stateEl) stateEl.textContent = label;
}

function deriveChecklistState(config) {
  const mode = normalizeAnalysisMode(config.analysisMode);
  const hasConfig = isCompleteConfig(config);
  if (mode === 'chatgpt_assist') {
    return {
      config: { state: 'done', label: t('statusSelected') },
      analyze: { state: 'active', label: t('statusReady') },
      output: { state: 'pending', label: t('statusCompleteInChatgpt') }
    };
  }
  return {
    config: hasConfig ? { state: 'done', label: t('statusConfigured') } : { state: 'active', label: t('statusNeedsConfig') },
    analyze: hasConfig ? { state: 'active', label: t('statusReady') } : { state: 'pending', label: t('statusPreparing') },
    output: hasConfig ? { state: 'active', label: t('statusCompleteAfterAnalysis') } : { state: 'pending', label: t('statusPreparing') }
  };
}

function renderChecklistState(state) {
  setStepState(firstSuccessStepConfig, state.config.state, state.config.label);
  setStepState(firstSuccessStepAnalyze, state.analyze.state, state.analyze.label);
  setStepState(firstSuccessStepOutput, state.output.state, state.output.label);
}

async function refreshChecklistState() {
  const config = getCurrentFormConfig();
  config.providerPreset = providerPresetSelect.value;
  renderChecklistState(deriveChecklistState(config));
}

async function loadFirstSuccessCollapsedState() {
  const stored = await chrome.storage.local.get({ [FIRST_SUCCESS_COLLAPSED_KEY]: false });
  const collapsed = Boolean(stored[FIRST_SUCCESS_COLLAPSED_KEY]);
  firstSuccessBody.hidden = collapsed;
  firstSuccessToggle.setAttribute('aria-expanded', String(!collapsed));
  firstSuccessToggle.textContent = collapsed ? t('commonExpand') : t('commonCollapse');
}

async function toggleFirstSuccessCollapsed() {
  const collapsed = !firstSuccessBody.hidden;
  firstSuccessBody.hidden = collapsed;
  firstSuccessToggle.setAttribute('aria-expanded', String(!collapsed));
  firstSuccessToggle.textContent = collapsed ? t('commonExpand') : t('commonCollapse');
  await chrome.storage.local.set({ [FIRST_SUCCESS_COLLAPSED_KEY]: collapsed });
}

/* ── Load / Save ───────────────────────────────────────── */

async function loadConfig() {
  const stored = await chrome.storage.local.get({
    ...DEFAULT_CONFIG,
    historyEnabled: false,
    maxImageSide: 2048,
    jpegQuality: 0.85
  });
  const config = trimConfig(stored);
  baseUrlInput.value = config.apiBaseUrl;
  apiKeyInput.value = config.apiKey;
  modelInput.value = config.apiModel;
  historyEnabledInput.checked = Boolean(stored.historyEnabled);
  maxImageSideInput.value = Number(stored.maxImageSide) || 2048;
  jpegQualityInput.value = Number(stored.jpegQuality) || 0.85;
  syncProviderPresetFromUrl();
  renderAnalysisMode(config.analysisMode);
  await populateTemplateSelect(config.activeTemplateId);
  await refreshChecklistState();

  if ((config.apiBaseUrl && config.apiKey && config.apiModel) || normalizeAnalysisMode(config.analysisMode) === 'chatgpt_assist') {
    await showSummary(config);
  }
}

async function saveConfig() {
  hideBanner(configStatusBanner);

  const config = trimConfig({
    apiBaseUrl: baseUrlInput.value,
    apiKey: apiKeyInput.value,
    apiModel: modelInput.value,
    activeTemplateId: templateSelect.value,
    analysisMode: getAnalysisMode()
  });
  const maxImageSide = Math.min(4096, Math.max(512, Number(maxImageSideInput.value) || 2048));
  const jpegQuality = Math.min(0.95, Math.max(0.4, Number(jpegQualityInput.value) || 0.85));

  if (config.analysisMode === 'api') {
    if (!config.apiBaseUrl) {
      showLocalizedConfigStatus('errorApiBaseUrlRequired', 'error');
      baseUrlInput.focus();
      baseUrlInput.classList.add('input-error');
      return;
    }
    baseUrlInput.classList.remove('input-error');

    const urlError = validateApiBaseUrl(config.apiBaseUrl);
    if (urlError) {
      showLocalizedConfigStatus(urlError, 'error');
      baseUrlInput.focus();
      baseUrlInput.classList.add('input-error');
      return;
    }
    baseUrlInput.classList.remove('input-error');

    if (!config.apiKey) {
      showLocalizedConfigStatus('errorApiKeyRequired', 'error');
      apiKeyInput.focus();
      return;
    }

    if (!config.apiModel) {
      showLocalizedConfigStatus('errorApiModelRequired', 'error');
      modelInput.focus();
      return;
    }

    const granted = await requestApiOriginPermission(config.apiBaseUrl);
    if (!granted) {
      showLocalizedConfigStatus('errorApiPermissionRequired', 'error');
      return;
    }
  }

  await chrome.storage.local.set({
    ...config,
    historyEnabled: historyEnabledInput.checked,
    maxImageSide,
    jpegQuality
  });
  showLocalizedConfigStatus('optionsStatusSettingsSaved', 'success');
  await refreshChecklistState();
  await showSummary(config);
}

/* ── Event listeners ───────────────────────────────────── */

firstSuccessToggle.addEventListener('click', () => {
  toggleFirstSuccessCollapsed().catch(error => showConfigActionError('errorActionStateSave', error));
});

form.addEventListener('submit', event => {
  event.preventDefault();
  saveConfig().catch(error => {
    showConfigActionError('errorActionSave', error);
  });
});

uiLanguageSelect.addEventListener('change', () => {
  window.PromptLensI18n.setLanguage(uiLanguageSelect.value).catch(error => {
    showConfigActionError('errorActionSettingsLoad', error);
  });
});

providerPresetSelect.addEventListener('change', () => {
  const selected = PROVIDER_PRESETS.find(provider => provider.id === providerPresetSelect.value);
  if (selected && selected.baseUrl) {
    baseUrlInput.value = selected.baseUrl;
    baseUrlInput.classList.remove('input-error');
  }
  debouncedRefreshChecklistState();
});

baseUrlInput.addEventListener('input', syncProviderPresetFromUrl);

templateSelect.addEventListener('change', () => {
  updateTemplateHint().catch(error => showConfigActionError('errorActionTemplateLoad', error));
});

copyTemplateButton.addEventListener('click', () => {
  window.PromptTemplates.duplicateTemplate(templateSelect.value).then(template => {
    return populateTemplateSelect(template.id).then(() => {
      showLocalizedConfigStatus('optionsStatusTemplateCopied', 'success');
    });
  }).catch(error => showConfigActionError('errorActionCopy', error));
});

newTemplateButton.addEventListener('click', () => {
  window.PromptTemplates.createCustomTemplate({
    name: t('customTemplateNewDefaultName'),
    description: t('templateUserDefined'),
    instruction: 'Describe the visible image for a specific image-generation workflow. Keep all details grounded in visible evidence.'
  }).then(template => {
    return populateTemplateSelect(template.id).then(() => {
      showLocalizedConfigStatus('optionsStatusTemplateCreated', 'success');
    });
  }).catch(error => showConfigActionError('errorActionCreate', error));
});

saveTemplateButton.addEventListener('click', () => {
  saveCurrentCustomTemplate().catch(error => showConfigActionError('errorActionTemplateSave', error));
});

deleteTemplateButton.addEventListener('click', () => {
  getSelectedTemplate().then(template => {
    if (template.builtIn) {
      showLocalizedConfigStatus('errorTemplateBuiltInDelete', 'warning');
      return null;
    }
    return window.PromptTemplates.deleteCustomTemplate(template.id).then(() => {
      return populateTemplateSelect(window.PromptTemplates.DEFAULT_TEMPLATE_ID).then(() => {
        showLocalizedConfigStatus('optionsStatusTemplateDeleted', 'info');
      });
    });
  }).catch(error => showConfigActionError('errorActionDelete', error));
});

exportTemplatesButton.addEventListener('click', () => {
  window.PromptTemplates.exportCustomTemplates().then(payload => {
    const stamp = new Date().toISOString().slice(0, 16).replace(/:/g, '-');
    downloadText(`promptlens-templates-${stamp}.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
    showLocalizedConfigStatus('optionsStatusTemplateExported', 'success');
  }).catch(error => showConfigActionError('errorActionExport', error));
});

importTemplatesButton.addEventListener('click', () => {
  templateImportFile.click();
});

templateImportFile.addEventListener('change', () => {
  const file = templateImportFile.files && templateImportFile.files[0];
  if (!file) return;
  file.text().then(text => {
    return window.PromptTemplates.importCustomTemplates(JSON.parse(text));
  }).then(imported => {
    const selectedId = imported[0] ? imported[0].id : window.PromptTemplates.DEFAULT_TEMPLATE_ID;
    return populateTemplateSelect(selectedId).then(() => {
      showLocalizedConfigStatus('optionsStatusTemplateImported', 'success', { count: imported.length });
    });
  }).catch(error => {
    showConfigActionError('errorActionImport', error);
  }).finally(() => {
    templateImportFile.value = '';
  });
});

toggleApiKeyButton.addEventListener('click', () => {
  const shouldShow = apiKeyInput.type === 'password';
  apiKeyInput.type = shouldShow ? 'text' : 'password';
  toggleApiKeyButton.textContent = shouldShow ? t('commonHide') : t('commonShow');
});

resetFormButton.addEventListener('click', () => {
  baseUrlInput.value = '';
  apiKeyInput.value = '';
  modelInput.value = '';
  providerPresetSelect.value = 'custom';
  templateSelect.value = window.PromptTemplates.DEFAULT_TEMPLATE_ID;
  updateTemplateHint().catch(() => {});
  baseUrlInput.classList.remove('input-error');
  hideBanner(configStatusBanner);
  chrome.storage.local.remove(['apiBaseUrl', 'apiKey', 'apiModel', 'activeTemplateId', 'analysisMode']).then(() => {
    showLocalizedConfigStatus('optionsStatusSettingsCleared', 'info');
    hideSummary();
    refreshChecklistState().catch(() => {});
  }).catch(error => {
    showConfigActionError('errorActionClear', error);
  });
});

editConfigButton.addEventListener('click', () => {
  hideSummary();
  hideBanner(configStatusBanner);
});

grantImageButton.addEventListener('click', async () => {
  try {
    const granted = await chrome.permissions.request({ origins: ['<all_urls>'] });
    if (granted) {
      showLocalizedPermStatus('imagePermissionGrantedMessage', 'success');
    } else {
      showLocalizedPermStatus('imagePermissionDeniedMessage', 'warning');
    }
    await refreshPermissionStatus();
  } catch (error) {
    showPermActionError('errorActionAuthorize', error);
  }
});


historyEnabledInput.addEventListener('change', () => {
  window.PromptHistory.setHistoryEnabled(historyEnabledInput.checked).then(() => {
    showLocalizedConfigStatus(historyEnabledInput.checked ? 'optionsStatusHistoryEnabled' : 'optionsStatusHistoryDisabled', 'info');
  }).catch(error => showConfigActionError('errorActionHistorySettings', error));
});

clearHistoryButton.addEventListener('click', () => {
  window.PromptHistory.clearHistory().then(() => {
    showLocalizedConfigStatus('optionsStatusHistoryCleared', 'info');
  }).catch(error => showConfigActionError('errorActionHistoryClear', error));
});

// 清除输入框错误样式；配置字段变化时刷新首次成功引导
[baseUrlInput, apiKeyInput, modelInput].forEach(input => {
  input.addEventListener('input', () => {
    input.classList.remove('input-error');
    debouncedRefreshChecklistState();
  });
});

// 分析方式切换监听
[analysisModeApiInput, analysisModeChatGptInput].forEach(input => {
  if (!input) return;
  input.addEventListener('change', () => {
    persistAnalysisModeFromSelection().catch(error => showConfigActionError('errorActionAnalysisModeSave', error));
  });
});

/* ── Init ──────────────────────────────────────────────── */

async function renderLocalizedOptions() {
  const selectedBefore = templateSelect.value ? await getSelectedTemplate() : null;
  const customDraft = selectedBefore && !selectedBefore.builtIn ? {
    name: templateNameInput.value,
    description: templateDescriptionInput.value,
    instruction: templateInstructionInput.value
  } : null;
  window.PromptLensI18n.apply(document);
  uiLanguageSelect.value = window.PromptLensI18n.getLanguage();
  populateProviderPresets();
  syncProviderPresetFromUrl();
  renderProviderRecipes();
  renderAnalysisMode(getAnalysisMode());
  await populateTemplateSelect(templateSelect.value || window.PromptTemplates.DEFAULT_TEMPLATE_ID);
  if (customDraft) {
    templateNameInput.value = customDraft.name;
    templateDescriptionInput.value = customDraft.description;
    templateInstructionInput.value = customDraft.instruction;
  }
  await refreshChecklistState();
  await loadFirstSuccessCollapsedState();
  await refreshPermissionStatus();
  if (!configSummary.hidden) await showSummary(getCurrentFormConfig());
  if (!configStatusBanner.hidden) renderLocalizedStatus(configStatusBanner, currentConfigStatus);
  if (!permStatusBanner.hidden) renderLocalizedStatus(permStatusBanner, currentPermStatus);
}

async function main() {
  await window.PromptLensI18n.init();
  uiLanguageSelect.value = window.PromptLensI18n.getLanguage();
  populateProviderPresets();
  renderProviderRecipes();
  await loadFirstSuccessCollapsedState();
  await loadConfig();
  await refreshPermissionStatus();
  window.PromptLensI18n.onChange(() => {
    renderLocalizedOptions().catch(error => showConfigActionError('errorActionSettingsLoad', error));
  });
}

main().catch(error => {
  showConfigActionError('errorActionSettingsLoad', error);
});
