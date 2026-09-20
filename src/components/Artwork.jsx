import { useEffect, useState } from 'react'

/**
 * Tries each source in turn and renders `fallback` once they have all failed.
 *
 * The chain is deliberately local-first: anything you drop into
 * public/assets/... wins over the wiki CDN, which is behind a Cloudflare
 * challenge and so usually fails outright. See README.
 */
export function FallbackImage({ sources, fallback, alt, className, style }) {
  const [index, setIndex] = useState(0)

  // A new subject (different faction/card) restarts the chain.
  const key = sources.join('|')
  useEffect(() => setIndex(0), [key])

  if (index >= sources.length) return fallback

  return (
    <img
      src={sources[index]}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      onError={() => setIndex((i) => i + 1)}
    />
  )
}
