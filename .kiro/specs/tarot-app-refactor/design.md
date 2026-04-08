# Design Document: Tarot App Refactor

## Overview

The tarot app refactor migrates a monolithic single-file vanilla JS application to a Vite-based ES module project. The three primary goals are:

1. **Vite build system** — replace CDN script tags with npm packages and a proper build pipeline.
2. **Modern MediaPipe** — swap the legacy `@mediapipe/hands` CDN package for `@mediapipe/tasks-vision`'s `GestureRecognizer` API.
3. **English UI with i18n hook** — centralize all user-facing strings in an `en.js` locale file behind a `t(key)` function.

Core gameplay (gesture-driven card carousel, 3-card selection, AI streaming interpretation) is preserved exactly. The refactor is purely structural — no new features, no gameplay changes.

---

## Architecture

The app is restructured from one 1127-line `app.js` into six focused ES modules under `src/`, orchestrated by Vite.

```
tarot-app/
├── index.html              # Entry HTML (no CDN script tags)
├── vite.config.js          # Vite config
├── package.json
├── style.css
├── assets/
│   └── tarot/pkt/          # 78 card images (unchanged)
└── src/
    ├── main.js             # App entry: wires modules, owns game state machine
    ├── cards.js            # Deck data, card element creation, carousel rendering
    ├── gestures.js         # GestureRecognizer init, frame processing, gesture detection
    ├── ai.js               # DeepSeek streaming client
    ├── i18n.js             # t(key), setLocale(), locale registry
    └── effects.js          # Stars, particles, cursor trail, charge visuals
```

### State Machine

The game state machine is unchanged from the original:

```
IDLE → INTRO → PICKING → REVEALING → INTERPRETING
```

`main.js` owns `currentState` and exposes a `setState(newState)` function that other modules call. Modules never mutate state directly.

### Data Flow

```mermaid
graph TD
    gestures.js -->|gesture events| main.js
    main.js -->|state changes| cards.js
    main.js -->|state changes| effects.js
    main.js -->|trigger| ai.js
    ai.js -->|stream chunks| main.js
    main.js -->|t(key)| i18n.js
```

### MediaPipe Migration

The legacy `@mediapipe/hands` CDN package is replaced by `@mediapipe/tasks-vision`:

| Legacy | Modern |
|---|---|
| `new Hands({ locateFile })` | `GestureRecognizer.createFromOptions(vision, opts)` |
| `Camera` utility class | `requestAnimationFrame` loop calling `recognizeForVideo` |
| `drawLandmarks` / `drawConnectors` globals | `DrawingUtils` from `@mediapipe/tasks-vision` |
| Custom `isFist` / `isOpenPalm` landmark math | `GestureRecognizer` category names (`Closed_Fist`, `Open_Palm`) |

WASM files are served via CDN: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm`

---

## Components and Interfaces

### `src/i18n.js`

```js
// Public API
export function t(key: string): string
export function setLocale(locale: string): void

