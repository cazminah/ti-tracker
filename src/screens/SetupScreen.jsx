import { PLAYER_COLORS } from '../data/colors'
import { FACTIONS, EXPANSION_LABELS } from '../data/factions'
import { FactionCrest } from '../components/FactionCrest'
import { SEATS, setupComplete } from '../state'

export function SetupScreen({ state, dispatch }) {
  const takenColors = new Set(state.seats.map((s) => s.color).filter(Boolean))
  const takenFactions = new Set(state.seats.map((s) => s.factionId).filter(Boolean))
  const ready = setupComplete(state)
  const custom = state.vpTarget !== 10 && state.vpTarget !== 14

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
            className={`vptarget__btn ${state.vpTarget === n ? 'is-on' : ''}`}
            aria-pressed={state.vpTarget === n}
            onClick={() => dispatch({ type: 'SET_VP_TARGET', value: n })}
          >
            {n} VP
          </button>
        ))}
        <label className="vptarget__custom">
          <span
            className={`vptarget__btn ${custom ? 'is-on' : ''}`}
            aria-hidden="true"
          >
            Custom
          </span>
          <input
            className="vptarget__input"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            aria-label="Custom victory point target"
            value={state.vpTarget}
            onChange={(e) =>
              dispatch({
                type: 'SET_VP_TARGET',
                value: Math.max(1, parseInt(e.target.value, 10) || 1),
              })
            }
          />
        </label>
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
      {!ready && <p className="hint">Every seat needs a colour and a faction.</p>}
    </section>
  )
}
