# PromptLens v0.6.0 ChatGPT Plus Assist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a ChatGPT Plus Assist mode so users with ChatGPT Plus / Pro but no API key can prepare images and instructions locally, then finish analysis manually in ChatGPT web.

**Architecture:** Add one persisted mode field, `analysisMode: 'api' | 'chatgpt_assist'`, defaulting to existing API behavior. API mode keeps the current model-call/result/history flow. ChatGPT Assist mode reuses the existing image preparation pipeline, skips API calls/history writes, and renders a local assist panel with download/copy/open actions.

**Tech Stack:** Chrome Extension Manifest V3, Vanilla JavaScript, Vanilla CSS, `chrome.storage.local`, existing IndexedDB history helper, no npm, no build step, no backend.

## Global Constraints

- Chrome MV3 only; keep `manifest_version: 3` and the current extension CSP.
- Vanilla JavaScript / CSS only; do not introduce npm, TypeScript, React, Vue, Svelte, bundlers, remote scripts, remote fonts, or new build tools.
- No backend and no telemetry.
- Do not add `https://chatgpt.com/*` permission, do not inject into ChatGPT, and do not read ChatGPT DOM.
- Do not automatically upload images to ChatGPT, click Send, read ChatGPT replies, or parse ChatGPT replies back into PromptLens.
- Do not add `downloads` permission; image download must use Blob + Object URL + `<a download>`.
- ChatGPT Assist mode must not save ChatGPT replies or create history records.
- API mode must remain backward-compatible and default for existing users.
- API fields `apiBaseUrl`, `apiKey`, and `apiModel` must not be cleared when switching modes.
- Dynamic user/model/provider text must be inserted with `textContent`, `.value`, or `createElement`, not unsafe `innerHTML`.
- Do not change the fixed JSON schema used by API mode.
- `<all_urls>` remains optional; do not add default host permissions.

---

## File Structure

- `options.html`: Add analysis mode controls and an API-mode hint; rename API config heading.
- `options.js`: Persist `analysisMode`, branch save validation by mode, update First Success state, and update summary display.
- `result.html`: Add hidden ChatGPT Assist panel DOM.
- `result.js`: Load `analysisMode`, branch `analyzeInput()`, build assist instructions, render assist panel, download prepared JPEG, copy instruction, and open ChatGPT.
- `styles.css`: Add styles for analysis mode cards and ChatGPT Assist panel.
- `README.md`, `README.zh-CN.md`, `README.zh-TW.md`: Document API mode vs ChatGPT Plus Assist mode.
- `SECURITY.md`: Document assist-mode privacy and no new permissions.
- `site/index.html`: Add website copy and bump JSON-LD version when releasing.
- `manifest.json`: Bump version to `0.6.0` during release task only.
- `tests/site-seo-meta.test.js`: Bump expected `softwareVersion` to `0.6.0` during release task only.

---

### Task 1: Add `analysisMode` Storage and Settings UI

**Files:**
- Modify: `options.html`
- Modify: `options.js`
- Modify: `styles.css`

**Interfaces:**
- Produces: `analysisMode` stored in `chrome.storage.local`, with values `'api'` or `'chatgpt_assist'`.
- Produces: `getAnalysisMode()` in `options.js`, returning a sanitized mode.
- Consumes: existing `DEFAULT_CONFIG`, `trimConfig()`, `loadConfig()`, `saveConfig()`, `deriveChecklistState()`.

- [ ] **Step 1: Add the settings UI in `options.html` after the First Success card**

Insert this section after `</section>` for `#first-success-card` and before the permissions card:

```html
      <section class="surface-card analysis-mode-card" aria-labelledby="analysis-mode-title">
        <div class="section-heading">
          <div>
            <h2 id="analysis-mode-title">分析方式</h2>
            <p>选择自动调用 API，或使用 ChatGPT Plus 网页端手动完成分析。</p>
          </div>
        </div>
        <div class="analysis-mode-options" role="radiogroup" aria-labelledby="analysis-mode-title">
          <label class="analysis-mode-option">
            <input id="analysis-mode-api" name="analysisMode" type="radio" value="api" checked>
            <span>
              <strong>API 自动分析</strong>
              <small>使用你配置的 OpenAI-compatible Vision API，PromptLens 自动调用模型并展示结构化结果。</small>
            </span>
          </label>
          <label class="analysis-mode-option">
            <input id="analysis-mode-chatgpt" name="analysisMode" type="radio" value="chatgpt_assist">
            <span>
              <strong>ChatGPT Plus 辅助模式</strong>
              <small>不需要 API Key。PromptLens 准备图片和指令，你在 ChatGPT 网页端上传图片并粘贴指令。</small>
            </span>
          </label>
        </div>
        <div id="analysis-mode-note" class="first-success-note" hidden>
          <strong>当前模式：</strong>
          <span>ChatGPT Plus 辅助模式不会调用 API，也不会自动上传、发送或读取 ChatGPT 网页端回复。</span>
        </div>
      </section>
```

