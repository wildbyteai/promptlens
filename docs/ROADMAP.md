# PromptCard Lite Roadmap

本文档记录 PromptCard Lite v0.1.0 之后的二期功能方向和执行方案。当前仅作为规划，不表示这些功能已经实现。

## 产品原则

二期继续遵守以下原则：

- 本地优先：配置和可选数据尽量保存在用户浏览器本地。
- Provider-neutral：继续兼容 OpenAI-compatible Vision API，不绑定单一模型厂商。
- 无账号系统：不加入登录、支付、额度或云同步。
- 隐私透明：新增任何数据存储、权限或网络请求都必须明确说明。
- 轻量实现：优先使用 Vanilla JavaScript / CSS，不引入构建工具和 npm 依赖。
- 小步迭代：每个版本解决一组明确问题，避免一次性堆功能。

## v0.2.0：Prompt 模板与结果导出

目标：提升提示词输出可控性和可复用性，不改变核心分析流程。

### 功能方向

1. **内置 Prompt 模板**
   - Generic：通用反推提示词。
   - Midjourney：更偏 MJ 风格的英文提示词。
   - Stable Diffusion：更强调 tags、negative prompt 和质量词。
   - Concise：短提示词，适合快速复制。

2. **自定义模板**
   - 用户可以新增、编辑、重命名、删除模板。
   - 模板保存在 `chrome.storage.local`。
   - 设置页选择当前启用模板。

3. **结果导出**
   - 复制全部。
   - 下载 JSON。
   - 导出 Markdown。

4. **Provider URL 预设**
   - Base URL 输入框旁提供少量常见 provider 预设。
   - 预设只填充 URL，不包含 API Key 或模型名。

5. **快捷键触发框选**
   - 通过 `commands` 支持键盘触发框选截图。
   - 默认快捷键需要避免与浏览器和常见网页冲突。

### 执行方案

#### Task 1：模板数据模型

- 新增模板 schema：`id`、`name`、`description`、`instruction`、`createdAt`、`updatedAt`。
- 新增默认模板常量。
- 新增读取、保存、重置模板的 helper。
- 保持没有模板配置时自动回退到当前默认 prompt。

#### Task 2：模板驱动的模型提示词

- 将 `buildReversePromptInstruction()` 改为接收 active template。
- `callVisionApi()` 在调用前读取模板配置。
- 结果页 header 显示当前模板名称。

#### Task 3：设置页模板 UI

- 增加模板选择器。
- 增加自定义模板编辑区域。
- 支持恢复默认模板。
- 保持初次使用页面仍然简洁。

#### Task 4：结果导出

- 增加「复制全部」「下载 JSON」「导出 Markdown」按钮。
- JSON 使用当前 parsed result。
- Markdown 包含图片提示词、Tags、Negative Prompt 和 JSON Prompt。

#### Task 5：Provider 预设与快捷键

- 设置页增加 provider preset 下拉。
- `manifest.json` 增加 `commands`。
- `background.js` 监听快捷键并启动框选截图。

## v0.3.0：可选历史记录与模型测试增强

目标：增强日常使用效率，但历史记录必须默认关闭。

### 功能方向

1. **可选历史记录**
   - 设置页提供「保存本地历史记录」开关，默认关闭。
   - 使用 IndexedDB 保存记录。
   - 保存内容包括缩略图、创建时间、来源页面 URL、Tags、结果 JSON。

2. **历史页**
   - 新增 `history.html` / `history.js`。
   - 支持列表、搜索、筛选、查看详情、删除。
   - 支持导出历史 JSON。

3. **模型测试增强**
   - 普通连接测试：只验证 API 可达性。
   - 视觉测试：发送极小测试图片，验证模型是否支持 image input。
   - 显示响应耗时。

4. **Token usage 展示**
   - 如果 API 返回 `usage`，在结果页显示 prompt/completion/total tokens。
   - 如果不返回，则不显示，不报错。

### 执行方案

#### Task 1：历史存储设计

- 新增 IndexedDB store：`history-items`。
- 定义记录结构和版本迁移策略。
- 增加历史保存开关。

#### Task 2：结果页保存历史

- 分析成功后，如果开关开启，保存记录。
- 对缩略图做大小限制。
- 不保存 API Key 或请求头。

#### Task 3：历史页 UI

- 新增历史列表页。
- 支持搜索 Tags、时间和来源域名。
- 支持删除单条和清空全部。

#### Task 4：模型测试与 usage

- 设置页增加视觉测试按钮。
- 结果页展示响应耗时和 usage。
- 保持错误提示不泄露远端响应正文。

## v0.4.0：批量处理与图片预处理配置

目标：在收到真实使用反馈后，再评估是否需要批量能力。

### 功能方向

1. **批量处理**
   - 在页面中发现图片列表。
   - 用户手动选择要分析的图片。
   - 串行队列处理，避免并发过高。
   - 显示成功/失败数量和单项错误。

2. **图片预处理配置**
   - 最大边长。
   - JPEG 质量。
   - 最大 base64 大小。
   - 是否保留透明背景为白底。

3. **失败重试**
   - 单张失败可重试。
   - API 超时可继续下一张。

### 暂缓原因

批量处理会显著增加 UI、权限、性能和错误处理复杂度。v0.4.0 前应先观察 v0.1-v0.3 的真实使用反馈。

## v0.5.0+：兼容性与国际化

### 功能方向

- 英文 UI。
- 繁体中文 UI。
- 自动语言检测。
- Firefox MV3 兼容性调研。
- 更完整的手动测试矩阵。

## 明确暂不做

以下方向不符合 Lite 定位，除非后续产品目标发生变化：

- 账号系统。
- 云同步。
- 内置后端代理服务。
- 支付和额度系统。
- 团队空间。
- 大型插件生态。
- 自动提交到第三方图片生成网站。

## 开源发布后补充项

这些不是二期核心功能，但适合在开源维护中补齐：

- Issue 模板。
- Pull Request 模板。
- CHANGELOG。
- 截图或 GIF 演示。
- Chrome Web Store 发布说明。
