# PromptLens Roadmap

本文档最初用于收敛 v0.2 二期范围，现在继续保留历史设计决策，并作为已完成里程碑、未完成方向和产品边界的统一索引。本文不声明当前最新版本；版本号以根目录 `manifest.json`、`CHANGELOG.md` / `CHANGELOG.zh-CN.md` 和 GitHub Releases 为准。

## 里程碑状态

| 里程碑 | 状态 | 说明 |
|---|---|---|
| v0.2.0：内置模板与结果导出 | 已完成 | 内置模板、固定输出结构、Copy All、JSON 与 Markdown 导出均已落地。 |
| v0.2.1：自定义模板、Provider 预设与快捷键 | 已完成 | 自定义模板 CRUD / 导入导出、Provider 预设和 `Alt+Shift+S` 框选快捷键均已落地。 |
| v0.3.0：发布准备、Token usage 与可选历史 | 部分完成 | 商店材料、隐私说明、Token usage 和本地历史已经完成；Chrome Web Store 尚未正式上架。 |
| v0.3.x：图片预处理配置 | 已完成 | 设置页已提供最大边长和 JPEG 质量，并保留自动压缩与体积限制。 |
| v0.4.0：视觉营销诊断 | 已完成 | 营销诊断模板、可选业务背景和案例化 Markdown 导出均已落地。 |
| v0.5.x：产品引导与双语界面 | 已完成 | 首次成功路径、Provider 示例、结果页下一步提示以及简体中文 / 英文界面已经完成。 |
| v0.6.0：ChatGPT Plus 辅助模式 | 已完成 | 支持本地准备图片和指令，并在用户按需授权后尝试交接到 ChatGPT；发送仍由用户确认。 |
| v0.7.0：Prompt Compiler 与模型适配器 | 已完成 | 已加入统一 Prompt Compiler、结构化输出校验、OpenAI-compatible / Anthropic Adapter 和审计元数据。 |
| 批量处理 | 已移除 | 不再作为 PromptLens Lite 的路线图承诺。 |

当前仍未完成：

- Chrome Web Store 正式提交与上架。
- 繁体中文扩展界面。
- Firefox MV3 兼容性验证。
- 更完整的跨浏览器手动测试矩阵。
- 基于真实用户反馈确定的后续功能；尚未立项的想法不作为版本承诺。

## 产品原则

后续演进继续遵守以下原则：

- 本地优先：配置和可选数据尽量保存在用户浏览器本地。
- Provider-neutral：继续兼容 OpenAI-compatible Vision API，不绑定单一模型厂商。
- 无账号系统：不加入登录、支付、额度或云同步。
- 隐私透明：新增任何数据存储、权限或网络请求都必须明确说明。
- 轻量实现：优先使用 Vanilla JavaScript / CSS，不引入构建工具和 npm 依赖。
- 小步迭代：每个版本解决一组明确问题，避免一次性堆功能。
- 稳定输出：结果页、复制和导出逻辑继续依赖统一 JSON 输出结构，不让模板自由改变顶层 schema。

## v0.2.0：内置模板与结果导出（已完成）

目标：让结果更可控、更容易带走，不改变核心右键图片 / 框选截图流程。

### 范围

1. **内置 Prompt 模板**
   - 内置模板按**输出格式 × 详略**划分，而不是按目标平台划分。格式相对稳定，平台和平台参数会持续变化。
   - 详细分析（`detailed`）：完整结构化输出；适用通用分析和二次编辑。
   - 自然语言（`natural`）：流畅英文描述 prompt；适用 MJ / DALL-E / 即梦 / Seedance / Lovart / Flux 等自然语言提示词平台。
   - 标签加权（`tags`）：带权重倾向的正向 / 反向标签；适用 Stable Diffusion / ComfyUI / NovelAI 等标签驱动工作流。
   - 快速复制（`concise`）：一句话概括；适用任何平台。
   - 原则：**内置模板按格式分（稳定），自定义模板按平台分（用户自治）**。平台专属模板（如 Seedance 专用、即梦优化、Midjourney 参数版）放到 v0.2.1 自定义模板中维护。

2. **模板驱动模型调用**
   - 新增 `templates.js` 作为模板边界。
   - `templates.js` 负责内置模板常量、模板元数据和固定 JSON schema suffix。
   - `result.js` 只消费模板接口，不直接维护多套 prompt 文案。

