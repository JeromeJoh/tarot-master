/**
 * intro.js — GSAP-powered intro sequence + header collapse animation
 *
 * Phase 1 (intro):
 *   "Mystic" slides up from the horizontal centre line
 *   "Tarot"  slides down from the horizontal centre line
 *   They meet with a gap that lets the background glow bleed through.
 *
 * Phase 2 (collapse, triggered by playHeaderCollapse):
 *   The whole #header shrinks and moves to the top-left corner,
 *   status / progress / controls fade out, only the h1 title remains.
 */

// GSAP is loaded as a plain <script> tag before this module runs.
const gsap = window.gsap;

// ─── CSS state classes ────────────────────────────────────────────────────────

/**
 * Run the intro title animation.
 * Returns a Promise that resolves when the animation is complete.
 * @returns {Promise<void>}
 */
export function playIntro() {
  return new Promise((resolve) => {
    const header = document.querySelector('header');
    const mystic = header?.querySelector('.word-mystic');
    const tarot = header?.querySelector('.word-tarot');
    const subItems = document.querySelectorAll('#status-text, #charge-progress-container');

    if (!gsap || !header || !mystic || !tarot) {
      resolve();
      return;
    }

    // ── Initial state ──────────────────────────────────────────────────────
    // Hide sub-items until after the title lands
    gsap.set(subItems, { opacity: 0, y: 10 });

    // Both words start at y=0 (their natural stacked position) but clipped:
    // Mystic starts below its own baseline (slides UP into view)
    // Tarot  starts above its own baseline (slides DOWN into view)
    gsap.set(mystic, { y: '100%', opacity: 0 });
    gsap.set(tarot, { y: '-100%', opacity: 0 });

    // ── Timeline ──────────────────────────────────────────────────────────
    const tl = gsap.timeline({ onComplete: resolve });

    // Small delay so the page has painted
    tl.delay(0.2);

    // Words converge toward the centre line
    tl.to(mystic, {
      y: 0,
      opacity: 1,
      duration: 1.1,
      ease: 'power3.out',
    }, 0);

    tl.to(tarot, {
      y: 0,
      opacity: 1,
      duration: 1.1,
      ease: 'power3.out',
    }, 0.08); // slight stagger so they don't land at exactly the same frame

    tl.to('header h1', {
      scale: 0.8,
    }, '-=0.5'); // header itself doesn't move but we can use it as a common timeline for sequencing

    // Fade in status text after title settles
    tl.to(subItems, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out',
      stagger: 0.1,
    }, '-=0.2');
  });
}

/**
 * Collapse the header from its centred intro position to a compact
 * top-left corner badge showing only the h1 title.
 *
 * Call this after the user triggers the game start.
 * @returns {Promise<void>}
 */
export function playHeaderCollapse() {
  return new Promise((resolve) => {
    if (!gsap) { resolve(); return; }

    const header = document.getElementById('header');
    const uiLayer = document.getElementById('ui-layer');
    const subItems = document.querySelectorAll('#status-text, #charge-progress-container');
    const controls = document.getElementById('controls');

    if (!header) { resolve(); return; }

    // Snapshot the current centred position so GSAP can tween from it
    const fromRect = header.getBoundingClientRect();

    // ── Target geometry (top-left badge) ──────────────────────────────────
    // We switch the header to position:fixed so it escapes the flex layout
    const PAD = 20; // px from viewport edge

    const tl = gsap.timeline({ onComplete: resolve });

    // 1. Fade out sub-items
    tl.to(subItems, {
      opacity: 0,
      y: -8,
      duration: 0.35,
      ease: 'power2.in',
      stagger: 0.06,
    });

    // 2. Simultaneously shrink font and collapse padding
    tl.to(header.querySelector('h1'), {
      fontSize: '1rem',
      letterSpacing: '3px',
      duration: 0.55,
      ease: 'power2.inOut',
    }, '-=0.1');

    tl.to(header, {
      // Animate to top-left corner
      x: -(fromRect.left - PAD),
      y: -(fromRect.top - PAD),
      padding: '8px 18px',
      minWidth: 0,
      borderRadius: '50px',
      duration: 0.65,
      ease: 'power3.inOut',
    }, '<');

    // 3. After collapse, lock it in place with CSS so it stays on resize
    tl.call(() => {
      // Convert to fixed positioning
      Object.assign(header.style, {
        position: 'fixed',
        top: PAD + 'px',
        left: PAD + 'px',
        transform: 'none',
        margin: '0',
        minWidth: '0',
        padding: '8px 18px',
        borderRadius: '50px',
        alignSelf: 'unset',
      });
      // Clear the GSAP inline transform so CSS takes over cleanly
      gsap.set(header, { clearProps: 'x,y,transform' });

      // Hide sub-items from layout entirely
      if (subItems) subItems.forEach(el => { el.style.display = 'none'; });
    });
  });
}
