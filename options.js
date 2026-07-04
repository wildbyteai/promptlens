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
const testConnectionButton = document.getElementById('test-connection');
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

async function testConnection() {
  hideBanner(configStatusBanner);

  const config = trimConfig({
    apiBaseUrl: baseUrlInput.value,
    apiKey: apiKeyInput.value,
    apiModel: modelInput.value,
    activeTemplateId: templateSelect.value
  });

  if (!config.apiBaseUrl || !config.apiKey || !config.apiModel) {
    showConfigStatus('请先填写完整的 AI Base URL、API Key 和 Model。', 'warning');
    return;
  }

  const urlError = validateApiBaseUrl(config.apiBaseUrl);
  if (urlError) {
    showConfigStatus(urlError, 'error');
    return;
  }

  testConnectionButton.disabled = true;
  testConnectionButton.textContent = '测试中...';

  try {
    const url = buildChatCompletionsUrl(config.apiBaseUrl);
    const response = await fetch(url, {
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
      showConfigStatus('连接成功！API 响应正常。', 'success');
    } else if (response.status === 401 || response.status === 403) {
      showConfigStatus('连接失败：API Key 或权限不正确。', 'error');
    } else {
      showConfigStatus(`连接失败：HTTP ${response.status}。请检查 Base URL、模型名称或服务状态。`, 'error');
    }
  } catch (error) {
    if (error.message && error.message.includes('Failed to fetch')) {
      showConfigStatus('连接失败：无法访问该 URL。请检查地址是否正确。', 'error');
    } else {
      showConfigStatus(`连接失败：${error.message}`, 'error');
    }
  } finally {
    testConnectionButton.disabled = false;
    testConnectionButton.textContent = '测试连接';
  }
}

async function runQuickTest() {
  await testConnection();
}

async function runVisionTest() {
  if (!window.confirm('将发送一次极小测试图片到你的 API，可能产生少量费用。是否继续？')) return;
  hideBanner(configStatusBanner);
  const config = trimConfig({
    apiBaseUrl: baseUrlInput.value,
    apiKey: apiKeyInput.value,
    apiModel: modelInput.value,
    activeTemplateId: templateSelect.value
  });
  if (!config.apiBaseUrl || !config.apiKey || !config.apiModel) {
    showConfigStatus('请先填写完整的 AI Base URL、API Key 和 Model。', 'warning');
    return;
  }
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
    } else if (response.status === 401 || response.status === 403) {
      showConfigStatus('视觉测试失败：API Key 或模型权限不正确。', 'error');
    } else {
      showConfigStatus(`视觉测试失败：HTTP ${response.status}。请检查模型是否支持图片输入。`, 'error');
    }
  } catch (error) {
    showConfigStatus(`视觉测试失败：${error.message}`, 'error');
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

if (testConnectionButton) {
  testConnectionButton.addEventListener('click', () => {
    testConnection().catch(error => {
      showConfigStatus(`测试失败：${error.message}`, 'error');
    });
  });
}

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
loadFirstSuccessCollapsedState().catch(() => {});

loadConfig().catch(error => {
  showConfigStatus(`加载设置失败：${error.message}`, 'error');
});

refreshPermissionStatus().catch(() => {});
