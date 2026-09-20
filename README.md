# Twilight Imperium Tracker

A round tracker for a six-player game of Twilight Imperium 4th Edition using
**Prophecy of Kings + Codex I–IV**, with **Thunder's Edge excluded**.

```bash
npm install
npm run dev
```

Then open http://localhost:5175.

## What it tracks

The app walks one round at a time through:

| Screen | What it does |
| --- | --- |
| **Game Setup** | Colour + faction per seat, 1–6 clockwise. Colours and factions can't be double-picked. |
| **Strategy Phase** | Draft in clockwise order from the speaker, two rows of four. A card goes out of the pool once taken. |
| **Action Phase** | Initiative tiles in order; turns follow it. Strategy / tactical / pass, each behind a confirm. |
| **Status Phase** | The eight status-phase steps. |
| **Agenda Phase** | The agenda steps plus a vote box per player, ordered from the speaker's left. |

The header is persistent: players in **initiative order**, with victory points.
Hover a player to reveal − and + . The order only changes when strategy cards
are next drafted, so it stays stable through a round.

## Rules the app actually enforces

- **Trade goods on unpicked cards.** The two cards nobody takes each gain 1
  trade good when the strategy phase ends, and they accumulate round on round.
  Whoever eventually drafts one collects the pile — shown as `+N TG` next to
  their name during that draft.
- **Exhausting strategy cards.** Taking a strategic action dims that card's
  name box and stamps USED across it for the rest of the round; the button then
  disables. The rest of the tile stays bright — that player is still playing.
- **The speaker token.** Resolving **Politics** opens a Select Speaker prompt
  (the current speaker is excluded, per the card). The new speaker becomes
  Player 1 for every following phase, with seat order preserved — pick seat 3
  and the order becomes 3, 4, 5, 6, 1, 2.
- **Passing.** A player cannot pass until they have performed their strategic
  action, so the Pass button stays disabled until then. Once passed they are
  skipped for the rest of the round and their whole tile greys out.

## The action phase tiles

Each strategy card shows as a three-band tile:

1. **The initiative numeral**, cropped straight out of the card art and blown
   up to the tile's full width. The crop is the rectangle `x 0.70–1.00`,
   `y 0.00–0.20` of the source image — the numeral's corner on every printing.
   It lives in two places that must stay in step: `INITIATIVE_CROP` in
   `src/components/InitiativeTile.jsx` (documentation) and the `.initcrop__img`
   width/height percentages in `src/styles.css` (which actually do the crop).
2. **The owner banner** — player colour, faction symbol and name at 20px,
   bordered. This is the shared `OwnerBanner` component, also used by the draft
   cards, so the two screens can't drift apart.
3. **The card name** in the card's own colour, centred, in Handel Gothic (see
   Fonts below). The Ω suffix is dropped here — the card art already carries
   it — which lets all eight names sit on one line at one size.

The three states are shown at deliberately different scales:

- **Their turn** rings the tile in gold and pulses it, and lifts it above its
  neighbours so the glow isn't clipped by the grid gap.
- **Card spent** dims only the name box and stamps a narrow USED pill on it —
  narrow on purpose, so the name stays half-readable behind. The numeral and
  owner banner stay bright, because that player is still in.
- **Player passed** greys the tile and stamps PASSED diagonally across the
  numeral. Note the dimming is applied band by band rather than to the whole
  tile: the stamp has to sit *outside* anything faded, or it fades too and
  becomes the thing it was meant to fix.
- **Card undrafted** greys the whole tile, and carries its trade goods.

Below the row, the turn banner is a single line: faction symbol, faction name
at 36px, and the held card as a pill in that card's colour — 36px tall to match
the name's font size, 28px type, in the card face. The pill drops away once
that card has been spent; the tile's USED stamp carries it from there.

The three action buttons are colour-coded by consequence: teal-green for the
strategy action, neutral slate for tactical/component, muted brick for pass.
Each mixes its own accent into the panel colour via `--cc`, so base, hover and
selected are three strengths of one hue rather than three separate colours.

## Shared pieces

Three things appear on both the strategy and action screens, and each has a
single definition so they can't drift apart:

- `OwnerBanner` — the "who holds this card" strip.
- `.cardpill` — the card as a coloured pill. Each site sets only its height,
  to match the faction name beside it, and a type size about 0.75 of that.
  36px/28px in the action phase's turn banner, 24px/18px in the draft line.
- The player-coloured wash behind the turn banner and each draft-line row.

A note on that wash, because it's a tempting trap: it can't live in a
`--player-wash` custom property on `:root`. A custom property's own `var()`s
resolve against the element that *declares* it, so `var(--pc)` there would
resolve against `:root`, find nothing, and take the whole value invalid — the
gradient silently vanishes. It's a shared selector list instead.

## Fonts

Strategy card names are set in **Handel Gothic D Bold**, loaded from
`public/fonts/Handel Gothic D Bold.otf` and preloaded in `index.html`. It's a
commercial font — see `public/fonts/README.md` for the details and for the
alternate filenames the `@font-face` also accepts. If it ever fails to resolve,
names fall back to Titillium Web.

The name size (21px) is set by the longest name, "Construction", in the
narrowest column — eight tiles across, about 152px of usable width. Handel
Gothic renders it at ~130px, so there's room to spare; that one number in
`.inittile__name` is the dial if you change the face.

## Faction and strategy card art

Art is hotlinked from the Twilight Imperium wiki, with a chain of fallbacks:

1. `public/assets/factions/<faction-id>.png` or `public/assets/cards/<card-id>.png`
2. the wiki CDN
3. a hand-drawn SVG emblem / card face rendered by the app

The wiki's image host sits behind Cloudflare. Real browsers get through it
fine, but if it ever starts refusing, drop your own images into
`public/assets/` and they take priority — no code change needed. The IDs are
the `id` fields in `src/data/factions.js` and `src/data/strategyCards.js`
(e.g. `public/assets/factions/sol.png`, `public/assets/cards/diplomacy.png`).

## Card printings

Per house rules, this game uses:

- **Diplomacy Ω** (Codex I)
- **Construction Ω** (Prophecy of Kings)
- **Warfare** — the base-game card, *not* the Thunder's Edge Ω

Everything else is the base-game printing. Change them in
`src/data/strategyCards.js`.

## Saving

State is written to `localStorage` after every change, so a refresh or a closed
laptop mid-session won't lose the game. **New game** in the header wipes it.
