const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const optionsHtml = fs.readFileSync(path.join(root, 'options.html'), 'utf8');
const optionsJs = fs.readFileSync(path.join(root, 'options.js'), 'utf8');
const zhCatalog = JSON.parse(fs.readFileSync(path.join(root, '_locales/zh_CN/messages.json'), 'utf8'));
const enCatalog = JSON.parse(fs.readFileSync(path.join(root, '_locales/en/messages.json'), 'utf8'));

const keys = [...optionsHtml.matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g)].map(match => match[1]);
assert.ok(keys.length > 60, 'options page should mark its user-facing copy with data-i18n attributes');
for (const key of keys) {
  assert.ok(zhCatalog[key], `options.html references missing Chinese message: ${key}`);
  assert.ok(enCatalog[key], `options.html references missing English message: ${key}`);
}

assert.match(optionsHtml, /<select id="ui-language" name="uiLanguage">/);
assert.match(optionsHtml, /value="api"[\s\S]{0,220}data-i18n="analysisModeApiName"/);
assert.match(optionsHtml, /value="chatgpt_assist"[\s\S]{0,220}data-i18n="analysisModeChatgptName"/);
assert.match(optionsJs, /PromptLensI18n\.setLanguage\(uiLanguageSelect\.value\)/);
assert.match(optionsJs, /await window\.PromptLensI18n\.init\(\)/);
assert.match(optionsJs, /if \(!configSummary\.hidden\) await showSummary\(getCurrentFormConfig\(\)\)/);
assert.match(optionsJs, /renderLocalizedStatus\(configStatusBanner, currentConfigStatus\)/);
assert.match(optionsJs, /renderLocalizedStatus\(permStatusBanner, currentPermStatus\)/);
assert.doesNotMatch(
  optionsJs,
  /chrome\.storage\.local\.remove\(\[[^\]]*uiLanguage/s,
  'clearing API settings must not reset the interface language'
);
assert.doesNotMatch(optionsJs, /textContent\s*=\s*['"`][\u4e00-\u9fff][^'"`]*['"`]/, 'dynamic Chinese settings copy must not be hardcoded');

console.log('options language tests passed');
