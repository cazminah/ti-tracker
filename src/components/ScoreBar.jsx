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
        <div className="scorebar__tools">
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
          <button
            type="button"
            className={`scorebar__reset ${state.dev ? 'is-on' : ''}`}
            aria-pressed={state.dev}
            title="Developer bar: jump between phases"
            onClick={() => dispatch({ type: 'DEV_TOGGLE' })}
          >
            Dev
          </button>
        </div>
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

              <span className="ptile__vp">{state.scores[seat] ?? 0}</span>
            </div>
          )
        })}
      </div>
    </header>
  )
}
