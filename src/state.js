import { STRATEGY_CARDS, cardById } from './data/strategyCards'
import { STATUS_SECRETS, pointsFor, objectiveById, stageDeck } from './data/objectives'
import { PLAYER_COLORS } from './data/colors'
import { FACTIONS } from './data/factions'
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
  vpCustom: false,    // whether the target is being typed rather than picked
  useCodex3: false,   // include the Codex III objectives in the decks
  dev: false,         // the developer bar at the foot of the screen
  timers: zeroed(),   // seat -> seconds banked across every action phase so far
  turnStartedAt: null,// Date.now() when the active player's clock started, else null
  endPrompt: null,    // { seat, prev } while "confirm end of game?" is up
  resumeScreen: null, // where to drop back to if the end screen is dismissed
  initiativeSeats: [...SEATS], // header order; only recomputed when cards are drafted
  toast: null,

  // --- objectives -------------------------------------------------------
  revealedObjectives: [],  // public objective ids, in the order they were revealed
  objectiveScorers: {},    // objectiveId -> seats that have scored it, any round
  secretScores: {},        // seat -> secret objective ids they have scored, any round
  statusSeatIndex: 0,      // position in the initiative order while scoring
  statusPublicScored: {},  // seat -> the public objective they took this phase
  statusSecretScored: {},  // seat -> the secret they took this phase
  revealRound: 0,          // the round whose status phase last revealed one
})

/** Slots in each row: 2 stage I at setup, then one card a round after that. */
export const PUBLIC_SLOTS = 5

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
 * The seat scoring right now in the status phase, or null once every player
 * has been through. Scoring runs in initiative order, i.e. the same order the
 * action phase used, which is fixed for the round at the end of the draft.
 */
export function scoringSeat(state) {
  const order = state.initiativeSeats
  return state.statusSeatIndex < order.length ? order[state.statusSeatIndex] : null
}

/**
 * Codex III replaced three secret objectives rather than adding to the deck,
 * and the reference sheet lists the replacements in place of the originals.
 * With the codex switched off at setup those three are simply out of play.
 */
const inPlay = (state) => (o) => state.useCodex3 || o.set !== 'C.III'

/** Public objectives of one stage that are face up, in the order revealed. */
export const revealedOfStage = (state, stage) =>
  state.revealedObjectives.map(objectiveById).filter((o) => o && o.stage === stage)

/** Public objectives of one stage still face down, i.e. what a reveal can pick. */
export const unrevealedOfStage = (state, stage) =>
  stageDeck(stage).filter((o) => !state.revealedObjectives.includes(o.id) && inPlay(state)(o))

/**
 * Which deck the next reveal comes off. Stage I fills its five slots first —
 * two at setup and one a round — so the first stage II lands in round 4.
 */
export const nextRevealStage = (state) =>
  revealedOfStage(state, 'I').length < PUBLIC_SLOTS ? 'I' : 'II'

/** True once this round's status phase has already turned a card over. */
export const revealedThisRound = (state) => state.revealRound === state.round

/**
 * Secrets that can still be scored in a status phase: status-phase types only
 * (no action / agenda secrets), and not already taken by somebody. A secret
 * exists once in the deck, so one scored is one gone for everyone.
 */
export function availableSecrets(state) {
  const taken = new Set(Object.values(state.secretScores || {}).flat())
  return STATUS_SECRETS.filter((o) => !taken.has(o.id)).filter(inPlay(state))
}

/** Seats that have scored `objectiveId`, in seat order. */
export const scorersOf = (state, objectiveId) => state.objectiveScorers[objectiveId] || []

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

/**
 * The status phase always starts over at the top of the initiative order with
 * a clean ledger of who has scored what *this* phase. The permanent records
 * (objectiveScorers, secretScores) carry on across rounds.
 */
const enterStatus = (state) => ({
  ...state,
  screen: 'status',
  statusSeatIndex: 0,
  statusPublicScored: {},
  statusSecretScored: {},
})

/**
 * Move a seat's victory points by `delta` and, if that takes them onto the
 * target, raise the end-of-game prompt. The prompt carries the whole of
 * `before` so cancelling undoes the move completely — for an objective that
 * means the point *and* the faction icon that came with it, not just the point.
 */
function withVP(before, after, seat, delta) {
  const prev = before.scores[seat] || 0
  const next = Math.max(0, prev + delta)
  const scored = { ...after, scores: { ...after.scores, [seat]: next } }
  const reached = delta > 0 && prev < before.vpTarget && next >= before.vpTarget
  if (!reached) return scored
  return { ...scored, endPrompt: { seat, undo: { ...before, endPrompt: null } } }
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
  return enterStatus({ ...banked, pendingAction: null })
}

// ------------------------------------------------------------- dev helpers
//
// Only the developer bar reaches these. They fill in whatever a screen needs
// to render so a phase can be jumped to straight from a cold start, which
// beats playing three rounds by hand to look at the status phase again.

function devFillSeats(state) {
  if (setupComplete(state)) return state
  const usedColors = new Set(state.seats.map((s) => s.color).filter(Boolean))
  const usedFactions = new Set(state.seats.map((s) => s.factionId).filter(Boolean))
  const seats = state.seats.map((s) => {
    if (s.color && s.factionId) return s
    const color = s.color ?? PLAYER_COLORS.find((c) => !usedColors.has(c.id))?.id
    const factionId = s.factionId ?? FACTIONS.find((f) => !usedFactions.has(f.id))?.id
    usedColors.add(color)
    usedFactions.add(factionId)
    return { ...s, color, factionId }
  })
  return { ...state, seats }
}

