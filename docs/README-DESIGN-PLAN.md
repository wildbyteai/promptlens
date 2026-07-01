# PromptLens README 展示设计方案

## 设计原则

- **务实优先**：README 是技术文档，不是营销页面
- **视觉克制**：用最少的图片传递最多的信息
- **开源友好**：避免过度品牌化，保持技术社区调性
- **三语一致**：中英文 README 结构完全对齐

---

## 一、推荐 README 结构

### 当前结构（保持不变）
```
标题 + 语言切换
项目简介
特性列表
不包含
工作原理
安装
配置
使用
隐私与安全
权限说明
图片格式支持
开发
路线图状态
贡献
License
```

### 新增/调整

> 以下示例用于设计方案文档预览；如果复制到仓库根目录 README，请将 `./assets/` 改为 `./docs/assets/`。

```markdown
# PromptLens

<p align="center">
  <img src="./assets/banner.svg" alt="PromptLens - Local-first image prompt reverse engineering" width="720">
</p>

<p align="center">
  <strong>Local-first Chrome extension for reverse-engineering image prompts</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#usage">Usage</a> •
  <a href="#privacy-and-security">Privacy</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.3.0-blue" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/chrome-%3E%3D110-lightgrey" alt="Chrome">
  <img src="https://img.shields.io/badge/build-none-yellow" alt="No Build Step">
</p>

English | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md)

---

## Features

[保持现有内容]

## How it works

[保持现有内容，新增流程图]

<p align="center">
  <img src="./assets/workflow.svg" alt="PromptLens workflow diagram" width="640">
</p>

[... 其余章节保持不变 ...]
```

---

## 二、视觉资产清单

### docs/assets/ 目录结构

```
docs/assets/
├── banner.svg              # README 顶部横幅（1280×320px）
├── workflow.svg            # 工作原理流程图
├── demo-result.svg         # 结果页截图（真实）
├── demo-options.svg        # 设置页截图（真实）
└── demo-context-menu.svg   # 右键菜单截图（真实）
```

### icons/ 目录（已有 + CWS 补充）

```
icons/
├── icon16.png              # 已有
├── icon48.png              # 已有
├── icon128.png             # 已有
├── icon.svg                # 矢量源文件（可选，方便后续维护）
├── cws-promotional-tile.png  # Chrome Web Store 宣传图（440×280px）
├── cws-screenshot-1.png      # CWS 截图 - 结果页（1280×800px）
├── cws-screenshot-2.png      # CWS 截图 - 设置页（1280×800px）
├── cws-screenshot-3.png      # CWS 截图 - 右键菜单（1280×800px）
└── cws-screenshot-4.png      # CWS 截图 - 历史页（1280×800px，可选）
```

---

## 三、生成图形 vs 真实截图

### 应该用真实截图的部分

| 资产 | 原因 |
|---|---|
| `demo-result.svg` | 结果页是扩展核心价值，用户需要看到真实 UI |
| `demo-options.svg` | 设置页展示配置方式，必须真实 |
| `demo-context-menu.svg` | 右键菜单是入口，必须真实 |
| `cws-screenshot-*.png` | Chrome Web Store 要求真实截图 |

**截图建议**：
- 使用干净的 Chrome 窗口（隐藏书签栏、关闭无关扩展）
- 选择一张高质量的示例图片（如 Midjourney 生成的艺术图）
- 结果页截图时确保所有字段都有内容
- 使用 2x 缩放以获得清晰的 Retina 截图

### 可以用生成图形的部分

| 资产 | 原因 |
|---|---|
| `banner.svg` | 横幅是品牌展示，可以用设计工具生成 |
| `workflow.svg` | 流程图用 SVG 绘制更清晰、可维护 |
| `cws-promotional-tile.png` | 宣传图是营销素材，可以设计 |

---

## 四、Banner/横幅设计提示词

### 方案 A：简约技术风（推荐）

**设计方向**：干净、技术感、不过度设计

**提示词（用于 Midjourney/DALL-E/Figma）**：
```
Create a minimal tech banner for a Chrome extension called "PromptLens". 
- Dark background (#1a1a2e or similar deep navy)
- Left side: Chrome extension icon (magnifying glass over image)
- Right side: Clean sans-serif text "PromptLens" with tagline "Reverse-engineer image prompts"
- Subtle grid pattern or circuit-board-like lines in background
- Color accent: electric blue (#00d4ff) or teal
- No photos, no gradients, just clean vector style
- Dimensions: 1280x320px
- Style: similar to GitHub project banners from projects like Raycast, Arc Browser, or Linear
```

### 方案 B：功能展示风

**设计方向**：直接展示扩展的输入输出

**提示词**：
```
Create a banner showing a Chrome extension workflow:
- Left: A beautiful AI-generated image (landscape or art)
- Center: Arrow with "PromptLens" text
- Right: Structured text output showing "Chinese Prompt", "English Prompt", "Tags"
- Clean white or light gray background
- Modern, flat design style
- Dimensions: 1280x320px
- Keep it minimal, not cluttered
```

### 方案 C：纯文字 + 图标（最简约）

**设计方向**：类似 Vercel/Next.js 的极简风格

**实现**：
- 纯色背景（深色或白色）
- 居中显示 icon128.png + 项目名 + 一句话描述
- 可以用 Figma/Canva 快速制作
- 无需 AI 生成

**推荐**：方案 C 最适合开源项目，制作成本最低，效果最干净。

---

## 五、流程图设计（workflow.svg）

### 内容结构

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ 右键图片  │    │ 本地预处理 │    │ API 调用  │    │ 结果展示  │  │
│  │ 或框选截图│───▶│ 验证/压缩 │───▶│ Vision   │───▶│ 复制/导出 │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│       │               │               │               │        │
│       ▼               ▼               ▼               ▼        │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ 用户动作  │    │ 纯本地处理│    │ 用户自有  │    │ 浏览器内  │  │
│  │ 触发     │    │ 无上传    │    │ API 服务  │    │ 完成     │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 绘制工具建议

