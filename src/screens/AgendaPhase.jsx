import { useState } from 'react'
import { FactionCrest } from '../components/FactionCrest'
import { colorById, readableInk } from '../data/colors'
import { factionById } from '../data/factions'
import { AGENDA_DECK, agendaById, agendaLabel, splitOutcomes } from '../data/agendas'
import { STRATEGY_CARDS, cardById } from '../data/strategyCards'
import { objectiveById } from '../data/objectives'
import {
  AGENDAS_PER_PHASE,
  SEATS,
  activeVoter,
  currentAgenda,
  extraLeft,
  influenceLeft,
  seatOf,
  secretsOf,
  speakerMustChoose,
  voteParts,
  voteTotals,
  votingOrder,
} from '../state'

const shortName = (state, seat) => factionById(seatOf(state, seat).factionId)?.short ?? `P${seat}`
const hexOf = (state, seat) => colorById(seatOf(state, seat).color)?.hex ?? '#3a3a42'

/**
 * What an outcome key reads as. Keys are 'for' / 'against', `p<seat>` for a
 * player, a strategy card id, a law's agenda id, a secret's objective id, or
 * `x:<text>` for something typed in at the table.
 */
function outcomeLabel(state, agenda, key) {
  if (key === 'for') return 'For'
  if (key === 'against') return 'Against'
  if (key.startsWith('x:')) return key.slice(2)
  if (agenda.kind === 'player') return shortName(state, Number(key.slice(1)))
  if (agenda.kind === 'strategy') return cardById(key)?.name ?? key
  if (agenda.kind === 'law') return agendaById(key)?.name ?? key
  if (agenda.kind === 'secret') return objectiveById(key)?.name ?? key
  return key
}

/**
 * The outcomes a card can be voted to, each as { key, label, hex?, sub? }.
 * Laws are read from before this agenda resolved, so abolishing one doesn't
 * make it vanish from its own ballot.
 */
function optionsFor(state, item, agenda) {
  switch (agenda.kind) {
    case 'for-against':
      return [{ key: 'for', label: 'For' }, { key: 'against', label: 'Against' }]
    case 'player':
      return SEATS.map((seat) => ({ key: `p${seat}`, label: shortName(state, seat), hex: hexOf(state, seat), seat }))
    case 'strategy':
      return STRATEGY_CARDS.map((c) => ({ key: c.id, label: c.name, hex: c.hue, sub: `Initiative ${c.initiative}` }))
    case 'law':
      return (item.lawsBefore ?? state.lawsInPlay).map((law) => {
        const a = agendaById(law.agendaId)
        const elected = a.kind === 'for-against' ? null : outcomeLabel(state, a, law.outcome)
        return { key: a.id, label: a.name, sub: elected ? `Elected: ${elected}` : 'Law' }
      })
    case 'secret':
      return SEATS.flatMap((seat) =>
        secretsOf(state, seat).map((o) => ({ key: o.id, label: o.name, hex: hexOf(state, seat), sub: shortName(state, seat) }))
      )
    default: // planet, special: typed in
      return item.options.map((text) => ({ key: `x:${text}`, label: text, removable: true }))
  }
}

/** A number box with its own up / down arrows to its right. */
function Stepper({ value, onChange, min = 0, max = Infinity, label }) {
  const set = (n) => onChange(Math.min(max, Math.max(min, n)))
  return (
    <span className="stepper" onClick={(e) => e.stopPropagation()}>
      <input
        className="stepper__input"
        type="number"
        inputMode="numeric"
        min={min}
        max={Number.isFinite(max) ? max : undefined}
        value={value}
        aria-label={label}
        onChange={(e) => set(parseInt(e.target.value, 10) || 0)}
      />
      <span className="stepper__arrows">
        <button type="button" disabled={value >= max} aria-label="More" onClick={() => set(value + 1)}>▲</button>
        <button type="button" disabled={value <= min} aria-label="Fewer" onClick={() => set(value - 1)}>▼</button>
      </span>
    </span>
  )
}

/**
 * Everyone's influence for the phase, set once up front and then drawn down
 * as they vote. After Confirm each box shows what is left.
 */
