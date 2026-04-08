# Implementation Plan: Tarot App Refactor

## Overview

Migrate the monolithic `app.js` tarot application to a Vite-based ES module project with modern MediaPipe gesture recognition and an English i18n hook. Tasks are ordered so each step integrates cleanly into the previous one, ending with a fully wired application.

## Tasks

- [x] 1. Bootstrap Vite project structure
  - Delete `hands.ts` (MediaPipe demo file, not part of the project)
  - Create `package.json` with dependencies: `vite`, `@mediapipe/tasks-vision`, `marked`, and devDependencies: `vitest`, `fast-check`
  - Create `vite.config.js` at project root with entry point `index.html`
  - Update `index.html` to remove all CDN `<script>` tags and add `<script type="module" src="/src/main.js">`
  - Create empty stub files: `src/main.js`, `src/cards.js`, `src/gestures.js`, `src/ai.js`, `src/i18n.js`, `src/effects.js`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implement i18n module
  - [x] 2.1 Create `src/locales/en.js` with all English strings from the design's locale file shape
    - Include all keys: `status.*`, `guide.*`, `position.*`, `modal.*`, `settings.*`, `btn.*`, `error.*`
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 2.2 Implement `src/i18n.js` with `t(key)` and `setLocale(locale)` exports
    - `t(key)` looks up active locale, falls back to `en`, logs `console.warn` on missing key
    - `setLocale(locale)` switches active locale at runtime
    - _Requirements: 3.1, 3.3, 3.5, 3.6_

  - [ ]* 2.3 Write property test for i18n locale round-trip (Property 1)
    - **Property 1: i18n locale round-trip**
    - Use `fc.string()` keys and arbitrary locale objects to verify `t(key)` returns locale value when present and English fallback when absent
    - Verify `console.warn` is called on missing key
    - **Validates: Requirements 3.1, 3.3, 3.5, 3.6**

  - [ ]* 2.4 Write property test for locale completeness (Property 2)
    - **Property 2: Locale completeness — no hardcoded strings**
    - Enumerate all `t()` call keys in `src/` and verify each exists in `en.js`
    - Assert no Chinese characters (U+4E00–U+9FFF) appear in any `src/*.js` file
    - **Validates: Requirements 3.2, 3.4**

  - [ ]* 2.5 Write unit tests for i18n module
    - Test `t()` returns correct string for known key
    - Test `setLocale()` switches active locale
    - Test fallback to English when key missing from active locale
    - _Requirements: 3.1, 3.3, 3.6_

- [x] 3. Implement cards module
  - [x] 3.1 Implement `src/cards.js` with deck data and carousel logic
    - Define `FULL_DECK` array of 78 `Card` objects (`id`, `name`, `type`, `img`)
    - Implement `shuffle(arr)` using Fisher-Yates in-place algorithm
    - Implement `createCardElement(card, index)` returning an `HTMLElement`
    - Implement `renderDeck(state, deck, pickedCards)` and `updateCardPositions(currentIndex, deck, pickedCards)`
    - Implement `updatePickedPositions(pickedCards)` for the 3-slot picked card display
    - _Requirements: 4.1, 4.2, 4.3, 4.6_

  - [ ]* 3.2 Write property test for deck shuffle (Property 7)
    - **Property 7: Deck shuffle produces 78 distinct cards**
    - Run `shuffle(generateCards())` 100 times; assert each result has exactly 78 cards with no duplicate `id` values
    - **Validates: Requirements 4.1**

  - [ ]* 3.3 Write property test for card selection invariants (Property 8)
    - **Property 8: Card selection invariants**
    - Use `fc.array(fc.integer({ min: 0, max: 77 }), { minLength: 3, maxLength: 3 })` to simulate selection sequences
    - Assert each `PickedCard` has `position` equal to `['Past', 'Present', 'Future'][index]`
    - Assert `currentState` transitions to `REVEALING` after exactly 3 selections
    - **Validates: Requirements 4.4, 4.6**

  - [ ]* 3.4 Write property test for reversal probability (Property 9)
    - **Property 9: Reversal probability distribution**
    - Sample 1000 card selections; assert proportion of reversed cards is within 25%–35%
    - **Validates: Requirements 4.7**

  - [ ]* 3.5 Write unit tests for cards module
    - Test `FULL_DECK` has exactly 78 entries with unique ids
    - Test `shuffle()` preserves all elements and length
    - Test `createCardElement()` returns element with correct data attributes
    - _Requirements: 4.1, 4.7_

