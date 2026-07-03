const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const resultHtml = fs.readFileSync(path.join(root, 'result.html'), 'utf8');
const resultJs = fs.readFileSync(path.join(root, 'result.js'), 'utf8');
const marketingDiagnosisJs = fs.readFileSync(path.join(root, 'marketing-diagnosis.js'), 'utf8');

const forbiddenResultHtml = [
  'Business context',
  'Output template',
  'Export',
  'Marketing diagnosis',
  'Main output',
  'English Prompt</h2>',
  'Copy English Prompt',
  'Professional variants',
  '<h2>Tags</h2>',
  'Negative Prompt</h2>',
  'JSON Prompt</h2>',
  'Prompt tokens',
  'Completion tokens',
  'Total tokens',
  'Response time',
  '<span>Raw JSON</span>'
];

for (const text of forbiddenResultHtml) {
  assert.equal(resultHtml.includes(text), false, `result.html should not contain mixed English UI text: ${text}`);
}

const forbiddenResultJs = [
  "textContent = 'Copy Prompt'",
  "textContent = 'Copy Card'",
  "['Tags'",
  "['Negative Prompt'",
  "'# Image Prompt Analysis Result'",
  "'## English Prompt'",
  "'## Tags'",
  "'## Negative Prompt'",
  "'## JSON Prompt'",
  "'English Prompt'",
  "'Tags'",
  "'Negative Prompt'",
  "'JSON Prompt'"
];

for (const text of forbiddenResultJs) {
  assert.equal(resultJs.includes(text), false, `result.js should not contain mixed English UI text: ${text}`);
}

const forbiddenMarketingText = [
  "kicker: 'Business Snapshot'",
  "kicker: 'Marketing Diagnosis'",
  "kicker: 'Next Actions'",
  '`- App:',
  '`- Exported At:',
  '`- Template:'
];

for (const text of forbiddenMarketingText) {
  assert.equal(marketingDiagnosisJs.includes(text), false, `marketing-diagnosis.js should not contain mixed English UI text: ${text}`);
}

console.log('result language tests passed');
