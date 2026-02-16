import { useEffect } from "react";
import { useGameStore } from "./game/store";
import { GameCanvas } from "./components/GameCanvas";
import { MenuScreen } from "./components/MenuScreen";
import { InstructionsScreen } from "./components/InstructionsScreen";
import { GameHud } from "./components/GameHud";
import { useKeyboard } from "./hooks/useKeyboard";
import { useGameLoop } from "./hooks/useGameLoop";
import { stopBackgroundMusic } from "./audio/sounds";
import { ErrorBoundary } from "./components/ErrorBoundary";

function App() {
  const screen = useGameStore((state) => state.screen);

  useKeyboard();
  useGameLoop();

  useEffect(() => {
    if (screen !== "game") {
      stopBackgroundMusic();
    }
  }, [screen]);

  return (
    <ErrorBoundary>
      <main className="app">
        {screen === "menu" && <MenuScreen />}
        {screen === "instructions" && <InstructionsScreen />}
        {screen === "game" && (
          <>
            <GameCanvas />
            <GameHud />
          </>
        )}
      </main>
    </ErrorBoundary>
  );
}

export default App;
