const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const siteRoot = 'https://promptlens.bytewatcher.xyz';
const pages = [
  { file: 'site/index.html', url: `${siteRoot}/`, title: 'PromptLens — Reverse image prompts and visual marketing diagnosis' },
  { file: 'site/privacy/index.html', url: `${siteRoot}/privacy/`, title: 'Privacy Policy — PromptLens' },
  { file: 'site/support/index.html', url: `${siteRoot}/support/`, title: 'Support — PromptLens' }
];
const socialImageUrl = `${siteRoot}/assets/promptlens-result.jpg`;

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

for (const page of pages) {
  const source = read(page.file);
  const pageUrlPattern = escapeRegExp(page.url);
  const socialImagePattern = escapeRegExp(socialImageUrl);
  assert.match(source, new RegExp(`<link rel="canonical" href="${pageUrlPattern}">`), `${page.file} missing canonical`);
  assert.match(source, new RegExp(`<link rel="alternate" hreflang="en" href="${pageUrlPattern}">`), `${page.file} missing en hreflang`);
  assert.match(source, new RegExp(`<link rel="alternate" hreflang="zh-CN" href="${pageUrlPattern}\\?lang=zh-CN">`), `${page.file} missing zh-CN hreflang`);
  assert.match(source, new RegExp(`<link rel="alternate" hreflang="x-default" href="${pageUrlPattern}">`), `${page.file} missing x-default hreflang`);
  for (const property of ['og:type', 'og:title', 'og:description']) {
    assert.match(source, new RegExp(`<meta property="${property}" content="[^"]+">`), `${page.file} missing ${property}`);
  }
  assert.match(source, new RegExp(`<meta property="og:image" content="${socialImagePattern}">`), `${page.file} missing og:image`);
  assert.match(source, new RegExp(`<meta property="og:url" content="${pageUrlPattern}">`), `${page.file} missing og:url`);
  for (const name of ['twitter:card', 'twitter:title', 'twitter:description']) {
    assert.match(source, new RegExp(`<meta name="${name}" content="[^"]+">`), `${page.file} missing ${name}`);
  }
  assert.match(source, new RegExp(`<meta name="twitter:image" content="${socialImagePattern}">`), `${page.file} missing twitter:image`);
  assert.match(source, /<script type="application\/ld\+json">[\s\S]+?<\/script>/, `${page.file} missing JSON-LD`);
  assert.match(source, new RegExp(`"url": "${pageUrlPattern}"`), `${page.file} JSON-LD uses the wrong URL`);
  assert.doesNotMatch(source, /https:\/\/bytewatcher\.xyz/, `${page.file} still references the apex domain`);
}

const index = read('site/index.html');
assert.match(index, /"@type": "SoftwareApplication"/);
assert.match(index, /"downloadUrl": "https:\/\/github\.com\/wildbyteai\/promptlens\/releases"/);
assert.match(index, /"softwareVersion": "0\.6\.0"/);

const robots = read('site/robots.txt');
assert.match(robots, /User-agent: \*/);
assert.match(robots, new RegExp(`Sitemap: ${escapeRegExp(`${siteRoot}/sitemap.xml`)}`));
assert.doesNotMatch(robots, /https:\/\/bytewatcher\.xyz/, 'robots.txt still references the apex domain');

const sitemap = read('site/sitemap.xml');
for (const page of pages) {
  assert.match(sitemap, new RegExp(`<loc>${escapeRegExp(page.url)}</loc>`));
}
assert.doesNotMatch(sitemap, /https:\/\/bytewatcher\.xyz/, 'sitemap.xml still references the apex domain');

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
const officialWebsiteLinkPattern = new RegExp(`<a href="${escapeRegExp(`${siteRoot}/`)}">[^<]+<\\/a>`);

assert.match(readmeEn, officialWebsiteLinkPattern);
assert.match(readmeZhCn, officialWebsiteLinkPattern);
assert.match(readmeZhTw, officialWebsiteLinkPattern);
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