- [ ] **Step 2: Rename the API configuration heading in `options.html`**

Change:

```html
<h2 id="config-title">AI 服务配置</h2>
```

to:

```html
<h2 id="config-title">API 自动分析配置</h2>
```

Keep the existing paragraph, but append this sentence:

```html
<span id="api-config-mode-hint">选择 ChatGPT Plus 辅助模式时，这些 API 字段不是必填。</span>
```

The final paragraph should remain plain text/inline content inside the existing `<p>`.

- [ ] **Step 3: Add DOM refs and default config in `options.js`**

Update `DEFAULT_CONFIG`:

```js
const DEFAULT_CONFIG = {
  apiBaseUrl: '',
  apiKey: '',
  apiModel: '',
  activeTemplateId: window.PromptTemplates.DEFAULT_TEMPLATE_ID,
  analysisMode: 'api'
};
```

Add DOM refs after existing form refs:

```js
const analysisModeApiInput = document.getElementById('analysis-mode-api');
const analysisModeChatGptInput = document.getElementById('analysis-mode-chatgpt');
const analysisModeNote = document.getElementById('analysis-mode-note');
const apiConfigModeHint = document.getElementById('api-config-mode-hint');
```

- [ ] **Step 4: Add mode helpers in `options.js` after `trimConfig()`**

```js
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
}
```

Update `trimConfig(config)` to include:

```js
analysisMode: normalizeAnalysisMode(config.analysisMode)
```

- [ ] **Step 5: Load and save the selected mode in `options.js`**

In `loadConfig()`, after `syncProviderPresetFromUrl();`, add:

```js
renderAnalysisMode(config.analysisMode);
```

In `saveConfig()`, include the selected mode in `config`:

```js
analysisMode: getAnalysisMode()
```

- [ ] **Step 6: Branch `saveConfig()` validation by mode**

Wrap existing API field validation and `requestApiOriginPermission(config.apiBaseUrl)` in:

```js
if (config.analysisMode === 'api') {
  // existing apiBaseUrl/apiKey/apiModel validation and permission request
}
```

For `chatgpt_assist`, skip API required-field validation and skip API origin permission. Still save `apiBaseUrl`, `apiKey`, `apiModel`, `activeTemplateId`, `analysisMode`, `historyEnabled`, `maxImageSide`, and `jpegQuality`.

When API mode has missing fields, use this message for incomplete config:

```js
showConfigStatus('你已选择 API 自动分析，请填写完整的 AI Base URL、API Key 和 Model。', 'error');
```

- [ ] **Step 7: Add styles in `styles.css`**

Append:

```css
.analysis-mode-card {
  border-color: rgba(217, 119, 6, 0.22);
}

.analysis-mode-options {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.analysis-mode-option {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: start;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.58);
  cursor: pointer;
}

.analysis-mode-option:has(input:checked) {
  border-color: rgba(217, 119, 6, 0.5);
  background: rgba(255, 247, 237, 0.82);
}

.analysis-mode-option input {
  margin-top: 3px;
}

.analysis-mode-option strong,
.analysis-mode-option small {
  display: block;
}

.analysis-mode-option small {
  margin-top: 4px;
  color: var(--muted);
  line-height: 1.5;
}
```

- [ ] **Step 8: Add mode change listeners in `options.js`**

Before init:

```js
[analysisModeApiInput, analysisModeChatGptInput].forEach(input => {
  if (!input) return;
  input.addEventListener('change', () => {
    renderAnalysisMode(getAnalysisMode());
    refreshChecklistState().catch(() => {});
  });
});
```

- [ ] **Step 9: Run syntax check**

Run:

```bash
node --check options.js
```

Expected: exit 0, no output.

- [ ] **Step 10: Commit**

