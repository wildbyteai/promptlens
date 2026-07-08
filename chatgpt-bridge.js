(function () {
  const STATUS = {
    PAYLOAD_MISSING: 'payload_missing',
    INPUT_NOT_FOUND: 'input_not_found',
    INSTRUCTION_FAILED: 'instruction_failed',
    IMAGE_INPUT_NOT_FOUND: 'image_input_not_found',
    IMAGE_ATTACH_FAILED: 'image_attach_failed',
    PARTIAL_SUCCESS_INSTRUCTION_ONLY: 'partial_success_instruction_only',
    SUCCESS_INSTRUCTION_ONLY: 'success_instruction_only',
    SUCCESS_INSTRUCTION_AND_IMAGE: 'success_instruction_and_image'
  };

  const INPUT_WAIT_MAX_ATTEMPTS = 20;
  const INPUT_WAIT_INTERVAL_MS = 500;
  const IMAGE_INPUT_WAIT_MAX_ATTEMPTS = 20;
  const IMAGE_INPUT_WAIT_INTERVAL_MS = 500;
  const TRANSFER_MAX_ATTEMPTS = 12;
  const TRANSFER_RETRY_INTERVAL_MS = 500;
  const STARTUP_DELAY_MS = 3000;

  function getJobIdFromUrl(url) {
    try {
      return new URL(url).searchParams.get('promptlensJob') || '';
    } catch {
      return '';
    }
  }

  function base64ToBytes(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  function makeImageFile(payload) {
    const bytes = base64ToBytes(payload.imageBase64);
    const blob = new Blob([bytes], { type: payload.mimeType || 'image/jpeg' });
    return new File([blob], payload.filename || 'promptlens-chatgpt-image.jpg', { type: payload.mimeType || 'image/jpeg' });
  }

  function dispatchEditableEvents(element) {
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function isVisibleElement(element) {
    if (!element) return false;
    if (element.hidden || element.getAttribute && element.getAttribute('aria-hidden') === 'true') return false;
    const rect = typeof element.getBoundingClientRect === 'function' ? element.getBoundingClientRect() : null;
    if (rect && (rect.width <= 0 || rect.height <= 0)) return false;
    if ('offsetParent' in element && element.offsetParent === null && (!rect || rect.width <= 0 || rect.height <= 0)) return false;
    return true;
  }

  function queryAll(doc, selector) {
    if (typeof doc.querySelectorAll === 'function') return Array.from(doc.querySelectorAll(selector));
    const element = doc.querySelector(selector);
    return element ? [element] : [];
  }

  function findInstructionInput(doc) {
    const candidates = [
      ...queryAll(doc, '[contenteditable="true"]'),
      ...queryAll(doc, '[role="textbox"]'),
      ...queryAll(doc, 'textarea')
    ];
    return candidates.find(isVisibleElement) || candidates[0] || null;
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function waitForInstructionInput(doc, options = {}) {
    const maxAttempts = options.maxAttempts || INPUT_WAIT_MAX_ATTEMPTS;
    const intervalMs = options.intervalMs || INPUT_WAIT_INTERVAL_MS;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const input = findInstructionInput(doc);
      if (input) return input;
      if (attempt < maxAttempts - 1) await wait(intervalMs);
    }
    return null;
  }

  function fillContentEditableInput(input, instruction) {
    input.textContent = '';
    const doc = input.ownerDocument;
    try {
      if (doc && typeof doc.createRange === 'function' && typeof doc.getSelection === 'function') {
        const range = doc.createRange();
        range.selectNodeContents(input);
        const selection = doc.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
      if (doc && typeof doc.execCommand === 'function' && doc.execCommand('insertText', false, instruction)) {
        return true;
      }
    } catch {}
    input.textContent = instruction;
    return true;
  }

  function fillInstructionInput(input, instruction) {
    if (!input) return false;
    if (typeof input.focus === 'function') input.focus();
    if ('value' in input) {
      input.value = instruction;
    } else {
      fillContentEditableInput(input, instruction);
    }
    dispatchEditableEvents(input);
    return getInstructionText(input) === instruction;
  }

  function getInstructionText(input) {
    if (!input) return '';
    if ('value' in input) return String(input.value || '');
    return String(input.textContent || '');
  }

  function fillInstruction(doc, instruction) {
    return fillInstructionInput(findInstructionInput(doc), instruction);
  }

  function fileInputAcceptsImage(input) {
    const accept = String(input.accept || '').toLowerCase();
    return !accept || accept.includes('image') || accept.includes('.jpg') || accept.includes('.jpeg') || accept.includes('.png') || accept.includes('*/*');
  }

  function attachImageToInput(input, payload) {
    if (!input || !fileInputAcceptsImage(input)) return STATUS.IMAGE_INPUT_NOT_FOUND;
    try {
      const file = makeImageFile(payload);
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return input.files && input.files.length > 0 ? 'attached' : STATUS.IMAGE_ATTACH_FAILED;
    } catch {
      return STATUS.IMAGE_ATTACH_FAILED;
    }
  }

  function findImageInput(doc) {
    const inputs = Array.from(doc.querySelectorAll ? doc.querySelectorAll('input[type="file"]') : []);
    if (inputs.length) return inputs.find(fileInputAcceptsImage) || null;
    const input = doc.querySelector('input[type="file"]');
    return input && fileInputAcceptsImage(input) ? input : null;
  }

  async function waitForImageInput(doc, options = {}) {
    const maxAttempts = options.maxAttempts || IMAGE_INPUT_WAIT_MAX_ATTEMPTS;
    const intervalMs = options.intervalMs || IMAGE_INPUT_WAIT_INTERVAL_MS;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const input = findImageInput(doc);
      if (input) return input;
      if (attempt < maxAttempts - 1) await wait(intervalMs);
    }
    return null;
  }

  async function waitForImageInputAndAttach(doc, payload, options = {}) {
    const input = await waitForImageInput(doc, options);
    return attachImageToInput(input, payload);
  }

  function attachImage(doc, payload) {
    return attachImageToInput(findImageInput(doc), payload);
  }

  async function report(jobId, status, message) {
    try {
      await chrome.runtime.sendMessage({
        type: 'PROMPTLENS_CHATGPT_STATUS',
        jobId,
        status,
        message: message || ''
      });
    } catch {}
  }

  function getVerifiedTransferStatus(instructionInput, imageInput, instruction) {
    const textOk = getInstructionText(instructionInput) === instruction;
    const imageOk = Boolean(imageInput && imageInput.files && imageInput.files.length > 0);
    if (textOk && imageOk) return STATUS.SUCCESS_INSTRUCTION_AND_IMAGE;
    if (textOk) return STATUS.PARTIAL_SUCCESS_INSTRUCTION_ONLY;
    if (imageOk) return STATUS.INSTRUCTION_FAILED;
    return STATUS.IMAGE_ATTACH_FAILED;
  }

  async function completeTransfer(doc, payload, options = {}) {
    const maxAttempts = options.maxAttempts || TRANSFER_MAX_ATTEMPTS;
    const intervalMs = options.intervalMs || TRANSFER_RETRY_INTERVAL_MS;
    const instruction = payload.instruction || '';
    let lastStatus = STATUS.IMAGE_ATTACH_FAILED;
    let imageAttachAttempted = false;
    let attachedImageInput = null;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const instructionInput = await waitForInstructionInput(doc, { maxAttempts: 2, intervalMs });
      if (!instructionInput) {
        lastStatus = STATUS.INPUT_NOT_FOUND;
      } else {
        fillInstructionInput(instructionInput, instruction);
        const imageInput = attachedImageInput || await waitForImageInput(doc, { maxAttempts: 2, intervalMs });
        if (!imageInput) {
          lastStatus = getInstructionText(instructionInput) === instruction ? STATUS.IMAGE_INPUT_NOT_FOUND : STATUS.INPUT_NOT_FOUND;
        } else {
          if (!imageAttachAttempted) {
            attachImageToInput(imageInput, payload);
            imageAttachAttempted = true;
            attachedImageInput = imageInput;
          }
          fillInstructionInput(instructionInput, instruction);
          lastStatus = getVerifiedTransferStatus(instructionInput, imageInput, instruction);
          if (lastStatus === STATUS.SUCCESS_INSTRUCTION_AND_IMAGE) return lastStatus;
        }
      }
      if (attempt < maxAttempts - 1) await wait(intervalMs);
    }

    return lastStatus;
  }

  async function run() {
    await wait(STARTUP_DELAY_MS);
    const jobId = getJobIdFromUrl(location.href);
    if (!jobId) return;

    const response = await chrome.runtime.sendMessage({ type: 'PROMPTLENS_CHATGPT_PAYLOAD_GET', jobId });
    if (!response || !response.ok || !response.payload) {
      await report(jobId, STATUS.PAYLOAD_MISSING, 'ChatGPT transfer payload missing.');
      return;
    }

    const payload = response.payload;
    const status = await completeTransfer(document, payload);
    if (status === STATUS.SUCCESS_INSTRUCTION_AND_IMAGE) {
      await report(jobId, STATUS.SUCCESS_INSTRUCTION_AND_IMAGE, 'Instruction filled and image attached.');
      return;
    }

    await report(jobId, status, status);
  }

  window.PromptLensChatGptBridge = {
    STATUS,
    getJobIdFromUrl,
    base64ToBytes,
    makeImageFile,
    fillInstruction,
    fillInstructionInput,
    waitForInstructionInput,
    attachImage,
    waitForImageInput,
    waitForImageInputAndAttach,
    completeTransfer,
    run
  };

  if (!window.__PROMPTLENS_TEST_DISABLE_AUTO_RUN) {
    run().catch(error => {
      const jobId = getJobIdFromUrl(location.href);
      report(jobId, STATUS.INSTRUCTION_FAILED, error.message);
    });
  }
}());
