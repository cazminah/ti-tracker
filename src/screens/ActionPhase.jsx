import { useEffect, useState } from 'react'
import { STRATEGY_CARDS } from '../data/strategyCards'
import { InitiativeTile } from '../components/InitiativeTile'
import { FactionCrest } from '../components/FactionCrest'
import { Modal } from '../components/Modal'
import { colorById, readableInk } from '../data/colors'
import { factionById } from '../data/factions'
import { VictoryPanel } from '../components/VictoryPanel'
import { objectiveById, pointsFor } from '../data/objectives'
import { SEATS, activeSeat, cardForSeat, scorersOf, seatOf, timeFor } from '../state'
import { formatDuration } from '../time'

const CHOICES = [
  { kind: 'strategy', label: 'Strategy Action', hint: 'Resolve your strategy card, then exhaust it.' },
  { kind: 'tactical', label: 'Tactical / Component Action', hint: 'Activate a system, or play a component.' },
  { kind: 'pass', label: 'Pass', hint: 'No further turns this round.' },
]

/**
 * A player may not pass until they have performed their strategic action, and
 * may not perform it twice.
 */
function unavailable(kind, cardUsed) {
  if (kind === 'strategy' && cardUsed) return 'Already used this round.'
  if (kind === 'pass' && !cardUsed) return 'Use your strategy card before passing.'
  return null
}

function SpeakerPrompt({ state, dispatch }) {
  return (
    <Modal title="Select Speaker">
      <p className="modal__body">
        Politics: choose a player other than the current speaker. They take the speaker
        token and become Player 1 for all following phases.
      </p>
      <div className="speakerpick">
        {SEATS.map((seat) => {
          const player = seatOf(state, seat)
          const color = colorById(player.color)
          const isCurrent = state.speakerSeat === seat
          return (
            <button
              key={seat}
              type="button"
              className="speakerpick__btn"
              style={{ '--pc': color.hex, '--pink': color.ink }}
              disabled={isCurrent}
              title={isCurrent ? 'Already the speaker' : undefined}
              onClick={() => dispatch({ type: 'SET_SPEAKER', seat })}
            >
              <FactionCrest factionId={player.factionId} size={30} />
              <span className="speakerpick__name">{factionById(player.factionId).short}</span>
              <span className="speakerpick__seat">Seat {seat}{isCurrent ? ' · current' : ''}</span>
            </button>
          )
        })}
      </div>
    </Modal>
  )
}

/**
 * Imperial as printed: score one public objective you have fulfilled, then
 * take a point if you hold Mecatol Rex. Both halves are optional, and both are
 * gathered here before anything is applied, so the card resolves in one move
 * rather than firing the end-of-game prompt halfway through itself.
 */
function ImperialPrompt({ state, dispatch }) {
  const seat = activeSeat(state)
  const [objectiveId, setObjectiveId] = useState('')
  const [mecatol, setMecatol] = useState(false)

  // Imperial sits outside the status phase, so its one-public-a-phase limit
  // does not apply — only "you cannot score the same card twice".
  const open = state.revealedObjectives
    .map(objectiveById)
    .filter((o) => o && !scorersOf(state, o.id).includes(seat))

  const gain = (objectiveId ? pointsFor(objectiveById(objectiveId)) : 0) + (mecatol ? 1 : 0)

  return (
    <Modal title="Imperial">
      <p className="modal__body">
        Score 1 public objective you have fulfilled, then gain 1 victory point if
        you control Mecatol Rex. Either half can be skipped.
      </p>

      <select
        className="select imperial__select"
        value={objectiveId}
        onChange={(e) => setObjectiveId(e.target.value)}
      >
        <option value="">Score no public objective</option>
        {open.map((o) => (
          <option key={o.id} value={o.id}>
            Stage {o.stage} · {o.name} - {o.description}
          </option>
        ))}
      </select>

      <label className="imperial__check">
        <input
          type="checkbox"
          checked={mecatol}
          onChange={(e) => setMecatol(e.target.checked)}
        />
        I control Mecatol Rex (+1 VP)
      </label>

      <div className="endprompt__actions">
        <span className="imperial__total">
          {gain ? `+${gain} VP` : 'No points from this card'}
        </span>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() =>
            dispatch({ type: 'RESOLVE_IMPERIAL', objectiveId: objectiveId || null, mecatol })
          }
        >
          Resolve Imperial
        </button>
      </div>
    </Modal>
  )
}

