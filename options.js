const DEFAULT_CONFIG = {
  apiBaseUrl: '',
  apiKey: '',
  apiModel: '',
  activeTemplateId: window.PromptTemplates.DEFAULT_TEMPLATE_ID,
  analysisMode: 'api'
};

const PROVIDER_PRESETS = [
  { id: 'custom', name: 'Custom', baseUrl: '' },
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1' },
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1' },
  { id: 'alibaba', name: 'Alibaba DashScope', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
  { id: 'siliconflow', name: 'SiliconFlow', baseUrl: 'https://api.siliconflow.cn/v1' },
  { id: 'groq', name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1' },
  { id: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1' },
  { id: 'ollama', name: 'Ollama 本地', baseUrl: 'http://localhost:11434/v1' }
];

/* ── DOM refs ──────────────────────────────────────────── */

const form = document.getElementById('options-form');
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

function showConfigStatus(message, tone) {
  showBanner(configStatusBanner, message, tone);
}

function showPermStatus(message, tone) {
  showBanner(permStatusBanner, message, tone);
}

/* ── Provider presets ─────────────────────────────────── */

function populateProviderPresets() {
  providerPresetSelect.replaceChildren();
  PROVIDER_PRESETS.forEach(provider => {
    const option = document.createElement('option');
    option.value = provider.id;
    option.textContent = provider.name;
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
    name: 'Custom OpenAI-compatible',
    baseUrl: 'https://your-provider.example/v1',
    model: '填写支持 vision 的模型名',
    check: '确认服务支持 /chat/completions 与 image_url 输入。',
    caution: '不要把陌生或不可信地址作为 Base URL。'
  },
  {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    model: '选择支持视觉输入的模型',
    check: '保存后直接用右键图片或框选截图验证实际分析。',
    caution: '不同模型能力和价格不同，请以控制台为准。'
  },
  {
    name: 'Ollama 本地',
    baseUrl: 'http://localhost:11434/v1',
    model: '本地已安装的 vision-capable 模型',
    check: '确认 Ollama 正在运行，且模型支持图片输入。',
    caution: '本地 HTTP 仅允许 localhost 或 127.0.0.1。'
  },
  {
    name: 'OpenRouter / SiliconFlow',
    baseUrl: '使用服务商提供的 OpenAI-compatible /v1 地址',
    model: '选择明确支持 vision 的模型',
    check: '如果分析失败，优先检查模型名、路由和服务商错误日志。',
    caution: 'Provider 预设不代表所有模型都支持图片。'
  },
  {
    name: 'DeepSeek 注意事项',
    baseUrl: 'https://api.deepseek.com/v1',
    model: '以官方文档和实际分析结果为准',
    check: 'DeepSeek 文本接口可达不代表所有模型都能分析图片。',
    caution: '不要把 DeepSeek 预设理解为所有 DeepSeek 模型都支持图片。'
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
    title.textContent = recipe.name;
    const dl = document.createElement('dl');
    [
      ['Base URL', recipe.baseUrl],
      ['Model', recipe.model],
      ['检查点', recipe.check],
      ['注意', recipe.caution]
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
    ? '内置模板不可直接编辑。可点击“复制当前模板”后再维护平台专属差异。'
    : `自定义 instruction 上限 ${window.PromptTemplates.INSTRUCTION_MAX_LENGTH} 字符，系统会固定追加 JSON 输出结构要求。`;
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
    showConfigStatus('内置模板不可直接编辑，请先复制为自定义模板。', 'warning');
    return;
  }
  const updated = await window.PromptTemplates.updateCustomTemplate(template.id, {
    name: templateNameInput.value,
    description: templateDescriptionInput.value,
    instruction: templateInstructionInput.value
  });
  await populateTemplateSelect(updated.id);
  showConfigStatus('自定义模板已保存。', 'success');
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
    summaryUrl.textContent = 'ChatGPT Plus 辅助模式';
    summaryModel.textContent = '不需要 API Key';
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
      permImageDesc.textContent = '已授权。可以右键分析任意网站的图片。';
      permImageBadge.className = 'badge badge--success';
      permImageBadge.innerHTML = '<span class="badge-dot"></span> 已授权';
      grantImageButton.textContent = '权限已授权';
      grantImageButton.disabled = true;
      grantImageButton.className = 'secondary-button';
    } else {
      permImageDesc.textContent = '未授权。右键分析远程图片时会提示权限不足，可改用框选截图。';
      permImageBadge.className = 'badge badge--warning';
      permImageBadge.innerHTML = '<span class="badge-dot"></span> 未授权';
      grantImageButton.textContent = '授权图片读取权限';
      grantImageButton.disabled = false;
      grantImageButton.className = 'primary-button';
    }
  } catch {
    permImageDesc.textContent = '无法检测权限状态。';
    permImageBadge.className = 'badge badge--error';
    permImageBadge.innerHTML = '<span class="badge-dot"></span> 检测失败';
  }
}

/* ── URL validation ────────────────────────────────────── */

function validateApiBaseUrl(urlString) {
  let url;
  try {
    url = new URL(urlString);
  } catch {
    return 'AI Base URL 格式无效，请输入合法 URL。';
  }
  if (url.protocol === 'https:') return null;
  if (url.protocol === 'http:') {
    const hostname = url.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return null;
    return 'AI Base URL 必须使用 HTTPS（本地开发可使用 http://localhost 或 http://127.0.0.1）。';
  }
  return 'AI Base URL 必须使用 http 或 https 协议。';
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
      ? '当前使用 ChatGPT Plus 辅助模式，API 字段不是必填；切回 API 自动分析时再填写。'
      : 'PromptLens 会使用这些 API 字段自动调用你配置的模型服务。';
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
      config: { state: 'done', label: '已选择' },
      analyze: { state: 'active', label: '可开始' },
      output: { state: 'pending', label: '在 ChatGPT 中完成' }
    };
  }
  return {
    config: hasConfig ? { state: 'done', label: '已填写' } : { state: 'active', label: '待配置' },
    analyze: hasConfig ? { state: 'active', label: '可开始' } : { state: 'pending', label: '准备中' },
    output: hasConfig ? { state: 'active', label: '分析后完成' } : { state: 'pending', label: '准备中' }
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
  firstSuccessToggle.textContent = collapsed ? '展开' : '收起';
}

async function toggleFirstSuccessCollapsed() {
  const collapsed = !firstSuccessBody.hidden;
  firstSuccessBody.hidden = collapsed;
  firstSuccessToggle.setAttribute('aria-expanded', String(!collapsed));
  firstSuccessToggle.textContent = collapsed ? '展开' : '收起';
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
      showConfigStatus('请填写 AI Base URL。', 'error');
      baseUrlInput.focus();
      baseUrlInput.classList.add('input-error');
      return;
    }
    baseUrlInput.classList.remove('input-error');

    const urlError = validateApiBaseUrl(config.apiBaseUrl);
    if (urlError) {
      showConfigStatus(urlError, 'error');
      baseUrlInput.focus();
      baseUrlInput.classList.add('input-error');
      return;
    }
    baseUrlInput.classList.remove('input-error');

    if (!config.apiKey) {
      showConfigStatus('请填写 API Key。', 'error');
      apiKeyInput.focus();
      return;
    }

    if (!config.apiModel) {
      showConfigStatus('请填写 Model。', 'error');
      modelInput.focus();
      return;
    }

    const granted = await requestApiOriginPermission(config.apiBaseUrl);
    if (!granted) {
      showConfigStatus('需要授权 API 地址的网络权限才能发送请求。', 'error');
      return;
    }
  }

  await chrome.storage.local.set({
    ...config,
    historyEnabled: historyEnabledInput.checked,
    maxImageSide,
    jpegQuality
  });
  showConfigStatus('设置已保存。', 'success');
  await refreshChecklistState();
  await showSummary(config);
}

