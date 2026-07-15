const assert = require('node:assert/strict');

const {
  OutputValidationError,
  OutputTruncatedError,
  validateOutput,
  assertResponseNotTruncated
} = require('../output-validator.js');

function variant(id) {
  return {
    id,
    title: `${id} title`,
    intent: `${id} intent`,
    prompt_en: `${id} English prompt`,
    prompt_zh_summary: `${id} 中文说明`,
    tags: ['subject', 'style'],
    negative_prompt: 'blur, artifacts, distortion, bad crop, color banding, compression',
    use_cases: ['moodboard']
  };
}

function standardResult() {
  return {
    prompt_zh: '中文提示词',
    prompt_en: 'English prompt',
    prompt_tags: ['subject', 'style', 'lighting', 'mood', 'composition', 'texture'],
    negative_prompt: 'blur, artifacts, distortion, bad crop, color banding, compression',
    json_prompt: {
      subject: 'product',
      action_pose: 'still',
      details_appearance: 'clean package',
      environment_background: 'studio backdrop',
      lighting_atmosphere: 'soft light',
      composition_framing: 'centered close-up',
      style_camera: 'commercial photography',
      colors: ['white', 'blue'],
      materials_textures: ['matte paper'],
      aspect_ratio: '1:1',
      quality_modifiers: 'sharp detail',
      likely_generation_intent: 'product hero image'
    },
    prompt_variants: ['recreate', 'creative', 'commercial'].map(variant)
  };
}

const complete = validateOutput(standardResult(), {
  schemaId: 'standard_v1',
  profileId: 'detailed'
});
assert.equal(complete.status, 'success');
assert.deepEqual(complete.warnings, []);

const partialResult = standardResult();
partialResult.prompt_variants = [variant('recreate'), variant('creative')];
const partial = validateOutput(partialResult, {
  schemaId: 'standard_v1',
  profileId: 'detailed'
});
assert.equal(partial.status, 'partial_success');
assert.ok(partial.warnings.some(item => item.code === 'missing_variant' && item.path === 'prompt_variants.commercial'));

const malformedVariantResult = standardResult();
malformedVariantResult.prompt_variants[1].negative_prompt = '';
const malformedVariant = validateOutput(malformedVariantResult, {
  schemaId: 'standard_v1',
  profileId: 'detailed'
});
assert.equal(malformedVariant.status, 'partial_success');
assert.ok(malformedVariant.warnings.some(item => item.path === 'prompt_variants.creative.negative_prompt'));

const weakNegativeResult = standardResult();
weakNegativeResult.negative_prompt = 'blur, artifacts';
const weakNegative = validateOutput(weakNegativeResult, {
  schemaId: 'standard_v1',
  profileId: 'detailed'
});
assert.equal(weakNegative.status, 'partial_success');
assert.ok(weakNegative.warnings.some(item => item.code === 'negative_term_count'));

assert.throws(
  () => validateOutput({ ...standardResult(), prompt_en: '' }, { schemaId: 'standard_v1' }),
  error => error instanceof OutputValidationError && error.path === 'prompt_en'
);
assert.throws(
  () => validateOutput({ ...standardResult(), json_prompt: {} }, { schemaId: 'standard_v1' }),
  error => error instanceof OutputValidationError && error.path === 'json_prompt.subject'
);

const marketing = standardResult();
delete marketing.prompt_variants;
marketing.json_prompt = {
  visual_reference_strategy: 'clean product hierarchy',
  subject_focus: 'main product',
  scene_context: 'studio campaign visual',
  lighting_color_mood: 'soft blue light',
  composition: 'centered hierarchy',
  adaptation_notes: 'adapt layout without copying'
};
marketing.marketing_diagnosis = {
  business_snapshot: {
    business_summary: 'summary',
    target_customer: 'customer',
    core_offer: 'offer',
    conversion_hook: 'hook',
    quick_judgement: 'judgement'
  },
  marketing_diagnosis: {
    visual_strategy: 'strategy',
    trust_signals: 'trust',
    emotional_driver: 'emotion',
    friction_points: 'friction',
    marketing_readiness_score: {
      overall: 3,
      summary: 'score summary',
      dimensions: {
        attention: 3,
        clarity: 3,
        trust: 3,
        differentiation: 3,
        actionability: 3
      }
    }
  },
  next_actions: {
    improvement_suggestions: ['one'],
    ai_adaptation_brief: 'brief',
    designer_execution_brief: 'designer brief',
    content_angles: ['angle'],
    next_tests: ['test']
  },
  disclaimer: 'reference only'
};
assert.equal(validateOutput(marketing, { schemaId: 'marketing_v1' }).status, 'success');

const incompleteMarketing = structuredClone(marketing);
delete incompleteMarketing.marketing_diagnosis.next_actions;
assert.throws(
  () => validateOutput(incompleteMarketing, { schemaId: 'marketing_v1' }),
  error => error instanceof OutputValidationError && error.path === 'marketing_diagnosis.next_actions'
);

assert.doesNotThrow(() => assertResponseNotTruncated({ choices: [{ finish_reason: 'stop' }] }));
assert.throws(
  () => assertResponseNotTruncated({ choices: [{ finish_reason: 'length' }] }),
  error => error instanceof OutputTruncatedError && error.finishReason === 'length'
);
assert.throws(
  () => assertResponseNotTruncated({ stop_reason: 'max_tokens' }),
  error => error instanceof OutputTruncatedError && error.finishReason === 'max_tokens'
);

console.log('output validator tests passed');
