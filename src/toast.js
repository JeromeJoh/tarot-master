// toast.js — lightweight toast notification component
// Supports types: info | success | warning | error | persistent

const TOAST_STYLES = `
  #toast-container {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    pointer-events: none;
    width: max-content;
    max-width: 90vw;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 18px;
    border-radius: 8px;
    font-family: 'Cinzel', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 0.95rem;
    color: #fff;
    pointer-events: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.15);
    max-width: 420px;
    word-break: break-word;
    animation: toastSlideIn 0.3s ease forwards;
  }

  .toast.toast-info {
    background: rgba(30, 80, 160, 0.92);
    border-color: rgba(80, 140, 255, 0.4);
  }

  .toast.toast-success {
    background: rgba(20, 110, 60, 0.92);
    border-color: rgba(60, 200, 100, 0.4);
  }

  .toast.toast-warning {
    background: rgba(140, 90, 10, 0.92);
    border-color: rgba(255, 190, 50, 0.4);
  }

  .toast.toast-error {
    background: rgba(140, 20, 20, 0.92);
    border-color: rgba(255, 80, 80, 0.4);
  }

  .toast.toast-persistent {
    background: rgba(60, 20, 100, 0.95);
    border-color: rgba(212, 175, 55, 0.5);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6), 0 0 10px rgba(212, 175, 55, 0.2);
  }

  .toast-icon {
    font-size: 1.1rem;
    flex-shrink: 0;
  }

  .toast-message {
    flex: 1;
  }

  .toast-close {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    font-size: 1.1rem;
    line-height: 1;
    padding: 0 0 0 8px;
    flex-shrink: 0;
    transition: color 0.2s;
  }

  .toast-close:hover {
    color: #fff;
  }

  .toast.toast-hiding {
    animation: toastSlideOut 0.3s ease forwards;
  }

  .toast.flash {
    animation: toastFlash 0.4s ease;
  }

  @keyframes toastSlideIn {
    from {
      opacity: 0;
      transform: translateY(-16px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes toastSlideOut {
    from {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    to {
      opacity: 0;
      transform: translateY(-16px) scale(0.96);
    }
  }

  @keyframes toastFlash {
    0%   { box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
    40%  { box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.7), 0 4px 20px rgba(0,0,0,0.5); }
    100% { box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
  }
`;

const TYPE_ICONS = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
  persistent: '📌',
};

/** @type {Map<string, {id: string, message: string, type: string, duration: number, element: HTMLElement}>} */
const activeToasts = new Map();

let stylesInjected = false;

function injectStyles() {
  if (stylesInjected) return;
  const style = document.createElement('style');
  style.textContent = TOAST_STYLES;
  document.head.appendChild(style);
  stylesInjected = true;
}

function getContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

/**
 * @param {string} message
 * @param {'info'|'success'|'warning'|'error'|'persistent'} [type='info']
 * @param {number} [duration=3000]
 * @returns {string|null}
 */
export function showToast(message, type = 'info', duration = 3000) {
  if (message === '') return null;

  injectStyles();

  // Deduplicate persistent toasts with the same message
  if (type === 'persistent') {
    for (const toast of activeToasts.values()) {
      if (toast.type === 'persistent' && toast.message === message) {
        // Flash the existing toast instead of creating a new one
        const el = toast.element;
        el.classList.remove('flash');
        // Force reflow to restart animation
        void el.offsetWidth;
        el.classList.add('flash');
        return toast.id;
      }
    }
  }

  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.setAttribute('data-toast-id', id);
  el.setAttribute('role', 'alert');
  el.setAttribute('aria-live', 'polite');

  const icon = document.createElement('span');
  icon.className = 'toast-icon';
  icon.textContent = TYPE_ICONS[type] ?? 'ℹ️';

  const msg = document.createElement('span');
  msg.className = 'toast-message';
  msg.textContent = message;

  el.appendChild(icon);
  el.appendChild(msg);

  if (type === 'persistent') {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Close notification');
    closeBtn.addEventListener('click', () => dismissToast(id));
    el.appendChild(closeBtn);
  }

  getContainer().appendChild(el);

  const toastData = { id, message, type, duration: type === 'persistent' ? Infinity : duration, element: el };
  activeToasts.set(id, toastData);

  if (type !== 'persistent') {
    setTimeout(() => dismissToast(id), duration);
  }

  return id;
}

/**
 * @param {string} id
 */
export function dismissToast(id) {
  const toast = activeToasts.get(id);
  if (!toast) return;

  const el = toast.element;
  el.classList.add('toast-hiding');

  el.addEventListener('animationend', () => {
    el.remove();
  }, { once: true });

  activeToasts.delete(id);
}
