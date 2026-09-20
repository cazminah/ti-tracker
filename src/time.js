/** Seconds since `startedAt` (a Date.now() stamp), or 0 if the clock is stopped. */
export const elapsedSince = (startedAt) =>
  startedAt == null ? 0 : Math.max(0, (Date.now() - startedAt) / 1000)

/**
 * `m:ss`, or `h:mm:ss` once a player has burned an hour — which, at this
 * table, is a matter of when rather than if.
 */
export function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(seconds || 0))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}
