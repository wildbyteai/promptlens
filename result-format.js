(function (root, factory) {
  const api = factory(
    root.PromptVariants || (typeof require === 'function' ? require('./prompt-variants.js') : null),
    root.PromptMarketingDiagnosis || (typeof require === 'function' ? require('./marketing-diagnosis.js') : null),
    root.PromptTemplates || null
  );
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.PromptResultFormat = api;
}(typeof globalThis !== 'undefined' ? globalThis : window, function (PromptVariants, PromptMarketingDiagnosis, PromptTemplates) {
  'use strict';

  const t = (key, params) => globalThis.PromptLensI18n ? globalThis.PromptLensI18n.t(key, params) : key;

  function isMarketingTemplate(template) {
    return Boolean(PromptTemplates && PromptTemplates.isMarketingDiagnosisTemplate(template && template.id));
  }

  function buildStandardView(data) {
    const result = data && data.result && typeof data.result === 'object' ? data.result : {};
    const tags = Array.isArray(result.prompt_tags) ? result.prompt_tags.join(', ') : '';
    const variants = PromptVariants ? PromptVariants.normalizePromptVariants(result) : [];
    return {
      template: data && data.template ? data.template : null,
      fields: [
        { label: t('fieldEnglishPrompt'), value: result.prompt_en || '' },
        { label: t('fieldChinesePrompt'), value: result.prompt_zh || '' },
        { label: t('fieldTags'), value: tags },
        { label: t('fieldNegativePrompt'), value: result.negative_prompt || '' },
        { label: t('fieldJsonPrompt'), value: JSON.stringify(result.json_prompt || {}, null, 2), codeLanguage: 'json' }
      ],
      variantsMarkdown: PromptVariants ? PromptVariants.formatPromptVariantsMarkdown(variants) : ''
    };
  }

  function buildMarkdown(data, options = {}) {
    const result = data && data.result && typeof data.result === 'object' ? data.result : {};
    const template = data && data.template ? data.template : null;
    if (isMarketingTemplate(template) && PromptMarketingDiagnosis) {
      return PromptMarketingDiagnosis.buildMarketingDiagnosisMarkdown(result, {
        app: data.app || 'PromptLens',
        exportedAt: data.exportedAt || new Date().toISOString(),
        templateName: template.name,
        businessContext: options.businessContext || ''
      });
    }

    const view = buildStandardView(data);
    const sections = [
      `# ${t('exportPromptAnalysisTitle')}`,
      '',
      `- ${t('exportApp', { value: data && data.app || 'PromptLens' })}`,
      `- ${t('exportedAt', { value: data && data.exportedAt || new Date().toISOString() })}`,
      `- ${t('exportTemplate', { value: view.template ? view.template.name : t('commonUnknown') })}`,
      ''
    ];
    view.fields.forEach(field => {
      sections.push(`## ${field.label}`, '');
      if (field.codeLanguage) sections.push(`\`\`\`${field.codeLanguage}`);
      sections.push(field.value);
      if (field.codeLanguage) sections.push('```');
      sections.push('');
    });
    if (view.variantsMarkdown) sections.push(view.variantsMarkdown, '');
    return sections.join('\n');
  }

  function buildCopyText(data) {
    const result = data && data.result && typeof data.result === 'object' ? data.result : {};
    const template = data && data.template ? data.template : null;
    if (isMarketingTemplate(template) && PromptMarketingDiagnosis) {
      return PromptMarketingDiagnosis.buildMarketingDiagnosisCopyText(result);
    }

    const view = buildStandardView(data);
    const sections = [];
    view.fields.forEach((field, index) => {
      if (index) sections.push('');
      sections.push(field.label, field.value);
    });
    if (view.variantsMarkdown) sections.push('', view.variantsMarkdown);
    return sections.join('\n');
  }

  return { buildMarkdown, buildCopyText };
}));
