# Chrome Web Store Privacy Practices Notes

This document supports Chrome Web Store privacy-practices form preparation for PromptLens v0.6.0. It is not legal advice.

## Product privacy boundary

PromptLens has no project-operated backend, no telemetry, no account system, and no payment system. The extension runs in the user's browser and sends image data only to the AI Base URL configured by the user.

## Data stored locally

PromptLens stores the following in `chrome.storage.local` and IndexedDB:

- AI Base URL.
- API Key.
- Model name.
- Default output template.
- Custom templates.
- Local history setting.
- Image normalization settings, including maximum image side length and JPEG quality.
- Optional local history entries in the browser-local IndexedDB database when the user enables history.

Optional local history entries contain text results, source domain, timestamps, and template metadata. PromptLens does not save image thumbnails in local history.

## Data transmitted remotely

PromptLens sends data to the user's configured OpenAI-compatible Vision API endpoint when the user starts analysis. The request can include:

- The selected image or screenshot region, normalized locally before upload.
- The selected prompt template instructions.
- The configured model name.
- The user's API Key in the API request authorization header.

The project maintainer does not receive this data unless the user configures an endpoint operated by the maintainer.

## Data not collected by PromptLens

PromptLens itself does not collect or sell:

- Personally identifiable information.
- Health information.
- Financial or payment information.
- Authentication credentials for websites visited by the user.
- Web browsing history as a telemetry stream.
- User activity analytics.

## ChatGPT Plus Assist mode

In ChatGPT Plus Assist mode, PromptLens prepares a local JPEG image and a ChatGPT-ready instruction in the browser. PromptLens does not call an API, does not automatically upload images to ChatGPT, does not read ChatGPT web replies, and does not save ChatGPT reply history. The assist mode does not add `chatgpt.com` permissions or `downloads` permission. After the user manually uploads the image to ChatGPT, the data is subject to OpenAI's privacy policy and the user's account settings.

### Optional ChatGPT page access

PromptLens may request optional access to `https://chatgpt.com/*` only when the user clicks the experimental ChatGPT handoff button. This access is used to try to attach the locally prepared JPEG and fill the analysis instruction into the ChatGPT page. PromptLens does not automatically send the message, does not read ChatGPT replies or conversation history, and does not store ChatGPT page content.

## Permissions and user control

Remote image read access is optional. If the user does not grant broad remote image permission, screenshot selection remains available for visible page regions.

Screenshot selection uses `activeTab` and `scripting` after a direct user action. It does not run continuous page monitoring.

## Third-party model providers

When users configure a third-party model provider, images and prompts are processed by that provider. Users should review the provider's privacy policy, retention policy, and terms before using it with sensitive images.

## Suggested Chrome Web Store form stance

- Disclose that user-provided content can be transmitted to the user-configured AI API endpoint for the single purpose of generating prompt results.
- Do not state that PromptLens collects telemetry, because the extension does not implement telemetry.
- Do not state that PromptLens sells data.
- Mention that API keys are stored locally in the browser and are used only to call the configured API endpoint.
