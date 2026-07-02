const assert = require('node:assert/strict');

globalThis.PromptVariants = require('../prompt-variants.js');

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
    },
    prompt_variants: [
      {
        id: 'recreate',
        prompt_en: 'Faithfully recreate the cinematic cat portrait.',
        prompt_zh_summary: '复刻猫咪肖像的电影感构图。',
        tags: ['cat', 'recreation'],
        negative_prompt: 'blurred fur',
        use_cases: ['style study']
      },
      {
        id: 'creative',
        prompt_en: 'Extend the cat portrait into a dreamy editorial concept.',
        prompt_zh_summary: '延展为梦幻编辑视觉。',
        tags: ['editorial'],
        negative_prompt: 'flat lighting',
        use_cases: ['moodboard']
      }
    ]
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
  '专业用途 Prompt 候选',
  'Raw JSON'
]);
assert.equal(fields[0].value, 'A cinematic cat portrait');
assert.equal(fields[1].value, '一张电影感猫咪肖像');
assert.equal(fields[2].value, 'cat, cinematic, soft light');
assert.equal(fields[3].value, 'blurry, low quality');
assert.equal(fields[4].value, JSON.stringify(item.result.json_prompt, null, 2));
assert.match(fields[5].value, /## 专业用途 Prompt 候选/);
assert.match(fields[5].value, /### 复刻版/);
assert.match(fields[5].value, /Faithfully recreate the cinematic cat portrait/);
assert.equal(fields[5].kind, 'variant-card');
assert.equal(fields[6].value, item.rawText);

const copyText = buildHistoryCopyText(item);
assert.match(copyText, /Source: example\.com/);
assert.match(copyText, /Input Type: selection/);
assert.match(copyText, /Template: 详细分析/);
assert.match(copyText, /English Prompt\nA cinematic cat portrait/);
assert.match(copyText, /中文提示词\n一张电影感猫咪肖像/);
assert.match(copyText, /Tags\ncat, cinematic, soft light/);
assert.match(copyText, /Negative Prompt\nblurry, low quality/);
assert.match(copyText, /JSON Prompt\n\{\n  "subject": "cat",\n  "lighting": "soft light"\n\}/);
assert.match(copyText, /专业用途 Prompt 候选/);
assert.match(copyText, /Extend the cat portrait into a dreamy editorial concept/);

const legacyItem = {
  promptEn: 'Legacy English prompt',
  promptTags: ['legacy']
};
const legacyFields = getHistoryDisplayFields(legacyItem);
assert.equal(legacyFields[0].value, 'Legacy English prompt');
assert.equal(legacyFields[2].value, 'legacy');
assert.equal(legacyFields.some(field => field.key === 'promptVariants'), false);

console.log('history format tests passed');
