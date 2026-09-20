import { STRATEGY_CARDS } from '../data/strategyCards'
import { StrategyCard } from '../components/StrategyCard'
import { FactionCrest } from '../components/FactionCrest'
import { colorById, readableInk } from '../data/colors'
import { factionById } from '../data/factions'
import { currentDrafter, seatOrderFrom, seatOf, cardForSeat } from '../state'

export function StrategyPhase({ state, dispatch }) {
  const drafter = currentDrafter(state)
  const order = seatOrderFrom(state.speakerSeat)
  const done = drafter == null

  return (
    <section className="screen">
      <h1 className="screen__title">Strategy Phase — Round {state.round}</h1>
      <p className="screen__sub">
        Drafting clockwise from the speaker
        {state.speakerSeat !== 1 && <> (Seat {state.speakerSeat})</>}.
      </p>

      <ol className="draftline">
        {order.map((seat, i) => {
          const player = seatOf(state, seat)
          const color = colorById(player.color)
          const card = cardForSeat(state.picks, seat)
          const isNow = seat === drafter
          return (
            <li
              key={seat}
              className={`draftline__item ${isNow ? 'is-now' : ''} ${card ? 'is-done' : ''}`}
              style={{ '--pc': color.hex }}
            >
              <span className="draftline__pos">{i + 1}</span>
              <FactionCrest factionId={player.factionId} size={24} />
              <span className="draftline__name">{factionById(player.factionId).short}</span>
              {card ? (
                <span
                  className="cardpill draftline__card"
                  style={{ background: card.hue, color: readableInk(card.hue) }}
                >
                  {card.initiative} {card.name}
                </span>
              ) : (
                <span className="draftline__pick">{isNow ? 'picking…' : '—'}</span>
              )}
              {state.tgGained[seat] > 0 && (
                <span className="draftline__tg">+{state.tgGained[seat]} TG</span>
              )}
            </li>
          )
        })}
      </ol>

      {!done && (
        <p className="turnbanner" style={{ '--pc': colorById(seatOf(state, drafter).color).hex }}>
          <FactionCrest factionId={seatOf(state, drafter).factionId} size={30} />
          <strong>{factionById(seatOf(state, drafter).factionId).name}</strong>
          <span>(Seat {drafter}) — choose a strategy card</span>
        </p>
      )}

      <div className="cardgrid">
        {STRATEGY_CARDS.map((card) => {
          const ownerSeat = state.picks[card.id]
          const owner = ownerSeat ? seatOf(state, ownerSeat) : null
          return (
            <StrategyCard
              key={card.id}
              card={card}
              owner={owner}
              tradeGoods={state.cardTG[card.id] || 0}
              state={owner ? 'taken' : 'available'}
              disabled={!!owner || done}
              onClick={owner || done ? undefined : () => dispatch({ type: 'PICK_CARD', cardId: card.id })}
            />
          )
        })}
      </div>

      <div className="screen__actions">
        <button
          type="button"
          className="btn btn--ghost"
          disabled={!Object.keys(state.picks).length}
          onClick={() => dispatch({ type: 'UNDO_PICK' })}
        >
          Undo last pick
        </button>
        <button
          type="button"
          className="btn btn--primary"
          disabled={!done}
          onClick={() => dispatch({ type: 'START_ACTION' })}
        >
          Action Phase →
        </button>
      </div>
      {!done && <p className="hint">All six players must pick before the action phase.</p>}
    </section>
  )
}
