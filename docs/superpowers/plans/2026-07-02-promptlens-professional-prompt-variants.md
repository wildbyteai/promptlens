# PromptLens Professional Prompt Variants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 PromptLens 结果页新增 3 张面向专业设计人员的只读 Prompt 候选卡片，并保持旧结果、历史记录、复制和导出兼容。

**Architecture:** 新增一个独立的 `prompt-variants.js` 作为 `prompt_variants` 规范化和格式化边界，`result.js` 与 `history-format.js` 只消费该模块的稳定接口。`templates.js` 只负责固定 JSON schema suffix 和模型输出要求；结果页、历史页、Markdown 导出和 Copy Card 共用同一套 formatter，避免多处格式分叉。

**Tech Stack:** Chrome MV3、Vanilla JavaScript、DOM API、IndexedDB、Node.js `node:assert/strict` 测试；不使用 npm 依赖、不引入构建步骤。

## Global Constraints

- 不新增后端。
- 不新增浏览器权限。
- 不引入构建工具或 npm 依赖。
- 不新增账号、支付、云同步、团队协作或遥测。
- `prompt_variants` 是增强字段，不改变 `prompt_zh`、`prompt_en`、`prompt_tags`、`negative_prompt`、`json_prompt` 的旧字段语义。
- `prompt_en` 继续作为兼容旧 UI、旧复制、旧导出和历史摘要的默认主 prompt，语义保持为“通用主 prompt”。
- UI 固定按 `recreate`、`creative`、`commercial` 顺序展示，不依赖模型返回顺序。
- 所有用户文本和模型返回内容必须用 `textContent` 或安全文本赋值渲染，不使用 `innerHTML` 注入模型文本。
- JSON 导出包含原始完整结果对象；Markdown 导出只在存在合法 variants 时输出专业候选章节。
- 旧历史记录无需迁移；无 `prompt_variants` 时按旧 UI 正常展示。
- README / SECURITY 需要同步说明本地历史保存 variants 文本的隐私边界。

---

## File Structure

- Create: `prompt-variants.js`
  - 单一职责：规范化 `prompt_variants`、格式化 Copy Card、格式化 Markdown 专业候选章节、提供默认文案和固定排序。
  - 浏览器端导出为 `window.PromptVariants`，Node 测试端导出为 `module.exports`。

- Create: `tests/prompt-variants.test.js`
  - 覆盖完整 variants、旧结果缺失 variants、数量不足、字段缺失、类型错误、未知 id、重复 id、Markdown 特殊字符、Copy Card 输出。

- Modify: `templates.js:9-34, 43-101`
  - 扩展固定 JSON schema suffix，要求模型输出受控 `prompt_variants` 字段。
  - 调整内置模板 instruction，使其强调专业设计人员、三种用途、自然语言优先、禁止平台专属参数。

- Modify: `result.html:83-120, 150-152`
  - 在主 English Prompt 之后新增专业候选卡片容器。
  - 在 `history-store.js` 前引入 `prompt-variants.js`，保证 `result.js` 可使用 `window.PromptVariants`。

- Modify: `result.js:69-205, 214-237, 258-313, 805-810`
  - 增加 DOM refs。
  - 在渲染结果时规范化并展示 variants。
  - 实现 Copy Prompt / Copy Card。
  - Markdown 导出追加专业候选章节。
  - 保存历史前不改写原始 result；渲染使用规范化结果。

- Modify: `history.html:33-35`
  - 在 `history-format.js` 前引入 `prompt-variants.js`。

- Modify: `history-format.js:9-63`
  - 在历史展示字段中追加专业候选 sections。
  - `buildHistoryCopyText()` 复用 `PromptVariants.formatPromptVariantsMarkdown()` 输出专业候选文本。

- Modify: `history.js:90-104`
  - 支持 history field 的 `kind: 'variant-card'` 样式类，不改变旧字段渲染逻辑。

- Modify: `styles.css:725-839`
  - 为专业候选区块、卡片、tags、适用场景和按钮增加样式。

- Modify: `tests/history-format.test.js:1-57`
  - 更新历史复制和字段展示测试，覆盖 variants。

- Modify: `README.md:26-40, 129-140`
  - 新增专业用途 Prompt 候选卡片功能说明。
  - 更新隐私说明，明确历史开启后 variants 文本会本地保存。

- Modify: `SECURITY.md:30-39, 71-77`
  - 更新数据处理边界和安全建议，说明文本化推断可能包含敏感图像信息。

---

### Task 1: 新增 `prompt_variants` 规范化与格式化模块

**Files:**
- Create: `prompt-variants.js`
- Create: `tests/prompt-variants.test.js`

