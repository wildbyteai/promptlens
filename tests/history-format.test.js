const assert = require('node:assert/strict');

const { buildHistoryCopyText, getHistoryDisplayFields } = require('../history-format.js');

const item = {
  sourceDomain: 'example.com',
  inputType: 'selection',
  templateName: '详细分析',
  promptEn: 'A cinematic cat portrait',
  promptTags: ['cat', 'cinematic', 'soft light'],
  result: {
    prompt_zh: '一张电影感猫咪肖像',
    prompt_en: 'A cinematic cat portrait from result',
    prompt_tags: ['cat', 'cinematic', 'soft light'],
    negative_prompt: 'blurry, low quality',
    json_prompt: {
      subject: 'cat',
      lighting: 'soft light'
    }
  },
  rawText: '{"prompt_en":"A cinematic cat portrait from result"}'
};

const fields = getHistoryDisplayFields(item);
assert.deepEqual(fields.map(field => field.label), [
  'English Prompt',
  '中文提示词',
  'Tags',
  'Negative Prompt',
  'JSON Prompt',
  'Raw JSON'
]);
assert.equal(fields[0].value, 'A cinematic cat portrait');
assert.equal(fields[1].value, '一张电影感猫咪肖像');
assert.equal(fields[2].value, 'cat, cinematic, soft light');
assert.equal(fields[3].value, 'blurry, low quality');
assert.equal(fields[4].value, JSON.stringify(item.result.json_prompt, null, 2));
assert.equal(fields[5].value, item.rawText);

const copyText = buildHistoryCopyText(item);
assert.match(copyText, /Source: example\.com/);
assert.match(copyText, /Input Type: selection/);
assert.match(copyText, /Template: 详细分析/);
assert.match(copyText, /English Prompt\nA cinematic cat portrait/);
assert.match(copyText, /中文提示词\n一张电影感猫咪肖像/);
assert.match(copyText, /Tags\ncat, cinematic, soft light/);
assert.match(copyText, /Negative Prompt\nblurry, low quality/);
assert.match(copyText, /JSON Prompt\n\{\n  "subject": "cat",\n  "lighting": "soft light"\n\}/);

const legacyItem = {
  promptEn: 'Legacy English prompt',
  promptTags: ['legacy']
};
const legacyFields = getHistoryDisplayFields(legacyItem);
assert.equal(legacyFields[0].value, 'Legacy English prompt');
assert.equal(legacyFields[2].value, 'legacy');

console.log('history format tests passed');
