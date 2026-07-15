const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const resultHtml = fs.readFileSync(path.join(root, 'result.html'), 'utf8');
const resultJs = fs.readFileSync(path.join(root, 'result.js'), 'utf8');
const zhCatalog = JSON.parse(fs.readFileSync(path.join(root, '_locales/zh_CN/messages.json'), 'utf8'));
const enCatalog = JSON.parse(fs.readFileSync(path.join(root, '_locales/en/messages.json'), 'utf8'));

const keys = [...resultHtml.matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g)].map(match => match[1]);
assert.ok(keys.length > 40, 'result page should mark its user-facing copy with data-i18n attributes');
for (const key of keys) {
  assert.ok(zhCatalog[key], `result.html references missing Chinese message: ${key}`);
  assert.ok(enCatalog[key], `result.html references missing English message: ${key}`);
}

assert.ok(
  resultHtml.indexOf('<script src="i18n.js"></script>') < resultHtml.indexOf('<script src="result.js"></script>'),
  'result page must load i18n.js before result.js'
);
assert.match(resultJs, /await window\.PromptLensI18n\.init\(\)/);
assert.match(resultJs, /PromptLensI18n\.onChange/);
assert.match(resultJs, /buildReversePromptInstruction\(template, businessContext = '', outputLanguage = window\.PromptLensI18n\.getLanguage\(\)\)/);
assert.match(resultJs, /buildFinalPrompt\(template, \{\s*businessContext,\s*outputLanguage\s*\}\)/s);
assert.doesNotMatch(resultJs, /showAssistStatus\(['"`][^'"`]+['"`]/, 'assist status copy must come from the locale catalog');
assert.doesNotMatch(resultJs, /textContent\s*=\s*['"`][\u4e00-\u9fff][^'"`]*['"`]/, 'dynamic Chinese UI copy must not be hardcoded');

console.log('result language tests passed');