**Interfaces:**
- Produces: `PromptVariants.normalizePromptVariants(result: object): Array<PromptVariant>`
- Produces: `PromptVariants.formatPromptVariantCard(variant: PromptVariant): string`
- Produces: `PromptVariants.formatPromptVariantsMarkdown(variants: Array<PromptVariant>): string`
- Produces: `PromptVariants.VARIANT_ORDER: ['recreate', 'creative', 'commercial']`
- Produces: `PromptVariant` shape:
  - `id: 'recreate' | 'creative' | 'commercial'`
  - `title: string`
  - `intent: string`
  - `prompt_en: string`
  - `prompt_zh_summary: string`
  - `tags: string[]`
  - `negative_prompt: string`
  - `use_cases: string[]`
  - `isComplete: boolean`

- [ ] **Step 1: Write the failing tests for normalization and formatting**

Create `tests/prompt-variants.test.js` with this complete content:

```js
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
```

- [ ] **Step 2: Run the new test to verify it fails because the module does not exist**

Run:

```bash
node tests/prompt-variants.test.js
```

Expected: FAIL with an error containing `Cannot find module '../prompt-variants.js'`.

- [ ] **Step 3: Create the minimal complete module**

Create `prompt-variants.js` with this complete content:

```js
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
```

- [ ] **Step 4: Run the new module test to verify it passes**

Run:

```bash
node tests/prompt-variants.test.js
```

Expected: PASS with output `prompt variants tests passed`.

- [ ] **Step 5: Run the existing history format test to verify no regression**

Run:

```bash
node tests/history-format.test.js
```

Expected: PASS with output `history format tests passed`.

- [ ] **Step 6: Commit Task 1**

Run:

```bash
git add prompt-variants.js tests/prompt-variants.test.js
git commit -m "feat: add prompt variant formatter"
```

Expected: commit succeeds and includes only `prompt-variants.js` and `tests/prompt-variants.test.js`.

---

### Task 2: 更新模型输出 schema 与模板说明

**Files:**
- Modify: `templates.js:9-34`
- Modify: `templates.js:43-101`

**Interfaces:**
- Consumes: Task 1 variant ids `recreate`, `creative`, `commercial`.
- Produces: `PromptTemplates.buildFinalPrompt(template)` continues returning a string that appends the fixed JSON schema suffix after any built-in or custom template instruction.

- [ ] **Step 1: Write a failing schema prompt test**

Create `tests/templates-schema.test.js` with this complete content:

```js
const assert = require('node:assert/strict');

globalThis.chrome = {
  storage: {
    local: {
      get: async defaults => defaults,
      set: async () => {}
    }
  }
};

require('../templates.js');

const template = {
  id: 'custom-test',
  instruction: 'Custom instruction that asks for a compact result.'
};
const finalPrompt = globalThis.PromptTemplates.buildFinalPrompt(template);

assert.match(finalPrompt, /Custom instruction that asks for a compact result\./);
assert.match(finalPrompt, /Return exactly this JSON shape:/);
assert.match(finalPrompt, /"prompt_variants": \[/);
assert.match(finalPrompt, /"id": "recreate"/);
assert.match(finalPrompt, /"id": "creative"/);
assert.match(finalPrompt, /"id": "commercial"/);
assert.match(finalPrompt, /Do not add platform-specific flags/);
assert.match(finalPrompt, /The fixed JSON shape is mandatory/);
assert.ok(finalPrompt.indexOf('Custom instruction') < finalPrompt.indexOf('Return valid JSON only'));

const builtIns = globalThis.PromptTemplates.listBuiltInTemplates();
assert.ok(builtIns.every(template => /professional|designer|image-generation/i.test(template.instruction)));

console.log('template schema tests passed');
```

- [ ] **Step 2: Run the new schema prompt test to verify it fails**

Run:

```bash
node tests/templates-schema.test.js
```

Expected: FAIL with an assertion mentioning `"prompt_variants": \[` or `The fixed JSON shape is mandatory`.

- [ ] **Step 3: Replace the JSON schema suffix in `templates.js`**

In `templates.js`, replace the current `JSON_SCHEMA_SUFFIX` definition at `templates.js:9-34` with this complete block:

