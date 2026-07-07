const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const siteRoot = 'https://bytewatcher.xyz';
const pages = [
  { file: 'site/index.html', url: `${siteRoot}/`, title: 'PromptLens — Reverse image prompts and visual marketing diagnosis' },
  { file: 'site/privacy/index.html', url: `${siteRoot}/privacy/`, title: 'Privacy Policy — PromptLens' },
  { file: 'site/support/index.html', url: `${siteRoot}/support/`, title: 'Support — PromptLens' }
];

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

for (const page of pages) {
  const source = read(page.file);
  assert.match(source, new RegExp(`<link rel="canonical" href="${page.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`), `${page.file} missing canonical`);
  assert.match(source, /<link rel="alternate" hreflang="en" href="https:\/\/bytewatcher\.xyz\/?(?:privacy\/|support\/)?">/, `${page.file} missing en hreflang`);
  assert.match(source, /<link rel="alternate" hreflang="zh-CN" href="https:\/\/bytewatcher\.xyz\/?(?:privacy\/|support\/)?\?lang=zh-CN">/, `${page.file} missing zh-CN hreflang`);
  assert.match(source, /<link rel="alternate" hreflang="x-default" href="https:\/\/bytewatcher\.xyz\/?(?:privacy\/|support\/)?">/, `${page.file} missing x-default hreflang`);
  for (const property of ['og:type', 'og:title', 'og:description', 'og:image', 'og:url']) {
    assert.match(source, new RegExp(`<meta property="${property}" content="[^"]+">`), `${page.file} missing ${property}`);
  }
  for (const name of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
    assert.match(source, new RegExp(`<meta name="${name}" content="[^"]+">`), `${page.file} missing ${name}`);
  }
  assert.match(source, /<script type="application\/ld\+json">[\s\S]+?<\/script>/, `${page.file} missing JSON-LD`);
}

const index = read('site/index.html');
assert.match(index, /"@type": "SoftwareApplication"/);
assert.match(index, /"downloadUrl": "https:\/\/github\.com\/wildbyteai\/promptlens\/releases"/);
assert.match(index, /"softwareVersion": "0\.6\.0"/);

const robots = read('site/robots.txt');
assert.match(robots, /User-agent: \*/);
assert.match(robots, /Sitemap: https:\/\/bytewatcher\.xyz\/sitemap\.xml/);

const sitemap = read('site/sitemap.xml');
for (const page of pages) {
  assert.match(sitemap, new RegExp(`<loc>${page.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc>`));
}

const i18n = read('site/assets/i18n.js');
assert.match(i18n, /PromptLens — Reverse image prompts and visual marketing diagnosis/);
assert.match(i18n, /PromptLens — 图片反推提示词与视觉营销诊断/);

console.log('site SEO meta tests passed');
