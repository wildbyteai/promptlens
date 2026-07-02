const assert = require('node:assert/strict');

globalThis.window = globalThis;
globalThis.chrome = {
  storage: {
    local: {
      get: async defaults => defaults,
      set: async () => {}
    }
  }
};

require('../templates.js');

const template = {
  id: 'custom-test',
  instruction: 'Custom instruction that asks for a compact result.'
};
const finalPrompt = globalThis.PromptTemplates.buildFinalPrompt(template);

assert.match(finalPrompt, /Custom instruction that asks for a compact result\./);
assert.match(finalPrompt, /Return exactly this JSON shape:/);
assert.match(finalPrompt, /"prompt_variants": \[/);
assert.match(finalPrompt, /"id": "recreate"/);
assert.match(finalPrompt, /"id": "creative"/);
assert.match(finalPrompt, /"id": "commercial"/);
assert.match(finalPrompt, /Do not add platform-specific flags/);
assert.match(finalPrompt, /The fixed JSON shape is mandatory/);
assert.ok(finalPrompt.indexOf('Custom instruction') < finalPrompt.indexOf('Return valid JSON only'));

const builtIns = globalThis.PromptTemplates.listBuiltInTemplates();
assert.ok(builtIns.every(template => /professional|designer|image-generation/i.test(template.instruction)));

console.log('template schema tests passed');
