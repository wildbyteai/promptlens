const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

const manifest = readJson('manifest.json');
const zhCatalog = readJson('_locales/zh_CN/messages.json');
const enCatalog = readJson('_locales/en/messages.json');
const resultHtml = read('result.html');
const resultJs = read('result.js');
const backgroundJs = read('background.js');
const bridgeJs = fs.existsSync(path.join(root, 'chatgpt-bridge.js')) ? read('chatgpt-bridge.js') : '';
const privacy = read('docs/chrome-web-store/privacy-practices.md');
const security = read('SECURITY.md');

assert.ok(
  Array.isArray(manifest.optional_host_permissions) && manifest.optional_host_permissions.includes('https://chatgpt.com/*'),
  'manifest must request chatgpt.com only as an optional host permission'
);

assert.ok(
  !Array.isArray(manifest.host_permissions) || !manifest.host_permissions.some(value => /chatgpt\.com|<all_urls>/.test(value)),
  'manifest must not add default ChatGPT or broad host_permissions'
);

assert.ok(
  !manifest.permissions.includes('downloads'),
  'auto-upload must not add downloads permission'
);

assert.match(resultHtml, /id="chatgpt-send"/);
assert.match(resultHtml, /尝试发送到 ChatGPT/);
assert.match(resultHtml, /实验功能/);
assert.match(resultHtml, /不会读取或保存 ChatGPT 网页端回复/);

for (const token of [
  'PROMPTLENS_CHATGPT_PAYLOAD_SAVE',
  'PROMPTLENS_CHATGPT_STATUS',
  'requestChatGptPermission',
  'sendToChatGpt'
]) {
  assert.match(resultJs, new RegExp(token), `result.js missing ${token}`);
}

for (const token of [
  'PROMPTLENS_CHATGPT_PAYLOAD_SAVE',
  'PROMPTLENS_CHATGPT_PAYLOAD_GET',
  'PROMPTLENS_CHATGPT_STATUS',
  'injectChatGptBridge',
  'cleanupExpiredChatGptPayloads'
]) {
  assert.match(backgroundJs, new RegExp(token), `background.js missing ${token}`);
}

// Task 3: background payload storage and injection orchestration
assert.match(backgroundJs, /const CHATGPT_PAYLOAD_PREFIX = 'chatgpt-transfer:'/);
assert.match(backgroundJs, /const CHATGPT_PAYLOAD_TTL_MS = 15 \* 60 \* 1000/);
assert.match(backgroundJs, /function getChatGptPayload\(jobId\)[\s\S]*chrome\.storage\.session\.get\(\{ \[key\]: null \}\)[\s\S]*isFreshChatGptPayload/);
assert.doesNotMatch(backgroundJs, /function getChatGptPayload\(jobId\)[\s\S]*chrome\.storage\.session\.remove\(key\)[\s\S]*return payload/);
assert.match(backgroundJs, /function clearChatGptPayload\(jobId\)[\s\S]*chrome\.storage\.session\.remove\(chatGptPayloadKey\(jobId\)\)/);
assert.match(backgroundJs, /status === 'success_instruction_and_image'[\s\S]*clearChatGptPayload\(jobId\)/);
assert.match(backgroundJs, /chrome\.tabs\.create\(\{ url: `https:\/\/chatgpt\.com\/\?promptlensJob=\$\{encodeURIComponent\(jobId\)\}` \}\)/);
assert.match(backgroundJs, /chrome\.scripting\.executeScript\(\{[\s\S]*files: \['chatgpt-bridge\.js'\]/);

for (const token of [
  'PromptLensChatGptBridge',
  'fillInstruction',
  'attachImage',
  'success_instruction_and_image',
  'partial_success_instruction_only',
  'input_not_found',
  'image_input_not_found'
]) {
  assert.match(bridgeJs, new RegExp(token), `chatgpt-bridge.js missing ${token}`);
}

for (const source of [privacy, security]) {
  assert.match(source, /chatgpt\.com/i);
  assert.match(source, /不读取 ChatGPT 回复|does not read ChatGPT replies/i);
  assert.match(source, /不自动发送|does not automatically send/i);
}

// Task 5: result.js status mapping for fallback behavior
const statusMessageKeys = {
  permission_denied: 'chatgptAssistPermissionDenied',
  payload_missing: 'chatgptAssistPayloadExpired',
  tab_open_failed: 'chatgptAssistTabOpenFailed',
  script_injection_failed: 'chatgptAssistConnectFailed',
  input_not_found: 'chatgptAssistInputNotFound',
  instruction_failed: 'chatgptAssistInstructionFailed',
  image_input_not_found: 'chatgptAssistImageInputNotFound',
  image_attach_failed: 'chatgptAssistImageAttachFailed',
  partial_success_instruction_only: 'chatgptAssistImageAttachFailed',
  success_instruction_only: 'chatgptAssistInstructionOnly',
  success_instruction_and_image: 'chatgptAssistSuccess'
};

for (const [status, key] of Object.entries(statusMessageKeys)) {
  assert.match(resultJs, new RegExp(status), `result.js missing user-facing mapping for ${status}`);
  assert.match(resultJs, new RegExp(`${status}: \\{ tone: '[^']+', key: '${key}' \\}`), `result.js maps ${status} to the wrong locale key`);
  assert.ok(zhCatalog[key], `Chinese catalog missing ChatGPT status key: ${key}`);
  assert.ok(enCatalog[key], `English catalog missing ChatGPT status key: ${key}`);
}

for (const catalog of [zhCatalog, enCatalog]) {
  assert.match(catalog.chatgptAssistPermissionNeeded.message, /不会自动发送|does not read responses or send automatically/i);
  assert.match(catalog.chatgptAssistAutoFailed.message, /手动上传|manual upload/i);
}

// Task 6: result.js must consume chatgpt-status:* from session storage after sendToChatGpt
assert.match(
  resultJs,
  /chatgpt-status:/,
  'result.js must define or reference the chatgpt-status: storage key prefix for polling bridge results'
);
assert.match(
  resultJs,
  /chrome\.storage\.session\.get/,
  'result.js must read chatgpt-status:* from chrome.storage.session to consume bridge results'
);
assert.match(
  resultJs,
  /getChatGptStatusMessage\(/,
  'result.js must call getChatGptStatusMessage to map bridge status to user-facing message'
);
assert.match(
  resultJs,
  /getChatGptStatusMessage[\s\S]{0,160}showLocalizedAssistStatus\(msg\.key, msg\.tone\)/,
  'result.js must pipe the localized ChatGPT status key into showLocalizedAssistStatus'
);

console.log('chatgpt auto-upload static tests passed');