```js
  const JSON_SCHEMA_SUFFIX = [
    'Return valid JSON only. Do not use markdown fences. Do not include analysis outside the JSON.',
    'The fixed JSON shape is mandatory. Template instructions may change writing style, but must not change field names, field types, root shape, or required fields.',
    'All visible-detail claims must be based on the image. If uncertain, use broader visually useful wording instead of guessing.',
    'Do not invent brands, logos, named artists, exact camera bodies, lens models, exact locations, hidden objects, identities, or unreadable text.',
    'Do not add platform-specific flags, version switches, seed values, LoRA syntax, workflow node names, or official-sounding platform parameters.',
    'Write for professional designers who need practical image-generation prompts, not generic captions.',
    'Return exactly this JSON shape:',
    '{',
    '  "prompt_zh": "简体中文反向提示词，完整描述主体、动作姿态、外观细节、环境背景、构图、光线氛围、风格、色彩、材质和画面质感。",',
    '  "prompt_en": "English general reverse prompt optimized for recreating the image, not merely describing it.",',
    '  "prompt_tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"],',
    '  "negative_prompt": "English negative prompt tailored to avoid likely generation errors.",',
    '  "json_prompt": {',
    '    "subject": "main subject and visible identity-neutral attributes",',
    '    "action_pose": "pose, gesture, motion, or stillness",',
    '    "details_appearance": "clothing, expression, shape, surface details, accessories, visible design features",',
    '    "environment_background": "setting, background elements, depth, context",',
    '    "lighting_atmosphere": "light source, contrast, shadows, mood, time-of-day impression if visually supported",',
    '    "composition_framing": "camera distance, angle, crop, perspective, subject placement, aspect ratio impression",',
    '    "style_camera": "visual medium, rendering style, photographic or illustrative qualities, lens/framing feel without inventing exact gear",',
    '    "colors": ["dominant color", "accent color"],',
    '    "materials_textures": ["visible material or texture"],',
    '    "aspect_ratio": "best estimate such as 1:1, 4:3, 3:4, 16:9, 9:16, or unknown",',
    '    "quality_modifiers": "useful generation modifiers based on visible quality, detail level, sharpness, finish",',
    '    "likely_generation_intent": "brief description of what the original prompt likely aimed to produce"',
    '  },',
    '  "prompt_variants": [',
    '    {',
    '      "id": "recreate",',
    '      "title": "复刻版",',
    '      "intent": "尽量还原参考图的主体、构图、风格、光影和材质",',
    '      "prompt_en": "English final prompt for faithfully recreating the visible reference image.",',
    '      "prompt_zh_summary": "简短说明这个版本如何复刻参考图。",',
    '      "tags": ["recreation", "composition", "lighting"],',
    '      "negative_prompt": "English negative prompt for this version.",',
    '      "use_cases": ["style study", "client reference recreation"]',
    '    },',
    '    {',
    '      "id": "creative",',
    '      "title": "创意延展版",',
    '      "intent": "保留核心视觉基因，探索新的视觉方向",',
    '      "prompt_en": "English final prompt that extends the reference into a fresh creative direction.",',
    '      "prompt_zh_summary": "简短说明这个版本的创意延展方向。",',
    '      "tags": ["creative direction", "moodboard", "visual exploration"],',
    '      "negative_prompt": "English negative prompt for this version.",',
    '      "use_cases": ["concept exploration", "moodboard expansion"]',
    '    },',
    '    {',
    '      "id": "commercial",',
    '      "title": "商业强化版",',
    '      "intent": "面向广告、产品图、海报和品牌视觉方向的 prompt 改写建议",',
    '      "prompt_en": "English final prompt adapted for campaign, product, poster, or brand visual use without promising commercial performance.",',
    '      "prompt_zh_summary": "简短说明这个版本的商业视觉强化方向。",',
    '      "tags": ["commercial visual", "brand", "campaign"],',
    '      "negative_prompt": "English negative prompt for this version.",',
    '      "use_cases": ["advertising visual", "product poster", "brand presentation"]',
    '    }',
    '  ]',
    '}',
    'prompt_variants must be an array with the three fixed ids recreate, creative, and commercial. Keep those ids exactly. The three variants must be meaningfully different in intent and wording.'
  ].join('\n');
```

- [ ] **Step 4: Update built-in template instructions**

In `templates.js`, edit each built-in `instruction` array so it includes professional-designer wording. Use these exact additional lines inside each template instruction array before the existing prompt length requirements:

For `detailed` after `Analyze only visible evidence...`:

```js
        'Write for professional designers using image-generation tools. The result should be practical production prompt material rather than a generic caption.',
        'The three prompt_variants should cover faithful recreation, creative extension, and commercial visual adaptation.'
```

For `natural` after `Prioritize subject...`:

```js
        'Write for professional designers using natural-language image-generation tools.',
        'The three prompt_variants should remain natural-language prompts and must not include platform-specific flags.'
```

For `tags` after `Reconstruct the image...`:

```js
        'Write for professional designers who may reuse tags, negative prompts, or structured components in Stable Diffusion, Flux, ComfyUI, or similar workflows.',
        'The three prompt_variants should still include fluent prompt_en values, with tags as supporting material rather than the only output.'
```

For `concise` after `Reconstruct the visible image...`:

```js
        'Write for professional designers who need a fast, copyable starting point.',
        'The three prompt_variants may be shorter than the detailed template, but each must remain complete enough to copy into an image-generation tool.'
```

- [ ] **Step 5: Run schema and syntax checks**

Run:

```bash
node tests/templates-schema.test.js
node --check templates.js
```

Expected: both pass; first prints `template schema tests passed`, second exits with no output.

- [ ] **Step 6: Commit Task 2**

