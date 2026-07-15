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
globalThis.window = globalThis;

const i18n = require('../i18n.js');

(async () => {
  await i18n.init({ catalogs, language: 'zh-CN', persist: false, watch: false });
  globalThis.PromptVariants = require('../prompt-variants.js');
  globalThis.PromptMarketingDiagnosis = require('../marketing-diagnosis.js');
  require('../templates.js');
  const formatter = require('../result-format.js');

  const data = {
    app: 'PromptLens',
    exportedAt: '2026-07-15T00:00:00.000Z',
    template: globalThis.PromptTemplates.getBuiltInTemplateById('detailed'),
    result: {
      prompt_en: 'English prompt body',
      prompt_zh: '中文提示词正文',
      prompt_tags: ['studio', 'warm light'],
      negative_prompt: 'blur',
      json_prompt: { subject: 'product' },
      prompt_variants: []
    }
  };

  let markdown = formatter.buildMarkdown(data);
  assert.match(markdown, /^# 图片提示词分析结果/);
  assert.match(markdown, /- 应用：PromptLens/);
  assert.match(markdown, /## 英文提示词/);
  assert.match(formatter.buildCopyText(data), /^英文提示词/);

  await i18n.setLanguage('en', { persist: false });
  data.template = globalThis.PromptTemplates.getBuiltInTemplateById('detailed');
  markdown = formatter.buildMarkdown(data);
  assert.match(markdown, /^# Image Prompt Analysis Result/);
  assert.match(markdown, /- App: PromptLens/);
  assert.match(markdown, /## English Prompt/);
  assert.match(markdown, /## Chinese Prompt/);
  assert.match(formatter.buildCopyText(data), /^English Prompt/);

  console.log('result format language tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
