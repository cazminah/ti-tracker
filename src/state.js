import { STRATEGY_CARDS, cardById } from './data/strategyCards'
import { elapsedSince } from './time'

export const SEATS = [1, 2, 3, 4, 5, 6]
const STORAGE_KEY = 'ti-tracker/v1'

export const SCREENS = ['setup', 'strategy', 'action', 'status', 'agenda', 'gameover']

const zeroed = () => Object.fromEntries(SEATS.map((s) => [s, 0]))

export const initialState = () => ({
  screen: 'setup',
  round: 1,
  seats: SEATS.map((seat) => ({ seat, color: null, factionId: null })),
  speakerSeat: 1,
  picks: {},          // cardId -> seat, cleared each round
  draftLog: {},       // round -> the picks of that round, kept for the end screen
  cardTG: {},         // cardId -> trade goods sitting on it, carries between rounds
  tgGained: {},       // seat -> trade goods collected when they picked, this round
  exhausted: [],      // cardIds whose strategic action has been performed this round
  passed: [],         // seats out for the rest of the round
  turnIndex: 0,       // position in the initiative order
  pendingAction: null,// 'strategy' | 'tactical' | 'pass', awaiting confirmation
  speakerPrompt: false,
  scores: zeroed(),
  votes: zeroed(),
  vpTarget: 10,       // victory points that trigger the end-of-game prompt
  timers: zeroed(),   // seat -> seconds banked across every action phase so far
  turnStartedAt: null,// Date.now() when the active player's clock started, else null
  endPrompt: null,    // { seat, prev } while "confirm end of game?" is up
  resumeScreen: null, // where to drop back to if the end screen is dismissed
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

/**
 * Seconds a seat has spent on its turns, including the clock still running if
 * it is their turn right now. Callers that want it to visibly tick re-render
 * on a timer; the value itself is always read off the wall clock.
 */
export function timeFor(state, seat) {
  const banked = state.timers?.[seat] || 0
  const live = state.turnStartedAt != null && activeSeat(state) === seat
  return banked + (live ? elapsedSince(state.turnStartedAt) : 0)
}

/** Every round played so far, oldest first. */
export const playedRounds = (state) =>
  Object.keys(state.draftLog || {})
    .map(Number)
    .sort((a, b) => a - b)

/** Final standings: most victory points first, ties broken on initiative order. */
export function standings(state) {
  const tiebreak = (seat) => {
    const i = state.initiativeSeats.indexOf(seat)
    return i === -1 ? SEATS.length : i
  }
  return [...SEATS].sort(
    (a, b) =>
      (state.scores[b] || 0) - (state.scores[a] || 0) || tiebreak(a) - tiebreak(b)
  )
}

// ------------------------------------------------------------------ reducer

/**
 * Stop the running clock and bank what it read against `seat`. The seat is
 * passed in rather than derived because callers often hand us a state where
 * the acting player has just passed, and so is no longer the active seat.
 */
function bankTime(state, seat) {
  if (state.turnStartedAt == null) return { ...state, turnStartedAt: null }
  const add = elapsedSince(state.turnStartedAt)
  const timers =
    seat == null ? state.timers : { ...state.timers, [seat]: (state.timers[seat] || 0) + add }
  return { ...state, timers, turnStartedAt: null }
}

function advanceTurn(state, actingSeat) {
  const banked = bankTime(state, actingSeat)
  const order = initiativeOrder(state.picks)
  for (let i = 1; i <= order.length; i++) {
    const idx = (state.turnIndex + i) % order.length
    if (!state.passed.includes(order[idx])) {
      // Straight handoff: the next player's clock starts the instant this one stops.
      return { ...banked, turnIndex: idx, pendingAction: null, turnStartedAt: Date.now() }
    }
  }
  // Nobody left to act — the round's action phase is over.
  return { ...banked, pendingAction: null, screen: 'status' }
}

export function reducer(state, action) {
  switch (action.type) {
    case 'SET_SEAT': {
      const seats = state.seats.map((s) =>
        s.seat === action.seat ? { ...s, ...action.patch } : s
      )
      return { ...state, seats }
    }

    case 'SET_VP_TARGET':
      return { ...state, vpTarget: Math.max(1, action.value) }

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
        // The draft is final now, so it can be logged for the end screen.
        draftLog: { ...state.draftLog, [state.round]: { ...state.picks } },
        initiativeSeats: initiativeOrder(state.picks),
        turnStartedAt: Date.now(),
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
        // Politics hands the speaker token to another player before the turn
        // ends — and it is still their turn, so their clock keeps running.
        if (card.id === 'politics') return { ...next, speakerPrompt: true }
        return advanceTurn(next, seat)
      }

      if (state.pendingAction === 'pass') {
        return advanceTurn({ ...state, passed: [...state.passed, seat] }, seat)
      }

      return advanceTurn(state, seat) // tactical / component
    }

    case 'SET_SPEAKER': {
      const seat = activeSeat(state)
      return advanceTurn(
        { ...state, speakerSeat: action.seat, speakerPrompt: false },
        seat
      )
    }

    case 'ADJUST_SCORE': {
      const prev = state.scores[action.seat] || 0
      const next = Math.max(0, prev + action.delta)
      const scores = { ...state.scores, [action.seat]: next }
      // Only a step up *onto* the target opens the prompt, so nudging a
      // finished player from 11 to 12 doesn't ask again.
      const reached = action.delta > 0 && prev < state.vpTarget && next >= state.vpTarget
      return {
        ...state,
        scores,
        endPrompt: reached ? { seat: action.seat, prev } : state.endPrompt,
      }
    }

    case 'CANCEL_END': {
      // Roll the increment that opened the prompt back off.
      if (!state.endPrompt) return state
      const { seat, prev } = state.endPrompt
      return { ...state, scores: { ...state.scores, [seat]: prev }, endPrompt: null }
    }

    case 'CONFIRM_END': {
      const banked = bankTime(state, activeSeat(state))
      return {
        ...banked,
        endPrompt: null,
        resumeScreen: state.screen === 'gameover' ? state.resumeScreen : state.screen,
        screen: 'gameover',
      }
    }

    case 'RESUME_GAME': {
      // The end screen was a scoring dispute after all.
      const screen = state.resumeScreen || 'status'
      const running = screen === 'action' && activeSeat(state) != null
      return {
        ...state,
        screen,
        resumeScreen: null,
        turnStartedAt: running ? Date.now() : null,
      }
    }

    case 'SET_VOTES':
      return { ...state, votes: { ...state.votes, [action.seat]: action.value } }

    case 'GOTO': {
      // Leaving the action phase by any other door stops the clock.
      const leaving = state.screen === 'action' && action.screen !== 'action'
      const base = leaving ? bankTime(state, activeSeat(state)) : state
      return { ...base, screen: action.screen }
    }

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
    const saved = { ...initialState(), ...JSON.parse(raw), toast: null }
    // A running clock was last read whenever the tab was last open. Rather
    // than bill a player for the hours the app spent closed, restart it now.
    if (saved.turnStartedAt != null) saved.turnStartedAt = Date.now()
    return saved
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
