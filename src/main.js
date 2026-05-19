// main.js — app entry point: wires all modules, owns game state machine
import { t, setLocale, registerLocale } from './i18n.js';
import { FULL_DECK, shuffle, renderDeck, updateCardPositions } from './cards.js';
import { initGestures, getZoneVelocity } from './gestures.js';
import { getInterpretation } from './ai.js';
import { spawnTrail, spawnChargeParticles, spawnInterpretationParticles, updateProgressBar } from './effects.js';
import { marked } from 'marked';
import { showToast } from './toast.js';
import zhStrings from './locales/zh.js';
import { playIntro, playHeaderCollapse } from './intro.js';

// --- State Machine ---
export const STATE = {
  IDLE: 'IDLE',
  INTRO: 'INTRO',
  PICKING: 'PICKING',
  REVEALING: 'REVEALING',
  INTERPRETING: 'INTERPRETING',
};

// --- Game State ---
let currentState = STATE.IDLE;
let currentIndex = 0;
let velocity = 0;
let pickedCards = [];
let currentDeck = [];

// --- Constants ---
const FRICTION = 0.92;
const MAX_SCROLL_SPEED = 0.2;
const SELECTION_HOLD_TIME = 1000;
const INTERPRET_HOLD_TIME = 1500;

// --- Gesture hold state (managed in main for UI feedback) ---
let isFistHeld = false;
let fistHoldStart = 0;
let isPalmHeld = false;
let palmHoldStart = 0;
let noHandTimer = null;
// Tracks whether camera + gesture recognizer initialised successfully
let cameraReady = false;

// --- DOM refs ---
const statusText = () => document.getElementById('status-text');
const handCursor = () => document.getElementById('hand-cursor');
const progressContainer = () => document.getElementById('charge-progress-container');
const progressBar = () => document.getElementById('progress-bar') || document.getElementById('charge-progress-bar');
const gestureGuide = () => document.getElementById('gesture-guide');
const pickedZone = () => document.getElementById('picked-zone');
const loadingSpinner = () => document.getElementById('loading-spinner');
const interpretModal = () => document.getElementById('interpretation-modal');
const interpretContent = () => document.getElementById('interpretation-content');

// --- State Transitions ---
function setState(newState) {
  currentState = newState;

  const startBtn = document.getElementById('start-btn');
  const interpretBtn = document.getElementById('interpret-btn');

  // Hide both action buttons by default; show per-state below
  if (startBtn) startBtn.style.display = 'none';
  if (interpretBtn) interpretBtn.style.display = 'none';

  switch (newState) {
    case STATE.IDLE:
      // Show palm hint only when gesture control is available
      statusText().innerText = cameraReady
        ? t('status.openPalmToStart')
        : t('status.clickToStart');
      gestureGuide().style.opacity = '1';
      pickedZone().style.display = 'none';
      if (startBtn) {
        startBtn.style.display = 'block';
        startBtn.innerText = t('btn.startReading');
      }
      break;

    case STATE.INTRO:
      statusText().innerText = t('status.spinning');
      pickedZone().style.display = 'none';
      break;

    case STATE.PICKING:
      statusText().innerText = t('status.pickCard');
      pickedZone().style.display = 'flex';
      gestureGuide().style.display = 'flex';
      gestureGuide().style.opacity = '1';
      break;

    case STATE.REVEALING:
      statusText().innerText = t('status.fateRevealed');
      gestureGuide().style.opacity = '0';
      pickedZone().style.opacity = '0';
      renderDeck(currentState, currentDeck, pickedCards);
      // Transition to INTERPRETING after reveal animation
      setTimeout(() => {
        setState(STATE.INTERPRETING);
      }, 2500);
      break;

    case STATE.INTERPRETING: {
      const token = localStorage.getItem('deepseek_token');
      if (token) {
        statusText().innerText = t('status.openPalmToRead');
      } else {
        statusText().innerText = t('status.noToken');
      }
      if (interpretBtn) {
        interpretBtn.style.display = 'block';
        interpretBtn.innerText = t('btn.interpretReading');
      }
      break;
    }
  }
}

