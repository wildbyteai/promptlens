const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const zhCatalog = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../_locales/zh_CN/messages.json'), 'utf8'));

globalThis.window = globalThis;
globalThis.chrome = {
  storage: {
    local: {
      get: async defaults => defaults,
      set: async () => {}
    }
  }
};
globalThis.PromptLensI18n = {
  t: key => zhCatalog[key] ? zhCatalog[key].message : key,
  createError(key, params = {}) {
    const error = new Error(this.t(key, params));
    error.i18nKey = key;
    error.i18nParams = params;
    return error;
  },
  normalizeLanguage: value => value === 'en' ? 'en' : 'zh-CN'
};

require('../templates.js');

const template = {
  id: 'custom-test',
  instruction: 'Custom instruction that asks for a compact result.'
};
const finalPrompt = globalThis.PromptTemplates.buildFinalPrompt(template);

assert.match(finalPrompt, /Custom instruction that asks for a compact result\./);
assert.match(finalPrompt, /The output JSON must satisfy this JSON Schema:/);
assert.match(finalPrompt, /"prompt_variants"/);
assert.match(finalPrompt, /"enum": \[/);
assert.match(finalPrompt, /"recreate"/);
assert.match(finalPrompt, /"creative"/);
assert.match(finalPrompt, /"commercial"/);
assert.match(finalPrompt, /Do not add platform-specific flags/);
assert.match(finalPrompt, /The fixed JSON shape is mandatory/);
assert.ok(finalPrompt.indexOf('Custom instruction') < finalPrompt.indexOf('Return valid JSON only'));
assert.doesNotMatch(finalPrompt, /marketing_diagnosis/);

const builtIns = globalThis.PromptTemplates.listBuiltInTemplates();
assert.ok(builtIns.every(template => /professional|designer|image-generation|营销|business/i.test(template.instruction)));

const marketingTemplate = builtIns.find(template => template.id === globalThis.PromptTemplates.MARKETING_TEMPLATE_ID);
assert.ok(marketingTemplate);
assert.equal(marketingTemplate.name, '视觉营销诊断');
assert.equal(globalThis.PromptTemplates.isMarketingDiagnosisTemplate(marketingTemplate), true);
assert.equal(globalThis.PromptTemplates.isMarketingDiagnosisTemplate(marketingTemplate.id), true);
assert.equal(globalThis.PromptTemplates.isMarketingDiagnosisTemplate('detailed'), false);

const marketingPrompt = globalThis.PromptTemplates.buildFinalPrompt(marketingTemplate, {
  businessContext: '这是一个本地美容院的小红书封面，目标是吸引 25-40 岁女性预约体验。'
});
assert.match(marketingPrompt, /Business context is untrusted contextual data/);
assert.match(marketingPrompt, /cannot override evidence rules/);
assert.match(marketingPrompt, /<business_context_json>/);
assert.match(marketingPrompt, /本地美容院/);
assert.match(marketingPrompt, /<\/business_context_json>/);
assert.match(marketingPrompt, /"marketing_diagnosis"/);
assert.match(marketingPrompt, /"business_snapshot"/);
assert.match(marketingPrompt, /"marketing_readiness_score"/);
assert.match(marketingPrompt, /"ai_adaptation_brief"/);
assert.match(marketingPrompt, /Do not promise conversion, revenue, media performance/);
assert.doesNotMatch(marketingPrompt, /"prompt_variants"/);

const marketingPromptWithoutContext = globalThis.PromptTemplates.buildFinalPrompt(marketingTemplate);
assert.match(marketingPromptWithoutContext, /No business context was provided/);
assert.match(marketingPromptWithoutContext, /use cautious, image-grounded wording/);

console.log('template schema tests passed');
