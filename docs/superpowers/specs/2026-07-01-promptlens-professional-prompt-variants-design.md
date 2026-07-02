# PromptLens 专业用途 Prompt 候选卡片设计

日期：2026-07-01

## 背景

PromptLens 是一个轻量 Chrome MV3 扩展，用于从网页图片或框选截图反推可复用的图片生成 prompt。项目坚持本地优先、无后端、无账号系统、无构建步骤和 provider-neutral 的产品原则。当前结果页已能展示结构化输出，并支持复制、JSON / Markdown 导出、可选历史记录和自定义模板。

下一步改进目标是提升结果对专业设计人员的可用性。目标用户主要把 PromptLens 输出复制到 Midjourney、即梦、Lovart、Flux、Stable Diffusion、ComfyUI 等图像生成工具中使用，其中自然语言 prompt 工具更多，但也需要兼顾标签式和 negative prompt 工作流。

## 目标

本次功能将一次性结果升级为“多张专业用途候选卡片”：同一张图分析完成后，结果页在保留原有结构化输出的同时，展示 3 张只读、复制即用的专业 prompt 卡片。

三张卡片固定为：

1. **复刻版**：尽量还原参考图的主体、构图、风格、光影、材质和色彩。
2. **创意延展版**：保留参考图核心视觉基因，同时探索新的视觉方向。
3. **商业强化版**：面向广告、产品图、海报和品牌视觉方向的 prompt 改写建议，不保证商业效果或平台生成质量。

成功标准：

- 用户在一次分析后能快速比较 3 个不同用途的 prompt。
- 每个版本都能直接复制到自然语言图像生成工具中使用。
- Tags 和 Negative prompt 为标签式或 negative prompt 工作流提供参考，不保证所有模型或工作流均适用。
- 旧结果、旧历史记录、旧导出能力不回归。
- 不新增后端、权限、构建工具或 npm 依赖。

## 非目标

MVP 明确不做以下内容：

- 不做平台参数生成器。
- 不做 Midjourney / Stable Diffusion / Flux 等平台专用完整适配大全。
- 不做页面内 prompt 编辑器。
- 不做单卡重新生成。
- 不做多次模型调用提升单卡质量。
- 不做多图批量处理。
- 不做云端历史、团队协作或账号系统。
- 不新增浏览器权限。
- 不新增后端。
- 不引入构建工具或 npm 依赖。

## 用户体验设计

结果页新增“专业用途 Prompt 候选”区域，展示 3 张卡片：

### 复刻版

目标是准确复现参考图。适合临摹、风格拆解、客户给参考图后快速复现方向。内容侧重主体、构图、镜头、光影、材质、色彩和风格准确性。

### 创意延展版

目标是保留参考图核心视觉基因，同时给出更有探索性的生成方向。适合概念探索、Moodboard 扩展和提案早期发散。内容侧重风格变体、氛围延展、视觉张力和探索性。

### 商业强化版

目标是把参考图转成更适合广告、产品图、海报和品牌视觉方向的 prompt。内容侧重画面完成度、商业视觉表达、构图可用性和品牌视觉感，但不承诺商业效果、平台生成质量或转化结果。

每张卡片展示：

- 标题。
- 简短中文说明。
- 英文最终 prompt。
- 关键标签。
- Negative prompt。
- 适用场景。

每张卡片提供两个复制入口：

1. **Copy Prompt**：只复制该卡片的英文最终 prompt。
2. **Copy Card**：复制结构化卡片文本，包含标题、中文说明、英文 prompt、tags、negative prompt 和适用场景。

MVP 采用只读 + 复制交互，不在页面内编辑。用户如需改写，可复制到自己的生成工具、文本编辑器或设计工作文档中处理。

## 数据结构设计

现有 PromptLens 结果结构包含 `prompt_zh`、`prompt_en`、`prompt_tags`、`negative_prompt`、`json_prompt` 等字段。新功能保持这些字段不变，并新增受控字段 `prompt_variants`。

建议结构：

```js
{
  prompt_zh: string,
  prompt_en: string,
  prompt_tags: string[],
  negative_prompt: string,
  json_prompt: object,

  prompt_variants: [
    {
      id: 'recreate',
      title: '复刻版',
      intent: '尽量还原参考图的主体、构图、风格、光影和材质',
      prompt_en: string,
      prompt_zh_summary: string,
      tags: string[],
      negative_prompt: string,
      use_cases: string[]
    },
    {
      id: 'creative',
      title: '创意延展版',
      intent: '保留核心视觉基因，探索新的视觉方向',
      prompt_en: string,
      prompt_zh_summary: string,
      tags: string[],
      negative_prompt: string,
      use_cases: string[]
    },
    {
      id: 'commercial',
      title: '商业强化版',
      intent: '面向广告、产品图、海报和品牌视觉落地',
      prompt_en: string,
      prompt_zh_summary: string,
      tags: string[],
      negative_prompt: string,
      use_cases: string[]
    }
  ]
}
```

