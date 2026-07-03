const assert = require('node:assert/strict');

const {
  normalizeMarketingDiagnosis,
  getMarketingDiagnosisSections,
  buildMarketingDiagnosisCopyText,
  buildMarketingDiagnosisMarkdown,
  hasMarketingDiagnosis,
  normalizeSafeMarketingText,
  validateMarketingDiagnosisResult
} = require('../marketing-diagnosis.js');

const result = {
  prompt_en: 'Premium skincare product on a warm bathroom counter.',
  marketing_diagnosis: {
    business_snapshot: {
      business_summary: '这张图在卖高端护肤品的精致生活感。',
      target_customer: '重视品质和自我护理的 25-40 岁女性。',
      core_offer: '温和、可信、适合日常使用的护肤体验。',
      conversion_hook: '暖光、干净台面和产品特写降低尝试门槛。',
      quick_judgement: '氛围和信任感较强，但促销理由不够直接。'
    },
    marketing_diagnosis: {
      visual_strategy: '用近景产品主体和暖色浴室环境强调日常可用。',
      trust_signals: '干净包装、柔和光线和真实生活场景建立品质感。',
      emotional_driver: '调动放松、悦己和安全感。',
      friction_points: '缺少明确价格、功效或行动提示。',
      marketing_readiness_score: {
        overall: 4,
        summary: '吸引力强，但成交理由还需要更明确。',
        dimensions: {
          attention: 7,
          clarity: 3,
          trust: 4,
          differentiation: 3,
          actionability: 0
        }
      }
    },
    next_actions: {
      improvement_suggestions: [
        '增加一句具体功效承诺。',
        '加入更明显的 CTA。',
        '补充使用前后或质地细节。'
      ],
      ai_adaptation_brief: '借鉴暖色生活方式产品图，生成同类护肤品主视觉，不复制原图包装。',
      designer_execution_brief: '保持暖光和干净台面，突出产品瓶身，补充一句核心卖点。',
      content_angles: ['早晨护肤流程', '敏感肌安心使用', '浴室质感升级'],
      next_tests: ['测试有无 CTA 的点击差异', '测试人物手部入镜版本']
    },
    disclaimer: '诊断仅用于营销创意参考，不代表真实投放效果。'
  }
};

assert.equal(hasMarketingDiagnosis(result), true);
assert.equal(hasMarketingDiagnosis({ prompt_en: 'Only prompt' }), false);

const normalized = normalizeMarketingDiagnosis(result);
assert.equal(normalized.business_snapshot.business_summary, '这张图在卖高端护肤品的精致生活感。');
assert.equal(normalized.marketing_diagnosis.marketing_readiness_score.overall, 4);
assert.equal(normalized.marketing_diagnosis.marketing_readiness_score.dimensions.attention, 5);
assert.equal(normalized.marketing_diagnosis.marketing_readiness_score.dimensions.actionability, 1);
assert.deepEqual(normalized.next_actions.content_angles, ['早晨护肤流程', '敏感肌安心使用', '浴室质感升级']);

const empty = normalizeMarketingDiagnosis({ marketing_diagnosis: {} });
assert.equal(empty.business_snapshot.business_summary, '');
assert.deepEqual(empty.next_actions.improvement_suggestions, []);
assert.equal(empty.marketing_diagnosis.marketing_readiness_score.summary, '');

const sections = getMarketingDiagnosisSections(result);
assert.deepEqual(sections.map(section => section.title), ['老板先看', '营销诊断', '下一步怎么做']);
assert.equal(sections[0].items[0].label, '商业意图');
assert.equal(sections[0].items[0].value, '这张图在卖高端护肤品的精致生活感。');
assert.equal(sections[1].items.some(item => item.label === '营销可用度'), true);
assert.equal(sections[2].items.some(item => item.label === '低成本改编 brief'), true);

const copyText = buildMarketingDiagnosisCopyText(result);
assert.match(copyText, /老板先看/);
assert.match(copyText, /商业意图\n这张图在卖高端护肤品的精致生活感。/);
assert.match(copyText, /营销可用度\n4\/5 - 吸引力强，但成交理由还需要更明确。/);
assert.match(copyText, /低成本改编 brief/);
assert.match(copyText, /诊断仅用于营销创意参考，不代表真实投放效果。/);
assert.doesNotMatch(copyText, /复制原图|抄图|recreate exactly/i);

const markdown = buildMarketingDiagnosisMarkdown(result, {
  app: 'PromptLens',
  exportedAt: '2026-07-02T00:00:00.000Z',
  templateName: '视觉营销诊断'
});
assert.match(markdown, /# 我用 AI 拆了一张商业视觉图/);
assert.match(markdown, /- 应用：PromptLens/);
assert.match(markdown, /- 模板：视觉营销诊断/);
assert.match(markdown, /## 业务背景/);
assert.match(markdown, /未提供业务背景；以下诊断仅基于图片可见内容生成。/);
assert.match(markdown, /## 1\. 老板先看：这张图在卖什么/);
assert.match(markdown, /## 5\. 中小企业怎么低成本借鉴/);
assert.match(markdown, /## 7\. 可以延展成哪些内容角度/);
assert.match(markdown, /敏感肌安心使用/);
assert.match(markdown, /## 8\. 下一张图可以测试什么/);
assert.match(markdown, /借鉴暖色生活方式产品图/);
assert.match(markdown, /仅用于营销创意和视觉表达参考/);

assert.equal(normalizeSafeMarketingText('请完全复刻并 copy exactly'), '请参考视觉结构并 adapt safely');
assert.doesNotThrow(() => validateMarketingDiagnosisResult(result));
assert.throws(
  () => validateMarketingDiagnosisResult({ ...result, marketing_diagnosis: {} }),
  /business_snapshot/
);
assert.throws(
  () => validateMarketingDiagnosisResult({
    ...result,
    marketing_diagnosis: {
      ...result.marketing_diagnosis,
      marketing_diagnosis: {
        ...result.marketing_diagnosis.marketing_diagnosis,
        marketing_readiness_score: { overall: 9 }
      }
    }
  }),
  /overall 必须是 1-5/
);

console.log('marketing diagnosis tests passed');
