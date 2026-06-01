// animations.js — GSAP animations for UI elements
import gsap from 'gsap';

/**
 * Start continuous pulse animation on action buttons
 */
export function startButtonPulse() {
  const buttons = document.querySelectorAll('#start-btn, #interpret-btn');
  if (buttons.length === 0) return;

  buttons.forEach(btn => {
    // Only animate visible buttons
    if (btn.style.display === 'none') return;

    // Kill any existing animations on this button first
    gsap.killTweensOf(btn);

    gsap.timeline({ repeat: -1, overwrite: true })
      .to(btn, {
        boxShadow: '0 0 28px rgba(201, 168, 76, 0.45), 0 0 56px rgba(232, 168, 124, 0.35), 0 0 80px rgba(139, 127, 199, 0.35)',
        duration: 1.4,
        ease: 'sine.inOut'
      })
      .to(btn, {
        boxShadow: '0 0 12px rgba(201, 168, 76, 0.45), 0 0 24px rgba(232, 168, 124, 0.35)',
        duration: 1.4,
        ease: 'sine.inOut'
      });
  });
}

/**
 * Stop button pulse animation
 */
export function stopButtonPulse() {
  const buttons = document.querySelectorAll('#start-btn, #interpret-btn');
  buttons.forEach(btn => {
    gsap.killTweensOf(btn);
  });
}

/**
 * Animate guide icon scale when active
 */
export function animateGuideIcon(iconEl) {
  if (!iconEl) return;
  gsap.to(iconEl, {
    scale: 1.2,
    duration: 0.3,
    ease: 'back.out'
  });
}

/**
 * Animate guide icon back to normal scale
 */
export function resetGuideIcon(iconEl) {
  if (!iconEl) return;
  gsap.to(iconEl, {
    scale: 1,
    duration: 0.3,
    ease: 'back.in'
  });
}

/**
 * Animate mini card flying into slot
 */
export function animateMiniCardFlyIn(miniCard) {
  if (!miniCard) return;
  gsap.set(miniCard, { y: -300, scale: 1.5, opacity: 0 });
  gsap.to(miniCard, {
    y: 0,
    scale: 1,
    opacity: 1,
    duration: 0.5,
    ease: 'power3.out'
  });
}

/**
 * Animate settings button SVG rotation on hover
 */
export function enableSettingsButtonRotate() {
  const settingsBtn = document.getElementById('settings-btn');
  if (!settingsBtn) return;

  const svg = settingsBtn.querySelector('svg');
  if (!svg) return;

  settingsBtn.addEventListener('mouseenter', () => {
    gsap.to(svg, {
      rotation: 90,
      duration: 0.4,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  });

  settingsBtn.addEventListener('mouseleave', () => {
    gsap.to(svg, {
      rotation: 0,
      duration: 0.4,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  });
}

/**
 * Animate loading spinner
 */
export function startSpinner(spinnerEl) {
  if (!spinnerEl) return;
  gsap.to(spinnerEl, {
    rotation: 360,
    duration: 1,
    ease: 'none',
    repeat: -1
  });
}

/**
 * Stop spinner animation
 */
export function stopSpinner(spinnerEl) {
  if (!spinnerEl) return;
  gsap.killTweensOf(spinnerEl);
}

/**
 * Animate card flip with 3D effect
 */
export function animateCardFlip(cardInner, duration = 0.8) {
  if (!cardInner) return;
  gsap.to(cardInner, {
    rotationY: 180,
    duration,
    ease: 'power2.inOut'
  });
}

/**
 * Animate SVG border growth
 */
export function animateBorderGrow(pathEl) {
  if (!pathEl) return;
  const pathLength = pathEl.getTotalLength?.() || 2600;
  gsap.to(pathEl, {
    strokeDashoffset: 0,
    duration: 4,
    ease: 'power2.inOut'
  });
}

/**
 * Animate SVG inner decorations fade in
 */
export function animateInnerDecoFadeIn(decoEls) {
  if (!decoEls || decoEls.length === 0) return;
  gsap.to(decoEls, {
    opacity: 0.4,
    duration: 1.5,
    ease: 'power2.out',
    delay: 3
  });
}

/**
 * Animate content text fade up
 */
export function animateContentUp(contentEl) {
  if (!contentEl) return;
  gsap.set(contentEl, { y: 10, opacity: 0 });
  gsap.to(contentEl, {
    y: 0,
    opacity: 1,
    duration: 1.5,
    ease: 'power2.out',
    delay: 2.5
  });
}
