(function (root, factory) {
  const variantsApi = root.PromptVariants || (typeof require === 'function' ? require('./prompt-variants.js') : null);
  const api = factory(variantsApi);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.PromptHistoryFormat = api;
}(typeof globalThis !== 'undefined' ? globalThis : window, function (PromptVariants) {
  'use strict';

  function normalizeString(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function normalizeTags(value) {
    return Array.isArray(value) ? value.filter(tag => typeof tag === 'string' && tag.trim()).map(tag => tag.trim()) : [];
  }

  function stringifyJsonPrompt(value) {
    if (!value || typeof value !== 'object') return '';
    return JSON.stringify(value, null, 2);
  }

  function getPromptVariantsMarkdown(result) {
    if (!PromptVariants || !result || typeof result !== 'object') return '';
    const variants = PromptVariants.normalizePromptVariants(result);
    return PromptVariants.formatPromptVariantsMarkdown(variants);
  }

  function getHistoryDisplayFields(item) {
    const result = item && item.result && typeof item.result === 'object' ? item.result : {};
    const promptEn = normalizeString(item && item.promptEn) || normalizeString(result.prompt_en);
    const promptZh = normalizeString(item && item.promptZh) || normalizeString(result.prompt_zh);
    const itemTags = normalizeTags(item && item.promptTags);
    const resultTags = normalizeTags(result.prompt_tags);
    const tags = itemTags.length ? itemTags : resultTags;
    const negativePrompt = normalizeString(item && item.negativePrompt) || normalizeString(result.negative_prompt);
    const jsonPrompt = stringifyJsonPrompt(item && item.jsonPrompt) || stringifyJsonPrompt(result.json_prompt);
    const variantsMarkdown = getPromptVariantsMarkdown(result);
    const rawText = normalizeString(item && item.rawText);

    const fields = [
      { key: 'promptEn', label: 'English Prompt', value: promptEn, kind: 'text' },
      { key: 'promptZh', label: '中文提示词', value: promptZh, kind: 'text' },
      { key: 'tags', label: 'Tags', value: tags.join(', '), kind: 'tags' },
      { key: 'negativePrompt', label: 'Negative Prompt', value: negativePrompt, kind: 'text' },
      { key: 'jsonPrompt', label: 'JSON Prompt', value: jsonPrompt, kind: 'code' }
    ];

    if (variantsMarkdown) {
      fields.push({ key: 'promptVariants', label: '专业用途 Prompt 候选', value: variantsMarkdown, kind: 'variant-card' });
    }

    fields.push({ key: 'rawText', label: 'Raw JSON', value: rawText, kind: 'code' });
    return fields;
  }

  function buildHistoryCopyText(item) {
    const meta = [];
    const sourceDomain = normalizeString(item && item.sourceDomain);
    const inputType = normalizeString(item && item.inputType);
    const templateName = normalizeString(item && item.templateName);

    if (sourceDomain) meta.push(`Source: ${sourceDomain}`);
    if (inputType) meta.push(`Input Type: ${inputType}`);
    if (templateName) meta.push(`Template: ${templateName}`);

    const sections = getHistoryDisplayFields(item)
      .filter(field => field.value)
      .flatMap(field => [field.label, field.value, '']);

    return [...meta, meta.length ? '' : '', ...sections].join('\n').trim();
  }

  return {
    getHistoryDisplayFields,
    buildHistoryCopyText
  };
}));
