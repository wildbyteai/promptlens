# Changelog

## Unreleased

### Features
- Add a unified Prompt Compiler that shares evidence, language, Negative Prompt, variant, and platform rules across API analysis and ChatGPT Assist.
- Add structured-output and target image-generation platform settings.
- Add Native JSON Schema, per-template Token budgets, truncation detection, and partial-success warnings.
- Add Anthropic Messages API `tool_use` support and Midjourney as a target-platform option.
- Centralize all structured output contracts in one Prompt Schema module shared by the compiler, adapters, and validator.
- Give Quick Copy a dedicated concise Schema that omits prompt variants and reduces its output Token budget.

### Fixes
- Preserve the marketing template type when duplicating the visual marketing template.
- Stop reporting a fully successful analysis when required prompt variants are incomplete.
- Stop appending API Schema instructions directly to ChatGPT Assist Markdown prompts.
- Increment custom template versions and modification timestamps when saving edits.
- Warn before saving a custom instruction that attempts to override the fixed format or Schema, requiring a second confirmation click.
- Publish only the complete Simplified Chinese and English extension locales; Traditional Chinese documentation remains separate from the extension UI.
- Prefer an explicit template type over the legacy marketing-template ID fallback.
- Localize Chinese ChatGPT Assist section names such as English Prompt, Tags, and Negative Prompt while retaining the English professional terms in parentheses.

### Observability
- Store Prompt Hash, Schema, Compiler, template version, target platform, model adapter, and validation metadata on new history records while keeping old records compatible.

### Validation
- Add a repeatable 10-image synthetic marketing benchmark for score dispersion and image-specific Negative Prompt rules without using business data.
- Add a CI gate that requires at least 80% line and function coverage across the core runtime modules.

## 0.6.0 - 2026-07-07

### Features
- Add ChatGPT Plus Assist mode for users who have ChatGPT Plus / Pro but do not use an API key.
- Add local assist actions to download the prepared image, copy a ChatGPT-ready instruction, and open ChatGPT.
- Add experimental ChatGPT handoff that requests optional `chatgpt.com` access only after user action, waits for the page to settle, attempts to attach the prepared image and fill the instruction, and leaves sending to the user.

### Fixes
- Stabilize ChatGPT handoff by keeping transfer payloads available until success, selecting the visible ChatGPT composer, preventing duplicate image attachments, and extending result-page status polling.

### Documentation
- Explain API Automatic Analysis versus ChatGPT Plus Assist mode.
- Document assist-mode privacy boundaries, optional ChatGPT page access, no automatic sending, and no ChatGPT reply reading.

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