```bash
git add options.html options.js styles.css
git commit -m "feat: add analysis mode setting" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Adapt First Success and Settings Summary to Assist Mode

**Files:**
- Modify: `options.js`
- Modify: `options.html`

**Interfaces:**
- Consumes: `analysisMode` from Task 1.
- Produces: First Success state that treats `chatgpt_assist` as configured without API fields.

- [ ] **Step 1: Update `isCompleteConfig(config)` in `options.js`**

Replace:

```js
function isCompleteConfig(config) {
  return Boolean(config.apiBaseUrl && config.apiKey && config.apiModel);
}
```

with:

```js
function isCompleteConfig(config) {
  if (normalizeAnalysisMode(config.analysisMode) === 'chatgpt_assist') return true;
  return Boolean(config.apiBaseUrl && config.apiKey && config.apiModel);
}
```

- [ ] **Step 2: Update `getCurrentFormConfig()`**

Add:

```js
analysisMode: getAnalysisMode()
```

inside the object passed to `trimConfig()`.

- [ ] **Step 3: Update `deriveChecklistState(config)`**

Replace the function with:

```js
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
```

- [ ] **Step 4: Update First Success copy in `options.html`**

Change the promise paragraph to:

```html
<p class="first-success-promise">选择 API 自动分析或 ChatGPT Plus 辅助模式后，你就可以分析第一张图并带走结果。</p>
```

Change Step 1 text to:

```html
<strong>选择分析方式</strong>
<p>使用 API 自动分析，或选择 ChatGPT Plus 辅助模式准备图片和指令。</p>
```

Change Step 3 text to:

```html
<strong>带走结果</strong>
<p>API 模式可复制结构化结果；辅助模式请下载图片、复制指令并在 ChatGPT 中完成分析。</p>
```

- [ ] **Step 5: Update `showSummary(config)`**

In `showSummary(config)`, when mode is `chatgpt_assist`, set:

```js
summaryUrl.textContent = 'ChatGPT Plus 辅助模式';
summaryModel.textContent = '不需要 API Key';
```

For API mode, keep existing values.

- [ ] **Step 6: Run syntax check**

```bash
node --check options.js
```

Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add options.html options.js
git commit -m "feat: adapt onboarding for assist mode" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Add Result Page Assist Panel Markup and Styles

**Files:**
- Modify: `result.html`
- Modify: `styles.css`

**Interfaces:**
- Produces DOM refs used by Task 5: `chatgpt-assist-card`, `chatgpt-download-image`, `chatgpt-copy-instruction`, `chatgpt-open`, `chatgpt-copy-open`, `chatgpt-instruction-output`, `chatgpt-assist-status`.

- [ ] **Step 1: Add assist panel markup in `result.html`**

Insert after the existing image preview / before API result content area, choosing the nearest location where `result.js` can hide/show it without moving existing result sections:

```html
      <section id="chatgpt-assist-card" class="surface-card chatgpt-assist-card" hidden aria-labelledby="chatgpt-assist-title">
        <div class="section-heading">
          <div>
            <span class="card-kicker">ChatGPT Plus Assist</span>
            <h2 id="chatgpt-assist-title">用 ChatGPT Plus 分析这张图</h2>
            <p>PromptLens 已在本地准备好图片和分析指令。请在 ChatGPT 网页端上传图片并粘贴指令。</p>
          </div>
        </div>
        <ol class="assist-steps">
          <li>下载处理后的图片。</li>
          <li>复制分析指令。</li>
          <li>打开 ChatGPT，上传图片并粘贴指令。</li>
          <li>在 ChatGPT 中发送并保留结果。</li>
        </ol>
        <div class="button-row assist-actions">
          <button id="chatgpt-download-image" type="button" class="secondary-button compact-button">下载图片</button>
          <button id="chatgpt-copy-instruction" type="button" class="secondary-button compact-button">复制指令</button>
          <button id="chatgpt-open" type="button" class="secondary-button compact-button">打开 ChatGPT</button>
          <button id="chatgpt-copy-open" type="button" class="primary-button compact-button">复制指令并打开 ChatGPT</button>
        </div>
        <div id="chatgpt-assist-status" class="status-banner" hidden></div>
        <label class="field-row chatgpt-instruction-field">
          <span class="field-label">ChatGPT 分析指令</span>
          <textarea id="chatgpt-instruction-output" rows="12" readonly></textarea>
          <span class="field-hint">辅助模式不会读取或保存 ChatGPT 网页端回复。如需保留结果，请在 ChatGPT 中复制或导出。</span>
        </label>
        <div class="first-success-note">
          <strong>隐私边界：</strong>
          <span>PromptLens 不会把辅助模式图片发送给 API 或自有后端。你主动上传到 ChatGPT 后，图片和指令受 OpenAI 的隐私政策、账号设置和使用限制约束。</span>
        </div>
      </section>
```

- [ ] **Step 2: Add DOM-compatible styles to `styles.css`**

Append:

```css
.chatgpt-assist-card {
  border-color: rgba(37, 99, 235, 0.22);
}

