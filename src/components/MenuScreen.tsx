import { useGameStore } from "../game/store";
import { playClick, startBackgroundMusic } from "../audio/sounds";

export function MenuScreen() {
  const setScreen = useGameStore((state) => state.setScreen);
  const resetGame = useGameStore((state) => state.resetGame);
  const soundOn = useGameStore((state) => state.soundOn);
  const musicOn = useGameStore((state) => state.musicOn);

  return (
    <section className="screen menu-screen" style={{ backgroundImage: "url('/assets/menuBackground.png')" }}>
      <div className="menu-actions">
        <button
          className="image-button"
          onMouseEnter={() => playClick(soundOn)}
          onClick={() => {
            startBackgroundMusic(soundOn && musicOn);
            setScreen("game");
          }}
        >
          <img src="/assets/playImg.png" alt="Play" />
        </button>
        <button className="image-button" onMouseEnter={() => playClick(soundOn)} onClick={() => setScreen("instructions")}>
          <img src="/assets/instructionsImg.png" alt="Instructions" />
        </button>
        <button
          className="menu-reset-button"
          onMouseEnter={() => playClick(soundOn)}
          onClick={() => {
            if (window.confirm("Reset all progress and start a new game?")) {
              resetGame();
            }
          }}
        >
          Reset Game
        </button>
      </div>
    </section>
  );
}
