# PromptLens v0.6.0 ChatGPT Plus 辅助模式设计

**日期：** 2026-07-07  
**状态：** Draft for review  
**目标版本：** v0.6.0

## 1. 背景

PromptLens 当前主要通过用户自带的 OpenAI-compatible Vision API 完成图片分析。这个路径适合有 API Key、愿意单独付 API 费用的用户，但会挡住另一类真实用户：他们已经购买 ChatGPT Plus / Pro，可以在 ChatGPT 网页端使用 GPT-5.5 等视觉能力，却没有 OpenAI API Key，也不想额外充值 API。

v0.5.1 已移除设置页 Quick Test / Vision Test，因为合成测试请求可能失败，但实际右键图片分析可用。后续版本应继续减少 Provider 兼容性误导，转而提供更清晰的双路径：API 自动分析与 ChatGPT Plus 网页端辅助。

## 2. 目标

v0.6.0 新增 ChatGPT Plus 辅助模式，让无 API Key 用户也能用 PromptLens 完成图片分析准备工作。

PromptLens 在辅助模式中负责：

1. 读取网页图片或框选截图。
2. 在本地完成图片校验、裁剪、压缩和 JPEG 归一化。
3. 根据当前模板生成 ChatGPT 网页端可用的分析指令。
4. 提供下载图片、复制指令、打开 ChatGPT 的操作入口。

用户在 ChatGPT 网页端手动上传图片、粘贴指令并发送。

## 3. 非目标

v0.6.0 不做以下能力：

- 不自动上传图片到 ChatGPT。
- 不自动点击 ChatGPT 发送按钮。
- 不读取 ChatGPT 网页端回复。
- 不把 ChatGPT 回复解析回 PromptLens。
- 不注入 `https://chatgpt.com/*` content script。
- 不新增 `chatgpt.com` host permission。
- 不绕过登录、风控、验证码、账号限制或 Plus / Pro 额度限制。
- 不承诺 ChatGPT 网页端结果会自动保存到 PromptLens 历史记录。

## 4. 用户故事

### 4.1 有 Plus、无 API Key 的 AI 创作者

用户想反推一张网页图片的提示词，但没有 OpenAI API Key。用户选择 ChatGPT Plus 辅助模式，右键图片后进入结果页，下载处理后的图片，复制 PromptLens 生成的指令，打开 ChatGPT，上传图片并粘贴指令。

### 4.2 电商 / 营销用户

用户想让 GPT-5.5 分析商品主图或广告图，但只会用 ChatGPT 网页端。用户选择视觉营销诊断模板，PromptLens 生成适合 ChatGPT 的营销诊断指令，并提示用户将图片和指令交给 ChatGPT。

### 4.3 仍有 API Key 的高级用户

用户已经配置可用 Vision API，希望保持自动分析流程。API 自动分析模式保持不变，不受辅助模式影响。

## 5. 产品方案

### 5.1 分析方式

设置页新增「分析方式」区块：

```text
分析方式

○ API 自动分析
  使用你配置的 OpenAI-compatible Vision API，PromptLens 自动调用模型并展示结构化结果。

● ChatGPT Plus 辅助模式
  不需要 API Key。PromptLens 准备图片和指令，你在 ChatGPT 网页端上传图片并粘贴指令。
```

新增配置字段：

```js
analysisMode: 'api' | 'chatgpt_assist'
```

`analysisMode` 是 v0.6.0 唯一新增持久化模式字段。手动按钮和「复制指令并打开 ChatGPT」按钮都属于同一个辅助模式，不再额外保存 `chatgptAssistMode`。这样避免设置项膨胀，也避免用户误解为存在 ChatGPT 网页端自动化。

默认值：

```js
analysisMode: 'api'
```

理由：保持现有用户行为不变；只有用户主动选择辅助模式时才切换。API 配置字段 `apiBaseUrl` / `apiKey` / `apiModel` 不随 `analysisMode` 切换而清空，用户从辅助模式切回 API 模式时仍可继续使用原配置。

### 5.2 API 自动分析模式

保持现有行为：

- Base URL、API Key、Model 必填。
- 保存设置时继续请求 API origin 权限。
- 结果页调用 `callVisionApi()`。
- 渲染结构化结果。
- 支持复制、下载 JSON、下载 Markdown。
- 可保存本地历史记录。

### 5.3 ChatGPT Plus 辅助模式

选择辅助模式后：

- API Base URL / API Key / Model 不再必填。
- Provider 预设不作为主流程配置项展示，可折叠在「API 自动分析配置」内。
- 设置页展示辅助模式说明：

