# Requirements Document

## Introduction

Refactor the existing vanilla JS tarot card application into a modern stack. The app uses hand gesture recognition (via webcam) to let users browse and select tarot cards, then requests an AI interpretation of the drawn combination. The refactor targets three goals: adopt Vite as the build system, replace the legacy MediaPipe CDN-based Hands API with the modern `@mediapipe/tasks-vision` package, and clean up the UI so all user-facing text is in English with an i18n hook for future language switching. Core gameplay — gesture-driven card selection and AI-powered card reading — must be preserved exactly.

## Glossary

- **App**: The tarot card web application being refactored.
- **Vite**: The build tool and dev server that replaces the current script-tag-only setup.
- **GestureRecognizer**: The `@mediapipe/tasks-vision` `GestureRecognizer` class that replaces the legacy `@mediapipe/hands` CDN package.
- **HandLandmarker**: The `@mediapipe/tasks-vision` `HandLandmarker` class, used as an alternative to `GestureRecognizer` when raw landmark data is needed for custom gesture logic.
- **Deck**: The full 78-card tarot deck (22 Major Arcana + 56 Minor Arcana) used during a session.
- **Session**: A single play-through from camera start to AI interpretation.
- **i18n_Hook**: A thin abstraction (e.g., a `t(key)` function or a strings map) that wraps all UI text so it can be swapped per locale without touching component logic.
- **AI_Client**: The module responsible for calling the DeepSeek chat completions API and streaming the response.
- **Card_Carousel**: The 3D horizontal carousel that displays the shuffled Deck for browsing.
- **Picked_Cards**: The up-to-three cards a user selects during a Session, each tagged with a position label (Past / Present / Future).
- **Interpretation_Modal**: The overlay that streams and renders the AI reading in Markdown.
- **Settings_Modal**: The overlay where the user stores their DeepSeek API key in `localStorage`.

---

## Requirements

### Requirement 1: Vite Build System Migration

**User Story:** As a developer, I want the project to use Vite, so that I get fast HMR during development and an optimized production bundle.

#### Acceptance Criteria

1. THE App SHALL include a `vite.config.js` (or `vite.config.ts`) at the project root that configures the build entry point and any required plugins.
2. WHEN the developer runs `npm run dev`, THE App SHALL start a Vite dev server with hot module replacement enabled.
3. WHEN the developer runs `npm run build`, THE App SHALL produce a production bundle in the `dist/` directory with all assets correctly resolved.
4. THE App SHALL declare all third-party dependencies (MediaPipe, marked, etc.) in `package.json` as npm packages rather than CDN `<script>` tags.
5. THE App SHALL import all modules using ES module `import` syntax; no global CDN script tags SHALL remain in `index.html`.
6. IF a build step fails due to a missing dependency, THEN THE App SHALL surface a clear error message from Vite rather than a silent runtime failure.

---

### Requirement 2: Modern MediaPipe Gesture Recognition

**User Story:** As a user, I want hand gesture recognition to work reliably, so that I can browse and select cards without touching the screen.

#### Acceptance Criteria

1. THE GestureRecognizer SHALL be initialized using `@mediapipe/tasks-vision` (`FilesetResolver` + `GestureRecognizer.createFromOptions`) instead of the legacy `@mediapipe/hands` CDN package.
2. WHEN the webcam stream is active, THE GestureRecognizer SHALL process each video frame and emit landmark data at the same or higher frequency as the legacy implementation.
3. WHEN the user's hand is in the left screen zone (0–33 % of viewport width), THE App SHALL scroll the Card_Carousel toward lower indices.
4. WHEN the user's hand is in the right screen zone (67–100 % of viewport width), THE App SHALL scroll the Card_Carousel toward higher indices.
5. WHEN the user holds a closed-fist gesture in the center zone (33–67 % of viewport width) for 1 000 ms, THE App SHALL select the currently highlighted card.
6. WHEN the user holds an open-palm gesture for 1 500 ms in the IDLE state, THE App SHALL start a new Session.
7. WHEN the user holds an open-palm gesture for 1 500 ms in the INTERPRETING state, THE App SHALL trigger the AI interpretation request.
8. IF the webcam permission is denied, THEN THE App SHALL display a status message prompting the user to grant camera access and offer a retry button.
9. THE App SHALL draw hand landmarks and connectors on the overlay canvas using `DrawingUtils` from `@mediapipe/tasks-vision`.
10. WHEN no hand is detected for more than 2 000 ms, THE App SHALL hide the hand cursor overlay.

---

### Requirement 3: English UI with i18n Hook

