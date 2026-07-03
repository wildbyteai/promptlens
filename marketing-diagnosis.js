(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.PromptMarketingDiagnosis = api;
}(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  const DEFAULT_DISCLAIMER = '诊断结果基于图片内容和用户提供的业务背景生成，仅用于营销创意和视觉表达参考，不代表真实投放效果、商业结果或专业广告投放建议。';

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
      disclaimer: normalizeString(source.disclaimer) || DEFAULT_DISCLAIMER
    };
  }

  function formatList(items) {
    return normalizeStringArray(items).map(item => `- ${item}`).join('\n');
  }

  function formatScore(score) {
    if (!score || score.overall === null) return '';
    return score.summary ? `${score.overall}/5 - ${score.summary}` : `${score.overall}/5`;
  }

  function getMarketingDiagnosisSections(result) {
    const normalized = normalizeMarketingDiagnosis(result);
    const score = normalized.marketing_diagnosis.marketing_readiness_score;
    return [
      {
        title: '老板先看',
        kicker: '业务快照',
        items: [
          { label: '商业意图', value: normalized.business_snapshot.business_summary },
          { label: '目标客户', value: normalized.business_snapshot.target_customer },
          { label: '核心卖点', value: normalized.business_snapshot.core_offer },
          { label: '转化钩子', value: normalized.business_snapshot.conversion_hook },
          { label: '一句话判断', value: normalized.business_snapshot.quick_judgement }
        ]
      },
      {
        title: '营销诊断',
        kicker: '营销诊断',
        items: [
          { label: '视觉策略', value: normalized.marketing_diagnosis.visual_strategy },
          { label: '信任信号', value: normalized.marketing_diagnosis.trust_signals },
          { label: '情绪驱动', value: normalized.marketing_diagnosis.emotional_driver },
          { label: '转化阻力', value: normalized.marketing_diagnosis.friction_points },
          { label: '营销可用度', value: formatScore(score) }
        ]
      },
      {
        title: '下一步怎么做',
        kicker: '下一步行动',
        items: [
          { label: '改进建议', value: formatList(normalized.next_actions.improvement_suggestions) },
          { label: '低成本改编 brief', value: normalized.next_actions.ai_adaptation_brief },
          { label: '设计/运营执行 brief', value: normalized.next_actions.designer_execution_brief },
          { label: '内容角度', value: formatList(normalized.next_actions.content_angles) },
          { label: '下一轮测试', value: formatList(normalized.next_actions.next_tests) }
        ]
      }
    ];
  }

  function requireObject(value, message) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(message);
    }
    return value;
  }

  function requireNonEmptyString(value, message) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new Error(message);
    }
  }

  function requireStringArray(value, message) {
    if (!Array.isArray(value) || !value.some(item => typeof item === 'string' && item.trim())) {
      throw new Error(message);
    }
  }

  function requireScore(value, message) {
    const score = Number(value);
    if (!Number.isFinite(score) || score < 1 || score > 5) {
      throw new Error(message);
    }
  }

  function validateMarketingDiagnosisResult(result) {
    const source = requireObject(result && result.marketing_diagnosis, '模型返回缺少 marketing_diagnosis 对象字段。');
    const snapshot = requireObject(source.business_snapshot, '模型返回缺少 marketing_diagnosis.business_snapshot 对象字段。');
    const diagnosis = requireObject(source.marketing_diagnosis, '模型返回缺少 marketing_diagnosis.marketing_diagnosis 对象字段。');
    const actions = requireObject(source.next_actions, '模型返回缺少 marketing_diagnosis.next_actions 对象字段。');
    const score = requireObject(diagnosis.marketing_readiness_score, '模型返回缺少 marketing_readiness_score 对象字段。');

    requireNonEmptyString(snapshot.business_summary, '模型返回缺少 business_summary 字段或字段为空。');
    requireNonEmptyString(snapshot.target_customer, '模型返回缺少 target_customer 字段或字段为空。');
    requireNonEmptyString(snapshot.core_offer, '模型返回缺少 core_offer 字段或字段为空。');
    requireNonEmptyString(snapshot.conversion_hook, '模型返回缺少 conversion_hook 字段或字段为空。');
    requireNonEmptyString(snapshot.quick_judgement, '模型返回缺少 quick_judgement 字段或字段为空。');
    requireNonEmptyString(diagnosis.visual_strategy, '模型返回缺少 visual_strategy 字段或字段为空。');
    requireNonEmptyString(diagnosis.trust_signals, '模型返回缺少 trust_signals 字段或字段为空。');
    requireNonEmptyString(diagnosis.emotional_driver, '模型返回缺少 emotional_driver 字段或字段为空。');
    requireNonEmptyString(diagnosis.friction_points, '模型返回缺少 friction_points 字段或字段为空。');
    requireScore(score.overall, '模型返回的 marketing_readiness_score.overall 必须是 1-5 的数字。');
    requireStringArray(actions.improvement_suggestions, '模型返回缺少 improvement_suggestions 数组字段。');
    requireNonEmptyString(actions.ai_adaptation_brief, '模型返回缺少 ai_adaptation_brief 字段或字段为空。');
    requireNonEmptyString(actions.designer_execution_brief, '模型返回缺少 designer_execution_brief 字段或字段为空。');
    requireStringArray(actions.content_angles, '模型返回缺少 content_angles 数组字段。');
    requireStringArray(actions.next_tests, '模型返回缺少 next_tests 数组字段。');
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
    return [...sections, '免责声明', normalized.disclaimer].join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  function buildMarketingDiagnosisMarkdown(result, meta = {}) {
    const normalized = normalizeMarketingDiagnosis(result);
    const score = normalized.marketing_diagnosis.marketing_readiness_score;
    const sections = [
      '# 我用 AI 拆了一张商业视觉图',
      '',
      `- 应用：${normalizeString(meta.app) || 'PromptLens'}`,
      `- 导出时间：${normalizeString(meta.exportedAt) || new Date().toISOString()}`,
      `- 模板：${normalizeString(meta.templateName) || '视觉营销诊断'}`,
      '',
      '## 业务背景',
      '',
      normalizeString(meta.businessContext) || '未提供业务背景；以下诊断仅基于图片可见内容生成。',
      '',
      '## 1. 老板先看：这张图在卖什么',
      '',
      `- 商业意图：${normalized.business_snapshot.business_summary}`,
      `- 核心卖点：${normalized.business_snapshot.core_offer}`,
      `- 一句话判断：${normalized.business_snapshot.quick_judgement}`,
      '',
      '## 2. 它抓住了谁：目标客户和使用场景',
      '',
      normalized.business_snapshot.target_customer,
      '',
      '## 3. 它为什么让人停下来：视觉策略和情绪钩子',
      '',
      `- 视觉策略：${normalized.marketing_diagnosis.visual_strategy}`,
      `- 情绪驱动：${normalized.marketing_diagnosis.emotional_driver}`,
      `- 信任信号：${normalized.marketing_diagnosis.trust_signals}`,
      '',
      '## 4. 它为什么可能影响成交：转化阻力',
      '',
      normalized.marketing_diagnosis.friction_points,
      '',
      '## 5. 中小企业怎么低成本借鉴',
      '',
      formatList(normalized.next_actions.improvement_suggestions),
      '',
      '## 6. 给 AI / 设计师 / 运营的执行 brief',
      '',
      '### 给 AI 生成工具',
      '',
      normalized.next_actions.ai_adaptation_brief,
      '',
      '### 给设计师或运营',
      '',
      normalized.next_actions.designer_execution_brief,
      '',
      '## 7. 可以延展成哪些内容角度',
      '',
      formatList(normalized.next_actions.content_angles),
      '',
      '## 8. 下一张图可以测试什么',
      '',
      formatList(normalized.next_actions.next_tests),
      '',
      '## 营销可用度',
      '',
      formatScore(score),
      '',
      '## 免责声明',
      '',
      DEFAULT_DISCLAIMER
    ];
    return sections.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }

  return {
    DEFAULT_DISCLAIMER,
    normalizeSafeMarketingText,
    validateMarketingDiagnosisResult,
    normalizeMarketingDiagnosis,
    getMarketingDiagnosisSections,
    buildMarketingDiagnosisCopyText,
    buildMarketingDiagnosisMarkdown,
    hasMarketingDiagnosis
  };
}));
