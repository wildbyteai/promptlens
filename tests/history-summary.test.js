const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '../history.js'), 'utf8');
const sandbox = {
  module: { exports: {} },
  document: {
    getElementById: () => ({
      addEventListener: () => {},
      value: '',
      textContent: '',
      dataset: {},
      hidden: false
    }),
    createElement: () => ({
      append: () => {},
      appendChild: () => {},
      addEventListener: () => {},
      className: '',
      textContent: '',
      dataset: {},
      setAttribute: () => {},
      replaceChildren: () => {},
      children: []
    })
  },
  window: {
    open: () => {},
    setTimeout: () => {},
    PromptHistory: {
      isHistoryEnabled: async () => false,
      listHistoryItems: async () => [],
      clearHistory: async () => {},
      deleteHistoryItem: async () => {}
    },
    PromptHistoryFormat: {
      buildHistoryCopyText: () => '',
      getHistoryDisplayFields: () => []
    }
  },
  navigator: { clipboard: { writeText: async () => {} } },
  console
};

vm.runInNewContext(source, sandbox, { filename: 'history.js' });
const helpers = sandbox.module.exports;

assert.equal(typeof helpers.getHistoryPromptSummary, 'function');
assert.equal(typeof helpers.getHistoryVisibleTags, 'function');
assert.equal(typeof helpers.getInputTypeLabel, 'function');

assert.equal(
  helpers.getHistoryPromptSummary({ promptZh: '  中文摘要  ', promptEn: 'English summary' }),
  '中文摘要'
);
assert.equal(
  helpers.getHistoryPromptSummary({ promptEn: 'A very long prompt '.repeat(20) }).length,
  140
);
assert.equal(
  helpers.getHistoryPromptSummary({ result: { prompt_zh: '结果里的中文提示词' } }),
  '结果里的中文提示词'
);
assert.equal(helpers.getHistoryPromptSummary({}), '暂无提示词摘要');

assert.deepEqual(
  helpers.getHistoryVisibleTags({ promptTags: ['cat', 'cinematic', 'soft', 'portrait', 'warm'] }, 3),
  ['cat', 'cinematic', 'soft']
);
assert.deepEqual(
  helpers.getHistoryVisibleTags({ result: { prompt_tags: ['product', 'ad'] } }, 4),
  ['product', 'ad']
);

assert.equal(helpers.getInputTypeLabel('image_url'), '图片 URL');
assert.equal(helpers.getInputTypeLabel('screenshot_selection'), '框选截图');
assert.equal(helpers.getInputTypeLabel('selection'), '框选截图');
assert.equal(helpers.getInputTypeLabel('data_url'), 'Data URL');
assert.equal(helpers.getInputTypeLabel('unknown'), 'unknown');

assert.match(source, /<details>|document\.createElement\('details'\)/);
assert.match(source, /history-summary/);
assert.match(source, /查看完整内容/);

console.log('history summary tests passed');
