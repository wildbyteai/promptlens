# PromptLens 提示词架构

## 目标

PromptLens 使用一个稳定的模板领域模型和一个统一 Prompt Compiler，为 API 自动分析与 ChatGPT Assist 生成不同传输格式的指令。两条路径共享证据边界、语言路由、Negative Prompt、变体语义、模板 Profile 和目标平台规则。

## 模板领域字段

- `id`：模板实例 ID。
- `templateType`：`standard` 或 `marketing`，决定输出 Schema；不得通过 ID 隐式判断。
- `templateProfile`：`detailed`、`natural`、`tags`、`concise`、`marketing` 或 `custom`，决定语义和 Token 预算。
- `version`：自定义模板每次保存递增。
- `instruction`：用户或内置模板的内容与风格要求，不能覆盖固定证据和 Schema 契约。

旧自定义模板缺少类型时按 `standard/custom` 读取。复制模板必须保留 `templateType` 和 `templateProfile`。

## 模块边界

### `prompt-compiler.js`

- 将模板、`outputLanguage`、业务背景和 `targetPlatform` 编译为稳定上下文。
- 统一证据边界、语言、Negative Prompt、模板 Profile、平台和 Token 预算。
- API Renderer 生成结构化模型指令。
- ChatGPT Renderer 生成 Markdown 指令，不拼接 API Schema 字段要求。
- 对业务背景做长度限制和转义。
- 生成 SHA-256 `promptHash`。

### `prompt-schemas.js`

- 是 `standard_v1`、`marketing_v1`、变体 ID、Tags 数量范围和 Negative Prompt 数量范围的唯一契约源。
- 为提示词约束、OpenAI Native JSON Schema、Anthropic `tool_use.input_schema` 和运行时校验提供同一份 Schema。
- Schema 中不包含固定评分示例，避免营销评分锚定。

### `model-adapters.js`

- 适配 OpenAI-compatible Chat Completions 和 Anthropic Messages API。
- 负责 URL、Headers、消息体、图片内容和 `max_tokens`。
- OpenAI-compatible 支持 `prompt`、`json_object`、`json_schema` 三种结构化输出模式。
- Anthropic 固定使用 `tool_use` 与 `input_schema` 强制结构化输出，并解析 `tool_use.input`。
- Native JSON Schema 模式由 Adapter 注入正式 Schema；Compiler 不重复注入 JSON Shape。

### `output-validator.js`

- 核心字段或营销诊断结构错误：分析失败。
- variants、Tags 数量或 Negative Prompt 词条数量不完整：`partial_success`，保留已有结果并在 UI 显示字段路径。
- `finish_reason=length/max_tokens`：抛出独立截断错误，不归类为普通 JSON 解析失败。

### `history-store.js`

新记录在 `_meta` 中保存：

- `promptHash`
- `schemaId`
- `promptCompilerVersion`
- `templateVersion`
- `templateType`
- `templateProfile`
- `targetPlatform`
- `modelAdapter`
- `modelId`
- `finishReason`
- `validationStatus`
- `validationWarnings`

旧记录不迁移 IndexedDB，读取时补充 `legacy_v1` 元数据。

## 稳定兼容边界

- `standard_v1` 与 `marketing_v1` 顶层结果字段不变。
- `standard_concise_v1` 用于快速复制模板，保留核心双语 Prompt、Tags、Negative Prompt 与 `json_prompt`，明确省略 `prompt_variants` 以降低输出 Token。
- `prompt_zh` 始终为简体中文。
- `prompt_en`、Tags、Negative Prompt 和 `json_prompt` 保持英文。
- 评分继续使用 1–5。
- Negative Prompt 继续是英文逗号分隔字符串，不升级为对象。
- ChatGPT Assist 不保存网页端结果，也不自动发送。

## 验证

- 5 个内置模板 × 2 种语言 × API/ChatGPT 两条路径的编译矩阵测试。
- 模板类型复制与旧模板兼容测试。
- Output Validator 完整、部分成功、营销结构和截断测试。
- Model Adapter Prompt/JSON Object/Native JSON Schema/Anthropic `tool_use` 测试。
- 历史 `_meta` 与旧记录兼容测试。
