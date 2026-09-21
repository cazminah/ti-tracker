import { useState } from 'react'
import { FactionCrest } from '../components/FactionCrest'
import { HoverTip } from '../components/HoverTip'
import { Modal } from '../components/Modal'
import { ObjectiveCardBack } from '../components/ObjectiveCardBack'
import { ObjectivePicker } from '../components/ObjectivePicker'
import { colorById } from '../data/colors'
import { factionById } from '../data/factions'
import { objectiveById, objectiveLabel, pointsFor } from '../data/objectives'
import {
  PUBLIC_SLOTS,
  availableSecrets,
  nextRevealStage,
  revealedOfStage,
  revealedThisRound,
  scoringSeat,
  scorersOf,
  seatOf,
  unrevealedOfStage,
} from '../state'

const STEPS = [
  'Score Objectives',
  'Reveal Public Objective',
  'Draw Action Cards',
  'Remove Command Tokens',
  'Gain and Redistribute Command Tokens',
  'Ready Cards',
  'Repair Units',
  'Return Strategy Cards',
]

/** One of the six player boxes: who they are, and the secrets they hold. */
function PlayerBox({ state, seat, active }) {
  const player = seatOf(state, seat)
  const color = colorById(player.color)
  const faction = factionById(player.factionId)
  const secrets = (state.secretScores[seat] || []).map(objectiveById).filter(Boolean)

  return (
    <div
      className={`objplayer ${active ? 'is-active' : ''}`}
      style={{ '--pc': color?.hex ?? '#3a3a42' }}
    >
      <div className="objplayer__head">
        <FactionCrest factionId={player.factionId} size={26} />
        <span className="objplayer__name">{faction?.short ?? `P${seat}`}</span>
        <span className="objplayer__vp">{state.scores[seat] ?? 0}</span>
      </div>
      <div className="objplayer__secrets">
        {secrets.map((o) => (
          <HoverTip key={o.id} className="objplayer__secret" tip={objectiveLabel(o)}>
            {o.name}
          </HoverTip>
        ))}
      </div>
    </div>
  )
}

/** One revealed public objective: what it is, and who has taken it. */
function ObjectiveBox({ state, objective, seat, onScore }) {
  const scorers = scorersOf(state, objective.id)
  const mine = seat != null && scorers.includes(seat)
  const tookThisPhase = state.statusPublicScored[seat] === objective.id
  // Settled last round, or this player already took a different one: look, don't touch.
  const locked =
    seat == null || (mine && !tookThisPhase) || (!mine && !!state.statusPublicScored[seat])

  return (
    <button
      type="button"
      className={`objcard ${tookThisPhase ? 'is-mine' : ''}`}
      disabled={locked}
      title={
        seat == null
          ? 'Scoring is finished for this round.'
          : tookThisPhase
            ? 'Click to take this back off.'
            : locked
              ? mine
                ? 'Already scored in an earlier round.'
                : 'This player has already scored a public objective this phase.'
              : 'Score this for the active player.'
      }
      onClick={() => onScore(objective.id)}
    >
      <span className="objcard__name">{objective.name}</span>
      <span className="objcard__desc">{objective.description}</span>
      <span className="objcard__foot">
        <span className="objcard__scorers">
          {scorers.map((s) => {
            const p = seatOf(state, s)
            return (
              <span
                key={s}
                className="objcard__scorer"
                style={{ '--pc': colorById(p.color)?.hex ?? '#3a3a42' }}
                title={factionById(p.factionId)?.name ?? `Player ${s}`}
              >
                <FactionCrest factionId={p.factionId} size={24} />
              </span>
            )
          })}
        </span>
        <span className="objcard__worth">{pointsFor(objective)} VP</span>
      </span>
    </button>
  )
}

/**
 * One row of public objectives of a single stage: the cards turned over so
 * far, then face-down backs for the slots still to come. The backs are inert —
 * revealing happens once a round, from the banner, after everybody has scored.
 */
function ObjectiveRow({ state, stage, seat, onScore }) {
  const revealed = revealedOfStage(state, stage)
  const facedown = Math.max(0, PUBLIC_SLOTS - revealed.length)

  return (
    <>
      <h3 className="objrow__head">Stage {stage}</h3>
      <div className="objrow">
        {revealed.map((o) => (
          <ObjectiveBox key={o.id} state={state} objective={o} seat={seat} onScore={onScore} />
        ))}
        {Array.from({ length: facedown }).map((_, i) => (
          <div key={`back-${i}`} className="objcard objcard--back" aria-hidden="true">
            <ObjectiveCardBack stage={stage} />
          </div>
        ))}
      </div>
    </>
  )
}

