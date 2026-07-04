const DEFAULT_CONFIG = {
  apiBaseUrl: '',
  apiKey: '',
  apiModel: '',
  activeTemplateId: window.PromptTemplates.DEFAULT_TEMPLATE_ID
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
const quickTestButton = document.getElementById('quick-test');
const visionTestButton = document.getElementById('vision-test');
const historyEnabledInput = document.getElementById('history-enabled');
const clearHistoryButton = document.getElementById('clear-history');
const maxImageSideInput = document.getElementById('max-image-side');
const jpegQualityInput = document.getElementById('jpeg-quality');
const toggleApiKeyButton = document.getElementById('toggle-api-key');
const resetFormButton = document.getElementById('reset-form');
const testConnectionButton = null;
const editConfigButton = document.getElementById('edit-config');
const grantImageButton = document.getElementById('grant-image-permission');

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
const firstSuccessStepTest = document.getElementById('first-success-step-test');
const firstSuccessStepAnalyze = document.getElementById('first-success-step-analyze');
const firstSuccessStepOutput = document.getElementById('first-success-step-output');

const FIRST_SUCCESS_COLLAPSED_KEY = 'firstSuccessChecklistCollapsed';
const QUICK_TEST_STATUS_KEY = 'quickTestStatus';
const VISION_TEST_STATUS_KEY = 'visionTestStatus';

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
    check: '快速测试验证 Key；视觉测试验证图片输入。',
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
    check: '404 多半是模型名或路由不正确；视觉失败时请换 vision 模型。',
    caution: 'Provider 预设不代表所有模型都支持图片。'
  },
  {
    name: 'DeepSeek 注意事项',
    baseUrl: 'https://api.deepseek.com/v1',
    model: '以官方文档和视觉测试为准',
    check: '文本模型可能通过快速测试，但不一定支持 image_url。',
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
    activeTemplateId: String(config.activeTemplateId || window.PromptTemplates.DEFAULT_TEMPLATE_ID).trim()
  };
}

/* ── First success checklist ──────────────────────────── */

function getCurrentFormConfig() {
  return trimConfig({
    apiBaseUrl: baseUrlInput.value,
    apiKey: apiKeyInput.value,
    apiModel: modelInput.value,
    activeTemplateId: templateSelect.value
  });
}

function isCompleteConfig(config) {
  return Boolean(config.apiBaseUrl && config.apiKey && config.apiModel);
}

function setStepState(stepEl, state, label) {
  if (!stepEl) return;
  stepEl.dataset.state = state;
  const stateEl = stepEl.querySelector('.step-state');
  if (stateEl) stateEl.textContent = label;
}

function deriveChecklistState(config, quickState, visionState) {
  const hasConfig = isCompleteConfig(config);
  const quickPassed = Boolean(quickState && quickState.success);
  const visionPassed = Boolean(visionState && visionState.success);
  return {
    config: hasConfig ? { state: 'done', label: '已填写' } : { state: 'active', label: '待配置' },
    test: visionPassed
      ? { state: 'done', label: '视觉已通过' }
      : quickPassed
        ? { state: 'active', label: '待视觉测试' }
        : hasConfig
          ? { state: 'active', label: '待测试' }
          : { state: 'pending', label: '未开始' },
    analyze: visionPassed ? { state: 'active', label: '可开始' } : { state: 'pending', label: '准备中' },
    output: visionPassed ? { state: 'active', label: '分析后完成' } : { state: 'pending', label: '准备中' }
  };
}

function renderChecklistState(state) {
  setStepState(firstSuccessStepConfig, state.config.state, state.config.label);
  setStepState(firstSuccessStepTest, state.test.state, state.test.label);
  setStepState(firstSuccessStepAnalyze, state.analyze.state, state.analyze.label);
  setStepState(firstSuccessStepOutput, state.output.state, state.output.label);
}

async function refreshChecklistState() {
  const stored = await chrome.storage.local.get({
    [QUICK_TEST_STATUS_KEY]: null,
    [VISION_TEST_STATUS_KEY]: null
  });
  renderChecklistState(deriveChecklistState(
    getCurrentFormConfig(),
    stored[QUICK_TEST_STATUS_KEY],
    stored[VISION_TEST_STATUS_KEY]
  ));
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
  await populateTemplateSelect(config.activeTemplateId);
  await refreshChecklistState();

  if (config.apiBaseUrl && config.apiKey && config.apiModel) {
    await showSummary(config);
  }
}