兼容规则：

- 旧字段继续保留，现有复制、导出和历史摘要不应失效。
- `prompt_en` 继续作为兼容旧 UI、旧复制、旧导出和历史摘要的默认主 prompt，语义保持为“通用主 prompt”。
- `prompt_variants` 是增强字段，不反向改变旧字段语义。
- 复刻版卡片通常可以接近 `prompt_en`，但不要求二者完全相同。
- 如果复刻版卡片缺失或不完整，UI 可以临时使用 `prompt_en` 作为显示兜底，但不得修改原始结果对象。
- `prompt_variants` 缺失时，结果页按旧 UI 正常展示。
- `prompt_variants` 解析失败或数量不足时，不让整个结果页失败。

## `prompt_variants` 规范化规则

`prompt_variants` 是对现有结果 schema 的受控扩展，不改变旧字段语义，也不作为结果页基础渲染的前置依赖。

实现时必须先对模型返回值进行规范化，再进入渲染、复制、导出和历史详情展示。

规范化规则：

- `prompt_variants` 必须是数组；非数组时视为缺失。
- 只识别三个固定 `id`：`recreate`、`creative`、`commercial`。
- UI 固定按 `recreate`、`creative`、`commercial` 顺序展示，不依赖模型返回顺序。
- 未知 `id` 的卡片丢弃。
- 重复 `id` 时保留第一个有效卡片。
- `prompt_en` 必须是非空字符串；缺失或 trim 后为空时，该卡片视为不完整，不提供 Copy Prompt。
- `title`、`intent`、`prompt_zh_summary`、`negative_prompt` 缺失或类型错误时规范化为空字符串或使用内置默认文案。
- `tags`、`use_cases` 必须是字符串数组；非数组时规范化为空数组，数组内非字符串项丢弃。
- 允许模型返回额外字段，但 UI、复制、导出和历史摘要不得依赖额外字段。
- 所有展示和导出的字符串都应经过 trim，并使用现有安全文本渲染方式，不使用 `innerHTML` 注入模型文本。
- `prompt_variants` 解析或规范化失败不得影响旧字段展示、旧复制、旧导出和历史读取。

MVP 不引入独立 schema version。`prompt_variants` 的固定 `id` 集合和规范化规则就是本次受控扩展的版本边界；后续如新增候选类型，应通过新的设计和实现计划处理。

## 模块边界

### `templates.js`

更新固定 JSON schema suffix，要求模型输出 `prompt_variants`，同时继续要求旧字段。模板可以影响内容风格，但不能自由改变顶层 schema。

模板说明需要强调：

- 面向专业设计人员。
- 输出应是可进入生成工具的专业 prompt，而不是泛泛图像描述。
- 自然语言 prompt 优先，兼顾标签式和 negative prompt 工作流。
- 三个版本必须明显区分。
- 不生成平台专属参数。
- 固定 JSON schema suffix 永远具有最高优先级；自定义模板只能影响字段内容风格，不能改变字段集合、字段类型、字段名和 JSON 根结构。
- 如果自定义模板与固定 schema suffix 冲突，以固定 schema suffix 为准；解析失败时提示用户自定义模板可能导致专业候选结构不完整，建议切回内置模板重试。

### `result.js`

负责：

- 解析和规范化 `prompt_variants`。
- 渲染 3 张专业用途卡片。
- 实现 Copy Prompt 和 Copy Card。
- 在字段缺失时显示合理空态。
- 保持旧结果渲染路径可用。

### `history-format.js` / `history-store.js`

MVP 不新增历史索引字段。继续保存完整 `result` object。历史列表摘要仍沿用现有 `promptEn` / `promptTags` 等字段。

历史详情页应与实时结果页共用同一套 `prompt_variants` 规范化、渲染、复制和导出逻辑；如果当前代码结构无法完全复用，也必须达到同等用户行为：

