/*
 * Riders: played after an agenda is revealed and before anyone votes. The
 * player predicts an outcome, gives up their vote on that agenda, and gains
 * the reward if the prediction comes good. Each can be played once per agenda
 * phase.
 *
 * `faction` limits one to a single faction — Galactic Threat is the Nekro
 * Virus's faction ability, not an action card, but plays the same way.
 */

const PREDICT =
  'After an agenda is revealed: You cannot vote on this agenda. Predict aloud an outcome of this agenda. If your prediction is correct,'

export const RIDERS = [
  { id: 'construction-rider', name: 'Construction Rider', description: `${PREDICT} place 1 space dock from your reinforcements on a planet you control.` },
  { id: 'diplomacy-rider', name: 'Diplomacy Rider', description: `${PREDICT} choose 1 system that contains a planet you control. Each other player places a command token from their reinforcements in that system.` },
  { id: 'imperial-rider', name: 'Imperial Rider', description: `${PREDICT} gain 1 victory point.` },
  { id: 'leadership-rider', name: 'Leadership Rider', description: `${PREDICT} gain 3 command tokens.` },
  { id: 'politics-rider', name: 'Politics Rider', description: `${PREDICT} draw 3 action cards and gain the speaker token.` },
  { id: 'technology-rider', name: 'Technology Rider', description: `${PREDICT} research 1 technology.` },
  { id: 'trade-rider', name: 'Trade Rider', description: `${PREDICT} gain 5 trade goods.` },
  { id: 'warfare-rider', name: 'Warfare Rider', description: `${PREDICT} place 1 dreadnought from your reinforcements in a system that contains 1 or more of your ships.` },
  {
    id: 'galactic-threat',
    name: 'Galactic Threat',
    faction: 'nekro',
    description:
      'Once per agenda phase, after an agenda is revealed, you may predict aloud the outcome of that agenda. If your prediction is correct, you may gain 1 technology that is owned by a player who voted how you predicted.',
  },
]

export const riderById = (id) => RIDERS.find((r) => r.id === id)

/** The riders a faction can play at all, whether or not they're used yet. */
export const ridersFor = (factionId) => RIDERS.filter((r) => !r.faction || r.faction === factionId)