.assist-steps {
  margin: 16px 0;
  padding-left: 22px;
  color: var(--text);
  line-height: 1.65;
}

.assist-actions {
  margin: 18px 0;
}

.chatgpt-instruction-field textarea {
  min-height: 260px;
  resize: vertical;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  line-height: 1.55;
}

@media (max-width: 640px) {
  .assist-actions {
    align-items: stretch;
  }

  .assist-actions .compact-button {
    width: 100%;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add result.html styles.css
git commit -m "feat: add ChatGPT assist result panel" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Add Assist Instruction Builder

**Files:**
- Modify: `result.js`

**Interfaces:**
- Produces: `buildChatGptAssistInstruction(template, businessContext = '')`.
- Consumes: template object from `window.PromptTemplates.getTemplateById()`.

- [ ] **Step 1: Add helper functions near `buildReversePromptInstruction()`**

Insert before `buildReversePromptInstruction()`:

```js
function isMarketingTemplate(template) {
  return template && template.id === 'visual_marketing';
}

function isCustomTemplate(template) {
  return template && !template.builtIn;
}

function buildChatGptAssistInstruction(template, businessContext = '') {
  const context = String(businessContext || '').trim();
  if (isMarketingTemplate(template)) {
    return [
      '请分析我上传的这张商业视觉图。请严格基于图片可见内容，并结合我提供的业务背景。',
      '',
      '业务背景：',
      context || '未提供，请只基于图片可见内容判断。',
      '',
      '请输出以下结构：',
      '1. 老板能看懂的摘要',
      '2. 画面内容与风格描述',
      '3. 视觉营销诊断',
      '4. 目标人群与卖点判断',
      '5. 低成本改图建议',
      '6. 可交给设计师 / 投放同事的 Markdown Brief',
      '7. 可直接复用的英文生成 Prompt',
      '',
      '如果业务背景为空，请只基于图片判断，不要编造品牌、价格、销量或投放数据。'
    ].join('\n');
  }

  const lines = [
    '请分析我上传的这张图片。请严格基于图片可见内容，不要编造不可见信息。',
    '',
    '请输出以下结构：',
    '1. 中文提示词',
    '2. English Prompt',
    '3. Tags',
    '4. Negative Prompt',
    '5. 可直接复制到图像生成工具的最终 Prompt',
    '6. 3 个不同风格变体',
    '',
    '如果存在不确定内容，请明确写出“不确定”。'
  ];

  if (isCustomTemplate(template) && template.instruction) {
    lines.push('', '以下是用户自定义分析要求：', String(template.instruction).trim(), '', '请严格基于图片可见内容回答，不要编造图片中不存在的信息。');
  }

  return lines.join('\n');
}
```

- [ ] **Step 2: Ensure built-in template detection matches repository data**

If `template.builtIn` does not exist in current `templates.js`, inspect the template object shape and use its actual field. Keep the same observable behavior: custom templates get the extra user instruction block, built-ins do not.

- [ ] **Step 3: Run syntax check**

```bash
node --check result.js
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add result.js
git commit -m "feat: build ChatGPT assist instructions" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: Branch Result Flow by `analysisMode`

**Files:**
- Modify: `result.js`

**Interfaces:**
- Consumes: `analysisMode` from `chrome.storage.local`.
- Consumes: `buildChatGptAssistInstruction()` from Task 4.
- Produces: `renderChatGptAssistPanel(preparedImage, instruction)` stub or full implementation delegated to Task 6.

- [ ] **Step 1: Update result-page `loadConfig()`**

Current `loadConfig()` validates API fields unconditionally. Change it to always return `analysisMode` and only require API fields when `analysisMode === 'api'`.

Use this shape:

```js
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
    throw new Error('请先在设置页选择 API 自动分析，并填写 AI Base URL、API Key 和 Model。');
  }

  const urlError = validateApiBaseUrl(apiBaseUrl);
  if (urlError) throw new Error(urlError);

  return { analysisMode, apiBaseUrl, apiKey, apiModel };
}
```

Preserve any existing URL validation logic in the current function.

- [ ] **Step 2: Add temporary panel renderer stub**

Before `analyzeInput()`, add:

```js
function renderChatGptAssistPanel(preparedImage, instruction) {
  currentResult = null;
  currentRawText = '';
  if (elements.chatgptAssistCard) {
    elements.chatgptAssistCard.hidden = false;
  }
  if (elements.chatgptInstructionOutput) {
    elements.chatgptInstructionOutput.value = instruction;
  }
}
```

Task 6 will replace/extend this with full UI behavior.

- [ ] **Step 3: Add DOM refs in `elements` object**

Add refs for Task 3 ids:

```js
chatgptAssistCard: document.getElementById('chatgpt-assist-card'),
chatgptDownloadImage: document.getElementById('chatgpt-download-image'),
chatgptCopyInstruction: document.getElementById('chatgpt-copy-instruction'),
chatgptOpen: document.getElementById('chatgpt-open'),
chatgptCopyOpen: document.getElementById('chatgpt-copy-open'),
chatgptInstructionOutput: document.getElementById('chatgpt-instruction-output'),
chatgptAssistStatus: document.getElementById('chatgpt-assist-status')
```

- [ ] **Step 4: Branch `analyzeInput(input)`**

After `const prepared = await prepareImage(input);` and after template loading / marketing context collection as appropriate, branch:

```js
const config = await loadConfig();
if (config.analysisMode === 'chatgpt_assist') {
  let businessContext = '';
  if (template.id === 'visual_marketing') {
    businessContext = await waitForMarketingContext();
    currentBusinessContext = businessContext;
  }
  const instruction = buildChatGptAssistInstruction(template, businessContext);
  renderChatGptAssistPanel(prepared, instruction);
  setLoading('图片和指令已准备好，请在 ChatGPT 中完成分析。', stepApi);
  return;
}
```

Then keep the existing API call path.

Important: Do not call `callVisionApi()` or history save in this branch.

- [ ] **Step 5: Run syntax check**

```bash
node --check result.js
```

Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add result.js
git commit -m "feat: route results to ChatGPT assist mode" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: Implement Assist Panel Actions

**Files:**
- Modify: `result.js`

**Interfaces:**
- Consumes: DOM refs added in Task 5.
- Produces: download, copy, open, and combo button behavior.

- [ ] **Step 1: Add module-level assist state**

Near other module-level variables:

```js
let currentAssistImage = null;
let currentAssistInstruction = '';
```

- [ ] **Step 2: Add Blob download helpers**

Add near `downloadText()`:

```js
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
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
```

Use an existing timestamp helper if present. If none exists, add:

```js
function makeTimestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\..+$/, '').replace('T', '-');
}
```

- [ ] **Step 3: Add assist status helper**

```js
function showAssistStatus(message, tone) {
  if (!elements.chatgptAssistStatus) return;
  elements.chatgptAssistStatus.hidden = false;
  elements.chatgptAssistStatus.className = `status-banner status-banner--${tone}`;
  elements.chatgptAssistStatus.textContent = message;
}
```

Use `textContent` only.

- [ ] **Step 4: Replace `renderChatGptAssistPanel()` implementation**

```js
function renderChatGptAssistPanel(preparedImage, instruction) {
  currentResult = null;
  currentRawText = '';
  currentAssistImage = preparedImage;
  currentAssistInstruction = instruction;

  if (elements.chatgptAssistCard) elements.chatgptAssistCard.hidden = false;
  if (elements.chatgptInstructionOutput) elements.chatgptInstructionOutput.value = instruction;
  if (elements.resultContent) elements.resultContent.hidden = true;
  if (elements.nextStepCard) elements.nextStepCard.hidden = true;
  showAssistStatus('图片和指令已准备好。请下载图片、复制指令，并在 ChatGPT 中完成分析。', 'success');
}
```

Adjust `elements.resultContent` and `elements.nextStepCard` names to match actual `elements` keys in current `result.js`.

- [ ] **Step 5: Add assist event listeners**

In the existing event listener setup area:

```js
if (elements.chatgptDownloadImage) {
  elements.chatgptDownloadImage.addEventListener('click', () => {
    if (!currentAssistImage) {
      showAssistStatus('图片还没有准备好。请重新分析。', 'warning');
      return;
    }
    try {
      downloadPreparedImage(currentAssistImage);
      showAssistStatus('图片已开始下载。', 'success');
    } catch (error) {
      showAssistStatus('图片下载失败。你可以重新打开结果页，或改用框选截图。', 'error');
    }
  });
}