```text
当前使用 ChatGPT Plus 辅助模式。PromptLens 不会调用 API，只会在本地准备图片和分析指令。你需要在 ChatGPT 网页端上传图片并粘贴指令。
```

First Success 步骤调整为：

1. 选择 ChatGPT Plus 辅助模式或配置 API 自动分析。
2. 右键图片或框选截图。
3. 下载处理后的图片、复制指令并打开 ChatGPT。
4. 在 ChatGPT 网页端完成分析。

状态判定：

- `analysisMode === 'chatgpt_assist'` 时，选择辅助模式即视为配置步骤完成；分析步骤提示「可开始」，输出步骤文案为「在 ChatGPT 中完成」。
- `analysisMode === 'api'` 时，仍要求 Base URL / API Key / Model 完整才视为配置完成。
- 辅助模式没有模型返回结果，因此 First Success 不标记「PromptLens 已生成结果」，只引导用户进入 ChatGPT 网页端完成最后一步。

## 6. 操作形式

### 6.1 手动模式（P0）

结果页显示「用 ChatGPT Plus 分析」卡片：

```text
用 ChatGPT Plus 分析这张图

1. 下载处理后的图片
2. 复制分析指令
3. 打开 ChatGPT
4. 在 ChatGPT 中上传图片并粘贴指令

[下载图片] [复制指令] [打开 ChatGPT]
```

按钮行为：

- `下载图片`：下载本地处理后的 JPEG。
- `复制指令`：复制完整 ChatGPT 分析指令。
- `打开 ChatGPT`：打开 `https://chatgpt.com/`。

卡片下方显示完整指令文本，便于剪贴板失败时手动复制。

### 6.2 轻自动按钮（P1）

轻自动不是单独模式，不新增持久化字段。它只是辅助卡片中的组合按钮，和手动按钮同时展示：

```text
[下载图片] [复制指令] [打开 ChatGPT] [复制指令并打开 ChatGPT]
```

`复制指令并打开 ChatGPT` 行为：

1. 调用 `navigator.clipboard.writeText(promptText)`。
2. 调用 `chrome.tabs.create({ url: 'https://chatgpt.com/' })` 或 `window.open('https://chatgpt.com/', '_blank')`。
3. 结果页保留提示：请上传已下载图片，然后粘贴指令。

如果复制失败：

- 不阻止打开 ChatGPT。
- 显示「浏览器阻止了自动复制，请手动复制下方指令」。

如果打开失败：

- 显示 `https://chatgpt.com/` 明文链接。

### 6.3 实验自动模式（不进入 v0.6.0）

后续可单独设计「ChatGPT 页面助手」实验功能：

- optional host permission: `https://chatgpt.com/*`。
- content script 注入 ChatGPT 页面。
- 自动填入 prompt。
- 发送前用户确认。
- 第一阶段不自动上传图片、不读取回复。

该模式参考但不复制以下开源项目思路：

- `KudoAI/chatgpt.js`：ChatGPT DOM 自动化基础库。
- `MShneur/ghost-in-the-loop`：多平台 adapter、多策略发送和回复完成检测。
- `ariburaco/chatgpt-file-uploader-extended`：ChatGPT 页面注入与本地文件处理。
- `xuannghia/chatgpt-prompts-manager-extension`：prompt manager 和自动填入交互。

## 7. 结果页数据流

### 7.1 当前 API 模式

```text
background payload
→ result page
→ prepareImage(input)
→ callVisionApi(preparedImage, template)
→ parse JSON
→ render result
→ optional history save
```

### 7.2 ChatGPT Plus 辅助模式

```text
background payload
→ result page
→ prepareImage(input)
→ buildChatGptAssistInstruction(template, businessContext)
→ renderChatGptAssistPanel(preparedImage, promptText)
```

不调用 `callVisionApi()`。

结果页入口保持一个 `analyzeInput()`，但在图片准备完成后按模式分流：

```js
async function analyzeInput() {
  const input = await loadInput();
  const template = await loadTemplate();
  const config = await loadConfig();
  const prepared = await prepareImage(input);

  if (config.analysisMode === 'chatgpt_assist') {
    const businessContext = await maybeCollectMarketingContext(template);
    const instruction = buildChatGptAssistInstruction(template, businessContext);
    renderChatGptAssistPanel(prepared, instruction);
    return;
  }

  const result = await callVisionApi(prepared, template);
  renderApiResult(result);
}
```

这样 API 模式和辅助模式共用图片读取/预处理链路，但模型调用和渲染链路完全分开。

## 8. 图片处理与下载

辅助模式继续复用 `prepareImage()`：

