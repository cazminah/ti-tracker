import { useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Wraps its children in an inline element that pops `tip` up at the cursor.
 *
 * The bubble is portalled to <body> and positioned with fixed coordinates
 * because the things it hangs off — a one-line secret objective inside a
 * player box — sit in boxes that clip and scroll.
 */
export function HoverTip({ tip, className = '', children }) {
  const [at, setAt] = useState(null)

  const track = (e) => setAt({ x: e.clientX, y: e.clientY })

  return (
    <>
      <span
        className={className}
        onMouseEnter={track}
        onMouseMove={track}
        onMouseLeave={() => setAt(null)}
        // Keyboard users get the same text without the cursor to hang it on.
        title={typeof tip === 'string' ? tip : undefined}
      >
        {children}
      </span>
      {at &&
        createPortal(
          <div
            className="hovertip"
            role="tooltip"
            // Nudged clear of the pointer, and clamped so a bubble opened near
            // the right edge doesn't run off the window.
            style={{
              left: Math.min(at.x + 14, window.innerWidth - 340),
              top: at.y + 16,
            }}
          >
            {tip}
          </div>,
          document.body
        )}
    </>
  )
}
