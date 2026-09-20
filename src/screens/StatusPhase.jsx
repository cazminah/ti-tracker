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
  return (
    <section className="screen">
      <h1 className="screen__title">Status Phase — Round {state.round}</h1>

      <ol className="steplist">
        {STEPS.map((step, i) => (
          <li key={step}>
            <span className="steplist__n">({i + 1})</span>
            {step}
          </li>
        ))}
      </ol>

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
