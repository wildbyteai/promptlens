(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.PromptLensI18n = api;
}(typeof globalThis !== 'undefined' ? globalThis : window, function (root) {
  'use strict';

  const STORAGE_KEY = 'uiLanguage';
  const DEFAULT_LANGUAGE = 'zh-CN';
  const SUPPORTED_LANGUAGES = Object.freeze(['zh-CN', 'en']);
  const LOCALE_FOLDERS = Object.freeze({ 'zh-CN': 'zh_CN', en: 'en' });

  let currentLanguage = DEFAULT_LANGUAGE;
  let catalogs = {};
  let storageWatcherInstalled = false;
  let activationVersion = 0;
  const listeners = new Set();

  function normalizeLanguage(value) {
    return SUPPORTED_LANGUAGES.includes(value) ? value : DEFAULT_LANGUAGE;
  }

  function catalogMessage(language, key) {
    const entry = catalogs[language] && catalogs[language][key];
    return entry && typeof entry.message === 'string' ? entry.message : '';
  }

  function interpolate(message, params = {}) {
    const normalized = Object.fromEntries(
      Object.entries(params || {}).map(([key, value]) => [String(key).toLowerCase(), String(value)])
    );
    return String(message).replace(/\{\{([A-Z0-9_]+)\}\}/gi, (match, name) => {
      const key = String(name).toLowerCase();
      return Object.prototype.hasOwnProperty.call(normalized, key) ? normalized[key] : match;
    });
  }

  function t(key, params = {}) {
    const message = catalogMessage(currentLanguage, key) || catalogMessage(DEFAULT_LANGUAGE, key) || key;
    return interpolate(message, params);
  }

  function createError(key, params = {}) {
    const error = new Error(t(key, params));
    error.i18nKey = key;
    error.i18nParams = params;
    return error;
  }

  async function loadCatalog(language) {
    if (catalogs[language]) return catalogs[language];
    const folder = LOCALE_FOLDERS[language] || LOCALE_FOLDERS[DEFAULT_LANGUAGE];
    const relativePath = `_locales/${folder}/messages.json`;
    const url = root.chrome && root.chrome.runtime && typeof root.chrome.runtime.getURL === 'function'
      ? root.chrome.runtime.getURL(relativePath)
      : relativePath;
    const response = await root.fetch(url);
    if (!response.ok) throw new Error(`Unable to load locale catalog: ${language}`);
    const catalog = await response.json();
    catalogs[language] = catalog;
    return catalog;
  }

  async function readStoredLanguage() {
    if (!root.chrome || !root.chrome.storage || !root.chrome.storage.local) return DEFAULT_LANGUAGE;
    const stored = await root.chrome.storage.local.get({ [STORAGE_KEY]: DEFAULT_LANGUAGE });
    return normalizeLanguage(stored[STORAGE_KEY]);
  }

  async function activateLanguage(value, notify = true) {
    const version = ++activationVersion;
    const language = normalizeLanguage(value);
    await loadCatalog(DEFAULT_LANGUAGE);
    await loadCatalog(language);
    if (version !== activationVersion) return currentLanguage;
    const changed = currentLanguage !== language;
    currentLanguage = language;
    if (root.document) apply(root.document);
    if (notify && changed) {
      listeners.forEach(listener => {
        try {
          listener(language);
        } catch {
          // One page listener must not block other localization subscribers.
        }
      });
    }
    return language;
  }

  function installStorageWatcher() {
    if (storageWatcherInstalled || !root.chrome || !root.chrome.storage || !root.chrome.storage.onChanged) return;
    root.chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local' || !changes[STORAGE_KEY]) return;
      activateLanguage(changes[STORAGE_KEY].newValue).catch(() => {});
    });
    storageWatcherInstalled = true;
  }

  async function init(options = {}) {
    if (options.catalogs) catalogs = { ...options.catalogs };
    const language = normalizeLanguage(
      Object.prototype.hasOwnProperty.call(options, 'language') ? options.language : await readStoredLanguage()
    );
    await activateLanguage(language, false);
    if (options.watch !== false) installStorageWatcher();
    return currentLanguage;
  }

  async function setLanguage(value, options = {}) {
    const language = normalizeLanguage(value);
    if (options.persist !== false && root.chrome && root.chrome.storage && root.chrome.storage.local) {
      await root.chrome.storage.local.set({ [STORAGE_KEY]: language });
    }
    return activateLanguage(language);
  }

  function getLanguage() {
    return currentLanguage;
  }

  function queryAll(rootNode, selector) {
    if (!rootNode) return [];
    const matchesRoot = typeof rootNode.matches === 'function' && rootNode.matches(selector) ? [rootNode] : [];
    const descendants = typeof rootNode.querySelectorAll === 'function' ? Array.from(rootNode.querySelectorAll(selector)) : [];
    return [...matchesRoot, ...descendants];
  }

  function apply(rootNode, params = {}) {
    queryAll(rootNode, '[data-i18n]').forEach(element => {
      element.textContent = t(element.dataset.i18n, params);
    });
    [
      ['placeholder', 'i18nPlaceholder'],
      ['aria-label', 'i18nAriaLabel'],
      ['title', 'i18nTitle'],
      ['alt', 'i18nAlt']
    ].forEach(([attribute, datasetKey]) => {
      queryAll(rootNode, `[data-${datasetKey.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}]`).forEach(element => {
        element.setAttribute(attribute, t(element.dataset[datasetKey], params));
      });
    });
    if (root.document && root.document.documentElement) {
      root.document.documentElement.lang = currentLanguage;
    }
  }

  function onChange(listener) {
    if (typeof listener !== 'function') return () => {};
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return {
    STORAGE_KEY,
    DEFAULT_LANGUAGE,
    SUPPORTED_LANGUAGES,
    normalizeLanguage,
    init,
    t,
    createError,
    getLanguage,
    setLanguage,
    apply,
    onChange
  };
}));