if (elements.chatgptCopyInstruction) {
  elements.chatgptCopyInstruction.addEventListener('click', () => {
    copyTextWithFeedback(elements.chatgptCopyInstruction, currentAssistInstruction).catch(() => {
      showAssistStatus('浏览器阻止了自动复制。请手动选中下方指令复制。', 'warning');
    });
  });
}

function openChatGpt() {
  const url = 'https://chatgpt.com/';
  if (chrome && chrome.tabs && chrome.tabs.create) {
    chrome.tabs.create({ url });
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

if (elements.chatgptOpen) {
  elements.chatgptOpen.addEventListener('click', () => {
    try {
      openChatGpt();
      showAssistStatus('已打开 ChatGPT。请上传下载的图片并粘贴指令。', 'info');
    } catch (error) {
      showAssistStatus('无法自动打开 ChatGPT。请手动访问 https://chatgpt.com/。', 'error');
    }
  });
}

if (elements.chatgptCopyOpen) {
  elements.chatgptCopyOpen.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(currentAssistInstruction || '');
    } catch {
      showAssistStatus('浏览器阻止了自动复制。请手动选中下方指令复制。', 'warning');
    }
    try {
      openChatGpt();
    } catch {
      showAssistStatus('无法自动打开 ChatGPT。请手动访问 https://chatgpt.com/。', 'error');
    }
  });
}
```

- [ ] **Step 6: Run syntax check**

```bash
node --check result.js
```

Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add result.js
git commit -m "feat: add ChatGPT assist actions" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: Polish Result Loading and Assist-Mode History Boundary

**Files:**
- Modify: `result.js`

**Interfaces:**
- Consumes: `analysisMode` branch from Task 5.
- Produces: clear progress and no history write in assist mode.

- [ ] **Step 1: Adapt loading messages**

In assist mode, before building the instruction, call:

```js
setLoading('正在准备图片和 ChatGPT 分析指令...', stepApi);
```

After rendering the panel:

```js
setLoading('图片和指令已准备好，请在 ChatGPT 中完成分析。', stepApi);
```

If the existing loading API marks steps as done/active, keep behavior consistent with current result page.

- [ ] **Step 2: Ensure assist mode skips history**

Find the existing history save call after `renderResult(...)`. Ensure it remains only in the API branch. Add a comment:

```js
// ChatGPT Assist mode does not save history because PromptLens does not receive the ChatGPT web reply.
```

Do not call any history helper inside the assist branch.

- [ ] **Step 3: Ensure API mode still renders next steps**

Confirm `renderNextStepHint(template)` remains in the API path after `renderResult(...)`.

- [ ] **Step 4: Run syntax check**

```bash
node --check result.js
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add result.js
git commit -m "fix: keep assist mode local-only" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 8: Update Documentation and Website Copy

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `README.zh-TW.md`
- Modify: `SECURITY.md`
- Modify: `site/index.html`
- Modify: `docs/chrome-web-store/README.md`
- Modify: `docs/chrome-web-store/release-checklist.md`
- Modify: `docs/chrome-web-store/store-listing.md`
- Modify: `docs/chrome-web-store/privacy-practices.md`

