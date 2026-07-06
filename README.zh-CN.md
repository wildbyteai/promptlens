# PromptLens

<p align="center">
  <img src="./docs/assets/banner.svg" alt="PromptLens 横幅" />
</p>

<p align="center">
  图片反推提示词 Chrome 扩展：支持图片转提示词、AI 识图生成提示词和视觉营销诊断。
</p>

<p align="center">
  <a href="./README.md">English</a> · 简体中文 · <a href="./README.zh-TW.md">繁體中文</a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/wildbyteai/promptlens" alt="License" />
  <img src="https://img.shields.io/badge/Chrome-MV3-4285F4" alt="Chrome MV3" />
  <img src="https://img.shields.io/badge/backend-none-22c55e" alt="无需后端" />
  <img src="https://img.shields.io/badge/build-none-7c3aed" alt="无需构建" />
</p>

PromptLens 是一个轻量级 Chrome MV3 图片反推提示词工具，也可以作为图片转提示词、AI 识图生成提示词和商业视觉诊断工作流使用。它会把网页图片或框选截图发送到你自己配置的 OpenAI-compatible Vision API，并生成可复制到 Midjourney、Stable Diffusion 或其他图像生成工具中的提示词。

它的目标是提供一个简单、透明、可自托管思路的图片提示词反推工具：不登录、不付费、不内置后端、不绑定特定模型服务。

## 特性

- **右键图片分析**：在网页图片上右键，生成反向图片提示词。
- **框选截图分析**：对当前可见页面区域框选截图并分析，适合 `blob:` 图片、防盗链图片或未授权远程图片。
- **自定义模型服务**：自行配置 AI Base URL、API Key 和 Model。
- **OpenAI-compatible Vision API**：请求格式兼容 `/chat/completions` 的视觉模型接口。
- **结构化结果**：输出中文提示词、English Prompt、Tags、Negative Prompt、JSON Prompt 和 Raw JSON。
- **内置输出模板**：提供详细分析、自然语言、标签加权、快速复制和视觉营销诊断等输出格式。
- **视觉营销诊断**：面向商业视觉图的可选业务分析，输出老板摘要、营销诊断、低成本改编 brief 和可发布 Markdown 案例初稿。
- **自定义模板**：支持复制内置模板、新建、编辑、删除、导入和导出自定义模板。
- **Provider 预设**：提供 OpenAI、DeepSeek、Alibaba、SiliconFlow、Groq、OpenRouter、Ollama 和 Custom。
- **快捷键框选**：支持 `Alt+Shift+S` 触发框选截图，可在 `chrome://extensions/shortcuts` 修改。
- **可选历史记录**：默认关闭；开启后保存文本结果、来源域名、原始图片 URL、页面 URL 和模板信息，不保存图片缩略图。
- **结果导出**：支持复制单项、复制全部、下载 JSON 和下载 Markdown。
- **本地优先**：配置保存在浏览器本地，不使用远端账号系统。
- **纯前端实现**：无 npm 依赖、无构建步骤、无后端服务。

## 不包含

PromptLens 刻意不包含以下能力：

- 登录 / OAuth
- 支付 / 额度系统
- 内置云服务 / Supabase
- 云端历史记录
- 自动填充第三方生成器网站
- 团队协作或账号同步
- 广告账户自动化、投放出价建议或转化效果保证

## 工作原理

1. 用户在网页中右键图片，或启动框选截图。
2. 扩展读取图片 URL、data URL 或当前标签页可见截图。
3. 图片会在本地被校验、裁剪、压缩，并统一转换为 JPEG。
4. 结果页按选定模板调用用户配置的 OpenAI-compatible Vision API。
5. 模型返回 JSON 后，结果页展示并提供复制、JSON 下载和 Markdown 下载。

PromptLens 不提供内置模型服务。你需要自行准备支持视觉输入的 API 服务。

<p align="center">
  <img src="./docs/assets/workflow.svg" alt="PromptLens 工作流" />
</p>

## 安装

### 从源码加载

1. 下载或克隆本仓库。
2. 打开 Chrome。
3. 进入 `chrome://extensions`。
4. 开启「开发者模式」。
5. 点击「加载已解压的扩展程序」。
6. 选择仓库根目录。

### Chrome Web Store

暂未发布。后续如发布到 Chrome Web Store，会在这里补充链接。

## 配置

1. 在 Chrome 扩展详情页点击「扩展程序选项」。
2. 填写：
   - **AI Base URL**：例如 `https://api.openai.com/v1`。
   - **API Key**：你的模型服务密钥。
   - **Model**：支持视觉输入的模型名称。
   - **默认输出模板**：详细分析、自然语言、标签加权或快速复制。
3. 点击「保存设置」。
4. 如需直接右键分析任意网站的远程图片，点击「授权图片读取权限」。

说明：

