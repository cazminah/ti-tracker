import { STRATEGY_CARDS, cardById } from './data/strategyCards'
import {
  ACTION_SECRETS,
  STATUS_SECRETS,
  pointsFor,
  objectiveById,
  stageDeck,
} from './data/objectives'
import { PLAYER_COLORS } from './data/colors'
import { FACTIONS, factionById } from './data/factions'
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
  excludedSets: [],   // set ids ('base', 'PoK', 'C.III') left out of the decks
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

  // --- action phase victory points ----------------------------------------
  custodiansSeat: null,    // who took Mecatol Rex; settles for good once their turn ends
  custodiansTurn: null,    // the turn it was taken on, so that turn can still undo it
  shardSeat: null,         // who holds the Shard of the Throne, which can be stolen
  supports: {},            // giver seat -> the seat holding their Support for the Throne
  turnSeq: 0,              // monotonic turn counter; only the custodians lock reads it
  imperialPrompt: false,   // Imperial's strategy action is mid-resolution
  imperialPoints: {},      // seat -> Mecatol Rex points taken off Imperial, for the tally
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
 * Whether an objective is in the decks for this game.
 *
 * Nothing is excluded today: the game is Prophecy of Kings + Codex I–IV and
 * the sheet's decks already reflect that. It exists as the one seam an
 * expansion switch can land on later — put a set's id in `excludedSets` and
 * both the reveal picker and the secret list follow, without either of them
 * learning what a set is.
 */
const inPlay = (state) => (o) => !(state.excludedSets ?? []).includes(o.set)

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

/** The secrets a seat holds, oldest first, as objectives rather than ids. */
export const secretsOf = (state, seat) =>
  (state.secretScores?.[seat] || []).map(objectiveById).filter(Boolean)

/**
 * Action-phase secrets nobody has taken yet. Unlike the status phase there is
 * no per-turn limit, and they can be scored on somebody else's turn, so the
 * only thing ruled out is a secret that is already gone.
 */
export function availableActionSecrets(state) {
  const taken = new Set(Object.values(state.secretScores || {}).flat())
  return ACTION_SECRETS.filter((o) => !taken.has(o.id)).filter(inPlay(state))
}

/** Giver seats whose Support for the Throne is still theirs to hand out. */
export const unspentSupports = (state) =>
  SEATS.filter((seat) => state.supports?.[seat] == null)

/** [giverSeat, ...] for the notes a seat is holding — one victory point each. */
export const supportsHeldBy = (state, seat) =>
  SEATS.filter((giver) => state.supports?.[giver] === seat)

/**
 * Whether the custodians token can still be moved. It is a one-off: the first
 * player to Mecatol Rex takes it and that is that, so it stays editable only
 * for the turn it was taken on, to undo a misclick.
 */
export const custodiansOpen = (state) =>
  state.custodiansSeat == null || state.custodiansTurn === state.turnSeq

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

/**
 * Points from everything *except* the public objectives, for the end screen —
 * those are shown as the cards themselves, with the crests of everyone who
 * took them, so listing them here as well would only say it twice.
 *
 * Each row is derived from the record that granted the point rather than from
 * a running log, so it stays right through every undo. `tone` picks the pill
 * the end screen dresses it in.
 */
export function vpSources(state, seat) {
  const rows = []

  for (const o of secretsOf(state, seat)) {
    rows.push({ key: `s:${o.id}`, tone: 'secret', label: o.name, note: `Secret · ${o.description}`, points: 1 })
  }

  if (state.custodiansSeat === seat) {
    rows.push({ key: 'custodians', tone: 'imperial', label: 'Custodians', note: 'First to Mecatol Rex', points: 1 })
  }

  const imperial = state.imperialPoints?.[seat] || 0
  if (imperial) {
    rows.push({
      key: 'imperial',
      tone: 'imperial',
      label: 'Imperial · Mecatol Rex',
      note: `Taken ${imperial}×`,
      points: imperial,
    })
  }

  if (state.shardSeat === seat) {
    rows.push({ key: 'shard', tone: 'shard', label: 'Shard of the Throne', note: 'Relic', points: 1 })
  }

  for (const giver of supportsHeldBy(state, seat)) {
    const from = seatOf(state, giver)
    rows.push({
      key: `sup:${giver}`,
      tone: 'support',
      label: `Support from ${factionById(from.factionId)?.short ?? `P${giver}`}`,
      note: 'Promissory note',
      points: 1,
    })
  }

  return rows
}

