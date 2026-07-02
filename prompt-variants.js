(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.PromptVariants = api;
}(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  const VARIANT_ORDER = ['recreate', 'creative', 'commercial'];

  const DEFAULT_VARIANTS = {
    recreate: {
      title: '复刻版',
      intent: '尽量还原参考图的主体、构图、风格、光影和材质'
    },
    creative: {
      title: '创意延展版',
      intent: '保留核心视觉基因，探索新的视觉方向'
    },
    commercial: {
      title: '商业强化版',
      intent: '面向广告、产品图、海报和品牌视觉方向的 prompt 改写建议'
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
        title: normalizeString(raw.title) || defaults.title,
        intent: normalizeString(raw.intent) || defaults.intent,
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
      '说明',
      normalizeString(variant.prompt_zh_summary) || normalizeString(variant.intent),
      '',
      'Prompt',
      normalizeString(variant.prompt_en),
      '',
      'Tags',
      normalizeStringArray(variant.tags).join(', '),
      '',
      'Negative Prompt',
      normalizeString(variant.negative_prompt),
      '',
      '适用场景',
      normalizeStringArray(variant.use_cases).join(', ')
    ];
    return sections.join('\n').trim();
  }

  function formatPromptVariantMarkdown(variant) {
    if (!variant || typeof variant !== 'object' || !variant.isComplete) return '';
    const tags = normalizeStringArray(variant.tags).join(', ');
    const useCases = normalizeStringArray(variant.use_cases).join(', ');
    return [
      `### ${normalizeString(variant.title)}`,
      '',
      `**说明：** ${normalizeString(variant.prompt_zh_summary) || normalizeString(variant.intent)}`,
      '',
      '**Prompt：**',
      '',
      normalizeString(variant.prompt_en),
      '',
      `**Tags：** ${tags}`,
      '',
      `**Negative Prompt：** ${normalizeString(variant.negative_prompt)}`,
      '',
      `**适用场景：** ${useCases}`,
      ''
    ].join('\n');
  }

  function formatPromptVariantsMarkdown(variants) {
    const validVariants = Array.isArray(variants) ? variants.filter(variant => variant && variant.isComplete) : [];
    if (!validVariants.length) return '';
    return [
      '## 专业用途 Prompt 候选',
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