// --- Game Logic ---
function startGame() {
  // Collapse the header to the top-left badge before the cards animate in
  playHeaderCollapse().then(() => {
    document.getElementById('header')?.classList.add('collapsed');
  });

  currentDeck = shuffle([...FULL_DECK]);
  pickedCards = [];
  currentIndex = currentDeck.length + 5; // Start off-screen for intro animation

  renderDeck(STATE.INTRO, currentDeck, pickedCards);
  setState(STATE.INTRO);
}

function selectCard() {
  if (currentState !== STATE.PICKING) return;

  const selectedIdx = Math.round(currentIndex);
  if (selectedIdx < 0 || selectedIdx >= currentDeck.length) return;

  const selectedCard = currentDeck[selectedIdx];
  if (pickedCards.some(p => p.card.id === selectedCard.id)) return;

  // Mark card as picked in DOM
  const cardElements = document.querySelectorAll('.card-wrapper');
  cardElements.forEach(el => {
    if (parseInt(el.dataset.index) === selectedIdx) {
      el.classList.add('picked');
      el.style.opacity = '0';
    }
  });

  const isReversed = Math.random() < 0.3;
  const positions = [t('position.past'), t('position.present'), t('position.future')];
  pickedCards.push({
    card: selectedCard,
    reversed: isReversed,
    position: positions[pickedCards.length],
  });

  // Update status with count
  statusText().innerText = t('status.cardsPicked').replace('{n}', pickedCards.length);

  // Animate mini-card into slot
  const slotIndex = pickedCards.length - 1;
  const slot = document.getElementById(`slot-${slotIndex}`);
  if (slot) {
    slot.classList.add('filled');
    const miniCard = document.createElement('div');
    miniCard.className = 'mini-card';
    miniCard.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2rem;color:rgba(212,175,55,0.5);">✦</div>`;
    slot.appendChild(miniCard);
  }

  if (pickedCards.length === 3) {
    setTimeout(() => setState(STATE.REVEALING), 1000);
  }
}

// --- AI Interpretation ---
function triggerInterpretation() {
  const token = localStorage.getItem('deepseek_token');
  if (!token) {
    statusText().innerText = t('status.noToken');
    showToast(t('toast.noApiKey'), 'warning');
    return;
  }

  const modal = interpretModal();
  const content = interpretContent();
  content.innerHTML = '';
  modal?.showModal();

  if (loadingSpinner()) loadingSpinner().style.display = 'block';

  let fullText = '';

  getInterpretation(
    pickedCards,
    token,
    (chunk) => {
      fullText += chunk;
      content.innerHTML = marked.parse(fullText);
      // Auto-scroll to bottom as content streams in
      const modalBody = interpretModal()?.querySelector('.modal-body');
      if (modalBody) modalBody.scrollTop = modalBody.scrollHeight;
    },
    () => {
      if (loadingSpinner()) loadingSpinner().style.display = 'none';
      statusText().innerText = t('status.readingComplete');
    },
    (err) => {
      if (loadingSpinner()) loadingSpinner().style.display = 'none';
      const msg = t('error.apiFailure').replace('{message}', err.message);
      showToast(msg, 'error');
      console.error(err);
    }
  );
}

// --- Game Loop ---
let introTargetIndex = 0;

function gameLoop() {
  if (currentState === STATE.INTRO) {
    const dist = introTargetIndex - currentIndex;
    currentIndex += dist * 0.05;

    if (Math.abs(dist) < 0.1) {
      currentIndex = introTargetIndex;
      setState(STATE.PICKING);
    }
    updateCardPositions(currentIndex, currentDeck, pickedCards);
  }

  if (currentState === STATE.PICKING) {
    currentIndex += velocity;
    velocity *= FRICTION;
    if (Math.abs(velocity) < 0.0001) velocity = 0;

    // Bounds with bounce
    if (currentIndex < 0) { currentIndex = 0; velocity = -velocity * 0.5; }
    if (currentIndex > currentDeck.length - 1) { currentIndex = currentDeck.length - 1; velocity = -velocity * 0.5; }

    updateCardPositions(currentIndex, currentDeck, pickedCards);
  }

  requestAnimationFrame(gameLoop);
}

