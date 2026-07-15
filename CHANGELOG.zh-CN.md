# 更新日志

## 未发布

### 新功能
- 新增统一 Prompt Compiler，为 API 自动分析和 ChatGPT Assist 共享证据、语言、Negative Prompt、变体和平台规则。
- 新增结构化输出模式和目标图像生成平台设置。
- 新增 Native JSON Schema、分模板 Token 预算、输出截断识别和部分成功提示。
- 新增 Anthropic Messages API `tool_use` 支持，并加入 Midjourney 目标平台选项。
- 将结构化输出契约集中到单一 Prompt Schema 模块，供 Compiler、Adapter 和 Validator 共享。
- 为快速复制模板增加独立精简 Schema，省略专业变体并降低输出 Token 预算。

### 修复
- 修复复制视觉营销模板后退化为普通模板的问题。
- 修复 `prompt_variants` 缺失时仍静默显示完整成功的问题。
- 移除 ChatGPT Assist 直接拼接 API Schema instruction 导致的格式冲突。
- 自定义模板保存时递增版本并更新修改时间。
- 自定义指令试图覆盖固定格式或 Schema 时，改为保存前警告，并要求再次点击确认。
- 扩展运行时只发布完整的简体中文和英文目录；繁体中文文档继续独立保留，不作为扩展界面语言开放。
- 模板存在显式类型时优先使用显式类型，仅在旧数据缺少类型时兼容营销模板 ID。
- 将中文 ChatGPT Assist 指令中的 English Prompt、Tags、Negative Prompt 改为中文名称，并在括号中保留英文专业术语。
- 修复用户发送首条消息后，旧的 ChatGPT 交接重试又把同一段指令填入新输入框的问题。

### 可观测性
- 新历史记录保存 Prompt Hash、Schema、Compiler、模板版本、平台、模型适配器和校验状态元数据；旧记录保持兼容。

### 验证
- 新增可重复执行的 10 张合成营销图评测，检查评分离散度和图片类型相关的 Negative Prompt 规则，且不使用业务数据。
- 新增 CI 覆盖率门禁，要求核心运行模块的行覆盖率和函数覆盖率均不低于 80%。

## 0.6.0 - 2026-07-07

### 新功能
- 新增 ChatGPT Plus 辅助模式，面向有 ChatGPT Plus / Pro 但不使用 API Key 的用户。
- 新增本地辅助操作：下载处理后的图片、复制 ChatGPT 指令、打开 ChatGPT。
- 新增实验性 ChatGPT 交接：仅在用户操作后请求可选 `chatgpt.com` 访问权限，等待页面稳定后尝试附加处理后的图片并填入指令，发送动作仍由用户确认。

### 修复
- 稳定 ChatGPT 交接：payload 保留到成功后再清理，优先选择可见 ChatGPT 输入框，避免重复附加图片，并延长结果页状态轮询。

### 文档
- 说明 API 自动分析与 ChatGPT Plus 辅助模式的区别。
- 补充辅助模式隐私边界、可选 ChatGPT 页面访问、不自动发送、不读取 ChatGPT 回复等说明。

## 0.5.1 - 2026-07-06

### 修复
- 从设置页移除快速测试和视觉测试，避免某些网关下合成测试失败但实际图片分析可用时误导用户。
- 将首次成功引导简化为从 API 配置直接进入右键图片分析或框选截图。
- 移除本地模型测试状态文档，使设置指引与实际产品流程保持一致。

## 0.5.0 - 2026-07-06

### 新功能
- 在设置页新增首次成功引导，帮助用户完成 BYO Vision API 配置、第一次图片分析以及复制 / 导出结果。
- 新增轻量 checklist 状态和引导区折叠状态保存。
- 新增最小 Provider 设置示例，覆盖 OpenAI-compatible 服务、OpenAI、Ollama、OpenRouter/SiliconFlow，以及 DeepSeek 兼容性提醒。
- 在结果页新增下一步提示，分别面向 Prompt 工作流和视觉营销诊断工作流。
- 为视觉营销诊断新增一键填入业务背景示例。

### 修复
- 将结果页下一步提示样式对齐现有 Warm Studio 主题 token。
- 将官网下载链接指向 GitHub Releases。

### 文档
- 补充首次成功路径、BYO Vision API 隐私边界和双语可发现性说明。
- 将 Chrome Web Store 发布准备说明更新到 v0.5.0。