/* ── Event listeners ───────────────────────────────────── */

firstSuccessToggle.addEventListener('click', () => {
  toggleFirstSuccessCollapsed().catch(error => showConfigStatus(`引导区状态保存失败：${error.message}`, 'error'));
});

form.addEventListener('submit', event => {
  event.preventDefault();
  saveConfig().catch(error => {
    showConfigStatus(`保存失败：${error.message}`, 'error');
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
  updateTemplateHint().catch(error => showConfigStatus(`模板加载失败：${error.message}`, 'error'));
});

copyTemplateButton.addEventListener('click', () => {
  window.PromptTemplates.duplicateTemplate(templateSelect.value).then(template => {
    return populateTemplateSelect(template.id).then(() => {
      showConfigStatus('已复制为自定义模板，可以编辑后保存。', 'success');
    });
  }).catch(error => showConfigStatus(`复制失败：${error.message}`, 'error'));
});

newTemplateButton.addEventListener('click', () => {
  window.PromptTemplates.createCustomTemplate({
    name: '新建自定义模板',
    description: '用户自定义模板。',
    instruction: 'Describe the visible image for a specific image-generation workflow. Keep all details grounded in visible evidence.'
  }).then(template => {
    return populateTemplateSelect(template.id).then(() => {
      showConfigStatus('已创建自定义模板。', 'success');
    });
  }).catch(error => showConfigStatus(`创建失败：${error.message}`, 'error'));
});

saveTemplateButton.addEventListener('click', () => {
  saveCurrentCustomTemplate().catch(error => showConfigStatus(`保存模板失败：${error.message}`, 'error'));
});

deleteTemplateButton.addEventListener('click', () => {
  getSelectedTemplate().then(template => {
    if (template.builtIn) {
      showConfigStatus('内置模板不可删除。', 'warning');
      return null;
    }
    return window.PromptTemplates.deleteCustomTemplate(template.id).then(() => {
      return populateTemplateSelect(window.PromptTemplates.DEFAULT_TEMPLATE_ID).then(() => {
        showConfigStatus('自定义模板已删除。', 'info');
      });
    });
  }).catch(error => showConfigStatus(`删除失败：${error.message}`, 'error'));
});

exportTemplatesButton.addEventListener('click', () => {
  window.PromptTemplates.exportCustomTemplates().then(payload => {
    const stamp = new Date().toISOString().slice(0, 16).replace(/:/g, '-');
    downloadText(`promptlens-templates-${stamp}.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
    showConfigStatus('自定义模板已导出。', 'success');
  }).catch(error => showConfigStatus(`导出失败：${error.message}`, 'error'));
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
      showConfigStatus(`已导入 ${imported.length} 个自定义模板。`, 'success');
    });
  }).catch(error => {
    showConfigStatus(`导入失败：${error.message}`, 'error');
  }).finally(() => {
    templateImportFile.value = '';
  });
});

toggleApiKeyButton.addEventListener('click', () => {
  const shouldShow = apiKeyInput.type === 'password';
  apiKeyInput.type = shouldShow ? 'text' : 'password';
  toggleApiKeyButton.textContent = shouldShow ? '隐藏' : '显示';
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
    showConfigStatus('设置已清空。', 'info');
    hideSummary();
    refreshChecklistState().catch(() => {});
  }).catch(error => {
    showConfigStatus(`清空失败：${error.message}`, 'error');
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
      showPermStatus('图片读取权限已授权。现在可以右键分析任意网站的图片。', 'success');
    } else {
      showPermStatus('权限请求被拒绝。如需分析远程图片，请重新点击授权，或使用"框选截图并分析"。', 'warning');
    }
    await refreshPermissionStatus();
  } catch (error) {
    showPermStatus(`授权失败：${error.message}`, 'error');
  }
});


historyEnabledInput.addEventListener('change', () => {
  window.PromptHistory.setHistoryEnabled(historyEnabledInput.checked).then(() => {
    showConfigStatus(historyEnabledInput.checked ? '本地历史记录已开启。' : '本地历史记录已关闭。', 'info');
  }).catch(error => showConfigStatus(`历史记录设置失败：${error.message}`, 'error'));
});

clearHistoryButton.addEventListener('click', () => {
  window.PromptHistory.clearHistory().then(() => {
    showConfigStatus('本地历史记录已清空。', 'info');
  }).catch(error => showConfigStatus(`清空历史失败：${error.message}`, 'error'));
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
    persistAnalysisModeFromSelection().catch(error => showConfigStatus(`分析方式保存失败：${error.message}`, 'error'));
  });
});

/* ── Init ──────────────────────────────────────────────── */

populateProviderPresets();
renderProviderRecipes();
loadFirstSuccessCollapsedState().catch(() => {});

loadConfig().catch(error => {
  showConfigStatus(`加载设置失败：${error.message}`, 'error');
});

refreshPermissionStatus().catch(() => {});