**Interfaces:**
- Consumes: final product copy from design spec.
- Produces: user-facing explanation of API automatic analysis vs ChatGPT Plus Assist mode.

- [ ] **Step 1: Update README feature lists**

In all three README files, add a feature bullet after custom model/API service:

English:

```markdown
- **ChatGPT Plus Assist mode**: for users with ChatGPT Plus / Pro but no API key; PromptLens prepares the image and instruction, then you upload them to ChatGPT manually.
```

Simplified Chinese:

```markdown
- **ChatGPT Plus 辅助模式**：适合有 ChatGPT Plus / Pro 但没有 API Key 的用户；PromptLens 准备图片和指令，你在 ChatGPT 网页端手动上传和发送。
```

Traditional Chinese:

```markdown
- **ChatGPT Plus 輔助模式**：適合有 ChatGPT Plus / Pro 但沒有 API Key 的使用者；PromptLens 準備圖片和指令，你在 ChatGPT 網頁端手動上傳和送出。
```

- [ ] **Step 2: Update README workflow sections**

Add a paragraph explaining two modes:

English:

```markdown
PromptLens has two analysis paths: API Automatic Analysis calls your configured OpenAI-compatible Vision API and renders structured results; ChatGPT Plus Assist mode does not call an API and instead prepares a local JPEG plus a ChatGPT-ready instruction for manual use on chatgpt.com.
```

Add equivalent Chinese text in `README.zh-CN.md` and `README.zh-TW.md`.

- [ ] **Step 3: Update `SECURITY.md`**

Add under data handling:

```markdown
- **ChatGPT Plus 辅助模式**：图片和指令只在浏览器本地生成和下载；PromptLens 不会调用 API、不会自动上传到 ChatGPT、不会读取 ChatGPT 回复，也不会保存 ChatGPT 网页端回复历史。用户主动上传到 ChatGPT 后，数据受 OpenAI / ChatGPT 的隐私政策、账号设置和使用限制约束。
```

Add under permissions:

