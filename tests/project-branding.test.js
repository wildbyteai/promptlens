const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const license = fs.readFileSync(path.join(root, 'LICENSE'), 'utf8');

assert.match(license, /^Copyright \(c\) 2026 PromptLens Contributors$/m);
assert.doesNotMatch(license, /PromptCard Lite/i);

console.log('project branding tests passed');
