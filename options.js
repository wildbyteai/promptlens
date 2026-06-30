const DEFAULT_CONFIG = {
  apiBaseUrl: '',
  apiKey: '',
  apiModel: ''
};

const form = document.getElementById('options-form');
const baseUrlInput = document.getElementById('api-base-url');
const apiKeyInput = document.getElementById('api-key');
const modelInput = document.getElementById('api-model');
const statusEl = document.getElementById('options-status');
const toggleApiKeyButton = document.getElementById('toggle-api-key');
const resetFormButton = document.getElementById('reset-form');
const grantImageButton = document.getElementById('grant-image-permission');

function setStatus(message, tone = 'neutral') {
  statusEl.textContent = message;
  statusEl.dataset.tone = tone;
}

function trimConfig(config) {
  return {
    apiBaseUrl: String(config.apiBaseUrl || '').trim(),
    apiKey: String(config.apiKey || '').trim(),
    apiModel: String(config.apiModel || '').trim()
  };
}

/**
 * 校验 API Base URL：
 * - 必须是合法 URL
 * - 必须为 https，允许 localhost / 127.0.0.1 使用 http
 * @returns {string|null} 错误信息，或 null 表示校验通过
 */
function validateApiBaseUrl(urlString) {
  let url;
  try {
    url = new URL(urlString);
  } catch {
    return 'AI Base URL 格式无效，请输入合法 URL。';
  }
  if (url.protocol === 'https:') {
    return null;
  }
  if (url.protocol === 'http:') {
    const hostname = url.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return null;
    }
    return 'AI Base URL 必须使用 https（本地开发可使用 http://localhost 或 http://127.0.0.1）。';
  }
  return 'AI Base URL 必须使用 http 或 https 协议。';
}

/**
 * 为 API Base URL 的 origin 动态请求 optional_host_permissions。
 */
async function requestApiOriginPermission(apiBaseUrl) {
  try {
    const url = new URL(apiBaseUrl);
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

async function loadConfig() {
  const stored = await chrome.storage.local.get(DEFAULT_CONFIG);
  const config = trimConfig(stored);
  baseUrlInput.value = config.apiBaseUrl;
  apiKeyInput.value = config.apiKey;
  modelInput.value = config.apiModel;
  setStatus('设置已加载。');
}

async function saveConfig() {
  const config = trimConfig({
    apiBaseUrl: baseUrlInput.value,
    apiKey: apiKeyInput.value,
    apiModel: modelInput.value
  });

  if (!config.apiBaseUrl) {
    setStatus('请填写 AI Base URL。', 'error');
    baseUrlInput.focus();
    return;
  }

  const urlError = validateApiBaseUrl(config.apiBaseUrl);
  if (urlError) {
    setStatus(urlError, 'error');
    baseUrlInput.focus();
    return;
  }

  if (!config.apiKey) {
    setStatus('请填写 API Key。', 'error');
    apiKeyInput.focus();
    return;
  }
  if (!config.apiModel) {
    setStatus('请填写 Model。', 'error');
    modelInput.focus();
    return;
  }

  // 动态请求 API origin 的网络权限
  const granted = await requestApiOriginPermission(config.apiBaseUrl);
  if (!granted) {
    setStatus('需要授权 API 地址的网络权限才能发送请求。', 'error');
    return;
  }

  await chrome.storage.local.set(config);
  setStatus('设置已保存。', 'success');
}

form.addEventListener('submit', event => {
  event.preventDefault();
  saveConfig().catch(error => {
    setStatus(`保存失败：${error.message}`, 'error');
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
  chrome.storage.local.remove(['apiBaseUrl', 'apiKey', 'apiModel']).then(() => {
    setStatus('设置已清空。');
  }).catch(error => {
    setStatus(`清空失败：${error.message}`, 'error');
  });
});

grantImageButton.addEventListener('click', async () => {
  try {
    const granted = await chrome.permissions.request({ origins: ['<all_urls>'] });
    if (granted) {
      setStatus('图片读取权限已授权。现在可以右键分析任意网站的图片。', 'success');
    } else {
      setStatus('权限请求被拒绝。如需分析远程图片，请重新点击授权，或使用"框选截图并分析"。', 'error');
    }
  } catch (error) {
    setStatus(`授权失败：${error.message}`, 'error');
  }
});

loadConfig().catch(error => {
  setStatus(`加载设置失败：${error.message}`, 'error');
});
