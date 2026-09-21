import { FactionCrest } from './FactionCrest'
import { FallbackImage } from './Artwork'
import { colorById } from '../data/colors'
import { factionById } from '../data/factions'
import { seatOf } from '../state'

/**
 * The Mecatol Rex system tile, drawn rather than photographed. Pointy left and
 * right, flat top and bottom, like every tile in the box. Drop the real art at
 * public/assets/tokens/mecatol-rex.png and it takes over — see MecatolRex below.
 */
function MecatolRexArt() {
  const hex = '0,70 35,8 105,8 140,70 105,132 35,132'

  return (
    <svg viewBox="0 0 140 140" className="token__art" role="img" aria-label="Mecatol Rex">
      <defs>
        <radialGradient id="mr-planet" cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#8d94a0" />
          <stop offset="52%" stopColor="#3b424f" />
          <stop offset="100%" stopColor="#14181f" />
        </radialGradient>
        <linearGradient id="mr-field" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#123453" />
          <stop offset="100%" stopColor="#081426" />
        </linearGradient>
        <clipPath id="mr-clip">
          <polygon points={hex} />
        </clipPath>
      </defs>

      <polygon points={hex} fill="url(#mr-field)" />

      <g clipPath="url(#mr-clip)">
        {/* The planet fills most of the tile, its terminator to the lower right. */}
        <circle cx="70" cy="70" r="54" fill="url(#mr-planet)" />
        <circle cx="70" cy="70" r="54" fill="none" stroke="#7fd4ff" strokeWidth="1.5" opacity=".55" />

        {/* Survey rings: the blue overlay printed across the tile. */}
        {[62, 44].map((r) => (
          <circle key={r} cx="70" cy="70" r={r} fill="none" stroke="#3fa8e0" strokeWidth="1" opacity=".5" />
        ))}
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <line
            key={a}
            x1="70" y1="70" x2="70" y2="8"
            stroke="#3fa8e0" strokeWidth="1" opacity=".28"
            transform={`rotate(${a} 70 70)`}
          />
        ))}

        {/* The influence hex at the centre, with the 6 sitting in it. */}
        <polygon
          points="70,44 92,57 92,83 70,96 48,83 48,57"
          fill="#0d3d5e" stroke="#7fd4ff" strokeWidth="2"
        />
        <text
          x="70" y="71"
          textAnchor="middle" dominantBaseline="central"
          fontFamily="var(--font-card)" fontWeight="700" fontSize="26" fill="#eaf7ff"
        >
          6
        </text>
      </g>

      <polygon points={hex} fill="none" stroke="#5ab6ea" strokeWidth="3" />

      {/* Resource / influence badges and the name plate along the bottom edge. */}
      <g transform="translate(34 108)">
        <circle cx="0" cy="0" r="8" fill="#141821" stroke="#d8b86a" strokeWidth="1.6" />
        <text x="0" y="1" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="700" fill="#f0e3c0">1</text>
        <circle cx="17" cy="2" r="8" fill="#141821" stroke="#7fd4ff" strokeWidth="1.6" />
        <text x="17" y="3" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="700" fill="#eaf7ff">6</text>
        <rect x="28" y="-5" width="60" height="14" rx="7" fill="#101820" opacity=".92" />
        <text x="58" y="3" textAnchor="middle" dominantBaseline="central" fontSize="7.5" letterSpacing="1" fill="#dfe7f2">
          MECATOL REX
        </text>
      </g>
    </svg>
  )
}

/**
 * The Shard of the Throne relic: a gold sigil of two outer blades around a
 * split core, on the relic deck's dark starfield.
 */
function ShardArt() {
  return (
    <svg viewBox="0 0 140 140" className="token__art" role="img" aria-label="Shard of the Throne">
      <defs>
        <linearGradient id="shard-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe071" />
          <stop offset="55%" stopColor="#e0ac1e" />
          <stop offset="100%" stopColor="#a8780c" />
        </linearGradient>
      </defs>

      <rect width="140" height="140" rx="8" fill="#12140c" />
      {/* A sparse starfield, fixed rather than random so it doesn't crawl. */}
      {[[18, 24], [116, 30], [40, 112], [96, 120], [70, 16], [24, 74], [124, 88]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 2 ? 1.2 : 0.8} fill="#cdd18a" opacity=".5" />
      ))}

      <g fill="url(#shard-gold)" stroke="#fff1ad" strokeWidth="1.6" strokeLinejoin="round">
        {/* Outer blades, mirrored: a long shoulder that hooks in at the foot. */}
        <path d="M30 22 54 34v52l-10 10v18l-14 8-8-10V34Z" />
        <path d="M110 22 86 34v52l10 10v18l14 8 8-10V34Z" />
        {/* The split core. */}
        <path d="M70 26l16 12v30L70 80 54 68V38Z" />
        <path d="M70 86l12 9v22l-12 9-12-9V95Z" />
      </g>
    </svg>
  )
}

/**
 * A claimable point: the art, dimmed and crested once somebody holds it.
 *
 * `holder` is a seat or null, `locked` greys it out for good — the custodians
 * token settles the moment its turn ends and can never move again.
 */
function TokenTile({ state, label, hint, holder, locked, onClick, children }) {
  const player = holder ? seatOf(state, holder) : null
  const faction = player ? factionById(player.factionId) : null
  const color = player ? colorById(player.color) : null

  return (
    <button
      type="button"
      className={`token ${holder ? 'is-held' : ''} ${locked ? 'is-locked' : ''}`}
      style={{ '--pc': color?.hex ?? 'transparent' }}
      disabled={locked}
      title={locked ? `${label} — settled for the rest of the game.` : hint}
      onClick={onClick}
    >
      <span className="token__frame">
        {children}
        {holder && (
          <span className="token__holder">
            <FactionCrest factionId={player.factionId} size={52} />
          </span>
        )}
      </span>
      <span className="token__label">{label}</span>
      <span className="token__who">{faction ? faction.short : 'Unclaimed'}</span>
    </button>
  )
}

export function MecatolRex({ state, locked, onClick }) {
  return (
    <TokenTile
      state={state}
      label="Custodians"
      hint="First to Mecatol Rex takes the token and a victory point."
      holder={state.custodiansSeat}
      locked={locked}
      onClick={onClick}
    >
      {/* Drop a cropped PNG at public/assets/tokens/mecatol-rex.png to use the
          real tile art; the drawn one stands in until then. */}
      <FallbackImage
        sources={['/assets/tokens/mecatol-rex.png']}
        fallback={<MecatolRexArt />}
        alt="Mecatol Rex"
        className="token__img"
      />
    </TokenTile>
  )
}

export function ShardOfTheThrone({ state, onClick }) {
  return (
    <TokenTile
      state={state}
      label="Shard of the Throne"
      hint="Worth a victory point, and takeable from whoever holds it."
      holder={state.shardSeat}
      onClick={onClick}
    >
      <FallbackImage
        sources={['/assets/tokens/shard-of-the-throne.png']}
        fallback={<ShardArt />}
        alt="Shard of the Throne"
        className="token__img"
      />
    </TokenTile>
  )
}
