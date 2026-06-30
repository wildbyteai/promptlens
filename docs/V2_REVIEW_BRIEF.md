# PromptCard Lite v2 收敛版规划审查说明

> 用途：发给其他 agent 做第二轮方案审查。  
> 要求：只做方案审查，不执行代码实现，不创建功能代码，不修改现有扩展逻辑。

## 0. 路径与跨平台说明

本文档中的路径均使用**仓库相对路径**，避免绑定某台机器的本地路径。

仓库根目录记为：

```text
<repo-root>
```

在 macOS / Linux 中，示例路径类似：

```text
<repo-root>/docs/V2_REVIEW_BRIEF.md
<repo-root>/result.js
<repo-root>/options.js
```

在 Windows 中，等价路径类似：

```text
<repo-root>\docs\V2_REVIEW_BRIEF.md
<repo-root>\result.js
<repo-root>\options.js
```

请审查时使用仓库相对路径，不要依赖 `/Users/...`、`C:\Users\...` 等本机绝对路径。

---

# 1. 项目背景

PromptCard Lite v0.1.0 已完成。

它是一个轻量级 Chrome MV3 扩展，用于：

- 右键网页图片，调用用户自配的 OpenAI-compatible Vision API，反向生成图片提示词；
- 支持框选截图分析，适合 `blob:` 图片、防盗链图片或未授权远程图片；
- 用户自行配置：
  - AI Base URL
  - API Key
  - Model
- 结果页展示：
  - 中文提示词
  - English Prompt
  - Tags
  - Negative Prompt
  - JSON Prompt
  - Raw JSON

当前版本明确不包含：

- 登录 / OAuth
- 支付 / 额度系统
- 内置后端 / Supabase
- 云端历史
- 自动填充第三方生成器网站
- 团队协作
- 账号同步

当前技术约束：

- Chrome Extension Manifest V3
- Vanilla HTML / CSS / JavaScript
- 无 npm 依赖
- 无构建步骤
- 无远端资源加载
- API Key 保存在 `chrome.storage.local`
- 图片只发送到用户配置的 AI API
- 远程图片读取权限使用 `optional_host_permissions`
- 框选截图使用 `activeTab`
- 结果页依赖固定 JSON 输出结构

---

# 2. 产品原则

v2 继续遵守这些原则：

1. **本地优先**
   - 配置和可选数据尽量保存在用户浏览器本地。

2. **Provider-neutral**
   - 继续兼容 OpenAI-compatible `/chat/completions` Vision API。
   - 不绑定单一模型厂商。

3. **无账号系统**
   - 不加入登录、支付、额度、云同步。

4. **隐私透明**
   - 新增任何数据存储、权限或网络请求，都必须明确说明。

5. **轻量实现**
   - 优先使用 Vanilla JavaScript / CSS。
   - 不引入构建工具和 npm 依赖。

6. **小步迭代**
   - 每个版本解决一组明确问题，避免一次性堆功能。

7. **稳定输出契约**
   - 结果页、复制、导出逻辑继续依赖统一 JSON 输出结构。
   - 模板可以影响输出风格，但不应自由改变顶层 JSON schema。

---

# 3. 收敛后的 v2 路线图

经过第一轮外部评审后，路线图已收敛为：

```text
v0.2.0：内置模板 + 结果导出
v0.2.1：自定义模板 + Provider 预设 + 快捷键
v0.3.0：Chrome Web Store 发布准备 + 可选历史记录 + 模型测试增强
v0.3.x：图片预处理配置，仅作为反馈驱动 patch
v0.5.0+：国际化与 Firefox MV3 调研
```

同时：

```text
批量处理已移出 Lite 路线图
```

---

# 4. v0.2.0：内置模板与结果导出

## 目标

让结果更可控、更容易带走，不改变 v0.1 的核心分析流程。

## 范围

### 4.1 内置 Prompt 模板

增加 4 个内置模板。这里的核心决策是：**内置模板按输出格式 × 详略划分，而不是按目标平台划分**。格式相对稳定，平台和平台参数会持续变化；平台专属差异交给 v0.2.1 自定义模板。

