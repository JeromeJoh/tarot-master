// gestures.js — GestureRecognizer init, frame processing, gesture detection
import { FilesetResolver, GestureRecognizer, DrawingUtils } from '@mediapipe/tasks-vision';

// Zone boundaries (normalized x-position of wrist landmark)
export const ZONE = {
  LEFT_MAX: 0.33,
  RIGHT_MIN: 0.67,
};

const NO_HAND_TIMEOUT = 2000;

/**
 * Determine the zone for a normalized wrist x-position.
 * Returns 'left', 'center', or 'right'.
 * @param {number} x - Normalized x-position [0, 1]
 * @returns {'left'|'center'|'right'}
 */
export function getZone(x) {
  if (x <= ZONE.LEFT_MAX) return 'left';
  if (x >= ZONE.RIGHT_MIN) return 'right';
  return 'center';
}

/**
 * Compute target carousel velocity from a normalized wrist x-position.
 * Left zone → negative (scroll toward lower indices)
 * Center zone → zero
 * Right zone → positive (scroll toward higher indices)
 * @param {number} x - Normalized x-position [0, 1]
 * @returns {number} target velocity
 */
export function getZoneVelocity(x) {
  const zone = getZone(x);
  if (zone === 'left') return -1;
  if (zone === 'right') return 1;
  return 0;
}

/**
 * Initialize the GestureRecognizer, start the webcam, and begin the
 * requestAnimationFrame processing loop.
 *
 * @param {HTMLVideoElement} videoEl
 * @param {HTMLCanvasElement} canvasEl
 * @param {{
 *   onGesture: (landmarks: object[], categories: object[]) => void,
 *   onNoHand: () => void,
 *   onCameraError: (err: Error) => void,
 *   onSelectCard?: () => void,
 *   onPalmHold?: () => void,
 * }} callbacks
 * @returns {Promise<void>}
 */
export async function initGestures(videoEl, canvasEl, callbacks) {
  let recognizer;

  // --- Initialize GestureRecognizer ---
  try {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    recognizer = await GestureRecognizer.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: 0.7,
      minHandPresenceConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });
  } catch (err) {
    throw err; // propagate to caller's .catch() — onCameraError is called there
  }

  // --- Start webcam ---
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
    });
    videoEl.srcObject = stream;
    await new Promise((resolve) => {
      videoEl.onloadedmetadata = () => {
        videoEl.play();
        resolve();
      };
    });
  } catch (err) {
    // Stop any partial stream before propagating
    if (videoEl.srcObject) {
      videoEl.srcObject.getTracks().forEach(t => t.stop());
      videoEl.srcObject = null;
    }
    throw err; // propagate to caller's .catch() — onCameraError is called there
  }

  // --- Set up canvas drawing ---
  const ctx = canvasEl.getContext('2d');
  const drawingUtils = new DrawingUtils(ctx);

  let lastHandTime = Date.now();
  let noHandFired = false;

  // --- rAF loop ---
  function processFrame() {
    if (videoEl.readyState < 2) {
      requestAnimationFrame(processFrame);
      return;
    }

    // Sync canvas pixel buffer to video dimensions (leave CSS sizing to stylesheet)
    if (canvasEl.width !== videoEl.videoWidth || canvasEl.height !== videoEl.videoHeight) {
      canvasEl.width = videoEl.videoWidth;
      canvasEl.height = videoEl.videoHeight;
    }

    const nowMs = performance.now();
    const result = recognizer.recognizeForVideo(videoEl, nowMs);

    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    if (result.gestures[0]) { /* gesture detected */ }

    const hasHand =
      result.landmarks && result.landmarks.length > 0 &&
      result.gestures && result.gestures.length > 0;

    if (hasHand) {
      lastHandTime = Date.now();
      noHandFired = false;

      const landmarks = result.landmarks[0];
      const categories = result.gestures[0]; // array of category objects

      // Draw landmarks and connectors — mirroring the reference predictWebcam style
      ctx.save();
      drawingUtils.drawConnectors(
        landmarks,
        GestureRecognizer.HAND_CONNECTIONS,
        { color: '#00FF00', lineWidth: 5 }
      );
      drawingUtils.drawLandmarks(landmarks, {
        color: '#FF0000',
        lineWidth: 2,
      });
      ctx.restore();

      // Notify caller with raw data — all hold/state logic is handled in main.js
      callbacks.onGesture(landmarks, categories);
    } else {
      // No hand detected
      const elapsed = Date.now() - lastHandTime;
      if (elapsed >= NO_HAND_TIMEOUT && !noHandFired) {
        noHandFired = true;
        callbacks.onNoHand();
      }
    }

    requestAnimationFrame(processFrame);
  }

  requestAnimationFrame(processFrame);
}
