# 更新日志

## 0.5.0 - 2026-07-06

### 新功能
- 在设置页新增首次成功引导，帮助用户完成 BYO Vision API 配置、模型测试、第一次图片分析以及复制 / 导出结果。
- 新增轻量 checklist 状态、引导区折叠状态保存，以及绑定当前配置的快速测试 / 视觉测试状态。
- 新增快速测试与视觉测试错误分类，提供可执行的下一步建议、安全说明和请求超时处理。
- 新增最小 Provider 设置示例，覆盖 OpenAI-compatible 服务、OpenAI、Ollama、OpenRouter/SiliconFlow，以及 DeepSeek 视觉兼容性提醒。
- 在结果页新增下一步提示，分别面向 Prompt 工作流和视觉营销诊断工作流。
- 为视觉营销诊断新增一键填入业务背景示例。

### 修复
- 将 Provider 测试状态绑定到当前 Provider、Base URL 和 Model，避免旧测试结果误导用户。
- 将结果页下一步提示样式对齐现有 Warm Studio 主题 token。
- 将官网下载链接指向 GitHub Releases。

### 文档
- 补充首次成功路径、本地测试状态字段、BYO Vision API 隐私边界和双语可发现性说明。
- 将 Chrome Web Store 发布准备说明更新到 v0.5.0。
