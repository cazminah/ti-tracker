import { Modal } from './Modal'
import { FactionCrest } from './FactionCrest'
import { colorById } from '../data/colors'
import { factionById } from '../data/factions'
import { seatOf } from '../state'

/**
 * Raised the moment someone's victory points reach the target. Cancelling
 * rolls that last point back off, because it is usually a misclick on the
 * header's + button rather than the end of a nine-hour game.
 */
export function EndGamePrompt({ state, dispatch }) {
  const { seat } = state.endPrompt
  const player = seatOf(state, seat)
  const color = colorById(player.color)
  const faction = factionById(player.factionId)

  return (
    <Modal title="Confirm end of game?">
      <div className="endprompt__who" style={{ '--pc': color?.hex ?? '#3a3a42' }}>
        <FactionCrest factionId={player.factionId} size={52} />
        <div>
          <strong className="endprompt__faction">{faction?.name ?? `Player ${seat}`}</strong>
          <span className="endprompt__vp">
            {state.scores[seat]} victory points — target is {state.vpTarget}
          </span>
        </div>
      </div>

      <p className="modal__body">
        Confirm to end the game and show the final standings. Cancel to take that
        last point back off.
      </p>

      <div className="endprompt__actions">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => dispatch({ type: 'CANCEL_END' })}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => dispatch({ type: 'CONFIRM_END' })}
        >
          Confirm end of game
        </button>
      </div>
    </Modal>
  )
}