// --- Gesture Callbacks ---
function onGesture(landmarks, categories) {
  const wrist = landmarks[0];
  const screenX = (1 - wrist.x) * window.innerWidth; // mirrored
  const screenY = wrist.y * window.innerHeight;

  // Update hand cursor
  const cursor = handCursor();
  cursor.style.display = 'block';
  cursor.style.left = screenX + 'px';
  cursor.style.top = screenY + 'px';

  // Cursor trail
  spawnTrail(screenX, screenY);

  // Clear no-hand timer
  if (noHandTimer) { clearTimeout(noHandTimer); noHandTimer = null; }

  const topGesture = categories[0]?.categoryName ?? '';
  const normalizedX = wrist.x; // [0,1], not mirrored, for zone logic

  // --- IDLE / INTERPRETING: palm hold to start or interpret ---
  if (currentState === STATE.IDLE || currentState === STATE.INTERPRETING) {
    if (topGesture === 'Open_Palm') {
      if (!isPalmHeld) {
        isPalmHeld = true;
        palmHoldStart = Date.now();
        if (progressContainer()) progressContainer().style.display = 'block';
        updateProgressBar(0);
      }
      const elapsed = Date.now() - palmHoldStart;
      const progress = Math.min(elapsed / INTERPRET_HOLD_TIME, 1.0);
      updateProgressBar(progress);
      if (Math.random() < 0.5) spawnInterpretationParticles();

      if (elapsed >= INTERPRET_HOLD_TIME) {
        isPalmHeld = false;
        palmHoldStart = 0;
        if (progressContainer()) progressContainer().style.display = 'none';
        updateProgressBar(0);

        if (currentState === STATE.IDLE) {
          introTargetIndex = Math.floor(FULL_DECK.length / 2);
          startGame();
        } else {
          triggerInterpretation();
        }
      }
    } else {
      if (isPalmHeld) {
        isPalmHeld = false;
        palmHoldStart = 0;
        if (progressContainer()) progressContainer().style.display = 'none';
        updateProgressBar(0);
        statusText().innerText = currentState === STATE.IDLE
          ? t('status.openPalmToStart')
          : t('status.openPalmToRead');
      }
    }
    return;
  }

  // --- PICKING: zone scroll + fist select ---
  if (currentState === STATE.PICKING) {
    // Zone-based velocity (use mirrored screen x for zone)
    const mirroredNorm = 1 - normalizedX;
    const width = window.innerWidth;
    const zoneVel = getZoneVelocity(mirroredNorm);

    if (zoneVel !== 0) {
      // Scale velocity by intensity within zone
      let intensity = 1;
      if (zoneVel < 0) {
        intensity = Math.min((width * 0.33 - screenX) / (width * 0.33), 1);
      } else {
        intensity = Math.min((screenX - width * 0.67) / (width * 0.33), 1);
      }
      velocity = velocity * 0.8 + (zoneVel * intensity * MAX_SCROLL_SPEED) * 0.2;
      highlightDirection(zoneVel < 0 ? 'left' : 'right');
    } else {
      if (!isFistHeld) resetHighlights();
    }

    // Fist hold in center zone
    const inCenter = screenX > width * 0.33 && screenX < width * 0.67;
    if (topGesture === 'Closed_Fist' && inCenter) {
      if (!isFistHeld) {
        isFistHeld = true;
        fistHoldStart = Date.now();
        highlightDirection('select');
      }
      const elapsed = Date.now() - fistHoldStart;
      const progress = Math.min(elapsed / SELECTION_HOLD_TIME, 1.0);
      updateProgressBar(progress);

      // Charge glow on target card
      const targetIdx = Math.round(currentIndex);
      document.querySelectorAll('.card-wrapper').forEach(card => {
        if (parseInt(card.dataset.index) === targetIdx) {
          spawnChargeParticles(card.getBoundingClientRect(), progress);
          const glowSize = 30 + progress * 100;
          card.style.boxShadow = `0 0 ${glowSize}px rgba(255,255,255,0.9), 0 0 ${glowSize * 0.5}px rgba(255,255,255,1)`;
          card.style.filter = `brightness(${1 + progress * 1.5})`;
        } else {
          card.style.filter = '';
          card.style.boxShadow = '';
        }
      });

      if (elapsed >= SELECTION_HOLD_TIME) {
        isFistHeld = false;
        fistHoldStart = 0;
        updateProgressBar(0);
        resetHighlights();
        document.querySelectorAll('.card-wrapper').forEach(c => { c.style.filter = ''; c.style.boxShadow = ''; });
        selectCard();
      }
    } else {
      if (isFistHeld) {
        isFistHeld = false;
        fistHoldStart = 0;
        updateProgressBar(0);
        resetHighlights();
        document.querySelectorAll('.card-wrapper').forEach(c => { c.style.filter = ''; c.style.boxShadow = ''; });
      }
    }
  }
}

