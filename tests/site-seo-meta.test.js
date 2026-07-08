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
assert.match(i18n, /ChatGPT Plus Assist handoff/);
assert.match(index, /promptlens-chatgpt-assist\.jpg/);

const readmeEn = read('README.md');
const readmeZhCn = read('README.zh-CN.md');
const readmeZhTw = read('README.zh-TW.md');
const security = read('SECURITY.md');
const privacyPractices = read('docs/chrome-web-store/privacy-practices.md');

assert.match(readmeEn, /implemented v0\.6\.0:[\s\S]*ChatGPT Plus Assist[\s\S]*experimental ChatGPT handoff/i);
assert.match(readmeEn, /wait for the ChatGPT page to settle[\s\S]*attempt to attach the image and fill the instruction/i);
assert.match(readmeZhCn, /已落地到 v0\.6\.0：[\s\S]*ChatGPT Plus 辅助模式[\s\S]*实验性 ChatGPT 交接/);
assert.match(readmeZhCn, /等待 ChatGPT 页面稳定[\s\S]*尝试附加图片并填入指令/);
assert.match(readmeZhTw, /已落地到 v0\.6\.0：[\s\S]*ChatGPT Plus 輔助模式[\s\S]*實驗性 ChatGPT 交接/);
assert.match(readmeZhTw, /等待 ChatGPT 頁面穩定[\s\S]*嘗試附加圖片並填入指令/);
assert.doesNotMatch(readmeEn, /implemented v0\.5\.0:/);
assert.doesNotMatch(readmeZhCn, /已落地到 v0\.5\.0：/);
assert.doesNotMatch(readmeZhTw, /已落地到 v0\.5\.0：/);

for (const source of [security, privacyPractices]) {
  assert.match(source, /可选的 `(?:https:\/\/)?chatgpt\.com(?:\/\*)?` 权限|optional (?:access to )?`(?:https:\/\/)?chatgpt\.com(?:\/\*)?`/i);
  assert.doesNotMatch(source, /不新增 `chatgpt\.com` 权限|does not add `chatgpt\.com` permissions/i);
}

console.log('site SEO meta tests passed');
