# Changelog

## 0.6.0 - 2026-07-07

### Features
- Add ChatGPT Plus Assist mode for users who have ChatGPT Plus / Pro but do not use an API key.
- Add local assist actions to download the prepared image, copy a ChatGPT-ready instruction, and open ChatGPT.
- Keep assist mode local-only: no chatgpt.com permission, no automatic upload, no automatic send, and no ChatGPT reply reading.

### Documentation
- Explain API Automatic Analysis versus ChatGPT Plus Assist mode.
- Document assist-mode privacy boundaries and manual ChatGPT web usage.

## 0.5.1 - 2026-07-06

### Fixes
- Remove Quick Test and Vision Test from the options page because real image analysis can work even when synthetic model-test requests fail through some gateways.
- Simplify First Success onboarding to guide users from API configuration directly to right-click image analysis or screenshot selection.
- Remove local model-test status documentation so setup guidance matches the actual product flow.

## 0.5.0 - 2026-07-06

### Features
- Add First Success onboarding on the options page to guide users through BYO Vision API setup, first image analysis, and copy/export outcomes.
- Add lightweight checklist state and collapsible onboarding persistence.
- Add minimal Provider setup examples for OpenAI-compatible services, OpenAI, Ollama, OpenRouter/SiliconFlow, and DeepSeek compatibility caveats.
- Add contextual result-page next steps for prompt workflows and visual marketing diagnosis workflows.
- Add a one-click marketing business-context example for visual marketing diagnosis.

### Fixes
- Align result next-step styles with the existing Warm Studio theme tokens.
- Point website download links to GitHub Releases.

### Documentation
- Document the First Success onboarding path, BYO Vision API privacy boundaries, and bilingual discoverability improvements.
- Update Chrome Web Store release preparation notes for v0.5.0.