1. **详细分析（`detailed`）**
   - 完整结构化输出，覆盖中英文提示词、标签、负面提示词和 JSON Prompt。
   - 适合通用分析、二次编辑、沉淀为后续模板。

2. **自然语言（`natural`）**
   - 输出流畅英文描述 prompt，强调主体、场景、风格、光影、构图和画面意图。
   - 适用于 Midjourney、DALL-E、即梦、Seedance、Lovart、Flux 等自然语言提示词平台。

3. **标签加权（`tags`）**
   - 输出带权重倾向的正向 / 反向标签，强调关键词、风格词、质量词、构图词和 negative prompt。
   - 适用于 Stable Diffusion、ComfyUI、NovelAI 等标签驱动工作流。

4. **快速复制（`concise`）**
   - 输出一句话概括，降低复制成本。
   - 适用于任何平台的快速试跑和轻量复用。

> 原则：**内置模板按格式分（稳定），自定义模板按平台分（用户自治）**。平台专属模板（如 Seedance 专用、即梦优化、Midjourney 参数版、某个 LoRA / workflow 专用模板）应作为 v0.2.1 自定义模板由用户自行创建和维护，而不是由内置模板长期追随每个平台变化。

## 关键约束

这 4 个模板共享同一个顶层 JSON 输出结构：

```json
{
  "prompt_zh": "...",
  "prompt_en": "...",
  "prompt_tags": [],
  "negative_prompt": "...",
  "json_prompt": {}
}
```

模板只能影响内容风格，不改变结果页的数据契约。

## 4.2 模板驱动模型调用

计划新增：

```text
templates.js
```

职责：

- 内置模板定义
- 模板元数据
- 固定 JSON schema suffix
- 默认模板回退
- 后续自定义模板 helper 的边界

`result.js` 不再直接维护多套 prompt 文案，只调用模板接口。

## 4.3 结果导出

结果页增加：

- Copy All
- Download JSON
- Download Markdown

导出内容不包含图片缩略图，避免隐私和体积问题。

Markdown 结构大致为：

```markdown
# PromptCard Result

## English Prompt

...

## 中文提示词

...

## Tags

...

## Negative Prompt

...

## JSON Prompt

```json
...
```
```

## v0.2.0 不包含

- 自定义模板 CRUD
- Provider URL 预设
- 快捷键
- 历史记录
- 批量处理

## 建议审查点

1. v0.2.0 是否足够小？
2. 内置模板 + 导出是否是最优先的二期价值？
3. 4 个内置模板是否过多或过少？
4. 内置模板按“输出格式 × 详略”而不是按平台划分，是否是更稳定的分类方式？
5. 平台专属模板放到 v0.2.1 自定义模板中由用户维护，是否合理？
6. `templates.js` 作为模板边界是否合理？
7. 四个模板共享固定 JSON schema 是否合理？
8. 导出功能是否应包含图片信息？当前倾向不包含。

---

# 5. v0.2.1：自定义模板、Provider 预设与快捷键

## 目标

让高级用户更顺手，但不破坏稳定输出结构。

## 范围

### 5.1 自定义模板

用户可以：

- 新增模板
- 编辑模板
- 重命名模板
- 删除模板
- 选择当前启用模板

但用户只能编辑：

```text
instruction
```

用户不能自由修改最终 JSON schema。

最终发送给模型的 prompt 结构应类似：

```text
用户 instruction
+
系统固定追加的 JSON schema 输出要求
```

## 自定义模板约束

- `instruction` 长度上限：4000 字符。
- 超过上限不保存。
- 内置模板不可直接编辑，只允许复制为自定义模板后编辑。
- 解析失败时提示用户：
  - 自定义模板可能导致输出格式不符；
  - 建议切回内置模板重试。

建议模板结构：

```js
{
  id: string,
  name: string,
  description: string,
  instruction: string,
  builtIn: boolean,
  version: number,
  createdAt: number,
  updatedAt: number
}
```

不建议加入：

```js
outputSchema
```

原因：自由 schema 会让结果页、导出和校验逻辑碎片化。

---

### 5.2 Provider URL 预设

设置页 Base URL 附近增加 provider 预设下拉：

