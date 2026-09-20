import { FactionCrest } from './FactionCrest'
import { colorById } from '../data/colors'
import { factionById } from '../data/factions'
import { seatOf } from '../state'

const PHASES = [
  ['setup', 'Setup'],
  ['strategy', 'Strategy'],
  ['action', 'Action'],
  ['status', 'Status'],
  ['agenda', 'Agenda'],
  ['gameover', 'End'],
]

/**
 * Testing scaffolding, off by default and toggled from the header. Jumping to
 * a phase fills in whatever that screen needs to render — seats, the opening
 * objectives, a draft — so any phase can be reached from a cold start.
 *
 * The score steppers live here rather than in the header: they are for setting
 * up a state to look at, not for playing.
 */
export function DevBar({ state, dispatch }) {
  return (
    <div className="devbar">
      <span className="devbar__tag">dev</span>

      <div className="devbar__group">
        {PHASES.map(([screen, label]) => (
          <button
            key={screen}
            type="button"
            className={`devbar__btn ${state.screen === screen ? 'is-on' : ''}`}
            onClick={() => dispatch({ type: 'DEV_GOTO', screen })}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="devbar__group">
        <button
          type="button"
          className="devbar__btn"
          onClick={() => dispatch({ type: 'NEW_ROUND' })}
        >
          Round +1
        </button>
        <button
          type="button"
          className="devbar__btn"
          onClick={() => {
            if (confirm('Wipe the game and start over?')) dispatch({ type: 'RESET' })
          }}
        >
          Reset
        </button>
      </div>

      <div className="devbar__group devbar__group--scores">
        {state.seats.map(({ seat }) => {
          const player = seatOf(state, seat)
          const faction = factionById(player.factionId)
          return (
            <span
              key={seat}
              className="devscore"
              style={{ '--pc': colorById(player.color)?.hex ?? '#3a3a42' }}
              title={faction?.name ?? `Player ${seat}`}
            >
              <FactionCrest factionId={player.factionId} size={18} />
              <span className="devscore__vp">{state.scores[seat] ?? 0}</span>
              <span className="devscore__steps">
                <button
                  type="button"
                  aria-label={`Increase player ${seat} score`}
                  onClick={() => dispatch({ type: 'ADJUST_SCORE', seat, delta: 1 })}
                >
                  +
                </button>
                <button
                  type="button"
                  aria-label={`Decrease player ${seat} score`}
                  onClick={() => dispatch({ type: 'ADJUST_SCORE', seat, delta: -1 })}
                >
                  −
                </button>
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
