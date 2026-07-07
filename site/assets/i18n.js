// PromptLens website i18n. No external dependencies, no analytics.
(function () {
  'use strict';

  var STORAGE_KEY = 'promptlens-site-language';
  var SUPPORTED = ['en', 'zh-CN'];

  var ZH = {
    'PromptLens': 'PromptLens',
    'Skip to content': '跳到正文',
    'Features': '功能',
    'How it works': '工作原理',
    'Privacy': '隐私',
    'Support': '支持',
    'GitHub': 'GitHub',
    'Download from GitHub Releases': '从 GitHub Releases 下载',
    'Get PromptLens': '获取 PromptLens',
    'View on GitHub': '查看 GitHub',
    'Local-first Chrome MV3 extension': '本地优先的 Chrome MV3 扩展',
    'Reverse-engineer image prompts from any web image.': '从任意网页图片反向分析图片提示词。',
    'PromptLens is a local-first Chrome extension that analyzes web images or selected screenshot regions with your own OpenAI-compatible Vision API.': 'PromptLens 是一个本地优先的 Chrome 扩展，可用你自己的 OpenAI-compatible Vision API 分析网页图片或框选截图区域。',
    'PromptLens — Reverse image prompts and visual marketing diagnosis': 'PromptLens — 图片反推提示词与视觉营销诊断',
    'Local-first Chrome extension for image-to-prompt analysis, visual marketing diagnosis, and reusable prompts for Midjourney, Stable Diffusion, and OpenAI-compatible Vision APIs.': '本地优先的 Chrome 扩展，用于图片转提示词分析、视觉营销诊断，并为 Midjourney、Stable Diffusion 和 OpenAI-compatible Vision API 生成可复用提示词。',
    'Privacy details for PromptLens, a local-first Chrome extension that sends images only to your configured OpenAI-compatible Vision API.': 'PromptLens 隐私说明：本地优先的 Chrome 扩展，只会把图片发送到你配置的 OpenAI-compatible Vision API。',
    'PromptLens support for installation, provider setup, permissions, screenshot selection, and common image-to-prompt errors.': 'PromptLens 支持说明，涵盖安装、服务商配置、权限、框选截图和常见图片转提示词错误。',
    'No PromptLens backend.': '没有 PromptLens 后端。',
    'Bring your own API key.': '使用你自己的 API Key。',
    'Works from right-click or screenshot selection.': '支持右键图片和框选截图。',
    'Chrome Web Store listing is planned.': 'Chrome Web Store 上架计划中。',
    'Analyze images from the browser, then copy structured prompt output.': '在浏览器中分析图片，然后复制结构化提示词结果。',
    'PromptLens stays lightweight: no account system, no bundled model service, and no build step.': 'PromptLens 保持轻量：无账号系统、无内置模型服务、无构建步骤。',
    'Right-click image analysis': '右键图片分析',
    'Analyze web images directly from the browser context menu.': '直接从浏览器右键菜单分析网页图片。',
    'Screenshot selection': '框选截图分析',
    'Use Alt+Shift+S on Windows/Linux or Option+Shift+S on macOS to select a visible page region when images are protected, embedded, or hard to access.': '当图片受保护、嵌入页面或难以直接读取时，可用 Windows/Linux 的 Alt+Shift+S 或 macOS 的 Option+Shift+S 框选当前可见区域。',
    'Bring your own model': '自带模型服务',
    'Use any OpenAI-compatible Vision API by configuring your Base URL, API key, and model.': '配置 Base URL、API Key 和模型，即可使用任意 OpenAI-compatible Vision API。',
    'Structured prompt output': '结构化提示词输出',
    'Get Chinese prompts, English prompts, tags, negative prompts, JSON prompts, and raw JSON.': '输出中文提示词、English Prompt、Tags、Negative Prompt、JSON Prompt 和 Raw JSON。',
    'Visual marketing diagnosis': '视觉营销诊断',
    'Turn commercial visuals into owner-friendly summaries, marketing diagnosis, low-cost adaptation briefs, and Markdown case drafts.': '把商业视觉图转成老板看得懂的摘要、营销诊断、低成本改编 brief 和 Markdown 案例初稿。',
    'Interface languages': '界面语言',
    'Choose Chinese or English UI copy for options, history, and result workflows.': '设置、历史记录和结果流程可选择中文或英文界面文案。',
    'ChatGPT Plus Assist': 'ChatGPT Plus 辅助',
    'No API key? PromptLens can prepare a local JPEG and ChatGPT-ready instruction so you can upload them manually in ChatGPT Plus / Pro.': '没有 API Key？PromptLens 可在本地准备 JPEG 图片和 ChatGPT 指令，供你在 ChatGPT Plus / Pro 手动上传使用。',
    'Three user-triggered steps.': '三个由用户触发的步骤。',
    'Select an image': '选择图片',
    'Right-click a web image or select a visible screenshot region with Alt+Shift+S on Windows/Linux or Option+Shift+S on macOS.': '右键网页图片，或使用 Windows/Linux 的 Alt+Shift+S、macOS 的 Option+Shift+S 选择可见截图区域。',
    'Process locally': '本地处理',
    'PromptLens validates, crops, compresses, and normalizes the image in your browser.': 'PromptLens 会在浏览器中校验、裁剪、压缩并统一处理图片。',
    'Call your API': '调用你的 API',
    'The prepared image is sent directly to your configured OpenAI-compatible Vision API.': '处理后的图片会直接发送到你配置的 OpenAI-compatible Vision API。',
    'Accurate data boundary:': '清晰的数据边界：',
    'PromptLens has no backend. Images are only sent when you trigger analysis, and they are sent directly to the AI API endpoint you configure.': 'PromptLens 没有后端。只有在你触发分析时，图片才会直接发送到你配置的 AI API endpoint。',
    'Product screenshots': '产品截图',
    'Built for quick browser workflows.': '为快速浏览器工作流而设计。',
    'Analyze from the context menu': '从右键菜单开始分析',
    'Start from a right-click action on a web image or the current page.': '从网页图片或当前页面的右键操作开始。',
    'Configure your own provider': '配置你自己的服务商',
    'Set your OpenAI-compatible Base URL, API key, model, and image preferences.': '设置 OpenAI-compatible Base URL、API Key、模型和图片偏好。',
    'Copy structured prompt results': '复制结构化提示词结果',
    'Copy fields individually, export JSON, or download Markdown from the result page.': '在结果页单独复制字段、导出 JSON 或下载 Markdown。',
    'Copy fields individually, export JSON, or download Markdown from the result page. Marketing diagnosis exports can become publishable case drafts.': '在结果页单独复制字段、导出 JSON 或下载 Markdown。视觉营销诊断导出可作为可发布案例初稿。',
    'Privacy-aware': '重视隐私',
    'Local-first by design. No PromptLens backend.': '本地优先设计，没有 PromptLens 后端。',
    'PromptLens stores your configuration in your browser. The extension does not run a backend service, does not provide a default proxy, and does not collect telemetry.': 'PromptLens 将配置保存在浏览器本地。扩展不运行后端服务，不提供默认代理，也不收集遥测。',
    'Read the full Privacy Policy': '阅读完整隐私政策',
    'API keys stay in chrome.storage.local.': 'API Key 保存在 chrome.storage.local。',
    'Analysis runs only after user action.': '只有用户主动操作后才会分析。',
    'Images are sent directly to your configured API endpoint.': '图片直接发送到你配置的 API endpoint。',
    'Optional history is off by default.': '可选历史记录默认关闭。',
    'When enabled, history stores source image/page URLs locally for recall.': '开启后，历史记录会在本地保存来源图片/页面 URL 以便回溯。',
    'No image thumbnails are saved in history.': '历史记录不保存图片缩略图。',
    'Permissions': '权限',
    'What PromptLens requests and why.': 'PromptLens 请求哪些权限，以及原因。',
    'These permissions match the current Chrome MV3 manifest.': '这些权限与当前 Chrome MV3 manifest 保持一致。',
    'Permission': '权限',
    'Why PromptLens uses it': 'PromptLens 使用原因',
    'Adds right-click actions for image analysis and screenshot selection.': '创建图片分析和框选截图的右键菜单。',
    'Stores API configuration, templates, local history settings, and temporary input state in the browser.': '在浏览器中保存 API 配置、模板、本地历史设置和临时输入状态。',
    'Supports current-tab screenshot capture after the user starts screenshot selection.': '在用户启动框选截图后支持当前标签页截图。',
    'Injects the screenshot selection overlay into the active page after user action.': '在用户操作后向当前页面注入框选截图遮罩。',
    'Optional site access requested only when needed to read remote images or access the user-configured API origin; it is not a required install-time site permission.': '仅在读取远程图片或访问用户配置的 API origin 时按需请求可选站点访问权限；它不是安装时必需权限。',
    'User-triggered:': '用户触发：',
    'activeTab and scripting are used only when you start screenshot selection.': 'activeTab 和 scripting 只在你启动框选截图时使用。',
    'No background scanning:': '无后台扫描：',
    'PromptLens does not continuously inspect pages in the background.': 'PromptLens 不会在后台持续检查页面。',
    'Optional site access:': '可选站点访问：',
    'You can refuse remote image read permission and use screenshot selection instead.': '你可以拒绝远程图片读取权限，改用框选截图。',
    'Install': '安装',
    'Get PromptLens before the Chrome Web Store listing is available.': '在 Chrome Web Store 上架前获取 PromptLens。',
    'Use the latest release package or follow the source install instructions.': '使用最新 release 包，或按源码安装步骤加载。',
    'Load from source': '从源码加载',
    'Download or clone the repository.': '下载或克隆仓库。',
    'Open chrome://extensions.': '打开 chrome://extensions。',
    'Enable Developer mode.': '开启开发者模式。',
    'Click Load unpacked.': '点击“加载已解压的扩展程序”。',
    'Select the extension folder.': '选择扩展目录。',
    'FAQ': '常见问题',
    'Common questions.': '常见问题。',
    'Does PromptLens provide an AI model or API key?': 'PromptLens 提供 AI 模型或 API Key 吗？',
    'No. PromptLens is a frontend-only extension. You bring your own OpenAI-compatible Vision API endpoint, API key, and model.': '不提供。PromptLens 是纯前端扩展，你需要自备 OpenAI-compatible Vision API endpoint、API Key 和模型。',
    'Does PromptLens upload images to its own server?': 'PromptLens 会把图片上传到自己的服务器吗？',
    'No. PromptLens does not operate a backend server. When you trigger analysis, the selected image data is sent directly from your browser to the API endpoint you configure.': '不会。PromptLens 不运营后端服务器。触发分析时，选中的图片数据会直接从浏览器发送到你配置的 API endpoint。',
    'Where is my API key stored?': '我的 API Key 存在哪里？',
    'Your API key is stored locally in Chrome extension storage. It is not sent to PromptLens, but browser-local storage is not a hardware security vault. You should only use this extension on devices and browser profiles you trust.': '你的 API Key 保存在 Chrome 扩展本地存储中，不会发送给 PromptLens。但浏览器本地存储不是硬件级密钥保险箱，请只在可信设备和浏览器资料中使用本扩展。',
    'Does PromptLens save image history?': 'PromptLens 会保存图片历史吗？',
    'Local history is off by default. When enabled, it stores text results, source domain, source image URL, page URL, template metadata, and structured output in IndexedDB. It does not save image thumbnails. Source URLs may include signed query parameters or private path details, so keep history disabled or clear it if you do not want that local metadata retained.': '本地历史记录默认关闭。开启后会在 IndexedDB 中保存文本结果、来源域名、来源图片 URL、页面 URL、模板信息和结构化输出，不保存图片缩略图。来源 URL 可能包含签名参数或私有路径信息；如果不希望保留这些本地元数据，请保持历史关闭或及时清空。',
    'Why does PromptLens request optional site access?': '为什么 PromptLens 请求可选站点访问权限？',
    'Remote image analysis may require optional permission to read image URLs from websites. This is not a required install-time site permission. You can skip this and use screenshot selection instead.': '远程图片分析可能需要可选权限来读取网站图片 URL。这不是安装时必需的站点权限，你可以跳过并改用框选截图。',
    'Local-first reverse image prompt analysis.': '本地优先的图片反推提示词分析。',
    'Privacy Policy': '隐私政策',
    'Security': '安全',
    'License': '许可证',
    'PromptLens Privacy Policy': 'PromptLens 隐私政策',
    'PromptLens is a frontend-only Chrome extension. This policy explains what stays in your browser, what is sent to your configured AI provider, and what PromptLens does not collect.': 'PromptLens 是一个纯前端 Chrome 扩展。本政策说明哪些数据保留在浏览器中，哪些数据会发送到你配置的 AI 服务，以及 PromptLens 不会收集什么。',
    'Last updated: July 1, 2026': '最后更新：2026 年 7 月 1 日',
    '1. Overview': '1. 概览',
    'PromptLens helps you generate structured reverse image prompts from web images or selected screenshot regions. It is designed as a local-first Chrome extension with no PromptLens-operated backend service.': 'PromptLens 帮助你从网页图片或框选截图区域生成结构化图片反推提示词。它是本地优先的 Chrome 扩展，没有 PromptLens 运营的后端服务。',
    'When you trigger analysis, selected image data is sent directly from your browser to the AI API endpoint you configure.': '当你触发分析时，选中的图片数据会从浏览器直接发送到你配置的 AI API endpoint。',
    '2. What PromptLens does': '2. PromptLens 做什么',
    'PromptLens lets you right-click a web image or select a visible page region, processes that image in your browser, and calls your configured OpenAI-compatible Vision API to generate prompt results.': 'PromptLens 允许你右键网页图片或选择可见页面区域，在浏览器中处理图片，并调用你配置的 OpenAI-compatible Vision API 生成提示词结果。',
    'PromptLens does not provide an AI model, proxy, API key, account system, or payment service.': 'PromptLens 不提供 AI 模型、代理、API Key、账号系统或支付服务。',
    '3. Data stored locally': '3. 本地存储的数据',
    'PromptLens stores settings such as API Base URL, API key, model name, selected template, image processing preferences, and local history preference in your browser.': 'PromptLens 会在浏览器中保存 API Base URL、API Key、模型名称、所选模板、图片处理偏好和本地历史偏好等设置。',
    'Current configuration keys stored in chrome.storage.local include:': '当前存储在 chrome.storage.local 中的配置键包括：',
    'Local history uses IndexedDB object storage named history-items. Temporary image payloads may be held in browser session storage or IndexedDB while an analysis is in progress, including pending payload handoff data.': '本地历史记录使用名为 history-items 的 IndexedDB 对象存储。分析过程中，临时图片 payload 可能保存在浏览器 session storage 或 IndexedDB 中，包括待处理 payload 交接数据。',
    'Your API key is stored locally in Chrome extension storage. It is not sent to PromptLens, but browser-local storage is not a hardware security vault. Use PromptLens only on devices, browser profiles, and extension environments you trust.': '你的 API Key 保存在 Chrome 扩展本地存储中，不会发送给 PromptLens。但浏览器本地存储不是硬件级密钥保险箱，请只在你信任的设备、浏览器资料和扩展环境中使用 PromptLens。',
    '4. Data sent to your configured AI provider': '4. 发送到你配置的 AI 服务的数据',
    'When you trigger analysis, selected image data and the prompt template request are sent directly from your browser to the OpenAI-compatible Vision API endpoint you configure.': '当你触发分析时，选中的图片数据和提示词模板请求会直接从浏览器发送到你配置的 OpenAI-compatible Vision API endpoint。',
    'Your configured AI provider may process, log, retain, or use requests according to its own terms and privacy policy. PromptLens does not control third-party provider behavior. Only configure API providers and endpoints you trust.': '你配置的 AI 服务商可能会根据其条款和隐私政策处理、记录、保留或使用请求。PromptLens 无法控制第三方服务商行为，请只配置你信任的 API 服务和 endpoint。',
    '5. Data PromptLens does not collect': '5. PromptLens 不收集的数据',
    'PromptLens does not operate a backend server.': 'PromptLens 不运营后端服务器。',
    'PromptLens does not collect telemetry.': 'PromptLens 不收集遥测。',
    'PromptLens does not receive your API key.': 'PromptLens 不接收你的 API Key。',
    'PromptLens does not receive your images.': 'PromptLens 不接收你的图片。',
    'PromptLens does not receive your prompt results.': 'PromptLens 不接收你的提示词结果。',
    '6. Optional local history': '6. 可选本地历史记录',
    'Local history is off by default. When enabled, it stores text results, source domain, source image URL, page URL, template metadata, and structured output in IndexedDB. It does not save image thumbnails.': '本地历史记录默认关闭。开启后，它会在 IndexedDB 中保存文本结果、来源域名、来源图片 URL、页面 URL、模板信息和结构化输出，不保存图片缩略图。',
    'Complete source URLs are local history metadata and may include signed query parameters, private path details, or customer/project/brand information. If you do not want PromptLens to retain this local metadata, keep local history disabled, delete individual history items, or clear all history from the options page.': '完整来源 URL 属于本地历史元数据，可能包含签名查询参数、私有路径详情或客户/项目/品牌信息。如果不希望 PromptLens 保留这些本地元数据，请保持本地历史关闭、删除单条历史，或在设置页清空全部历史。',
    '7. Permissions': '7. 权限',
    'Purpose': '用途',
    'activeTab and scripting are used only after you start screenshot selection. PromptLens does not continuously scan pages in the background. You can refuse remote image read permission and use screenshot selection instead.': 'activeTab 和 scripting 只会在你启动框选截图后使用。PromptLens 不会在后台持续扫描页面。你可以拒绝远程图片读取权限，并改用框选截图。',
    '8. Third-party AI providers': '8. 第三方 AI 服务商',
    'PromptLens is compatible with OpenAI-style Vision API services, but you choose the provider, endpoint, API key, and model. Review your provider\'s privacy policy, retention policy, and terms before sending images or prompts.': 'PromptLens 兼容 OpenAI 风格的 Vision API 服务，但服务商、endpoint、API Key 和模型都由你选择。在发送图片或提示词前，请自行查看服务商的隐私政策、保留策略和条款。',
    '9. Data deletion': '9. 数据删除',
    'You can delete PromptLens data by:': '你可以通过以下方式删除 PromptLens 数据：',
    'Clearing settings in the extension options page.': '在扩展设置页清除设置。',
    'Clearing local history in the extension options page.': '在扩展设置页清空本地历史。',
    'Removing the extension from Chrome.': '从 Chrome 中移除扩展。',
    'Clearing Chrome extension storage manually.': '手动清除 Chrome 扩展存储。',
    '10. Changes to this policy': '10. 本政策变更',
    'This policy may be updated when PromptLens changes its data flow, storage behavior, permissions, or support channels. Material changes should be reflected here before release.': '当 PromptLens 的数据流、存储行为、权限或支持渠道发生变化时，本政策可能会更新。重要变更应在发布前反映在此页面。',
    '11. Contact': '11. 联系方式',
    'For support, privacy questions, or issue reports, use GitHub Issues.': '如需支持、隐私咨询或问题反馈，请使用 GitHub Issues。',
    'This page is provided for product transparency and Chrome Web Store review support. It is not a statement that a legal review has been completed.': '本页面用于产品透明度和 Chrome Web Store 审核支持，并不表示已经完成法律审查。',
    'PromptLens support': 'PromptLens 支持',
    'Find installation steps, provider setup notes, permission explanations, screenshot selection shortcuts, and common error guidance.': '查看安装步骤、服务商配置说明、权限解释、框选截图快捷键和常见错误指引。',
    'Support topics': '支持主题',
    'Installation': '安装',
    'Configure your AI provider': '配置你的 AI 服务商',
    'Image read permission': '图片读取权限',
    'Common errors': '常见错误',
    'Contact': '联系方式',
    'Download from GitHub Releases': '从 GitHub Releases 下载',
    'Use the latest release package from GitHub Releases. Chrome Web Store listing is planned.': '请使用 GitHub Releases 中的最新发布包。Chrome Web Store 上架计划中。',
    'Open Chrome and go to chrome://extensions.': '打开 Chrome 并进入 chrome://extensions。',
    'Click Load unpacked.': '点击“加载已解压的扩展程序”。',
    'PromptLens does not provide an AI model or API key. Open the options page and configure:': 'PromptLens 不提供 AI 模型或 API Key。请打开设置页并配置：',
    'AI Base URL: an HTTPS OpenAI-compatible endpoint, for example https://api.openai.com/v1.': 'AI Base URL：HTTPS OpenAI-compatible endpoint，例如 https://api.openai.com/v1。',
    'API Key: your provider key.': 'API Key：你的服务商密钥。',
    'Model: a model that supports vision input.': 'Model：支持视觉输入的模型。',
    'Template: the output structure you want PromptLens to request.': 'Template：你希望 PromptLens 请求的输出结构。',
    'Local development endpoints may use http://localhost or http://127.0.0.1.': '本地开发 endpoint 可以使用 http://localhost 或 http://127.0.0.1。',
    'Remote image analysis may require optional site access so PromptLens can read image URLs from websites or access the API origin you configure. This is an optional host permission, not a required install-time site permission.': '远程图片分析可能需要可选站点访问权限，以便 PromptLens 读取网站图片 URL 或访问你配置的 API origin。这是可选 host permission，不是安装时必需的站点权限。',
    'Use Alt+Shift+S on Windows/Linux or Option+Shift+S on macOS to start screenshot selection. You can also use the context menu action.': '使用 Windows/Linux 的 Alt+Shift+S 或 macOS 的 Option+Shift+S 启动框选截图。你也可以使用右键菜单操作。',
    'Screenshot selection is useful for blob: images, hotlink-protected images, embedded canvases, or pages where remote image reads fail. Press Esc or click Cancel to exit selection mode.': '框选截图适用于 blob: 图片、防盗链图片、嵌入式 canvas，或远程图片读取失败的页面。按 Esc 或点击取消可退出框选模式。',
    'Missing API configuration': '缺少 API 配置',
    'Open the options page and save your Base URL, API key, and vision-capable model name.': '打开设置页并保存 Base URL、API Key 和支持视觉输入的模型名称。',
    'API authentication failed': 'API 鉴权失败',
    'Check whether the API key is valid for the provider and model you configured.': '检查 API Key 是否对所配置的服务商和模型有效。',
    'Model does not support vision input': '模型不支持视觉输入',
    'Choose a model that accepts image input through an OpenAI-compatible vision request format.': '请选择支持通过 OpenAI-compatible 视觉请求格式接收图片输入的模型。',
    'Remote image cannot be read': '无法读取远程图片',
    'Grant optional image read permission for the site, or use screenshot selection for the visible region.': '为该网站授予可选图片读取权限，或对可见区域使用框选截图。',
    'Image is too large': '图片过大',
    'Adjust image processing preferences in options, or use screenshot selection to capture a smaller region.': '在设置中调整图片处理偏好，或使用框选截图捕获更小区域。',
    'SVG is not supported': '不支持 SVG',
    'Use screenshot selection to capture the rendered SVG area as a raster image.': '请使用框选截图将渲染后的 SVG 区域捕获为位图。',
    'Blob images require screenshot selection': 'Blob 图片需要使用框选截图',
    'blob: URLs are page-local and may not be readable from the extension context. Select the visible page region instead.': 'blob: URL 是页面局部地址，扩展上下文可能无法读取。请改为选择可见页面区域。',
    'The default support channel is GitHub Issues. Please include your browser version, PromptLens version, provider type, model name, and the exact error message when reporting a problem.': '默认支持渠道是 GitHub Issues。反馈问题时，请包含浏览器版本、PromptLens 版本、服务商类型、模型名称和准确错误信息。',
    'Do not post API keys, private image data, or sensitive prompts in public issues.': '请不要在公开 issue 中发布 API Key、私有图片数据或敏感提示词。',
    'PromptLens — Reverse-engineer image prompts from web images': 'PromptLens — 从网页图片反向分析提示词',
    'Privacy Policy — PromptLens': '隐私政策 — PromptLens',
    'Support — PromptLens': '支持 — PromptLens',
    'PromptLens support page for installation, provider configuration, permissions, screenshot selection, and common errors.': 'PromptLens 支持页，包含安装、服务商配置、权限、框选截图和常见错误说明。',
    'Privacy Policy for PromptLens, a local-first Chrome extension that uses your configured OpenAI-compatible Vision API.': 'PromptLens 隐私政策。PromptLens 是本地优先的 Chrome 扩展，使用你配置的 OpenAI-compatible Vision API。',
    'PromptLens trust points': 'PromptLens 可信点',
    'PromptLens product screenshots': 'PromptLens 产品截图',
    'Analyze from the context menu': '从右键菜单开始分析',
    'Configure your own provider': '配置你自己的服务商',
    'PromptLens structured prompt result page': 'PromptLens 结构化提示词结果页',
    'PromptLens context menu actions': 'PromptLens 右键菜单操作',
    'PromptLens options page for model configuration': 'PromptLens 模型配置设置页',
    'Open': '打开',
    '.': '。',
    'and': '和',
    'are used only when you start screenshot selection.': '只会在你启动框选截图时使用。',
    'include:': '包括：',
    'Current configuration keys stored in': '当前存储在',
    'Use the latest release package from': '请使用来自',
    'GitHub Releases': 'GitHub Releases',
    '. Chrome Web Store listing is planned.': '的最新发布包。Chrome Web Store 上架计划中。',
    'Open Chrome and go to': '打开 Chrome 并进入',
    'Enable': '开启',
    'Developer mode': '开发者模式',
    'Click': '点击',
    'Load unpacked': '加载已解压的扩展程序',
    'AI Base URL:': 'AI Base URL：',
    'an HTTPS OpenAI-compatible endpoint, for example': 'HTTPS OpenAI-compatible endpoint，例如',
    'API Key:': 'API Key：',
    'your provider key.': '你的服务商密钥。',
    'Model:': 'Model：',
    'a model that supports vision input.': '支持视觉输入的模型。',
    'Template:': 'Template：',
    'the output structure you want PromptLens to request.': '你希望 PromptLens 请求的输出结构。',
    'Local development endpoints may use': '本地开发 endpoint 可以使用',
    'or': '或',
    'images, hotlink-protected images, embedded canvases, or pages where remote image reads fail. Press Esc or click Cancel to exit selection mode.': '图片、防盗链图片、嵌入式 canvas，或远程图片读取失败的页面。按 Esc 或点击取消可退出框选模式。',
    'URLs are page-local and may not be readable from the extension context. Select the visible page region instead.': 'URL 是页面局部地址，扩展上下文可能无法读取。请改为选择可见页面区域。',
    'The default support channel is': '默认支持渠道是',
    '. Please include your browser version, PromptLens version, provider type, model name, and the exact error message when reporting a problem.': '。反馈问题时，请包含浏览器版本、PromptLens 版本、服务商类型、模型名称和准确错误信息。',
    'For support, privacy questions, or issue reports, use': '如需支持、隐私咨询或问题反馈，请使用',
    'Menu': '菜单',
    'Close': '关闭',
    'Open navigation': '打开导航',
    'Close navigation': '关闭导航',
    'Primary navigation': '主导航',
    'Footer navigation': '页脚导航',
    'Language switcher': '语言切换'
  };

  var originalText = new WeakMap();
  var originalAttrs = new WeakMap();

  function getStoredLanguage() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return '';
    }
  }

  function storeLanguage(lang) {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch (error) {
      // Ignore storage failures; the current page still switches language.
    }
  }

  function normalizeLanguage(lang) {
    return SUPPORTED.indexOf(lang) >= 0 ? lang : 'en';
  }

  function detectLanguage() {
    var stored = normalizeLanguage(getStoredLanguage());
    if (stored !== 'en' || getStoredLanguage() === 'en') return stored;
    var browserLanguage = (navigator.language || '').toLowerCase();
    return browserLanguage.indexOf('zh') === 0 ? 'zh-CN' : 'en';
  }

  function translateText(text, lang) {
    if (lang === 'en') return text;
    return ZH[text] || text;
  }

  function shouldSkipNode(node) {
    var parent = node.parentElement;
    return !parent || ['SCRIPT', 'STYLE', 'NOSCRIPT'].indexOf(parent.tagName) >= 0;
  }

  function translateTextNodes(root, lang) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (shouldSkipNode(node)) return NodeFilter.FILTER_REJECT;
        return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      if (!originalText.has(node)) originalText.set(node, node.nodeValue);
      var original = originalText.get(node);
      var leading = original.match(/^\s*/)[0];
      var trailing = original.match(/\s*$/)[0];
      var trimmed = original.trim();
      node.nodeValue = leading + translateText(trimmed, lang) + trailing;
    });
  }

  function translateAttributes(lang) {
    var attrs = ['aria-label', 'alt', 'title', 'content'];
    attrs.forEach(function (attr) {
      document.querySelectorAll('[' + attr + ']').forEach(function (element) {
        if (attr === 'content' && element.tagName !== 'META') return;
        var perElement = originalAttrs.get(element) || {};
        if (!perElement[attr]) perElement[attr] = element.getAttribute(attr);
        originalAttrs.set(element, perElement);
        element.setAttribute(attr, translateText(perElement[attr], lang));
      });
    });
  }

  function updateLanguageSwitcher(lang) {
    document.querySelectorAll('[data-lang-option]').forEach(function (button) {
      var isActive = button.getAttribute('data-lang-option') === lang;
      button.setAttribute('aria-pressed', String(isActive));
      button.classList.toggle('is-active', isActive);
    });
  }

  function updateNavigationToggle(lang) {
    var toggle = document.querySelector('.nav-toggle');
    if (!toggle) return;
    var expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.textContent = translateText(expanded ? 'Close' : 'Menu', lang);
    toggle.setAttribute('aria-label', translateText(expanded ? 'Close navigation' : 'Open navigation', lang));
  }

  function applyLanguage(lang) {
    lang = normalizeLanguage(lang);
    document.documentElement.lang = lang;
    translateTextNodes(document.body, lang);
    translateAttributes(lang);
    updateLanguageSwitcher(lang);
    updateNavigationToggle(lang);
    window.PromptLensSiteLanguage = lang;
  }

  function bindSwitcher() {
    document.querySelectorAll('[data-lang-option]').forEach(function (button) {
      button.addEventListener('click', function () {
        var lang = normalizeLanguage(button.getAttribute('data-lang-option'));
        storeLanguage(lang);
        applyLanguage(lang);
      });
    });
  }

  function init() {
    bindSwitcher();
    applyLanguage(detectLanguage());
  }

  window.PromptLensI18n = {
    applyLanguage: function (lang) {
      storeLanguage(normalizeLanguage(lang));
      applyLanguage(lang);
    },
    refresh: function () {
      applyLanguage(window.PromptLensSiteLanguage || detectLanguage());
    },
    translateText: translateText
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
