# Chrome Web Store Listing Draft

## Basic details

- Extension name: PromptLens
- Version for this release: 0.3.0
- Category suggestion: Productivity or Developer Tools
- Language: English listing first; Chinese copy can be adapted from README files.

## Short description

Reverse-engineer reusable image prompts from web images or selected screenshot regions with your own OpenAI-compatible Vision API.

## Detailed description

PromptLens is a lightweight Chrome MV3 extension for analyzing web images and selected screenshot regions. It sends the selected image only to the OpenAI-compatible Vision API endpoint configured by the user, then returns structured prompt material that can be reused in image generation workflows.

PromptLens is designed to stay transparent and local-first. It has no built-in backend service, no account system, no payment system, and no telemetry. API keys and settings are stored in the browser with `chrome.storage.local`.

Core capabilities:

- Right-click a web image and generate reverse image prompts.
- Select a visible page region for `blob:` images, hotlink-protected images, or cases where remote image permission is not granted.
- Configure your own AI Base URL, API Key, and vision-capable model.
- Use provider presets for OpenAI, DeepSeek, Alibaba, SiliconFlow, Groq, OpenRouter, Ollama, or a custom OpenAI-compatible endpoint.
- Choose built-in output templates or create custom templates.
- Copy individual fields, copy all results, or download JSON and Markdown.
- Optionally keep local text history in the browser. History is off by default and does not save image thumbnails.

PromptLens does not provide model service access. Users need their own API service that supports vision input.

## Permissions and shortcut explanation

- `contextMenus`: adds right-click actions for image analysis and screenshot selection.
- `storage`: stores local settings, selected templates, optional local history, and temporary input data.
- `activeTab`: accesses the current tab only after a user action starts screenshot selection.
- `scripting`: injects the screenshot selection script and styles after user action.
- Shortcut registration: the manifest `commands` entry registers the screenshot selection shortcut, currently `Alt+Shift+S` by default.
- Optional host permissions (`<all_urls>`): requested only when the user chooses to grant image read permission for remote images or when needed for the configured API origin.

## Screenshot plan

Recommended screenshots:

1. Options page showing provider configuration, template selection, and permission explanation.
2. Context menu showing image analysis and screenshot selection actions.
3. Result page showing structured prompt output and export buttons.
4. Optional local history page showing text-only saved results, with a note that history is disabled by default.

## Do not claim

Do not claim these capabilities in the listing:

- Built-in cloud model access.
- Cloud sync.
- Team collaboration.
- Automatic submission to third-party image generation websites.
- Batch processing.
- Official Firefox support.
