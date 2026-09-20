import { FactionCrest } from '../components/FactionCrest'
import { colorById } from '../data/colors'
import { factionById } from '../data/factions'
import { seatOrderFrom, seatOf } from '../state'

export function AgendaPhase({ state, dispatch }) {
  // Voting runs clockwise starting with the player to the left of the speaker.
  const votingOrder = seatOrderFrom((state.speakerSeat % 6) + 1)
  const total = votingOrder.reduce((sum, seat) => sum + (state.votes[seat] || 0), 0)

  return (
    <section className="screen">
      <h1 className="screen__title">Agenda Phase — Round {state.round}</h1>

      <ol className="steplist steplist--agenda">
        <li>
          <span className="steplist__n">1.</span>
          Reveal Agenda (From Agenda deck)
          <ol className="steplist__sub">
            <li>a. Cards/Abilities that specify “When an agenda is revealed” may be played</li>
            <li>b. Cards/Abilities that specify “After an agenda is revealed” may be played</li>
          </ol>
        </li>
        <li>
          <span className="steplist__n">2.</span>
          Vote (In clockwise order starting with the person to the left of the speaker)
        </li>
        <li>
          <span className="steplist__n">3.</span>
          Resolve Outcome
        </li>
      </ol>

      <h2 className="screen__h2">Votes</h2>
      <div className="votes">
        {votingOrder.map((seat, i) => {
          const player = seatOf(state, seat)
          const color = colorById(player.color)
          return (
            <label key={seat} className="vote" style={{ '--pc': color.hex }}>
              <span className="vote__order">{i + 1}</span>
              <FactionCrest factionId={player.factionId} size={26} />
              <span className="vote__name">{factionById(player.factionId).short}</span>
              <input
                className="vote__input"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={state.votes[seat] ?? 0}
                onChange={(e) =>
                  dispatch({
                    type: 'SET_VOTES',
                    seat,
                    value: Math.max(0, parseInt(e.target.value, 10) || 0),
                  })
                }
              />
            </label>
          )
        })}
      </div>
      <p className="hint">Total votes cast: {total}</p>

      <div className="screen__actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => dispatch({ type: 'NEW_ROUND' })}
        >
          NEW ROUND →
        </button>
      </div>
    </section>
  )
}