- 远程图片读取。
- data URL 处理。
- 截图处理。
- MIME 校验。
- SVG 拒绝。
- JPEG 归一化。
- 最大边长和 JPEG 质量配置。

下载文件名：

```text
promptlens-chatgpt-image-YYYYMMDD-HHMMSS.jpg
```

图片只在本地生成和下载。PromptLens 不会把辅助模式图片发送给 API 或自有后端。

下载实现使用 Blob + Object URL + `<a download>`，不使用 `chrome.downloads.download()`，因此 v0.6.0 不需要新增 `downloads` 权限。实现步骤：将 `preparedImage.base64` 转成 `Uint8Array`，构造 `Blob({ type: 'image/jpeg' })`，通过 `URL.createObjectURL(blob)` 创建临时 URL，触发 `<a download>`，最后 `URL.revokeObjectURL(url)`。

## 9. ChatGPT 指令生成

新增函数：

```js
function buildChatGptAssistInstruction(template, businessContext = '')
```

该函数不要求 ChatGPT 返回固定 JSON，因为网页端回复不会被 PromptLens 自动解析。输出应面向人工阅读和复制。

### 9.1 普通 Prompt 模板指令

```text
请分析我上传的这张图片。请严格基于图片可见内容，不要编造不可见信息。

请输出以下结构：
1. 中文提示词
2. English Prompt
3. Tags
4. Negative Prompt
5. 可直接复制到图像生成工具的最终 Prompt
6. 3 个不同风格变体

如果存在不确定内容，请明确写出“不确定”。
```

### 9.2 视觉营销诊断模板指令

```text
请分析我上传的这张商业视觉图。请严格基于图片可见内容，并结合我提供的业务背景。

业务背景：
<businessContext>

请输出以下结构：
1. 老板能看懂的摘要
2. 画面内容与风格描述
3. 视觉营销诊断
4. 目标人群与卖点判断
5. 低成本改图建议
6. 可交给设计师 / 投放同事的 Markdown Brief
7. 可直接复用的英文生成 Prompt

如果业务背景为空，请只基于图片判断，不要编造品牌、价格、销量或投放数据。
```

营销诊断模板在辅助模式下继续复用现有业务背景收集流程：结果页识别到当前模板需要营销上下文时，仍调用现有上下文输入弹窗。用户填写后，`currentBusinessContext` 作为 `businessContext` 传入 `buildChatGptAssistInstruction(template, businessContext)`；用户跳过或留空时，指令中不保留 `<businessContext>` 占位符，而是写入「业务背景：未提供，请只基于图片可见内容判断」。

### 9.3 自定义模板

自定义模板在辅助模式中仍可使用，但需要加保护性说明：

```text
以下是用户自定义分析要求：
<template.instruction>

请严格基于图片可见内容回答，不要编造图片中不存在的信息。
```

不允许自定义模板改变 PromptLens 内部 JSON schema 的规则保持不变；但辅助模式输出不要求 JSON。

## 10. 历史记录策略

v0.6.0 中辅助模式默认不保存历史记录。

理由：

- PromptLens 拿不到 ChatGPT 网页端回复。
- 只保存「已生成指令」容易让用户误解为已完成分析。
- 保存图片或截图不符合现有隐私边界。

结果页可以提示：

```text
辅助模式不会保存 ChatGPT 网页端回复。如需保留结果，请在 ChatGPT 中复制或导出。
```

API 模式历史记录保持现状。

## 11. 权限与隐私

v0.6.0 不新增权限。

继续使用现有权限：

- `contextMenus`
- `storage`
- `activeTab`
- `scripting`
- optional `<all_urls>`

辅助模式隐私说明：

```text
PromptLens 辅助模式不会调用 API，也不会把图片发送给 PromptLens 或任何自有后端。图片和指令只会在你主动上传到 ChatGPT 后发送给 OpenAI，受 ChatGPT 的隐私政策、账号设置和使用限制约束。
```

需要在 README / SECURITY / 官网中说明：

- ChatGPT Plus 订阅不等于 OpenAI API 额度。
- API 自动分析和 ChatGPT Plus 辅助模式是两条不同路径。
- 辅助模式不会自动读取或保存 ChatGPT 网页端回复。

## 12. 错误处理

### 12.1 图片读取失败

沿用现有错误：

- 无法读取远程图片。
- 图片格式不支持。
- SVG 不支持。
- blob 图片建议使用框选截图。

### 12.2 图片下载失败

```text
图片下载失败。你可以重新打开结果页，或改用框选截图。
```

### 12.3 剪贴板失败

```text
浏览器阻止了自动复制。请手动选中下方指令复制。
```

### 12.4 打开 ChatGPT 失败

