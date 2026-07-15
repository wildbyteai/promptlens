const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const catalogs = {
  'zh-CN': JSON.parse(fs.readFileSync(path.join(root, '_locales/zh_CN/messages.json'), 'utf8')),
  en: JSON.parse(fs.readFileSync(path.join(root, '_locales/en/messages.json'), 'utf8'))
};
globalThis.chrome = {
  storage: {
    local: { get: async defaults => defaults, set: async () => {} },
    onChanged: { addListener: () => {} }
  }
};

const i18n = require('../i18n.js');

(async () => {
  await i18n.init({ catalogs, language: 'en', persist: false, watch: false });
  globalThis.PromptVariants = require('../prompt-variants.js');
  const historyFormat = require('../history-format.js');
  assert.deepEqual(Object.keys(historyFormat.INPUT_TYPE_KEYS), ['image_url', 'screenshot_selection', 'selection', 'data_url', 'unknown']);
  const item = {
    sourceDomain: 'example.com',
    inputType: 'screenshot_selection',
    templateName: 'Detailed analysis',
    promptEn: 'An English prompt',
    promptZh: '一个中文提示词',
    promptTags: ['studio'],
    result: {}
  };

  let fields = historyFormat.getHistoryDisplayFields(item);
  assert.deepEqual(fields.slice(0, 7).map(field => field.label), [
    'Source image URL',
    'Source page URL',
    'English Prompt',
    'Chinese Prompt',
    'Tags',
    'Negative Prompt',
    'JSON Prompt'
  ]);
  assert.match(historyFormat.buildHistoryCopyText(item), /Input type: Screenshot selection/);
  assert.equal(historyFormat.getInputTypeLabel('unknown'), 'Unknown input');

  await i18n.setLanguage('zh-CN', { persist: false });
  fields = historyFormat.getHistoryDisplayFields(item);
  assert.equal(fields[2].label, '英文提示词');
  assert.match(historyFormat.buildHistoryCopyText(item), /输入类型：框选截图/);
  assert.equal(historyFormat.getInputTypeLabel('unknown'), '未知输入');

  const historyStoreSource = fs.readFileSync(path.join(root, 'history-store.js'), 'utf8');
  assert.match(historyStoreSource, /contentLanguage: item\.contentLanguage === 'en' \? 'en' : 'zh-CN'/);
  assert.match(historyStoreSource, /\.map\(item => \(\{ \.\.\.item, contentLanguage: item\.contentLanguage === 'en' \? 'en' : 'zh-CN' \}\)\)/);

  console.log('history format language tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