function onNoHand() {
  handCursor().style.display = 'none';
  isFistHeld = false;
  fistHoldStart = 0;
  isPalmHeld = false;
  palmHoldStart = 0;
  updateProgressBar(0);
  if (progressContainer()) progressContainer().style.display = 'none';
}

function onCameraError(err) {
  console.error('Camera error:', err);

  const isNotFound = err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError';

  // Fall back to IDLE so the manual start button stays visible
  setState(STATE.IDLE);

  // Update status text — no toast on camera errors
  if (isNotFound) {
    statusText().innerText = t('status.cameraNotFound') || 'No camera found.';
  } else {
    statusText().innerText = t('status.cameraPermission');
  }

  // Re-show the camera button so the user can retry
  const btn = document.getElementById('allow-camera-btn');
  if (btn) btn.style.display = 'inline-flex';
}

// --- Zone highlight helpers ---
function highlightDirection(dir) {
  resetHighlights();
  if (dir === 'left') document.getElementById('zone-left')?.classList.add('active');
  if (dir === 'right') document.getElementById('zone-right')?.classList.add('active');
  if (dir === 'select') {
    document.getElementById('zone-center')?.classList.add('active');
    document.getElementById('icon-select')?.classList.add('active');
  }
}

function resetHighlights() {
  document.getElementById('zone-left')?.classList.remove('active');
  document.getElementById('zone-right')?.classList.remove('active');
  document.getElementById('zone-center')?.classList.remove('active');
  document.getElementById('icon-select')?.classList.remove('active');
}

