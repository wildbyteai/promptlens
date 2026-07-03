const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.resolve(__dirname, '../result.js'), 'utf8');

assert.match(source, /marketing-diagnosis-section-head/);
assert.match(source, /marketing-diagnosis-quick-judgement/);
assert.match(source, /marketing-diagnosis-score-ring/);
assert.match(source, /marketing_readiness_score/);

console.log('result marketing render tests passed');
