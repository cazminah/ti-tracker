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
 * A drop-down of objectives. Used for the two stage I objectives at setup, for
 * each reveal in the status phase, and for scoring a secret.
 *
 * `commitOnSelect` drops the button and fires on the change instead, for the
 * secret drop-down: picking from the list is already a deliberate act, and the
 * banner offers an Undo afterwards, so a confirm step earns nothing. Reveals
 * and the opening pair keep their button — those are not undoable.
 */
export function ObjectivePicker({
  options,
  onConfirm,
  placeholder = 'Choose an objective…',
  confirmLabel = 'Confirm',
  commitOnSelect = false,
  autoFocus = false,
}) {
  // Held only until the button is pressed; with commitOnSelect it stays empty
  // so the select falls back to the placeholder once the choice is away.
  const [picked, setPicked] = useState('')

  const commit = () => {
    if (!picked) return
    onConfirm(picked)
    setPicked('')
  }

  const change = (e) => {
    const value = e.target.value
    if (!commitOnSelect) return setPicked(value)
    if (value) onConfirm(value)
  }

  return (
    <div className="objpicker">
      <select
        className="select objpicker__select"
        value={picked}
        autoFocus={autoFocus}
        onChange={change}
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
      {!commitOnSelect && (
        <button
          type="button"
          className="btn btn--primary objpicker__btn"
          disabled={!picked}
          onClick={commit}
        >
          {confirmLabel}
        </button>
      )}
    </div>
  )
}
