const historyStatus = document.getElementById('history-status');
const historyDisabledBanner = document.getElementById('history-disabled-banner');
const historySearch = document.getElementById('history-search');
const historyList = document.getElementById('history-list');
const refreshHistoryButton = document.getElementById('refresh-history');
const clearHistoryButton = document.getElementById('clear-history-page');

let allItems = [];

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
  kicker.textContent = isPrimary ? 'Main output' : 'Prompt detail';

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
    kicker.textContent = item.templateName || 'Unknown Template';
    const title = document.createElement('h2');
    title.textContent = item.sourceDomain || '未知来源';
    const meta = document.createElement('p');
    meta.className = 'history-meta';
    const inputType = item.inputType ? ` · ${item.inputType}` : '';
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

    const body = document.createElement('div');
    body.className = 'history-body';
    appendFieldCards(body, window.PromptHistoryFormat.getHistoryDisplayFields(item));

    article.append(header, body);
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