- 旧历史记录无 `prompt_variants` 时按旧 UI 正常展示。
- 新历史记录有完整 `prompt_variants` 时展示专业用途 Prompt 候选卡片。
- 新历史记录中 `prompt_variants` 不完整或字段类型异常时，按统一规范化规则回退，不影响旧字段展示。
- 历史列表摘要仍使用现有字段，不新增索引字段，不做历史迁移。

### 导出与格式化逻辑

JSON 导出直接包含完整 `prompt_variants`。

Markdown 导出追加“专业用途 Prompt 候选”章节。没有合法 `prompt_variants` 时，不输出空章节。

为避免复制和导出格式分叉，实现时应抽出共享 formatter，例如：

- `formatPromptVariantCard(variant)`：格式化单张卡片，用于 Copy Card。
- `formatPromptVariantsMarkdown(variants)`：格式化 Markdown 导出的专业候选章节。

Copy Card 和 Markdown 导出应共享字段顺序、空值处理和转义规则。实时结果页和历史详情页不得各自维护不一致的卡片文本格式。

## 模型调用策略

MVP 采用一次模型调用生成全部 3 个候选版本。

这样可以控制成本和等待时间，并保持实现轻量。暂不做基础分析 + 单独生成 3 个版本，也不做单卡重新生成。

`prompt_variants` 是增强字段，不是核心结果页渲染的前置依赖。模型无法稳定生成完整 variants 时，必须优先保住旧字段输出和旧 UI 能力。

模型输出要求：

- 固定生成 `recreate`、`creative`、`commercial` 三个候选。
- 每个候选都必须包含英文最终 prompt。
- 每个候选尽量包含中文摘要、tags、negative prompt 和 use cases。
- 三个候选的用途和表达应明显不同。
- 不承诺任何平台专属语法或参数。
- 每张候选卡片的 prompt 应保持可复制使用，避免无边界扩写导致延迟、成本或 JSON 解析风险明显上升。

弱 Vision provider 或小模型可能无法稳定生成完整 3 张卡片。此时结果页应通过规范化和回退逻辑展示可用卡片，并保留旧字段主结果。

## 错误处理与回退

1. **`prompt_variants` 缺失**
   - 继续展示旧字段结果。
   - 不阻断复制、导出和历史记录。
   - 可提示“专业用途候选未生成，已显示基础结果。”

2. **`prompt_variants` 数量不足**
   - 渲染可用卡片。
   - 缺失卡片不展示空壳。
   - 保留旧字段区块作为兜底。

3. **单张卡片字段缺失**
   - `prompt_en` 缺失时，该卡片不可复制，并显示“此版本生成不完整”。
   - `tags`、`negative_prompt`、`use_cases` 缺失时显示为空状态，不影响主 prompt 复制。

4. **模型返回 JSON 解析失败**
   - 沿用现有 JSON 解析失败处理。
   - 错误提示补充说明：如果使用自定义模板，可能导致专业候选结构不完整，建议切回内置模板重试。

5. **旧历史记录**
   - 没有 `prompt_variants` 的历史记录按旧方式展示。
   - 不做历史迁移。

## 导出设计

### JSON 导出

JSON 导出包含完整结果对象，包括 `prompt_variants`。

### Markdown 导出

Markdown 导出在现有内容后追加：

```markdown
## 专业用途 Prompt 候选

### 复刻版

**说明：** ...

**Prompt：**
...

**Tags：** ...

**Negative Prompt：** ...

**适用场景：** ...

### 创意延展版
...

### 商业强化版
...
```

如果结果没有合法 `prompt_variants`，不输出该章节。

## 历史记录设计

MVP 不改变历史记录开关、存储上限、隐私说明或历史列表字段。

保存策略：

- 继续保存完整 `result` object。
- 历史详情页与实时结果页共用同一套 `prompt_variants` 规范化、渲染、复制和导出逻辑；如果无法完全复用，也必须达到同等用户行为。
- 历史摘要仍使用现有字段。
- 新字段不保存图片缩略图，不保存完整源 URL，不保存 API Key。
- 旧历史记录无需迁移。

## 隐私、安全与权限

本功能不新增浏览器权限，不新增数据存储类别，不新增网络请求来源。

新增内容只来自同一次模型响应，并保存在已有结果对象中。如果用户开启本地历史记录，`prompt_variants` 会随完整结果对象保存在本地 IndexedDB 中，仍不保存 API Key 和图片缩略图。

需要额外说明的是，虽然本功能不保存图片缩略图、不保存完整源 URL、不保存 API Key，也不新增网络请求来源，但 `prompt_variants` 是对图片内容的进一步文本化推断，可能包含人物外观、品牌、商品、场景、屏幕内容、商业素材或第三方作品风格等信息。

