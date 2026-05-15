export default {
  // Status messages
  'status.starting': 'Starting...',
  'status.openPalmToStart': 'Open palm · Press Enter · or tap the button to begin',
  'status.spinning': 'The wheel of fate begins to turn...',
  'status.pickCard': 'Make a fist to select your card',
  'status.cardsPicked': 'Cards selected: {n}/3',
  'status.fateRevealed': 'Your fate is revealed',
  'status.openPalmToRead': 'Open palm · Press Enter · or tap the button to read your fate',
  'status.noToken': 'Configure your API key to unlock AI reading',
  'status.readingComplete': 'Your fate has been revealed',
  'status.cameraPermission': 'Camera permission required for gesture control',
  'status.cameraNotFound': 'No camera detected. Please connect a camera and refresh.',

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
  'settings.hint': 'No key yet? Visit <a href="https://platform.deepseek.com/api_keys" target="_blank">DeepSeek Platform</a> to get one.',
  'settings.inputLabel': 'API Key',
  'settings.save': 'Save',
  'settings.close': 'Close',
  'settings.saved': 'Settings saved',

  // Buttons
  'btn.allowCamera': 'Allow Camera',
  'btn.interpret': '🔮 Read My Fate',
  'btn.startReading': '✨ Begin',
  'btn.interpretReading': '🔮 Read My Fate',

  // Errors
  'error.apiFailure': 'Oracle connection failed: {message}',
  'error.streamInterrupted': 'Connection interrupted: {message}',

  // Toast notifications
  'toast.noCameraFallback': 'No camera detected. You can use mouse or keyboard to interact.',
  'toast.mediaApiUnavailable': 'Camera API unavailable. Please use HTTPS or try a different browser.',
  'toast.localeSwitched': 'Language switched successfully.',
  'toast.noApiKey': 'No API key configured. Please go to Settings to add your DeepSeek API key.',
  'toast.settingsSaved': 'Settings saved.',

  // AI prompts
  'ai.systemPrompt': 'You are a wise and insightful tarot reader. Provide thoughtful, nuanced interpretations.',
  'ai.userPrompt': 'Interpret the following three-card tarot spread:\n\n{cards}\n\nProvide a thoughtful, insightful reading in Markdown format.',

  // Locale switcher
  'locale.en': 'EN',
  'locale.zh': '中文',
}
