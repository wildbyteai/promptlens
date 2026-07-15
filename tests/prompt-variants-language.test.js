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
  await i18n.init({ catalogs, language: 'zh-CN', persist: false, watch: false });
  const variantsApi = require('../prompt-variants.js');
  const result = {
    prompt_en: 'Fallback prompt',
    prompt_variants: ['recreate', 'creative', 'commercial'].map(id => ({
      id,
      title: 'Model-provided title',
      intent: '',
      prompt_en: `${id} prompt`,
      prompt_zh_summary: id === 'recreate' ? '复刻说明' : '',
      tags: ['lighting'],
      negative_prompt: 'blur',
      use_cases: ['style study']
    }))
  };

  let variants = variantsApi.normalizePromptVariants(result);
  assert.deepEqual(variants.map(variant => variant.id), variantsApi.VARIANT_ORDER);
  assert.deepEqual(variants.map(variant => variant.title), ['复刻版', '创意延展版', '商业强化版']);
  assert.equal(variants[0].intent, '尽量还原参考图的主体、构图、风格、光影和材质');
  assert.match(variantsApi.formatPromptVariantCard(variants[0]), /说明\n复刻说明/);
  assert.match(variantsApi.formatPromptVariantsMarkdown(variants), /^## 专业用途提示词候选/);

  await i18n.setLanguage('en', { persist: false });
  variants = variantsApi.normalizePromptVariants(result);
  assert.deepEqual(variants.map(variant => variant.title), ['Recreate', 'Creative extension', 'Commercial enhancement']);
  assert.equal(variants[0].intent, 'Reproduce the reference subject, composition, style, lighting, and materials as closely as possible');
  assert.match(variantsApi.formatPromptVariantCard(variants[0]), /Explanation\nReproduce the reference subject/);
  assert.match(variantsApi.formatPromptVariantsMarkdown(variants), /^## Professional prompt candidates/);

  console.log('prompt variant language tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
