const historyStatus = document.getElementById('history-status');
const historyDisabledBanner = document.getElementById('history-disabled-banner');
const historySearch = document.getElementById('history-search');
const historyList = document.getElementById('history-list');
const refreshHistoryButton = document.getElementById('refresh-history');
const clearHistoryButton = document.getElementById('clear-history-page');

let allItems = [];

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function truncateText(value, maxLength = 140) {
  const text = normalizeString(value).replace(/\s+/g, ' ');
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function getHistoryPromptSummary(item) {
  const result = item && item.result && typeof item.result === 'object' ? item.result : {};
  return truncateText(
    normalizeString(item && item.promptZh) ||
    normalizeString(result.prompt_zh) ||
    normalizeString(item && item.promptEn) ||
    normalizeString(result.prompt_en) ||
    '暂无提示词摘要'
  );
}

function getHistoryVisibleTags(item, limit = 5) {
  const result = item && item.result && typeof item.result === 'object' ? item.result : {};
  const source = Array.isArray(item && item.promptTags) && item.promptTags.length ? item.promptTags : result.prompt_tags;
  return Array.isArray(source) ? source.filter(tag => typeof tag === 'string' && tag.trim()).map(tag => tag.trim()).slice(0, limit) : [];
}

function getInputTypeLabel(inputType) {
  const labels = {
    image_url: '图片 URL',
    screenshot_selection: '框选截图',
    selection: '框选截图',
    data_url: 'Data URL'
  };
  return labels[inputType] || inputType || '未知输入';
}

function setStatus(text, tone = 'neutral') {
  historyStatus.textContent = text;
  historyStatus.dataset.tone = tone;
}

function itemMatches(item, query) {
  if (!query) return true;
  const tags = Array.isArray(item.promptTags) ? item.promptTags.join(' ') : '';
  const haystack = [
    item.sourceDomain,
    item.templateName,
    item.promptEn,
    item.imageUrl,
    item.pageUrl,
    tags,
    JSON.stringify(item.result || {})
  ].join(' ').toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function createCopyButton(label, getText, className = 'copy-button') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.addEventListener('click', async event => {
    event.preventDefault();
    event.stopPropagation();

    const oldText = button.textContent;
    try {
      await navigator.clipboard.writeText(getText());
      button.textContent = '已复制';
    } catch {
      button.textContent = '复制失败';
    }
    window.setTimeout(() => { button.textContent = oldText; }, 1200);
  });
  return button;
}

function createSummaryTags(tags) {
  const tagList = document.createElement('div');
  tagList.className = 'history-summary-tags';
  tags.forEach(tag => {
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = tag;
    tagList.appendChild(badge);
  });
  return tagList;
}

function createHistorySummary(item) {
  const summary = document.createElement('div');
  summary.className = 'history-summary';

  const text = document.createElement('p');
  text.className = 'history-summary-text';
  text.textContent = getHistoryPromptSummary(item);
  summary.appendChild(text);

  const tags = getHistoryVisibleTags(item);
  if (tags.length) {
    summary.appendChild(createSummaryTags(tags));
  }

  return summary;
}

function createFieldHeader(label, copyText) {
  const header = document.createElement('div');
  header.className = 'card-title-row history-field-header';

  const title = document.createElement('h3');
  title.textContent = label;
  header.appendChild(title);

  if (copyText) {
    header.appendChild(createCopyButton('复制', () => copyText));
  }

  return header;
}

function createPromptField(field) {
  const section = document.createElement('section');
  const isPrimary = field.emphasis === 'primary';
  section.className = `result-card history-field history-field-card history-field--${field.kind || 'text'}${isPrimary ? ' result-card-primary history-field--primary' : ''}`;

  const kicker = document.createElement('span');
  kicker.className = 'card-kicker';
  kicker.textContent = isPrimary ? '主要输出' : '提示词详情';

  const titleWrap = document.createElement('div');
  titleWrap.append(kicker, createFieldHeader(field.label, field.value));

  const value = document.createElement('pre');
  value.textContent = field.value;

  section.append(titleWrap, value);
  return section;
}

function createTagsField(field) {
  const section = document.createElement('section');
  section.className = 'result-card history-field history-field-card history-field--tags';
  section.appendChild(createFieldHeader(field.label, field.value));

  const tags = field.value.split(',').map(tag => tag.trim()).filter(Boolean);
  const tagList = document.createElement('div');
  tagList.className = 'history-tag-list';

  tags.forEach(tag => {
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = tag;
    tagList.appendChild(badge);
  });

  if (!tags.length) {
    const empty = document.createElement('p');
    empty.className = 'history-empty-field';
    empty.textContent = '暂无标签';
    section.appendChild(empty);
  } else {
    section.appendChild(tagList);
  }

  return section;
}

function openUrl(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function createUrlField(field) {
  const isPage = field.key === 'pageUrl';
  const section = document.createElement('section');
  section.className = 'result-card history-field history-field-card history-url-card';

  const header = document.createElement('div');
  header.className = 'card-title-row history-field-header';
  const title = document.createElement('h3');
  title.textContent = field.label;
  const actions = document.createElement('div');
  actions.className = 'button-row history-url-actions';

  const openButton = document.createElement('button');
  openButton.type = 'button';
  openButton.className = 'copy-button';
  openButton.textContent = isPage ? '打开页面' : '打开图片';
  openButton.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    openUrl(field.value);
  });

  actions.append(openButton, createCopyButton('复制 URL', () => field.value));
  header.append(title, actions);

  const urlText = document.createElement('p');
  urlText.className = 'history-url-text';
  urlText.textContent = field.value;

  section.append(header, urlText);
  return section;
}

