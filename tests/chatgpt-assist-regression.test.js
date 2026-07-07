const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const optionsHtml = fs.readFileSync(path.join(root, 'options.html'), 'utf8');
const optionsJs = fs.readFileSync(path.join(root, 'options.js'), 'utf8');
const resultJs = fs.readFileSync(path.join(root, 'result.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

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
  /function renderChatGptAssistPanel[\s\S]*loadingPanel\.hidden = true;[\s\S]*elements\.chatgptAssistCard\.hidden = false;/,
  'ChatGPT Assist 面板显示时必须关闭 loading panel'
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

const requiredAssistPromptText = [
  '如果当前对话中没有实际附加图片，请先提醒我上传图片，不要凭空分析。',
  '不要识别真实人物身份',
  '不要推断年龄、种族、健康、政治、宗教、财务状况等敏感属性',
  '如果图片中有文字，只描述清晰可读的文字',
  '请不要输出 JSON，也不要输出 prompt_en、prompt_zh、prompt_tags、negative_prompt、json_prompt 或 prompt_variants 等字段名',
  '请用清晰的 Markdown 二级标题输出以上 7 个部分',
  '涉及目标人群、卖点、转化风险、商业意图时，请使用“可能”“看起来”“从画面推测”等谨慎措辞'
];

for (const text of requiredAssistPromptText) {
  assert.match(resultJs, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `ChatGPT Assist 指令缺少约束：${text}`);
}

assert.match(
  stylesCss,
  /\.chatgpt-assist-card \{[\s\S]*display: grid;[\s\S]*gap: 14px;/,
  'ChatGPT Assist 卡片内部元素需要有稳定间距，避免状态、标题和文本框挤在一起'
);

assert.match(
  stylesCss,
  /\.settings-form \+ \.settings-block,[\s\S]*\.settings-block \+ \.settings-block,[\s\S]*\.provider-recipes \+ \.settings-block \{[\s\S]*margin-top: 14px;/,
  '设置页连续 settings-block 之间需要明确间距'
);

assert.match(
  stylesCss,
  /\.provider-recipes \+ \.settings-block \{[\s\S]*margin-top: 14px;/,
  'Provider 示例和本地历史记录之间需要明确间距'
);

console.log('chatgpt assist regression tests passed');
