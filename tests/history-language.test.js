const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const historyHtml = fs.readFileSync(path.join(root, 'history.html'), 'utf8');
const historyJs = fs.readFileSync(path.join(root, 'history.js'), 'utf8');
const historyFormatJs = fs.readFileSync(path.join(root, 'history-format.js'), 'utf8');

const forbiddenHistoryHtml = [
  'Prompt、Tags',
  'Tags、来源域名或模板'
];

for (const text of forbiddenHistoryHtml) {
  assert.equal(historyHtml.includes(text), false, `history.html should not contain mixed English UI text: ${text}`);
}

const forbiddenHistoryJs = [
  "'Main output'",
  "'Prompt detail'",
  "'Unknown Template'"
];

for (const text of forbiddenHistoryJs) {
  assert.equal(historyJs.includes(text), false, `history.js should not contain mixed English UI text: ${text}`);
}

const forbiddenHistoryFormat = [
  "label: 'English Prompt'",
  "label: 'Tags'",
  "label: 'Negative Prompt'",
  "label: 'JSON Prompt'",
  "label: 'Raw JSON'",
  '`Source: ${sourceDomain}`',
  '`Input Type: ${inputType}`',
  '`Template: ${templateName}`'
];

for (const text of forbiddenHistoryFormat) {
  assert.equal(historyFormatJs.includes(text), false, `history-format.js should not contain mixed English UI text: ${text}`);
}

console.log('history language tests passed');
