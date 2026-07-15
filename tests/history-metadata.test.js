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

require('../history-store.js');

const normalized = globalThis.PromptHistory.normalizeHistoryRecord({
  id: 'new-record',
  templateId: 'detailed',
  templateName: 'Detailed analysis',
  contentLanguage: 'en',
  _meta: {
    promptHash: 'abc123',
    schemaId: 'standard_v1',
    promptCompilerVersion: '1.0.0',
    templateVersion: 3,
    templateType: 'standard',
    targetPlatform: 'midjourney',
    modelAdapter: 'anthropic',
    modelId: 'vision-model',
    finishReason: 'stop',
    validationStatus: 'partial_success',
    validationWarnings: [{ code: 'missing_variant', path: 'prompt_variants.commercial' }]
  }
});

assert.equal(normalized._meta.promptHash, 'abc123');
assert.equal(normalized._meta.schemaId, 'standard_v1');
assert.equal(normalized._meta.templateVersion, 3);
assert.equal(normalized._meta.targetPlatform, 'midjourney');
assert.equal(normalized._meta.modelAdapter, 'anthropic');
assert.equal(normalized._meta.validationStatus, 'partial_success');
assert.deepEqual(normalized._meta.validationWarnings, [
  { code: 'missing_variant', path: 'prompt_variants.commercial' }
]);

const legacy = globalThis.PromptHistory.normalizeHistoryRecord({
  id: 'legacy-record',
  templateId: 'detailed',
  contentLanguage: 'invalid'
});
assert.equal(legacy.contentLanguage, 'zh-CN');
assert.equal(legacy._meta.schemaId, 'legacy_v1');
assert.equal(legacy._meta.promptCompilerVersion, 'legacy');
assert.equal(legacy._meta.validationStatus, 'unknown');
assert.equal(legacy._meta.modelAdapter, 'openai_compatible');

console.log('history metadata tests passed');
