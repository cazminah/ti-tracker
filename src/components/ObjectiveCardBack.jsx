/**
 * The back of a public objective card, drawn rather than photographed so an
 * unrevealed slot still looks like a card sitting on the table.
 *
 * Stage I is the amber back and stage II the blue one, matching the printed
 * cards; the numeral is the only thing that differs, so stage II comes free
 * when the stage II row is added.
 */
const TONES = {
  I: { edge: '#c8922c', glow: '#ffd67a', deep: '#3a2408', face: '#7a4e10' },
  II: { edge: '#3f7fd0', glow: '#8fc4ff', deep: '#0a1c38', face: '#123a6b' },
}

export function ObjectiveCardBack({ stage = 'I', className = '' }) {
  const tone = TONES[stage] ?? TONES.I
  const id = `objback-${stage}`

  return (
    <svg
      viewBox="0 0 120 168"
      className={`objback ${className}`}
      role="img"
      aria-label={`Face-down stage ${stage} objective`}
    >
      <defs>
        <linearGradient id={`${id}-face`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone.face} />
          <stop offset="55%" stopColor={tone.deep} />
          <stop offset="100%" stopColor={tone.face} />
        </linearGradient>
        <radialGradient id={`${id}-halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={tone.glow} stopOpacity=".55" />
          <stop offset="100%" stopColor={tone.glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Card body, with the bevelled bright edge the real cards have. */}
      <rect x="2" y="2" width="116" height="164" rx="9" fill={`url(#${id}-face)`} />
      <rect
        x="2" y="2" width="116" height="164" rx="9"
        fill="none" stroke={tone.edge} strokeWidth="3"
      />
      <rect
        x="8" y="8" width="104" height="152" rx="6"
        fill="none" stroke={tone.glow} strokeWidth="1" opacity=".45"
      />

      {/* Corner notches: the cut-off corners of the printed frame. */}
      {[[8, 8], [112, 8], [8, 160], [112, 160]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill={tone.edge} opacity=".8" />
      ))}

      {/* The glowing plaque, and the numeral sitting in it. */}
      <ellipse cx="60" cy="84" rx="52" ry="46" fill={`url(#${id}-halo)`} />
      <rect
        x="32" y="52" width="56" height="64" rx="5"
        fill={tone.deep} stroke={tone.edge} strokeWidth="2.5"
      />
      <text
        x="60" y="84"
        textAnchor="middle" dominantBaseline="central"
        fontFamily="var(--font-card)" fontWeight="700" fontSize="42"
        fill={tone.glow}
      >
        {stage}
      </text>

      {/* Header and footer bands, standing in for the card's printed text. */}
      <rect x="22" y="24" width="76" height="8" rx="4" fill={tone.edge} opacity=".75" />
      <rect x="34" y="136" width="52" height="5" rx="2.5" fill={tone.edge} opacity=".5" />
      <rect x="42" y="146" width="36" height="4" rx="2" fill={tone.edge} opacity=".35" />
    </svg>
  )
}
