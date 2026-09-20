import { FactionCrest } from './FactionCrest'
import { colorById } from '../data/colors'
import { factionById } from '../data/factions'

/**
 * The "who holds this card" strip. Shared by the strategy and action phases so
 * the two screens stay identical — change it here and both follow.
 *
 * `owner` is a seat record, or null for a card nobody has drafted. Having
 * passed is shown by the caller (see InitiativeTile), not here.
 */
export function OwnerBanner({ owner }) {
  if (!owner) {
    return (
      <div className="ownerbanner ownerbanner--empty">
        <span className="ownerbanner__name">Unclaimed</span>
      </div>
    )
  }

  const color = colorById(owner.color)
  const faction = factionById(owner.factionId)

  return (
    <div className="ownerbanner" style={{ background: color.hex, color: color.ink }}>
      <FactionCrest factionId={owner.factionId} size={24} />
      <span className="ownerbanner__name">{faction.short}</span>
    </div>
  )
}
