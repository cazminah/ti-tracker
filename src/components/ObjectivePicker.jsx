import { useState } from 'react'
import { objectiveLabel } from '../data/objectives'

/**
 * Runs of options sharing a `type`, in the order they were given. The list is
 * already in the reference sheet's order (see data/objectives.js), so this
 * only draws the group headings — it never re-sorts.
 */
function grouped(options) {
  const runs = []
  for (const o of options) {
    const last = runs[runs.length - 1]
    if (last && last.type === o.type) last.items.push(o)
    else runs.push({ type: o.type, items: [o] })
  }
  return runs
}

/**
 * A drop-down of objectives plus the button that commits the choice. Used for
 * the two stage I objectives at setup, for each reveal in the status phase,
 * and for scoring a secret.
 */
export function ObjectivePicker({
  options,
  onConfirm,
  placeholder = 'Choose an objective…',
  confirmLabel = 'Confirm',
  autoFocus = false,
}) {
  const [picked, setPicked] = useState('')

  const commit = () => {
    if (!picked) return
    onConfirm(picked)
    setPicked('')
  }

  return (
    <div className="objpicker">
      <select
        className="select objpicker__select"
        value={picked}
        autoFocus={autoFocus}
        onChange={(e) => setPicked(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {grouped(options).map((run, i) =>
          run.type ? (
            <optgroup key={`${run.type}-${i}`} label={run.type}>
              {run.items.map((o) => (
                <option key={o.id} value={o.id}>
                  {objectiveLabel(o)}
                </option>
              ))}
            </optgroup>
          ) : (
            run.items.map((o) => (
              <option key={o.id} value={o.id}>
                {objectiveLabel(o)}
              </option>
            ))
          )
        )}
      </select>
      <button
        type="button"
        className="btn btn--primary objpicker__btn"
        disabled={!picked}
        onClick={commit}
      >
        {confirmLabel}
      </button>
    </div>
  )
}
