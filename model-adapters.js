(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.PromptModelAdapters = api;
}(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  const runtime = typeof globalThis !== 'undefined' ? globalThis : window;
  const ANTHROPIC_TOOL_NAME = 'submit_promptlens_result';
  const MODEL_ADAPTER_IDS = Object.freeze({
    OPENAI_COMPATIBLE: 'openai_compatible',
    ANTHROPIC: 'anthropic'
  });
  const STRUCTURED_OUTPUT_MODES = Object.freeze({
    PROMPT: 'prompt',
    JSON_OBJECT: 'json_object',
    JSON_SCHEMA: 'json_schema'
  });

  class ModelAdapterError extends Error {
    constructor(code, message) {
      super(message || code);
      this.name = 'ModelAdapterError';
      this.code = code;
    }
  }

  function getPromptSchemas() {
    if (runtime.PromptSchemas) return runtime.PromptSchemas;
    if (typeof module === 'object' && module.exports && typeof require === 'function') {
      return require('./prompt-schemas.js');
    }
    throw new Error('PromptSchemas is not loaded.');
  }

  function getJsonSchema(schemaId) {
    return getPromptSchemas().getJsonSchema(schemaId);
  }

  function normalizeModelAdapter(value) {
    return Object.values(MODEL_ADAPTER_IDS).includes(value)
      ? value
      : MODEL_ADAPTER_IDS.OPENAI_COMPATIBLE;
  }

  function normalizeStructuredOutputMode(value) {
    return Object.values(STRUCTURED_OUTPUT_MODES).includes(value)
      ? value
      : STRUCTURED_OUTPUT_MODES.PROMPT;
  }

  function buildEndpointUrl(baseUrl, endpoint) {
    const trimmed = String(baseUrl || '').trim().replace(/\/+$/, '');
    const endpointPattern = new RegExp(`/${endpoint.replace('/', '\\/')}$`, 'i');
    if (endpointPattern.test(trimmed)) return trimmed;
    return `${trimmed}/${endpoint}`;
  }

  function buildChatCompletionsUrl(baseUrl) {
    return buildEndpointUrl(baseUrl, 'chat/completions');
  }

  function buildAnthropicMessagesUrl(baseUrl) {
    return buildEndpointUrl(baseUrl, 'messages');
  }

  function parseImageDataUrl(imageDataUrl) {
    const match = /^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(String(imageDataUrl || ''));
    if (!match) throw new ModelAdapterError('image_data_invalid', 'The image data URL is invalid.');
    return {
      mediaType: match[1],
      data: match[2].replace(/\s+/g, '')
    };
  }

  function buildOpenAiCompatibleRequest({ config, compiledPrompt, renderedPrompt, imageDataUrl }) {
    const mode = normalizeStructuredOutputMode(config && config.structuredOutputMode);
    const body = {
      model: config.apiModel,
      temperature: 0.2,
      max_tokens: compiledPrompt.maxOutputTokens,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: renderedPrompt },
            { type: 'image_url', image_url: { url: imageDataUrl } }
          ]
        }
      ]
    };

    if (mode === STRUCTURED_OUTPUT_MODES.JSON_OBJECT) {
      body.response_format = { type: 'json_object' };
    } else if (mode === STRUCTURED_OUTPUT_MODES.JSON_SCHEMA) {
      body.response_format = {
        type: 'json_schema',
        json_schema: {
          name: `promptlens_${compiledPrompt.schemaId}`,
          strict: true,
          schema: getJsonSchema(compiledPrompt.schemaId)
        }
      };
    }

    return {
      url: buildChatCompletionsUrl(config.apiBaseUrl),
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body
    };
  }

  function parseOpenAiCompatibleResponse(responseJson) {
    const choices = responseJson && responseJson.choices;
    if (!Array.isArray(choices) || choices.length === 0) {
      throw new ModelAdapterError('response_choices_missing', 'The API response has no choices.');
    }
    const choice = choices[0] || {};
    const content = choice.message && choice.message.content;
    let text = '';
    if (typeof content === 'string') {
      text = content.trim();
    } else if (Array.isArray(content)) {
      text = content.map(item => item && typeof item.text === 'string' ? item.text : '').join('\n').trim();
    }
    if (!text) throw new ModelAdapterError('response_content_missing', 'The API response has no readable message.content.');
    return {
      text,
      usage: responseJson.usage || null,
      finishReason: String(choice.finish_reason || responseJson.finish_reason || '')
    };
  }

  function buildAnthropicRequest({ config, compiledPrompt, renderedPrompt, imageDataUrl }) {
    const image = parseImageDataUrl(imageDataUrl);
    return {
      url: buildAnthropicMessagesUrl(config.apiBaseUrl),
      headers: {
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: {
        model: config.apiModel,
        temperature: 0.2,
        max_tokens: compiledPrompt.maxOutputTokens,
        tools: [{
          name: ANTHROPIC_TOOL_NAME,
          description: 'Submit the structured PromptLens image-analysis result.',
          input_schema: getJsonSchema(compiledPrompt.schemaId)
        }],
        tool_choice: { type: 'tool', name: ANTHROPIC_TOOL_NAME },
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: renderedPrompt },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: image.mediaType,
                data: image.data
              }
            }
          ]
        }]
      }
    };
  }

  function parseAnthropicResponse(responseJson) {
    const content = responseJson && responseJson.content;
    if (!Array.isArray(content)) {
      throw new ModelAdapterError('response_content_missing', 'The Anthropic response has no content blocks.');
    }
    const toolUse = content.find(item => item && item.type === 'tool_use' && item.name === ANTHROPIC_TOOL_NAME);
    if (!toolUse || !toolUse.input || typeof toolUse.input !== 'object' || Array.isArray(toolUse.input)) {
      throw new ModelAdapterError('response_tool_missing', 'The Anthropic response has no PromptLens tool result.');
    }
    const sourceUsage = responseJson.usage && typeof responseJson.usage === 'object' ? responseJson.usage : null;
    const usage = sourceUsage ? {
      ...sourceUsage,
      prompt_tokens: Number(sourceUsage.input_tokens) || 0,
      completion_tokens: Number(sourceUsage.output_tokens) || 0,
      total_tokens: (Number(sourceUsage.input_tokens) || 0) + (Number(sourceUsage.output_tokens) || 0)
    } : null;
    return {
      text: JSON.stringify(toolUse.input),
      usage,
      finishReason: String(responseJson.stop_reason || '')
    };
  }

  const ADAPTERS = Object.freeze({
    [MODEL_ADAPTER_IDS.OPENAI_COMPATIBLE]: {
      buildRequest: buildOpenAiCompatibleRequest,
      parseResponse: parseOpenAiCompatibleResponse
    },
    [MODEL_ADAPTER_IDS.ANTHROPIC]: {
      buildRequest: buildAnthropicRequest,
      parseResponse: parseAnthropicResponse
    }
  });

  function getAdapter(id) {
    const normalized = normalizeModelAdapter(id);
    const adapter = ADAPTERS[normalized];
    if (normalized !== id || !adapter) throw new Error(`Unsupported model adapter: ${id}`);
    return adapter;
  }

  function buildRequest(id, input) {
    return getAdapter(id).buildRequest(input);
  }

  function parseResponse(id, responseJson) {
    return getAdapter(id).parseResponse(responseJson);
  }

  function usesNativeSchema(id, structuredOutputMode) {
    const adapterId = normalizeModelAdapter(id);
    return adapterId === MODEL_ADAPTER_IDS.ANTHROPIC ||
      normalizeStructuredOutputMode(structuredOutputMode) === STRUCTURED_OUTPUT_MODES.JSON_SCHEMA;
  }

  return {
    ANTHROPIC_TOOL_NAME,
    MODEL_ADAPTER_IDS,
    STRUCTURED_OUTPUT_MODES,
    ModelAdapterError,
    normalizeModelAdapter,
    normalizeStructuredOutputMode,
    buildChatCompletionsUrl,
    buildAnthropicMessagesUrl,
    getJsonSchema,
    usesNativeSchema,
    buildRequest,
    parseResponse
  };
}));