Run:

```bash
git add templates.js tests/templates-schema.test.js
git commit -m "feat: request professional prompt variants"
```

Expected: commit succeeds and includes only `templates.js` and `tests/templates-schema.test.js`.

---

### Task 3: 在结果页渲染专业候选卡片并更新复制与导出

**Files:**
- Modify: `result.html:83-120, 150-152`
- Modify: `result.js:69-205, 214-237, 258-313, 805-810`
- Modify: `styles.css:725-839`

**Interfaces:**
- Consumes: `window.PromptVariants.normalizePromptVariants(result)` from Task 1.
- Consumes: `window.PromptVariants.formatPromptVariantCard(variant)` from Task 1.
- Consumes: `window.PromptVariants.formatPromptVariantsMarkdown(variants)` from Task 1.
- Produces: DOM container `#prompt-variants-card` and `#prompt-variants-list`.
- Produces: `renderPromptVariants(result: object): PromptVariant[]` inside `result.js`.

- [ ] **Step 1: Add the script tag and result page container**

In `result.html`, insert this block immediately after the main English Prompt article ending at `result.html:92`:

```html
          <article id="prompt-variants-card" class="result-card prompt-variants-card" hidden>
            <div class="card-title-row">
              <div>
                <span class="card-kicker">Professional variants</span>
                <h2>专业用途 Prompt 候选</h2>
              </div>
              <p class="variant-card-hint">三种方向只读展示，可直接复制到图像生成工具中试跑。</p>
            </div>
            <div id="prompt-variants-list" class="prompt-variants-list"></div>
          </article>
```

In `result.html`, insert the new script before `history-store.js`:

```html
    <script src="templates.js"></script>
    <script src="prompt-variants.js"></script>
    <script src="history-store.js"></script>
    <script src="result.js"></script>
```

- [ ] **Step 2: Add DOM refs and render helpers in `result.js`**

In the `elements` object at `result.js:69-87`, add these properties after `promptEn`:

```js
  promptVariantsCard: document.getElementById('prompt-variants-card'),
  promptVariantsList: document.getElementById('prompt-variants-list'),
```

After `renderUsage()` and before `renderResult()`, insert this complete helper block:

```js
function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text || '';
  return element;
}

async function copyTextWithFeedback(button, text) {
  const oldText = button.textContent;
  try {
    await navigator.clipboard.writeText(text || '');
    button.textContent = '已复制';
  } catch {
    button.textContent = '复制失败';
  }
  window.setTimeout(() => {
    button.textContent = oldText;
  }, 1200);
}

function renderPromptVariants(result) {
  const variants = window.PromptVariants.normalizePromptVariants(result);
  elements.promptVariantsList.replaceChildren();

  const visibleVariants = variants.filter(variant => variant && variant.isComplete);
  if (!visibleVariants.length) {
    elements.promptVariantsCard.hidden = true;
    return variants;
  }

  visibleVariants.forEach(variant => {
    const card = document.createElement('section');
    card.className = `prompt-variant prompt-variant--${variant.id}`;

    const header = document.createElement('div');
    header.className = 'prompt-variant-header';

    const titleBox = document.createElement('div');
    titleBox.append(
      createTextElement('h3', '', variant.title),
      createTextElement('p', 'prompt-variant-intent', variant.prompt_zh_summary || variant.intent)
    );

    const actions = document.createElement('div');
    actions.className = 'button-row';

    const copyPromptButton = document.createElement('button');
    copyPromptButton.type = 'button';
    copyPromptButton.className = 'copy-button';
    copyPromptButton.textContent = 'Copy Prompt';
    copyPromptButton.addEventListener('click', () => copyTextWithFeedback(copyPromptButton, variant.prompt_en));

    const copyCardButton = document.createElement('button');
    copyCardButton.type = 'button';
    copyCardButton.className = 'copy-button';
    copyCardButton.textContent = 'Copy Card';
    copyCardButton.addEventListener('click', () => {
      copyTextWithFeedback(copyCardButton, window.PromptVariants.formatPromptVariantCard(variant));
    });

    actions.append(copyPromptButton, copyCardButton);
    header.append(titleBox, actions);

    const prompt = createTextElement('pre', 'prompt-variant-prompt', variant.prompt_en);

    const meta = document.createElement('dl');
    meta.className = 'prompt-variant-meta';

    const metaRows = [
      ['Tags', variant.tags.join(', ')],
      ['Negative Prompt', variant.negative_prompt],
      ['适用场景', variant.use_cases.join(', ')]
    ];

    metaRows.forEach(([labelText, valueText]) => {
      if (!valueText) return;
      const row = document.createElement('div');
      row.append(createTextElement('dt', '', labelText), createTextElement('dd', '', valueText));
      meta.appendChild(row);
    });

    card.append(header, prompt, meta);
    elements.promptVariantsList.appendChild(card);
  });

  elements.promptVariantsCard.hidden = false;
  return variants;
}
```

