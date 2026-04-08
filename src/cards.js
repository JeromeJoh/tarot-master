// --- Card Data & Configuration ---
const ASSETS_PATH = 'assets/tarot/pkt/'

// Helper to generate full card list
const generateCards = () => {
  const cards = []

  // Major Arcana (22 cards: ar00-ar21)
  const majorNames = [
    "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
    "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
    "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
    "The Devil", "The Tower", "The Star", "The Moon", "The Sun",
    "Judgement", "The World"
  ]

  majorNames.forEach((name, i) => {
    const id = `ar${String(i).padStart(2, '0')}`
    cards.push({ id, name, type: 'major', img: `${ASSETS_PATH}${id}.jpg` })
  })

  // Minor Arcana (56 cards: 4 suits × 14 ranks)
  const suits = [
    { code: 'wa', name: 'Wands' },
    { code: 'cu', name: 'Cups' },
    { code: 'sw', name: 'Swords' },
    { code: 'pe', name: 'Pentacles' }
  ]

  const ranks = [
    { code: 'ac', name: 'Ace' },
    { code: '02', name: 'Two' }, { code: '03', name: 'Three' }, { code: '04', name: 'Four' },
    { code: '05', name: 'Five' }, { code: '06', name: 'Six' }, { code: '07', name: 'Seven' },
    { code: '08', name: 'Eight' }, { code: '09', name: 'Nine' }, { code: '10', name: 'Ten' },
    { code: 'pa', name: 'Page' }, { code: 'kn', name: 'Knight' }, { code: 'qu', name: 'Queen' }, { code: 'ki', name: 'King' }
  ]

  suits.forEach(suit => {
    ranks.forEach(rank => {
      const id = `${suit.code}${rank.code}`
      cards.push({
        id,
        name: `${rank.name} of ${suit.name}`,
        type: 'minor',
        img: `${ASSETS_PATH}${id}.jpg`
      })
    })
  })

  return cards
}

export const FULL_DECK = generateCards()

/**
 * Fisher-Yates in-place shuffle algorithm
 * @param {Array} arr - Array to shuffle
 * @returns {Array} - The same array, shuffled in-place
 */
export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Creates a card DOM element
 * @param {Object} card - Card object with id, name, type, img
 * @param {number} index - Index in the deck
 * @returns {HTMLElement} - Card wrapper element
 */
export function createCardElement(card, index) {
  const wrapper = document.createElement('div')
  wrapper.className = 'card-wrapper'
  wrapper.dataset.index = index

  const inner = document.createElement('div')
  inner.className = 'card-inner'

  const back = document.createElement('div')
  back.className = 'card-face card-back'

  const front = document.createElement('div')
  front.className = 'card-face card-front'
  front.style.backgroundImage = `url('${card.img}')`

  inner.appendChild(back)
  inner.appendChild(front)
  wrapper.appendChild(inner)

  return wrapper
}

/**
 * Renders the deck into the scene based on current state
 * @param {string} state - Current game state
 * @param {Array} deck - Current deck array
 * @param {Array} pickedCards - Array of picked cards
 */
export function renderDeck(state, deck, pickedCards) {
  const scene = document.getElementById('scene')
  scene.innerHTML = ''

  if (state === 'PICKING' || state === 'INTRO') {
    // Render carousel of all cards
    deck.forEach((card, i) => {
      const el = createCardElement(card, i)
      scene.appendChild(el)
    })
    // Don't call updateCardPositions here - let gameLoop handle it
  } else if (state === 'REVEALING' || state === 'INTERPRETING') {
    // Render only picked cards centered
    pickedCards.forEach((item, i) => {
      const el = createCardElement(item.card, i)
      el.classList.add('picked-card')
      scene.appendChild(el)
    })
    updatePickedPositions(pickedCards)
  }
}

/**
 * Updates card positions in the carousel with 3D transforms
 * @param {number} currentIndex - Current carousel index (float)
 * @param {Array} deck - Current deck array
 * @param {Array} pickedCards - Array of picked cards
 */
export function updateCardPositions(currentIndex, deck, pickedCards) {
  const cards = document.querySelectorAll('.card-wrapper')
  const width = window.innerWidth

  // Responsive gap calculation
  const gap = Math.min(Math.max(220, width * 0.18), 400)

  // Calculate visible cards based on screen width
  const visibleSideCount = Math.ceil((width / 2) / (gap * 0.5)) + 3

  cards.forEach((card, i) => {
    // Check if card is already picked
    if (card.classList.contains('picked')) {
      return
    }

    const dist = i - currentIndex

    // Hide cards that are too far away
    if (Math.abs(dist) > visibleSideCount) {
      card.style.display = 'none'
      return
    } else {
      card.style.display = 'block'
    }

    // 3D transforms: translateX, translateZ, rotateY, scale
    const x = dist * gap
    const z = -Math.pow(Math.abs(dist), 1.3) * 50

    // Rotation with clamping to prevent face peeking
    let rotateY = dist * 5
    if (rotateY > 45) rotateY = 45
    if (rotateY < -45) rotateY = -45

    // Scale calculation
    let scale = 1
    const isSelected = Math.round(currentIndex) === i

    if (Math.abs(dist) < 0.5) {
      scale = 1.2 - Math.abs(dist) * 0.4
      card.style.zIndex = 1000
    } else {
      scale = 1 - Math.min(Math.abs(dist) * 0.08, 0.4)
      card.style.zIndex = 1000 - Math.floor(Math.abs(dist) * 10)
    }

    // Add selected class to highlighted card
    if (isSelected) {
      card.classList.add('selected')
    } else {
      card.classList.remove('selected')
    }

    // Apply perspective-correct 3D transform
    card.style.transform = `translateX(${x}px) translateZ(${z}px) rotateY(${rotateY}deg) scale(${scale})`
  })
}

/**
 * Updates positions for the 3-slot picked card display
 * @param {Array} pickedCards - Array of picked cards with position labels
 */
export function updatePickedPositions(pickedCards) {
  const cards = document.querySelectorAll('.card-wrapper')
  const width = window.innerWidth

  // Responsive spacing for picked cards
  const spread = Math.min(width * 0.3, 400)
  const positions = [-spread, 0, spread]

  cards.forEach((card, i) => {
    const x = positions[i]

    // Reveal animation with staggered timing
    if (i < pickedCards.length) {
      setTimeout(() => {
        card.classList.add('flipped')
      }, i * 500 + 500)
    }

    card.style.transform = `translateX(${x}px) scale(1.1)`
    card.style.zIndex = 10

    // Add position label if not exists
    if (!card.querySelector('.label') && i < pickedCards.length) {
      const label = document.createElement('div')
      label.className = 'label'
      label.innerText = pickedCards[i].position
      label.style.position = 'absolute'
      label.style.bottom = '-40px'
      label.style.width = '100%'
      label.style.textAlign = 'center'
      label.style.color = '#d4af37'
      label.style.textShadow = '0 0 5px black'
      label.style.fontSize = '1.2rem'
      card.appendChild(label)
    }
  })
}
