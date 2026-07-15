const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const zhCatalog = JSON.parse(fs.readFileSync(path.join(root, '_locales/zh_CN/messages.json'), 'utf8'));
const enCatalog = JSON.parse(fs.readFileSync(path.join(root, '_locales/en/messages.json'), 'utf8'));

function placeholders(message) {
  return [...String(message).matchAll(/\{\{([A-Z0-9_]+)\}\}/gi)]
    .map(match => match[1].toLowerCase())
    .sort();
}

const zhKeys = Object.keys(zhCatalog).sort();
const enKeys = Object.keys(enCatalog).sort();
assert.deepEqual(enKeys, zhKeys, 'Chinese and English catalogs must contain the same keys');

for (const key of zhKeys) {
  assert.equal(typeof zhCatalog[key].message, 'string', `${key} Chinese message must be a string`);
  assert.equal(typeof enCatalog[key].message, 'string', `${key} English message must be a string`);
  assert.ok(zhCatalog[key].message.trim(), `${key} Chinese message must not be empty`);
  assert.ok(enCatalog[key].message.trim(), `${key} English message must not be empty`);
  assert.deepEqual(
    placeholders(enCatalog[key].message),
    placeholders(zhCatalog[key].message),
    `${key} placeholders must match across catalogs`
  );
}

for (const file of [
  'background.js',
  'history-format.js',
  'history.js',
  'marketing-diagnosis.js',
  'options.js',
  'prompt-variants.js',
  'result-format.js',
  'result.js',
  'templates.js'
]) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const referencedKeys = [...source.matchAll(/(?:\bt|localizedError|setLocalizedLoading|showLocalizedAssistStatus|showLocalizedConfigStatus|showLocalizedPermStatus|showConfigActionError|showPermActionError)\('([^']+)'/g)].map(match => match[1]);
  for (const key of referencedKeys) {
    assert.ok(zhCatalog[key], `${file} references missing Chinese message: ${key}`);
    assert.ok(enCatalog[key], `${file} references missing English message: ${key}`);
  }
}

const stored = {};
globalThis.chrome = {
  storage: {
    local: {
      get: async defaults => ({ ...defaults, ...stored }),
      set: async values => Object.assign(stored, values)
    },
    onChanged: {
      addListener: () => {}
    }
  },
  runtime: {
    getURL: value => value
  }
};

const i18n = require('../i18n.js');

(async () => {
  await i18n.init({ catalogs: { 'zh-CN': zhCatalog, en: enCatalog }, watch: false });
  assert.equal(i18n.getLanguage(), 'zh-CN', 'missing uiLanguage must default to Simplified Chinese');

  stored.uiLanguage = 'invalid-language';
  await i18n.init({ catalogs: { 'zh-CN': zhCatalog, en: enCatalog }, watch: false });
  assert.equal(i18n.getLanguage(), 'zh-CN', 'invalid stored uiLanguage must default to Simplified Chinese');

  await i18n.init({
    catalogs: {
      'zh-CN': zhCatalog,
      en: enCatalog
    },
    language: 'invalid-language',
    persist: false,
    watch: false
  });

  assert.equal(i18n.getLanguage(), 'zh-CN');
  assert.equal(i18n.t('extDescription'), zhCatalog.extDescription.message);

  let notifiedLanguage = null;
  const unsubscribe = i18n.onChange(language => { notifiedLanguage = language; });
  await i18n.setLanguage('en');
  assert.equal(i18n.getLanguage(), 'en');
  assert.equal(stored.uiLanguage, 'en');
  assert.equal(notifiedLanguage, 'en');
  assert.equal(i18n.t('extDescription'), enCatalog.extDescription.message);
  unsubscribe();

  await i18n.setLanguage('invalid-language', { persist: false });
  assert.equal(i18n.getLanguage(), 'zh-CN');

  const testCatalogs = {
    'zh-CN': { greeting: { message: '你好，{{NAME}}！' }, fallbackOnly: { message: '中文回退' } },
    en: { greeting: { message: 'Hello, {{NAME}}!' } }
  };
  await i18n.init({ catalogs: testCatalogs, language: 'en', persist: false, watch: false });
  assert.equal(i18n.t('greeting', { name: 'PromptLens' }), 'Hello, PromptLens!');
  assert.equal(i18n.t('fallbackOnly'), '中文回退');
  assert.equal(i18n.t('missingKey'), 'missingKey');
  const localizedError = i18n.createError('greeting', { name: 'Error' });
  assert.equal(localizedError.message, 'Hello, Error!');
  assert.equal(localizedError.i18nKey, 'greeting');
  assert.deepEqual(localizedError.i18nParams, { name: 'Error' });

  const translatedNode = { textContent: '', dataset: { i18n: 'greeting' } };
  const placeholderNode = {
    dataset: { i18nPlaceholder: 'greeting' },
    setAttribute(name, value) { this[name] = value; }
  };
  const fakeRoot = {
    querySelectorAll(selector) {
      if (selector === '[data-i18n]') return [translatedNode];
      if (selector === '[data-i18n-placeholder]') return [placeholderNode];
      return [];
    }
  };
  i18n.apply(fakeRoot, { name: 'World' });
  assert.equal(translatedNode.textContent, 'Hello, World!');
  assert.equal(placeholderNode.placeholder, 'Hello, World!');

  const rootNode = {
    textContent: '',
    dataset: { i18n: 'greeting' },
    matches: selector => selector === '[data-i18n]',
    querySelectorAll: () => []
  };
  i18n.apply(rootNode, { name: 'Root' });
  assert.equal(rootNode.textContent, 'Hello, Root!');

  console.log('i18n tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