// --- Instructions Modal ---
function initInstructionsModal() {
  const btn = document.getElementById('instructions-btn');
  const modal = document.getElementById('instructions-modal');
  const closeBtn = document.getElementById('instructions-close-btn');
  const list = document.getElementById('instructions-steps');
  if (!btn || !modal || !list) return;

  function buildSteps() {
    const steps = t('instructions.steps');
    if (!Array.isArray(steps)) return;
    list.innerHTML = '';
    steps.forEach(({ icon, heading, body }) => {
      const li = document.createElement('li');
      li.className = 'instructions-step';
      li.innerHTML = `
        <div class="instructions-step-icon" aria-hidden="true">${icon}</div>
        <div class="instructions-step-body">
          <div class="instructions-step-heading">${heading}</div>
          <div class="instructions-step-text">${body}</div>
        </div>`;
      list.appendChild(li);
    });
  }

  function openModal() {
    // Rebuild steps so locale changes are reflected
    buildSteps();
    const titleEl = modal.querySelector('h2');
    if (titleEl) titleEl.innerText = t('instructions.title');
    if (closeBtn) closeBtn.innerText = t('instructions.close');
    modal.showModal();
  }

  function closeModal() {
    modal.close();
  }

  btn.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);

  // Dialog element automatically handles Escape key
}
function initSettingsModal() {
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const saveBtn = document.getElementById('save-settings-btn');
  const closeBtn = document.getElementById('close-settings-btn');
  const tokenInput = document.getElementById('api-token-input');

  // Apply i18n to modal labels
  const titleEl = settingsModal?.querySelector('h2');
  if (titleEl) titleEl.innerText = t('settings.title');

  const descEls = settingsModal?.querySelectorAll('p');
  if (descEls?.[0]) descEls[0].innerText = t('settings.description');
  if (descEls?.[1]) descEls[1].innerHTML = t('settings.hint');

  if (saveBtn) saveBtn.innerText = t('settings.save');
  if (closeBtn) closeBtn.innerText = t('settings.close');

  // Pre-populate on open
  settingsBtn?.addEventListener('click', () => {
    console.log('Opening settings modal');
    const stored = localStorage.getItem('deepseek_token');
    if (tokenInput) tokenInput.value = stored ?? '';
    if (settingsModal) settingsModal.showModal();
  });

  // Save
  saveBtn?.addEventListener('click', () => {
    const val = tokenInput?.value.trim() ?? '';
    localStorage.setItem('deepseek_token', val);
    if (settingsModal) settingsModal.close();
    showToast(t('toast.settingsSaved'), 'success', 2000);

    // If in INTERPRETING state, update status
    if (currentState === STATE.INTERPRETING) {
      statusText().innerText = val ? t('status.openPalmToRead') : t('status.noToken');
    }
  });

  // Close
  closeBtn?.addEventListener('click', () => {
    if (settingsModal) settingsModal.close();
  });
}

// --- Interpretation Modal close button ---
function initInterpretationModal() {
  const modal = interpretModal();
  const titleEl = modal?.querySelector('h2');
  if (titleEl) titleEl.innerText = t('modal.interpretation.title');

  const closeBtn = modal?.querySelector('button');
  if (closeBtn) {
    closeBtn.innerText = t('modal.close');
    closeBtn.onclick = () => { if (modal) modal.close(); };
  }
}

// --- Keyboard fallback ---
function initKeyboard() {
  window.addEventListener('keydown', (e) => {
    // Press Enter to start game from IDLE, or trigger interpretation from INTERPRETING
    if (e.key === 'Enter') {
      if (currentState === STATE.IDLE) {
        introTargetIndex = Math.floor(FULL_DECK.length / 2);
        startGame();
        return;
      }
      if (currentState === STATE.INTERPRETING) {
        triggerInterpretation();
        return;
      }
    }
    if (currentState !== STATE.PICKING) return;
    if (e.key === 'ArrowLeft') velocity -= 0.1;
    if (e.key === 'ArrowRight') velocity += 0.1;
    if (e.key === 'ArrowUp' || e.key === ' ') selectCard();
  });
}

// --- Center button click handlers ---
function initCenterButtons() {
  const startBtn = document.getElementById('start-btn');
  const interpretBtn = document.getElementById('interpret-btn');

  startBtn?.addEventListener('click', () => {
    if (currentState === STATE.IDLE) {
      introTargetIndex = Math.floor(FULL_DECK.length / 2);
      startGame();
    }
  });

  interpretBtn?.addEventListener('click', () => {
    if (currentState === STATE.INTERPRETING) {
      triggerInterpretation();
    }
  });
}