- [ ] **Step 3: Call the render helper from `renderResult()`**

In `renderResult(result, rawText, template)`, insert this line after `setText('prompt-en', result.prompt_en || '');`:

```js
  renderPromptVariants(result);
```

The surrounding block should read:

```js
  setText('prompt-zh', result.prompt_zh || '');
  setText('prompt-en', result.prompt_en || '');
  renderPromptVariants(result);
  setText('prompt-tags', Array.isArray(result.prompt_tags) ? result.prompt_tags.join(', ') : '');
```

- [ ] **Step 4: Reuse the generic copy feedback helper**

In `setupCopyButtons()`, replace the manual try/catch block inside the click handler with this exact call:

```js
      await copyTextWithFeedback(button, text || '');
```

The handler body after `const text = target ? target.textContent : '';` should be:

```js
      await copyTextWithFeedback(button, text || '');
```

- [ ] **Step 5: Append variants to Markdown export and Copy All**

In `buildMarkdownExport()`, replace the current `return [...]` block with this complete implementation:

```js
  const variants = window.PromptVariants.normalizePromptVariants(result);
  const variantsMarkdown = window.PromptVariants.formatPromptVariantsMarkdown(variants);
  const sections = [
    '# Image Prompt Analysis Result',
    '',
    `- App: ${data.app}`,
    `- Exported At: ${data.exportedAt}`,
    `- Template: ${data.template ? data.template.name : 'Unknown'}`,
    '',
    '## English Prompt',
    '',
    result.prompt_en || '',
    '',
    '## 中文提示词',
    '',
    result.prompt_zh || '',
    '',
    '## Tags',
    '',
    tags,
    '',
    '## Negative Prompt',
    '',
    result.negative_prompt || '',
    '',
    '## JSON Prompt',
    '',
    '```json',
    JSON.stringify(result.json_prompt || {}, null, 2),
    '```',
    ''
  ];
  if (variantsMarkdown) {
    sections.push(variantsMarkdown, '');
  }
  return sections.join('\n');
```

In `buildCopyAllText()`, replace the current `return [...]` block with this complete implementation:

```js
  const variants = window.PromptVariants.normalizePromptVariants(result);
  const variantsMarkdown = window.PromptVariants.formatPromptVariantsMarkdown(variants);
  const sections = [
    'English Prompt',
    result.prompt_en || '',
    '',
    '中文提示词',
    result.prompt_zh || '',
    '',
    'Tags',
    tags,
    '',
    'Negative Prompt',
    result.negative_prompt || '',
    '',
    'JSON Prompt',
    JSON.stringify(result.json_prompt || {}, null, 2)
  ];
  if (variantsMarkdown) {
    sections.push('', variantsMarkdown);
  }
  return sections.join('\n');
```

- [ ] **Step 6: Add result page styles**

Append this block after the existing copy button styles around `styles.css:839`:

```css
.prompt-variants-card {
  display: grid;
  gap: 14px;
}

.variant-card-hint {
  max-width: 300px;
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
  text-align: right;
}

.prompt-variants-list {
  display: grid;
  gap: 12px;
}

.prompt-variant {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #fbfaf7;
}

.prompt-variant-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.prompt-variant h3 {
  margin: 0;
  font-size: 15px;
  letter-spacing: -0.02em;
}

