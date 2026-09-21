import { FactionCrest } from './FactionCrest'
import { ObjectiveCardBack } from './ObjectiveCardBack'
import { colorById } from '../data/colors'
import { factionById } from '../data/factions'
import { pointsFor } from '../data/objectives'
import { PUBLIC_SLOTS, revealedOfStage, scorersOf, seatOf } from '../state'

/** The crests of everyone who has taken this objective, in seat order. */
function Scorers({ state, objective }) {
  return (
    <span className="objcard__scorers">
      {scorersOf(state, objective.id).map((s) => {
        const p = seatOf(state, s)
        return (
          <span
            key={s}
            className="objcard__scorer"
            style={{ '--pc': colorById(p.color)?.hex ?? '#3a3a42' }}
            title={factionById(p.factionId)?.name ?? `Player ${s}`}
          >
            <FactionCrest factionId={p.factionId} size={24} />
          </span>
        )
      })}
    </span>
  )
}

/**
 * One revealed public objective: what it is, and who has taken it.
 *
 * With `onScore` it is the status phase's button, clickable for whichever
 * player is scoring. Without one it is a flat panel — the end screen shows
 * the same cards but has nothing left to score.
 */
function ObjectiveBox({ state, objective, seat, onScore }) {
  const body = (
    <>
      <span className="objcard__name">{objective.name}</span>
      <span className="objcard__desc">{objective.description}</span>
      <span className="objcard__foot">
        <Scorers state={state} objective={objective} />
        <span className="objcard__worth">{pointsFor(objective)} VP</span>
      </span>
    </>
  )

  if (!onScore) return <div className="objcard objcard--flat">{body}</div>

  const scorers = scorersOf(state, objective.id)
  const mine = seat != null && scorers.includes(seat)
  const tookThisPhase = state.statusPublicScored[seat] === objective.id
  // Settled last round, or this player already took a different one: look, don't touch.
  const locked =
    seat == null || (mine && !tookThisPhase) || (!mine && !!state.statusPublicScored[seat])

  return (
    <button
      type="button"
      className={`objcard ${tookThisPhase ? 'is-mine' : ''}`}
      disabled={locked}
      title={
        seat == null
          ? 'Scoring is finished for this round.'
          : tookThisPhase
            ? 'Click to take this back off.'
            : locked
              ? mine
                ? 'Already scored in an earlier round.'
                : 'This player has already scored a public objective this phase.'
              : 'Score this for the active player.'
      }
      onClick={() => onScore(objective.id)}
    >
      {body}
    </button>
  )
}

/**
 * One row of public objectives of a single stage: the cards turned over so
 * far, then face-down backs for the slots still to come. The backs are inert —
 * revealing happens once a round, from the status phase banner, after
 * everybody has scored.
 */
export function ObjectiveRow({ state, stage, seat, onScore }) {
  const revealed = revealedOfStage(state, stage)
  const facedown = Math.max(0, PUBLIC_SLOTS - revealed.length)

  return (
    <>
      <h3 className="objrow__head">Stage {stage}</h3>
      <div className="objrow">
        {revealed.map((o) => (
          <ObjectiveBox key={o.id} state={state} objective={o} seat={seat} onScore={onScore} />
        ))}
        {Array.from({ length: facedown }).map((_, i) => (
          <div key={`back-${i}`} className="objcard objcard--back" aria-hidden="true">
            <ObjectiveCardBack stage={stage} />
          </div>
        ))}
      </div>
    </>
  )
}