```markdown
v0.6.0 的 ChatGPT Plus 辅助模式不新增 `chatgpt.com` 权限，不注入 ChatGPT 页面，也不使用 `downloads` 权限。
```

- [ ] **Step 4: Update `site/index.html`**

Add user-facing copy in the feature/installation sections:

```html
<strong>ChatGPT Plus Assist:</strong> No API key? PromptLens can prepare a local JPEG and ChatGPT-ready instruction so you can upload them manually in ChatGPT Plus / Pro.
```

Also add the Chinese translation in the site i18n mechanism if the site uses text replacement via `site/assets/i18n.js`. If `site/index.html` contains bilingual data attributes instead, follow existing pattern.

- [ ] **Step 5: Update Chrome Web Store docs**

In `docs/chrome-web-store/README.md`, add manual validation items:

```markdown
- ChatGPT Plus 辅助模式不填写 API Key 也可保存。
- ChatGPT Plus 辅助模式结果页可下载图片、复制指令、打开 ChatGPT。
```

In `privacy-practices.md`, add that assist mode does not collect or automatically transmit ChatGPT web replies.

In `store-listing.md`, add one short user-facing benefit line.

In `release-checklist.md`, add a website/support validation item for ChatGPT Plus Assist mode.

- [ ] **Step 6: Run site tests**

```bash
node tests/site-release-links.test.js
node tests/site-seo-meta.test.js
```

Expected:

```text
site release link tests passed
site SEO meta tests passed
```

- [ ] **Step 7: Commit**

```bash
git add README.md README.zh-CN.md README.zh-TW.md SECURITY.md site/index.html docs/chrome-web-store/README.md docs/chrome-web-store/release-checklist.md docs/chrome-web-store/store-listing.md docs/chrome-web-store/privacy-practices.md
git commit -m "docs: document ChatGPT Plus assist mode" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 9: Bump Version and Update Release Metadata

**Files:**
- Modify: `manifest.json`
- Modify: `site/index.html`
- Modify: `tests/site-seo-meta.test.js`
- Modify: `CHANGELOG.md`
- Modify: `CHANGELOG.zh-CN.md`
- Modify: `docs/chrome-web-store/README.md`
- Modify: `docs/chrome-web-store/release-checklist.md`
- Modify: `docs/chrome-web-store/store-listing.md`
- Modify: `docs/chrome-web-store/privacy-practices.md`

**Interfaces:**
- Produces: version `0.6.0` across release metadata.
- Consumes: existing `scripts/package-extension.sh` behavior.

- [ ] **Step 1: Update `manifest.json` version**

Change:

```json
"version": "0.5.1"
```

to:

```json
"version": "0.6.0"
```

- [ ] **Step 2: Update website JSON-LD version**

In `site/index.html`, change:

```json
"softwareVersion": "0.5.1"
```

to:

```json
"softwareVersion": "0.6.0"
```

- [ ] **Step 3: Update SEO test expectation**

In `tests/site-seo-meta.test.js`, change expected software version from `0\.5\.1` to `0\.6\.0`.

- [ ] **Step 4: Add changelog sections**

Prepend to `CHANGELOG.md`:

```markdown
## 0.6.0 - 2026-07-07

### Features
- Add ChatGPT Plus Assist mode for users who have ChatGPT Plus / Pro but do not use an API key.
- Add local assist actions to download the prepared image, copy a ChatGPT-ready instruction, and open ChatGPT.
- Keep assist mode local-only: no chatgpt.com permission, no automatic upload, no automatic send, and no ChatGPT reply reading.

### Documentation
- Explain API Automatic Analysis versus ChatGPT Plus Assist mode.
- Document assist-mode privacy boundaries and manual ChatGPT web usage.
```

Prepend to `CHANGELOG.zh-CN.md`:

```markdown
## 0.6.0 - 2026-07-07

### 新功能
- 新增 ChatGPT Plus 辅助模式，面向有 ChatGPT Plus / Pro 但不使用 API Key 的用户。
- 新增本地辅助操作：下载处理后的图片、复制 ChatGPT 指令、打开 ChatGPT。
- 保持辅助模式本地优先：不新增 chatgpt.com 权限、不自动上传、不自动发送、不读取 ChatGPT 回复。