**User Story:** As a developer, I want all UI strings centralized in English with an i18n hook, so that adding a new language requires only adding a translation file rather than editing component code.

#### Acceptance Criteria

1. THE App SHALL define an i18n_Hook module that exports a `t(key: string): string` function returning the localized string for the active locale.
2. THE i18n_Hook SHALL ship with a complete English locale file (`en.ts` or `en.js`) containing every user-facing string in the App.
3. WHEN a string key is requested that does not exist in the active locale, THE i18n_Hook SHALL fall back to the English locale and log a warning to the console.
4. THE App SHALL replace every hardcoded Chinese UI string (status messages, button labels, modal headings, gesture guide labels) with a call to `t(key)`.
5. WHERE a future locale file is added and set as the active locale, THE App SHALL render all UI text in that locale without any code changes outside the i18n_Hook module.
6. THE i18n_Hook SHALL expose a `setLocale(locale: string): void` function that switches the active locale at runtime.

---

### Requirement 4: Card Carousel and Selection (Preserved)

**User Story:** As a user, I want to browse a shuffled deck of tarot cards in a 3D carousel and select three cards, so that I can receive a personalized reading.

#### Acceptance Criteria

1. THE Card_Carousel SHALL display all 78 cards of the Deck in a shuffled order at the start of each Session.
2. WHEN the carousel scrolls, THE App SHALL apply perspective-correct 3D transforms (translateX, translateZ, rotateY, scale) to each visible card.
3. WHEN a card is selected, THE App SHALL mark it as picked, hide it from the carousel, and animate a mini-card into the corresponding Picked_Cards slot.
4. THE App SHALL allow the user to select exactly 3 cards per Session; after the third selection THE App SHALL transition to the REVEALING state.
5. WHEN in the REVEALING state, THE App SHALL flip each Picked_Card face-up with a staggered animation (500 ms delay between cards).
6. THE App SHALL assign each Picked_Card a position label: Past, Present, or Future (in that order of selection).
7. WHEN a card is selected, THE App SHALL randomly determine whether it is reversed (30 % probability).

---

### Requirement 5: AI Interpretation (Preserved and Refactored)

**User Story:** As a user, I want an AI-generated reading of my three drawn cards, so that I receive a meaningful and personalized tarot interpretation.

#### Acceptance Criteria

1. THE AI_Client SHALL call the DeepSeek chat completions endpoint (`https://api.deepseek.com/chat/completions`) with the `deepseek-chat` model.
2. THE AI_Client SHALL send the names, positions, and orientations (upright / reversed) of all three Picked_Cards in the prompt.
3. THE AI_Client SHALL use the streaming API (`stream: true`) and render each chunk into the Interpretation_Modal as it arrives.
4. THE App SHALL render the streamed response as Markdown inside the Interpretation_Modal using the `marked` library.
5. IF the API call fails or returns a non-OK HTTP status, THEN THE AI_Client SHALL display a localized error message inside the Interpretation_Modal and log the error to the console.
6. THE App SHALL read the DeepSeek API key exclusively from `localStorage` under the key `deepseek_token`.
7. WHEN no API key is stored, THE App SHALL display a status message (via i18n_Hook) directing the user to the Settings_Modal.

---

### Requirement 6: Settings Modal (Preserved and Localized)

**User Story:** As a user, I want to store my DeepSeek API key locally, so that I can use the AI interpretation feature without re-entering my key each session.

#### Acceptance Criteria

1. THE Settings_Modal SHALL allow the user to enter and save a DeepSeek API key to `localStorage`.
2. WHEN the settings icon is clicked, THE Settings_Modal SHALL become visible.
3. WHEN the user clicks "Save", THE App SHALL persist the entered key to `localStorage` and close the Settings_Modal.
4. WHEN the Settings_Modal opens, THE App SHALL pre-populate the input field with the currently stored key, if any.
5. THE Settings_Modal SHALL display all labels and instructions using the i18n_Hook.

---

### Requirement 7: Visual Effects (Preserved)

**User Story:** As a user, I want the animated star background, particle effects, and cursor trail to remain intact after the refactor, so that the mystical atmosphere is preserved.

#### Acceptance Criteria

1. THE App SHALL render an animated star field on a background canvas that persists across all Session states.
2. WHEN the hand cursor moves, THE App SHALL spawn cursor trail particles at the cursor position.
3. WHEN a card selection is charging (fist held), THE App SHALL spawn charge particles around the targeted card and increase its glow intensity proportionally to hold progress.
4. WHEN the open-palm gesture is held, THE App SHALL spawn ambient particles across the viewport.
5. THE App SHALL display a progress bar that fills over the gesture hold duration for both the start-session and interpret gestures.