/** Points a seat holds that no record accounts for — dev-bar nudges, mostly. */
export function unrecordedVP(state, seat) {
  const publics = (state.revealedObjectives || [])
    .filter((id) => scorersOf(state, id).includes(seat))
    .reduce((sum, id) => sum + pointsFor(objectiveById(id)), 0)
  const listed = vpSources(state, seat).reduce((sum, r) => sum + r.points, 0)
  return (state.scores[seat] || 0) - publics - listed
}

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
/** Move a seat's points with no end-of-game check — for the seat losing one. */
const bumpVP = (state, seat, delta) => ({
  ...state,
  scores: { ...state.scores, [seat]: Math.max(0, (state.scores[seat] || 0) + delta) },
})

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
      return {
        ...banked,
        turnIndex: idx,
        pendingAction: null,
        turnStartedAt: Date.now(),
        turnSeq: state.turnSeq + 1,
      }
    }
  }
  // Nobody left to act — the round's action phase is over.
  return enterStatus({ ...banked, pendingAction: null, turnSeq: state.turnSeq + 1 })
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
        turnSeq: state.turnSeq + 1,
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
        // ends, and Imperial scores off the card — both before the turn is
        // over, so in each case their clock keeps running behind the prompt.
        if (card.id === 'politics') return { ...next, speakerPrompt: true }
        if (card.id === 'imperial') return { ...next, imperialPrompt: true }
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

    /**
     * Imperial, as printed: score one public objective you have fulfilled,
     * then take a point if you hold Mecatol Rex. Both halves are optional and
     * the prompt gathers them in one go, so this applies them and ends the turn.
     */
    case 'RESOLVE_IMPERIAL': {
      const seat = activeSeat(state)
      if (seat == null || !state.imperialPrompt) return state
      let next = { ...state, imperialPrompt: false }

      const objective = objectiveById(action.objectiveId)
      // Imperial is not the status phase, so this is free of the one-public
      // limit — but an objective still cannot be scored twice by one player.
      if (objective && state.revealedObjectives.includes(objective.id)) {
        const scorers = scorersOf(state, objective.id)
        if (!scorers.includes(seat)) {
          next = bumpVP(
            { ...next, objectiveScorers: { ...next.objectiveScorers, [objective.id]: [...scorers, seat] } },
            seat,
            pointsFor(objective)
          )
        }
      }
      if (action.mecatol) {
        // The only point in the game with no record of its own, so it gets a
        // tally — otherwise the end screen could not say where it came from.
        next = bumpVP(
          { ...next, imperialPoints: { ...next.imperialPoints, [seat]: (next.imperialPoints[seat] || 0) + 1 } },
          seat,
          1
        )
      }

      // The whole resolution is one move, so the end-of-game check runs once
      // over the total rather than firing halfway through the card.
      const gained = (next.scores[seat] || 0) - (state.scores[seat] || 0)
      const scored = withVP(state, next, seat, gained)
      return scored.endPrompt ? scored : advanceTurn(scored, seat)
    }

    // ------------------------------------------------- action phase victory points

    /**
     * The custodians token. Whoever clears Mecatol Rex first takes it and
     * keeps it for the game; it stays undoable only while that turn lasts.
     */
    case 'TAKE_CUSTODIANS': {
      const seat = activeSeat(state)
      if (seat == null || !custodiansOpen(state)) return state
      if (state.custodiansSeat === seat) {
        return bumpVP({ ...state, custodiansSeat: null, custodiansTurn: null }, seat, -1)
      }
      return withVP(
        state,
        { ...state, custodiansSeat: seat, custodiansTurn: state.turnSeq },
        seat,
        1
      )
    }

    /**
     * The Shard of the Throne, which unlike the custodians token moves: taking
     * it off whoever holds it costs them the point it was carrying.
     */
    case 'TAKE_SHARD': {
      const seat = activeSeat(state)
      if (seat == null) return state
      const holder = state.shardSeat
      if (holder === seat) return bumpVP({ ...state, shardSeat: null }, seat, -1)
      const robbed = holder == null ? state : bumpVP(state, holder, -1)
      return withVP(state, { ...robbed, shardSeat: seat }, seat, 1)
    }

    /** A secret scored off a tactical or component action, on anyone's turn. */
    case 'SCORE_ACTION_SECRET': {
      const { seat, objectiveId } = action
      if (seat == null || !objectiveId) return state
      if (!availableActionSecrets(state).some((o) => o.id === objectiveId)) return state
      return withVP(state, {
        ...state,
        secretScores: {
          ...state.secretScores,
          [seat]: [...(state.secretScores[seat] || []), objectiveId],
        },
      }, seat, 1)
    }

    case 'UNSCORE_ACTION_SECRET': {
      const { seat, objectiveId } = action
      if (!(state.secretScores[seat] || []).includes(objectiveId)) return state
      // Also let go of the status phase's hold on it, in case that is where it
      // came from — otherwise its Undo would be left pointing at nothing.
      const statusSecretScored = { ...state.statusSecretScored }
      if (statusSecretScored[seat] === objectiveId) delete statusSecretScored[seat]
      return withVP(state, {
        ...state,
        secretScores: {
          ...state.secretScores,
          [seat]: state.secretScores[seat].filter((id) => id !== objectiveId),
        },
        statusSecretScored,
      }, seat, -1)
    }

    /**
     * Support for the Throne. Each player owns exactly one note and it is
     * worth a point to whoever is holding it — never to the player who owns it.
     */
    case 'GIVE_SUPPORT': {
      const { giver, holder } = action
      if (giver == null || holder == null || giver === holder) return state
      if (state.supports[giver] != null) return state
      return withVP(state, { ...state, supports: { ...state.supports, [giver]: holder } }, holder, 1)
    }

    case 'REVOKE_SUPPORT': {
      const holder = state.supports[action.giver]
      if (holder == null) return state
      const supports = { ...state.supports }
      delete supports[action.giver]
      return bumpVP({ ...state, supports }, holder, -1)
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