- AI Base URL 必须使用 HTTPS。
- 本地开发允许 `http://localhost` 和 `http://127.0.0.1`。
- 如果不授权所有网站图片读取权限，仍可使用「框选截图并分析」。

## 使用

### 分析网页图片

1. 在网页图片上右键。
2. 选择「分析这张图片」。
3. 新标签页会打开结果页并显示分析进度。
4. 分析完成后复制需要的提示词。

如果页面提示没有图片读取权限，可以先到设置页授权，或改用框选截图。

### 框选截图分析

1. 在网页任意位置右键。
2. 选择「框选截图并分析」。
3. 拖拽选择当前可见区域。
4. 等待结果页生成提示词。

按 Esc 或点击取消按钮可以退出框选。

## 首次成功路径

PromptLens v0.5 优先帮助新用户完成第一次成功分析：

1. 打开设置页。
2. 配置你自己的 OpenAI-compatible Vision API：Provider/Base URL、API Key，以及支持图片输入的模型。
3. 保存设置，然后运行快速测试和视觉测试。
4. 通过右键网页图片开始分析；如果站点权限或远程图片读取受限，使用框选截图。
5. 复制 Prompt、Tags 或专业变体，或在视觉营销诊断模板中导出 Markdown Brief。

PromptLens 不提供模型服务、后端、代理、遥测、账号系统或云分享。测试和分析请求会从你的浏览器发送到你配置的 Base URL。

## 截图

| 右键菜单 | 设置页 |
| --- | --- |
| <img src="./docs/assets/promptlens-context-menu.png" alt="PromptLens 右键菜单" /> | <img src="./docs/assets/promptlens-options.png" alt="PromptLens 设置页" /> |

| 分析结果 |
| --- |
| <img src="./docs/assets/promptlens-result.png" alt="PromptLens 分析结果页" /> |

## 隐私与安全

PromptLens 的隐私边界很简单：

- API Key 存储在浏览器本地 `chrome.storage.local`。
- 图片只发送到你配置的 AI Base URL。
- 扩展本身不包含后端服务，不收集遥测。
- 历史记录默认关闭；开启后只保存在浏览器本地，会保存来源图片/页面 URL 以便回溯，且不保存图片缩略图。
- 远程图片读取权限是可选权限，不会在安装时请求。
- 框选截图使用 `activeTab` 权限，仅在用户触发时访问当前标签页。

请注意：当你使用第三方模型服务时，图片和提示词会发送给该服务。请自行确认服务商的隐私政策、数据保留策略和模型使用条款。

更多安全说明见 [SECURITY.md](SECURITY.md)。

## 权限说明

`manifest.json` 中使用的权限：

- `contextMenus`：创建右键菜单。
- `storage`：保存模型配置、当前模板和临时输入。
- `activeTab`：用户触发框选截图时访问当前标签页。
- `scripting`：注入框选截图脚本和样式。
- `commands`：注册框选截图快捷键。
- `optional_host_permissions: ["<all_urls>"]`：按需请求远程图片读取权限和 API origin 访问权限。

## 图片格式支持

- 支持：PNG、JPEG、WebP。
- 不支持：SVG。
- 不支持直接读取：`blob:` 图片，请使用框选截图。
- 远端图片文件大小上限：20MB。
- 发送给模型前会统一转为 JPEG。

## 开发

本项目刻意保持简单：

```text
manifest.json      Chrome MV3 manifest
background.js      右键菜单、截图、临时 payload 中转
content.js         页面内框选截图交互
selection.css      仅注入网页的框选样式
options.html/js    设置页
history-store.js   本地历史记录 IndexedDB helper
history.html/js    本地历史记录页面
templates.js       内置 / 自定义模板和固定 JSON 输出要求
result.html/js     结果页、导出、历史保存与模型调用
styles.css         设置页和结果页样式
```

本地检查：

```bash
node --check background.js
node --check content.js
node --check templates.js
node --check history-store.js
node --check history.js
node --check options.js
node --check result.js
```

开发原则：

- 不引入构建工具。
- 不引入 npm 依赖。
- 不引入远端资源。
- 保持 Vanilla JavaScript / CSS。
- 新功能优先保持本地优先和隐私透明。

## 路线图状态

当前分支已落地到 v0.5.0：首次成功引导、绑定当前配置的模型测试、更清晰的 Provider 设置说明、结果页下一步提示、营销业务背景示例、视觉营销诊断、Warm Studio 视觉升级、摘要式历史卡片、内置 / 自定义模板、Provider 预设、快捷键、结果导出、Token usage、可选本地历史记录、基础 i18n 和 Chrome Web Store 发布准备。

后续仍保留为反馈驱动的方向：

- 更完整的英文 / 繁体中文界面翻译。
- Firefox MV3 兼容性调研。
- 根据真实反馈继续调整图片预处理默认值。

## 贡献

欢迎提交 issue 和 pull request。请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## License

MIT License. See [LICENSE](LICENSE).
