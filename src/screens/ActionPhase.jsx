import { STRATEGY_CARDS } from '../data/strategyCards'
import { InitiativeTile } from '../components/InitiativeTile'
import { FactionCrest } from '../components/FactionCrest'
import { Modal } from '../components/Modal'
import { colorById, readableInk } from '../data/colors'
import { factionById } from '../data/factions'
import { SEATS, activeSeat, cardForSeat, seatOf } from '../state'

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

export function ActionPhase({ state, dispatch }) {
  const seat = activeSeat(state)
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
        </>
      )}

      {state.passed.length > 0 && (
        <p className="passed">
          Passed: {state.passed.map((s) => factionById(seatOf(state, s).factionId).short).join(', ')}
        </p>
      )}

      {state.speakerPrompt && <SpeakerPrompt state={state} dispatch={dispatch} />}
    </section>
  )
}
