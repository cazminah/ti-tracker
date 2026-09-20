import { useEffect, useReducer } from 'react'
import { reducer, loadState, saveState } from './state'
import { ScoreBar } from './components/ScoreBar'
import { SetupScreen } from './screens/SetupScreen'
import { StrategyPhase } from './screens/StrategyPhase'
import { ActionPhase } from './screens/ActionPhase'
import { StatusPhase } from './screens/StatusPhase'
import { AgendaPhase } from './screens/AgendaPhase'
import { GameOverScreen } from './screens/GameOverScreen'
import { EndGamePrompt } from './components/EndGamePrompt'

const SCREENS = {
  setup: SetupScreen,
  strategy: StrategyPhase,
  action: ActionPhase,
  status: StatusPhase,
  agenda: AgendaPhase,
  gameover: GameOverScreen,
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
      {/* The header's score steppers are what ends the game, so it goes away
          once the game has. */}
      {state.screen !== 'gameover' && <ScoreBar state={state} dispatch={dispatch} />}
      <main className="app__main">
        <Screen state={state} dispatch={dispatch} />
      </main>
      {state.endPrompt && <EndGamePrompt state={state} dispatch={dispatch} />}
      {state.toast && (
        <div className="toast" role="status" onClick={() => dispatch({ type: 'CLEAR_TOAST' })}>
          {state.toast}
        </div>
      )}
    </div>
  )
}