3. **固定输出结构**
   - 四个内置模板共享同一顶层 JSON 结构：
     - `prompt_zh`
     - `prompt_en`
     - `prompt_tags`
     - `negative_prompt`
     - `json_prompt`
   - 模板只能影响内容风格，不改变结果页渲染契约。

4. **结果导出**
   - Copy All。
   - Download JSON。
   - Download Markdown。
   - 导出内容不包含图片缩略图，避免体积和隐私问题。

### 建议执行顺序

1. 定义模板数据边界和固定输出 schema suffix。
2. 先交付独立的结果导出能力。
3. 接入模板驱动 prompt。
4. 在设置页增加内置模板选择器。
5. 更新 README / SECURITY 中对模板和导出的说明。

### 暂不纳入 v0.2.0

- 自定义模板 CRUD。
- Provider URL 预设。
- 快捷键。
- 历史记录。
- 批量处理。

## v0.2.1：自定义模板、Provider 预设与快捷键（已完成）

目标：让高级用户更顺手，但仍保持输出结构稳定。

### 范围

1. **自定义模板**
   - 用户可以新增、编辑、重命名、删除模板。
   - 用户只编辑 `instruction`，不可自由修改最终输出 JSON schema。
   - 系统在用户 instruction 后固定追加 JSON schema 要求。
   - `instruction` 长度上限：4000 字符。
   - 解析失败时应提示：自定义模板可能导致输出格式不符，建议切回内置模板重试。

2. **Provider URL 预设**
   - 设置页 Base URL 旁提供下拉预设。
   - 预设只填充 Base URL，不包含 API Key 或 Model。
   - 初始建议：OpenAI、DeepSeek、Alibaba、SiliconFlow、Groq、Custom。
   - 不做用户自定义 Provider preset 管理，避免配置面扩大。

3. **快捷键触发框选**
   - 通过 `chrome.commands` 注册框选截图命令。
   - 可使用 `Alt+Shift+S` 作为建议快捷键，文档说明用户可在 `chrome://extensions/shortcuts` 修改。
   - 不做剪贴板图片读取，避免引入 `clipboardRead` 权限。

## v0.3.0：发布准备与可选历史（除正式上架外已完成）

目标：进入真实用户反馈阶段，同时提高结果回溯能力和信任度。

### 范围

1. **Chrome Web Store 发布准备**
   - 补齐图标、截图、商店描述和隐私说明。
   - 准备英文 README 或双语 README。
   - 权限说明中明确解释 `optional_host_permissions` 的用途。

2. **Token usage 展示**
   - 如果 API 返回 `usage`，在结果页显示：
     - prompt tokens
     - completion tokens
     - total tokens
     - response time
   - 如果 provider 不返回 usage，不显示，不报错。

3. **可选本地历史记录**
   - 默认关闭。
   - 使用 IndexedDB。
   - 初版只保存 metadata 和结果 JSON，不默认保存缩略图。
   - 不保存 API Key。
   - 建议最多保存 200 条。
   - 用户可删除单条或清空全部。

### 当前历史记录字段（简化）

```js
{
  id: string,
  createdAt: number,
  sourceDomain: string,
  imageUrl: string,
  pageUrl: string,
  inputType: 'image_url' | 'data_url' | 'screenshot_selection',
  templateId: string,
  templateName: string,
  contentLanguage: string,
  promptEn: string,
  promptZh: string,
  promptTags: string[],
  negativePrompt: string,
  jsonPrompt: object,
  usage: object | null,
  responseTimeMs: number | null,
  _meta: object,
  result: object
}
```

说明：

- 当前实现会保存来源域名、原始图片 URL 和页面 URL，方便回溯；完整 URL 可能包含签名参数或私有路径，因此历史默认关闭，README、SECURITY 和隐私页必须持续披露这一点。
- 不保存图片缩略图。
- 最多保存 200 条，支持删除单条或清空全部。
- IndexedDB 迁移必须保留现有 `pending-payloads` store。

## v0.3.x：图片预处理配置（已完成）

该项最初只作为反馈驱动的可选 Patch；当前已经落地，用于处理以下问题：

- 输出图片质量不足。
- 部分 API 拒绝过大图片。
- 用户明确需要更小或更清晰的输入图。

