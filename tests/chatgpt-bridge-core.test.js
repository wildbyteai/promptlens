const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'chatgpt-bridge.js'), 'utf8');

function createContext(overrides = {}) {
  const context = {
    window: {},
    console,
    URL,
    Uint8Array,
    Blob: globalThis.Blob,
    File: globalThis.File || class File extends Blob {
      constructor(parts, name, options) {
        super(parts, options);
        this.name = name;
        this.lastModified = Date.now();
      }
    },
    DataTransfer: class DataTransfer {
      constructor() { this.items = { files: [], add: file => this.items.files.push(file) }; }
      get files() { return this.items.files; }
    },
    Event: class Event { constructor(type, init) { this.type = type; this.bubbles = Boolean(init && init.bubbles); } },
    atob: globalThis.atob || (base64 => Buffer.from(base64, 'base64').toString('binary')),
    btoa: globalThis.btoa || (binary => Buffer.from(binary, 'binary').toString('base64')),
    chrome: { runtime: { sendMessage: async () => ({ ok: false }) } },
    location: { href: 'https://chatgpt.com/?promptlensJob=test-job' },
    document: null,
    ...overrides
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(source, context);
  return context;
}

function makeTextAreaDoc() {
  const textarea = {
    value: '',
    events: [],
    dispatchEvent(event) { this.events.push(event.type); },
    focus() { this.focused = true; }
  };
  return {
    textarea,
    querySelector(selector) {
      return selector === 'textarea' ? textarea : null;
    }
  };
}

function makeEditableDoc() {
  const editable = {
    textContent: '',
    events: [],
    dispatchEvent(event) { this.events.push(event.type); },
    focus() { this.focused = true; }
  };
  return {
    editable,
    querySelector(selector) {
      return selector === 'textarea' ? null : editable;
    }
  };
}

function makeFileInputDoc() {
  const input = {
    type: 'file',
    accept: 'image/*',
    files: [],
    events: [],
    dispatchEvent(event) { this.events.push(event.type); }
  };
  return {
    input,
    querySelector(selector) {
      if (selector === 'input[type="file"]') return input;
      return null;
    }
  };
}

const context = createContext();
const bridge = context.PromptLensChatGptBridge;

assert.equal(bridge.getJobIdFromUrl('https://chatgpt.com/?promptlensJob=abc123'), 'abc123');
assert.equal(bridge.getJobIdFromUrl('https://chatgpt.com/'), '');

const textareaDoc = makeTextAreaDoc();
assert.equal(bridge.fillInstruction(textareaDoc, 'hello prompt'), true);
assert.equal(textareaDoc.textarea.value, 'hello prompt');
assert.deepEqual(textareaDoc.textarea.events, ['input', 'change']);

const editableDoc = makeEditableDoc();
assert.equal(bridge.fillInstruction(editableDoc, 'editable prompt'), true);
assert.equal(editableDoc.editable.textContent, 'editable prompt');
assert.deepEqual(editableDoc.editable.events, ['input', 'change']);

const bytes = bridge.base64ToBytes(Buffer.from('abc').toString('base64'));
assert.equal(bytes.length, 3);
assert.equal(bytes[0], 97);

const fileDoc = makeFileInputDoc();
const attachStatus = bridge.attachImage(fileDoc, {
  imageBase64: Buffer.from('fake-image').toString('base64'),
  mimeType: 'image/jpeg',
  filename: 'promptlens-test.jpg'
});
assert.equal(attachStatus, 'attached');
assert.equal(fileDoc.input.files.length, 1);
assert.deepEqual(fileDoc.input.events, ['change']);

const missingFileDoc = { querySelector() { return null; } };
assert.equal(bridge.attachImage(missingFileDoc, { imageBase64: 'AA==', mimeType: 'image/jpeg', filename: 'x.jpg' }), 'image_input_not_found');

console.log('chatgpt bridge core tests passed');
