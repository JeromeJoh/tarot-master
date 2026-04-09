// main.js — app entry point: wires all modules, owns game state machine
import { t, setLocale, registerLocale } from './i18n.js';
import { FULL_DECK, shuffle, renderDeck, updateCardPositions } from './cards.js';
import { initGestures, getZoneVelocity } from './gestures.js';
import { getInterpretation } from './ai.js';
import { initStars, spawnTrail, spawnChargeParticles, spawnInterpretationParticles, updateProgressBar } from './effects.js';
import { marked } from 'marked';
import { showToast } from './toast.js';
import zhStrings from './locales/zh.js';

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

  switch (newState) {
    case STATE.IDLE:
      statusText().innerText = t('status.openPalmToStart');
      gestureGuide().style.opacity = '1';
      pickedZone().style.display = 'none';
      break;

    case STATE.INTRO:
      statusText().innerText = t('status.spinning');
      pickedZone().style.display = 'none';
      break;

    case STATE.PICKING:
      statusText().innerText = t('status.pickCard');
      pickedZone().style.display = 'flex';
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
      break;
    }
  }
}

// --- Game Logic ---
function startGame() {
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
  modal.style.display = 'block';

  if (loadingSpinner()) loadingSpinner().style.display = 'block';

  let fullText = '';

  getInterpretation(
    pickedCards,
    token,
    (chunk) => {
      fullText += chunk;
      content.innerHTML = marked.parse(fullText);
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

  if (isNotFound) {
    statusText().innerText = t('status.cameraNotFound') || 'No camera found.';
  } else {
    statusText().innerText = t('status.cameraPermission');
    showToast(t('status.cameraPermission'), 'error');
  }

  // Only show retry if it might succeed (not a hardware issue)
  const btn = document.getElementById('start-btn');
  if (btn && !isNotFound) {
    btn.style.display = 'block';
    btn.innerText = t('btn.allowCamera');
    btn.onclick = () => {
      btn.style.display = 'none';
      statusText().innerText = t('status.starting');
      initGestures(
        document.getElementById('webcam-preview'),
        document.getElementById('canvas'),
        { onGesture, onNoHand, onCameraError }
      );
    };
  }
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

// --- Settings Modal ---
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
    const stored = localStorage.getItem('deepseek_token');
    if (tokenInput) tokenInput.value = stored ?? '';
    if (settingsModal) settingsModal.style.display = 'block';
  });

  // Save
  saveBtn?.addEventListener('click', () => {
    const val = tokenInput?.value.trim() ?? '';
    localStorage.setItem('deepseek_token', val);
    if (settingsModal) settingsModal.style.display = 'none';
    showToast(t('toast.settingsSaved'), 'success', 2000);

    // If in INTERPRETING state, update status
    if (currentState === STATE.INTERPRETING) {
      statusText().innerText = val ? t('status.openPalmToRead') : t('status.noToken');
    }
  });

  // Close
  closeBtn?.addEventListener('click', () => {
    if (settingsModal) settingsModal.style.display = 'none';
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
    closeBtn.onclick = () => { if (modal) modal.style.display = 'none'; };
  }
}

// --- Keyboard fallback ---
function initKeyboard() {
  window.addEventListener('keydown', (e) => {
    // Press Enter to start game from IDLE (debug / fallback)
    if (e.key === 'Enter' && currentState === STATE.IDLE) {
      introTargetIndex = Math.floor(FULL_DECK.length / 2);
      startGame();
      return;
    }
    if (currentState !== STATE.PICKING) return;
    if (e.key === 'ArrowLeft') velocity -= 0.1;
    if (e.key === 'ArrowRight') velocity += 0.1;
    if (e.key === 'ArrowUp' || e.key === ' ') selectCard();
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

  // Allow camera button (only visible on camera error)
  const startBtn = el('start-btn');
  if (startBtn && startBtn.style.display !== 'none') {
    startBtn.innerText = t('btn.allowCamera');
  }

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

  // Registered locales list
  const LOCALES = ['en', 'zh'];

  // Validate and apply stored preference
  const stored = localStorage.getItem('preferred_locale');
  const initial = LOCALES.includes(stored) ? stored : 'en';
  switcher.innerText = t(`locale.${initial}`);

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

// --- Camera Detection ---
async function detectCamera() {
  if (!navigator.mediaDevices?.enumerateDevices) {
    showToast(t('toast.mediaApiUnavailable'), 'warning');
    return false;
  }
  const devices = await navigator.mediaDevices.enumerateDevices();
  const hasCamera = devices.some(d => d.kind === 'videoinput');
  if (!hasCamera) {
    showToast(t('toast.noCameraFallback'), 'persistent');
    return false;
  }
  return true;
}

// --- Bootstrap ---
window.addEventListener('DOMContentLoaded', () => {
  // Register zh locale and apply stored preference
  registerLocale('zh', zhStrings);
  const storedLocale = localStorage.getItem('preferred_locale');
  const validLocales = ['en', 'zh'];
  setLocale(validLocales.includes(storedLocale) ? storedLocale : 'en');

  localizeUI();
  initSettingsModal();
  initInterpretationModal();
  initLocaleSwitcher();

  // Stars background
  const bgCanvas = document.getElementById('stars-canvas');
  if (bgCanvas) initStars(bgCanvas);

  // Start game loop
  requestAnimationFrame(gameLoop);

  // Camera detection and graceful degradation
  detectCamera().then((hasCamera) => {
    if (!hasCamera) {
      // No camera: hide gesture guide, skip initGestures, go straight to keyboard mode
      const guide = document.getElementById('gesture-guide');
      if (guide) guide.style.display = 'none';
      setState(STATE.IDLE);
      initKeyboard();
    } else {
      // Camera present: normal gesture init
      statusText().innerText = t('status.starting');
      initGestures(
        document.getElementById('webcam-preview'),
        document.getElementById('canvas'),
        { onGesture, onNoHand, onCameraError }
      ).then(() => {
        setState(STATE.IDLE);
      }).catch(onCameraError);
    }
  });
});
