// The eight plastic colours in Prophecy of Kings.
export const PLAYER_COLORS = [
  { id: 'red',    name: 'Red',    hex: '#d5372f', ink: '#ffffff' },
  { id: 'blue',   name: 'Blue',   hex: '#2f6fd5', ink: '#ffffff' },
  { id: 'green',  name: 'Green',  hex: '#2f9e54', ink: '#ffffff' },
  { id: 'yellow', name: 'Yellow', hex: '#e2c231', ink: '#1b1a17' },
  { id: 'purple', name: 'Purple', hex: '#8a4fd0', ink: '#ffffff' },
  { id: 'black',  name: 'Black',  hex: '#2b2b30', ink: '#ffffff' },
  { id: 'pink',   name: 'Pink',   hex: '#e070b4', ink: '#1b1a17' },
  { id: 'orange', name: 'Orange', hex: '#e08a2c', ink: '#1b1a17' },
]

export const colorById = (id) => PLAYER_COLORS.find((c) => c.id === id)

/** Black or white ink, whichever reads better on `hex`. */
export function readableInk(hex) {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.38 ? '#10121a' : '#ffffff'
}
