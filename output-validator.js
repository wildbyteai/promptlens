(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.PromptOutputValidator = api;
}(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  const runtime = typeof globalThis !== 'undefined' ? globalThis : window;

  class OutputValidationError extends Error {
    constructor(code, path, message) {
      super(message || `${code}: ${path}`);
      this.name = 'OutputValidationError';
      this.code = code;
      this.path = path;
    }
  }

  class OutputTruncatedError extends Error {
    constructor(finishReason) {
      super(`Model output was truncated (${finishReason}).`);
      this.name = 'OutputTruncatedError';
      this.code = 'output_truncated';
      this.finishReason = finishReason;
    }
  }

  function getPromptSchemas() {
    if (runtime.PromptSchemas) return runtime.PromptSchemas;
    if (typeof module === 'object' && module.exports && typeof require === 'function') {
      return require('./prompt-schemas.js');
    }
    throw new Error('PromptSchemas is not loaded.');
  }

  function throwFirstSchemaError(errors) {
    if (!errors.length) return;
    const first = errors[0];
    throw new OutputValidationError(first.code, first.path);
  }

  function addWarning(warnings, code, path, details = {}) {
    warnings.push({ code, path, ...details });
  }

  function countNegativeTerms(value) {
    return String(value || '')
      .split(/[,;\n]+/)
      .map(item => item.trim())
      .filter(Boolean)
      .length;
  }

  function validateCore(result, schemaId) {
    const schemas = getPromptSchemas();
    throwFirstSchemaError(schemas.collectSchemaErrors(result, schemas.getCoreSchema(schemaId)));
  }

  function validateQualityContracts(result, options, warnings) {
    const schemas = getPromptSchemas();
    const profileId = options.profileId || (options.schemaId === schemas.SCHEMA_IDS.MARKETING ? 'marketing' : 'custom');
    const range = schemas.TAG_RANGES[profileId] || schemas.TAG_RANGES.custom;
    const tagCount = result.prompt_tags.filter(item => typeof item === 'string' && item.trim()).length;
    if (tagCount < range[0] || tagCount > range[1]) {
      addWarning(warnings, 'tag_count', 'prompt_tags', { expectedMin: range[0], expectedMax: range[1], actual: tagCount });
    }

    const negativeRange = schemas.NEGATIVE_TERM_RANGE;
    const negativeTermCount = countNegativeTerms(result.negative_prompt);
    if (negativeTermCount < negativeRange[0] || negativeTermCount > negativeRange[1]) {
      addWarning(warnings, 'negative_term_count', 'negative_prompt', {
        expectedMin: negativeRange[0],
        expectedMax: negativeRange[1],
        actual: negativeTermCount
      });
    }
  }

  function validateVariants(result, warnings) {
    const schemas = getPromptSchemas();
    const variantIds = schemas.VARIANT_IDS;
    if (!Array.isArray(result.prompt_variants)) {
      variantIds.forEach(id => addWarning(warnings, 'missing_variant', `prompt_variants.${id}`, { variantId: id }));
      return;
    }

    const byId = new Map();
    result.prompt_variants.forEach((variant, index) => {
      if (!variant || typeof variant !== 'object' || Array.isArray(variant)) {
        addWarning(warnings, 'invalid_variant', `prompt_variants.${index}`);
        return;
      }
      const id = typeof variant.id === 'string' ? variant.id.trim() : '';
      if (!variantIds.includes(id)) {
        addWarning(warnings, 'unknown_variant', `prompt_variants.${index}.id`, { actual: id });
        return;
      }
      if (byId.has(id)) {
        addWarning(warnings, 'duplicate_variant', `prompt_variants.${id}`, { variantId: id });
        return;
      }
      byId.set(id, variant);
    });

    variantIds.forEach(id => {
      const variant = byId.get(id);
      if (!variant) {
        addWarning(warnings, 'missing_variant', `prompt_variants.${id}`, { variantId: id });
        return;
      }
      const errors = schemas.collectSchemaErrors(variant, schemas.getVariantSchema(), `prompt_variants.${id}`);
      errors
        .filter(error => error.path !== `prompt_variants.${id}.id`)
        .forEach(error => addWarning(warnings, 'incomplete_variant_field', error.path, {
          variantId: id,
          field: error.path.split('.').slice(2).join('.')
        }));
    });
  }

  function validateMarketing(result) {
    const schemas = getPromptSchemas();
    const errors = schemas.collectSchemaErrors(
      result.marketing_diagnosis,
      schemas.getMarketingDiagnosisSchema(),
      'marketing_diagnosis'
    );
    throwFirstSchemaError(errors);
  }

  function validateOutput(result, options = {}) {
    const schemas = getPromptSchemas();
    const schemaId = Object.values(schemas.SCHEMA_IDS).includes(options.schemaId)
      ? options.schemaId
      : schemas.SCHEMA_IDS.STANDARD;
    validateCore(result, schemaId);
    const warnings = [];
    validateQualityContracts(result, { ...options, schemaId }, warnings);
    if (schemaId === schemas.SCHEMA_IDS.MARKETING) {
      validateMarketing(result);
    } else if (schemaId === schemas.SCHEMA_IDS.STANDARD) {
      validateVariants(result, warnings);
    }
    return {
      status: warnings.length ? 'partial_success' : 'success',
      warnings
    };
  }

  function getFinishReason(responseJson) {
    const choiceReason = responseJson && Array.isArray(responseJson.choices) && responseJson.choices[0]
      ? responseJson.choices[0].finish_reason
      : '';
    return String(choiceReason || responseJson && (responseJson.stop_reason || responseJson.finish_reason) || '');
  }

  function assertResponseNotTruncated(responseJson) {
    const finishReason = getFinishReason(responseJson);
    if (finishReason === 'length' || finishReason === 'max_tokens' || finishReason === 'max_output_tokens') {
      throw new OutputTruncatedError(finishReason);
    }
  }

  return {
    get VARIANT_IDS() {
      return getPromptSchemas().VARIANT_IDS;
    },
    OutputValidationError,
    OutputTruncatedError,
    validateOutput,
    getFinishReason,
    assertResponseNotTruncated
  };
}));
