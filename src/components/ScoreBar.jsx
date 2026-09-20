import { FactionCrest } from './FactionCrest'
import { colorById } from '../data/colors'
import { factionById } from '../data/factions'
import { seatOf } from '../state'

export function ScoreBar({ state, dispatch }) {
  const order = state.initiativeSeats

  return (
    <header className="scorebar">
      <div className="scorebar__brand">
        <span className="scorebar__title">Twilight Imperium</span>
        <span className="scorebar__round">Round {state.round}</span>
        {state.screen !== 'setup' && (
          <button
            type="button"
            className="scorebar__reset"
            onClick={() => {
              if (confirm('Abandon this game and return to setup?')) {
                dispatch({ type: 'RESET' })
              }
            }}
          >
            New game
          </button>
        )}
      </div>

      <div className="scorebar__players">
        {order.map((seat) => {
          const player = seatOf(state, seat)
          const color = colorById(player.color)
          const faction = factionById(player.factionId)
          const isSpeaker = state.speakerSeat === seat

          return (
            <div
              key={seat}
              className={`ptile ${isSpeaker ? 'ptile--speaker' : ''}`}
              style={{ '--pc': color?.hex ?? '#3a3a42', '--pink': color?.ink ?? '#fff' }}
            >
              <FactionCrest factionId={player.factionId} size={26} />
              <div className="ptile__id">
                <span className="ptile__seat">
                  P{seat}
                  {isSpeaker && <span className="ptile__speaker" title="Speaker">★</span>}
                </span>
                <span className="ptile__faction">{faction?.short ?? '—'}</span>
              </div>

              <div className="ptile__score">
                <button
                  type="button"
                  className="ptile__step"
                  aria-label={`Decrease ${faction?.short ?? `player ${seat}`} score`}
                  onClick={() => dispatch({ type: 'ADJUST_SCORE', seat, delta: -1 })}
                >
                  −
                </button>
                <span className="ptile__vp">{state.scores[seat] ?? 0}</span>
                <button
                  type="button"
                  className="ptile__step"
                  aria-label={`Increase ${faction?.short ?? `player ${seat}`} score`}
                  onClick={() => dispatch({ type: 'ADJUST_SCORE', seat, delta: 1 })}
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </header>
  )
}