.prompt-variant-intent {
  margin: 5px 0 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.prompt-variant-prompt {
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}

.prompt-variant-meta {
  display: grid;
  gap: 8px;
  margin: 0;
}

.prompt-variant-meta div {
  display: grid;
  gap: 3px;
}

.prompt-variant-meta dt {
  color: var(--faint);
  font-size: 11px;
  font-weight: 760;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.prompt-variant-meta dd {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}
```

- [ ] **Step 7: Run syntax checks**

Run:

```bash
node --check result.js
```

Expected: exits with no output.

- [ ] **Step 8: Manually verify the result page with a fixture in DevTools**

Open `result.html` as part of the extension flow, then in DevTools Console run this fixture after the page loads:

```js
renderResult({
  prompt_zh: '一张专业产品海报风格的香水瓶图像。',
  prompt_en: 'A refined perfume bottle product image with soft studio lighting and elegant composition.',
  prompt_tags: ['perfume', 'product photography', 'soft lighting'],
  negative_prompt: 'low quality, blurry, distorted bottle',
  json_prompt: { subject: 'perfume bottle' },
  prompt_variants: [
    {
      id: 'recreate',
      prompt_en: 'A faithful recreation of the perfume bottle image, centered composition, soft studio lighting, glossy glass material, elegant beige background.',
      prompt_zh_summary: '忠实复刻香水瓶主体、光影和材质。',
      tags: ['recreation', 'product photography'],
      negative_prompt: 'blurry, warped glass, bad reflections',
      use_cases: ['style study']
    },
    {
      id: 'creative',
      prompt_en: 'A creative extension of the perfume bottle into a dreamy editorial still life with floating petals and refined warm lighting.',
      prompt_zh_summary: '保留香水瓶核心视觉，加入梦幻编辑视觉。',
      tags: ['editorial', 'dreamy'],
      negative_prompt: 'cluttered, harsh light',
      use_cases: ['moodboard']
    },
    {
      id: 'commercial',
      prompt_en: 'A commercial fragrance campaign visual featuring the perfume bottle, premium brand presentation, clean poster composition, soft highlights.',
      prompt_zh_summary: '强化为香氛品牌广告视觉。',
      tags: ['campaign', 'brand visual'],
      negative_prompt: 'cheap packaging, noisy background',
      use_cases: ['product poster']
    }
  ]
}, '', { name: '详细分析', description: '测试模板' });
```

Expected: The page shows the main English prompt plus three professional variant cards. Each visible card has `Copy Prompt` and `Copy Card` buttons.

- [ ] **Step 9: Commit Task 3**

Run:

```bash
git add result.html result.js styles.css
git commit -m "feat: render professional prompt variants"
```

Expected: commit succeeds and includes only `result.html`, `result.js`, and `styles.css`.

---

### Task 4: 在历史记录中展示、复制和兼容 variants

**Files:**
- Modify: `history.html:33-35`
- Modify: `history-format.js:9-63`
- Modify: `history.js:90-104`
- Modify: `tests/history-format.test.js:1-57`

**Interfaces:**
- Consumes: `PromptVariants.normalizePromptVariants(result)` from Task 1.
- Consumes: `PromptVariants.formatPromptVariantsMarkdown(variants)` from Task 1.
- Produces: `getHistoryDisplayFields(item)` can include `{ key: 'promptVariants', label: '专业用途 Prompt 候选', value: string, kind: 'variant-card' }` when variants exist.
- Produces: `buildHistoryCopyText(item)` includes the same professional variants section as Markdown export.

- [ ] **Step 1: Update history format tests first**

Replace `tests/history-format.test.js` with this complete content:

```js
const assert = require('node:assert/strict');

globalThis.PromptVariants = require('../prompt-variants.js');

const { buildHistoryCopyText, getHistoryDisplayFields } = require('../history-format.js');

const item = {
  sourceDomain: 'example.com',
  inputType: 'selection',
  templateName: '详细分析',
  promptEn: 'A cinematic cat portrait',
  promptTags: ['cat', 'cinematic', 'soft light'],
  result: {
    prompt_zh: '一张电影感猫咪肖像',
    prompt_en: 'A cinematic cat portrait from result',
    prompt_tags: ['cat', 'cinematic', 'soft light'],
    negative_prompt: 'blurry, low quality',
    json_prompt: {
      subject: 'cat',
      lighting: 'soft light'
    },
    prompt_variants: [
      {
        id: 'recreate',
        prompt_en: 'Faithfully recreate the cinematic cat portrait.',
        prompt_zh_summary: '复刻猫咪肖像的电影感构图。',
        tags: ['cat', 'recreation'],
        negative_prompt: 'blurred fur',
        use_cases: ['style study']
      },
      {
        id: 'creative',
        prompt_en: 'Extend the cat portrait into a dreamy editorial concept.',
        prompt_zh_summary: '延展为梦幻编辑视觉。',
        tags: ['editorial'],
        negative_prompt: 'flat lighting',
        use_cases: ['moodboard']
      }
    ]
  },
  rawText: '{"prompt_en":"A cinematic cat portrait from result"}'
};

const fields = getHistoryDisplayFields(item);
assert.deepEqual(fields.map(field => field.label), [
  'English Prompt',
  '中文提示词',
  'Tags',
  'Negative Prompt',
  'JSON Prompt',
  '专业用途 Prompt 候选',
  'Raw JSON'
]);
assert.equal(fields[0].value, 'A cinematic cat portrait');
assert.equal(fields[1].value, '一张电影感猫咪肖像');
assert.equal(fields[2].value, 'cat, cinematic, soft light');
assert.equal(fields[3].value, 'blurry, low quality');
assert.equal(fields[4].value, JSON.stringify(item.result.json_prompt, null, 2));
assert.match(fields[5].value, /## 专业用途 Prompt 候选/);
assert.match(fields[5].value, /### 复刻版/);
assert.match(fields[5].value, /Faithfully recreate the cinematic cat portrait/);
assert.equal(fields[5].kind, 'variant-card');
assert.equal(fields[6].value, item.rawText);

const copyText = buildHistoryCopyText(item);
assert.match(copyText, /Source: example\.com/);
assert.match(copyText, /Input Type: selection/);
assert.match(copyText, /Template: 详细分析/);
assert.match(copyText, /English Prompt\nA cinematic cat portrait/);
assert.match(copyText, /中文提示词\n一张电影感猫咪肖像/);
assert.match(copyText, /Tags\ncat, cinematic, soft light/);
assert.match(copyText, /Negative Prompt\nblurry, low quality/);
assert.match(copyText, /JSON Prompt\n\{\n  "subject": "cat",\n  "lighting": "soft light"\n\}/);
assert.match(copyText, /专业用途 Prompt 候选/);
assert.match(copyText, /Extend the cat portrait into a dreamy editorial concept/);

const legacyItem = {
  promptEn: 'Legacy English prompt',
  promptTags: ['legacy']
};
const legacyFields = getHistoryDisplayFields(legacyItem);
assert.equal(legacyFields[0].value, 'Legacy English prompt');
assert.equal(legacyFields[2].value, 'legacy');
assert.equal(legacyFields.some(field => field.key === 'promptVariants'), false);

console.log('history format tests passed');
```

- [ ] **Step 2: Run history test to verify it fails before implementation**

Run:

```bash
node tests/history-format.test.js
```

Expected: FAIL because `getHistoryDisplayFields()` does not include `专业用途 Prompt 候选`.

- [ ] **Step 3: Load `prompt-variants.js` on the history page**

In `history.html`, update the scripts at the end to this exact order:

```html
    <script src="history-store.js"></script>
    <script src="prompt-variants.js"></script>
    <script src="history-format.js"></script>
    <script src="history.js"></script>
```

- [ ] **Step 4: Update `history-format.js` to append variants**

Replace `history-format.js` with this complete content:

```js
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
```

- [ ] **Step 5: Keep history rendering safe and style-aware**

In `history.js`, replace this line inside field rendering:

```js
      section.className = `history-field history-field--${field.kind}`;
```

with this exact code:

```js
      section.className = `history-field history-field--${field.kind || 'text'}`;
```

This keeps old fields working and lets `variant-card` receive a specific CSS class.

- [ ] **Step 6: Add history variant styles**

Append this CSS block after `.prompt-variant-meta dd` from Task 3:

```css
.history-field--variant-card pre {
  max-height: 520px;
  padding: 13px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #fbfaf7;
}
```

- [ ] **Step 7: Run tests and syntax checks**

Run:

```bash
node tests/history-format.test.js
node tests/prompt-variants.test.js
node --check history-format.js
node --check history.js
```

Expected: tests print `history format tests passed` and `prompt variants tests passed`; syntax checks exit with no output.

- [ ] **Step 8: Commit Task 4**

Run:

```bash
git add history.html history-format.js history.js styles.css tests/history-format.test.js
git commit -m "feat: show prompt variants in history"
```

Expected: commit succeeds and includes only the listed files.

---

### Task 5: 更新 README 与 SECURITY 隐私说明

**Files:**
- Modify: `README.md:26-40, 129-140`
- Modify: `SECURITY.md:30-39, 71-77`

**Interfaces:**
- Consumes: Feature behavior from Tasks 1-4.
- Produces: User-facing documentation explaining professional variants, local history text storage, and third-party tool caveats.

- [ ] **Step 1: Update README feature list**

In `README.md`, add this bullet after the existing `Structured results` bullet:

```markdown
- **Professional prompt variants**: generates recreate, creative extension, and commercial visual prompt cards for professional design workflows.
```

- [ ] **Step 2: Update README privacy section**

In `README.md`, replace the local history bullet in the privacy section with this exact text:

```markdown
- Local history is off by default; when enabled, it stays in the browser and does not save image thumbnails. It may save generated prompt text, including professional prompt variants that describe visible people, brands, products, scenes, or commercial visual details inferred from the image.
```

Then add this paragraph after the provider privacy paragraph:

```markdown
Professional prompt variants are model-generated text suggestions, not official parameters or guaranteed best practices for any third-party generation platform. When you paste prompts into another tool, that tool's privacy, billing, copyright, and content policies apply.
```

- [ ] **Step 3: Update SECURITY data handling boundary**

In `SECURITY.md`, replace the history record bullet at `SECURITY.md:35` with this exact text:

```markdown
- **历史记录**：v0.3.0 起提供可选本地历史记录，默认关闭；开启后最多保存 200 条，只保存来源域名、模板信息、结果文本和结果 JSON，不保存图片缩略图或完整来源 URL。结果 JSON 可能包含专业用途 Prompt 候选文本，这些文本是对图片内容的进一步文本化推断，可能包含人物、品牌、商品、场景、屏幕内容、商业素材或第三方作品风格等信息。
```

- [ ] **Step 4: Update SECURITY recommendations**

In `SECURITY.md`, add this bullet after the existing sensitive image warning:

```markdown
- 如果开启本地历史记录，请注意生成的 prompt 文本本身也可能包含敏感、机密、受版权限制或未授权图片的可识别信息；使用后可在历史记录页删除单条记录或清空全部历史。
```

- [ ] **Step 5: Run a bounded documentation check**

Run:

```bash
python3 - <<'PY'
from pathlib import Path
for path in ['README.md', 'SECURITY.md']:
    text = Path(path).read_text(encoding='utf-8')
    assert 'professional prompt variants' in text.lower() or '专业用途 Prompt 候选' in text
    assert 'history' in text.lower() or '历史记录' in text
print('documentation checks passed')
PY
```

Expected: PASS with output `documentation checks passed`.

- [ ] **Step 6: Commit Task 5**

Run:

```bash
git add README.md SECURITY.md
git commit -m "docs: document professional prompt variants"
```

Expected: commit succeeds and includes only `README.md` and `SECURITY.md`.

---

### Task 6: Final integration verification

**Files:**
- No source edits expected.
- Verify: `background.js`, `content.js`, `templates.js`, `history-store.js`, `history-format.js`, `history.js`, `options.js`, `result.js`, `prompt-variants.js`
- Verify: `tests/prompt-variants.test.js`, `tests/templates-schema.test.js`, `tests/history-format.test.js`

**Interfaces:**
- Consumes: All interfaces from Tasks 1-5.
- Produces: A verified working tree ready for final review.

- [ ] **Step 1: Run all JavaScript syntax checks listed by the README plus the new module**

Run:

```bash
node --check background.js
node --check content.js
node --check templates.js
node --check history-store.js
node --check history-format.js
node --check history.js
node --check options.js
node --check result.js
node --check prompt-variants.js
```

Expected: every command exits with no output.

- [ ] **Step 2: Run all Node tests**

Run:

```bash
node tests/prompt-variants.test.js
node tests/templates-schema.test.js
node tests/history-format.test.js
```

Expected output contains all three lines:

```text
prompt variants tests passed
template schema tests passed
history format tests passed
```

- [ ] **Step 3: Check Git status for unrelated files**

Run:

```bash
git status --short
```

Expected: only intentional files from this feature are modified or already committed. Existing unrelated untracked files from before this feature, such as screenshots or other specs, must not be included in feature commits.

- [ ] **Step 4: Manual extension verification**

Load the extension from the repository root in Chrome and run this flow:

```text
1. Open the extension options page.
2. Confirm AI Base URL, API Key, Model, and Default output template are configured.
3. Analyze one regular web image or use screenshot selection.
4. Wait for the result page to finish.
5. Confirm the main English Prompt still appears.
6. Confirm the Professional variants section appears when the model returns prompt_variants.
7. Click Copy Prompt on each visible variant and paste into a scratch text field.
8. Click Copy Card on one variant and confirm the pasted text contains title, description, Prompt, Tags, Negative Prompt, and use cases.
9. Click Download Markdown and confirm the file contains ## 专业用途 Prompt 候选 only when at least one complete variant exists.
10. Enable local history, analyze another image, open history.html, and confirm the saved item displays the professional variants section.
11. Open an older history item without prompt_variants and confirm it displays without an empty professional variants section.
```

Expected: all checks pass; no console error appears for missing DOM ids or missing `PromptVariants`.

- [ ] **Step 5: Commit final verification note if any verification-only doc was changed**

If no files changed during verification, do not create a commit.

If a small documentation correction was required during verification, commit only that correction:

```bash
git add README.md SECURITY.md
git commit -m "docs: clarify prompt variant verification"
```

Expected: either no commit is needed, or the commit contains only the documentation correction.

---

## Self-Review

**Spec coverage:**

- Three fixed cards are covered by Task 1 normalization, Task 2 schema, and Task 3 rendering.
- One model call strategy is preserved by Task 2 only changing the prompt schema and not introducing extra API calls.
- Copy Prompt and Copy Card are covered by Task 3.
- JSON export preserving the full result object remains in `buildExportData()` and is verified by Task 3; Markdown variants section is added by Task 3.
- History compatibility is covered by Task 4.
- Privacy and data retention wording is covered by Task 5.
- Tests and fixtures are covered by Tasks 1, 2, 4, and 6.
- No new backend, permissions, dependencies, or build step are introduced in any task.

**Placeholder scan:**

The plan contains no `TBD`, no incomplete sections, and no instruction that asks the implementer to invent missing logic. Code-changing steps include concrete code blocks and exact commands.

**Type consistency:**

All tasks use the same `PromptVariants` API names: `normalizePromptVariants`, `formatPromptVariantCard`, `formatPromptVariantsMarkdown`, and `VARIANT_ORDER`. Variant ids are consistently `recreate`, `creative`, and `commercial`. The normalized variant shape uses `prompt_en`, `prompt_zh_summary`, `negative_prompt`, `use_cases`, and `isComplete` consistently across result rendering, history formatting, copy, and Markdown export.