实现继续保持在 Advanced 区域，只提供最大边长和 JPEG 质量等少量配置。

## v0.4.0：视觉营销诊断模式（已完成）

目标：把 PromptLens 从图片 Prompt 反推工具扩展为轻量商业视觉诊断工具，帮助中小企业老板和业务团队理解一张图的营销价值，并生成可执行的低成本改编 brief。

### 范围

1. **视觉营销诊断模板**
   - 新增内置模板「视觉营销诊断」。
   - 输出老板摘要、营销诊断和下一步行动建议。
   - 保留固定 JSON schema，避免模板自由改变渲染契约。

2. **可选业务背景**
   - 当使用视觉营销诊断模板时，允许用户填写一个自由文本业务背景。
   - 业务背景只用于本次请求，不默认写入历史记录。
   - 不做行业、渠道、用户标签等复杂表单。

3. **案例化 Markdown 导出**
   - Markdown 导出偏向可发布案例初稿。
   - 结构围绕「老板先看 / 视觉策略 / 转化阻力 / 低成本借鉴 / 执行 brief / 下一步测试」。

### 边界

- 不做广告账户自动化。
- 不做预算、出价或投放账户优化建议。
- 不承诺真实转化效果。
- 不做云端案例库、团队协作或批量竞品分析。

## v0.5.0+：国际化与兼容性调研（部分完成）

当前已完成简体中文 / 英文扩展全链路切换，默认简体中文；长期方向保留：

- 繁体中文 UI。
- Firefox MV3 兼容性调研。
- 更完整的手动测试矩阵。

Firefox MV3 当前兼容性仍需单独验证，暂不作为近期承诺。

## v0.6.0：ChatGPT Plus 辅助模式（已完成）

目标：让有 ChatGPT Plus / Pro、但不想单独配置 API Key 的用户也能使用同一套图片预处理与提示词编译能力。

- 本地准备处理后的 JPEG 和分析指令。
- 支持下载图片、复制指令和打开 ChatGPT。
- 用户按需授权后，可尝试附加图片并填入指令。
- 不自动发送消息，不读取或保存 ChatGPT 回复。

## v0.7.0：Prompt Compiler、模型适配器与结构化输出（已完成）

目标：统一 API 自动分析与 ChatGPT Plus 辅助模式的提示词规则，并提高不同模型端点的兼容性和结果可审计性。

- 统一 Prompt Compiler、Prompt Schema、输出校验和版本化模板元数据。
- 支持 OpenAI-compatible 与 Anthropic Messages Vision API。
- 支持结构化输出模式、目标图像平台、专业提示词变体和分模板 Token 预算。
- 记录 Prompt Hash、Schema、Compiler、Adapter、模型和校验状态等本地审计元数据。

## 已移除：批量处理

批量处理从 Lite 路线图中移除，不再作为 v0.4.0 或远期承诺。

移除原因：

- 会引入页面图片发现、队列管理、失败重试、速率限制和复杂进度 UI。
- API 成本不可控，用户可能无意识批量消耗额度。
- 需要更复杂的权限和隐私说明。
- 与 “Lite” 的单图 / 单区域快速反推定位冲突。

如果未来确有批量需求，应作为独立高级工具或独立产品重新评估，而不是塞进 PromptLens。

## 明确暂不做

除非产品方向变化，否则不做：

- 账号系统。
- 云同步。
- 内置后端代理服务。
- 支付和额度系统。
- 团队空间。
- 大型插件生态。
- 自动提交到第三方图片生成网站。
- 自由编辑输出 JSON schema。
- 默认保存历史记录。
- 默认保存图片缩略图。

## 后续工作约束

历史 v0.2—v0.7 里程碑已经完成，不再从本文件直接领取实现任务。Chrome Web Store 正式上架、繁体中文界面、Firefox 兼容性或其他新功能进入实现前，应分别建立独立计划，并说明用户价值、权限、数据流、兼容风险和验证方式。

每个后续计划都必须保留以下硬约束：

- 不引入 npm 依赖。
- 不引入构建步骤。
- 不新增后端。
- 不新增遥测。
- 新权限必须说明用途。
- 用户可见文本和模型返回内容不得用不安全 `innerHTML` 渲染。
- 所有新增本地存储字段必须写入 README / SECURITY 说明。
