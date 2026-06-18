/**
 * <my-modal> Web Component
 * Reusable modal dialog matching the Mystic Tarot design system.
 *
 * Attributes:
 *   modal-title  — heading text shown in the sticky header
 *   max-width    — CSS max-width of the inner panel (default: 480px)
 *
 * Slots:
 *   (default)    — scrollable body content
 *
 * Methods:
 *   open()       — show the modal
 *   close()      — hide the modal
 *
 * Events (dispatched on the host element):
 *   my-modal-close — fired when the modal is closed (button, overlay click, or Escape)
 *
 * Usage:
 *   <my-modal id="settings-modal" modal-title="Settings" max-width="420px">
 *     <p>Your content here</p>
 *   </my-modal>
 *
 *   document.getElementById('settings-modal').open();
 */

class MyModal extends HTMLElement {
  static get observedAttributes() {
    return ['modal-title', 'max-width'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._render();
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  connectedCallback() {
    this._dialog.addEventListener('click', this._onOverlayClick);
    this._dialog.addEventListener('cancel', this._onCancel);
  }

  disconnectedCallback() {
    this._dialog.removeEventListener('click', this._onOverlayClick);
    this._dialog.removeEventListener('cancel', this._onCancel);
  }

  attributeChangedCallback(name, _old, value) {
    if (name === 'modal-title' && this._titleEl) {
      this._titleEl.textContent = value ?? '';
    }
    if (name === 'max-width' && this._panel) {
      this._panel.style.maxWidth = value || '480px';
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────

  open() {
    this._dialog.showModal();
  }

  close() {
    this._dialog.close();
  }

  // ── Private ──────────────────────────────────────────────────────────────

  _render() {
    const shadow = this.shadowRoot;

    // ── Styles ──
    const style = document.createElement('style');
    style.textContent = `
      /* ── Dialog reset & overlay ── */
      dialog {
        /* Reset browser defaults */
        margin: 0;
        padding: 0;
        border: none;
        background: transparent;
        /* Full-screen overlay */
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        max-width: 100%;
        max-height: 100%;
        /* Centre the panel */
        display: none;
        align-items: center;
        justify-content: center;
        /* Overlay tint */
        background: rgba(5, 4, 16, 0.82);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 3000;
        box-sizing: border-box;
        padding: 20px;
      }

      dialog[open] {
        display: flex;
      }

      dialog::backdrop {
        display: none; /* we paint our own overlay on the <dialog> itself */
      }

      /* ── Inner panel ── */
      .panel {
        background: #13102a; /* --bg-surface */
        border: 1px solid rgba(201, 168, 76, 0.2); /* --border-subtle */
        border-radius: 24px; /* --radius-lg */
        overflow: hidden;
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: var(--modal-max-width, 480px);
        max-height: 88vh;
        padding: 32px; /* --space-lg */
        box-sizing: border-box;
        box-shadow:
          0 0 40px rgba(0, 0, 0, 0.8),
          0 0 80px rgba(139, 127, 199, 0.35); /* --violet-glow */
        /* Prevent clicks on the panel from bubbling to the overlay */
        position: relative;
      }

      /* ── Sticky header ── */
      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px; /* --space-sm */
        padding-bottom: 12px;
        margin-bottom: 20px; /* --space-md */
        border-bottom: 1px solid rgba(201, 168, 76, 0.2);
        flex-shrink: 0;
      }

      .modal-header h2 {
        margin: 0;
        flex: 1;
        text-align: center;
        font-family: 'Uncial Antiqua', cursive, serif;
        color: #f0e8d5; /* --accent-cream */
        font-size: 1.4rem;
        letter-spacing: 1.5px;
      }

      /* ── Close button ── */
      .close-btn {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(201, 168, 76, 0.2);
        border-radius: 50%;
        color: #a89fc0; /* --text-secondary */
        cursor: pointer;
        transition: background 0.2s, color 0.2s, border-color 0.2s;
        padding: 0;
        position: relative;
      }

      .close-btn:hover {
        background: rgba(201, 168, 76, 0.12);
        border-color: #c9a84c; /* --accent-gold */
        color: #f0e8d5;
      }

      /* × drawn via pseudo-elements */
      .close-btn::before,
      .close-btn::after {
        content: '';
        position: absolute;
        width: 14px;
        height: 2px;
        background: currentColor;
        border-radius: 1px;
      }
      .close-btn::before { transform: rotate(45deg); }
      .close-btn::after  { transform: rotate(-45deg); }

      /* ── Scrollable body ── */
      .modal-body {
        overflow-y: auto;
        overflow-x: hidden;
        scrollbar-gutter: stable;
        flex: 1 1 auto;
        min-height: 0;
      }

      /* Scrollbar */
      .modal-body::-webkit-scrollbar       { width: 6px; }
      .modal-body::-webkit-scrollbar-track { background: #0d0b1e; }
      .modal-body::-webkit-scrollbar-thumb {
        background: rgba(201, 168, 76, 0.2);
        border-radius: 3px;
      }
      .modal-body::-webkit-scrollbar-thumb:hover {
        background: rgba(201, 168, 76, 0.25);
      }
    `;
    shadow.appendChild(style);

    // ── Dialog ──
    this._dialog = document.createElement('dialog');

    // Panel
    this._panel = document.createElement('div');
    this._panel.className = 'panel';
    this._panel.style.setProperty(
      '--modal-max-width',
      this.getAttribute('max-width') || '480px'
    );

    // Header
    const header = document.createElement('div');
    header.className = 'modal-header';

    this._titleEl = document.createElement('h2');
    this._titleEl.textContent = this.getAttribute('modal-title') ?? '';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.addEventListener('click', () => this._handleClose());

    header.appendChild(this._titleEl);
    header.appendChild(closeBtn);

    // Body (slot)
    const body = document.createElement('div');
    body.className = 'modal-body';
    const slot = document.createElement('slot');
    body.appendChild(slot);

    this._panel.appendChild(header);
    this._panel.appendChild(body);
    this._dialog.appendChild(this._panel);
    shadow.appendChild(this._dialog);
  }

  /** Close when clicking the backdrop (outside the panel) */
  _onOverlayClick = (e) => {
    // The dialog fills the viewport; the panel is the only child.
    // A click that lands directly on the dialog (not the panel) is a backdrop click.
    if (e.target === this._dialog) {
      this._handleClose();
    }
  };

  /** Handle native Escape key via the 'cancel' event */
  _onCancel = (e) => {
    e.preventDefault(); // prevent browser from closing without our hook
    this._handleClose();
  };

  _handleClose() {
    this._dialog.close();
    this.dispatchEvent(new CustomEvent('my-modal-close', { bubbles: true, composed: true }));
  }
}

customElements.define('my-modal', MyModal);

export { MyModal };