- [ ] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement gestures module
  - [x] 5.1 Implement `src/gestures.js` with `@mediapipe/tasks-vision` GestureRecognizer
    - Initialize using `FilesetResolver` + `GestureRecognizer.createFromOptions` with config from design (GPU delegate, VIDEO mode, 1 hand, 0.7 confidence thresholds)
    - Replace legacy `@mediapipe/hands` Camera utility with a `requestAnimationFrame` loop calling `recognizeForVideo`
    - Implement zone detection: left [0, 0.33], center (0.33, 0.67), right [0.67, 1.0] based on normalized wrist x-position
    - Implement hold timers: fist in center for 1000 ms triggers `selectCard`; open palm for 1500 ms triggers state transition
    - Call `callbacks.onNoHand()` after 2000 ms of no detection
    - Draw landmarks using `DrawingUtils` from `@mediapipe/tasks-vision`
    - Call `callbacks.onCameraError(err)` on `getUserMedia` or init failure
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [ ]* 5.2 Write property test for zone-based carousel velocity (Property 3)
    - **Property 3: Zone-based carousel velocity**
    - Use `fc.float({ min: 0, max: 1 })` for hand x-position
    - Assert velocity is negative for x in [0, 0.33], positive for x in [0.67, 1.0], zero for x in (0.33, 0.67)
    - **Validates: Requirements 2.3, 2.4**

  - [ ]* 5.3 Write property test for fist-hold selection timing (Property 4)
    - **Property 4: Fist-hold selection timing**
    - Use `fc.integer({ min: 0, max: 2000 })` for hold duration with mocked `Date.now`
    - Assert no selection occurs for duration < 1000 ms; assert `selectCard` called exactly once for duration ≥ 1000 ms
    - **Validates: Requirements 2.5**

  - [ ]* 5.4 Write property test for palm-hold state transition timing (Property 5)
    - **Property 5: Palm-hold state transition timing**
    - Use `fc.integer({ min: 0, max: 3000 })` for hold duration
    - Assert no transition for duration < 1500 ms in IDLE; assert transition to INTRO for duration ≥ 1500 ms
    - Assert `getInterpretation` called for duration ≥ 1500 ms in INTERPRETING state
    - **Validates: Requirements 2.6, 2.7**

  - [ ]* 5.5 Write property test for no-hand cursor hide (Property 6)
    - **Property 6: No-hand cursor hide**
    - Use `fc.integer({ min: 0, max: 5000 })` for elapsed time since last detection
    - Assert `#hand-cursor` is hidden when elapsed ≥ 2000 ms
    - **Validates: Requirements 2.10**

  - [ ]* 5.6 Write unit tests for gestures module
    - Test zone boundary logic at exact boundary values (0.33, 0.67)
    - Test hold timer resets on gesture change
    - Test camera error callback is invoked on `getUserMedia` rejection
    - _Requirements: 2.3, 2.4, 2.5, 2.8_

- [x] 6. Implement AI client module
  - [x] 6.1 Implement `src/ai.js` with DeepSeek streaming client
    - Implement `getInterpretation(pickedCards, token, onChunk, onDone, onError)`
    - POST to `https://api.deepseek.com/chat/completions` with model `deepseek-chat` and `stream: true`
    - Build prompt including each card's `name`, `position`, and orientation (`upright` / `reversed`)
    - Parse SSE stream, call `onChunk(text)` per chunk, `onDone()` on completion
    - Wrap fetch and stream loop in try/catch; call `onError(err)` on failure
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [ ]* 6.2 Write property test for AI prompt completeness (Property 10)
    - **Property 10: AI prompt contains all card data**
    - Use `fc.record` to generate arbitrary `PickedCard` triples
    - Assert the prompt string contains each card's `name`, `position` label, and orientation string
    - **Validates: Requirements 5.2**

  - [ ]* 6.3 Write property test for streaming Markdown rendering (Property 11)
    - **Property 11: AI streaming renders as Markdown**
    - Use `fc.array(fc.string())` for SSE chunk sequences
    - Assert `content.innerHTML` equals `marked.parse(fullText)` after each chunk is appended
    - **Validates: Requirements 5.3, 5.4**

  - [ ]* 6.4 Write property test for API key source (Property 12)
    - **Property 12: API key read from localStorage**
    - Use `fc.string()` for token values with mocked `localStorage`
    - Assert the `Authorization` header equals `Bearer <localStorage.getItem('deepseek_token')>`
    - **Validates: Requirements 5.6**

  - [ ]* 6.5 Write unit tests for AI client
    - Test fetch called with correct URL and model
    - Test error path calls `onError` and does not call `onDone`
    - Test missing token path (handled in main.js, verify `getInterpretation` is not called)
    - _Requirements: 5.1, 5.5, 5.7_

