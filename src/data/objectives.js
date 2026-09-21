/*
 * Public and secret objectives, imported verbatim from the "objectives" tab of
 * the Twilight Imperium Reference sheet (name, description and the hand-rolled
 * `type` categorisation, which exists only to group the drop-downs).
 *
 * ORDER MATTERS. Every drop-down and every row of objective boxes reads this
 * array top to bottom, so it is kept in exactly the sheet's row order rather
 * than re-sorted at render time — the sheet groups by `type` and then sorts by
 * `name` within the group, but puts `spend` last rather than alphabetically,
 * and one secret has no type at all. Sorting here would quietly change that.
 */

export const OBJECTIVES = [
  // --- Stage I public objectives (20) ---
  { id: "corner-the-market", stage: "I", type: "planets", name: "Corner the Market", description: "Control 4 planets that each have the same planet trait.", set: "base" },
  { id: "discover-lost-outposts", stage: "I", type: "planets", name: "Discover Lost Outposts", description: "Control 2 planets that have attachments.", set: "PoK" },
  { id: "expand-borders", stage: "I", type: "planets", name: "Expand Borders", description: "Control 6 planets in non-home systems.", set: "base" },
  { id: "found-research-outposts", stage: "I", type: "planets", name: "Found Research Outposts", description: "Control 3 planets that have technology specialties.", set: "base" },
  { id: "push-boundaries", stage: "I", type: "planets", name: "Push Boundaries", description: "Control more planets than each of 2 of your neighbors.", set: "PoK" },
  { id: "build-defenses", stage: "I", type: "plastic", name: "Build Defenses", description: "Have 4 or more structures.", set: "PoK" },
  { id: "engineer-a-marvel", stage: "I", type: "plastic", name: "Engineer a Marvel", description: "Have your flagship or war sun on the game board.", set: "PoK" },
  { id: "improve-infrastructure", stage: "I", type: "plastic", name: "Improve Infrastructure", description: "Have structures on 3 planets outside of your home system.", set: "PoK" },
  { id: "raise-a-fleet", stage: "I", type: "plastic", name: "Raise a Fleet", description: "Have 5 or more non-fighter ships in 1 system.", set: "PoK" },
  { id: "explore-deep-space", stage: "I", type: "systems", name: "Explore Deep Space", description: "Have units in 3 systems that do not contain planets.", set: "PoK" },
  { id: "intimidate-the-council", stage: "I", type: "systems", name: "Intimidate the Council", description: "Have 1 or more ships in 2 systems that are adjacent to Mecatol Rex.", set: "base" },
  { id: "make-history", stage: "I", type: "systems", name: "Make History", description: "Have units in 2 systems that contain legendary planets, Mecatol Rex, or anomalies.", set: "PoK" },
  { id: "populate-the-outer-rim", stage: "I", type: "systems", name: "Populate the Outer Rim", description: "Have units in 3 systems on the edge of the game board other than your home system.", set: "PoK" },
  { id: "develop-weaponry", stage: "I", type: "tech", name: "Develop Weaponry", description: "Own 2 unit upgrade technologies.", set: "base" },
  { id: "diversify-rearch", stage: "I", type: "tech", name: "Diversify Research", description: "Own 2 technologies in each of 2 colors.", set: "base" },
  { id: "amass-wealth", stage: "I", type: "spend", name: "Amass Wealth", description: "Spend 3 influence, 3 resources, and 3 trade goods.", set: "PoK" },
  { id: "erect-a-monument", stage: "I", type: "spend", name: "Erect a Monument", description: "Spend 8 resources.", set: "base" },
  { id: "lead-from-the-front", stage: "I", type: "spend", name: "Lead from the Front", description: "Spend a total of 3 tokens from your tactic and/or strategy pools.", set: "base" },
  { id: "negotiate-trade-routes", stage: "I", type: "spend", name: "Negotiate Trade Routes", description: "Spend 5 trade goods.", set: "base" },
  { id: "sway-the-council", stage: "I", type: "spend", name: "Sway the Council", description: "Spend 8 influence.", set: "base" },

  // --- Stage II public objectives (20) ---
  { id: "conquer-the-weak", stage: "II", type: "planets", name: "Conquer the Weak", description: "Control 1 planet that is in another player's home system.", set: "base" },
  { id: "form-galactic-brain-trust", stage: "II", type: "planets", name: "Form Galactic Brain Trust", description: "Control 5 planets that have technology specialties.", set: "base" },
  { id: "reclaim-ancient-monuments", stage: "II", type: "planets", name: "Reclaim Ancient Monuments", description: "Control 3 planets that have attachments.", set: "PoK" },
  { id: "rule-distant-lands", stage: "II", type: "planets", name: "Rule Distant Lands", description: "Control 2 planets that are each in or adjacent to a different, other player's home system.", set: "PoK" },
  { id: "subdue-the-galaxy", stage: "II", type: "planets", name: "Subdue the Galaxy", description: "Control 11 planets in non-home systems.", set: "base" },
  { id: "unify-the-colonies", stage: "II", type: "planets", name: "Unify the Colonies", description: "Control 6 planets that each have the same planet trait.", set: "base" },
  { id: "command-an-armada", stage: "II", type: "plastic", name: "Command an Armada", description: "Have 8 or more non-fighter ships in 1 system.", set: "PoK" },
  { id: "construct-massive-cities", stage: "II", type: "plastic", name: "Construct Massive Cities", description: "Have 7 or more structures.", set: "PoK" },
  { id: "protect-the-border", stage: "II", type: "plastic", name: "Protect the Border", description: "Have structures on 5 planets outside of your home system.", set: "PoK" },
  { id: "achieve-supremacy", stage: "II", type: "plastic", name: "Achieve Supremacy", description: "Have your flagship or war sun in another player's home system or the Mecatol Rex system.", set: "PoK" },
  { id: "become-a-legend", stage: "II", type: "plastic", name: "Become a Legend", description: "Have units in 4 systems that contain legendary planets, Mecatol Rex, or anomalies.", set: "PoK" },
  { id: "control-the-borderlands", stage: "II", type: "plastic", name: "Control the Borderlands", description: "Have units in 5 systems on the edge of the game board other than your home system.", set: "PoK" },
  { id: "patrol-vast-territories", stage: "II", type: "plastic", name: "Patrol Vast Territories", description: "Have units in 5 systems that do not contain planets.", set: "PoK" },
  { id: "master-of-sciences", stage: "II", type: "tech", name: "Master of Sciences", description: "Own 2 technologies in each of 4 colors.", set: "base" },
  { id: "revolutionize-warfare", stage: "II", type: "tech", name: "Revolutionize Warfare", description: "Own 3 unit upgrade technologies.", set: "base" },
  { id: "centralize-galactic-trade", stage: "II", type: "spend", name: "Centralize Galactic Trade", description: "Spend 10 trade goods.", set: "base" },
  { id: "found-a-golden-age", stage: "II", type: "spend", name: "Found a Golden Age", description: "Spend 16 resources.", set: "base" },
  { id: "galvanize-the-people", stage: "II", type: "spend", name: "Galvanize the People", description: "Spend a total of 6 tokens from your tactic and/or strategy pools.", set: "base" },
  { id: "hold-vast-reserves", stage: "II", type: "spend", name: "Hold Vast Reserves", description: "Spend 6 influence, 6 resources, and 6 trade goods.", set: "PoK" },
  { id: "manipulate-galactic-law", stage: "II", type: "spend", name: "Manipulate Galactic Law", description: "Spend 16 influence.", set: "base" },

  // --- Secret objectives (40) ---
  { id: "become-a-martyr", stage: "secret", type: "action", name: "Become a Martyr", description: "Lose control of a planet in a home system.", set: "PoK" },
  { id: "betray-a-friend", stage: "secret", type: "action", name: "Betray a Friend", description: "Win a combat against a player whose promissory note you had in your play area at the start of your tactical action.", set: "PoK" },
  { id: "brave-the-void", stage: "secret", type: "action", name: "Brave the Void", description: "Win a combat in an anomaly.", set: "PoK" },
  { id: "darken-the-skies", stage: "secret", type: "action", name: "Darken the Skies", description: "Win a combat in another player's home system.", set: "PoK" },
  { id: "demonstrate-your-power", stage: "secret", type: "action", name: "Demonstrate Your Power", description: "Have 3 or more non-fighter ships in the active system at the end of a space combat.", set: "PoK" },
  { id: "destroy-their-greatest-ship", stage: "secret", type: "action", name: "Destroy Their Greatest Ship", description: "Destroy another player's war sun or flagship.", set: "base" },
  { id: "fight-with-precision", stage: "secret", type: "action", name: "Fight with Precision*", description: "Destroy the last of a player's fighters in the active system during the anti-fighter barrage step.", set: "C.III" },
  { id: "make-an-example-of-their-world", stage: "secret", type: "action", name: "Make an Example of Their World*", description: "Destroy the last of a player's ground forces on a planet during the bombardment step.", set: "C.III" },
  { id: "prove-endurance", stage: "secret", type: "action", name: "Prove Endurance", description: "Be the last player to pass during a game round.", set: "PoK" },
  { id: "spark-a-rebellion", stage: "secret", type: "action", name: "Spark a Rebellion", description: "Win a combat against a player who has the most victory points.", set: "base" },
  { id: "turn-their-fleets-to-dust", stage: "secret", type: "action", name: "Turn Their Fleets to Dust*", description: "Destroy the last of a player's non-fighter ships in the active system during the space cannon offense step.", set: "C.III" },
  { id: "unveil-flagship", stage: "secret", type: "action", name: "Unveil Flagship", description: "Win a space combat in a system with your flagship without it being destroyed.", set: "base" },
  { id: "dictate-policy", stage: "secret", type: "agenda", name: "Dictate Policy", description: "There are 3 or more laws in play.", set: "PoK" },
  { id: "drive-the-debate", stage: "secret", type: "agenda", name: "Drive the Debate", description: "You or a planet you control are elected by an agenda.", set: "PoK" },
  { id: "establish-hegemony", stage: "secret", type: "planets", name: "Establish Hegemony", description: "Control planets that have a combined influence value of at least 12.", set: "PoK" },
  { id: "forge-an-alliance", stage: "secret", type: "planets", name: "Forge an Alliance", description: "Control 4 cultural planets.", set: "base" },
  { id: "hoard-raw-materials", stage: "secret", type: "planets", name: "Hoard Raw Materials", description: "Control planets that have a combined resource value of at least 12.", set: "PoK" },
  { id: "mine-rare-minerals", stage: "secret", type: "planets", name: "Mine Rare Minerals", description: "Control 4 hazardous planets.", set: "base" },
  { id: "monopolize-production", stage: "secret", type: "planets", name: "Monopolize Production", description: "Control 4 industrial planets.", set: "base" },
  { id: "occupy-the-seat-of-the-empire", stage: "secret", type: "planets", name: "Occupy the Seat of the Empire", description: "Control Mecatol Rex and have 3 or more ships in its system.", set: "base" },
  { id: "seize-an-icon", stage: "secret", type: "planets", name: "Seize an Icon", description: "Control a legendary planet.", set: "PoK" },
  { id: "stake-your-claim", stage: "secret", type: "planets", name: "Stake Your Claim", description: "Control a planet in a system that contains a planet controlled by another player.", set: "PoK" },
  { id: "establish-a-perimeter", stage: "secret", type: "plastic", name: "Establish a Perimeter", description: "Have 4 PDS units on the game board.", set: "base" },
  { id: "fuel-the-war-machine", stage: "secret", type: "plastic", name: "Fuel the War Machine", description: "Have 3 space docks on the game board.", set: "base" },
  { id: "gather-a-mighty-fleet", stage: "secret", type: "plastic", name: "Gather a Mighty Fleet", description: "Have 5 dreadnoughts on the game board.", set: "base" },
  { id: "mechanize-the-military", stage: "secret", type: "plastic", name: "Mechanize the Military", description: "Have 1 mech on each of 4 planets.", set: "PoK" },
  { id: "produce-en-masse", stage: "secret", type: "plastic", name: "Produce en Masse", description: "Have units with a combined Production value of at least 8 in a single system.", set: "PoK" },
  { id: "strengthen-bonds", stage: "secret", type: "", name: "Strengthen Bonds", description: "Have another player's promissory note in your play area.", set: "PoK" },
  { id: "become-the-gatekeeper", stage: "secret", type: "systems", name: "Become the Gatekeeper", description: "Have 1 or more ships in both an alpha wormhole system and a beta wormhole system.", set: "base" },
  { id: "control-the-region", stage: "secret", type: "systems", name: "Control the Region", description: "Have 1 or more ships in 6 systems.", set: "base" },
  { id: "cut-supply-lines", stage: "secret", type: "systems", name: "Cut Supply Lines", description: "Have 1 or more ships in the same system as another player's space dock.", set: "base" },
  { id: "defy-space-and-time", stage: "secret", type: "systems", name: "Defy Space and Time", description: "Have units in the wormhole nexus.", set: "PoK" },
  { id: "foster-cohesion", stage: "secret", type: "systems", name: "Foster Cohesion", description: "Be neighbors with all other players.", set: "PoK" },
  { id: "learn-the-secrets-of-the-cosmos", stage: "secret", type: "systems", name: "Learn the Secrets of the Cosmos", description: "Have 1 or more ships in 3 systems that are each adjacent to an anomaly.", set: "base" },
  { id: "occupy-the-fringe", stage: "secret", type: "systems", name: "Occupy the Fringe", description: "Have 9 or more ground forces on a planet that does not contain 1 of your space docks.", set: "PoK" },
  { id: "threaten-enemies", stage: "secret", type: "systems", name: "Threaten Enemies", description: "Have 1 or more ships in a system adjacent to another player's home system.", set: "base" },
  { id: "adapt-new-strategies", stage: "secret", type: "tech", name: "Adapt New Strategies", description: "Own 2 faction technologies.", set: "base" },
  { id: "master-of-the-laws-of-physics", stage: "secret", type: "tech", name: "Master of the Laws of Physics", description: "Own 4 technologies of the same color.", set: "base" },
  { id: "destroy-heretical-works", stage: "secret", type: "spend", name: "Destroy Heretical Works", description: "Purge 2 of your relic fragments of any type.", set: "PoK" },
  { id: "form-a-spy-network", stage: "secret", type: "spend", name: "Form a Spy Network", description: "Discard 5 action cards.", set: "base" },
]