function InfluenceRow({ state, dispatch }) {
  const order = votingOrder(state)
  const voter = activeVoter(state)
  const locked = state.influenceLocked
  const cast = state.agendas.some((a) => a.voterIndex > 0 || Object.keys(a.votes).length)

  return (
    <>
      <h2 className="screen__h2">Influence</h2>
      <div className="influence">
        {order.map((seat, i) => {
          const player = seatOf(state, seat)
          return (
            <label
              key={seat}
              className={`vote ${voter === seat ? 'is-now' : ''}`}
              style={{ '--pc': colorById(player.color).hex }}
            >
              <span className="vote__order">{i + 1}</span>
              <FactionCrest factionId={player.factionId} size={26} />
              <span className="vote__name">
                {factionById(player.factionId).short}
                {state.speakerSeat === seat && <span className="vote__speaker" title="Speaker">Speaker</span>}
              </span>
              {locked ? (
                <span className="vote__left" title="Influence left / at the start of the phase">
                  {influenceLeft(state, seat)}
                  <small>/{state.influence[seat] || 0}</small>
                </span>
              ) : (
                <input
                  className="vote__input"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={state.influence[seat] ?? 0}
                  onChange={(e) =>
                    dispatch({ type: 'SET_INFLUENCE', seat, value: parseInt(e.target.value, 10) || 0 })
                  }
                />
              )}
            </label>
          )
        })}
      </div>
      <div className="screen__actions screen__actions--tight">
        {locked ? (
          <button
            type="button"
            className="btn btn--ghost"
            disabled={cast}
            title={cast ? 'Votes have been cast against these numbers.' : undefined}
            onClick={() => dispatch({ type: 'UNLOCK_INFLUENCE' })}
          >
            Edit influence
          </button>
        ) : (
          <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'LOCK_INFLUENCE' })}>
            Confirm
          </button>
        )}
      </div>
    </>
  )
}

/** The card as revealed, shaped like a public objective, with the winner lit. */
function AgendaCard({ state, agenda, outcome }) {
  const split = agenda.kind === 'for-against' ? splitOutcomes(agenda) : null
  const part = (key) =>
    !outcome ? '' : outcome === key ? 'is-won' : 'is-lost'

  return (
    <div className="objcard objcard--flat agendacard">
      <span className="agendacard__kind">
        <span className={`agendacard__type agendacard__type--${agenda.type.toLowerCase()}`}>{agenda.type}</span>
        {agenda.elect}
      </span>
      <span className="objcard__name agendacard__name">{agenda.name}</span>
      {split ? (
        <span className="objcard__desc agendacard__desc">
          {split.lead && <span className="agendacard__lead">{split.lead}</span>}
          <span className={`agendacard__part ${part('for')}`}><b>For:</b> {split.for}</span>
          <span className={`agendacard__part ${part('against')}`}><b>Against:</b> {split.against}</span>
        </span>
      ) : (
        <span className={`objcard__desc agendacard__desc agendacard__part ${outcome ? 'is-won' : ''}`}>
          {agenda.description}
        </span>
      )}
      {outcome && agenda.kind !== 'for-against' && (
        <span className="agendacard__elected">Elected: {outcomeLabel(state, agenda, outcome)}</span>
      )}
    </div>
  )
}

/** "5+2": from influence, then extra votes. Either half is dropped when it's nothing. */
function partsText({ base, extra }) {
  if (!extra) return `${base}`
  return base ? `${base}+${extra}` : `+${extra}`
}

/** Each seat's votes on one option, as a pill in their colour. */
function VotePills({ state, item, index, optionKey }) {
  const seats = votingOrder(state).filter((s) => item.votes[s]?.option === optionKey)
  return (
    <span className="votepills">
      {seats.map((seat) => {
        const hex = hexOf(state, seat)
        return (
          <span
            key={seat}
            className="votepill"
            style={{ background: hex, color: readableInk(hex) }}
            title={factionById(seatOf(state, seat).factionId)?.name}
          >
            <FactionCrest factionId={seatOf(state, seat).factionId} size={18} />
            {partsText(voteParts(state, index, seat))}
          </span>
        )
      })}
    </span>
  )
}

