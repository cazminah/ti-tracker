import { FallbackImage } from './Artwork'
import { OwnerBanner } from './OwnerBanner'

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

/** The drawn card face, used when no image asset is available. */
function CardFace({ card }) {
  return (
    <div className="cardface" style={{ '--hue': card.hue }}>
      <div className="cardface__head">
        <span className="cardface__init">{card.initiative}</span>
        <span className="cardface__name">
          {card.name}
          {card.omega && <em className="cardface__omega">{card.omega}</em>}
        </span>
      </div>
      <div className="cardface__body">
        <h4>Primary</h4>
        <ul>{card.primary.map((t, i) => <li key={i}>{t}</li>)}</ul>
        <h4>Secondary</h4>
        <ul>{card.secondary.map((t, i) => <li key={i}>{t}</li>)}</ul>
      </div>
      {card.edition && <div className="cardface__ed">{card.edition}</div>}
    </div>
  )
}

/**
 * A full strategy card, as shown while drafting. `owner` is the seat that holds
 * it (or null); `state` is 'available' | 'taken'.
 */
export function StrategyCard({ card, owner, state = 'available', tradeGoods = 0, onClick, disabled = false }) {
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`stratcard stratcard--${state}`}
      style={{ '--hue': card.hue }}
      onClick={onClick}
      disabled={disabled || undefined}
      aria-label={`${card.initiative} ${card.name}`}
    >
      {/* Fixed aspect: the three card printings aren't all the same shape, and
          letting them size themselves left the banners below out of line. */}
      <div className="stratcard__art">
        <FallbackImage
          sources={[`/assets/cards/${card.id}.png`, card.art]}
          fallback={<CardFace card={card} />}
          alt={`${card.name} strategy card`}
          className="stratcard__img"
        />
      </div>

      <TradeGoods count={tradeGoods} />
      <OwnerBanner owner={owner} />
    </Tag>
  )
}
