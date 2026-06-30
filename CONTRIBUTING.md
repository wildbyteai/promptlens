# 贡献指南

感谢你关注 PromptLens。这个项目的目标是保持轻量、透明、可审计：不引入后端账号系统，不绑定特定模型供应商，不增加不必要的依赖。

## 贡献方式

你可以通过以下方式参与：

- 报告 Bug。
- 提出功能建议。
- 改进文档。
- 提交 Pull Request。
- 分享模型兼容性反馈。

## 报告问题

提交 Issue 前，请先搜索是否已有类似问题。一个清晰的 Bug 报告建议包含：

- 问题描述。
- 复现步骤。
- 预期行为与实际行为。
- Chrome 版本和操作系统。
- 使用方式：右键图片 / 框选截图。
- API 类型：只需说明服务类型或兼容格式，不要贴 API Key。
- 截图或录屏（如有帮助）。

请不要在公开 Issue 中粘贴 API Key、私有图片、完整请求头或包含隐私信息的模型响应。

## 开发环境

PromptLens 是纯 Chrome MV3 扩展，没有 npm 依赖，也没有构建步骤。

```bash
git clone <repo-url>
cd promptlens
```

本地加载：

1. 打开 `chrome://extensions`。
2. 开启「开发者模式」。
3. 点击「加载已解压的扩展程序」。
4. 选择仓库根目录。
5. 修改代码后，在扩展卡片上点击刷新按钮。

## 文件结构

```text
manifest.json      Chrome MV3 manifest
background.js      右键菜单、截图、临时 payload 中转
content.js         页面内框选截图交互
selection.css      注入网页的框选样式
options.html/js    设置页
result.html/js     结果页与模型调用
styles.css         设置页和结果页样式
```

## 开发约束

请尽量遵守以下约束：

- 不引入构建工具，除非有明确收益并经过讨论。
- 不引入 npm 依赖，优先使用浏览器原生 API。
- 不加载外部脚本、字体、样式或图片资源。
- 保持 OpenAI-compatible `/chat/completions` 的 provider-neutral 设计。
- 不加入登录、支付、云同步、遥测或默认后端。
- 新增权限前必须说明用途和替代方案。
- 用户文本和模型返回内容应使用 `textContent` 渲染，避免 XSS。
- 不提交 `.env`、`.claude/`、日志、本地配置或真实密钥。

## 代码风格

- 使用原生 JavaScript、HTML 和 CSS。
- 使用 `async/await` 处理异步流程。
- 保持函数职责清晰。
- 注释以解释关键约束为主，避免重复代码字面含义。
- 新 UI 应保持无外部资源、可键盘访问、窄屏可用。

## 提交规范

建议使用 Conventional Commits：

```text
feat: add prompt template selector
fix: avoid host permission request outside user gesture
docs: clarify privacy boundary
chore: ignore local private files
```

常用类型：

- `feat`：新增功能。
- `fix`：修复问题。
- `docs`：文档修改。
- `refactor`：不改变行为的重构。
- `style`：样式或格式调整。
- `chore`：工具、配置、维护事项。

## 手动验证清单

提交 PR 前，请至少检查：

```bash
node --check options.js
node --check result.js
```

并手动验证：

- 设置页可以保存、清空配置。
- API Base URL 的 HTTPS 校验正常。
- 图片读取权限按钮可以请求授权。
- 右键图片分析流程正常。
- 框选截图流程正常。
- 结果页 loading、error、success 三态正常。
- 复制按钮可用。
- 大图、不支持格式、网络错误和 API 鉴权失败有合理提示。

## Pull Request 要求

PR 建议包含：

- 变更目的。
- 主要改动点。
- 手动验证结果。
- UI 改动截图（如适用）。
- 是否新增权限、存储字段或数据发送路径。

涉及隐私、安全、权限或模型请求格式的改动，请在 PR 描述中单独说明。

## 二期功能

二期方向已经整理在 [docs/ROADMAP.md](docs/ROADMAP.md)。如果要实现 roadmap 中的功能，请优先拆成小 PR，避免一次性引入大范围架构变化。