- OpenAI
- DeepSeek
- Alibaba
- SiliconFlow
- Groq
- Custom

只填 Base URL，不包含：

- API Key
- Model
- 远端拉取配置

暂不做用户自定义 Provider preset 管理，避免配置面扩大。

---

### 5.3 快捷键触发框选

通过 `chrome.commands` 增加快捷键触发框选截图。

建议：

```text
Alt+Shift+S
```

同时文档说明用户可以在：

```text
chrome://extensions/shortcuts
```

自行修改。

不做剪贴板图片读取，避免新增：

```text
clipboardRead
```

权限。

## 建议审查点

1. 自定义模板只允许编辑 instruction 是否足够？
2. 是否需要 `version` 字段？
3. instruction 4000 字符上限是否合理？
4. 内置模板是否应该只允许复制，不允许直接编辑？
5. Provider preset 是否应该放进 v0.2.1？
6. Provider 列表是否合适？
7. 快捷键是否应该设置默认键，还是只注册 command 让用户自己设置？
8. 自定义模板导致模型输出异常时，降级策略是否充分？

---

# 6. v0.3.0：发布准备、可选历史与模型测试增强

## 目标

进入真实用户反馈阶段，同时提高配置可靠性和信任度。

## 范围

### 6.1 Chrome Web Store 发布准备

包括：

- Chrome Web Store 图标
- 截图
- 商店描述
- 隐私说明
- 权限用途说明
- 英文 README 或双语 README

发布准备提前到 v0.3.0，而不是等到功能很多之后。

原因：

- 尽早获得真实用户反馈；
- 尽早暴露 CWS 权限审核问题；
- v0.2 模板 + 导出完成后已经具备正式使用价值。

---

### 6.2 Token usage 展示

如果 API 返回：

```js
usage
```

则结果页显示：

- prompt tokens
- completion tokens
- total tokens
- response time

如果 provider 不返回 usage，不显示，不报错。

建议放在结果页底部或折叠区，避免干扰主结果。

---

### 6.3 模型测试增强

设置页增加更明确的模型测试：

1. **快速测试**
   - 验证 API 可达性和鉴权。
   - 不发送图片。
   - `max_tokens` 尽量低。

2. **视觉测试**
   - 发送极小测试图片。
   - 验证 image input 是否可用。
   - 建议使用 32×32 纯色 JPEG，而不是 1×1，避免部分模型拒绝太小图片。

视觉测试前必须提示：

```text
将发送一次测试请求到你的 API，可能产生少量费用。
```

错误处理要求：

- 不展示远端完整响应正文；
- 不泄露请求头、API Key 或图片数据；
- 只展示状态码和可操作说明。

---

### 6.4 可选本地历史记录

历史记录默认关闭。

如果用户开启，则使用 IndexedDB 存储。

初版历史记录不保存缩略图，只保存 metadata + result JSON。

建议字段：

```js
{
  id: string,
  createdAt: number,
  sourceDomain: string,
  inputType: 'image_url' | 'data_url' | 'screenshot_selection',
  templateId: string,
  templateName: string,
  promptEn: string,
  promptTags: string[],
  result: object
}
```

关键约束：

- 不保存 API Key。
- 不保存完整 URL，优先保存 `sourceDomain`。
- 初版不保存缩略图。
- 最多保存 200 条。
- 用户可以删除单条或清空全部。
- SECURITY.md 必须同步说明历史记录数据边界。
- IndexedDB 升级时要保留现有 `pending-payloads` store。

## 建议审查点

1. CWS 是否应该提前到 v0.3.0？
2. 英文 README 是否应该在 CWS 前完成？
3. Token usage 是否应该早于历史记录？
4. 模型视觉测试是否会造成用户意外付费？
5. 视觉测试图片用 32×32 JPEG 是否合理？
6. 历史记录默认关闭是否足够？
7. 是否应该完全不保存来源信息，还是保存 sourceDomain？
8. 初版不保存缩略图是否会影响历史页可用性？
9. 200 条上限是否合理？
10. IndexedDB schema 迁移风险是否被充分考虑？

---

# 7. v0.3.x Optional Patch：图片预处理配置

