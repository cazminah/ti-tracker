import { useState } from 'react'
import { FactionCrest } from '../components/FactionCrest'
import { HoverTip } from '../components/HoverTip'
import { ObjectiveRow } from '../components/ObjectiveRow'
import { PlayerBox } from '../components/PlayerBox'
import { Modal } from '../components/Modal'
import { ObjectivePicker } from '../components/ObjectivePicker'
import { colorById } from '../data/colors'
import { factionById } from '../data/factions'
import { objectiveById, objectiveLabel } from '../data/objectives'
import {
  availableSecrets,
  nextRevealStage,
  revealedThisRound,
  scoringSeat,
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
                  <HoverTip className="pill pill--secret pill--tip" tip={objectiveLabel(secretCard)}>
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
        {/* No agenda phase until somebody has taken the custodians token. */}
        {state.custodiansSeat != null ? (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => dispatch({ type: 'GOTO', screen: 'agenda' })}
          >
            Agenda Phase →
          </button>
        ) : (
          <button
            type="button"
            className="btn btn--primary"
            title="The agenda phase starts once the custodians token has been taken."
            onClick={() => dispatch({ type: 'NEW_ROUND' })}
          >
            NEW ROUND →
          </button>
        )}
      </div>
    </section>
  )
}
