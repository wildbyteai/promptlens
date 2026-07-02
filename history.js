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
    tags,
    JSON.stringify(item.result || {})
  ].join(' ').toLowerCase();
  return haystack.includes(query.toLowerCase());
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
    header.className = 'card-title-row';

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
    actions.className = 'button-row';
    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.className = 'copy-button';
    copyButton.textContent = '复制全部';
    copyButton.addEventListener('click', async () => {
      const copyText = window.PromptHistoryFormat.buildHistoryCopyText(item);

      const oldText = copyButton.textContent;
      try {
        await navigator.clipboard.writeText(copyText);
        copyButton.textContent = '已复制';
      } catch {
        copyButton.textContent = '复制失败';
      }
      window.setTimeout(() => { copyButton.textContent = oldText; }, 1200);
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'copy-button';
    deleteButton.textContent = '删除';
    deleteButton.addEventListener('click', async () => {
      await window.PromptHistory.deleteHistoryItem(item.id);
      await loadHistory();
    });
    actions.append(copyButton, deleteButton);
    header.append(titleBox, actions);

    const fieldList = document.createElement('div');
    fieldList.className = 'history-field-list';
    window.PromptHistoryFormat.getHistoryDisplayFields(item).forEach(field => {
      if (!field.value) return;
      const section = document.createElement('section');
      section.className = `history-field history-field--${field.kind || 'text'}`;

      const label = document.createElement('h3');
      label.textContent = field.label;
      const value = document.createElement('pre');
      value.textContent = field.value;

      section.append(label, value);
      fieldList.appendChild(section);
    });

    article.append(header, fieldList);
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
