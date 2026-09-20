import { useEffect, useReducer } from 'react'
import { reducer, loadState, saveState } from './state'
import { ScoreBar } from './components/ScoreBar'
import { SetupScreen } from './screens/SetupScreen'
import { StrategyPhase } from './screens/StrategyPhase'
import { ActionPhase } from './screens/ActionPhase'
import { StatusPhase } from './screens/StatusPhase'
import { AgendaPhase } from './screens/AgendaPhase'

const SCREENS = {
  setup: SetupScreen,
  strategy: StrategyPhase,
  action: ActionPhase,
  status: StatusPhase,
  agenda: AgendaPhase,
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => saveState(state), [state])

  useEffect(() => {
    if (!state.toast) return
    const t = setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 2200)
    return () => clearTimeout(t)
  }, [state.toast])

  const Screen = SCREENS[state.screen] ?? SetupScreen

  return (
    <div className="app">
      <ScoreBar state={state} dispatch={dispatch} />
      <main className="app__main">
        <Screen state={state} dispatch={dispatch} />
      </main>
      {state.toast && (
        <div className="toast" role="status" onClick={() => dispatch({ type: 'CLEAR_TOAST' })}>
          {state.toast}
        </div>
      )}
    </div>
  )
}
