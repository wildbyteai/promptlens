const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const coverageScript = fs.readFileSync(path.join(root, 'scripts/check-core-coverage.sh'), 'utf8');
const packageScript = fs.readFileSync(path.join(root, 'scripts/package-extension.sh'), 'utf8');
const workflow = fs.readFileSync(path.join(root, '.github/workflows/ci.yml'), 'utf8');

assert.match(coverageScript, /--experimental-test-coverage/);
assert.match(coverageScript, /--test-coverage-lines=80/);
assert.match(coverageScript, /--test-coverage-functions=80/);
for (const moduleName of [
  'i18n.js',
  'marketing-diagnosis.js',
  'model-adapters.js',
  'output-validator.js',
  'prompt-compiler.js',
  'prompt-schemas.js',
  'templates.js'
]) {
  assert.match(coverageScript, new RegExp(`--test-coverage-include=${moduleName.replace('.', '\\.')}`));
}
assert.match(workflow, /bash scripts\/check-core-coverage\.sh/);
assert.match(workflow, /node --test tests\/\*\.test\.js/);
assert.match(workflow, /bash scripts\/package-extension\.sh/);
assert.doesNotMatch(workflow, /promptlens-v\d/);
assert.match(packageScript, /unzip -t "\$\{ZIP_PATH\}"/);

console.log('coverage gate tests passed');