图片预处理配置不进入主路线图。

只有在真实用户反馈出现以下问题后考虑：

- 图片质量不足；
- API 拒绝大图；
- 用户需要更小输入图；
- 用户明确需要调压缩质量。

如果加入，也应隐藏在 Advanced 设置中，只提供少量配置：

- 最大边长；
- JPEG 质量。

不建议开放过多参数。

## 建议审查点

1. 图片预处理配置是否应该完全不做？
2. 如果做，是否只作为高级设置？
3. 当前自动压缩策略是否已经足够？

---

# 8. v0.5.0+：国际化与兼容性调研

长期方向：

- 英文 UI
- 繁体中文 UI
- 自动语言检测
- Firefox MV3 兼容性调研
- 更完整手动测试矩阵

Firefox MV3 兼容性需要单独验证，不作为近期承诺。

## 建议审查点

1. 开源项目是否应该尽早转英文 README？
2. 英文 UI 是否应该随 CWS 一起做？
3. Firefox 是否有真实用户价值，还是保持 Chrome-only？

---

# 9. 已移除：批量处理

批量处理从 Lite 路线图移除，不再作为 v0.4.0 或远期承诺。

移除原因：

1. 偏离 Lite 定位。
2. API 成本不可控。
3. 权限和隐私说明复杂。
4. 页面图片发现、队列、失败重试、速率限制、进度 UI 都会让项目变重。
5. 单图右键 / 框选截图已经覆盖当前核心场景。

如果未来确实有批量需求，应作为独立高级工具或独立产品重新评估，而不是塞进 PromptCard Lite。

## 建议审查点

1. 批量处理是否应永久移除？
2. 是否存在不偏离 Lite 定位的轻量批量方案？
3. 如果未来做，是否应该是独立产品？

---

# 10. 明确暂不做

除非产品方向变化，否则不做：

- 账号系统
- 云同步
- 内置后端代理
- 支付和额度
- 团队空间
- 大型插件生态
- 自动提交到第三方图片生成网站
- 自由编辑输出 JSON schema
- 默认保存历史记录
- 默认保存图片缩略图
- 剪贴板图片读取

---

# 11. 希望本轮审查回答的问题

请重点回答：

1. 收敛后的 v0.2.0 是否足够小？
2. v0.2.0 只做内置模板 + 导出，是否是正确优先级？
3. 内置模板按“详细分析 / 自然语言 / 标签加权 / 快速复制”划分，是否比按 MJ / SD 等平台划分更稳定？
4. 平台专属模板放到 v0.2.1 自定义模板中由用户维护，是否合理？
5. v0.2.1 再做自定义模板、Provider 预设、快捷键，是否合理？
6. `templates.js` 作为模板边界是否合理？
7. 自定义模板只允许编辑 instruction、固定 JSON schema，是否足够？
8. instruction 4000 字符上限是否合理？
9. 是否需要 `version` 字段？
10. Provider 预设列表是否合适？
11. 快捷键是否应该设置默认 `Alt+Shift+S`？
12. v0.3.0 是否应该优先 CWS 发布准备？
13. token usage 和模型测试增强是否应该早于历史记录？
14. 历史记录默认关闭、不存缩略图、只存 sourceDomain，是否足够保护隐私？
15. 200 条历史上限是否合理？
16. 批量处理是否应该永久移除？
17. 是否还有被低估的权限、隐私、安全或维护成本？

---

# 12. 请按这个格式输出审查意见

```markdown
# PromptCard Lite v2 收敛版审查

## 总体结论

Ship / Revise / Descope

## 最大风险

1. ...
2. ...
3. ...

## 建议版本边界

### v0.2.0

...

### v0.2.1

...

### v0.3.0

...

## 应该移除或延后的内容

...

## 对关键设计的评价

### 内置模板

...

### templates.js

...

### 结果导出

...

### 自定义模板

...

### Provider 预设

...

### 快捷键

...

### 模型测试

...

### Token usage

...

### 历史记录

...

### CWS 发布

...

### 批量处理

...

## 建议的最终二期范围

...

## 需要进一步确认的问题

...
```