- [x] 7. Implement effects module
  - [x] 7.1 Implement `src/effects.js` with all visual effects
    - Implement `initStars(canvasEl)` — animated star field on background canvas
    - Implement `spawnTrail(x, y)` — cursor trail particles at hand cursor position
    - Implement `spawnChargeParticles(rect, progress)` — charge particles around targeted card with glow proportional to hold progress
    - Implement `spawnInterpretationParticles()` — ambient particles across viewport
    - Implement `updateProgressBar(progress)` — sets progress bar width to `clamp(progress, 0, 1) * 100%`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 7.2 Write property test for progress bar fill (Property 14)
    - **Property 14: Progress bar fill matches hold progress**
    - Use `fc.float({ min: 0, max: 3000 })` for elapsed and `fc.float({ min: 500, max: 2000 })` for total
    - Assert progress bar width equals `clamp(elapsed / total, 0, 1) * 100%`
    - **Validates: Requirements 7.5**

  - [ ]* 7.3 Write unit tests for effects module
    - Test `updateProgressBar(0)` sets width to `0%`
    - Test `updateProgressBar(1)` sets width to `100%`
    - Test `updateProgressBar(1.5)` clamps to `100%`
    - _Requirements: 7.5_

- [ ] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement main.js — wire all modules together
  - [x] 9.1 Implement state machine and module wiring in `src/main.js`
    - Define states: `IDLE`, `INTRO`, `PICKING`, `REVEALING`, `INTERPRETING`
    - Own `currentState`, `currentIndex`, `velocity`, `pickedCards` variables
    - Call `initStars(bgCanvas)` and `initGestures(videoEl, overlayCanvas, callbacks)` on load
    - Implement gesture callbacks: `onGesture(landmarks, categories)` dispatches to carousel scroll, card selection, and state transitions
    - Implement `onNoHand()` to hide `#hand-cursor` after 2000 ms
    - Implement `onCameraError(err)` to show `t('status.cameraPermission')` and retry button
    - Wire `setState(newState)` to update UI, trigger card reveal animations, and check for AI interpretation trigger
    - Check `localStorage.getItem('deepseek_token')` before calling `getInterpretation`; show `t('status.noToken')` if absent
    - Call `t(key)` for all status text updates — no hardcoded strings
    - _Requirements: 1.5, 2.8, 3.4, 4.4, 4.5, 5.6, 5.7_

  - [x] 9.2 Implement Settings modal DOM wiring
    - Wire settings icon click to show Settings_Modal
    - Wire "Save" button to persist input value to `localStorage` under `deepseek_token` and close modal
    - Wire modal open to pre-populate input from `localStorage`
    - Use `t(key)` for all modal labels
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 9.3 Write property test for settings round-trip (Property 13)
    - **Property 13: Settings round-trip**
    - Use `fc.string()` for API key values with mocked `localStorage`
    - Assert `localStorage.getItem('deepseek_token')` equals saved value
    - Assert reopening modal pre-populates input with stored value
    - **Validates: Requirements 6.1, 6.3, 6.4**

  - [ ]* 9.4 Write unit tests for main.js wiring
    - Test state transitions follow the correct sequence
    - Test `pickedCards` accumulates positions `['Past', 'Present', 'Future']` in order
    - Test missing API key shows `status.noToken` and does not call `getInterpretation`
    - _Requirements: 4.4, 4.6, 5.7_

- [ ] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check with a minimum of 100 iterations each
- Property test files must include the comment tag: `// Feature: tarot-app-refactor, Property {N}: {property_text}`
- `hands.ts` must be deleted in task 1 — it is a MediaPipe demo file unrelated to this project
