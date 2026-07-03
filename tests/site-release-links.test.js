const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const releaseRoot = 'https://github.com/wildbyteai/promptlens/releases';
const files = [
  'site/index.html',
  'site/privacy/index.html',
  'site/support/index.html',
  'docs/chrome-web-store/release-checklist.md'
];

for (const file of files) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  assert.doesNotMatch(source, /https:\/\/github\.com\/wildbyteai\/promptlens\/releases\/tag\/v\d+\.\d+\.\d+/);
  assert.doesNotMatch(source, /https:\/\/github\.com\/wildbyteai\/promptlens\/releases\/download\/v\d+\.\d+\.\d+/);
}

for (const file of files.slice(0, 3)) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  assert.match(source, new RegExp(releaseRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}

console.log('site release link tests passed');
