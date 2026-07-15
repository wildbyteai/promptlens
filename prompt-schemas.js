(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.PromptSchemas = api;
}(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  const SCHEMA_IDS = Object.freeze({
    STANDARD: 'standard_v1',
    MARKETING: 'marketing_v1'
  });
  const VARIANT_IDS = Object.freeze(['recreate', 'creative', 'commercial']);
  const VARIANT_INTENTS = Object.freeze({
    recreate: 'faithful recreation',
    creative: 'creative extension',
    commercial: 'commercial visual adaptation'
  });
  const TAG_RANGES = Object.freeze({
    detailed: [6, 10],
    natural: [6, 10],
    tags: [8, 12],
    concise: [6, 8],
    marketing: [6, 10],
    custom: [1, 12]
  });
  const NEGATIVE_TERM_RANGE = Object.freeze([6, 12]);
  const MARKETING_SCORE_RANGE = Object.freeze([1, 5]);

  const stringSchema = { type: 'string', minLength: 1 };
  const stringArraySchema = {
    type: 'array',
    minItems: 1,
    items: { type: 'string', minLength: 1 }
  };

  const STANDARD_JSON_PROMPT_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: [
      'subject', 'action_pose', 'details_appearance', 'environment_background',
      'lighting_atmosphere', 'composition_framing', 'style_camera', 'colors',
      'materials_textures', 'aspect_ratio', 'quality_modifiers', 'likely_generation_intent'
    ],
    properties: {
      subject: stringSchema,
      action_pose: stringSchema,
      details_appearance: stringSchema,
      environment_background: stringSchema,
      lighting_atmosphere: stringSchema,
      composition_framing: stringSchema,
      style_camera: stringSchema,
      colors: stringArraySchema,
      materials_textures: stringArraySchema,
      aspect_ratio: stringSchema,
      quality_modifiers: stringSchema,
      likely_generation_intent: stringSchema
    }
  };

  const MARKETING_JSON_PROMPT_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: [
      'visual_reference_strategy', 'subject_focus', 'scene_context',
      'lighting_color_mood', 'composition', 'adaptation_notes'
    ],
    properties: {
      visual_reference_strategy: stringSchema,
      subject_focus: stringSchema,
      scene_context: stringSchema,
      lighting_color_mood: stringSchema,
      composition: stringSchema,
      adaptation_notes: stringSchema
    }
  };

  const VARIANT_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'title', 'intent', 'prompt_en', 'prompt_zh_summary', 'tags', 'negative_prompt', 'use_cases'],
    properties: {
      id: { type: 'string', enum: VARIANT_IDS },
      title: stringSchema,
      intent: stringSchema,
      prompt_en: stringSchema,
      prompt_zh_summary: stringSchema,
      tags: stringArraySchema,
      negative_prompt: stringSchema,
      use_cases: stringArraySchema
    }
  };

  const SCORE_SCHEMA = {
    type: 'integer',
    minimum: MARKETING_SCORE_RANGE[0],
    maximum: MARKETING_SCORE_RANGE[1]
  };
  const MARKETING_DIAGNOSIS_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: ['business_snapshot', 'marketing_diagnosis', 'next_actions', 'disclaimer'],
    properties: {
      business_snapshot: {
        type: 'object',
        additionalProperties: false,
        required: ['business_summary', 'target_customer', 'core_offer', 'conversion_hook', 'quick_judgement'],
        properties: {
          business_summary: stringSchema,
          target_customer: stringSchema,
          core_offer: stringSchema,
          conversion_hook: stringSchema,
          quick_judgement: stringSchema
        }
      },
      marketing_diagnosis: {
        type: 'object',
        additionalProperties: false,
        required: ['visual_strategy', 'trust_signals', 'emotional_driver', 'friction_points', 'marketing_readiness_score'],
        properties: {
          visual_strategy: stringSchema,
          trust_signals: stringSchema,
          emotional_driver: stringSchema,
          friction_points: stringSchema,
          marketing_readiness_score: {
            type: 'object',
            additionalProperties: false,
            required: ['overall', 'summary', 'dimensions'],
            properties: {
              overall: SCORE_SCHEMA,
              summary: stringSchema,
              dimensions: {
                type: 'object',
                additionalProperties: false,
                required: ['attention', 'clarity', 'trust', 'differentiation', 'actionability'],
                properties: {
                  attention: SCORE_SCHEMA,
                  clarity: SCORE_SCHEMA,
                  trust: SCORE_SCHEMA,
                  differentiation: SCORE_SCHEMA,
                  actionability: SCORE_SCHEMA
                }
              }
            }
          }
        }
      },
      next_actions: {
        type: 'object',
        additionalProperties: false,
        required: ['improvement_suggestions', 'ai_adaptation_brief', 'designer_execution_brief', 'content_angles', 'next_tests'],
        properties: {
          improvement_suggestions: stringArraySchema,
          ai_adaptation_brief: stringSchema,
          designer_execution_brief: stringSchema,
          content_angles: stringArraySchema,
          next_tests: stringArraySchema
        }
      },
      disclaimer: stringSchema
    }
  };

  const STANDARD_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: ['prompt_zh', 'prompt_en', 'prompt_tags', 'negative_prompt', 'json_prompt', 'prompt_variants'],
    properties: {
      prompt_zh: stringSchema,
      prompt_en: stringSchema,
      prompt_tags: stringArraySchema,
      negative_prompt: stringSchema,
      json_prompt: STANDARD_JSON_PROMPT_SCHEMA,
      prompt_variants: { type: 'array', minItems: 3, maxItems: 3, items: VARIANT_SCHEMA }
    }
  };

  const MARKETING_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: ['prompt_zh', 'prompt_en', 'prompt_tags', 'negative_prompt', 'json_prompt', 'marketing_diagnosis'],
    properties: {
      prompt_zh: stringSchema,
      prompt_en: stringSchema,
      prompt_tags: stringArraySchema,
      negative_prompt: stringSchema,
      json_prompt: MARKETING_JSON_PROMPT_SCHEMA,
      marketing_diagnosis: MARKETING_DIAGNOSIS_SCHEMA
    }
  };

  const SCHEMAS = Object.freeze({
    [SCHEMA_IDS.STANDARD]: STANDARD_SCHEMA,
    [SCHEMA_IDS.MARKETING]: MARKETING_SCHEMA
  });

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getJsonSchema(schemaId) {
    const schema = SCHEMAS[schemaId];
    if (!schema) throw new Error(`Unsupported output schema: ${schemaId}`);
    return clone(schema);
  }

  function getCoreSchema(schemaId) {
    const schema = SCHEMAS[schemaId];
    if (!schema) throw new Error(`Unsupported output schema: ${schemaId}`);
    const typeSpecificField = schemaId === SCHEMA_IDS.MARKETING ? 'marketing_diagnosis' : 'prompt_variants';
    const required = schema.required.filter(field => field !== typeSpecificField);
    return {
      type: 'object',
      required,
      properties: Object.fromEntries(required.map(field => [field, clone(schema.properties[field])]))
    };
  }

  function getVariantSchema() {
    return clone(VARIANT_SCHEMA);
  }

  function getMarketingDiagnosisSchema() {
    return clone(MARKETING_DIAGNOSIS_SCHEMA);
  }

  function getPromptSchemaInstruction(schemaId) {
    if (schemaId === SCHEMA_IDS.STANDARD) {
      return [
        'Return valid JSON only. Do not use markdown fences. Do not include analysis outside the JSON.',
        'The fixed JSON shape is mandatory. Template instructions may change writing style, but must not change field names, field types, root shape, or required fields.',
        'The output JSON must satisfy this JSON Schema:',
        JSON.stringify(getJsonSchema(schemaId), null, 2),
        `prompt_variants must contain exactly the three ids ${VARIANT_IDS.join(', ')}. Keep those ids unchanged.`,
        `Variant intent mapping: ${VARIANT_IDS.map(id => `${id} = ${VARIANT_INTENTS[id]}`).join('; ')}.`
      ].join('\n');
    }
    if (schemaId === SCHEMA_IDS.MARKETING) {
      return [
        'Return valid JSON only. Do not use markdown fences. Do not include analysis outside the JSON.',
        'This template is for business visual marketing diagnosis, not generic prompt recreation.',
        'The output JSON must satisfy this JSON Schema:',
        JSON.stringify(getJsonSchema(schemaId), null, 2),
        `Scores must be integers from ${MARKETING_SCORE_RANGE[0]} to ${MARKETING_SCORE_RANGE[1]}. Score every image independently from visible evidence; do not reuse a default or example score.`,
        'A score is a heuristic marketing-readiness judgment, not a performance prediction.'
      ].join('\n');
    }
    throw new Error(`Unsupported output schema: ${schemaId}`);
  }

  function collectSchemaErrors(value, schema, path = 'root', errors = []) {
    if (!schema) return errors;
    if (schema.type === 'object') {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        errors.push({ code: 'invalid_object', path });
        return errors;
      }
      (schema.required || []).forEach(field => {
        if (!(field in value)) errors.push({ code: 'missing_field', path: path === 'root' ? field : `${path}.${field}` });
      });
      Object.entries(schema.properties || {}).forEach(([field, fieldSchema]) => {
        if (field in value) collectSchemaErrors(value[field], fieldSchema, path === 'root' ? field : `${path}.${field}`, errors);
      });
      return errors;
    }
    if (schema.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push({ code: 'invalid_array', path });
        return errors;
      }
      if (Number.isFinite(schema.minItems) && value.length < schema.minItems) errors.push({ code: 'min_items', path });
      if (Number.isFinite(schema.maxItems) && value.length > schema.maxItems) errors.push({ code: 'max_items', path });
      if (schema.items) value.forEach((item, index) => collectSchemaErrors(item, schema.items, `${path}.${index}`, errors));
      return errors;
    }
    if (schema.type === 'string') {
      if (typeof value !== 'string' || (schema.minLength && value.trim().length < schema.minLength)) {
        errors.push({ code: 'invalid_string', path });
      } else if (schema.enum && !schema.enum.includes(value)) {
        errors.push({ code: 'invalid_enum', path });
      }
      return errors;
    }
    if (schema.type === 'integer') {
      if (!Number.isInteger(Number(value)) || Number(value) < schema.minimum || Number(value) > schema.maximum) {
        errors.push({ code: 'invalid_integer', path });
      }
    }
    return errors;
  }

  return {
    SCHEMA_IDS,
    VARIANT_IDS,
    VARIANT_INTENTS,
    TAG_RANGES,
    NEGATIVE_TERM_RANGE,
    MARKETING_SCORE_RANGE,
    getJsonSchema,
    getCoreSchema,
    getVariantSchema,
    getMarketingDiagnosisSchema,
    getPromptSchemaInstruction,
    collectSchemaErrors
  };
}));
