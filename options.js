const DEFAULT_CONFIG = {
  apiBaseUrl: '',
  apiKey: '',
  apiModel: ''
};

/* ── DOM refs ──────────────────────────────────────────── */

const form = document.getElementById('options-form');
const baseUrlInput = document.getElementById('api-base-url');
const apiKeyInput = document.getElementById('api-key');
const modelInput = document.getElementById('api-model');
const toggleApiKeyButton = document.getElementById('toggle-api-key');
const resetFormButton = document.getElementById('reset-form');
const testConnectionButton = document.getElementById('test-connection');
const editConfigButton = document.getElementById('edit-config');
const grantImageButton = document.getElementById('grant-image-permission');

const configSummary = document.getElementById('config-summary');
const summaryUrl = document.getElementById('summary-url');
const summaryModel = document.getElementById('summary-model');

const permImageDesc = document.getElementById('perm-image-desc');
const permImageBadge = document.getElementById('perm-image-badge');
const permStatusBanner = document.getElementById('perm-status-banner');
const configStatusBanner = document.getElementById('config-status-banner');

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

/* ── Config summary ────────────────────────────────────── */

function showSummary(config) {
  if (!config.apiBaseUrl || !config.apiModel) {
    configSummary.hidden = true;
    form.hidden = false;
    return;
  }
  summaryUrl.textContent = config.apiBaseUrl;
  summaryModel.textContent = config.apiModel;
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

/* ── Permission request ────────────────────────────────── */

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

/* ── Trim helper ───────────────────────────────────────── */

function trimConfig(config) {
  return {
    apiBaseUrl: String(config.apiBaseUrl || '').trim(),
    apiKey: String(config.apiKey || '').trim(),
    apiModel: String(config.apiModel || '').trim()
  };
}

/* ── Load / Save ───────────────────────────────────────── */

async function loadConfig() {
  const stored = await chrome.storage.local.get(DEFAULT_CONFIG);
  const config = trimConfig(stored);
  baseUrlInput.value = config.apiBaseUrl;
  apiKeyInput.value = config.apiKey;
  modelInput.value = config.apiModel;

  if (config.apiBaseUrl && config.apiKey && config.apiModel) {
    showSummary(config);
  }
}

async function saveConfig() {
  hideBanner(configStatusBanner);

  const config = trimConfig({
    apiBaseUrl: baseUrlInput.value,
    apiKey: apiKeyInput.value,
    apiModel: modelInput.value
  });

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

  await chrome.storage.local.set(config);
  showConfigStatus('设置已保存。', 'success');
  showSummary(config);
}

/* ── Connection test ───────────────────────────────────── */

async function testConnection() {
  hideBanner(configStatusBanner);

  const config = trimConfig({
    apiBaseUrl: baseUrlInput.value,
    apiKey: apiKeyInput.value,
    apiModel: modelInput.value
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

function buildChatCompletionsUrl(baseUrl) {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  if (/\/chat\/completions$/i.test(trimmed)) return trimmed;
  return `${trimmed}/chat/completions`;
}

/* ── Event listeners ───────────────────────────────────── */

form.addEventListener('submit', event => {
  event.preventDefault();
  saveConfig().catch(error => {
    showConfigStatus(`保存失败：${error.message}`, 'error');
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
  baseUrlInput.classList.remove('input-error');
  hideBanner(configStatusBanner);
  chrome.storage.local.remove(['apiBaseUrl', 'apiKey', 'apiModel']).then(() => {
    showConfigStatus('设置已清空。', 'info');
    hideSummary();
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

// 清除输入框错误样式
[baseUrlInput, apiKeyInput, modelInput].forEach(input => {
  input.addEventListener('input', () => {
    input.classList.remove('input-error');
  });
});

/* ── Init ──────────────────────────────────────────────── */

loadConfig().catch(error => {
  showConfigStatus(`加载设置失败：${error.message}`, 'error');
});

refreshPermissionStatus().catch(() => {});
