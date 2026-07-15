const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const zhCatalog = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../_locales/zh_CN/messages.json'), 'utf8'));
const stored = {};

globalThis.window = globalThis;
globalThis.chrome = {
  storage: {
    local: {
      async get(defaults) {
        return { ...defaults, ...stored };
      },
      async set(values) {
        Object.assign(stored, values);
      }
    }
  }
};
globalThis.PromptLensI18n = {
  t: key => zhCatalog[key] ? zhCatalog[key].message : key,
  createError(key) {
    const error = new Error(this.t(key));
    error.i18nKey = key;
    return error;
  },
  normalizeLanguage: value => value === 'en' ? 'en' : 'zh-CN'
};

require('../templates.js');

(async () => {
  const templates = globalThis.PromptTemplates;
  const builtIns = templates.listBuiltInTemplates();
  const marketing = builtIns.find(item => item.id === templates.MARKETING_TEMPLATE_ID);
  const detailed = builtIns.find(item => item.id === 'detailed');
  const concise = builtIns.find(item => item.id === 'concise');

  assert.equal(marketing.templateType, 'marketing');
  assert.equal(detailed.templateType, 'standard');

  const marketingCopy = await templates.duplicateTemplate(marketing.id);
  assert.equal(marketingCopy.templateType, 'marketing');
  assert.equal(marketingCopy.templateProfile, 'marketing');
  assert.equal(templates.isMarketingDiagnosisTemplate(marketingCopy), true);
  assert.match(templates.buildFinalPrompt(marketingCopy), /"marketing_diagnosis": \{/);
  assert.doesNotMatch(templates.buildFinalPrompt(marketingCopy), /"prompt_variants": \[/);

  const conciseCopy = await templates.duplicateTemplate(concise.id);
  assert.equal(conciseCopy.templateType, 'standard');
  assert.equal(conciseCopy.templateProfile, 'concise');
  assert.doesNotMatch(templates.buildFinalPrompt(conciseCopy), /"prompt_variants"/);

  const standardCustom = await templates.createCustomTemplate({
    name: 'Standard custom',
    description: 'Legacy-compatible custom template',
    instruction: 'Describe visible evidence.'
  });
  assert.equal(standardCustom.templateType, 'standard');

  const previousVersion = standardCustom.version;
  const previousUpdatedAt = standardCustom.updatedAt;
  await new Promise(resolve => setTimeout(resolve, 2));
  const updated = await templates.updateCustomTemplate(standardCustom.id, {
    name: standardCustom.name,
    description: standardCustom.description,
    instruction: 'Describe visible evidence with concise wording.'
  });
  assert.equal(updated.version, previousVersion + 1);
  assert.ok(updated.updatedAt > previousUpdatedAt);
  assert.equal(updated.templateType, 'standard');

  stored.customTemplates.push({
    id: 'legacy-template',
    name: 'Legacy template',
    description: 'No explicit type',
    instruction: 'Legacy instruction',
    version: 1
  });
  const legacy = await templates.getTemplateById('legacy-template');
  assert.equal(legacy.templateType, 'standard');
  assert.equal(legacy.templateProfile, 'custom');

  const exported = await templates.exportCustomTemplates();
  assert.ok(exported.templates.some(item => item.id === marketingCopy.id && item.templateType === 'marketing'));

  console.log('template type tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