export const STAGE_I = OBJECTIVES.filter((o) => o.stage === 'I')
export const STAGE_II = OBJECTIVES.filter((o) => o.stage === 'II')
export const SECRETS = OBJECTIVES.filter((o) => o.stage === 'secret')

/** Public objectives by stage, for the two rows of boxes and their pickers. */
export const stageDeck = (stage) => (stage === 'II' ? STAGE_II : STAGE_I)

/** Victory points an objective is worth. Stage II cards are the double ones. */
export const pointsFor = (objective) => (objective?.stage === 'II' ? 2 : 1)

/**
 * Secrets that can be scored during the status phase. Action- and agenda-type
 * secrets are scored in those phases instead, so they never appear here.
 */
export const STATUS_SECRETS = SECRETS.filter(
  (o) => o.type !== 'action' && o.type !== 'agenda'
)

/** Secrets scored off the back of something done during the action phase. */
export const ACTION_SECRETS = SECRETS.filter((o) => o.type === 'action')

/** Secrets a player may hold, before The Obsidian raises it to four. */
export const SECRET_LIMIT = 3

const BY_ID = Object.fromEntries(OBJECTIVES.map((o) => [o.id, o]))

export const objectiveById = (id) => BY_ID[id] ?? null

/** "Name - description", the one label used everywhere an objective is listed. */
export const objectiveLabel = (o) => `${o.name} - ${o.description}`
