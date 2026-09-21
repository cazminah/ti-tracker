import { FactionCrest } from './FactionCrest'
import { HoverTip } from './HoverTip'
import { colorById } from '../data/colors'
import { factionById } from '../data/factions'
import { SECRET_LIMIT, objectiveLabel } from '../data/objectives'
import { secretsOf, seatOf, supportsHeldBy } from '../state'

/**
 * One player in the row of six: who they are, their score, and everything
 * they are holding that is worth a point — secrets in gold, Support for the
 * Throne notes in their giver's colour.
 *
 * Shared by the status and action phases. The status phase renders it flat;
 * the action phase passes `onSelect` to make the whole box the way you choose
 * whose secrets you are editing, and `onRevokeSupport` to make the notes
 * hand-backable. Selecting is a div rather than a button so the chips inside
 * can stay buttons of their own.
 */
export function PlayerBox({ state, seat, active, onSelect, onRevokeSupport }) {
  const player = seatOf(state, seat)
  const color = colorById(player.color)
  const faction = factionById(player.factionId)
  const secrets = secretsOf(state, seat)
  const supports = supportsHeldBy(state, seat)

  const pick = onSelect ? () => onSelect(seat) : undefined

  return (
    <div
      className={`objplayer ${active ? 'is-active' : ''} ${onSelect ? 'is-pickable' : ''}`}
      style={{ '--pc': color?.hex ?? '#3a3a42' }}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-pressed={onSelect ? !!active : undefined}
      onClick={pick}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(seat)
              }
            }
          : undefined
      }
    >
      <div className="objplayer__head">
        <FactionCrest factionId={player.factionId} size={26} />
        <span className="objplayer__name">{faction?.short ?? `P${seat}`}</span>
        {/* Only shown once they have one — six "0/3"s would be noise. */}
        {secrets.length > 0 && (
          <span
            className={`objplayer__count ${secrets.length > SECRET_LIMIT ? 'is-over' : ''}`}
            title={`${secrets.length} of ${SECRET_LIMIT} secret objectives (4 with The Obsidian)`}
          >
            {secrets.length}/{SECRET_LIMIT}
          </span>
        )}
        <span className="objplayer__vp">{state.scores[seat] ?? 0}</span>
      </div>

      <div className="objplayer__secrets">
        {secrets.map((o) => (
          <HoverTip key={o.id} className="pill pill--secret pill--tip" tip={objectiveLabel(o)}>
            {o.name}
          </HoverTip>
        ))}

        {supports.map((giver) => {
          const from = factionById(seatOf(state, giver).factionId)
          const label = `Support from ${from?.short ?? `P${giver}`}`
          return onRevokeSupport ? (
            <button
              key={`s${giver}`}
              type="button"
              className="pill pill--support pill--live"
              title="Click to hand this note back to its owner."
              onClick={(e) => {
                e.stopPropagation()
                onRevokeSupport(giver)
              }}
            >
              {label}
            </button>
          ) : (
            <span key={`s${giver}`} className="pill pill--support">
              {label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
