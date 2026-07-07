const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const optionsHtml = fs.readFileSync(path.join(root, 'options.html'), 'utf8');
const optionsJs = fs.readFileSync(path.join(root, 'options.js'), 'utf8');
const resultJs = fs.readFileSync(path.join(root, 'result.js'), 'utf8');

assert.match(
  optionsHtml,
  /<form id="options-form"[^>]*\bnovalidate\b/,
  'ChatGPT Assist 模式必须绕过 API 字段的浏览器原生 required 校验'
);

assert.match(
  optionsJs,
  /chrome\.storage\.local\.remove\(\[[^\]]*'analysisMode'/s,
  '清空设置必须同时删除 analysisMode'
);

assert.match(
  optionsJs,
  /chrome\.storage\.local\.set\(\{ analysisMode: getAnalysisMode\(\) \}\)/,
  '在摘要页切换分析方式时必须持久化 analysisMode'
);

assert.doesNotMatch(
  resultJs,
  /renderChatGptAssistPanel\(prepared, instruction\);\s*setLoading\(/,
  'ChatGPT Assist 面板渲染后不能再调用 setLoading 隐藏面板'
);

assert.match(
  resultJs,
  /return true;[\s\S]*catch \{[\s\S]*return false;/,
  'copyTextWithFeedback 必须把复制成功或失败返回给调用方'
);

assert.match(
  resultJs,
  /copyTextWithFeedback\(elements\.chatgptCopyInstruction, currentAssistInstruction\)\.then\(copied =>/,
  'ChatGPT Assist 复制按钮必须根据 copyTextWithFeedback 的返回值显示失败提示'
);

assert.doesNotMatch(
  resultJs,
  /isCustomTemplate\(template\) && template\.instruction/,
  'ChatGPT Assist 指令不能只把自定义模板 instruction 追加进去'
);

assert.match(
  resultJs,
  /template && template\.instruction/,
  'ChatGPT Assist 指令必须保留内置非营销模板的 instruction 语义'
);

console.log('chatgpt assist regression tests passed');
