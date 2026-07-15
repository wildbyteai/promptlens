const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const catalogs = {
  'zh-CN': JSON.parse(fs.readFileSync(path.join(root, '_locales/zh_CN/messages.json'), 'utf8')),
  en: JSON.parse(fs.readFileSync(path.join(root, '_locales/en/messages.json'), 'utf8'))
};

globalThis.window = globalThis;
const stored = {};
globalThis.chrome = {
  storage: {
    local: {
      get: async defaults => ({ ...defaults, ...stored }),
      set: async values => Object.assign(stored, values)
    },
    onChanged: { addListener: () => {} }
  }
};

const i18n = require('../i18n.js');

(async () => {
  await i18n.init({ catalogs, language: 'zh-CN', persist: false, watch: false });
  require('../templates.js');

  let builtIns = globalThis.PromptTemplates.listBuiltInTemplates();
  assert.deepEqual(builtIns.map(item => item.id), ['detailed', 'natural', 'tags', 'concise', 'visual_marketing']);
  assert.deepEqual(builtIns.map(item => item.name), ['详细分析', '自然语言', '标签加权', '快速复制', '视觉营销诊断']);
  assert.ok(builtIns.every(item => item.description && !/^template/.test(item.description)));
  const custom = await globalThis.PromptTemplates.createCustomTemplate({
    name: 'My unchanged template',
    description: 'Keep this user-authored description.',
    instruction: 'Keep this user-authored instruction.'
  });

  await i18n.setLanguage('en', { persist: false });
  builtIns = globalThis.PromptTemplates.listBuiltInTemplates();
  assert.deepEqual(builtIns.map(item => item.name), ['Detailed analysis', 'Natural language', 'Weighted tags', 'Quick copy', 'Visual marketing diagnosis']);
  assert.ok(builtIns.every(item => item.description && !/^template/.test(item.description)));
  const reloadedCustom = await globalThis.PromptTemplates.getTemplateById(custom.id);
  assert.equal(reloadedCustom.name, 'My unchanged template');
  assert.equal(reloadedCustom.description, 'Keep this user-authored description.');
  assert.equal(reloadedCustom.instruction, 'Keep this user-authored instruction.');

  const detailed = builtIns.find(item => item.id === 'detailed');
  const englishPrompt = globalThis.PromptTemplates.buildFinalPrompt(detailed, { outputLanguage: 'en' });
  assert.match(englishPrompt, /Write explanatory content in English/);
  assert.match(englishPrompt, /prompt_zh must remain Simplified Chinese/);
  assert.match(englishPrompt, /prompt_en, prompt_tags, negative_prompt, and json_prompt must remain English/);
  assert.doesNotMatch(englishPrompt, /简短说明这个版本/);
  assert.match(englishPrompt, /"prompt_zh_summary"/);
  assert.doesNotMatch(englishPrompt, /<localized/);

  const chinesePrompt = globalThis.PromptTemplates.buildFinalPrompt(detailed, { outputLanguage: 'zh-CN' });
  assert.match(chinesePrompt, /Write explanatory content in Simplified Chinese/);

  console.log('template language tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
