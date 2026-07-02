const assert = require('node:assert/strict');

const {
  VARIANT_ORDER,
  normalizePromptVariants,
  formatPromptVariantCard,
  formatPromptVariantsMarkdown
} = require('../prompt-variants.js');

assert.deepEqual(VARIANT_ORDER, ['recreate', 'creative', 'commercial']);

const completeResult = {
  prompt_en: 'A general image generation prompt',
  prompt_variants: [
    {
      id: 'commercial',
      title: 'Commercial custom title',
      intent: 'Commercial visual direction',
      prompt_en: 'Commercial campaign prompt',
      prompt_zh_summary: '商业视觉摘要',
      tags: [' campaign ', 'product', 123, ''],
      negative_prompt: 'low quality',
      use_cases: ['poster', 'landing page']
    },
    {
      id: 'recreate',
      prompt_en: 'Recreate the reference image',
      prompt_zh_summary: '复刻参考图',
      tags: ['recreation', 'lighting'],
      negative_prompt: 'blur',
      use_cases: ['style study']
    },
    {
      id: 'creative',
      prompt_en: 'Creative visual extension',
      prompt_zh_summary: '创意延展方向',
      tags: ['concept art'],
      negative_prompt: 'flat composition',
      use_cases: ['moodboard']
    }
  ]
};

const normalized = normalizePromptVariants(completeResult);
assert.equal(normalized.length, 3);
assert.deepEqual(normalized.map(variant => variant.id), ['recreate', 'creative', 'commercial']);
assert.equal(normalized[0].title, '复刻版');
assert.equal(normalized[0].intent, '尽量还原参考图的主体、构图、风格、光影和材质');
assert.equal(normalized[0].prompt_en, 'Recreate the reference image');
assert.deepEqual(normalized[2].tags, ['campaign', 'product']);
assert.equal(normalized[2].title, 'Commercial custom title');
assert.equal(normalized[2].isComplete, true);

assert.deepEqual(normalizePromptVariants({ prompt_variants: null }), []);
assert.deepEqual(normalizePromptVariants({ prompt_variants: { recreate: 'bad shape' } }), []);

const partial = normalizePromptVariants({
  prompt_en: 'Fallback main prompt',
  prompt_variants: [
    { id: 'midjourney', prompt_en: 'Unknown id prompt' },
    { id: 'recreate', prompt_en: '   ' },
    { id: 'recreate', prompt_en: 'Second recreate should be ignored' },
    { id: 'creative', prompt_en: 'Creative only', tags: 'not an array', use_cases: null, negative_prompt: ['bad'] }
  ]
});
assert.equal(partial.length, 2);
assert.deepEqual(partial.map(variant => variant.id), ['recreate', 'creative']);
assert.equal(partial[0].prompt_en, 'Fallback main prompt');
assert.equal(partial[0].isComplete, true);
assert.deepEqual(partial[1].tags, []);
assert.deepEqual(partial[1].use_cases, []);
assert.equal(partial[1].negative_prompt, '');

const incompleteWithoutFallback = normalizePromptVariants({
  prompt_variants: [
    { id: 'commercial', prompt_en: '' }
  ]
});
assert.equal(incompleteWithoutFallback.length, 1);
assert.equal(incompleteWithoutFallback[0].isComplete, false);
assert.equal(incompleteWithoutFallback[0].prompt_en, '');

const cardText = formatPromptVariantCard(normalized[0]);
assert.match(cardText, /^复刻版\n/);
assert.match(cardText, /说明\n复刻参考图/);
assert.match(cardText, /Prompt\nRecreate the reference image/);
assert.match(cardText, /Tags\nrecreation, lighting/);
assert.match(cardText, /Negative Prompt\nblur/);
assert.match(cardText, /适用场景\nstyle study/);

const markdown = formatPromptVariantsMarkdown(normalized);
assert.match(markdown, /^## 专业用途 Prompt 候选/);
assert.match(markdown, /### 复刻版/);
assert.match(markdown, /\*\*Prompt：\*\*\n\nRecreate the reference image/);
assert.match(markdown, /### 创意延展版/);
assert.match(markdown, /### Commercial custom title/);
assert.equal(formatPromptVariantsMarkdown([]), '');

const specialMarkdown = formatPromptVariantsMarkdown(normalizePromptVariants({
  prompt_variants: [
    {
      id: 'recreate',
      prompt_en: 'Line one\nLine two with **markdown** and "quotes"',
      prompt_zh_summary: '包含 Markdown 符号',
      tags: ['tag:one', 'tag-two'],
      negative_prompt: 'bad: anatomy',
      use_cases: ['A/B test']
    }
  ]
}));
assert.match(specialMarkdown, /Line one\nLine two with \*\*markdown\*\*/);
assert.match(specialMarkdown, /tag:one, tag-two/);

console.log('prompt variants tests passed');
