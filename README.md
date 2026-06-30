# PromptCard Lite

极简 Chrome MV3 扩展：右键图片或框选截图，调用用户自己的 OpenAI-compatible Vision API，反向生成图片提示词。

## 功能

- 右键图片 → 分析这张图片
- 右键页面 → 框选截图并分析
- 自定义 AI Base URL、API Key、Model
- 结果页展示中文提示词、英文提示词、标签、Negative Prompt、JSON Prompt 和原始 JSON

## 不包含

- 登录
- OAuth
- 支付
- 额度系统
- Supabase
- 历史记录
- 自动填充生成器网站

## 安装

1. 打开 Chrome。
2. 进入 `chrome://extensions`。
3. 开启"开发者模式"。
4. 点击"加载已解压的扩展程序"。
5. 选择本目录：`promptcard-lite/`。

## 配置

1. 在扩展详情中点击"扩展程序选项"。
2. 填写：
   - AI Base URL，例如 `https://api.openai.com/v1`（必须使用 https，本地开发可使用 `http://localhost` 或 `http://127.0.0.1`）
   - API Key
   - Model，例如 `gpt-4.1-mini` 或其他兼容视觉输入的模型
3. 点击"保存设置"。

分析时，图片会发送到你配置的 AI 服务。

## 使用

### 分析图片

1. 在网页图片上右键。
2. 点击"分析这张图片"。
3. 等待新标签页展示结果。

如果图片因防盗链、登录态或权限限制无法读取，请改用"框选截图并分析"。

### 框选截图

1. 在网页任意位置右键。
2. 点击"框选截图并分析"。
3. 拖拽选择当前可见区域。
4. 等待新标签页展示结果。

按 Esc 或点击"取消"可以退出框选。

## 权限说明

本扩展使用 `optional_host_permissions: ["<all_urls>"]`，不会在安装时请求全部网站权限。实际访问权限按需动态获取：

- **保存 API Base URL 时**：自动请求该 API origin 的网络权限，用于后续发送图片到 AI 服务。
- **右键分析图片时**：如果图片来源与当前页面不同源，会动态请求图片来源 origin 的读取权限。
- **框选截图**：使用 `activeTab` 权限（用户触发时自动授予），不需要额外 host 权限。

如果某个权限请求被拒绝，扩展会提示使用"框选截图并分析"作为替代方案。

## 图片格式支持

- 支持：PNG、JPEG、WebP
- 不支持：SVG（会被拒绝并提示使用框选截图）
- 不支持：直接读取 `blob:` 图片（请使用框选截图）
- 远端图片文件大小上限：20MB
- 所有发送给 AI 模型的图片统一转为 JPEG 格式

## 已知限制

- 不支持直接读取 `blob:` 图片，请使用框选截图。
- 框选截图只支持当前可见视口，不支持整页长截图。
- 只支持 OpenAI-compatible `/chat/completions` Vision API 格式。
- AI Base URL 必须使用 HTTPS 协议（本地开发 `localhost` / `127.0.0.1` 除外）。
