# Chrome Web Store 发布准备清单

本文档用于发布前自检，不包含任何本机绝对路径或密钥。

## 详细材料

- [商店文案草稿](store-listing.md)
- [隐私实践表单辅助说明](privacy-practices.md)
- [v0.5.1 发布检查清单](release-checklist.md)

## 基础信息

- 扩展名称：PromptLens
- 当前版本：0.5.1
- 类型：Chrome MV3 扩展
- 数据处理：无后端、无遥测，图片只发送到用户配置的 AI API。

## 商店素材

- 图标：
  - `icons/icon16.png`
  - `icons/icon48.png`
  - `icons/icon128.png`
- 截图建议：
  1. 设置页：AI 服务配置、模板选择、权限说明。
  2. 右键菜单：分析图片、框选截图。
  3. 结果页：图片预览、Prompt 输出、导出按钮。
  4. 历史页：本地历史记录列表（需说明默认关闭）。

## 权限说明

- `contextMenus`：创建右键菜单。
- `storage`：保存本地配置、模板、历史开关和临时输入。
- `activeTab`：用户主动框选截图时访问当前标签页。
- `scripting`：注入框选截图脚本和样式。
- `commands`：注册框选截图快捷键。
- `optional_host_permissions`：用户主动授权后读取远程图片，或访问用户配置的 API origin。

## 隐私声明要点

- 不收集遥测。
- 不提供默认后端代理。
- 不上传 API Key 到项目维护者服务器。
- API Key 保存在浏览器本地 `chrome.storage.local`。
- 图片只发送到用户配置的 AI Base URL。
- 历史记录默认关闭；开启后只保存结果文本、来源域名和模板信息，不保存图片缩略图。

## 发布前手动验证

1. 加载解压扩展无 manifest 错误。
2. 设置页能保存 API 配置和模板选择。
3. 右键图片分析可用。
4. 框选截图分析可用。
5. `Alt+Shift+S` 可触发框选；如冲突，可在 `chrome://extensions/shortcuts` 修改。
6. 结果页复制单项、复制全部、下载 JSON、下载 Markdown 可用。
7. 自定义模板新建、复制、编辑、删除、导入、导出可用。
8. 历史记录默认关闭；开启后记录最多 200 条。
9. 清空历史记录可用。

## 暂不承诺

- 云同步。
- 内置模型账号。
- 自动提交到第三方生成器。
- 批量处理。
- Firefox 正式支持。
