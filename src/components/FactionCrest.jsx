import { factionById } from '../data/factions'
import { FallbackImage } from './Artwork'

// One hand-drawn emblem per faction, in a 100x100 box. These stand in for the
// official symbols, which sit behind a Cloudflare challenge and cannot be
// hotlinked; drop a PNG into public/assets/factions/<id>.png to override one.
const GLYPHS = {
  arborec: (
    <>
      <path d="M50 92V44" strokeWidth="7" strokeLinecap="round" />
      <path d="M50 52C30 52 20 40 20 22c20 0 30 12 30 30Z" />
      <path d="M50 52c20 0 30-12 30-30-20 0-30 12-30 30Z" />
      <circle cx="50" cy="20" r="8" />
    </>
  ),
  letnev: (
    <>
      <path d="M50 12 84 26v26c0 20-14 32-34 40C30 84 16 72 16 52V26Z" opacity=".35" />
      <path d="M50 24 72 33v19c0 12-9 20-22 26-13-6-22-14-22-26V33Z" />
      <path d="M38 44h24l-12 20Z" fill="#0d0c10" />
    </>
  ),
  saar: (
    <>
      <path d="M26 20 46 14l10 16-12 16-20-4Z" />
      <path d="M62 34 84 30l4 20-16 12-14-12Z" />
      <path d="M22 56 44 60l4 22-20 6-12-18Z" />
    </>
  ),
  muaat: (
    <>
      <circle cx="50" cy="50" r="40" opacity=".25" />
      <path d="M50 12c8 16-4 20-4 30 0 8 6 12 6 12s10-6 8-18c10 10 14 20 14 30 0 14-14 24-24 24S26 80 26 66c0-18 20-26 24-54Z" />
    </>
  ),
  hacan: (
    <>
      <circle cx="50" cy="50" r="20" />
      {Array.from({ length: 12 }).map((_, i) => (
        <rect key={i} x="47" y="4" width="6" height="18" rx="3"
          transform={`rotate(${i * 30} 50 50)`} />
      ))}
    </>
  ),
  sol: (
    <>
      <path d="M50 10 62 34l26 4-19 18 5 26-24-13-24 13 5-26-19-18 26-4Z" opacity=".3" />
      <path d="M50 24 22 62h18l10-14 10 14h18Z" />
      <path d="M34 72h32l-16 18Z" />
    </>
  ),
  creuss: (
    <>
      <path d="M50 12a38 38 0 1 1-.1 76c-16 0-26-10-26-22s9-20 20-20 17 7 17 15-6 12-11 12-8-3-8-7"
        fill="none" strokeWidth="8" strokeLinecap="round" />
    </>
  ),
  l1z1x: (
    <>
      <path d="M50 8 86 28v44L50 92 14 72V28Z" opacity=".3" />
      <path d="M50 20 76 34v32L50 80 24 66V34Z" fill="none" strokeWidth="6" />
      <rect x="32" y="45" width="36" height="10" rx="5" />
    </>
  ),
  mentak: (
    <>
      <path d="M18 26 82 74" strokeWidth="9" strokeLinecap="round" />
      <path d="M82 26 18 74" strokeWidth="9" strokeLinecap="round" />
      <circle cx="50" cy="50" r="15" fill="#0d0c10" />
      <circle cx="50" cy="50" r="10" />
    </>
  ),
  naalu: (
    <>
      <path d="M50 22c22 0 38 18 38 28s-16 28-38 28-38-18-38-28 16-28 38-28Z" opacity=".3" />
      <path d="M50 30c18 0 30 14 30 20s-12 20-30 20-30-14-30-20 12-20 30-20Z" fill="none" strokeWidth="5" />
      <ellipse cx="50" cy="50" rx="7" ry="19" />
    </>
  ),
  nekro: (
    <>
      <path d="M50 8 86 28v44L50 92 14 72V28Z" opacity=".3" />
      <path d="M50 14 44 40l14 6-18 12 10 8-16 20 6-26-12-6 16-10-10-8Z" />
      <path d="M62 44l14 12-10 6 12 14" fill="none" strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  sardakk: (
    <>
      <path d="M22 16c18 8 24 22 24 38 0 14-6 24-14 32 18-6 28-20 28-38 0-18-14-28-38-32Z" />
      <path d="M78 16c-18 8-24 22-24 38 0 14 6 24 14 32-18-6-28-20-28-38 0-18 14-28 38-32Z" />
    </>
  ),
  jolnar: (
    <>
      <circle cx="50" cy="50" r="12" />
      <ellipse cx="50" cy="50" rx="40" ry="16" fill="none" strokeWidth="5" />
      <ellipse cx="50" cy="50" rx="40" ry="16" fill="none" strokeWidth="5" transform="rotate(60 50 50)" />
      <ellipse cx="50" cy="50" rx="40" ry="16" fill="none" strokeWidth="5" transform="rotate(120 50 50)" />
    </>
  ),
  winnu: (
    <>
      <circle cx="50" cy="50" r="14" fill="none" strokeWidth="6" />
      {Array.from({ length: 8 }).map((_, i) => (
        <path key={i} d="M50 6 55 28h-10Z" transform={`rotate(${i * 45} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="5" />
    </>
  ),
  xxcha: (
    <>
      <path d="M50 10 86 30v40L50 90 14 70V30Z" fill="none" strokeWidth="7" />
      <path d="M50 26 72 38v24L50 74 28 62V38Z" opacity=".45" />
      <path d="M50 26v48M28 38l44 24M72 38 28 62" strokeWidth="4" fill="none" />
    </>
  ),
  yin: (
    <>
      <circle cx="50" cy="50" r="38" fill="none" strokeWidth="6" />
      <path d="M50 12a19 19 0 0 0 0 38 19 19 0 0 1 0 38 38 38 0 0 0 0-76Z" />
      <circle cx="50" cy="31" r="6" />
    </>
  ),
  yssaril: (
    <>
      <path d="M50 12c22 0 34 14 34 34 0 24-18 42-34 42S16 70 16 46c0-20 12-34 34-34Z" opacity=".35" />
      <path d="M28 44c6-6 14-6 18 0-6 6-12 6-18 0Z" />
      <path d="M54 44c6-6 14-6 18 0-6 6-12 6-18 0Z" />
      <path d="M36 66c8 6 20 6 28 0" fill="none" strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  argent: (
    <>
      <path d="M50 22 62 46l28-10-24 22 8 26-24-16-24 16 8-26-24-22 28 10Z" />
      <circle cx="50" cy="18" r="8" />
    </>
  ),
  empyrean: (
    <>
      <circle cx="50" cy="50" r="36" fill="none" strokeWidth="8" />
      <path d="M50 18a32 32 0 0 1 0 64 22 22 0 0 0 0-64Z" />
      <circle cx="50" cy="50" r="6" fill="#0d0c10" />
    </>
  ),
  mahact: (
    <>
      <path d="M16 70 24 26l16 18 10-26 10 26 16-18 8 44Z" />
      <rect x="16" y="74" width="68" height="10" rx="4" />
      <circle cx="50" cy="52" r="5" fill="#0d0c10" />
    </>
  ),
  naazrokha: (
    <>
      <path d="M50 14 84 72H16Z" fill="none" strokeWidth="7" />
      <path d="M50 86 16 28h68Z" fill="none" strokeWidth="7" opacity=".55" />
    </>
  ),
  nomad: (
    <>
      <path d="M50 10 90 50 50 90 10 50Z" fill="none" strokeWidth="6" />
      <path d="M50 28 72 50 50 72 28 50Z" opacity=".5" />
      <circle cx="50" cy="50" r="7" />
    </>
  ),
  titans: (
    <>
      <path d="M38 88V30a12 12 0 0 1 24 0v58Z" opacity=".4" />
      <rect x="28" y="44" width="44" height="8" rx="4" />
      <rect x="28" y="62" width="44" height="8" rx="4" />
      <circle cx="50" cy="22" r="11" />
    </>
  ),
  cabal: (
    <>
      <path d="M50 8c6 18-4 24-4 38s10 20 4 46c-8-20-18-26-18-44S42 26 50 8Z" />
      <path d="M26 30c2 16 8 22 8 34s-4 16-8 26" fill="none" strokeWidth="6" strokeLinecap="round" />
      <path d="M74 30c-2 16-8 22-8 34s4 16 8 26" fill="none" strokeWidth="6" strokeLinecap="round" />
    </>
  ),
  keleres: (
    <>
      <circle cx="50" cy="50" r="36" fill="none" strokeWidth="6" />
      {[0, 120, 240].map((r) => (
        <path key={r} d="M50 16 58 50H42Z" transform={`rotate(${r} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="7" />
    </>
  ),
}

export function FactionCrest({ factionId, size = 44, title }) {
  const faction = factionById(factionId)
  if (!faction) {
    return <span className="crest crest--empty" style={{ width: size, height: size }} />
  }

  const glyph = GLYPHS[faction.id]
  const svg = (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className="crest"
      role="img"
      aria-label={title ?? faction.name}
      style={{ color: faction.accent, fill: 'currentColor', stroke: 'currentColor' }}
    >
      <g fill="currentColor" stroke="currentColor" strokeWidth="0" strokeLinejoin="round">
        {glyph}
      </g>
    </svg>
  )

  return (
    <FallbackImage
      sources={[`/assets/factions/${faction.id}.png`, faction.art]}
      fallback={svg}
      alt={faction.name}
      className="crest crest--img"
      style={{ width: size, height: size }}
    />
  )
}
