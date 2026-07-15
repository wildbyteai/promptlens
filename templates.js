(function () {
  'use strict';

  const ACTIVE_TEMPLATE_KEY = 'activeTemplateId';
  const CUSTOM_TEMPLATES_KEY = 'customTemplates';
  const DEFAULT_TEMPLATE_ID = 'detailed';
  const MARKETING_TEMPLATE_ID = 'visual_marketing';
  const TEMPLATE_TYPES = Object.freeze({
    STANDARD: 'standard',
    MARKETING: 'marketing'
  });
  const TEMPLATE_PROFILES = Object.freeze({
    DETAILED: 'detailed',
    NATURAL: 'natural',
    TAGS: 'tags',
    CONCISE: 'concise',
    MARKETING: 'marketing',
    CUSTOM: 'custom'
  });
  const CUSTOM_TEMPLATE_LIMIT = 50;
  const INSTRUCTION_MAX_LENGTH = 4000;
  const t = (key, params) => window.PromptLensI18n ? window.PromptLensI18n.t(key, params) : key;
  const localizedError = (key, params = {}) => window.PromptLensI18n.createError(key, params);

  const BUILTIN_TEMPLATES = [
    {
      id: 'detailed',
      nameKey: 'templateDetailedName',
      descriptionKey: 'templateDetailedDescription',
      builtIn: true,
      templateType: TEMPLATE_TYPES.STANDARD,
      templateProfile: TEMPLATE_PROFILES.DETAILED,
      version: 1,
      instruction: [
        'You are an elite reverse-prompt analyst for image generation.',
        'Your task is not to caption the image. Your task is to reconstruct a practical image-generation prompt that could recreate the visible image as closely as possible.',
        'Analyze only visible evidence. Be specific about subject, pose or action, appearance, environment, composition, lighting, atmosphere, color palette, materials, texture, camera/framing, style, and image quality.',
        'Write for professional designers using image-generation tools. The result should be practical production prompt material rather than a generic caption.'
      ].join('\n')
    },
    {
      id: 'natural',
      nameKey: 'templateNaturalName',
      descriptionKey: 'templateNaturalDescription',
      builtIn: true,
      templateType: TEMPLATE_TYPES.STANDARD,
      templateProfile: TEMPLATE_PROFILES.NATURAL,
      version: 1,
      instruction: [
        'You are an expert image-generation prompt writer using natural language prompts.',
        'Reconstruct a fluent English prompt that describes the visible image as a coherent paragraph rather than a keyword list.',
        'Prioritize subject, environment, composition, lighting, color, mood, texture, rendering or photographic style, and final image quality.',
        'Write for professional designers using natural-language image-generation tools.'
      ].join('\n')
    },
    {
      id: 'tags',
      nameKey: 'templateTagsName',
      descriptionKey: 'templateTagsDescription',
      builtIn: true,
      templateType: TEMPLATE_TYPES.STANDARD,
      templateProfile: TEMPLATE_PROFILES.TAGS,
      version: 1,
      instruction: [
        'You are an expert at reconstructing tag-oriented image-generation prompts from visible evidence.',
        'Reconstruct the image as positive and negative tag-style prompt material.',
        'Write for professional designers who may reuse tags, negative prompts, or structured components in Stable Diffusion, Flux, ComfyUI, or similar workflows.',
        'Use tags as the primary writing style while preserving enough visual context for downstream editing. Platform-specific weighting is controlled separately by the target-platform rules.'
      ].join('\n')
    },
    {
      id: 'concise',
      nameKey: 'templateConciseName',
      descriptionKey: 'templateConciseDescription',
      builtIn: true,
      templateType: TEMPLATE_TYPES.STANDARD,
      templateProfile: TEMPLATE_PROFILES.CONCISE,
      version: 1,
      instruction: [
        'You are an image-generation prompt assistant focused on concise practical output.',
        'Reconstruct the visible image as a compact prompt that preserves the most important subject, style, lighting, composition, and mood.',
        'Write for professional designers who need a fast, copyable starting point.'
      ].join('\n')
    },
    {
      id: MARKETING_TEMPLATE_ID,
      nameKey: 'templateMarketingName',
      descriptionKey: 'templateMarketingDescription',
      builtIn: true,
      templateType: TEMPLATE_TYPES.MARKETING,
      templateProfile: TEMPLATE_PROFILES.MARKETING,
      version: 1,
      instruction: [
        'You are a commercial visual diagnosis consultant familiar with small-business growth, marketing creative, and AI image generation.',
        'Do not merely judge whether an image looks good or teach exact copying. Translate visible visual strategy into practical marketing judgments for owners and business teams.',
        'Prioritize what the image appears to sell, who it may appeal to, what stops attention, what may reduce conversion, and how a small business can adapt the visual strategy at low cost.',
        'Use user-provided business context when available. Otherwise make cautious judgments based only on visible image evidence.',
        'Do not promise conversion performance or advise on budgets, bids, or advertising-account optimization.',
        'Avoid exact-copy language. Prefer low-cost adaptation, visual strategy borrowing, and visual structure reference.'
      ].join('\n')
    }
  ];

  function cloneTemplate(template) {
    const cloned = { ...template };
    if (cloned.builtIn) {
      cloned.name = t(cloned.nameKey);
      cloned.description = t(cloned.descriptionKey);
    }
    return cloned;
  }

  function normalizeTemplate(raw, fallbackId) {
    const now = Date.now();
    const id = String(raw && raw.id || fallbackId || makeCustomId()).trim();
    const name = String(raw && raw.name || t('templateUnnamed')).trim().slice(0, 80);
    const description = String(raw && raw.description || t('templateUserDefined')).trim().slice(0, 160);
    const instruction = String(raw && raw.instruction || '').trim();
    const templateType = raw && raw.templateType === TEMPLATE_TYPES.MARKETING
      ? TEMPLATE_TYPES.MARKETING
      : TEMPLATE_TYPES.STANDARD;
    const allowedProfiles = templateType === TEMPLATE_TYPES.MARKETING
      ? [TEMPLATE_PROFILES.MARKETING]
      : [TEMPLATE_PROFILES.DETAILED, TEMPLATE_PROFILES.NATURAL, TEMPLATE_PROFILES.TAGS, TEMPLATE_PROFILES.CONCISE, TEMPLATE_PROFILES.CUSTOM];
    const templateProfile = allowedProfiles.includes(raw && raw.templateProfile)
      ? raw.templateProfile
      : (templateType === TEMPLATE_TYPES.MARKETING ? TEMPLATE_PROFILES.MARKETING : TEMPLATE_PROFILES.CUSTOM);

    if (!id) throw localizedError('errorTemplateId');
    if (!name) throw localizedError('errorTemplateName');
    if (!instruction) throw localizedError('errorTemplateInstruction');
    if (instruction.length > INSTRUCTION_MAX_LENGTH) {
      throw localizedError('errorTemplateInstructionLength', { limit: INSTRUCTION_MAX_LENGTH });
    }

    return {
      id,
      name,
      description,
      instruction,
      builtIn: false,
      templateType,
      templateProfile,
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
    const template = BUILTIN_TEMPLATES.find(item => item.id === templateId);
    return template ? cloneTemplate(template) : null;
  }

  async function getCustomTemplates() {
    const stored = await chrome.storage.local.get({ [CUSTOM_TEMPLATES_KEY]: [] });
    const templates = Array.isArray(stored[CUSTOM_TEMPLATES_KEY]) ? stored[CUSTOM_TEMPLATES_KEY] : [];
    return templates.map((template, index) => normalizeTemplate(template, `custom-${index}`));
  }

  async function saveCustomTemplates(templates) {
    if (templates.length > CUSTOM_TEMPLATE_LIMIT) {
      throw localizedError('errorTemplateLimit', { limit: CUSTOM_TEMPLATE_LIMIT });
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
      throw localizedError('errorTemplateLimit', { limit: CUSTOM_TEMPLATE_LIMIT });
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
    if (index === -1) throw localizedError('errorTemplateCustomOnlyEdit');

    const updated = normalizeTemplate({
      ...customTemplates[index],
      ...input,
      id: templateId,
      createdAt: customTemplates[index].createdAt,
      templateType: customTemplates[index].templateType,
      templateProfile: customTemplates[index].templateProfile,
      version: customTemplates[index].version + 1,
      updatedAt: Date.now()
    });
    customTemplates[index] = updated;
    await saveCustomTemplates(customTemplates);
    return updated;
  }

  async function deleteCustomTemplate(templateId) {
    const customTemplates = await getCustomTemplates();
    const kept = customTemplates.filter(template => template.id !== templateId);
    if (kept.length === customTemplates.length) throw localizedError('errorTemplateCustomOnlyDelete');
    await saveCustomTemplates(kept);

    const stored = await chrome.storage.local.get({ [ACTIVE_TEMPLATE_KEY]: DEFAULT_TEMPLATE_ID });
    if (stored[ACTIVE_TEMPLATE_KEY] === templateId) {
      await setActiveTemplate(DEFAULT_TEMPLATE_ID);
    }
  }

  async function duplicateTemplate(templateId) {
    const source = await getTemplateById(templateId);
    return createCustomTemplate({
      name: t('templateCopySuffix', { name: source.name }),
      description: source.description,
      instruction: source.instruction,
      templateType: source.templateType,
      templateProfile: source.templateProfile
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
      throw localizedError('errorTemplateImportFormat');
    }
    const existing = await getCustomTemplates();
    const existingKeys = new Set(existing.map(template => `${template.templateType}\n${template.name}\n${template.instruction}`));
    const imported = [];

    for (const rawTemplate of payload.templates) {
      const normalized = normalizeTemplate({
        ...rawTemplate,
        id: makeCustomId(),
        builtIn: false
      });
      const key = `${normalized.templateType}\n${normalized.name}\n${normalized.instruction}`;
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);
      imported.push(normalized);
      if (existing.length + imported.length >= CUSTOM_TEMPLATE_LIMIT) break;
    }

    const merged = [...existing, ...imported];
    await saveCustomTemplates(merged);
    return imported;
  }

  function isMarketingDiagnosisTemplate(templateOrId) {
    if (templateOrId && typeof templateOrId === 'object') {
      if (templateOrId.templateType) {
        return templateOrId.templateType === TEMPLATE_TYPES.MARKETING;
      }
      return templateOrId.id === MARKETING_TEMPLATE_ID;
    }
    return templateOrId === MARKETING_TEMPLATE_ID;
  }

  function getPromptCompiler() {
    if (window.PromptCompiler) return window.PromptCompiler;
    if (typeof module === 'object' && module.exports && typeof require === 'function') {
      return require('./prompt-compiler.js');
    }
    throw new Error('PromptCompiler is not loaded.');
  }

  function buildOutputLanguageRules(value) {
    const compiler = getPromptCompiler();
    return compiler.buildLanguageRules(compiler.compile(BUILTIN_TEMPLATES[0], { outputLanguage: value }));
  }

  function buildFinalPrompt(template, options = {}) {
    const compiler = getPromptCompiler();
    const selected = template && template.instruction ? template : BUILTIN_TEMPLATES[0];
    return compiler.renderApiPrompt(compiler.compile(selected, options));
  }

  window.PromptTemplates = {
    ACTIVE_TEMPLATE_KEY,
    CUSTOM_TEMPLATES_KEY,
    DEFAULT_TEMPLATE_ID,
    MARKETING_TEMPLATE_ID,
    TEMPLATE_TYPES,
    TEMPLATE_PROFILES,
    isMarketingDiagnosisTemplate,
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
    buildOutputLanguageRules,
    buildFinalPrompt
  };
}());