function createCollapsedField(field) {
  if (field.kind === 'url') {
    const details = document.createElement('details');
    details.className = 'result-card raw-card history-field history-debug-card history-url-details';
    const summary = document.createElement('summary');
    const title = document.createElement('span');
    title.textContent = field.label;
    summary.append(title, createCopyButton('复制 URL', () => field.value));
    details.append(summary, createUrlField(field));
    return details;
  }

  const details = document.createElement('details');
  details.className = `result-card code-card raw-card history-field history-debug-card history-field--${field.kind || 'code'}`;

  const summary = document.createElement('summary');
  const title = document.createElement('span');
  title.textContent = field.label;
  summary.append(title, createCopyButton('复制', () => field.value));

  const value = document.createElement('pre');
  value.textContent = field.value;

  details.append(summary, value);
  return details;
}

function appendFieldCards(body, fields) {
  const imageUrl = fields.find(field => field.key === 'imageUrl');
  if (imageUrl && imageUrl.value) {
    body.appendChild(createUrlField(imageUrl));
  }

  const promptEn = fields.find(field => field.key === 'promptEn');
  if (promptEn && promptEn.value) {
    body.appendChild(createPromptField(promptEn));
  }

  const promptZh = fields.find(field => field.key === 'promptZh');
  if (promptZh && promptZh.value) {
    body.appendChild(createPromptField(promptZh));
  }

  const compactRow = document.createElement('div');
  compactRow.className = 'result-card-row history-compact-row';

  const tags = fields.find(field => field.key === 'tags');
  if (tags && tags.value) {
    compactRow.appendChild(createTagsField(tags));
  }

  const negativePrompt = fields.find(field => field.key === 'negativePrompt');
  if (negativePrompt && negativePrompt.value) {
    compactRow.appendChild(createPromptField(negativePrompt));
  }

  if (compactRow.children.length) {
    body.appendChild(compactRow);
  }

  fields
    .filter(field => field.value && field.collapsed)
    .forEach(field => body.appendChild(createCollapsedField(field)));

  fields
    .filter(field => field.value && !field.collapsed && !['imageUrl', 'promptEn', 'promptZh', 'tags', 'negativePrompt'].includes(field.key))
    .forEach(field => body.appendChild(createPromptField(field)));
}

function renderItems() {
  const query = historySearch.value.trim();
  const items = allItems.filter(item => itemMatches(item, query));
  historyList.replaceChildren();

  if (!items.length) {
    const empty = document.createElement('article');
    empty.className = 'surface-card';
    empty.textContent = query ? '没有匹配的历史记录。' : '暂无历史记录。请先在设置中开启本地历史记录。';
    historyList.appendChild(empty);
    setStatus(`${items.length} 条记录`, 'neutral');
    return;
  }

  items.forEach(item => {
    const article = document.createElement('article');
    article.className = 'result-card history-item';

    const header = document.createElement('div');
    header.className = 'card-title-row history-item-header';

    const titleBox = document.createElement('div');
    const kicker = document.createElement('span');
    kicker.className = 'card-kicker';
    kicker.textContent = item.templateName || '未知模板';
    const title = document.createElement('h2');
    title.textContent = item.sourceDomain || '未知来源';
    const meta = document.createElement('p');
    meta.className = 'history-meta';
    const inputType = item.inputType ? ` · ${getInputTypeLabel(item.inputType)}` : '';
    meta.textContent = `${new Date(item.createdAt).toLocaleString()}${inputType}`;
    titleBox.append(kicker, title, meta);

    const actions = document.createElement('div');
    actions.className = 'button-row history-actions';
    const copyButton = createCopyButton('复制全部', () => window.PromptHistoryFormat.buildHistoryCopyText(item));

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'copy-button history-delete';
    deleteButton.textContent = '删除';
    deleteButton.addEventListener('click', async () => {
      await window.PromptHistory.deleteHistoryItem(item.id);
      await loadHistory();
    });
    actions.append(copyButton, deleteButton);
    header.append(titleBox, actions);

    article.appendChild(header);
    article.appendChild(createHistorySummary(item));

    const details = document.createElement('details');
    details.className = 'history-detail-toggle';
    const detailSummary = document.createElement('summary');
    detailSummary.textContent = '查看完整内容';
    details.appendChild(detailSummary);

    const body = document.createElement('div');
    body.className = 'history-body';
    appendFieldCards(body, window.PromptHistoryFormat.getHistoryDisplayFields(item));
    details.appendChild(body);

    article.appendChild(details);
    historyList.appendChild(article);
  });

  setStatus(`${items.length} / ${allItems.length} 条记录`, 'success');
}

async function loadHistory() {
  historyDisabledBanner.hidden = await window.PromptHistory.isHistoryEnabled();
  allItems = await window.PromptHistory.listHistoryItems();
  renderItems();
}

historySearch.addEventListener('input', renderItems);
refreshHistoryButton.addEventListener('click', () => {
  loadHistory().catch(error => setStatus(`读取失败：${error.message}`, 'error'));
});
clearHistoryButton.addEventListener('click', () => {
  window.PromptHistory.clearHistory().then(loadHistory).catch(error => setStatus(`清空失败：${error.message}`, 'error'));
});

loadHistory().catch(error => setStatus(`读取失败：${error.message}`, 'error'));

if (typeof module === 'object' && module.exports) {
  module.exports = {
    getHistoryPromptSummary,
    getHistoryVisibleTags,
    getInputTypeLabel
  };
}
