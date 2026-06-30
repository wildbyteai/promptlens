(function () {
  'use strict';

  const DB_NAME = 'promptlens';
  const DB_VERSION = 2;
  const STORE_NAME = 'history-items';
  const MAX_HISTORY_ITEMS = 200;

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('pending-payloads')) {
          db.createObjectStore('pending-payloads');
        }
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function isHistoryEnabled() {
    const stored = await chrome.storage.local.get({ historyEnabled: false });
    return Boolean(stored.historyEnabled);
  }

  async function setHistoryEnabled(enabled) {
    await chrome.storage.local.set({ historyEnabled: Boolean(enabled) });
  }

  async function addHistoryItem(item) {
    if (!await isHistoryEnabled()) return false;
    const db = await openDB();
    const record = {
      id: item.id || makeId(),
      createdAt: item.createdAt || Date.now(),
      sourceDomain: item.sourceDomain || '',
      inputType: item.inputType || 'unknown',
      templateId: item.templateId || '',
      templateName: item.templateName || '',
      promptEn: item.promptEn || '',
      promptTags: Array.isArray(item.promptTags) ? item.promptTags : [],
      result: item.result || {}
    };

    await txDone(db, STORE_NAME, 'readwrite', store => store.put(record));
    await pruneHistory();
    return true;
  }

  async function listHistoryItems() {
    const db = await openDB();
    const items = await txDone(db, STORE_NAME, 'readonly', store => store.getAll());
    return items.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  }

  async function deleteHistoryItem(id) {
    const db = await openDB();
    await txDone(db, STORE_NAME, 'readwrite', store => store.delete(id));
  }

  async function clearHistory() {
    const db = await openDB();
    await txDone(db, STORE_NAME, 'readwrite', store => store.clear());
  }

  async function pruneHistory() {
    const items = await listHistoryItems();
    const overflow = items.slice(MAX_HISTORY_ITEMS);
    if (!overflow.length) return;
    const db = await openDB();
    await txDone(db, STORE_NAME, 'readwrite', store => {
      overflow.forEach(item => store.delete(item.id));
    });
  }

  function txDone(db, storeName, mode, action) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const request = action(store);
      let result;
      if (request && typeof request === 'object') {
        request.onsuccess = () => {
          result = request.result;
        };
        request.onerror = () => reject(request.error);
      }
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  function makeId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }

  function sourceDomainFromUrl(urlString) {
    try {
      const url = new URL(urlString || '');
      return url.hostname;
    } catch {
      return '';
    }
  }

  window.PromptHistory = {
    MAX_HISTORY_ITEMS,
    isHistoryEnabled,
    setHistoryEnabled,
    addHistoryItem,
    listHistoryItems,
    deleteHistoryItem,
    clearHistory,
    sourceDomainFromUrl
  };
}());