function devOpeningObjectives(state) {
  let next = state
  while (revealedOfStage(next, 'I').length < 2) {
    const card = unrevealedOfStage(next, 'I')[0]
    if (!card) break
    next = { ...next, revealedObjectives: [...next.revealedObjectives, card.id] }
  }
  return next
}

function devDraft(state) {
  if (Object.keys(state.picks).length >= SEATS.length) return state
  const order = seatOrderFrom(state.speakerSeat)
  const picks = Object.fromEntries(order.map((seat, i) => [STRATEGY_CARDS[i].id, seat]))
  return { ...state, picks }
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
      return {
        ...state,
        vpTarget: Math.max(1, action.value),
        vpCustom: !!action.custom,
      }

    case 'TOGGLE_CODEX3':
      return { ...state, useCodex3: !state.useCodex3 }

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

    // Only a step up *onto* the target opens the prompt, so nudging a
    // finished player from 11 to 12 doesn't ask again.
    case 'ADJUST_SCORE':
      return withVP(state, state, action.seat, action.delta)

    case 'CANCEL_END':
      // Roll back everything the move that opened the prompt did.
      return state.endPrompt?.undo ? state.endPrompt.undo : { ...state, endPrompt: null }

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

    // ------------------------------------------------------------ objectives

    /**
     * Turning a public objective face up: twice on the setup screen, then once
     * per round at the end of the status phase. A status-phase reveal stamps
     * the round so the button can't be pressed twice in one round.
     */
    case 'REVEAL_OBJECTIVE': {
      const objective = objectiveById(action.objectiveId)
      if (!objective || state.revealedObjectives.includes(objective.id)) return state
      if (revealedOfStage(state, objective.stage).length >= PUBLIC_SLOTS) return state
      return {
        ...state,
        revealedObjectives: [...state.revealedObjectives, objective.id],
        revealRound: state.screen === 'status' ? state.round : state.revealRound,
      }
    }

    /**
     * The active player takes, or gives back, a revealed public objective.
     * One public per player per status phase; clicking the one they just took
     * puts it back, but an objective scored in an earlier round is settled and
     * does nothing.
     */
    case 'SCORE_PUBLIC': {
      const seat = scoringSeat(state)
      const id = action.objectiveId
      if (seat == null || !state.revealedObjectives.includes(id)) return state

      const worth = pointsFor(objectiveById(id))
      const scorers = scorersOf(state, id)
      if (scorers.includes(seat)) {
        if (state.statusPublicScored[seat] !== id) return state
        const statusPublicScored = { ...state.statusPublicScored }
        delete statusPublicScored[seat]
        return withVP(state, {
          ...state,
          objectiveScorers: { ...state.objectiveScorers, [id]: scorers.filter((x) => x !== seat) },
          statusPublicScored,
        }, seat, -worth)
      }

      if (state.statusPublicScored[seat]) return state
      return withVP(state, {
        ...state,
        objectiveScorers: { ...state.objectiveScorers, [id]: [...scorers, seat] },
        statusPublicScored: { ...state.statusPublicScored, [seat]: id },
      }, seat, worth)
    }

    /** One secret per player per status phase, likewise reversible. */
    case 'SCORE_SECRET': {
      const seat = scoringSeat(state)
      const id = action.objectiveId
      if (seat == null || !id || state.statusSecretScored[seat]) return state
      if (!availableSecrets(state).some((o) => o.id === id)) return state
      return withVP(state, {
        ...state,
        secretScores: { ...state.secretScores, [seat]: [...(state.secretScores[seat] || []), id] },
        statusSecretScored: { ...state.statusSecretScored, [seat]: id },
      }, seat, 1)
    }

    case 'UNSCORE_SECRET': {
      const seat = scoringSeat(state)
      const id = seat != null ? state.statusSecretScored[seat] : null
      if (!id) return state
      const statusSecretScored = { ...state.statusSecretScored }
      delete statusSecretScored[seat]
      return withVP(state, {
        ...state,
        secretScores: {
          ...state.secretScores,
          [seat]: (state.secretScores[seat] || []).filter((x) => x !== id),
        },
        statusSecretScored,
      }, seat, -1)
    }

    case 'STATUS_SEAT': {
      // Scoring is a walk down the initiative order; one past the end means done.
      const next = state.statusSeatIndex + action.delta
      const max = state.initiativeSeats.length
      return { ...state, statusSeatIndex: Math.min(max, Math.max(0, next)) }
    }

    case 'SET_VOTES':
      return { ...state, votes: { ...state.votes, [action.seat]: action.value } }

    case 'GOTO': {
      // Leaving the action phase by any other door stops the clock.
      const leaving = state.screen === 'action' && action.screen !== 'action'
      const base = leaving ? bankTime(state, activeSeat(state)) : state
      if (action.screen === 'status' && state.screen !== 'status') return enterStatus(base)
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

    // ------------------------------------------------------------- dev tools

    case 'DEV_TOGGLE':
      return { ...state, dev: !state.dev }

    case 'DEV_GOTO': {
      const target = action.screen
      let next = devOpeningObjectives(devFillSeats(state))
      if (target !== 'setup' && target !== 'strategy') {
        next = devDraft(next)
        next = {
          ...next,
          draftLog: { ...next.draftLog, [next.round]: { ...next.picks } },
          initiativeSeats: initiativeOrder(next.picks),
        }
      }
      if (target === 'action') {
        return { ...next, screen: 'action', turnIndex: 0, pendingAction: null, turnStartedAt: Date.now() }
      }
      if (target === 'status') return enterStatus({ ...next, turnStartedAt: null })
      return { ...next, screen: target, turnStartedAt: null }
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
