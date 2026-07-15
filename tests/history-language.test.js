const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const historyHtml = fs.readFileSync(path.join(root, 'history.html'), 'utf8');
const historyJs = fs.readFileSync(path.join(root, 'history.js'), 'utf8');
const historyFormatJs = fs.readFileSync(path.join(root, 'history-format.js'), 'utf8');
const resultJs = fs.readFileSync(path.join(root, 'result.js'), 'utf8');
const zhCatalog = JSON.parse(fs.readFileSync(path.join(root, '_locales/zh_CN/messages.json'), 'utf8'));
const enCatalog = JSON.parse(fs.readFileSync(path.join(root, '_locales/en/messages.json'), 'utf8'));

const keys = [...historyHtml.matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g)].map(match => match[1]);
assert.ok(keys.length >= 8, 'history page should mark its user-facing copy with data-i18n attributes');
for (const key of keys) {
  assert.ok(zhCatalog[key], `history.html references missing Chinese message: ${key}`);
  assert.ok(enCatalog[key], `history.html references missing English message: ${key}`);
}

assert.ok(
  historyHtml.indexOf('<script src="i18n.js"></script>') < historyHtml.indexOf('<script src="history.js"></script>'),
  'history page must load i18n.js before history.js'
);
assert.ok(
  historyHtml.indexOf('<script src="prompt-schemas.js"></script>') < historyHtml.indexOf('<script src="prompt-variants.js"></script>'),
  'history page must load the shared Prompt Schema before prompt variants'
);
assert.match(historyJs, /await window\.PromptLensI18n\.init\(\)/);
assert.match(historyJs, /PromptLensI18n\.onChange/);
assert.match(historyJs, /getBuiltInTemplateById\(item\.templateId\)/, 'built-in history template names should resolve from stable ids');
assert.doesNotMatch(historyJs, /textContent\s*=\s*['"`][\u4e00-\u9fff][^'"`]*['"`]/, 'dynamic Chinese history copy must not be hardcoded');
assert.doesNotMatch(historyFormatJs, /label:\s*['"`][\u4e00-\u9fff]/, 'history field labels must come from the locale catalog');
assert.match(resultJs, /const outputLanguage = window\.PromptLensI18n\.getLanguage\(\)/);
assert.match(resultJs, /callVisionApi\(prepared, template, outputLanguage, config\)/);
assert.match(resultJs, /const displayTemplate = await window\.PromptTemplates\.getTemplateById\(template\.id\)/);
assert.match(resultJs, /maybeSaveHistory\(input, parsed, displayTemplate, outputLanguage, \{/);
assert.match(resultJs, /promptHash,/);
assert.match(resultJs, /schemaId: compiledPrompt\.schemaId/);
assert.match(resultJs, /contentLanguage,/);

console.log('history language tests passed');
