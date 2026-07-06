# PromptLens v0.5.0 Release Checklist

Use this checklist before publishing the GitHub Release artifact or submitting to Chrome Web Store.

## Version and manifest

- [ ] `manifest.json` version is `0.5.0`.
- [ ] `manifest.json` uses Manifest V3.
- [ ] Required permissions are still limited to `contextMenus`, `storage`, `activeTab`, and `scripting`.
- [ ] `commands` registers the screenshot shortcut description.
- [ ] `optional_host_permissions` remains optional and explains remote image/API origin access.

## Packaging

- [ ] Run `bash scripts/package-extension.sh`.
- [ ] Confirm `dist/promptlens-v0.5.0.zip` exists.
- [ ] Run `unzip -Z1 dist/promptlens-v0.5.0.zip | sort`.
- [ ] Confirm the zip contains `manifest.json`, root extension scripts/pages, `_locales/**`, and `icons/**`.
- [ ] Confirm the zip does not contain `.git/`, `docs/`, `site/`, `dist/`, README files, screenshot source files, or `skills-lock.json`.

## Manual extension smoke test

- [ ] Load the unpacked repository root in `chrome://extensions` with Developer mode enabled.
- [ ] Confirm Chrome reports no manifest error.
- [ ] Open the options page and save AI Base URL, API Key, Model, and default template.
- [ ] Run model test and confirm success/failure UI does not expose unnecessary remote error detail.
- [ ] Right-click a normal web image and start analysis.
- [ ] Right-click a page and use screenshot selection.
- [ ] Press `Alt+Shift+S` and confirm screenshot selection starts, or document any browser shortcut conflict.
- [ ] Confirm result page can copy individual fields, copy all fields, download JSON, and download Markdown.
- [ ] Create, copy, edit, delete, export, and import a custom template.
- [ ] Confirm local history is off by default.
- [ ] Enable local history, generate one result, and clear history.

## GitHub Release

- [ ] Confirm `v0.5.0` tag does not already exist locally or remotely before creating it.
- [ ] Create annotated tag `v0.5.0`.
- [ ] Create GitHub Release `v0.5.0`.
- [ ] Upload `dist/promptlens-v0.5.0.zip` as the Release artifact.
- [ ] Confirm the Release page shows the uploaded zip.

## Website

- [ ] Confirm `site/index.html` download links point to `https://github.com/wildbyteai/promptlens/releases`.
- [ ] Confirm `site/privacy/index.html` download links point to `https://github.com/wildbyteai/promptlens/releases`.
- [ ] Confirm `site/support/index.html` download links point to `https://github.com/wildbyteai/promptlens/releases`.

## Chrome Web Store material

- [ ] Review `docs/chrome-web-store/store-listing.md`.
- [ ] Review `docs/chrome-web-store/privacy-practices.md`.
- [ ] Confirm screenshots match current UI.
- [ ] Confirm support and privacy URLs are available on the website.
