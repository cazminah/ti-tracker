import { PLAYER_COLORS } from '../data/colors'
import { FACTIONS, EXPANSION_LABELS } from '../data/factions'
import { objectiveById } from '../data/objectives'
import { FactionCrest } from '../components/FactionCrest'
import { ObjectivePicker } from '../components/ObjectivePicker'
import { SEATS, setupComplete, unrevealedOfStage } from '../state'

// The two stage I objectives that are face up before the first round starts.
const OPENING_OBJECTIVES = 2

export function SetupScreen({ state, dispatch }) {
  const takenColors = new Set(state.seats.map((s) => s.color).filter(Boolean))
  const takenFactions = new Set(state.seats.map((s) => s.factionId).filter(Boolean))
  const opening = state.revealedObjectives.map(objectiveById).filter(Boolean)
  const seatsReady = setupComplete(state)
  const ready = seatsReady && opening.length >= OPENING_OBJECTIVES

  const set = (seat, patch) => dispatch({ type: 'SET_SEAT', seat, patch })

  return (
    <section className="screen">
      <h1 className="screen__title">Game Setup</h1>
      <p className="screen__sub">
        Prophecy of Kings + Codex I–IV. Pick a colour and faction for each seat, in
        clockwise order.
      </p>

      <div className="vptarget">
        <span className="vptarget__label">Play to</span>
        {[10, 14].map((n) => (
          <button
            key={n}
            type="button"
            className={`vptarget__btn ${!state.vpCustom && state.vpTarget === n ? 'is-on' : ''}`}
            aria-pressed={!state.vpCustom && state.vpTarget === n}
            onClick={() => dispatch({ type: 'SET_VP_TARGET', value: n, custom: false })}
          >
            {n} VP
          </button>
        ))}
        {/*
         * Custom is a button like the other two, not a label on the input —
         * pressing it *is* the choice, and whatever is in the box takes effect
         * as it is typed. The read-out below says which target is live so
         * there is nothing left to confirm.
         */}
        <button
          type="button"
          className={`vptarget__btn ${state.vpCustom ? 'is-on' : ''}`}
          aria-pressed={state.vpCustom}
          onClick={() => dispatch({ type: 'SET_VP_TARGET', value: state.vpTarget, custom: true })}
        >
          Custom
        </button>
        <input
          className="vptarget__input"
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          aria-label="Custom victory point target"
          disabled={!state.vpCustom}
          value={state.vpTarget}
          onChange={(e) =>
            dispatch({
              type: 'SET_VP_TARGET',
              value: Math.max(1, parseInt(e.target.value, 10) || 1),
              custom: true,
            })
          }
        />
        <span className="vptarget__readout">
          First to <strong>{state.vpTarget}</strong> victory points wins
        </span>
      </div>

      <div className="vptarget">
        <span className="vptarget__label">Codex III</span>
        <button
          type="button"
          className={`vptarget__btn ${state.useCodex3 ? 'is-on' : ''}`}
          aria-pressed={state.useCodex3}
          onClick={() => dispatch({ type: 'TOGGLE_CODEX3' })}
        >
          {state.useCodex3 ? 'Included' : 'Excluded'}
        </button>
        <span className="vptarget__readout">
          Codex III replaced three secret objectives rather than adding to the deck,
          so with it out those three are simply not in play.
        </span>
      </div>

      <div className="setup">
        {SEATS.map((seat) => {
          const player = state.seats.find((s) => s.seat === seat)
          return (
            <div key={seat} className="seat">
              <div className="seat__head">
                <span className="seat__num">Seat {seat}</span>
                <FactionCrest factionId={player.factionId} size={34} />
              </div>

              <div className="swatches">
                {PLAYER_COLORS.map((c) => {
                  const mine = player.color === c.id
                  const taken = takenColors.has(c.id) && !mine
                  return (
                    <button
                      key={c.id}
                      type="button"
                      title={taken ? `${c.name} — already taken` : c.name}
                      aria-label={c.name}
                      aria-pressed={mine}
                      disabled={taken}
                      className={`swatch ${mine ? 'swatch--on' : ''}`}
                      style={{ background: c.hex }}
                      onClick={() => set(seat, { color: mine ? null : c.id })}
                    />
                  )
                })}
              </div>

              <select
                className="select"
                value={player.factionId ?? ''}
                onChange={(e) => set(seat, { factionId: e.target.value || null })}
              >
                <option value="">Choose a faction…</option>
                {['base', 'pok', 'codex'].map((exp) => (
                  <optgroup key={exp} label={EXPANSION_LABELS[exp]}>
                    {FACTIONS.filter((f) => f.expansion === exp).map((f) => (
                      <option
                        key={f.id}
                        value={f.id}
                        disabled={takenFactions.has(f.id) && player.factionId !== f.id}
                      >
                        {f.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )
        })}
      </div>

      <h2 className="screen__h2">Opening Stage I Objectives</h2>
      <p className="screen__sub">
        The speaker reveals two stage I objectives before the first strategy phase.
      </p>

      <ol className="openobj">
        {Array.from({ length: OPENING_OBJECTIVES }).map((_, i) => {
          const o = opening[i]
          return (
            <li key={i} className={`openobj__slot ${o ? 'is-set' : ''}`}>
              <span className="openobj__n">{i + 1}</span>
              {o ? (
                <span className="openobj__text">
                  <strong className="openobj__name">{o.name}</strong>
                  <span className="openobj__desc">{o.description}</span>
                </span>
              ) : (
                <span className="openobj__text openobj__text--empty">Not revealed yet</span>
              )}
            </li>
          )
        })}
      </ol>

      {opening.length < OPENING_OBJECTIVES && (
        <ObjectivePicker
          options={unrevealedOfStage(state, 'I')}
          placeholder="Choose a stage I objective…"
          confirmLabel="Add"
          onConfirm={(objectiveId) => dispatch({ type: 'REVEAL_OBJECTIVE', objectiveId })}
        />
      )}

      <div className="screen__actions">
        <button type="button" className="btn btn--ghost" onClick={() => dispatch({ type: 'RESET' })}>
          Clear
        </button>
        <button
          type="button"
          className="btn btn--primary"
          disabled={!ready}
          onClick={() => dispatch({ type: 'START_STRATEGY' })}
        >
          Strategy Phase (Round 1) →
        </button>
      </div>
      {!seatsReady && <p className="hint">Every seat needs a colour and a faction.</p>}
      {seatsReady && !ready && (
        <p className="hint">Reveal both opening stage I objectives to start.</p>
      )}
    </section>
  )
}
