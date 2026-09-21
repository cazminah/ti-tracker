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
| **Game Setup** | Colour + faction per seat, 1–6 clockwise. Colours and factions can't be double-picked. Victory point target, and the two opening stage I objectives are all set here. |
| **Strategy Phase** | Draft in clockwise order from the speaker, two rows of four. A card goes out of the pool once taken. |
| **Action Phase** | Initiative tiles in order; turns follow it. Strategy / tactical / pass, each behind a confirm, plus a panel for the five ways a point changes hands mid-phase. |
| **Status Phase** | The eight status-phase steps, then objective scoring in initiative order. |
| **Agenda Phase** | The agenda steps plus a vote box per player, ordered from the speaker's left. |
| **End of Game** | Final standings, where every point came from, time per player, and the full draft history. |

The header is persistent: players in **initiative order**, with victory points.
The order only changes when strategy cards are next drafted, so it stays stable
through a round. Points are earned by scoring objectives, not typed in — the
only manual steppers live in the developer bar.

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
- **The victory point target.** Set on the setup screen — 10, 14, or a number
  you type. The moment a player's score steps *onto* it, a full-screen
  **Confirm end of game?** goes up. Cancel takes that last point back off
  (it is usually a misclick on the header's +); confirm shows the end screen.
  Nudging an already-finished player from 11 to 12 doesn't ask again. When the
  point came from an objective, cancelling rolls the objective back too — the
  faction icon comes off the card, not just the point off the score.

## Objectives

The public and secret objective decks are imported from the **objectives** tab
of the Twilight Imperium Reference sheet — `set`, `stage`, `type`, `name` and
`description` — into `src/data/objectives.js`. That file is kept in the
sheet's own row order, because every drop-down and every row of boxes reads it
top to bottom. The sheet groups by `type` and sorts by `name` inside each
group, but deliberately puts `spend` last rather than alphabetically, and one
secret has no type at all, so re-sorting in code would quietly change the
order. Options always read `Name - description`.

Two stage I objectives are revealed at setup. After that the status phase
carries the rest:

- **Scoring order.** The six players sit in a row in initiative order — the
  order set by the strategy cards drafted that round. The active player is
  lifted out of the row and named in a banner below it; **Next player →**
  walks down the row, **← Back** goes the other way for a misclick. Back
  disappears the moment the round's card is turned over — stepping back in
  after that would let someone score an objective that was face down when
  their turn came round.
- **Public objectives.** Two rows of five boxes, stage I above stage II.
  Clicking a revealed one scores it for the active player: their faction icon
  lands in the box and their score goes up by what the card is worth — 1 for a
  stage I, 2 for a stage II. Clicking it again takes it back off. One public
  per player per status phase — the other boxes disable once they've taken one
  — and an objective they scored in an earlier round is settled, so it can't
  be taken twice or undone later.
- **Revealing.** One card a round, and only once every player has been through:
  the **All players have scored** banner grows a **Reveal next objective**
  button that opens the step (2) picker. Slots still face down draw their
  stage's card back and are inert. Stage I fills its five slots first — two at
  setup, then one each in rounds 1 to 3 — so the first stage II is revealed at
  the end of round 4, and the button switches decks on its own.
- **Secret objectives.** The active player's banner carries a drop-down of
  every secret that can be scored in a status phase — action- and agenda-type
  secrets are excluded, and a secret someone else has already scored is gone
  from the list for everyone. Picking one scores it there and then — no
  confirm step, because the banner keeps an **Undo** beside it. It lands in
  that player's box in the row of six as a single line of its name; hovering
  it pops the full `Name - description` up at the cursor. One secret per
  player per phase.

## Victory points in the action phase

Points move around mid-phase in five ways, and **Score Victory Points** — a
disclosure below the action choices, shut by default because most turns need
none of it — covers four of them. The fifth, Imperial, belongs to its card.

Two different players are in play in that panel, deliberately. The custodians
token and the Shard are things the player *whose turn it is* does. Secrets and
Support for the Throne can change hands on anybody's turn, so those run off a
seat picked out of the row of six — which starts on the active player and
returns to them when the turn moves on. The banner says **off turn** when the
two have come apart.

- **The custodians token.** Mecatol Rex, drawn as a system tile. Clicking it
  gives the active player the token and a point, and crests the tile in their
  colour; clicking again takes both back. It is a one-off, so it stays
  editable only for the turn it was taken on and is locked out for the rest of
  the game after that.
- **The Shard of the Throne.** Same click-to-claim, but it moves: taking it
  off whoever holds it costs them the point it was carrying and hands it to
  the taker, however many times it changes hands.
- **Action-phase secrets.** A drop-down of the twelve action-type secrets
  nobody has taken, scored against whichever seat is picked — no per-turn
  limit, unlike the status phase, because they fire off combats and actions
  rather than off the round. Each one the player holds appears below the
  banner with an undo. The box shows a count against the 3-a-game limit;
  nothing blocks a fourth, because The Obsidian exists.
- **Support for the Throne.** Each player owns one note, worth a point to
  whoever holds it and nothing to its owner. Picking a giver from the
  drop-down hands their note to the picked seat and greys that giver out for
  everyone, since they only have the one. Clicking the **Support from X** chip
  in a player box hands it back: the holder loses the point and X can give it
  again.
- **Imperial.** Confirming its strategy action opens the card: score one
  revealed public objective you have fulfilled, then take a point if you hold
  Mecatol Rex. Both halves are optional and both are gathered before anything
  is applied, so the card resolves as one move. The public objective scored
  this way does not count against the one-public-a-status-phase limit — a
  different phase, a different rule.

The agenda-phase secrets are in the data file but not yet wired to a screen.

## Artwork

Faction crests, strategy cards and the two victory-point tokens all go through
`FallbackImage`: local files first, then the wiki CDN, then something drawn in
SVG. Drop a file in to override the drawing —
`public/assets/factions/<id>.png`, `public/assets/cards/<id>.png`, or
`public/assets/tokens/mecatol-rex.png` and `shard-of-the-throne.png`.

## The developer bar

**Dev** in the header opens a strip along the foot of the screen: jump straight
to any phase, bump the round, reset, and nudge any player's score. Jumping
fills in whatever the target screen needs to render — seats, the two opening
objectives, a draft — so the status phase is one click from a cold start
rather than three rounds of clicking. It is off by default and the setting
persists, so it stays out of the way of an actual game.

## The turn clock

Each player has a clock that runs only while it is their turn in the action
phase, and accumulates across every round of the game. It reads at the right
of the turn banner, with a pulsing dot in their colour while it is live.

It is a chess clock, not a stopwatch per turn: confirming an action stops the
acting player's clock and starts the next player's in the same instant, so
the six totals add up to the length of the action phase. The clock also stops
when the last player passes, when the game ends, and when the action phase is
left by any other route.

The implementation is one timestamp in state (`turnStartedAt`) plus a banked
seconds-per-seat map (`timers`); the interval in `ActionPhase` only exists to
make the rendered figure move, so a throttled background tab can't drift the
count. A clock that was running when the tab closed restarts on load rather
than billing someone for the hours the app spent shut.

## The end of game screen

Confirming the prompt replaces the app with the final standings: the winning
faction named in the headline, then a table of every player ranked on victory
points — ties broken on initiative order — with where those points came from,
their total time and the strategy card they drafted in each round. The left
columns stay pinned while the round columns scroll, which starts to matter
around round six; below 940px nothing sticks and the whole table scrolls
instead, since five pinned columns would cover what they exist to anchor.

**Points from** is derived from the records that granted each point — who
scored which objective, who holds the Shard, who is holding whose Support —
rather than from a running log, so it survives every undo. Two things have no
record of their own: Imperial's Mecatol Rex point, which keeps a tally, and
anything nudged in from the developer bar, which shows as *Unrecorded*. The
column therefore always adds up to the number beside it.

The draft history is logged at the *start* of each action phase, when that
round's picks are final, so a game that ends mid-round still shows the round
it ended in. **Back to game** returns to exactly where you were, clock and
all, for when it turns out someone miscounted.

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
laptop mid-session won't lose the game — including scores, clocks and the draft
history. **New game** in the header wipes it.
