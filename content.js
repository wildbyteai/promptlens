(() => {
  const OVERLAY_ID = 'promptcard-selection-overlay';
  const MIN_SIZE = 20;

  if (window.__promptCardLiteContentLoaded) {
    return;
  }
  window.__promptCardLiteContentLoaded = true;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.type !== 'START_SELECTION') {
      return false;
    }

    if (document.getElementById(OVERLAY_ID)) {
      sendResponse({ ok: true, alreadyRunning: true });
      return false;
    }

    startSelection();
    sendResponse({ ok: true });
    return false;
  });

  function startSelection() {
    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.className = 'promptcard-selection-overlay';

    const hint = document.createElement('div');
    hint.className = 'promptcard-selection-hint';
    hint.textContent = '拖拽选择要分析的区域，按 Esc 取消';

    const box = document.createElement('div');
    box.className = 'promptcard-selection-box';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'promptcard-selection-cancel';
    cancelButton.textContent = '取消';

    overlay.append(hint, box, cancelButton);
    document.documentElement.appendChild(overlay);

    let startX = 0;
    let startY = 0;
    let currentRect = null;
    let dragging = false;

    function updateBox(rect) {
      box.style.left = `${rect.x}px`;
      box.style.top = `${rect.y}px`;
      box.style.width = `${rect.width}px`;
      box.style.height = `${rect.height}px`;
      box.classList.toggle('is-visible', rect.width > 0 && rect.height > 0);
    }

    function rectFromPoints(aX, aY, bX, bY) {
      const x = Math.min(aX, bX);
      const y = Math.min(aY, bY);
      const width = Math.abs(bX - aX);
      const height = Math.abs(bY - aY);
      return { x, y, width, height };
    }

    function cleanup() {
      window.removeEventListener('keydown', onKeyDown, true);
      overlay.removeEventListener('pointerdown', onPointerDown, true);
      overlay.removeEventListener('pointermove', onPointerMove, true);
      overlay.removeEventListener('pointerup', onPointerUp, true);
      cancelButton.removeEventListener('click', onCancel, true);
      overlay.remove();
    }

    function onCancel(event) {
      event.preventDefault();
      event.stopPropagation();
      cleanup();
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        cleanup();
      }
    }

    function onPointerDown(event) {
      if (event.target === cancelButton) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      currentRect = rectFromPoints(startX, startY, startX, startY);
      updateBox(currentRect);
      overlay.setPointerCapture(event.pointerId);
    }

    function onPointerMove(event) {
      if (!dragging) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      currentRect = rectFromPoints(startX, startY, event.clientX, event.clientY);
      updateBox(currentRect);
    }

    async function onPointerUp(event) {
      if (!dragging) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      dragging = false;
      overlay.releasePointerCapture(event.pointerId);

      const rect = currentRect;
      if (!rect || rect.width < MIN_SIZE || rect.height < MIN_SIZE) {
        hint.textContent = '选区太小，请拖拽选择更大的区域，按 Esc 取消';
        box.classList.remove('is-visible');
        currentRect = null;
        return;
      }

      const finalRect = {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        devicePixelRatio: window.devicePixelRatio || 1
      };

      cleanup();
      await waitForPaint();
      chrome.runtime.sendMessage({
        type: 'SELECTION_COMPLETE',
        rect: finalRect
      });
    }

    function waitForPaint() {
      return new Promise(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
    }

    window.addEventListener('keydown', onKeyDown, true);
    overlay.addEventListener('pointerdown', onPointerDown, true);
    overlay.addEventListener('pointermove', onPointerMove, true);
    overlay.addEventListener('pointerup', onPointerUp, true);
    cancelButton.addEventListener('click', onCancel, true);
  }
})();
