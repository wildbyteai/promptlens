const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const background = fs.readFileSync(path.join(root, 'background.js'), 'utf8');
const content = fs.readFileSync(path.join(root, 'content.js'), 'utf8');

assert.equal(manifest.default_locale, 'zh_CN');
assert.equal(manifest.commands['capture-selection'].description, '__MSG_commandCaptureSelectionDescription__');
assert.match(background, /^importScripts\('i18n\.js'\);/);
assert.match(background, /title: t\('menuAnalyzeImage'\)/);
assert.match(background, /title: t\('menuCaptureSelection'\)/);
assert.match(background, /PromptLensI18n\.onChange\(\(\) => \{\s*registerContextMenus/s);
assert.match(background, /input\.messageKey = error\.i18nKey/);
assert.match(background, /throw localizedError\('errorCannotAccessTab'\)/);
assert.match(background, /copy:\s*\{\s*hint: t\('selectionHint'\),\s*cancel: t\('selectionCancel'\),\s*tooSmall: t\('selectionTooSmall'\)/s);
assert.match(content, /startSelection\(message\.copy \|\| \{\}\)/);
assert.doesNotMatch(content, /[\u4e00-\u9fff]/, 'selection overlay copy must be supplied by the localized background flow');

console.log('background language tests passed');