async function saveConfig() {
  hideBanner(configStatusBanner);

  const config = trimConfig({
    apiBaseUrl: baseUrlInput.value,
    apiKey: apiKeyInput.value,
    apiModel: modelInput.value,
    activeTemplateId: templateSelect.value
  });
  const maxImageSide = Math.min(4096, Math.max(512, Number(maxImageSideInput.value) || 2048));
  const jpegQuality = Math.min(0.95, Math.max(0.4, Number(jpegQualityInput.value) || 0.85));

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

/* ── Connection test ───────────────────────────────────── */

function createTestErrorInfo(type, title, cause, nextSteps, safetyNote, rawStatus) {
  return { type, title, cause, nextSteps, safetyNote: safetyNote || '', rawStatus: rawStatus || null };
}

function classifyApiTestError({ response, error, mode, quickPassed }) {
  if (error && error.name === 'AbortError') {
    return createTestErrorInfo('timeout', '请求超时', '模型服务响应时间过长，或网络连接不稳定。', ['稍后重试。', '检查模型服务状态。', '视觉测试时可尝试更快的 vision-capable model。'], '超时请求可能已经到达你的模型服务，请留意服务商计费规则。');
  }
  if (error) {
    return createTestErrorInfo('network', '网络不可达', '浏览器无法访问你填写的 Base URL，或本地模型服务没有启动。', ['检查 Base URL 是否正确。', '如果使用 Ollama，请确认本地服务正在运行。', '如果是远程服务，请确认网络和浏览器权限。'], '请求会发送到你配置的 Base URL；请只使用可信服务。');
  }
  if (!response) {
    return createTestErrorInfo('unknown', '测试失败', '没有收到可识别的响应。', ['重新运行测试。', '检查 Provider 文档中的 Base URL 和模型名。'], '不要把 API Key 或完整错误响应贴到公开 issue。');
  }
  if (response.status === 401 || response.status === 403) {
    return createTestErrorInfo('auth', '鉴权失败', 'API Key、账号权限或模型权限不正确。', ['检查 API Key 是否复制完整。', '确认账号有权访问当前模型。', '确认 Base URL 属于你信任的服务。'], 'API Key 只保存在本地浏览器，但会随测试请求发送到你配置的 Base URL。', response.status);
  }
  if (response.status === 404) {
    return createTestErrorInfo('not_found', '接口或模型不存在', 'Base URL、/chat/completions 路径或 Model 名称可能不正确。', ['检查 Base URL 是否应以 /v1 结尾。', '确认模型名称与服务商控制台一致。', '如果你已填写完整 /chat/completions，请确认路径没有重复。'], '', response.status);
  }
  if (response.status === 429) {
    return createTestErrorInfo('rate_limit', '额度或限速', '服务商返回额度不足、限速或请求过快。', ['检查账号余额或额度。', '稍后重试。', '换用可用模型或服务商。'], '测试请求可能产生少量费用。', response.status);
  }
  if (mode === 'vision' && quickPassed) {
    return createTestErrorInfo('vision_unsupported', '模型可能不支持图片输入', '文本测试可用，但视觉测试失败，当前模型可能不接受 image_url 输入。', ['换用支持视觉输入的模型。', '查看服务商文档确认 vision 能力。', '确认请求格式为 OpenAI-compatible vision。'], '视觉测试会发送一张极小测试图到你配置的模型服务。', response.status);
  }
  return createTestErrorInfo('unknown', `HTTP ${response.status}`, '模型服务返回了未分类的错误。', ['检查 Base URL、Model 和服务商状态。', '查看服务商控制台中的错误说明。'], '不要公开粘贴包含 Key、图片或业务背景的原始响应。', response.status);
}

function showConfigErrorInfo(info) {
  configStatusBanner.hidden = false;
  configStatusBanner.className = 'status-banner status-banner--error status-banner--detailed';
  configStatusBanner.innerHTML = ICONS.error;
  const wrapper = document.createElement('div');
  const title = document.createElement('strong');
  title.textContent = info.title;
  const cause = document.createElement('p');
  cause.textContent = info.cause;
  const list = document.createElement('ol');
  info.nextSteps.forEach(step => {
    const item = document.createElement('li');
    item.textContent = step;
    list.appendChild(item);
  });
  wrapper.append(title, cause, list);
  if (info.safetyNote) {
    const safety = document.createElement('p');
    safety.className = 'field-hint';
    safety.textContent = info.safetyNote;
    wrapper.appendChild(safety);
  }
  configStatusBanner.appendChild(wrapper);
}

async function saveMinimalTestState(kind, result) {
  const status = {
    success: Boolean(result.success),
    type: result.type || (result.success ? 'success' : 'unknown'),
    rawStatus: result.rawStatus || null,
    testedAt: new Date().toISOString(),
    provider: providerPresetSelect.value,
    model: modelInput.value.trim()
  };
  await chrome.storage.local.set({ [kind]: status });
  await refreshChecklistState();
}

async function testConnection() {
  hideBanner(configStatusBanner);
  const config = getCurrentFormConfig();
  if (!config.apiBaseUrl || !config.apiKey || !config.apiModel) {
    showConfigStatus('请先填写完整的 AI Base URL、API Key 和 Model。', 'warning');
    return false;
  }
  const urlError = validateApiBaseUrl(config.apiBaseUrl);
  if (urlError) {
    showConfigStatus(urlError, 'error');
    return false;
  }
  quickTestButton.disabled = true;
  quickTestButton.textContent = '快速测试中...';
  try {
    const response = await fetch(buildChatCompletionsUrl(config.apiBaseUrl), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.apiModel,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 5
      })
    });
    if (response.ok) {
      showConfigStatus('快速测试成功：API Key、Base URL 和文本请求可用。', 'success');
      await saveMinimalTestState(QUICK_TEST_STATUS_KEY, { success: true, type: 'success', rawStatus: response.status });
      return true;
    }
    const info = classifyApiTestError({ response, mode: 'quick' });
    showConfigErrorInfo(info);
    await saveMinimalTestState(QUICK_TEST_STATUS_KEY, { success: false, type: info.type, rawStatus: info.rawStatus });
    return false;
  } catch (error) {
    const info = classifyApiTestError({ error, mode: 'quick' });
    showConfigErrorInfo(info);
    await saveMinimalTestState(QUICK_TEST_STATUS_KEY, { success: false, type: info.type, rawStatus: info.rawStatus });
    return false;
  } finally {
    quickTestButton.disabled = false;
    quickTestButton.textContent = '快速测试';
  }
}

