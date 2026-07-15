const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const allowedProfessionalText = new Set(['P', 'PromptLens', 'API Key', 'Base URL', 'AI Base URL', 'Model']);
const runtimeFiles = [
  'background.js',
  'content.js',
  'history-format.js',
  'history.js',
  'i18n.js',
  'marketing-diagnosis.js',
  'options.js',
  'prompt-variants.js',
  'result-format.js',
  'result.js',
  'templates.js'
];

const literalUiPatterns = [
  /\.textContent\s*=\s*(['"`])([^'"`]+)\1/g,
  /\b(?:showError|showBanner|showAssistStatus|setLoading|setStatus)\(\s*(['"`])([^'"`]+)\1/g
];

for (const file of runtimeFiles) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  for (const pattern of literalUiPatterns) {
    const matches = [...source.matchAll(pattern)]
      .map(match => match[2].trim())
      .filter(value => value && !value.includes('${'));
    assert.deepEqual(matches, [], `${file} contains user-visible literal copy outside the locale catalogs: ${matches.join(' | ')}`);
  }
}

for (const file of ['options.html', 'result.html', 'history.html']) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');

  for (const match of source.matchAll(/<([a-z][^>]*)>([^<>]*[A-Za-z\u4e00-\u9fff][^<>]*)</gi)) {
    const openingTag = match[1];
    const text = match[2].trim();
    if (!text || allowedProfessionalText.has(text)) continue;
    assert.match(openingTag, /\bdata-i18n=/, `${file} contains unmarked visible text: ${text}`);
  }

  for (const [attribute, marker] of [
    ['placeholder', 'data-i18n-placeholder'],
    ['aria-label', 'data-i18n-aria-label'],
    ['title', 'data-i18n-title'],
    ['alt', 'data-i18n-alt']
  ]) {
    const pattern = new RegExp(`<[^>]+\\b${attribute}="[^"]*[A-Za-z\\u4e00-\\u9fff][^"]*"[^>]*>`, 'gi');
    for (const match of source.matchAll(pattern)) {
      if (attribute === 'placeholder' && /\bid="(?:api-base-url|api-key|api-model|max-image-side|jpeg-quality)"/.test(match[0])) {
        continue;
      }
      assert.match(match[0], new RegExp(`\\b${marker}=`), `${file} contains an unlocalized ${attribute} attribute: ${match[0]}`);
    }
  }
}

console.log('user-visible copy localization tests passed');
