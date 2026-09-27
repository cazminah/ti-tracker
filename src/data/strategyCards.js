// The eight strategy cards as used at this table:
//   Diplomacy Ω   (Codex I)
//   Construction Ω (Prophecy of Kings)
//   Warfare        (base game — NOT the Thunder's Edge Ω)
// everything else is the base-game printing.

const CDN = 'https://static.wikia.nocookie.net/twilight-imperium-4/images'

export const STRATEGY_CARDS = [
  {
    id: 'leadership',
    initiative: 1,
    name: 'Leadership',
    omega: null,
    hue: '#c4453a',
    art: `${CDN}/1/1e/Ti07_strategy_1_leadership.png`,
    primary: [
      'Gain 3 command tokens.',
      'Spend any amount of influence to gain 1 command token for every 3 influence spent.',
    ],
    secondary: [
      'Spend any amount of influence to gain 1 command token for every 3 influence spent.',
    ],
    note: 'No command token is spent for the secondary.',
  },
  {
    id: 'diplomacy',
    initiative: 2,
    name: 'Diplomacy',
    omega: 'Ω',
    edition: 'Codex I',
    hue: '#d9822f',
    art: `${CDN}/a/a1/Untitled.png`,
    primary: [
      'Choose 1 system other than the Mecatol Rex system that contains a planet you control; each other player places a command token from their reinforcements in the chosen system.',
      'Then, ready up to 2 exhausted planets you control.',
    ],
    secondary: [
      'Spend 1 token from your strategy pool to ready up to 2 exhausted planets you control.',
    ],
  },
  {
    id: 'politics',
    initiative: 3,
    name: 'Politics',
    omega: null,
    hue: '#d4b736',
    art: `${CDN}/f/f1/Ti07_strategy_3_politics.png`,
    primary: [
      'Choose a player other than the speaker. That player gains the speaker token.',
      'Draw 2 action cards.',
      'Look at the top 2 cards of the agenda deck. Place each card on the top or bottom of the deck in any order.',
    ],
    secondary: ['Spend 1 token from your strategy pool to draw 2 action cards.'],
  },
  {
    id: 'construction',
    initiative: 4,
    name: 'Construction',
    omega: 'Ω',
    edition: 'Prophecy of Kings',
    hue: '#5ba14c',
    art: `${CDN}/5/5e/Newconstruction.png`,
    // This scan is trimmed tighter at the top than the other seven, so the
    // shared initiative crop lands low on it. Push it down by this fraction of
    // the crop box to line the numeral up. Drop it if a local image replaces it.
    artCropY: 0.08,
    primary: [
      'Place 1 PDS or 1 Space Dock on a planet you control.',
      'Place 1 PDS on a planet you control.',
    ],
    secondary: [
      'Spend 1 token from your strategy pool and place it in any system; you may place either 1 space dock or 1 PDS on a planet you control in that system.',
    ],
  },
  {
    id: 'trade',
    initiative: 5,
    name: 'Trade',
    omega: null,
    hue: '#3fa396',
    art: `${CDN}/c/ca/Ti07_strategy_5_trade.png`,
    primary: [
      'Gain 3 trade goods.',
      'Replenish commodities.',
      'Choose any number of other players. Those players use the secondary ability of this strategy card without spending a command token.',
    ],
    secondary: ['Spend 1 token from your strategy pool to replenish commodities.'],
  },
  {
    id: 'warfare',
    initiative: 6,
    name: 'Warfare',
    omega: null,
    hue: '#4470bd',
    art: `${CDN}/0/02/Ti07_strategy_6_warfare.png`,
    primary: [
      'Remove 1 of your command tokens from the game board; then, gain 1 command token.',
      'Redistribute any number of the command tokens on your command sheet.',
    ],
    secondary: [
      'Spend 1 token from your strategy pool to use the PRODUCTION ability of 1 of your space docks in your home system.',
    ],
  },
  {
    id: 'technology',
    initiative: 7,
    name: 'Technology',
    omega: null,
    hue: '#7f57bf',
    art: `${CDN}/e/ea/Ti07_strategy_7_technology.png`,
    primary: ['Research 1 technology.', 'Spend 6 resources to research 1 technology.'],
    secondary: [
      'Spend 1 token from your strategy pool and 4 resources to research 1 technology.',
    ],
  },
  {
    id: 'imperial',
    initiative: 8,
    name: 'Imperial',
    omega: null,
    hue: '#b23f8c',
    art: `${CDN}/2/24/Ti07_strategy_8_imperial.png`,
    primary: [
      'Immediately score 1 public objective if you fulfill its requirements.',
      'Gain 1 victory point if you control Mecatol Rex; otherwise, draw 1 secret objective.',
    ],
    secondary: ['Spend 1 token from your strategy pool to draw 1 secret objective.'],
  },
]

export const cardById = (id) => STRATEGY_CARDS.find((c) => c.id === id)