// Internal
let activeLocale = 'en'
const locales = { en: enStrings }
```

Falls back to `en` when a key is missing in the active locale, and logs a `console.warn`.

### `src/cards.js`

```js
export const FULL_DECK: Card[]          // 78-card static array
export function shuffle(arr): arr       // Fisher-Yates in-place shuffle
export function createCardElement(card, index): HTMLElement
export function renderDeck(state, deck, pickedCards): void
export function updateCardPositions(currentIndex, deck, pickedCards): void
export function updatePickedPositions(pickedCards): void
```

### `src/gestures.js`

```js
export async function initGestures(videoEl, canvasEl, callbacks): Promise<void>
// callbacks: { onGesture(landmarks, categories), onNoHand() }
```

Internally owns the `GestureRecognizer` instance and the `requestAnimationFrame` loop. Calls `callbacks.onGesture` each frame a hand is detected, `callbacks.onNoHand` after 2000 ms of no detection.

### `src/ai.js`

```js
export async function getInterpretation(pickedCards, token, onChunk, onDone, onError): Promise<void>
// onChunk(text: string) — called with each streamed markdown chunk
// onDone() — called when stream ends
// onError(err: Error) — called on fetch failure
```

### `src/effects.js`

```js
export function initStars(canvasEl): void
export function spawnTrail(x, y): void
export function spawnChargeParticles(rect, progress): void
export function spawnInterpretationParticles(): void
export function updateProgressBar(progress): void   // 0.0–1.0
```

### `src/main.js`

Wires everything together:
- Calls `initGestures`, `initStars`, registers gesture callbacks
- Owns `currentState`, `currentIndex`, `velocity`, `pickedCards`
- Handles all DOM event listeners (settings modal, keyboard fallback)
- Calls `t(key)` for all status text updates

---

## Data Models

### `Card`

```js
{
  id: string,        // e.g. "ar00", "waac", "cu03"
  name: string,      // e.g. "The Fool", "Ace of Wands"
  type: 'major' | 'minor',
  img: string        // relative path: "assets/tarot/pkt/{id}.jpg"
}
```

### `PickedCard`

```js
{
  card: Card,
  reversed: boolean,          // true with 30% probability
  position: 'Past' | 'Present' | 'Future'
}
```

### Locale File Shape (`src/locales/en.js`)

```js
export default {
  // Status messages
  'status.starting': 'Starting...',
  'status.openPalmToStart': 'Open your palm to begin',
  'status.spinning': 'The wheel of fate begins to turn...',
  'status.pickCard': 'Make a fist to select your card',
  'status.cardsPicked': 'Cards selected: {n}/3',
  'status.fateRevealed': 'Your fate is revealed',
  'status.openPalmToRead': 'Open your palm to read your fate',
  'status.noToken': 'Configure your API key to unlock AI reading',
  'status.readingComplete': 'Your fate has been revealed',
  'status.cameraPermission': 'Camera permission required for gesture control',

  // Gesture guide
  'guide.swipeRight': 'Swipe Right ➡',
  'guide.swipeLeft': '⬅ Swipe Left',
  'guide.fistSelect': 'Make a fist to select',

  // Card positions
  'position.past': 'Past',
  'position.present': 'Present',
  'position.future': 'Future',

  // Interpretation modal
  'modal.interpretation.title': 'Revelation',
  'modal.close': 'Close',

  // Settings modal
  'settings.title': 'API Key Configuration (Local Storage)',
  'settings.description': 'Enter your DeepSeek API Key to enable AI interpretation.',
  'settings.inputLabel': 'API Key',
  'settings.save': 'Save',
  'settings.close': 'Close',
  'settings.saved': 'Settings saved',

  // Buttons
  'btn.allowCamera': 'Allow Camera',
  'btn.interpret': '🔮 Read My Fate',

  // Errors
  'error.apiFailure': 'Oracle connection failed: {message}',
  'error.streamInterrupted': 'Connection interrupted: {message}',
}
```

### GestureRecognizer Configuration

```js
{
  baseOptions: {
    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
    delegate: 'GPU'
  },
  runningMode: 'VIDEO',
  numHands: 1,
  minHandDetectionConfidence: 0.7,
  minHandPresenceConfidence: 0.7,
  minTrackingConfidence: 0.7
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*



### Property 1: i18n locale round-trip

*For any* locale object registered via `setLocale`, calling `t(key)` for any key defined in that locale must return that locale's value — and calling `t(key)` for a key absent from the active locale must return the English fallback value and emit a `console.warn`.

**Validates: Requirements 3.1, 3.3, 3.5, 3.6**

---

### Property 2: Locale completeness — no hardcoded strings

*For any* key referenced by a `t(key)` call in the source, that key must exist in `en.js`. Equivalently, no Chinese characters (Unicode range U+4E00–U+9FFF) may appear in any `.js` file under `src/`.

**Validates: Requirements 3.2, 3.4**

---

### Property 3: Zone-based carousel velocity

*For any* normalized hand x-position in the left zone [0, 0.33], the computed carousel velocity must be negative (scroll toward lower indices). *For any* x-position in the right zone [0.67, 1.0], velocity must be positive. *For any* x-position in the center zone (0.33, 0.67), the target velocity must be zero.

**Validates: Requirements 2.3, 2.4**

---

### Property 4: Fist-hold selection timing

*For any* fist-hold duration less than 1000 ms in the center zone, no card selection must occur. *For any* fist-hold duration of exactly 1000 ms or more, `selectCard` must be called exactly once.

**Validates: Requirements 2.5**

---

### Property 5: Palm-hold state transition timing

*For any* open-palm hold of 1500 ms or more in the IDLE state, the app must transition to INTRO. *For any* open-palm hold of 1500 ms or more in the INTERPRETING state, `getInterpretation` must be called. In both cases, holds shorter than 1500 ms must not trigger the action.

**Validates: Requirements 2.6, 2.7**

---

### Property 6: No-hand cursor hide

*For any* period of 2000 ms or more with no hand detected, the `#hand-cursor` element must have `display: none` (or equivalent hidden state).

**Validates: Requirements 2.10**

---

### Property 7: Deck shuffle produces 78 distinct cards

*For any* call to `startGame()`, the resulting `currentDeck` must contain exactly 78 cards with no duplicate `id` values.

**Validates: Requirements 4.1**

---

### Property 8: Card selection invariants

*For any* sequence of card selections, each `PickedCard` in `pickedCards` must have `position` equal to `['Past', 'Present', 'Future'][index]`. After exactly 3 selections, `currentState` must equal `REVEALING`.

**Validates: Requirements 4.4, 4.6**

---

### Property 9: Reversal probability distribution

*For any* large sample of card selections (n ≥ 1000), the proportion of reversed cards must be within a statistically reasonable range of 30% (e.g., 25%–35%).

**Validates: Requirements 4.7**

---

### Property 10: AI prompt contains all card data

*For any* set of three `PickedCard` values, the prompt string passed to the DeepSeek API must contain each card's `name`, `position` label, and orientation (`upright` / `reversed`).

**Validates: Requirements 5.2**

---

### Property 11: AI streaming renders as Markdown

*For any* sequence of streamed SSE chunks from the DeepSeek API, each chunk's content must be appended to `fullText` and `content.innerHTML` must equal `marked.parse(fullText)` after each update.

**Validates: Requirements 5.3, 5.4**

---

### Property 12: API key read from localStorage

*For any* invocation of `getInterpretation`, the token used in the `Authorization` header must equal `localStorage.getItem('deepseek_token')` and must not be sourced from any other location.

**Validates: Requirements 5.6**

---

### Property 13: Settings round-trip

*For any* API key string entered in the settings input and saved, `localStorage.getItem('deepseek_token')` must equal that string, and reopening the settings modal must pre-populate the input with that same value.

**Validates: Requirements 6.1, 6.3, 6.4**

---

### Property 14: Progress bar fill matches hold progress

*For any* gesture hold duration `t` and total hold time `T`, the progress bar width must equal `clamp(t / T, 0, 1) * 100%`.

**Validates: Requirements 7.5**

---

## Error Handling

### Camera Permission Denied (Req 2.8)

When `getUserMedia` or `GestureRecognizer` initialization throws, `gestures.js` catches the error and calls `callbacks.onCameraError(err)`. `main.js` responds by:
- Setting status text to `t('status.cameraPermission')`
- Showing a retry button labeled `t('btn.allowCamera')` that re-calls `initGestures`

### AI API Failure (Req 5.5)

`ai.js` wraps the fetch and stream loop in a try/catch. On any error:
- Calls `onError(err)` with the caught error
- `main.js` renders `t('error.apiFailure', { message: err.message })` inside the interpretation modal
- Logs the full error to `console.error`

### Missing API Key (Req 5.7)

Before calling `getInterpretation`, `main.js` checks `localStorage.getItem('deepseek_token')`. If absent, it sets status text to `t('status.noToken')` and does not call the AI client.

### Missing i18n Key (Req 3.3)

`t(key)` checks the active locale first, then falls back to `en`. If the key is missing from `en` as well, it returns the key string itself and logs `console.warn('i18n: missing key', key)`.

### Vite Build Errors (Req 1.6)

No special handling needed — Vite surfaces missing dependency errors natively with clear messages. The design relies on Vite's default behavior here.

---

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are required. They are complementary:
- **Unit tests** cover specific examples, integration points, and error conditions
- **Property tests** verify universal invariants across randomized inputs

### Property-Based Testing Library

**[fast-check](https://github.com/dubzzz/fast-check)** (JavaScript/TypeScript) is the chosen PBT library. It integrates with Vitest and supports arbitrary generators for strings, numbers, arrays, and custom types.

Each property test must run a minimum of **100 iterations** (fast-check default is 100; increase with `{ numRuns: 100 }` where needed).

Each property test must include a comment tag in the format:
```
// Feature: tarot-app-refactor, Property {N}: {property_text}
```

### Unit Tests (Vitest)

Focus areas:
- `i18n.js`: `t()` returns correct string, fallback behavior, `setLocale` switches locale
- `cards.js`: `generateCards()` produces 78 unique cards, `shuffle()` preserves length and elements
- `ai.js`: fetch called with correct URL/model, prompt contains card data, error path renders message
- `gestures.js`: zone boundary logic, hold timer logic (with mocked `Date.now`)
- `effects.js`: `updateProgressBar` sets correct width value
- Settings modal: save/load round-trip via mocked `localStorage`

### Property Tests (fast-check + Vitest)

Each correctness property from the design maps to exactly one property-based test:

| Property | Test Description |
|---|---|
| P1: i18n locale round-trip | `fc.string()` keys, arbitrary locale objects |
| P2: Locale completeness | Static analysis: enumerate `t()` calls vs `en.js` keys |
| P3: Zone-based velocity | `fc.float({ min: 0, max: 1 })` for hand x-position |
| P4: Fist-hold timing | `fc.integer({ min: 0, max: 2000 })` for hold duration |
| P5: Palm-hold state transition | `fc.integer({ min: 0, max: 3000 })` for hold duration |
| P6: No-hand cursor hide | `fc.integer({ min: 0, max: 5000 })` for elapsed time |
| P7: Deck shuffle 78 distinct | Run `shuffle(generateCards())` 100 times |
| P8: Card selection invariants | `fc.array(fc.integer({ min: 0, max: 77 }), { minLength: 3, maxLength: 3 })` |
| P9: Reversal probability | `fc.statistics` over 1000 `Math.random() < 0.3` samples |
| P10: AI prompt contains card data | `fc.record` generating arbitrary `PickedCard` triples |
| P11: Streaming renders as Markdown | `fc.array(fc.string())` for SSE chunk sequences |
| P12: API key from localStorage | `fc.string()` for token values, mock localStorage |
| P13: Settings round-trip | `fc.string()` for API key values |
| P14: Progress bar fill | `fc.float({ min: 0, max: 3000 })` for elapsed, `fc.float({ min: 500, max: 2000 })` for total |
