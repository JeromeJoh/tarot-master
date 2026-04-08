// effects.js — stars, particles, cursor trail, charge visuals

/**
 * Initializes an animated star field on the given canvas element.
 * Stars drift upward and twinkle randomly.
 * @param {HTMLCanvasElement} canvasEl
 */
export function initStars(canvasEl) {
  const ctx = canvasEl.getContext('2d');
  let width, height, stars = [];

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvasEl.width = width;
    canvasEl.height = height;
    stars = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2,
        opacity: Math.random(),
        speed: Math.random() * 0.5
      });
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'white';

    stars.forEach(star => {
      ctx.globalAlpha = star.opacity;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();

      star.y -= star.speed;
      if (star.y < 0) star.y = height;

      // Twinkle
      if (Math.random() > 0.95) star.opacity = Math.random();
    });

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize);
  resize();
  animate();
}

/**
 * Spawns a cursor trail particle at (x, y).
 * @param {number} x
 * @param {number} y
 */
export function spawnTrail(x, y) {
  const trail = document.createElement('div');
  trail.className = 'cursor-trail';
  trail.style.left = x + 'px';
  trail.style.top = y + 'px';
  const hue = (Date.now() / 10) % 360;
  trail.style.background = `hsla(${hue}, 80%, 60%, 0.8)`;
  trail.style.boxShadow = `0 0 10px hsla(${hue}, 80%, 60%, 0.8)`;
  document.body.appendChild(trail);
  setTimeout(() => trail.remove(), 500);
}

/**
 * Spawns charge particles around a card rect, with glow proportional to hold progress.
 * @param {DOMRect} rect  — bounding rect of the targeted card
 * @param {number} progress — hold progress in [0, 1]
 */
export function spawnChargeParticles(rect, progress) {
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const count = Math.max(1, Math.round(2 + progress * 4));

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';

    const ox = (Math.random() - 0.5) * rect.width * 0.9;
    const oy = (Math.random() - 0.5) * rect.height * 0.9;

    p.style.left = (x + ox) + 'px';
    p.style.top = (y + oy) + 'px';

    const size = 2 + Math.random() * 6;
    p.style.width = size + 'px';
    p.style.height = size + 'px';

    const glowSize = Math.round(4 + progress * 12);
    if (Math.random() > 0.6) {
      p.style.background = 'var(--accent-gold)';
      p.style.boxShadow = `0 0 ${glowSize}px var(--accent-gold)`;
    }

    document.body.appendChild(p);
    setTimeout(() => p.remove(), 800);
  }
}

/**
 * Spawns ambient particles across the viewport (used during interpretation gesture hold).
 */
export function spawnInterpretationParticles() {
  for (let i = 0; i < 5; i++) {
    const p = document.createElement('div');
    p.className = 'particle';

    p.style.left = Math.random() * window.innerWidth + 'px';
    p.style.top = Math.random() * window.innerHeight + 'px';

    const size = 3 + Math.random() * 8;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.background = 'var(--accent-gold)';
    p.style.boxShadow = '0 0 10px var(--accent-gold)';
    p.style.opacity = '0.8';
    p.style.zIndex = '9999';

    p.animate([
      { transform: 'translateY(0) scale(1)', opacity: 0.8 },
      { transform: 'translateY(-100px) scale(0)', opacity: 0 }
    ], {
      duration: 1000 + Math.random() * 1000,
      easing: 'ease-out'
    });

    document.body.appendChild(p);
    setTimeout(() => p.remove(), 2000);
  }
}

/**
 * Updates the progress bar width based on hold progress.
 * @param {number} progress — value in [0, 1]; clamped automatically
 */
export function updateProgressBar(progress) {
  const bar = document.getElementById('progress-bar') || document.getElementById('charge-progress-bar');
  if (!bar) return;
  const clamped = Math.min(1, Math.max(0, progress));
  bar.style.width = (clamped * 100) + '%';
}