function Options({ state, dispatch, item, index, agenda, live }) {
  const [draft, setDraft] = useState('')
  const options = optionsFor(state, item, agenda)
  const totals = voteTotals(item)
  const voter = live ? activeVoter(state) : null
  const mine = voter != null ? item.votes[voter] : null
  const tie = live ? speakerMustChoose(item) : null
  // An empty tie list means nobody voted: the speaker may pick anything.
  const tieKeys = tie && (tie.length ? tie : options.map((o) => o.key))
  const typed = agenda.kind === 'planet' || agenda.kind === 'special'

  const add = (e) => {
    e.preventDefault()
    dispatch({ type: 'ADD_AGENDA_OPTION', label: draft })
    setDraft('')
  }

  return (
    <div className="agendaopts">
      {options.length === 0 && (
        <p className="agendaopts__empty">
          {agenda.kind === 'law' && 'No laws in play.'}
          {agenda.kind === 'secret' && 'No secret objectives have been scored.'}
          {typed && (agenda.kind === 'special'
            ? 'Add the outcomes the speaker reads out.'
            : 'Add each planet a player wants to vote for.')}
        </p>
      )}

      <div className={`agendaopts__grid agendaopts__grid--${agenda.kind}`}>
        {options.map((o) => {
          const onIt = mine?.option === o.key
          const won = item.outcome === o.key
          const inTie = tieKeys?.includes(o.key)
          const clickable = (voter != null && !item.outcome) || inTie
          const click = () =>
            inTie
              ? dispatch({ type: 'BREAK_TIE', option: o.key })
              : dispatch({ type: 'CAST_VOTE', option: o.key })
          return (
            <div
              key={o.key}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              className={[
                'agendaopt',
                clickable && 'is-live',
                onIt && 'is-mine',
                won && 'is-won',
                item.outcome && !won && 'is-lost',
                inTie && 'is-tied',
              ].filter(Boolean).join(' ')}
              style={o.hex ? { '--oc': o.hex } : undefined}
              onClick={clickable ? click : undefined}
              onKeyDown={clickable ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), click()) : undefined}
            >
              <span className="agendaopt__head">
                {o.seat && <FactionCrest factionId={seatOf(state, o.seat).factionId} size={20} />}
                <span className="agendaopt__label">{o.label}</span>
                {o.removable && live && !item.outcome && !totals[o.key] && (
                  <button
                    type="button"
                    className="agendaopt__remove"
                    title="Remove this option"
                    onClick={(e) => {
                      e.stopPropagation()
                      dispatch({ type: 'REMOVE_AGENDA_OPTION', label: o.label })
                    }}
                  >
                    ×
                  </button>
                )}
              </span>
              {o.sub && <span className="agendaopt__sub">{o.sub}</span>}
              <span className="agendaopt__total">{totals[o.key] || 0}</span>
              <VotePills state={state} item={item} index={index} optionKey={o.key} />
              {onIt && (
                <span className="agendaopt__mine">
                  <Stepper
                    value={mine.count}
                    min={0}
                    max={mine.count + influenceLeft(state, voter) + extraLeft(state, voter)}
                    label="Votes"
                    onChange={(count) => dispatch({ type: 'SET_VOTE_COUNT', count })}
                  />
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Planets can be added right up until the agenda resolves. */}
      {typed && live && !item.outcome && (
        <form className="agendaopts__add" onSubmit={add}>
          <input
            className="select"
            value={draft}
            placeholder={agenda.kind === 'special' ? 'Outcome, e.g. For' : 'Planet name'}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className="btn" disabled={!draft.trim()}>Add</button>
        </form>
      )}
    </div>
  )
}

/**
 * Who is voting, the influence they have left, and their extra votes for this
 * agenda. The name takes whatever room is going, so the extra-votes block is
 * pinned to the right-hand end and never moves as players change.
 */
function VoteBanner({ state, dispatch }) {
  const seat = activeVoter(state)
  const player = seatOf(state, seat)

  return (
    <div className="turnbanner turnbanner--big votebanner" style={{ '--pc': colorById(player.color).hex }}>
      <FactionCrest factionId={player.factionId} size={44} />
      <strong className="turnbanner__faction">{factionById(player.factionId).name}</strong>
      <span className="votebanner__left" title="Influence left to vote with">
        <strong>{influenceLeft(state, seat)}</strong>
        <span>influence</span>
      </span>
      {/* Shows the extras not yet spent, so it counts down as they're cast. */}
      <label className="votebanner__extra">
        <strong className="votebanner__plus">+</strong>
        <Stepper
          value={extraLeft(state, seat)}
          label="Extra votes"
          onChange={(value) => dispatch({ type: 'SET_EXTRA_VOTES', value })}
        />
        <span>extra votes</span>
      </label>
    </div>
  )
}

function AgendaSection({ state, dispatch, item, index }) {
  const live = item === currentAgenda(state)
  const agenda = item.agendaId ? agendaById(item.agendaId) : null
  const started = item.voterIndex > 0 || Object.keys(item.votes).length > 0
  const tie = live ? speakerMustChoose(item) : null
  const total = Object.values(voteTotals(item)).reduce((a, b) => a + b, 0)
  // Played agendas are in the discard. Should the deck ever run dry it is
  // reshuffled, which here means offering everything bar this phase's again.
  const thisPhase = state.agendas.filter((a) => a !== item).map((a) => a.agendaId)
  const discard = [...(state.playedAgendas || []), ...thisPhase]
  let deck = AGENDA_DECK.filter((a) => a.id === item.agendaId || !discard.includes(a.id))
  if (deck.length <= (item.agendaId ? 1 : 0)) {
    deck = AGENDA_DECK.filter((a) => !thisPhase.includes(a.id))
  }
  const voter = live ? activeVoter(state) : null
  const mine = voter != null ? item.votes[voter] : null

  return (
    <section className={`agenda ${item.outcome ? 'is-resolved' : ''}`}>
      <div className="agenda__top">
        <h2 className="screen__h2 agenda__title">Agenda {index + 1}</h2>
        <select
          className="select agenda__select"
          value={item.agendaId ?? ''}
          disabled={!live || started}
          title={started ? 'Voting has started on this agenda.' : undefined}
          onChange={(e) => dispatch({ type: 'PICK_AGENDA', agendaId: e.target.value })}
        >
          <option value="">Select the revealed agenda…</option>
          {deck.map((a) => (
            <option key={a.id} value={a.id}>{agendaLabel(a)}</option>
          ))}
        </select>
      </div>

      {agenda && (
        <>
          {voter != null && <VoteBanner state={state} dispatch={dispatch} />}

          {tie && (
            <div className="turnbanner turnbanner--big votebanner" style={{ '--pc': hexOf(state, state.speakerSeat) }}>
              <FactionCrest factionId={seatOf(state, state.speakerSeat).factionId} size={44} />
              <strong className="turnbanner__faction">{factionById(seatOf(state, state.speakerSeat).factionId).name}</strong>
              <span className="votebanner__note">
                {tie.length
                  ? 'The vote is tied. As speaker, choose the outcome from the tied options.'
                  : 'Nobody voted. As speaker, choose the outcome.'}
              </span>
              <span className="votebanner__actions">
                <button type="button" className="btn btn--ghost" onClick={() => dispatch({ type: 'PREVIOUS_VOTER' })}>
                  ← Back
                </button>
              </span>
            </div>
          )}

          <div className="agenda__body">
            <AgendaCard state={state} agenda={agenda} outcome={item.outcome} />
            <Options state={state} dispatch={dispatch} item={item} index={index} agenda={agenda} live={live} />
          </div>

          <div className="agenda__foot">
            {live && (voter != null || item.outcome) && (
              <button
                type="button"
                className="btn btn--ghost"
                disabled={item.voterIndex === 0}
                onClick={() => dispatch({ type: 'PREVIOUS_VOTER' })}
              >
                ← Back
              </button>
            )}
            <p className="hint agenda__total">Votes cast: {total}</p>
            {voter != null && (
              <button type="button" className="btn btn--cast" onClick={() => dispatch({ type: 'NEXT_VOTER' })}>
                {mine ? `Cast ${mine.count} vote${mine.count === 1 ? '' : 's'}` : 'Abstain'}
              </button>
            )}
          </div>
        </>
      )}
    </section>
  )
}

export function AgendaPhase({ state, dispatch }) {
  const last = currentAgenda(state)
  const done = !!last?.outcome

  return (
    <section className="screen">
      <h1 className="screen__title">Agenda Phase — Round {state.round}</h1>

      <ol className="steplist steplist--agenda">
        <li>
          <span className="steplist__n">1.</span>
          Reveal Agenda (From Agenda deck)
          <ol className="steplist__sub">
            <li>a. Cards/Abilities that specify “When an agenda is revealed” may be played</li>
            <li>b. Cards/Abilities that specify “After an agenda is revealed” may be played</li>
          </ol>
        </li>
        <li>
          <span className="steplist__n">2.</span>
          Vote (In clockwise order starting with the person to the left of the speaker)
        </li>
        <li>
          <span className="steplist__n">3.</span>
          Resolve Outcome
        </li>
      </ol>

      <InfluenceRow state={state} dispatch={dispatch} />

      {state.agendas.map((item, i) => (
        <AgendaSection key={i} state={state} dispatch={dispatch} item={item} index={i} />
      ))}

      {done && (
        <div className="screen__actions">
          {state.agendas.length < AGENDAS_PER_PHASE ? (
            <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'REVEAL_NEXT_AGENDA' })}>
              Reveal next agenda
            </button>
          ) : (
            <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'NEW_ROUND' })}>
              NEW ROUND →
            </button>
          )}
        </div>
      )}
    </section>
  )
}
