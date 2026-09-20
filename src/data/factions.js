// The 25 factions legal in a Prophecy of Kings + Codex I-IV game.
// Thunder's Edge factions (Crimson Rebellion, Deepwrought Scholarate,
// Firmament/Obsidian, Last Bastion, Ral Nel Consortium) are deliberately absent.
//
// `art` is the faction symbol's filename on the TI4 wiki. See src/art/sources.js
// for how it is turned into a URL and why a local override usually wins.

const CDN = 'https://static.wikia.nocookie.net/twilight-imperium-4/images'

export const FACTIONS = [
  // --- Base game (17) ---
  { id: 'arborec',   name: 'The Arborec',                short: 'Arborec',   expansion: 'base', accent: '#6fae4a', art: `${CDN}/8/8f/ArborecSymbolSquare.png` },
  { id: 'letnev',    name: 'The Barony of Letnev',       short: 'Letnev',    expansion: 'base', accent: '#a03242', art: `${CDN}/2/20/Barony.png` },
  { id: 'saar',      name: 'The Clan of Saar',           short: 'Saar',      expansion: 'base', accent: '#c07a34', art: `${CDN}/b/b0/Saar.png` },
  { id: 'muaat',     name: 'The Embers of Muaat',        short: 'Muaat',     expansion: 'base', accent: '#e0622c', art: `${CDN}/3/37/MuaatSymbolSquare.png` },
  { id: 'hacan',     name: 'The Emirates of Hacan',      short: 'Hacan',     expansion: 'base', accent: '#e0b23a', art: `${CDN}/f/f8/Hacan.png` },
  { id: 'sol',       name: 'The Federation of Sol',      short: 'Sol',       expansion: 'base', accent: '#3f7fd0', art: `${CDN}/0/01/Sol.png` },
  { id: 'creuss',    name: 'The Ghosts of Creuss',       short: 'Creuss',    expansion: 'base', accent: '#3fbfc9', art: `${CDN}/7/7f/Ghosts.png` },
  { id: 'l1z1x',     name: 'The L1Z1X Mindnet',          short: 'L1Z1X',     expansion: 'base', accent: '#6e7f92', art: `${CDN}/e/ec/L1Z1X.png` },
  { id: 'mentak',    name: 'The Mentak Coalition',       short: 'Mentak',    expansion: 'base', accent: '#c2a468', art: `${CDN}/3/3c/Mentak.png` },
  { id: 'naalu',     name: 'The Naalu Collective',       short: 'Naalu',     expansion: 'base', accent: '#a8c93a', art: `${CDN}/a/a7/Naalu.png` },
  { id: 'nekro',     name: 'The Nekro Virus',            short: 'Nekro',     expansion: 'base', accent: '#b8332e', art: `${CDN}/2/22/Nekro.png` },
  { id: 'sardakk',   name: "Sardakk N'orr",              short: 'Sardakk',   expansion: 'base', accent: '#8f3b32', art: `${CDN}/0/08/SardakkSymbolSquare.png` },
  { id: 'jolnar',    name: 'The Universities of Jol-Nar',short: 'Jol-Nar',   expansion: 'base', accent: '#9a63c8', art: `${CDN}/0/06/Jol-Nar.png` },
  { id: 'winnu',     name: 'The Winnu',                  short: 'Winnu',     expansion: 'base', accent: '#d8c38a', art: `${CDN}/c/cd/Winnu.png` },
  { id: 'xxcha',     name: 'The Xxcha Kingdom',          short: 'Xxcha',     expansion: 'base', accent: '#3fa58f', art: `${CDN}/1/1a/Xxcha.png` },
  { id: 'yin',       name: 'The Yin Brotherhood',        short: 'Yin',       expansion: 'base', accent: '#cfd4da', art: `${CDN}/f/f6/Yin.png` },
  { id: 'yssaril',   name: 'The Yssaril Tribes',         short: 'Yssaril',   expansion: 'base', accent: '#5f8a45', art: `${CDN}/a/ac/Yssaril.png` },

  // --- Prophecy of Kings (7) ---
  { id: 'argent',    name: 'The Argent Flight',          short: 'Argent',    expansion: 'pok', accent: '#e08b45', art: `${CDN}/1/13/ArgentFactionSymbol.png` },
  { id: 'empyrean',  name: 'The Empyrean',               short: 'Empyrean',  expansion: 'pok', accent: '#7a4fbf', art: `${CDN}/c/ca/EmpyreanFactionSymbol.png` },
  { id: 'mahact',    name: 'The Mahact Gene-Sorcerers',  short: 'Mahact',    expansion: 'pok', accent: '#d9b43c', art: `${CDN}/2/2f/MahactSymbolSquare.png` },
  { id: 'naazrokha', name: 'The Naaz-Rokha Alliance',    short: 'Naaz-Rokha',expansion: 'pok', accent: '#4fae86', art: `${CDN}/3/3b/NaazRokhaSymbolSquare.png` },
  { id: 'nomad',     name: 'The Nomad',                  short: 'Nomad',     expansion: 'pok', accent: '#4fa6cf', art: `${CDN}/5/5e/NomadFactionSheet.png` },
  { id: 'titans',    name: 'The Titans of Ul',           short: 'Titans',    expansion: 'pok', accent: '#8fb6cf', art: `${CDN}/6/6d/UlFactionSymbol.png` },
  { id: 'cabal',     name: "The Vuil'Raith Cabal",       short: 'Cabal',     expansion: 'pok', accent: '#c4479a', art: `${CDN}/0/04/CabalFactionSymbol.png` },

  // --- Codex III: Vigil (1) ---
  { id: 'keleres',   name: 'The Council Keleres',        short: 'Keleres',   expansion: 'codex', accent: '#49c0d4', art: `${CDN}/8/86/KeleresFactionSymbol.png` },
]

export const EXPANSION_LABELS = {
  base: 'Base Game',
  pok: 'Prophecy of Kings',
  codex: 'Codex I–IV',
}

export const factionById = (id) => FACTIONS.find((f) => f.id === id)
