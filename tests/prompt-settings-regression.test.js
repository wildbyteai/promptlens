const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const optionsHtml = fs.readFileSync(path.join(root, 'options.html'), 'utf8');
const optionsJs = fs.readFileSync(path.join(root, 'options.js'), 'utf8');
const historyStore = fs.readFileSync(path.join(root, 'history-store.js'), 'utf8');
const packageScript = fs.readFileSync(path.join(root, 'scripts/package-extension.sh'), 'utf8');

assert.match(optionsHtml, /id="model-adapter"/);
assert.match(optionsHtml, /value="anthropic"/);
assert.match(optionsHtml, /value="midjourney"/);
assert.ok(
  optionsHtml.indexOf('<script src="prompt-schemas.js"></script>') < optionsHtml.indexOf('<script src="prompt-compiler.js"></script>')
);
assert.match(optionsJs, /modelAdapter:\s*modelAdapterSelect\.value/);
assert.match(optionsJs, /optionsStatusTemplateWarningConfirm/);
assert.ok(
  optionsJs.indexOf("showLocalizedConfigStatus('optionsStatusTemplateWarningConfirm'") <
    optionsJs.indexOf('window.PromptTemplates.updateCustomTemplate'),
  'template conflict warning must happen before persistence'
);
assert.match(historyStore, /'midjourney'/);
assert.match(packageScript, /"prompt-schemas\.js"/);

console.log('prompt settings regression tests passed');