async function runQuickTest() {
  await testConnection();
}

async function runVisionTest() {
  if (!window.confirm('将发送一次极小测试图片到你的 API，可能产生少量费用。是否继续？')) return;
  hideBanner(configStatusBanner);
  const config = getCurrentFormConfig();
  if (!config.apiBaseUrl || !config.apiKey || !config.apiModel) {
    showConfigStatus('请先填写完整的 AI Base URL、API Key 和 Model。', 'warning');
    return;
  }
  const quickState = await chrome.storage.local.get({ [QUICK_TEST_STATUS_KEY]: null });
  const quickPassed = Boolean(quickState[QUICK_TEST_STATUS_KEY] && quickState[QUICK_TEST_STATUS_KEY].success);
  const tinyJpeg = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAAgACADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/ASP/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/ASP/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Ap//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEP/EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8QH//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8QH//EABQQAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8QH//Z';
  visionTestButton.disabled = true;
  visionTestButton.textContent = '视觉测试中...';
  try {
    const response = await fetch(buildChatCompletionsUrl(config.apiBaseUrl), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.apiModel,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Reply with OK if you can see this test image.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${tinyJpeg}` } }
          ]
        }],
        max_tokens: 8
      })
    });
    if (response.ok) {
      showConfigStatus('视觉测试成功：模型可接收图片输入。', 'success');
      await saveMinimalTestState(VISION_TEST_STATUS_KEY, { success: true, type: 'success', rawStatus: response.status });
    } else {
      const info = classifyApiTestError({ response, mode: 'vision', quickPassed });
      showConfigErrorInfo(info);
      await saveMinimalTestState(VISION_TEST_STATUS_KEY, { success: false, type: info.type, rawStatus: info.rawStatus });
    }
  } catch (error) {
    const info = classifyApiTestError({ error, mode: 'vision', quickPassed });
    showConfigErrorInfo(info);
    await saveMinimalTestState(VISION_TEST_STATUS_KEY, { success: false, type: info.type, rawStatus: info.rawStatus });
  } finally {
    visionTestButton.disabled = false;
    visionTestButton.textContent = '视觉测试';
  }
}

function buildChatCompletionsUrl(baseUrl) {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  if (/\/chat\/completions$/i.test(trimmed)) return trimmed;
  return `${trimmed}/chat/completions`;
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
  chrome.storage.local.remove(['apiBaseUrl', 'apiKey', 'apiModel', 'activeTemplateId', QUICK_TEST_STATUS_KEY, VISION_TEST_STATUS_KEY]).then(() => {
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

quickTestButton.addEventListener('click', () => {
  runQuickTest().catch(error => showConfigStatus(`快速测试失败：${error.message}`, 'error'));
});

visionTestButton.addEventListener('click', () => {
  runVisionTest().catch(error => showConfigStatus(`视觉测试失败：${error.message}`, 'error'));
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

// 清除输入框错误样式
[baseUrlInput, apiKeyInput, modelInput].forEach(input => {
  input.addEventListener('input', () => {
    input.classList.remove('input-error');
    refreshChecklistState().catch(() => {});
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
