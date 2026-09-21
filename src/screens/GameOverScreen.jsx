import { FactionCrest } from '../components/FactionCrest'
import { colorById, readableInk } from '../data/colors'
import { factionById } from '../data/factions'
import { ObjectiveRow } from '../components/ObjectiveRow'
import {
  cardForSeat,
  playedRounds,
  seatOf,
  standings,
  timeFor,
  unrecordedVP,
  vpSources,
} from '../state'
import { formatDuration } from '../time'

/** "The Federation of Sol" reads badly after "our new", so the article goes. */
const overlordName = (faction) =>
  (faction?.name ?? 'anonymous').replace(/^The\s+/i, '')

export function GameOverScreen({ state, dispatch }) {
  const ranked = standings(state)
  const rounds = playedRounds(state)
  const winner = ranked[0]
  const winnerFaction = factionById(seatOf(state, winner).factionId)
  const winnerColor = colorById(seatOf(state, winner).color)
  const totalTime = ranked.reduce((sum, seat) => sum + timeFor(state, seat), 0)

  return (
    <section className="screen screen--wide gameover">
      <p className="gameover__kicker">Round {state.round} · {state.vpTarget} victory points</p>
      <h1 className="gameover__shout">Congratulations!</h1>
      <p className="gameover__welcome" style={{ '--pc': winnerColor?.hex ?? '#d8b86a' }}>
        We welcome our new <strong>{overlordName(winnerFaction)}</strong> overlords
      </p>

      <div className="gameover__tablewrap">
        <table className="gameover__table">
          <thead>
            <tr>
              <th className="gameover__stick gameover__rankcol">#</th>
              <th className="gameover__stick gameover__factioncol">Faction</th>
              <th className="gameover__stick gameover__vpcol gameover__num">VP</th>
              <th className="gameover__stick gameover__srccol">Points from</th>
              <th className="gameover__stick gameover__timecol gameover__num">Time</th>
              {rounds.map((r) => (
                <th key={r} className="gameover__roundcol">R{r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranked.map((seat, i) => {
              const player = seatOf(state, seat)
              const color = colorById(player.color)
              const faction = factionById(player.factionId)
              const sources = vpSources(state, seat)
              const unrecorded = unrecordedVP(state, seat)
              return (
                <tr
                  key={seat}
                  className={i === 0 ? 'gameover__row gameover__row--win' : 'gameover__row'}
                  style={{ '--pc': color?.hex ?? '#3a3a42' }}
                >
                  <td className="gameover__stick gameover__rankcol">{i + 1}</td>
                  <td className="gameover__stick gameover__factioncol">
                    <span className="gameover__faction">
                      <FactionCrest factionId={player.factionId} size={26} />
                      <span>
                        <strong>{faction?.short ?? `Player ${seat}`}</strong>
                        <em className="gameover__seat">P{seat} · {color?.name ?? '—'}</em>
                      </span>
                    </span>
                  </td>
                  <td className="gameover__stick gameover__vpcol gameover__num gameover__vp">{state.scores[seat] ?? 0}</td>
                  <td className="gameover__stick gameover__srccol">
                    {/* Public objectives are left out: the rows of cards below
                        already show who took which, with their crests on them. */}
                    <ul className="vpsrc">
                      {sources.map((src) => (
                        <li key={src.key} className={`pill pill--${src.tone}`} title={src.note}>
                          <span className="vpsrc__label">{src.label}</span>
                          <span className="vpsrc__n">{src.points}</span>
                        </li>
                      ))}
                      {!!unrecorded && (
                        <li className="pill pill--rest" title="Adjusted by hand">
                          <span className="vpsrc__label">Unrecorded</span>
                          <span className="vpsrc__n">{unrecorded}</span>
                        </li>
                      )}
                      {!sources.length && !unrecorded && (
                        <li className="gameover__none">—</li>
                      )}
                    </ul>
                  </td>
                  <td className="gameover__stick gameover__timecol gameover__num">
                    {formatDuration(timeFor(state, seat))}
                  </td>
                  {rounds.map((r) => {
                    const card = cardForSeat(state.draftLog[r] || {}, seat)
                    return (
                      <td key={r} className="gameover__roundcol">
                        {card ? (
                          <span
                            className="cardpill cardpill--mini"
                            style={{ background: card.hue, color: readableInk(card.hue) }}
                            title={`${card.initiative} ${card.name}`}
                          >
                            {card.initiative} {card.name}
                          </span>
                        ) : (
                          <span className="gameover__none">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <h2 className="screen__h2 gameover__pubhead">Public Objectives</h2>
      <div className="gameover__publics">
        <ObjectiveRow state={state} stage="I" />
        <ObjectiveRow state={state} stage="II" />
      </div>

      <p className="hint gameover__total">
        {rounds.length} round{rounds.length === 1 ? '' : 's'} played ·
        {' '}{formatDuration(totalTime)} of turns taken
      </p>

      <div className="screen__actions">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => dispatch({ type: 'RESUME_GAME' })}
        >
          Back to game
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            if (confirm('Start a new game? This clears the current one.')) {
              dispatch({ type: 'RESET' })
            }
          }}
        >
          New game
        </button>
      </div>
    </section>
  )
}