// --- Localize static UI strings ---
function localizeUI() {
  const el = (id) => document.getElementById(id);

  // Gesture guide labels
  const zoneLeft = el('zone-left');
  if (zoneLeft) zoneLeft.innerHTML = t('guide.swipeRight');

  const zoneRight = el('zone-right');
  if (zoneRight) zoneRight.innerHTML = t('guide.swipeLeft');

  const iconSelect = el('icon-select');
  if (iconSelect) {
    const label = iconSelect.nextElementSibling;
    if (label) label.innerText = t('guide.fistSelect');
  }

  // Settings modal
  const settingsModal = el('settings-modal');
  if (settingsModal) {
    const titleEl = settingsModal.querySelector('h2');
    if (titleEl) titleEl.innerText = t('settings.title');
    const descEls = settingsModal.querySelectorAll('p');
    if (descEls?.[0]) descEls[0].innerText = t('settings.description');
    if (descEls?.[1]) descEls[1].innerHTML = t('settings.hint');
  }
  const saveBtn = el('save-settings-btn');
  if (saveBtn) saveBtn.innerText = t('settings.save');
  const closeSettingsBtn = el('close-settings-btn');
  if (closeSettingsBtn) closeSettingsBtn.innerText = t('settings.close');

  // Interpretation modal
  const modal = interpretModal();
  if (modal) {
    const titleEl = modal.querySelector('h2');
    if (titleEl) titleEl.innerText = t('modal.interpretation.title');
    const closeBtn = modal.querySelector('button');
    if (closeBtn) closeBtn.innerText = t('modal.close');
  }

  // Action buttons (text only; visibility is managed by setState)
  const startBtn = el('start-btn');
  if (startBtn) startBtn.innerText = t('btn.startReading');

  const interpretBtn = el('interpret-btn');
  if (interpretBtn) interpretBtn.innerText = t('btn.interpretReading');

  // Allow camera button is now icon-only in the top bar — no text to update

  // Locale switcher button label
  const switcher = el('locale-switcher');
  if (switcher) {
    const stored = localStorage.getItem('preferred_locale') || 'en';
    switcher.innerText = t(`locale.${stored}`);
  }
}

// --- Locale Switcher ---
function initLocaleSwitcher() {
  const switcher = document.getElementById('locale-switcher');
  if (!switcher) return;

  const LOCALES = ['en', 'zh'];

  // Always start in English
  switcher.innerText = t('locale.en');

  switcher.addEventListener('click', () => {
    const current = localStorage.getItem('preferred_locale') || 'en';
    const next = current === 'en' ? 'zh' : 'en';

    setLocale(next);
    localStorage.setItem('preferred_locale', next);
    switcher.innerText = t(`locale.${next}`);

    localizeUI();
    // Re-apply current state text after locale change
    setState(currentState);

    showToast(t('toast.localeSwitched'), 'success', 2000);
  });
}

// --- Camera / Gesture init (on-demand, triggered by allow-camera-btn) ---
function initCameraBtn() {
  const btn = document.getElementById('allow-camera-btn');
  if (!btn) return;

  // Show the button by default — user clicks to enable gesture control
  btn.style.display = 'inline-flex';

  btn.addEventListener('click', () => {
    // Hide button while loading; it reappears on error via onCameraError
    btn.style.display = 'none';
    statusText().innerText = t('status.starting');

    initGestures(
      document.getElementById('webcam-preview'),
      document.getElementById('canvas'),
      { onGesture, onNoHand, onCameraError }
    ).then(() => {
      document.getElementById('webcam-preview').style.display = 'block';
      document.getElementById('canvas').style.display = 'block';
      cameraReady = true;
      setState(STATE.IDLE);
    }).catch(onCameraError);
  });
}

// --- Bootstrap ---
window.addEventListener('DOMContentLoaded', () => {
  // Register zh locale.
  // Always start in English — locale preference is session-only, not persisted.
  registerLocale('zh', zhStrings);
  localStorage.removeItem('preferred_locale');
  setLocale('en');

  localizeUI();
  initInstructionsModal();
  initSettingsModal();
  initInterpretationModal();
  initLocaleSwitcher();

  // Stars background replaced by <galaxy-background> web component in index.html
  // Start game loop
  requestAnimationFrame(gameLoop);

  // Keyboard shortcuts and center button clicks — always active
  initKeyboard();
  initCenterButtons();

  // Camera button wires up on-demand gesture init (no auto camera request on load)
  initCameraBtn();

  // Run intro animation, then enter IDLE state
  playIntro().then(() => {
    setState(STATE.IDLE);
  });
});
