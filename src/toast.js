/**
 * toast.js — compatibility shim
 *
 * Delegates all calls to the <my-toast> web component defined in
 * src/components/toast.js, which is pre-loaded as a plain <script> in
 * index.html so customElements.define() runs before any ES module code.
 *
 * The public API (showToast / dismissToast) is identical to the previous
 * implementation — main.js requires zero changes.
 */

// Belt-and-suspenders: if this module is imported before the <script> tag
// has run (e.g. in unit tests), load the component now.
import './components/toast.js';

/** @type {Map<string, HTMLElement>} id → toast element inside shadow DOM */
const _tracked = new Map();

/**
 * Resolve or create the singleton <my-toast> host element.
 * @returns {InstanceType<MyToast>}
 */
function _getInstance() {
  let instance = document.querySelector('my-toast');
  if (!instance) {
    const Ctor = customElements.get('my-toast');
    if (!Ctor) throw new Error('[toast] <my-toast> is not defined. Ensure components/toast.js is loaded first.');
    instance = new Ctor();
    document.body.appendChild(instance);
  }
  return instance;
}

/**
 * Show a toast notification.
 *
 * @param {string} message
 * @param {'info'|'success'|'warning'|'error'|'persistent'} [type='info']
 * @param {number} [duration=3000]  ignored for 'persistent' type
 * @returns {string} opaque id that can be passed to dismissToast()
 */
export function showToast(message, type = 'info', duration = 3000) {
  if (message === '') return '';

  const instance = _getInstance();
  const animation = instance.getAttribute('animation') ?? 'fade-slide';

  // Generate a stable id
  const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Inject the toast via the web component's internal method
  instance._addToast(message, type, duration, animation);

  // Capture the freshly appended element for programmatic dismissal
  const el = instance.container.lastElementChild;
  if (el) {
    _tracked.set(id, el);
    if (type !== 'persistent') {
      // Clean up tracking entry after the toast has fully disappeared
      setTimeout(() => _tracked.delete(id), duration + 600);
    }
  }

  return id;
}

/**
 * Programmatically dismiss a toast before its timer expires.
 *
 * @param {string} id  value returned by showToast()
 */
export function dismissToast(id) {
  const el = _tracked.get(id);
  if (!el) return;

  const instance = document.querySelector('my-toast');
  if (instance) instance._cleanupToast(el);

  _tracked.delete(id);
}
