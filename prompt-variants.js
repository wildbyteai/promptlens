(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.PromptVariants = api;
}(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  const VARIANT_ORDER = ['recreate', 'creative', 'commercial'];
  const t = (key, params) => globalThis.PromptLensI18n ? globalThis.PromptLensI18n.t(key, params) : key;

  const DEFAULT_VARIANTS = {
    recreate: {
      titleKey: 'variantRecreateTitle',
      intentKey: 'variantRecreateIntent'
    },
    creative: {
      titleKey: 'variantCreativeTitle',
      intentKey: 'variantCreativeIntent'
    },
    commercial: {
      titleKey: 'variantCommercialTitle',
      intentKey: 'variantCommercialIntent'
    }
  };

  function normalizeString(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function normalizeStringArray(value) {
    if (!Array.isArray(value)) return [];
    return value
      .filter(item => typeof item === 'string' && item.trim())
      .map(item => item.trim());
  }

  function getVariantExplanation(variant) {
    const useEnglish = globalThis.PromptLensI18n && globalThis.PromptLensI18n.getLanguage
      ? globalThis.PromptLensI18n.getLanguage() === 'en'
      : false;
    return useEnglish
      ? normalizeString(variant.intent) || normalizeString(variant.prompt_zh_summary)
      : normalizeString(variant.prompt_zh_summary) || normalizeString(variant.intent);
  }

  function normalizePromptVariants(result) {
    const source = result && typeof result === 'object' ? result.prompt_variants : null;
    if (!Array.isArray(source)) return [];

    const fallbackPromptEn = normalizeString(result && result.prompt_en);
    const byId = new Map();

    source.forEach(raw => {
      if (!raw || typeof raw !== 'object') return;
      const id = normalizeString(raw.id);
      if (!VARIANT_ORDER.includes(id) || byId.has(id)) return;

      const defaults = DEFAULT_VARIANTS[id];
      const rawPromptEn = normalizeString(raw.prompt_en);
      const promptEn = rawPromptEn || (id === 'recreate' ? fallbackPromptEn : '');

      byId.set(id, {
        id,
        title: t(defaults.titleKey),
        intent: normalizeString(raw.intent) || t(defaults.intentKey),
        prompt_en: promptEn,
        prompt_zh_summary: normalizeString(raw.prompt_zh_summary),
        tags: normalizeStringArray(raw.tags),
        negative_prompt: normalizeString(raw.negative_prompt),
        use_cases: normalizeStringArray(raw.use_cases),
        isComplete: Boolean(promptEn)
      });
    });

    return VARIANT_ORDER
      .filter(id => byId.has(id))
      .map(id => byId.get(id));
  }

  function formatPromptVariantCard(variant) {
    if (!variant || typeof variant !== 'object') return '';
    const sections = [
      normalizeString(variant.title),
      '',
      t('variantExplanation'),
      getVariantExplanation(variant),
      '',
      t('variantPrompt'),
      normalizeString(variant.prompt_en),
      '',
      t('variantTags'),
      normalizeStringArray(variant.tags).join(', '),
      '',
      t('variantNegativePrompt'),
      normalizeString(variant.negative_prompt),
      '',
      t('variantUseCases'),
      normalizeStringArray(variant.use_cases).join(', ')
    ];
    return sections.join('\n').trim();
  }

  function formatPromptVariantMarkdown(variant) {
    if (!variant || typeof variant !== 'object' || !variant.isComplete) return '';
    const tags = normalizeStringArray(variant.tags).join(', ');
    const useCases = normalizeStringArray(variant.use_cases).join(', ');
    const separator = t('commonLabelSeparator');
    return [
      `### ${normalizeString(variant.title)}`,
      '',
      `**${t('variantExplanation')}${separator}** ${getVariantExplanation(variant)}`,
      '',
      `**${t('variantPrompt')}${separator}**`,
      '',
      normalizeString(variant.prompt_en),
      '',
      `**${t('variantTags')}${separator}** ${tags}`,
      '',
      `**${t('variantNegativePrompt')}${separator}** ${normalizeString(variant.negative_prompt)}`,
      '',
      `**${t('variantUseCases')}${separator}** ${useCases}`,
      ''
    ].join('\n');
  }

  function formatPromptVariantsMarkdown(variants) {
    const validVariants = Array.isArray(variants) ? variants.filter(variant => variant && variant.isComplete) : [];
    if (!validVariants.length) return '';
    return [
      `## ${t('variantsTitle')}`,
      '',
      ...validVariants.map(formatPromptVariantMarkdown)
    ].join('\n').trim();
  }

  return {
    VARIANT_ORDER,
    normalizePromptVariants,
    formatPromptVariantCard,
    formatPromptVariantsMarkdown
  };
}));