```text
无法自动打开 ChatGPT。请手动访问 https://chatgpt.com/。
```

### 12.5 API 配置缺失

当 `analysisMode === 'chatgpt_assist'` 时，不应显示「请先配置 API」错误。

当 `analysisMode === 'api'` 时，保留现有 API 配置校验。

设置页保存逻辑应明确分支：

```js
if (analysisMode === 'api') {
  validate apiBaseUrl/apiKey/apiModel;
  requestApiOriginPermission(apiBaseUrl);
}

if (analysisMode === 'chatgpt_assist') {
  skip API field validation;
  skip API origin permission request;
}

save analysisMode and all existing fields;
```

即使在辅助模式下，也保留用户已经填写过的 API 字段值，只是不要求它们完整。用户切回 API 自动分析时，如果配置缺失，再显示「你已切换到 API 自动分析，请先配置 API」。

## 13. UI 设计

### 13.1 设置页

新增「分析方式」卡片，位于 First Success 卡片之后、AI 服务配置之前。

API 配置区标题改为：

```text
API 自动分析配置
```

当选择 ChatGPT Plus 辅助模式时，API 配置区显示折叠提示：

```text
当前使用 ChatGPT Plus 辅助模式，API 配置不是必填。切换到 API 自动分析时再填写。
```

### 13.2 结果页

辅助模式结果页应保持现有 Warm Studio 视觉方向，并新增 `.chatgpt-assist-card` 样式。

卡片结构：

- 标题：`用 ChatGPT Plus 分析这张图`
- 简短说明。
- 步骤列表。
- 按钮组：下载图片、复制指令、打开 ChatGPT、复制指令并打开 ChatGPT。
- 指令 textarea 或 pre block。
- 隐私提示。

## 14. 测试策略

### 14.1 静态检查

继续运行：

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

### 14.2 手动验证

API 模式：

1. 设置 `analysisMode = api`。
2. 缺少 API 配置时应提示配置缺失。
3. 配置可用 Vision API 后右键图片，结果页自动分析。
4. 复制和导出仍可用。

ChatGPT Plus 辅助模式：

1. 设置 `analysisMode = chatgpt_assist`。
2. 不填写 API Key 也可保存设置。
3. 右键图片打开结果页。
4. 结果页不调用 API。
5. 结果页显示下载图片、复制指令、打开 ChatGPT。
6. 下载图片为 JPEG。
7. 指令可复制。
8. 打开 ChatGPT 可用。
9. 框选截图路径同样可用。

隐私验证：

1. 辅助模式不请求 API origin 权限。
2. 辅助模式不新增 `chatgpt.com` 权限。
3. 辅助模式不保存 ChatGPT 回复历史。

## 15. 发布说明草案

```markdown
## 0.6.0 - 2026-07-07

### 新功能
- 新增 ChatGPT Plus 辅助模式，面向有 ChatGPT Plus / Pro 但不使用 API Key 的用户。
- 新增手动辅助操作：下载处理后的图片、复制 ChatGPT 指令、打开 ChatGPT。
- 新增轻自动按钮：复制指令并打开 ChatGPT，不新增 chatgpt.com 权限。

### 文档
- 说明 API 自动分析与 ChatGPT Plus 辅助模式的区别。
- 补充手动使用 ChatGPT 网页端时的隐私边界。
```

## 16. 风险与取舍

### 风险：用户期待全自动

缓解：文案明确「辅助模式」而非「自动调用 ChatGPT」。按钮和步骤都强调用户需要在 ChatGPT 网页端上传和发送。

### 风险：用户以为 ChatGPT 回复会回到 PromptLens

缓解：结果页提示「PromptLens 不会读取 ChatGPT 回复」。历史记录不保存辅助模式结果。

### 风险：模式切换让设置页复杂

缓解：保持默认 API 模式；辅助模式使用清晰卡片说明；API 配置区在辅助模式下降低视觉优先级。

### 风险：后续自动模式诱惑过大

缓解：v0.6.0 不新增 chatgpt.com 权限。实验自动模式单独设计、单独授权、单独发布。

## 17. 推荐实施顺序

1. 增加 `analysisMode` 配置和设置页 UI。
2. 调整保存逻辑：辅助模式不强制 API 配置，也不请求 API origin 权限。
3. 在结果页根据 `analysisMode` 分流 API 模式和辅助模式。
4. 实现 `buildChatGptAssistInstruction()`。
5. 实现辅助模式结果卡片、下载图片、复制指令、打开 ChatGPT。
6. 更新 README / SECURITY / 官网 / Chrome Web Store 文档。
7. 发布前完整验证。
