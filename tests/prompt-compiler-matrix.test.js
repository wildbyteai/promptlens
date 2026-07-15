const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const catalogs = {
  'zh-CN': JSON.parse(fs.readFileSync(path.resolve(__dirname, '../_locales/zh_CN/messages.json'), 'utf8')),
  en: JSON.parse(fs.readFileSync(path.resolve(__dirname, '../_locales/en/messages.json'), 'utf8'))
};

globalThis.window = globalThis;
globalThis.chrome = {
  storage: {
    local: {
      get: async defaults => defaults,
      set: async () => {}
    },
    onChanged: { addListener: () => {} }
  }
};

const i18n = require('../i18n.js');

(async () => {
  await i18n.init({ catalogs, language: 'zh-CN', persist: false, watch: false });
  const compiler = require('../prompt-compiler.js');
  require('../templates.js');

  const templates = globalThis.PromptTemplates.listBuiltInTemplates();
  assert.deepEqual(templates.map(item => item.id), ['detailed', 'natural', 'tags', 'concise', 'visual_marketing']);

  for (const template of templates) {
    for (const outputLanguage of ['zh-CN', 'en']) {
      const compiled = compiler.compile(template, {
        outputLanguage,
        businessContext: template.templateType === 'marketing' ? 'Local product campaign.' : '',
        targetPlatform: 'generic'
      });
      const apiPrompt = compiler.renderApiPrompt(compiled);
      const assistPrompt = compiler.renderChatGptPrompt(compiled);

      assert.match(apiPrompt, /Return valid JSON only/);
      assert.match(apiPrompt, /Negative Prompt contract/);
      assert.doesNotMatch(apiPrompt, /undefined|null\nnull/);
      assert.doesNotMatch(assistPrompt, /Return valid JSON|"prompt_zh"|"json_prompt"|"prompt_variants"/);
      assert.match(assistPrompt, outputLanguage === 'en' ? /Markdown/ : /Markdown/);

      if (template.templateType === 'marketing') {
        assert.equal(compiled.schemaId, 'marketing_v1');
        assert.match(apiPrompt, /"marketing_diagnosis"/);
        assert.match(assistPrompt, outputLanguage === 'en' ? /Owner-friendly summary/ : /老板能看懂的摘要/);
      } else {
        assert.equal(compiled.schemaId, 'standard_v1');
        assert.match(apiPrompt, /"prompt_variants"/);
        assert.match(assistPrompt, outputLanguage === 'en' ? /Chinese Prompt in Simplified Chinese/ : /中文提示词/);
      }
    }
  }

  const detailed = compiler.compile(templates.find(item => item.id === 'detailed'));
  const concise = compiler.compile(templates.find(item => item.id === 'concise'));
  assert.ok(concise.maxOutputTokens <= detailed.maxOutputTokens * 0.6);

  const genericTags = compiler.renderApiPrompt(compiler.compile(templates.find(item => item.id === 'tags')));
  assert.match(genericTags, /Do not use weighted-tag syntax/);
  assert.doesNotMatch(genericTags, /\(masterpiece:1\.1\)/);

  console.log('prompt compiler matrix tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
