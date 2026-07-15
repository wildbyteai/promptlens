const assert = require('node:assert/strict');

const adapters = require('../model-adapters.js');
const schemas = require('../prompt-schemas.js');

const compiled = {
  schemaId: 'standard_v1',
  maxOutputTokens: 2100
};
const config = {
  apiBaseUrl: 'https://api.example.com/v1/',
  apiKey: 'secret',
  apiModel: 'vision-model',
  structuredOutputMode: 'prompt'
};

const promptRequest = adapters.buildRequest('openai_compatible', {
  config,
  compiledPrompt: compiled,
  renderedPrompt: 'Analyze visible evidence.',
  imageDataUrl: 'data:image/jpeg;base64,abc'
});
assert.equal(promptRequest.url, 'https://api.example.com/v1/chat/completions');
assert.equal(promptRequest.headers.Authorization, 'Bearer secret');
assert.equal(promptRequest.body.max_tokens, 2100);
assert.equal(promptRequest.body.messages[0].content[0].text, 'Analyze visible evidence.');
assert.equal(promptRequest.body.response_format, undefined);

const jsonObjectRequest = adapters.buildRequest('openai_compatible', {
  config: { ...config, structuredOutputMode: 'json_object' },
  compiledPrompt: compiled,
  renderedPrompt: 'Analyze.',
  imageDataUrl: 'data:image/jpeg;base64,abc'
});
assert.deepEqual(jsonObjectRequest.body.response_format, { type: 'json_object' });

const schemaRequest = adapters.buildRequest('openai_compatible', {
  config: { ...config, structuredOutputMode: 'json_schema' },
  compiledPrompt: compiled,
  renderedPrompt: 'Analyze.',
  imageDataUrl: 'data:image/jpeg;base64,abc'
});
assert.equal(schemaRequest.body.response_format.type, 'json_schema');
assert.equal(schemaRequest.body.response_format.json_schema.strict, true);
assert.ok(schemaRequest.body.response_format.json_schema.schema.required.includes('prompt_variants'));
assert.equal(
  schemaRequest.body.response_format.json_schema.schema.properties.prompt_variants.minItems,
  3
);
assert.equal(schemaRequest.body.response_format.json_schema.schema.properties.json_prompt.additionalProperties, false);

const marketingSchema = adapters.getJsonSchema('marketing_v1');
assert.ok(marketingSchema.required.includes('marketing_diagnosis'));
assert.equal(marketingSchema.properties.marketing_diagnosis.required.includes('next_actions'), true);
const conciseSchema = adapters.getJsonSchema('standard_concise_v1');
assert.equal(conciseSchema.required.includes('prompt_variants'), false);
assert.equal(Object.hasOwn(conciseSchema.properties, 'prompt_variants'), false);
assert.deepEqual(adapters.getJsonSchema('standard_v1'), schemas.getJsonSchema('standard_v1'));

const parsed = adapters.parseResponse('openai_compatible', {
  choices: [{
    finish_reason: 'stop',
    message: { content: [{ type: 'text', text: '{"ok":true}' }] }
  }],
  usage: { total_tokens: 42 }
});
assert.equal(parsed.text, '{"ok":true}');
assert.equal(parsed.finishReason, 'stop');
assert.deepEqual(parsed.usage, { total_tokens: 42 });

const anthropicRequest = adapters.buildRequest('anthropic', {
  config: {
    apiBaseUrl: 'https://api.anthropic.com/v1/',
    apiKey: 'anthropic-secret',
    apiModel: 'claude-sonnet-4-6'
  },
  compiledPrompt: compiled,
  renderedPrompt: 'Analyze visible evidence.',
  imageDataUrl: 'data:image/jpeg;base64,YWJj'
});
assert.equal(anthropicRequest.url, 'https://api.anthropic.com/v1/messages');
assert.equal(anthropicRequest.headers['x-api-key'], 'anthropic-secret');
assert.equal(anthropicRequest.body.tool_choice.name, adapters.ANTHROPIC_TOOL_NAME);
assert.ok(anthropicRequest.body.tools[0].input_schema.required.includes('prompt_variants'));
assert.deepEqual(anthropicRequest.body.messages[0].content[1].source, {
  type: 'base64',
  media_type: 'image/jpeg',
  data: 'YWJj'
});

const anthropicParsed = adapters.parseResponse('anthropic', {
  content: [{
    type: 'tool_use',
    name: adapters.ANTHROPIC_TOOL_NAME,
    input: { prompt_en: 'English prompt' }
  }],
  stop_reason: 'tool_use',
  usage: { input_tokens: 10, output_tokens: 20 }
});
assert.deepEqual(JSON.parse(anthropicParsed.text), { prompt_en: 'English prompt' });
assert.equal(anthropicParsed.finishReason, 'tool_use');
assert.equal(anthropicParsed.usage.prompt_tokens, 10);
assert.equal(anthropicParsed.usage.completion_tokens, 20);
assert.equal(anthropicParsed.usage.total_tokens, 30);
assert.equal(adapters.usesNativeSchema('anthropic', 'prompt'), true);
assert.equal(adapters.usesNativeSchema('openai_compatible', 'prompt'), false);
assert.equal(adapters.usesNativeSchema('openai_compatible', 'json_schema'), true);

assert.throws(
  () => adapters.buildRequest('unknown', {}),
  /Unsupported model adapter/
);
assert.throws(
  () => adapters.parseResponse('anthropic', { content: [{ type: 'text', text: '{}' }] }),
  error => error instanceof adapters.ModelAdapterError && error.code === 'response_tool_missing'
);

console.log('model adapter tests passed');
