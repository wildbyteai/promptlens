const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const catalogs = {
  'zh-CN': JSON.parse(fs.readFileSync(path.join(root, '_locales/zh_CN/messages.json'), 'utf8')),
  en: JSON.parse(fs.readFileSync(path.join(root, '_locales/en/messages.json'), 'utf8'))
};
globalThis.chrome = {
  storage: {
    local: { get: async defaults => defaults, set: async () => {} },
    onChanged: { addListener: () => {} }
  }
};

const i18n = require('../i18n.js');
const fixture = {
  marketing_diagnosis: {
    business_snapshot: {
      business_summary: 'Premium skincare positioning.',
      target_customer: 'Quality-conscious customers.',
      core_offer: 'A calm daily ritual.',
      conversion_hook: 'Warm light and product focus.',
      quick_judgement: 'Strong mood, weak action cue.'
    },
    marketing_diagnosis: {
      visual_strategy: 'Warm lifestyle framing.',
      trust_signals: 'Clean packaging.',
      emotional_driver: 'Calm and confidence.',
      friction_points: 'No clear CTA.',
      marketing_readiness_score: {
        overall: 4,
        summary: 'Good foundation.',
        dimensions: { attention: 4, clarity: 3, trust: 4, differentiation: 3, actionability: 4 }
      }
    },
    next_actions: {
      improvement_suggestions: ['Add a clear CTA.'],
      ai_adaptation_brief: 'Adapt the warm visual strategy.',
      designer_execution_brief: 'Keep the warm light and add a headline.',
      content_angles: ['Morning routine'],
      next_tests: ['Test a stronger CTA']
    },
    disclaimer: 'Keep this model-generated disclaimer unchanged.'
  }
};

(async () => {
  await i18n.init({ catalogs, language: 'zh-CN', persist: false, watch: false });
  const marketing = require('../marketing-diagnosis.js');
  assert.deepEqual(marketing.MARKETING_DIMENSION_ORDER, ['attention', 'clarity', 'trust', 'differentiation', 'actionability']);
  assert.deepEqual(marketing.getMarketingDiagnosisSections(fixture).map(section => section.title), ['老板先看', '营销诊断', '下一步怎么做']);
  let markdown = marketing.buildMarketingDiagnosisMarkdown(fixture);
  assert.match(markdown, /^# 我用 AI 拆了一张商业视觉图/);
  assert.match(markdown, /注意力：4\/5/);
  assert.match(markdown, /行动引导：4\/5/);
  assert.match(markdown, /Keep this model-generated disclaimer unchanged\./);

  await i18n.setLanguage('en', { persist: false });
  assert.deepEqual(marketing.getMarketingDiagnosisSections(fixture).map(section => section.title), ['Owner summary', 'Marketing diagnosis', 'What to do next']);
  markdown = marketing.buildMarketingDiagnosisMarkdown(fixture, { templateName: 'Visual marketing diagnosis' });
  assert.match(markdown, /^# I used AI to break down a commercial visual/);
  assert.match(markdown, /## 1\. Owner summary: what is this image selling\?/);
  assert.match(markdown, /Attention: 4\/5/);
  assert.match(markdown, /Actionability: 4\/5/);
  assert.match(markdown, /Keep this model-generated disclaimer unchanged\./);
  assert.match(markdown, /## Disclaimer/);

  console.log('marketing diagnosis language tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