### 文档
- 说明 API 自动分析与 ChatGPT Plus 辅助模式的区别。
- 补充辅助模式隐私边界和手动使用 ChatGPT 网页端的说明。
```

- [ ] **Step 5: Update Chrome Web Store docs version text**

Replace `0.5.1` / `v0.5.1` / `promptlens-v0.5.1.zip` with `0.6.0` / `v0.6.0` / `promptlens-v0.6.0.zip` in the four Chrome Web Store docs.

- [ ] **Step 6: Run release checks and package**

```bash
node --check background.js
node --check content.js
node --check templates.js
node --check history-store.js
node --check history.js
node --check options.js
node --check result.js
node tests/site-release-links.test.js
node tests/site-seo-meta.test.js
bash tests/package-extension-forbidden-regex.sh
bash scripts/package-extension.sh
```

Expected includes:

```text
site release link tests passed
site SEO meta tests passed
forbidden regex covers release metadata files
Created and validated dist/promptlens-v0.6.0.zip
Version: 0.6.0
```

- [ ] **Step 7: Commit**

```bash
git add manifest.json site/index.html tests/site-seo-meta.test.js CHANGELOG.md CHANGELOG.zh-CN.md docs/chrome-web-store/README.md docs/chrome-web-store/release-checklist.md docs/chrome-web-store/store-listing.md docs/chrome-web-store/privacy-practices.md
git commit -m "chore: prepare v0.6.0 release" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 10: Final Review and Release

**Files:**
- No planned code edits unless review finds issues.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: pushed `main`, tag `v0.6.0`, GitHub Release, website deployment.

- [ ] **Step 1: Run final local checks**

```bash
git status --short
node --check background.js
node --check content.js
node --check templates.js
node --check history-store.js
node --check history.js
node --check options.js
node --check result.js
node tests/site-release-links.test.js
node tests/site-seo-meta.test.js
bash tests/package-extension-forbidden-regex.sh
bash scripts/package-extension.sh
```

Expected: clean status except expected `dist/` ignored artifact, all checks pass.

- [ ] **Step 2: Request final code review**

Use a reviewer agent on the full branch diff from `v0.5.1` to `HEAD`. Review must check:

- API mode backward compatibility.
- Assist mode does not call API.
- Assist mode does not add permissions.
- Assist mode does not write history.
- Dynamic text uses safe DOM APIs.
- Documentation matches behavior.

- [ ] **Step 3: Fix Critical/Important findings**

For any Critical or Important review finding, fix it, rerun relevant checks, and re-review.

- [ ] **Step 4: Create release notes file**

```bash
python3 - <<'PY'
from pathlib import Path
text = Path('CHANGELOG.md').read_text()
start = text.index('## 0.6.0 - 2026-07-07')
try:
    end = text.index('\n## 0.5.1 - 2026-07-06', start)
except ValueError:
    end = len(text)
Path('/tmp/promptlens-v0.6.0-release-notes.md').write_text(text[start:end].strip() + '\n')
PY
```

- [ ] **Step 5: Create annotated tag and push**

```bash
git tag -a v0.6.0 -F /tmp/promptlens-v0.6.0-release-notes.md
git push origin main
git push origin v0.6.0
```

- [ ] **Step 6: Create GitHub Release**

```bash
gh release create v0.6.0 dist/promptlens-v0.6.0.zip --title "PromptLens v0.6.0" --notes-file /tmp/promptlens-v0.6.0-release-notes.md --verify-tag
gh release view v0.6.0 --json url,tagName,name,assets,isDraft,isPrerelease
```

Expected asset: `promptlens-v0.6.0.zip`, state `uploaded`.

- [ ] **Step 7: Deploy website**

```bash
ssh oracle 'set -e; backup=/opt/promptlens/site-backup-$(date +%Y%m%d-%H%M%S); cp -a /opt/promptlens/site "$backup"; echo "$backup"'
rsync -az --delete site/ oracle:/opt/promptlens/site/
curl -fsSL https://bytewatcher.xyz/ | grep '"softwareVersion": "0.6.0"'
```

Expected: website shows `"softwareVersion": "0.6.0"`.

- [ ] **Step 8: Report release completion**

Report:

- Commit hash.
- Tag `v0.6.0`.
- GitHub Release URL.
- Artifact name and SHA256 digest from `gh release view`.
- Website backup path.
- Website verification result.

---

## Self-Review

**Spec coverage:** Covers analysis mode setting, API vs assist mode, First Success state, result page branch, instruction generation, image download, copy/open actions, history boundary, permissions/privacy, documentation, release, and website deployment.

**Placeholder scan:** No TBD/TODO/fill-in placeholders. All tasks include exact files, commands, expected outputs, and concrete code snippets where implementation shape matters.

**Type consistency:** Uses one persistent field, `analysisMode: 'api' | 'chatgpt_assist'`. Uses one instruction builder name, `buildChatGptAssistInstruction(template, businessContext)`. Uses one assist renderer name, `renderChatGptAssistPanel(preparedImage, instruction)`.
