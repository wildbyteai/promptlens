(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.PromptMarketingDiagnosis = api;
}(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  const runtime = typeof globalThis !== 'undefined' ? globalThis : window;
  const t = (key, params) => globalThis.PromptLensI18n ? globalThis.PromptLensI18n.t(key, params) : key;
  const localizedError = (key, params = {}) => globalThis.PromptLensI18n.createError(key, params);

  const MARKETING_DIMENSION_ORDER = Object.freeze(['attention', 'clarity', 'trust', 'differentiation', 'actionability']);
  const MARKETING_DIMENSION_KEYS = Object.freeze({
    attention: 'marketingDimensionAttention',
    clarity: 'marketingDimensionClarity',
    trust: 'marketingDimensionTrust',
    differentiation: 'marketingDimensionDifferentiation',
    actionability: 'marketingDimensionActionability'
  });

  function normalizeSafeMarketingText(value) {
    if (typeof value !== 'string') return '';
    return value
      .trim()
      .replace(/复制原图/g, '借鉴视觉策略')
      .replace(/完全复刻/g, '参考视觉结构')
      .replace(/一比一复刻/g, '低成本改编')
      .replace(/原样复制/g, '改编视觉策略')
      .replace(/照抄/g, '借鉴')
      .replace(/抄图/g, '借鉴图片策略')
      .replace(/recreate exactly/gi, 'adapt the visual strategy')
      .replace(/copy exactly/gi, 'adapt safely')
      .replace(/exact copy/gi, 'safe adaptation')
      .replace(/clone the image/gi, 'adapt the visual strategy');
  }

  function normalizeString(value) {
    return normalizeSafeMarketingText(value);
  }

  function normalizeStringArray(value) {
    return Array.isArray(value) ? value.filter(item => typeof item === 'string' && item.trim()).map(item => item.trim()) : [];
  }

  function clampScore(value) {
    return Number.isFinite(Number(value)) ? Math.max(1, Math.min(5, Number(value))) : null;
  }

  function normalizeScore(value) {
    const source = value && typeof value === 'object' ? value : {};
    const dimensions = source.dimensions && typeof source.dimensions === 'object' ? source.dimensions : {};
    return {
      overall: clampScore(source.overall),
      summary: normalizeString(source.summary),
      dimensions: {
        attention: clampScore(dimensions.attention),
        clarity: clampScore(dimensions.clarity),
        trust: clampScore(dimensions.trust),
        differentiation: clampScore(dimensions.differentiation),
        actionability: clampScore(dimensions.actionability)
      }
    };
  }

  function getDiagnosisSource(result) {
    return result && result.marketing_diagnosis && typeof result.marketing_diagnosis === 'object' ? result.marketing_diagnosis : {};
  }

  function hasMarketingDiagnosis(result) {
    return Boolean(result && result.marketing_diagnosis && typeof result.marketing_diagnosis === 'object');
  }

  function normalizeMarketingDiagnosis(result) {
    const source = getDiagnosisSource(result);
    const snapshot = source.business_snapshot && typeof source.business_snapshot === 'object' ? source.business_snapshot : {};
    const diagnosis = source.marketing_diagnosis && typeof source.marketing_diagnosis === 'object' ? source.marketing_diagnosis : {};
    const actions = source.next_actions && typeof source.next_actions === 'object' ? source.next_actions : {};

    return {
      business_snapshot: {
        business_summary: normalizeString(snapshot.business_summary),
        target_customer: normalizeString(snapshot.target_customer),
        core_offer: normalizeString(snapshot.core_offer),
        conversion_hook: normalizeString(snapshot.conversion_hook),
        quick_judgement: normalizeString(snapshot.quick_judgement)
      },
      marketing_diagnosis: {
        visual_strategy: normalizeString(diagnosis.visual_strategy),
        trust_signals: normalizeString(diagnosis.trust_signals),
        emotional_driver: normalizeString(diagnosis.emotional_driver),
        friction_points: normalizeString(diagnosis.friction_points),
        marketing_readiness_score: normalizeScore(diagnosis.marketing_readiness_score)
      },
      next_actions: {
        improvement_suggestions: normalizeStringArray(actions.improvement_suggestions),
        ai_adaptation_brief: normalizeString(actions.ai_adaptation_brief),
        designer_execution_brief: normalizeString(actions.designer_execution_brief),
        content_angles: normalizeStringArray(actions.content_angles),
        next_tests: normalizeStringArray(actions.next_tests)
      },
      disclaimer: normalizeString(source.disclaimer) || t('marketingDisclaimer')
    };
  }

  function formatList(items) {
    return normalizeStringArray(items).map(item => `- ${item}`).join('\n');
  }

  function formatScore(score) {
    if (!score || score.overall === null) return '';
    const lines = [score.summary ? `${score.overall}/5 - ${score.summary}` : `${score.overall}/5`];
    MARKETING_DIMENSION_ORDER.forEach(id => {
      const value = score.dimensions && score.dimensions[id];
      if (value !== null && value !== undefined) {
        lines.push(t('marketingDimensionScore', { label: t(MARKETING_DIMENSION_KEYS[id]), score: value }));
      }
    });
    return lines.join('\n');
  }

  function getMarketingDiagnosisSections(result) {
    const normalized = normalizeMarketingDiagnosis(result);
    const score = normalized.marketing_diagnosis.marketing_readiness_score;
    return [
      {
        title: t('marketingSnapshotTitle'),
        kicker: t('marketingSnapshotKicker'),
        items: [
          { label: t('marketingBusinessIntent'), value: normalized.business_snapshot.business_summary },
          { label: t('marketingTargetCustomer'), value: normalized.business_snapshot.target_customer },
          { label: t('marketingCoreOffer'), value: normalized.business_snapshot.core_offer },
          { label: t('marketingConversionHook'), value: normalized.business_snapshot.conversion_hook },
          { label: t('marketingQuickJudgement'), value: normalized.business_snapshot.quick_judgement }
        ]
      },
      {
        title: t('marketingDiagnosisTitle'),
        kicker: t('marketingDiagnosisKicker'),
        items: [
          { label: t('marketingVisualStrategy'), value: normalized.marketing_diagnosis.visual_strategy },
          { label: t('marketingTrustSignals'), value: normalized.marketing_diagnosis.trust_signals },
          { label: t('marketingEmotionalDriver'), value: normalized.marketing_diagnosis.emotional_driver },
          { label: t('marketingFrictionPoints'), value: normalized.marketing_diagnosis.friction_points },
          { label: t('marketingReadiness'), value: formatScore(score) }
        ]
      },
      {
        title: t('marketingActionsTitle'),
        kicker: t('marketingActionsKicker'),
        items: [
          { label: t('marketingImprovementSuggestions'), value: formatList(normalized.next_actions.improvement_suggestions) },
          { label: t('marketingAiBrief'), value: normalized.next_actions.ai_adaptation_brief },
          { label: t('marketingDesignerBrief'), value: normalized.next_actions.designer_execution_brief },
          { label: t('marketingContentAngles'), value: formatList(normalized.next_actions.content_angles) },
          { label: t('marketingNextTests'), value: formatList(normalized.next_actions.next_tests) }
        ]
      }
    ];
  }

  function getPromptSchemas() {
    if (runtime.PromptSchemas) return runtime.PromptSchemas;
    if (typeof module === 'object' && module.exports && typeof require === 'function') {
      return require('./prompt-schemas.js');
    }
    throw new Error('PromptSchemas is not loaded.');
  }

  function validateMarketingDiagnosisResult(result) {
    const schemas = getPromptSchemas();
    const errors = schemas.collectSchemaErrors(
      result && result.marketing_diagnosis,
      schemas.getMarketingDiagnosisSchema(),
      'marketing_diagnosis'
    );
    if (!errors.length) return;
    const first = errors[0];
    if (first.code === 'invalid_integer') throw localizedError('errorMarketingScore');
    if (first.code === 'invalid_object') throw localizedError('errorMarketingObject', { field: first.path });
    if (first.code === 'invalid_array' || first.code === 'min_items') {
      throw localizedError('errorMarketingArray', { field: first.path });
    }
    throw localizedError('errorMarketingField', { field: first.path });
  }

  function buildMarketingDiagnosisCopyText(result) {
    const normalized = normalizeMarketingDiagnosis(result);
    const sections = getMarketingDiagnosisSections(result).flatMap(section => {
      const lines = [section.title];
      section.items.forEach(item => {
        if (item.value) lines.push(item.label, item.value, '');
      });
      return lines;
    });
    return [...sections, t('marketingDisclaimerLabel'), normalized.disclaimer].join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  function buildMarketingDiagnosisMarkdown(result, meta = {}) {
    const normalized = normalizeMarketingDiagnosis(result);
    const score = normalized.marketing_diagnosis.marketing_readiness_score;
    const sections = [
      `# ${t('marketingExportTitle')}`,
      '',
      `- ${t('exportApp', { value: normalizeString(meta.app) || 'PromptLens' })}`,
      `- ${t('exportedAt', { value: normalizeString(meta.exportedAt) || new Date().toISOString() })}`,
      `- ${t('exportTemplate', { value: normalizeString(meta.templateName) || t('templateMarketingName') })}`,
      '',
      `## ${t('marketingExportBusinessContext')}`,
      '',
      normalizeString(meta.businessContext) || t('marketingNoBusinessContext'),
      '',
      `## 1. ${t('marketingExportSection1')}`,
      '',
      `- ${t('marketingBusinessIntent')}${t('commonLabelSeparator')}${normalized.business_snapshot.business_summary}`,
      `- ${t('marketingCoreOffer')}${t('commonLabelSeparator')}${normalized.business_snapshot.core_offer}`,
      `- ${t('marketingQuickJudgement')}${t('commonLabelSeparator')}${normalized.business_snapshot.quick_judgement}`,
      '',
      `## 2. ${t('marketingExportSection2')}`,
      '',
      normalized.business_snapshot.target_customer,
      '',
      `## 3. ${t('marketingExportSection3')}`,
      '',
      `- ${t('marketingVisualStrategy')}${t('commonLabelSeparator')}${normalized.marketing_diagnosis.visual_strategy}`,
      `- ${t('marketingEmotionalDriver')}${t('commonLabelSeparator')}${normalized.marketing_diagnosis.emotional_driver}`,
      `- ${t('marketingTrustSignals')}${t('commonLabelSeparator')}${normalized.marketing_diagnosis.trust_signals}`,
      '',
      `## 4. ${t('marketingExportSection4')}`,
      '',
      normalized.marketing_diagnosis.friction_points,
      '',
      `## 5. ${t('marketingExportSection5')}`,
      '',
      formatList(normalized.next_actions.improvement_suggestions),
      '',
      `## 6. ${t('marketingExportSection6')}`,
      '',
      `### ${t('marketingExportAiTool')}`,
      '',
      normalized.next_actions.ai_adaptation_brief,
      '',
      `### ${t('marketingExportDesigner')}`,
      '',
      normalized.next_actions.designer_execution_brief,
      '',
      `## 7. ${t('marketingExportSection7')}`,
      '',
      formatList(normalized.next_actions.content_angles),
      '',
      `## 8. ${t('marketingExportSection8')}`,
      '',
      formatList(normalized.next_actions.next_tests),
      '',
      `## ${t('marketingReadiness')}`,
      '',
      formatScore(score),
      '',
      `## ${t('marketingDisclaimerLabel')}`,
      '',
      normalized.disclaimer
    ];
    return sections.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }

  return {
    MARKETING_DIMENSION_ORDER,
    normalizeSafeMarketingText,
    validateMarketingDiagnosisResult,
    normalizeMarketingDiagnosis,
    getMarketingDiagnosisSections,
    buildMarketingDiagnosisCopyText,
    buildMarketingDiagnosisMarkdown,
    hasMarketingDiagnosis
  };
}));
