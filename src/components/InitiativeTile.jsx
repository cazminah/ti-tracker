import { FallbackImage } from './Artwork'
import { OwnerBanner } from './OwnerBanner'
import { readableInk } from '../data/colors'

// The initiative numeral sits in this rectangle of every strategy card image,
// as a fraction of the source. The crop is done in CSS (see .initcrop) so the
// numbers below and the stylesheet have to stay in step.
export const INITIATIVE_CROP = { x0: 0.7, y0: 0, x1: 1, y1: 0.2 }

/** Stand-in numeral for when no card image loads. */
function DrawnInitiative({ card }) {
  return (
    <div className="initcrop__drawn" style={{ '--hue': card.hue }}>
      <span>{card.initiative}</span>
    </div>
  )
}

function TradeGoods({ count }) {
  if (!count) return null
  return (
    <div className="tg" title={`${count} trade good${count === 1 ? '' : 's'} on this card`}>
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="#e0c04a" stroke="#8a6d16" strokeWidth="2" />
        <path d="M8 12h8M12 8v8" stroke="#8a6d16" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span>{count}</span>
    </div>
  )
}

/**
 * One strategy card as shown during the action phase: the blown-up initiative
 * numeral, then who holds it, then the card's name.
 *
 * Three independent bits of state, deliberately shown differently:
 *   - `active` (their turn right now) rings the whole tile and pulses.
 *   - `exhausted` (card spent) dims only the name box and stamps USED on it,
 *     because that player is still very much in the round.
 *   - no owner, or `passed`, greys the tile out; passed also gets a stamp
 *     across the numeral.
 */
export function InitiativeTile({
  card,
  owner,
  exhausted = false,
  tradeGoods = 0,
  passed = false,
  active = false,
}) {
  const tone = !owner ? 'unpicked' : passed ? 'passed' : 'taken'

  return (
    <div
      className={`inittile inittile--${tone} ${active ? 'inittile--active' : ''}`}
      style={{ '--hue': card.hue, '--hue-ink': readableInk(card.hue) }}
    >
      <div className="initcrop">
        <FallbackImage
          sources={[`/assets/cards/${card.id}.png`, card.art]}
          fallback={<DrawnInitiative card={card} />}
          alt={`Initiative ${card.initiative}`}
          className="initcrop__img"
        />
        <TradeGoods count={tradeGoods} />
        {/* Sits outside the dimmed artwork so it stays legible. */}
        {passed && <span className="inittile__passed">Passed</span>}
      </div>

      <OwnerBanner owner={owner} />

      {/* The stamp sits outside .inittile__name so the dimming doesn't reach it. */}
      <div className="inittile__namewrap">
        {/* The Ω suffix is dropped here — the card art already carries it. */}
        <div className={`inittile__name ${exhausted ? 'is-spent' : ''}`}>{card.name}</div>
        {exhausted && <span className="inittile__used" aria-label="Used" />}
      </div>
    </div>
  )
}