当用户开启本地历史记录时，这些专业候选文本会随完整结果对象保存到本地 IndexedDB。用户应避免对敏感、机密、受版权限制或未授权的图片开启历史保存，或在使用后主动清除历史记录。

专业候选卡片只是模型生成的文本建议，不代表任何第三方生成平台的官方参数、最佳实践或效果承诺。用户将 prompt 粘贴到第三方工具后，仍需遵守该工具的隐私、费用、版权和内容政策。

## 测试策略

### 格式化与解析

- 新结果含 3 个 `prompt_variants` 时能正确规范化。
- 缺失 `prompt_variants` 时旧结果仍可用。
- 卡片字段缺失时不会崩溃。

### 渲染行为

- 结果页能显示 3 张专业用途卡片。
- 每张卡片标题、说明、prompt、tags、negative prompt、use cases 正确显示。
- 缺失字段显示合理空态。

### 复制行为

- Copy Prompt 只复制该卡片英文 prompt。
- Copy Card 复制结构化卡片文本。
- Copy Card 与 Markdown 导出使用一致的字段顺序和空值处理。
- 旧字段复制行为不回归。

### 导出行为

- JSON 导出包含 `prompt_variants`。
- Markdown 导出包含三张卡片章节。
- 旧结果导出不出现空的专业卡片章节。

### 历史记录兼容

- 旧历史记录无 `prompt_variants` 时仍能渲染。
- 新历史记录保存和读取后保留 `prompt_variants`。
- 历史详情页中 variants 的展示、复制和导出行为与实时结果页一致。

### 必测 fixtures

实现时至少需要覆盖以下 fixtures：

1. 旧结果：不包含 `prompt_variants`。
2. 完整新结果：包含 `recreate`、`creative`、`commercial` 三张合法卡片。
3. 数量不足：只包含一张或两张合法卡片。
4. 字段缺失：某张卡片缺少 `prompt_en`。
5. 类型错误：`tags` 为字符串、`use_cases` 为 null、`negative_prompt` 为数组。
6. 未知 id：包含 `id: "midjourney"` 或其他非固定 id。
7. 重复 id：包含多个 `recreate`。
8. 特殊字符：prompt 中包含 Markdown 符号、换行、引号和冒号。
9. 旧历史记录：读取后不报错，不出现空专业卡片章节。
10. 新历史记录：保存、读取、复制和导出后保留三张专业卡片。

核心断言：

- 任何异常 `prompt_variants` 都不得阻断旧字段渲染。
- Copy Prompt 只复制当前卡片的英文 prompt。
- Copy Card 和 Markdown 导出使用一致的字段顺序和空值处理。
- JSON 导出包含原始完整结果对象。
- Markdown 导出在无合法 variants 时不输出空章节。

### 手动验证

- 使用一张普通参考图，确认结果页出现 3 张不同用途卡片。
- 分别复制 3 个 prompt，确认文本适合直接粘贴到自然语言生成工具。
- 检查 Negative prompt 和 tags 对标签式或 negative prompt 工作流有基本参考价值。
- 使用自定义模板触发一次分析，确认固定 schema suffix 仍被追加，且 variants 缺失或不完整时旧字段不受影响。

## 文档更新要求

实现时需要同步更新用户可见文档：

- README：新增专业用途 Prompt 候选卡片的功能说明和限制。
- SECURITY 或隐私说明：新增本地历史保存 variants 文本的说明，强调文本化推断也可能包含敏感图像信息。
- 自定义模板相关说明：明确固定 JSON schema suffix 不可被覆盖，自定义模板只能影响字段内容风格。

## 实施顺序建议

1. 更新 `templates.js` 的固定 schema suffix 和模板说明。
2. 在 `result.js` 中增加 `prompt_variants` 规范化和回退逻辑。
3. 抽出共享 formatter，供 Copy Card、Markdown 导出和历史详情复用。
4. 渲染专业用途卡片区域。
5. 实现 Copy Prompt 和 Copy Card。
6. 更新 Markdown 导出。
7. 检查历史记录读写兼容性。
8. 增加单元测试和必要手动验证。
9. 更新 README / SECURITY 或相关说明文档。

## 开放问题

无产品方向阻塞问题。平台专属参数、页面内编辑、单卡重新生成和保存为模板均明确后置，等待真实用户反馈再规划。

实现前需在 implementation plan 中确认 `prompt_variants` 规范化函数、历史详情复用方式和导出 formatter 的具体落点。
