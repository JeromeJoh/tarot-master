export default {
  // Status messages
  'status.starting': 'Starting...',
  'status.openPalmToStart': 'Open palm · Press Enter · or tap the button to begin',
  'status.clickToStart': 'Press Enter or tap the button to begin',
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

  // Instructions modal
  'instructions.title': 'How to Play',
  'instructions.close': 'Got it',
  'instructions.steps': [
    {
      icon: '✦',
      heading: 'Begin your reading',
      body: 'Click <strong>✨ Begin</strong> — or hold an open palm toward the camera — to shuffle the deck and start.',
    },
    {
      icon: '👁',
      heading: 'Enable gesture control (optional)',
      body: 'Click the camera icon in the top-right to grant camera access. Once active, you can control everything hands-free.',
    },
    {
      icon: '🃏',
      heading: 'Browse the cards',
      body: 'Move your hand to the <strong>left or right edge</strong> of the screen to scroll through the deck. Use arrow keys as an alternative.',
    },
    {
      icon: '✊',
      heading: 'Select a card',
      body: 'Centre your hand and <strong>hold a fist</strong> over the card you want. A charge ring will fill — release when it completes. Repeat until 3 cards are chosen.',
    },
    {
      icon: '🔮',
      heading: 'Reveal your fate',
      body: 'After 3 cards are selected they are revealed automatically. Click <strong>🔮 Read My Fate</strong> (or hold an open palm) to receive your AI interpretation.',
    },
    {
      icon: '🔑',
      heading: 'API key required for AI reading',
      body: 'Open <strong>Settings</strong> (top-right gear icon) and paste your <a href="https://platform.deepseek.com/api_keys" target="_blank">DeepSeek API key</a>. It is stored locally and never sent anywhere else.',
    },
  ],
}