1. **Excalidraw**（推荐）：手绘风格，适合技术文档，可导出 SVG
2. **Figma**：更正式，适合需要精确控制的设计
3. **Mermaid**：代码生成，适合维护，但样式受限
4. **draw.io**：免费，功能完整

### 提示词（如果用 AI 生成）

```
Create a simple workflow diagram in SVG style:
- 4 steps: "Input" → "Preprocess" → "API Call" → "Result"
- Each step in a rounded rectangle
- Arrows connecting them
- Minimal icons: mouse click, gear, cloud, copy icon
- Color scheme: gray boxes with blue accents
- Clean, technical style like documentation diagrams
- White background
```

---

## 六、Badge 设计

### 推荐 Badge 列表

```markdown
![Version](https://img.shields.io/badge/version-0.3.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Chrome](https://img.shields.io/badge/chrome-%3E%3D110-lightgrey)
![No Build](https://img.shields.io/badge/build-none-yellow)
![No Dependencies](https://img.shields.io/badge/deps-0-orange)
```

### Badge 说明

| Badge | 信息 | 颜色 |
|---|---|---|
| version | 当前版本号 | 蓝色 |
| license | MIT | 绿色 |
| chrome | 最低 Chrome 版本 | 灰色 |
| build | 无构建步骤 | 黄色 |
| deps | 零依赖 | 橙色 |

这些 badge 传递关键信息：版本活跃、开源、无复杂构建、轻量。

---

## 七、实施步骤

### 阶段 1：基础结构（30 分钟）

1. 创建 `docs/assets/` 目录
2. 在 README.md 顶部添加 badge 和快速导航链接
3. 调整标题格式（居中 + 标语）

### 阶段 2：真实截图（1 小时）

1. 准备干净的 Chrome 环境
2. 选择一张高质量示例图片
3. 截图：
   - 右键菜单（`demo-context-menu.svg`）
   - 结果页（`demo-result.svg`）
   - 设置页（`demo-options.svg`）
4. 压缩图片（tinypng.com 或类似工具）
5. 放入 `docs/assets/`

### 阶段 3：生成图形（30 分钟）

1. 制作 banner：
   - 使用 Figma/Canva 或 AI 生成
   - 尺寸 1280×320px
   - 保存为 `docs/assets/banner.svg`
2. 绘制流程图：
   - 使用 Excalidraw 或 draw.io
   - 导出为 `docs/assets/workflow.svg`

### 阶段 4：CWS 素材（30 分钟）

1. 制作 promotional tile（440×280px）
2. 整理 CWS 截图（1280×800px，至少 1 张）
3. 放入 `icons/` 目录

### 阶段 5：更新 README（30 分钟）

1. 在"工作原理"章节插入流程图
2. 在相关章节插入截图
3. 同步更新 zh-CN 和 zh-TW 版本
4. 测试图片链接是否正常

### 阶段 6：可选优化

1. 创建 `icons/icon.svg` 矢量源文件
2. 添加 CONTRIBUTING.md 中的截图规范
3. 考虑添加 CHANGELOG.md

---

## 八、图片优化建议

### 文件大小

- Banner：控制在 100KB 以内
- 截图：控制在 200KB 以内（单张）
- SVG：通常 < 50KB

### 压缩工具

- PNG：tinypng.com、squoosh.app
- SVG：svgo、svgomg

### 命名规范

- 使用小写字母和连字符
- 描述性命名（`demo-result.svg` 而非 `screenshot1.png`）
- CWS 素材统一前缀 `cws-`

---

## 九、中英文 README 差异处理

### 完全相同的部分

- 所有图片路径
- Badge 链接
- 结构和章节顺序

### 需要翻译的部分

- 标题下的标语
- 快速导航链接文字
- 图片 alt 文本

### 实施建议

1. 先完成英文版
2. 复制结构到中文版
3. 只翻译文字部分
4. 保持所有图片路径不变

---

## 十、最终检查清单

- [ ] `docs/assets/` 目录创建
- [ ] banner.svg 制作完成
- [ ] workflow.svg 绘制完成
- [ ] 3 张真实截图完成
- [ ] 图片压缩完成
- [ ] README.md 结构更新
- [ ] README.zh-CN.md 同步更新
- [ ] README.zh-TW.md 同步更新
- [ ] 所有图片链接测试通过
- [ ] CWS 素材准备完成
- [ ] 本地预览效果确认

---

## 附录：快速参考

### 推荐尺寸

| 资产 | 尺寸 | 格式 |
|---|---|---|
| banner.svg | 1280×320 | PNG |
| demo-*.png | 1280×800 | PNG |
| workflow.svg | 640×高度 | SVG |
| cws-promotional-tile.png | 440×280 | PNG |
| cws-screenshot-*.png | 1280×800 | PNG |

### 颜色参考

| 用途 | 颜色 | Hex |
|---|---|---|
| 主色调 | 电光蓝 | #00d4ff |
| 背景 | 深海军蓝 | #1a1a2e |
| 文字 | 纯白 | #ffffff |
| 次要文字 | 浅灰 | #a0a0a0 |
| 强调 | 青绿 | #00bcd4 |

### 工具推荐

| 用途 | 工具 |
|---|---|
| Banner 设计 | Figma、Canva、Midjourney |
| 流程图 | Excalidraw、draw.io |
| 截图 | macOS Screenshot (Cmd+Shift+4) |
| 图片压缩 | tinypng.com、squoosh.app |
| SVG 优化 | svgo、svgomg |