export function StatusPhase({ state, dispatch }) {
  const [revealing, setRevealing] = useState(false)

  const seat = scoringSeat(state)
  const player = seat ? seatOf(state, seat) : null
  const color = player ? colorById(player.color) : null
  const secretTaken = seat ? state.statusSecretScored[seat] : null
  const secretCard = secretTaken ? objectiveById(secretTaken) : null

  const stage = nextRevealStage(state)
  const done = revealedThisRound(state)
  const deckEmpty = unrevealedOfStage(state, stage).length === 0

  const score = (objectiveId) => dispatch({ type: 'SCORE_PUBLIC', objectiveId })

  return (
    <section className="screen screen--wide">
      <h1 className="screen__title">Status Phase — Round {state.round}</h1>

      <ol className="steplist">
        {STEPS.map((step, i) => (
          <li key={step}>
            <span className="steplist__n">({i + 1})</span>
            {step}
          </li>
        ))}
      </ol>

      <h2 className="screen__h2">Objectives</h2>
      <p className="screen__sub">
        Scoring runs in initiative order. Each player may score one public and one
        secret objective; the next public objective is revealed once they have all
        been through.
      </p>

      <div className="objplayers">
        {state.initiativeSeats.map((s) => (
          <PlayerBox key={s} state={state} seat={s} active={s === seat} />
        ))}
      </div>

      {seat ? (
        <div className="turnbanner objbanner" style={{ '--pc': color.hex }}>
          <FactionCrest factionId={player.factionId} size={38} />
          <strong className="objbanner__faction">
            {factionById(player.factionId).name}
          </strong>

          <div className="objbanner__secret">
            {secretCard ? (
              <>
                <span className="objbanner__scored">
                  Secret scored:{' '}
                  <HoverTip className="objplayer__secret" tip={objectiveLabel(secretCard)}>
                    {secretCard.name}
                  </HoverTip>
                </span>
                <button
                  type="button"
                  className="btn btn--ghost objbanner__undo"
                  onClick={() => dispatch({ type: 'UNSCORE_SECRET' })}
                >
                  Undo
                </button>
              </>
            ) : (
              <ObjectivePicker
                options={availableSecrets(state)}
                placeholder="Score a secret objective…"
                commitOnSelect
                onConfirm={(objectiveId) => dispatch({ type: 'SCORE_SECRET', objectiveId })}
              />
            )}
          </div>

          <div className="objbanner__nav">
            <button
              type="button"
              className="btn btn--ghost"
              disabled={state.statusSeatIndex === 0}
              onClick={() => dispatch({ type: 'STATUS_SEAT', delta: -1 })}
            >
              ← Back
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => dispatch({ type: 'STATUS_SEAT', delta: 1 })}
            >
              Next player →
            </button>
          </div>
        </div>
      ) : (
        <div className="turnbanner objbanner objbanner--done">
          <span className="objbanner__faction">All players have scored.</span>
          <button
            type="button"
            className="btn btn--primary objbanner__reveal"
            disabled={done || deckEmpty}
            title={
              done
                ? 'One public objective a round — this round has had its reveal.'
                : deckEmpty
                  ? `No stage ${stage} objectives left in the deck.`
                  : undefined
            }
            onClick={() => setRevealing(true)}
          >
            {done ? `Stage ${stage} revealed` : `Reveal next objective (Stage ${stage})`}
          </button>
          {/*
            * Going back is only offered until the card is turned over. Once it
            * is, stepping back into the order would let a player score an
            * objective that was face down when their turn came round, which the
            * rules do not allow — and the way out is the agenda phase anyway.
            */}
          {!done && (
            <button
              type="button"
              className="btn btn--ghost objbanner__undo"
              onClick={() => dispatch({ type: 'STATUS_SEAT', delta: -1 })}
            >
              ← Back
            </button>
          )}
        </div>
      )}

      <ObjectiveRow state={state} stage="I" seat={seat} onScore={score} />
      <ObjectiveRow state={state} stage="II" seat={seat} onScore={score} />

      {revealing && (
        <Modal title="Reveal Public Objective" onClose={() => setRevealing(false)}>
          <p className="modal__body">
            Step (2): the speaker reveals the next stage {stage} objective. Pick the
            card that came off the deck.
          </p>
          <ObjectivePicker
            options={unrevealedOfStage(state, stage)}
            placeholder={`Choose the revealed stage ${stage} objective…`}
            confirmLabel="Reveal"
            autoFocus
            onConfirm={(objectiveId) => {
              dispatch({ type: 'REVEAL_OBJECTIVE', objectiveId })
              setRevealing(false)
            }}
          />
        </Modal>
      )}

      <div className="screen__actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => dispatch({ type: 'GOTO', screen: 'agenda' })}
        >
          Agenda Phase →
        </button>
      </div>
    </section>
  )
}
