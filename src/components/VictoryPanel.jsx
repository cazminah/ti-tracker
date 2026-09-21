import { useState } from 'react'
import { FactionCrest } from './FactionCrest'
import { HoverTip } from './HoverTip'
import { ObjectivePicker } from './ObjectivePicker'
import { PlayerBox } from './PlayerBox'
import { MecatolRex, ShardOfTheThrone } from './VictoryTokens'
import { colorById } from '../data/colors'
import { factionById } from '../data/factions'
import { objectiveLabel } from '../data/objectives'
import {
  availableActionSecrets,
  availableAgendaSecrets,
  custodiansOpen,
  secretsOf,
  seatOf,
  unspentSupports,
  votingOrder,
} from '../state'

/**
 * Everything that can hand out a victory point mid-action-phase, folded away
 * behind a disclosure because most turns need none of it.
 *
 * Two different players are in play here, deliberately. The custodians token
 * and the Shard are things the *active* player does on their own turn. Secrets
 * and Support for the Throne can change hands on anybody's turn, so those run
 * off a seat you pick out of the row — which starts on the active player and
 * goes back to them when the turn moves on.
 *
 * With `phase="agenda"` it is the agenda phase's version: no tokens, nobody's
 * turn to default to (the banner waits for a player to be picked), and the
 * agenda-phase secrets in place of the action-phase ones.
 */
export function VictoryPanel({ state, dispatch, activeSeat, phase = 'action' }) {
  const agenda = phase === 'agenda'
  const [open, setOpen] = useState(false)
  // Tied to the turn it was made on, so a stale pick can't outlive its turn.
  const [pick, setPick] = useState({ seq: -1, seat: null })

  const selected = agenda
    ? pick.seat
    : pick.seq === state.turnSeq && pick.seat != null ? pick.seat : activeSeat
  const choose = (seat) => setPick({ seq: state.turnSeq, seat })
  const seats = agenda ? votingOrder(state) : state.initiativeSeats

  const player = selected != null ? seatOf(state, selected) : null
  const color = player ? colorById(player.color) : null
  const secrets = selected != null ? secretsOf(state, selected) : []
  const givers = unspentSupports(state).filter((g) => g !== selected)

  return (
    <section className={`vp ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="vp__toggle"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="vp__chevron" aria-hidden="true">›</span>
        Score Victory Points
        <span className="vp__toggle-hint">
          {agenda
            ? 'Agenda phase secrets and Support for the Throne'
            : 'Custodians, the Shard, action secrets and Support for the Throne'}
        </span>
      </button>

      {open && (
        <div className="vp__body">
          {!agenda && <div className="vp__tokens">
            <MecatolRex
              state={state}
              locked={!custodiansOpen(state)}
              onClick={() => dispatch({ type: 'TAKE_CUSTODIANS' })}
            />
            <ShardOfTheThrone state={state} onClick={() => dispatch({ type: 'TAKE_SHARD' })} />
            <p className="vp__tokenhint">
              Both go to whoever's turn it is. The custodians token settles for good
              once this turn ends; the Shard can be taken off its holder at any time,
              and the point goes with it.
            </p>
          </div>}

          <div className="objplayers">
            {seats.map((s) => (
              <PlayerBox
                key={s}
                state={state}
                seat={s}
                active={s === selected}
                onSelect={choose}
                onRevokeSupport={(giver) => dispatch({ type: 'REVOKE_SUPPORT', giver })}
              />
            ))}
          </div>

          {agenda && selected == null && (
            <p className="vp__tokenhint">Click a player to score for them.</p>
          )}

          {player && <div className="turnbanner objbanner vp__banner" style={{ '--pc': color.hex }}>
            <FactionCrest factionId={player.factionId} size={38} />
            <strong className="objbanner__faction">
              {factionById(player.factionId).name}
              {!agenda && selected !== activeSeat && <span className="vp__offturn">off turn</span>}
            </strong>

            <div className="objbanner__secret">
              <ObjectivePicker
                options={agenda ? availableAgendaSecrets(state) : availableActionSecrets(state)}
                placeholder={agenda ? 'Score an agenda phase secret…' : 'Score an action phase secret…'}
                commitOnSelect
                onConfirm={(objectiveId) =>
                  dispatch({ type: 'SCORE_ACTION_SECRET', seat: selected, objectiveId })
                }
              />
            </div>

            <div className="objbanner__secret">
              {/* A plain select: the options are players, not objectives. */}
              <select
                className="select"
                value=""
                onChange={(e) => {
                  const giver = Number(e.target.value)
                  if (giver) dispatch({ type: 'GIVE_SUPPORT', giver, holder: selected })
                }}
              >
                <option value="">Gain Support for the Throne from…</option>
                {seats.map((s) => {
                  const f = factionById(seatOf(state, s).factionId)
                  const mine = s === selected
                  return (
                    <option key={s} value={s} disabled={!givers.includes(s)}>
                      {f?.short ?? `Player ${s}`}
                      {mine ? ' — their own note' : givers.includes(s) ? '' : ' — already given'}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>}

          {secrets.length > 0 && (
            <div className="vp__scored">
              <span className="vp__scoredlabel">Secrets held</span>
              {secrets.map((o) => (
                <HoverTip key={o.id} className="pill pill--secret pill--tip vp__chip" tip={objectiveLabel(o)}>
                  {o.name}
                  <button
                    type="button"
                    className="vp__chipx"
                    aria-label={`Undo ${o.name}`}
                    title="Undo"
                    onClick={() =>
                      dispatch({
                        type: 'UNSCORE_ACTION_SECRET',
                        seat: selected,
                        objectiveId: o.id,
                      })
                    }
                  >
                    ×
                  </button>
                </HoverTip>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