export function ActionPhase({ state, dispatch }) {
  const seat = activeSeat(state)
  const running = seat != null && state.turnStartedAt != null

  // The clock lives in state as a single timestamp; this only exists to make
  // the rendered figure move once a second.
  const [, tick] = useState(0)
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => tick((n) => n + 1), 500)
    return () => clearInterval(id)
  }, [running, state.turnStartedAt])

  const player = seat ? seatOf(state, seat) : null
  const color = player ? colorById(player.color) : null
  const card = seat ? cardForSeat(state.picks, seat) : null
  const cardUsed = card ? state.exhausted.includes(card.id) : false

  return (
    <section className="screen screen--wide">
      <h1 className="screen__title">Action Phase — Round {state.round}</h1>
      <p className="screen__sub">Turns proceed in initiative order.</p>

      <div className="initrow">
        {STRATEGY_CARDS.map((c) => {
          const ownerSeat = state.picks[c.id]
          const owner = ownerSeat ? seatOf(state, ownerSeat) : null
          return (
            <InitiativeTile
              key={c.id}
              card={c}
              owner={owner}
              exhausted={state.exhausted.includes(c.id)}
              passed={ownerSeat != null && state.passed.includes(ownerSeat)}
              active={ownerSeat != null && ownerSeat === seat}
              tradeGoods={state.cardTG[c.id] || 0}
            />
          )
        })}
      </div>

      {seat && (
        <>
          <div className="turnbanner turnbanner--big" style={{ '--pc': color.hex }}>
            <FactionCrest factionId={player.factionId} size={44} />
            <strong className="turnbanner__faction">
              {factionById(player.factionId).name}
            </strong>
            {/* Drops away once the card is spent — the tile carries the USED stamp. */}
            {!cardUsed && (
              <span
                className="cardpill turnbanner__card"
                style={{ background: card.hue, color: readableInk(card.hue) }}
              >
                {card.initiative} {card.name}
              </span>
            )}
            <span
              className={`turntimer ${running ? 'turntimer--live' : ''}`}
              title="Time this player has spent on their turns, all rounds"
            >
              {formatDuration(timeFor(state, seat))}
            </span>
          </div>

          <div className="choices">
            {CHOICES.map((c) => {
              const blocked = unavailable(c.kind, cardUsed)
              return (
                <button
                  key={c.kind}
                  type="button"
                  className={`choice choice--${c.kind} ${
                    state.pendingAction === c.kind ? 'is-on' : ''
                  }`}
                  disabled={!!blocked}
                  onClick={() => dispatch({ type: 'SELECT_ACTION', kind: c.kind })}
                >
                  <span className="choice__label">{c.label}</span>
                  <span className="choice__hint">{blocked ?? c.hint}</span>
                </button>
              )
            })}
          </div>

          <div className="screen__actions">
            <button
              type="button"
              className="btn btn--primary"
              disabled={!state.pendingAction}
              onClick={() => dispatch({ type: 'CONFIRM_ACTION' })}
            >
              Confirm
            </button>
          </div>
          {!state.pendingAction && <p className="hint">Choose an action to confirm it.</p>}

          <VictoryPanel state={state} dispatch={dispatch} activeSeat={seat} />
        </>
      )}

      {state.passed.length > 0 && (
        <p className="passed">
          Passed: {state.passed.map((s) => factionById(seatOf(state, s).factionId).short).join(', ')}
        </p>
      )}

      {state.speakerPrompt && <SpeakerPrompt state={state} dispatch={dispatch} />}
      {state.imperialPrompt && <ImperialPrompt state={state} dispatch={dispatch} />}
    </section>
  )
}
