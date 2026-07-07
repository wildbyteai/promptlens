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

  function findInstructionInput(doc) {
    return doc.querySelector('textarea') ||
      doc.querySelector('[contenteditable="true"]') ||
      doc.querySelector('[role="textbox"]');
  }

  function fillInstruction(doc, instruction) {
    const input = findInstructionInput(doc);
    if (!input) return false;
    if (typeof input.focus === 'function') input.focus();
    if ('value' in input) {
      input.value = instruction;
    } else {
      input.textContent = instruction;
    }
    dispatchEditableEvents(input);
    return true;
  }

  function fileInputAcceptsImage(input) {
    const accept = String(input.accept || '').toLowerCase();
    return !accept || accept.includes('image') || accept.includes('.jpg') || accept.includes('.jpeg') || accept.includes('.png') || accept.includes('*/*');
  }

  function attachImage(doc, payload) {
    const input = doc.querySelector('input[type="file"]');
    if (!input || !fileInputAcceptsImage(input)) return STATUS.IMAGE_INPUT_NOT_FOUND;
    try {
      const file = makeImageFile(payload);
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return 'attached';
    } catch {
      return STATUS.IMAGE_ATTACH_FAILED;
    }
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

  async function run() {
    const jobId = getJobIdFromUrl(location.href);
    if (!jobId) return;

    const response = await chrome.runtime.sendMessage({ type: 'PROMPTLENS_CHATGPT_PAYLOAD_GET', jobId });
    if (!response || !response.ok || !response.payload) {
      await report(jobId, STATUS.PAYLOAD_MISSING, 'ChatGPT transfer payload missing.');
      return;
    }

    const payload = response.payload;
    const instructionOk = fillInstruction(document, payload.instruction || '');
    if (!instructionOk) {
      await report(jobId, STATUS.INPUT_NOT_FOUND, 'ChatGPT input not found.');
      return;
    }

    const imageStatus = attachImage(document, payload);
    if (imageStatus === 'attached') {
      await report(jobId, STATUS.SUCCESS_INSTRUCTION_AND_IMAGE, 'Instruction filled and image attached.');
      return;
    }

    await report(jobId, STATUS.PARTIAL_SUCCESS_INSTRUCTION_ONLY, imageStatus);
  }

  window.PromptLensChatGptBridge = {
    STATUS,
    getJobIdFromUrl,
    base64ToBytes,
    makeImageFile,
    fillInstruction,
    attachImage,
    run
  };

  run().catch(error => {
    const jobId = getJobIdFromUrl(location.href);
    report(jobId, STATUS.INSTRUCTION_FAILED, error.message);
  });
}());
