import { STRATEGY_CARDS, cardById } from './data/strategyCards'

export const SEATS = [1, 2, 3, 4, 5, 6]
const STORAGE_KEY = 'ti-tracker/v1'

export const SCREENS = ['setup', 'strategy', 'action', 'status', 'agenda']

const zeroed = () => Object.fromEntries(SEATS.map((s) => [s, 0]))

export const initialState = () => ({
  screen: 'setup',
  round: 1,
  seats: SEATS.map((seat) => ({ seat, color: null, factionId: null })),
  speakerSeat: 1,
  picks: {},          // cardId -> seat, cleared each round
  cardTG: {},         // cardId -> trade goods sitting on it, carries between rounds
  tgGained: {},       // seat -> trade goods collected when they picked, this round
  exhausted: [],      // cardIds whose strategic action has been performed this round
  passed: [],         // seats out for the rest of the round
  turnIndex: 0,       // position in the initiative order
  pendingAction: null,// 'strategy' | 'tactical' | 'pass', awaiting confirmation
  speakerPrompt: false,
  scores: zeroed(),
  votes: zeroed(),
  initiativeSeats: [...SEATS], // header order; only recomputed when cards are drafted
  toast: null,
})

// ---------------------------------------------------------------- selectors

/** Seats clockwise starting from `start`. */
export const seatOrderFrom = (start) =>
  SEATS.map((_, i) => ((start - 1 + i) % SEATS.length) + 1)

/** The seat whose turn it is to draft, or null once everyone has picked. */
export function currentDrafter(state) {
  const order = seatOrderFrom(state.speakerSeat)
  const taken = Object.keys(state.picks).length
  return taken < order.length ? order[taken] : null
}

/** Seats in initiative order, i.e. sorted by the initiative of the card they hold. */
export function initiativeOrder(picks) {
  return STRATEGY_CARDS.filter((c) => picks[c.id] != null)
    .sort((a, b) => a.initiative - b.initiative)
    .map((c) => picks[c.id])
}

/** The card a seat holds this round, or null. */
export const cardForSeat = (picks, seat) => {
  const id = Object.keys(picks).find((cid) => picks[cid] === seat)
  return id ? cardById(id) : null
}

export const seatOf = (state, seat) => state.seats.find((s) => s.seat === seat)

/** Whose turn it is in the action phase, or null when everyone has passed. */
export function activeSeat(state) {
  const order = initiativeOrder(state.picks)
  if (!order.length) return null
  for (let i = 0; i < order.length; i++) {
    const seat = order[(state.turnIndex + i) % order.length]
    if (!state.passed.includes(seat)) return seat
  }
  return null
}

export const setupComplete = (state) =>
  state.seats.every((s) => s.color && s.factionId)

// ------------------------------------------------------------------ reducer

function advanceTurn(state) {
  const order = initiativeOrder(state.picks)
  for (let i = 1; i <= order.length; i++) {
    const idx = (state.turnIndex + i) % order.length
    if (!state.passed.includes(order[idx])) {
      return { ...state, turnIndex: idx, pendingAction: null }
    }
  }
  // Nobody left to act — the round's action phase is over.
  return { ...state, pendingAction: null, screen: 'status' }
}

export function reducer(state, action) {
  switch (action.type) {
    case 'SET_SEAT': {
      const seats = state.seats.map((s) =>
        s.seat === action.seat ? { ...s, ...action.patch } : s
      )
      return { ...state, seats }
    }

    case 'START_STRATEGY':
      return { ...state, screen: 'strategy' }

    case 'PICK_CARD': {
      const seat = currentDrafter(state)
      if (seat == null || state.picks[action.cardId] != null) return state
      const gained = state.cardTG[action.cardId] || 0
      return {
        ...state,
        picks: { ...state.picks, [action.cardId]: seat },
        cardTG: { ...state.cardTG, [action.cardId]: 0 },
        tgGained: gained ? { ...state.tgGained, [seat]: gained } : state.tgGained,
      }
    }

    case 'UNDO_PICK': {
      // Removes the most recent pick, for the inevitable misclick.
      const ids = Object.keys(state.picks)
      if (!ids.length) return state
      const order = seatOrderFrom(state.speakerSeat)
      const lastSeat = order[ids.length - 1]
      const cardId = ids.find((id) => state.picks[id] === lastSeat)
      if (!cardId) return state
      const picks = { ...state.picks }
      delete picks[cardId]
      const tgGained = { ...state.tgGained }
      const restored = tgGained[lastSeat] || 0
      delete tgGained[lastSeat]
      return {
        ...state,
        picks,
        tgGained,
        cardTG: { ...state.cardTG, [cardId]: restored },
      }
    }

    case 'START_ACTION': {
      // Unpicked cards each gain a trade good, placed by the speaker.
      const cardTG = { ...state.cardTG }
      for (const card of STRATEGY_CARDS) {
        if (state.picks[card.id] == null) cardTG[card.id] = (cardTG[card.id] || 0) + 1
      }
      return {
        ...state,
        cardTG,
        screen: 'action',
        turnIndex: 0,
        passed: [],
        exhausted: [],
        pendingAction: null,
        initiativeSeats: initiativeOrder(state.picks),
      }
    }

    case 'SELECT_ACTION':
      return { ...state, pendingAction: action.kind }

    case 'CONFIRM_ACTION': {
      const seat = activeSeat(state)
      if (seat == null || !state.pendingAction) return state
      const card = cardForSeat(state.picks, seat)

      if (state.pendingAction === 'strategy') {
        const next = { ...state, exhausted: [...state.exhausted, card.id] }
        // Politics hands the speaker token to another player before the turn ends.
        if (card.id === 'politics') return { ...next, speakerPrompt: true }
        return advanceTurn(next)
      }

      if (state.pendingAction === 'pass') {
        return advanceTurn({ ...state, passed: [...state.passed, seat] })
      }

      return advanceTurn(state) // tactical / component
    }

    case 'SET_SPEAKER':
      return advanceTurn({ ...state, speakerSeat: action.seat, speakerPrompt: false })

    case 'ADJUST_SCORE': {
      const next = Math.max(0, (state.scores[action.seat] || 0) + action.delta)
      return { ...state, scores: { ...state.scores, [action.seat]: next } }
    }

    case 'SET_VOTES':
      return { ...state, votes: { ...state.votes, [action.seat]: action.value } }

    case 'GOTO':
      return { ...state, screen: action.screen }

    case 'NEW_ROUND':
      return {
        ...state,
        round: state.round + 1,
        screen: 'strategy',
        picks: {},
        tgGained: {},
        exhausted: [],
        passed: [],
        turnIndex: 0,
        pendingAction: null,
        votes: zeroed(),
        toast: `NEW ROUND: ${state.round + 1}`,
      }

    case 'CLEAR_TOAST':
      return { ...state, toast: null }

    case 'RESET':
      return initialState()

    default:
      return state
  }
}

// -------------------------------------------------------------- persistence

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState()
    return { ...initialState(), ...JSON.parse(raw), toast: null }
  } catch {
    return initialState()
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* private browsing, quota, etc. — the game just won't survive a refresh */
  }
}
