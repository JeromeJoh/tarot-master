/**
 * <my-toast> Web Component
 * Styled to match the Mystic Tarot design system:
 *   - Deep indigo surfaces with frosted glass
 *   - Warm amber / peach / violet accent palette
 *   - Syne font, generous spacing, pill border-radius
 *
 * Usage (static):
 *   MyToast.show(message, { type, duration, position, animation })
 *
 * Shorthand via window.toast:
 *   toast.info(msg) / toast.success(msg) / toast.warning(msg) / toast.error(msg)
 */

class MyToast extends HTMLElement {
  static get observedAttributes() {
    return ['position', 'animation'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    this.shadowRoot.appendChild(this.container);

    const style = document.createElement('style');
    style.textContent = `
      /* ── Host positioning ── */
      :host {
        position: fixed;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      }

      :host([position="top-right"])    { top: 24px; right: 24px; align-items: flex-end; }
      :host([position="top-left"])     { top: 24px; left: 24px;  align-items: flex-start; }
      :host([position="top-center"])   { top: 24px; left: 50%; transform: translateX(-50%); align-items: center; }
      :host([position="bottom-right"]) { bottom: 24px; right: 24px; align-items: flex-end; }
      :host([position="bottom-left"])  { bottom: 24px; left: 24px;  align-items: flex-start; }
      :host([position="bottom-center"]){ bottom: 24px; left: 50%; transform: translateX(-50%); align-items: center; }

      .toast-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
        align-items: inherit;
        padding: 8px;
      }

      /* ── Base toast ── */
      .toast {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        width: fit-content;
        max-width: min(420px, 88vw);
        padding: 13px 44px 13px 16px;
        border-radius: 50px;                       /* pill — matches .btn */
        font-family: 'Syne', 'Segoe UI', sans-serif;
        font-size: 0.88rem;
        letter-spacing: 0.4px;
        line-height: 1.4;
        word-break: break-word;
        pointer-events: auto;
        opacity: 0;
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border: 1px solid transparent;
        box-shadow:
          0 4px 24px rgba(0, 0, 0, 0.55),
          inset 0 1px 0 rgba(255, 255, 255, 0.06);
      }

      /* ── Type variants — dark translucent surfaces + accent borders ── */
      .toast.info {
        background: rgba(22, 18, 52, 0.92);
        border-color: rgba(139, 127, 199, 0.45);   /* --accent-violet */
        color: #c8c2e8;
        --icon-color: #8b7fc7;
        --close-color: rgba(139, 127, 199, 0.6);
      }

      .toast.success {
        background: rgba(14, 32, 28, 0.92);
        border-color: rgba(80, 180, 120, 0.4);
        color: #a8d8b8;
        --icon-color: #5ab87a;
        --close-color: rgba(80, 180, 120, 0.6);
      }

      .toast.warning {
        background: rgba(30, 22, 10, 0.92);
        border-color: rgba(201, 168, 76, 0.45);    /* --accent-gold */
        color: #e0c87a;
        --icon-color: #c9a84c;
        --close-color: rgba(201, 168, 76, 0.6);
      }

      .toast.error {
        background: rgba(36, 12, 16, 0.92);
        border-color: rgba(201, 100, 100, 0.45);
        color: #e8a8a8;
        --icon-color: #c96464;
        --close-color: rgba(201, 100, 100, 0.6);
      }

      .toast.persistent {
        background: rgba(18, 12, 40, 0.95);
        border-color: rgba(232, 168, 124, 0.45);   /* --accent-peach */
        color: #f0e8d5;
        --icon-color: #e8a87c;
        --close-color: rgba(232, 168, 124, 0.6);
        box-shadow:
          0 4px 24px rgba(0, 0, 0, 0.6),
          0 0 20px rgba(232, 168, 124, 0.12),
          inset 0 1px 0 rgba(255, 255, 255, 0.06);
      }

      /* ── Icon ── */
      .toast-icon {
        font-size: 1rem;
        flex-shrink: 0;
        color: var(--icon-color);
        line-height: 1;
      }

      /* ── Message ── */
      .toast-message {
        flex: 1;
      }

      /* ── Close button ── */
      .close-btn {
        position: absolute;
        width: 28px;
        height: 28px;
        top: 50%;
        right: 10px;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s;
        padding: 0;
      }

      .close-btn:hover {
        background: rgba(255, 255, 255, 0.08);
      }

      .close-btn::before,
      .close-btn::after {
        content: '';
        position: absolute;
        width: 12px;
        height: 2px;
        background: var(--close-color, rgba(255, 255, 255, 0.5));
        border-radius: 1px;
        transition: background 0.2s;
      }

      .close-btn::before { transform: rotate(45deg); }
      .close-btn::after  { transform: rotate(-45deg); }

      .close-btn:hover::before,
      .close-btn:hover::after {
        background: rgba(255, 255, 255, 0.9);
      }

      /* ── Animations ── */

      /* fade-slide (default) */
      .fade-slide {
        transform: translateY(-14px) scale(0.97);
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      :host([position^="bottom"]) .fade-slide {
        transform: translateY(14px) scale(0.97);
      }
      :host([position^="bottom"]) .fade-slide.show {
        transform: translateY(0) scale(1);
      }
      .fade-slide.show {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      /* fade-scale */
      .fade-scale {
        transform: scale(0.88);
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      .fade-scale.show {
        opacity: 1;
        transform: scale(1);
      }

      /* flash (for dedup highlight) */
      @keyframes toastFlash {
        0%   { box-shadow: 0 4px 24px rgba(0,0,0,0.55); }
        40%  { box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.6), 0 4px 24px rgba(0,0,0,0.55); }
        100% { box-shadow: 0 4px 24px rgba(0,0,0,0.55); }
      }
      .toast.flash {
        animation: toastFlash 0.45s ease;
      }
    `;
    this.shadowRoot.appendChild(style);

    if (!this.hasAttribute('position')) this.setAttribute('position', 'top-center');
    if (!this.hasAttribute('animation')) this.setAttribute('animation', 'fade-slide');
  }

  connectedCallback() {
    if (!document.querySelector('my-toast')) {
      document.body.appendChild(this);
    }
  }

  /**
   * @param {string} message
   * @param {{ type?: string, duration?: number, position?: string, animation?: string }} [opts]
   */
  static show(message, {
    type = 'info',
    duration = 3000,
    position = 'top-center',
    animation = 'fade-slide',
  } = {}) {
    let instance = document.querySelector('my-toast');
    if (!instance) {
      instance = new MyToast();
      document.body.appendChild(instance);
    }
    instance.setAttribute('position', position);
    instance.setAttribute('animation', animation);
    instance._addToast(message, type, duration, animation);
  }

  /** Icon map matching the existing toast.js TYPE_ICONS */
  static _icon(type) {
    // Inline SVGs use `currentColor` so they inherit `--icon-color` from CSS
    return ({
      info: `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" fill="none" />
          <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          <circle cx="12" cy="16" r="0.8" fill="currentColor" />
        </svg>
      `,
      success: `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" fill="none" />
          <path d="M8.5 12.5l2 2 5-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        </svg>
      `,
      warning: `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12 4.5l8 14H4l8-14z" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linejoin="round" />
          <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          <circle cx="12" cy="16.2" r="0.7" fill="currentColor" />
        </svg>
      `,
      error: `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" fill="none" />
          <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        </svg>
      `,
      persistent: `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12 3v9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          <path d="M9 21l6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          <path d="M7 11L3 9l6-8 4 3 4 4-4 4" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linejoin="round" />
        </svg>
      `,
    }[type] ?? `
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" fill="none" />
      </svg>
    `);
  }

  _addToast(message, type, duration, animation) {
    const anim = animation || this.getAttribute('animation') || 'fade-slide';

    // Deduplicate persistent toasts
    if (type === 'persistent') {
      const existing = [...this.container.querySelectorAll('.toast.persistent')].find(
        el => el.querySelector('.toast-message')?.textContent === message
      );
      if (existing) {
        existing.classList.remove('flash');
        void existing.offsetWidth; // reflow
        existing.classList.add('flash');
        return;
      }
    }

    const el = document.createElement('div');
    el.className = `toast ${type} ${anim}`;
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'polite');

    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    // inline SVG markup — set as HTML and mark decorative
    icon.innerHTML = MyToast._icon(type);
    icon.setAttribute('aria-hidden', 'true');

    const msg = document.createElement('span');
    msg.className = 'toast-message';
    msg.textContent = message;

    el.appendChild(icon);
    el.appendChild(msg);

    // Close button — always present (persistent ones need it; others are a nice UX bonus)
    const btn = document.createElement('button');
    btn.className = 'close-btn';
    btn.setAttribute('aria-label', 'Close notification');
    btn.onclick = () => this._cleanupToast(el);
    el.appendChild(btn);

    this.container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));

    if (type !== 'persistent') {
      setTimeout(() => this._cleanupToast(el), duration);
    }
  }

  _cleanupToast(el) {
    el.classList.remove('show');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
  }
}

customElements.define('my-toast', MyToast);

/* ── Shorthand API (mirrors window.toast from the original) ── */
const toastApi = {
  show: (msg, opt) => MyToast.show(msg, opt),
  info: (msg, opt) => MyToast.show(msg, { ...opt, type: 'info' }),
  success: (msg, opt) => MyToast.show(msg, { ...opt, type: 'success' }),
  warning: (msg, opt) => MyToast.show(msg, { ...opt, type: 'warning' }),
  error: (msg, opt) => MyToast.show(msg, { ...opt, type: 'error' }),
  persistent: (msg, opt) => MyToast.show(msg, { ...opt, type: 'persistent' }),
};
window.toast = toastApi;

export { MyToast, toastApi as toast };
