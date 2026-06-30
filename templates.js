(function () {
  'use strict';

  const ACTIVE_TEMPLATE_KEY = 'activeTemplateId';
  const CUSTOM_TEMPLATES_KEY = 'customTemplates';
  const DEFAULT_TEMPLATE_ID = 'detailed';
  const CUSTOM_TEMPLATE_LIMIT = 50;
  const INSTRUCTION_MAX_LENGTH = 4000;

  const JSON_SCHEMA_SUFFIX = [
    'Return valid JSON only. Do not use markdown fences. Do not include analysis outside the JSON.',
    'All visible-detail claims must be based on the image. If uncertain, use broader visually useful wording instead of guessing.',
    'Do not invent brands, logos, named artists, exact camera bodies, lens models, exact locations, hidden objects, identities, or unreadable text.',
    'Return exactly this JSON shape:',
    '{',
    '  "prompt_zh": "简体中文反向提示词，完整描述主体、动作姿态、外观细节、环境背景、构图、光线氛围、风格、色彩、材质和画面质感。",',
    '  "prompt_en": "English reverse prompt optimized for recreating the image, not merely describing it.",',
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
    '  }',
    '}'
  ].join('\n');

  const BUILTIN_TEMPLATES = [
    {
      id: 'detailed',
      name: '详细分析',
      description: '完整结构化输出，适合通用分析和二次编辑。',
      builtIn: true,
      version: 1,
      instruction: [
        'You are an elite reverse-prompt analyst for image generation.',
        'Your task is not to caption the image. Your task is to reconstruct a practical image-generation prompt that could recreate the visible image as closely as possible.',
        'Analyze only visible evidence. Be specific about subject, pose or action, appearance, environment, composition, lighting, atmosphere, color palette, materials, texture, camera/framing, style, and image quality.',
        'prompt_en must be English and should be the most complete recreation prompt, around 100-180 words.',
        'prompt_zh must be Simplified Chinese and should preserve the same visual details as prompt_en.',
        'prompt_tags must contain 6-10 concise English tags covering subject, medium/style, lighting, mood, composition, and visual technique when visible.',
        'negative_prompt must be English, practical for image generation, and tailored to the image type.',
        'json_prompt must be English and should break the image into reusable structured visual components.'
      ].join('\n')
    },
    {
      id: 'natural',
      name: '自然语言',
      description: '流畅英文描述 prompt，适合自然语言提示词平台。',
      builtIn: true,
      version: 1,
      instruction: [
        'You are an expert image-generation prompt writer using natural language prompts.',
        'Reconstruct a fluent English prompt that describes the visible image as a coherent paragraph rather than a keyword list.',
        'Prioritize subject, environment, composition, lighting, color, mood, texture, rendering or photographic style, and final image quality.',
        'Do not include platform-specific flags or parameters such as aspect-ratio switches, version numbers, seed values, style codes, LoRA syntax, or workflow node names.',
        'prompt_en should be a polished natural-language prompt, around 80-150 words, directly reusable in platforms that accept descriptive prompts.',
        'prompt_zh should be a faithful Simplified Chinese version of the same visual prompt.',
        'prompt_tags should summarize the prompt with 6-10 concise English tags.',
        'negative_prompt should remain practical and concise.'
      ].join('\n')
    },
    {
      id: 'tags',
      name: '标签加权',
      description: '带权重倾向的正向 / 反向标签，适合标签驱动工作流。',
      builtIn: true,
      version: 1,
      instruction: [
        'You are an expert at reconstructing tag-oriented image-generation prompts from visible evidence.',
        'Reconstruct the image as weighted positive and negative tag-style prompts while keeping the fixed JSON shape.',
        'prompt_en should be primarily comma-separated English tags. Use light weighting only when visually justified, for example (masterpiece:1.1), (cinematic lighting:1.2), or (soft shadows:1.1). Do not overuse weights.',
        'prompt_tags should contain the most reusable 8-12 English tags, without long prose.',
        'negative_prompt should be a comma-separated English negative prompt tailored to the image type, including quality and artifact negatives plus content-specific negatives when relevant.',
        'prompt_zh should briefly explain the positive tag prompt in Simplified Chinese without losing key visual details.',
        'json_prompt should still contain structured English components for downstream editing.'
      ].join('\n')
    },
    {
      id: 'concise',
      name: '快速复制',
      description: '一句话概括，适合快速复制试跑。',
      builtIn: true,
      version: 1,
      instruction: [
        'You are an image-generation prompt assistant focused on concise practical output.',
        'Reconstruct the visible image as a compact prompt that preserves the most important subject, style, lighting, composition, and mood.',
        'prompt_en should be one strong sentence, around 35-70 words, with no platform-specific flags.',
        'prompt_zh should be one concise Simplified Chinese sentence with matching visual meaning.',
        'prompt_tags should contain 6-8 short English tags.',
        'negative_prompt should be short and practical.',
        'json_prompt should be filled, but each field may be concise.'
      ].join('\n')
    }
  ];

  function cloneTemplate(template) {
    return { ...template };
  }

  function normalizeTemplate(raw, fallbackId) {
    const now = Date.now();
    const id = String(raw && raw.id || fallbackId || makeCustomId()).trim();
    const name = String(raw && raw.name || '未命名模板').trim().slice(0, 80);
    const description = String(raw && raw.description || '用户自定义模板。').trim().slice(0, 160);
    const instruction = String(raw && raw.instruction || '').trim();

    if (!id) throw new Error('模板 ID 无效。');
    if (!name) throw new Error('模板名称不能为空。');
    if (!instruction) throw new Error('模板 instruction 不能为空。');
    if (instruction.length > INSTRUCTION_MAX_LENGTH) {
      throw new Error(`模板 instruction 不能超过 ${INSTRUCTION_MAX_LENGTH} 字符。`);
    }

    return {
      id,
      name,
      description,
      instruction,
      builtIn: false,
      version: Number(raw && raw.version) || 1,
      createdAt: Number(raw && raw.createdAt) || now,
      updatedAt: Number(raw && raw.updatedAt) || now
    };
  }

  function makeCustomId() {
    return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function listBuiltInTemplates() {
    return BUILTIN_TEMPLATES.map(cloneTemplate);
  }

  function getBuiltInTemplateById(templateId) {
    return BUILTIN_TEMPLATES.find(template => template.id === templateId) || null;
  }

  async function getCustomTemplates() {
    const stored = await chrome.storage.local.get({ [CUSTOM_TEMPLATES_KEY]: [] });
    const templates = Array.isArray(stored[CUSTOM_TEMPLATES_KEY]) ? stored[CUSTOM_TEMPLATES_KEY] : [];
    return templates.map((template, index) => normalizeTemplate(template, `custom-${index}`));
  }

  async function saveCustomTemplates(templates) {
    if (templates.length > CUSTOM_TEMPLATE_LIMIT) {
      throw new Error(`最多保存 ${CUSTOM_TEMPLATE_LIMIT} 个自定义模板。`);
    }
    await chrome.storage.local.set({ [CUSTOM_TEMPLATES_KEY]: templates });
  }

  async function listTemplates() {
    const customTemplates = await getCustomTemplates();
    return [...listBuiltInTemplates(), ...customTemplates];
  }

  async function getTemplateById(templateId) {
    const builtIn = getBuiltInTemplateById(templateId);
    if (builtIn) return cloneTemplate(builtIn);

    const customTemplates = await getCustomTemplates();
    return customTemplates.find(template => template.id === templateId) || cloneTemplate(BUILTIN_TEMPLATES[0]);
  }

  async function getActiveTemplate() {
    const stored = await chrome.storage.local.get({ [ACTIVE_TEMPLATE_KEY]: DEFAULT_TEMPLATE_ID });
    return getTemplateById(stored[ACTIVE_TEMPLATE_KEY]);
  }

  async function setActiveTemplate(templateId) {
    const template = await getTemplateById(templateId);
    await chrome.storage.local.set({ [ACTIVE_TEMPLATE_KEY]: template.id });
    return template;
  }

  async function createCustomTemplate(input) {
    const customTemplates = await getCustomTemplates();
    if (customTemplates.length >= CUSTOM_TEMPLATE_LIMIT) {
      throw new Error(`最多保存 ${CUSTOM_TEMPLATE_LIMIT} 个自定义模板。`);
    }
    const template = normalizeTemplate({ ...input, id: makeCustomId() });
    customTemplates.push(template);
    await saveCustomTemplates(customTemplates);
    await setActiveTemplate(template.id);
    return template;
  }

  async function updateCustomTemplate(templateId, input) {
    const customTemplates = await getCustomTemplates();
    const index = customTemplates.findIndex(template => template.id === templateId);
    if (index === -1) throw new Error('只能编辑自定义模板。');

    const updated = normalizeTemplate({
      ...customTemplates[index],
      ...input,
      id: templateId,
      createdAt: customTemplates[index].createdAt,
      version: customTemplates[index].version
    });
    customTemplates[index] = updated;
    await saveCustomTemplates(customTemplates);
    return updated;
  }

  async function deleteCustomTemplate(templateId) {
    const customTemplates = await getCustomTemplates();
    const kept = customTemplates.filter(template => template.id !== templateId);
    if (kept.length === customTemplates.length) throw new Error('只能删除自定义模板。');
    await saveCustomTemplates(kept);

    const stored = await chrome.storage.local.get({ [ACTIVE_TEMPLATE_KEY]: DEFAULT_TEMPLATE_ID });
    if (stored[ACTIVE_TEMPLATE_KEY] === templateId) {
      await setActiveTemplate(DEFAULT_TEMPLATE_ID);
    }
  }

  async function duplicateTemplate(templateId) {
    const source = await getTemplateById(templateId);
    return createCustomTemplate({
      name: `${source.name} 副本`,
      description: source.description,
      instruction: source.instruction
    });
  }

  async function exportCustomTemplates() {
    const customTemplates = await getCustomTemplates();
    return {
      app: 'PromptLens',
      type: 'promptlens-custom-templates',
      version: 1,
      exportedAt: new Date().toISOString(),
      templates: customTemplates
    };
  }

  async function importCustomTemplates(payload) {
    if (!payload || payload.type !== 'promptlens-custom-templates' || payload.version !== 1 || !Array.isArray(payload.templates)) {
      throw new Error('模板文件格式不正确或版本不兼容。');
    }
    const existing = await getCustomTemplates();
    const existingKeys = new Set(existing.map(template => `${template.name}\n${template.instruction}`));
    const imported = [];

    for (const rawTemplate of payload.templates) {
      const normalized = normalizeTemplate({
        ...rawTemplate,
        id: makeCustomId(),
        builtIn: false
      });
      const key = `${normalized.name}\n${normalized.instruction}`;
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);
      imported.push(normalized);
      if (existing.length + imported.length >= CUSTOM_TEMPLATE_LIMIT) break;
    }

    const merged = [...existing, ...imported];
    await saveCustomTemplates(merged);
    return imported;
  }

  function buildFinalPrompt(template) {
    const selected = template && template.instruction ? template : BUILTIN_TEMPLATES[0];
    return [selected.instruction, JSON_SCHEMA_SUFFIX].join('\n\n');
  }

  window.PromptTemplates = {
    ACTIVE_TEMPLATE_KEY,
    CUSTOM_TEMPLATES_KEY,
    DEFAULT_TEMPLATE_ID,
    CUSTOM_TEMPLATE_LIMIT,
    INSTRUCTION_MAX_LENGTH,
    listBuiltInTemplates,
    getBuiltInTemplateById,
    getCustomTemplates,
    listTemplates,
    getTemplateById,
    getActiveTemplate,
    setActiveTemplate,
    createCustomTemplate,
    updateCustomTemplate,
    deleteCustomTemplate,
    duplicateTemplate,
    exportCustomTemplates,
    importCustomTemplates,
    buildFinalPrompt
  };
}());
