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
    setTimeout,
    clearTimeout,
    location: { href: 'https://chatgpt.com/?promptlensJob=test-job' },
    document: null,
    __PROMPTLENS_TEST_DISABLE_AUTO_RUN: true,
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

function makeDelayedTextAreaDoc(readyAfterQueries = 3) {
  const textarea = {
    value: '',
    events: [],
    dispatchEvent(event) { this.events.push(event.type); },
    focus() { this.focused = true; }
  };
  let queries = 0;
  return {
    textarea,
    get queries() { return queries; },
    querySelector(selector) {
      queries += 1;
      return selector === 'textarea' && queries >= readyAfterQueries ? textarea : null;
    }
  };
}

function makeHiddenTextareaWithVisibleComposerDoc() {
  const hiddenTextarea = {
    value: '',
    events: [],
    hidden: true,
    offsetParent: null,
    getBoundingClientRect() { return { width: 0, height: 0 }; },
    dispatchEvent(event) { this.events.push(event.type); },
    focus() { this.focused = true; }
  };
  const execCommands = [];
  const ownerDocument = {
    execCommand(command, _showUi, value) {
      execCommands.push({ command, value });
      if (command === 'insertText') composer.textContent = value;
      return true;
    },
    createRange() {
      return { selectNodeContents() {} };
    },
    getSelection() {
      return { removeAllRanges() {}, addRange() {} };
    }
  };
  const composer = {
    textContent: '',
    events: [],
    isContentEditable: true,
    ownerDocument,
    offsetParent: {},
    getBoundingClientRect() { return { width: 420, height: 80 }; },
    dispatchEvent(event) { this.events.push(event.type); },
    focus() { this.focused = true; }
  };
  return {
    hiddenTextarea,
    composer,
    execCommands,
    querySelector(selector) {
      if (selector === 'textarea') return hiddenTextarea;
      if (selector === '[contenteditable="true"]') return composer;
      if (selector === '[role="textbox"]') return composer;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === 'textarea') return [hiddenTextarea];
      if (selector === '[contenteditable="true"]') return [composer];
      if (selector === '[role="textbox"]') return [composer];
      return [];
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

function makeDelayedFileInputDoc(readyAfterFileQueries = 3) {
  const input = {
    type: 'file',
    accept: 'image/*',
    files: [],
    events: [],
    dispatchEvent(event) { this.events.push(event.type); }
  };
  let fileQueries = 0;
  return {
    input,
    get fileQueries() { return fileQueries; },
    querySelector(selector) {
      if (selector !== 'input[type="file"]') return null;
      fileQueries += 1;
      return fileQueries >= readyAfterFileQueries ? input : null;
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

const visibleComposerDoc = makeHiddenTextareaWithVisibleComposerDoc();
assert.equal(bridge.fillInstruction(visibleComposerDoc, 'visible composer prompt'), true);
assert.equal(visibleComposerDoc.hiddenTextarea.value, '');
assert.equal(visibleComposerDoc.composer.textContent, 'visible composer prompt');
assert.deepEqual(visibleComposerDoc.execCommands, [{ command: 'insertText', value: 'visible composer prompt' }]);

(async () => {
  const delayedDoc = makeDelayedTextAreaDoc(3);
  const delayedInput = await bridge.waitForInstructionInput(delayedDoc, { maxAttempts: 5, intervalMs: 1 });
  assert.equal(delayedInput, delayedDoc.textarea);
  assert.equal(delayedDoc.queries, 3);

  const missingInputDoc = makeDelayedTextAreaDoc(99);
  const missingInput = await bridge.waitForInstructionInput(missingInputDoc, { maxAttempts: 3, intervalMs: 1 });
  assert.equal(missingInput, null);

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
  assert.deepEqual(fileDoc.input.events, ['input', 'change']);

  const missingFileDoc = { querySelector() { return null; } };
  assert.equal(bridge.attachImage(missingFileDoc, { imageBase64: 'AA==', mimeType: 'image/jpeg', filename: 'x.jpg' }), 'image_input_not_found');

  const delayedFileDoc = makeDelayedFileInputDoc(3);
  const delayedImageStatus = await bridge.waitForImageInputAndAttach(delayedFileDoc, {
    imageBase64: Buffer.from('fake-image').toString('base64'),
    mimeType: 'image/jpeg',
    filename: 'promptlens-test.jpg'
  }, { maxAttempts: 5, intervalMs: 1 });
  assert.equal(delayedImageStatus, 'attached');
  assert.equal(delayedFileDoc.fileQueries, 3);
  assert.equal(delayedFileDoc.input.files.length, 1);

  const statuses = [];
  const startupDelays = [];
  const runDoc = makeTextAreaDoc();
  let uploadAttempts = 0;
  const fileInput = {
    type: 'file',
    accept: 'image/*',
    files: [],
    dispatchEvent(event) {
      this.lastEvent = event.type;
      uploadAttempts += 1;
      if (uploadAttempts === 1) {
        runDoc.textarea.value = '';
      }
    }
  };
  runDoc.querySelector = selector => {
    if (selector === 'textarea') return runDoc.textarea;
    if (selector === 'input[type="file"]') return fileInput;
    return null;
  };

  const runContext = createContext({
    location: { href: 'https://chatgpt.com/?promptlensJob=run-job' },
    document: runDoc,
    __PROMPTLENS_TEST_DISABLE_AUTO_RUN: true,
    setTimeout: (callback, ms) => {
      startupDelays.push(ms);
      callback();
      return 1;
    },
    clearTimeout,
    chrome: {
      runtime: {
        sendMessage: async message => {
          if (message.type === 'PROMPTLENS_CHATGPT_PAYLOAD_GET') {
            return {
              ok: true,
              payload: {
                imageBase64: Buffer.from('fake-image').toString('base64'),
                mimeType: 'image/jpeg',
                filename: 'promptlens-test.jpg',
                instruction: 'instruction survives upload'
              }
            };
          }
          if (message.type === 'PROMPTLENS_CHATGPT_STATUS') {
            statuses.push(message.status);
            return { ok: true };
          }
          return { ok: false };
        }
      }
    }
  });
  await runContext.PromptLensChatGptBridge.run();
  assert.equal(startupDelays[0], 3000);
  assert.equal(runDoc.textarea.value, 'instruction survives upload');
  assert.equal(fileInput.files.length, 1);
  assert.equal(uploadAttempts, 2);
  assert.ok(statuses.includes('success_instruction_and_image'));

  console.log('chatgpt bridge core tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
