import { useEffect } from "react";
import { computePlayerVelocity, interactWithActive } from "../game/engine";
import { useGameStore } from "../game/store";

export function useKeyboard() {
  const patch = useGameStore((state) => state.patch);
  const screen = useGameStore((state) => state.screen);
  const panel = useGameStore((state) => state.panel);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (screen !== "game" || panel === "upgrades") return;
      if (event.repeat) return;
      patch((state) => {
        let next = state;
        if (event.key === "w" || event.key === "W") {
          next = { ...next, player: { ...next.player, wHeld: true } };
        } else if (event.key === "a" || event.key === "A") {
          next = { ...next, player: { ...next.player, aHeld: true } };
        } else if (event.key === "s" || event.key === "S") {
          next = { ...next, player: { ...next.player, sHeld: true } };
        } else if (event.key === "d" || event.key === "D") {
          next = { ...next, player: { ...next.player, dHeld: true } };
        } else if (event.key === "e" || event.key === "E") {
          next = interactWithActive(next);
        }
        return computePlayerVelocity(next);
      });
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (screen !== "game" || panel === "upgrades") return;
      patch((state) => {
        let next = state;
        if (event.key === "w" || event.key === "W") {
          next = { ...next, player: { ...next.player, wHeld: false } };
        } else if (event.key === "a" || event.key === "A") {
          next = { ...next, player: { ...next.player, aHeld: false } };
        } else if (event.key === "s" || event.key === "S") {
          next = { ...next, player: { ...next.player, sHeld: false } };
        } else if (event.key === "d" || event.key === "D") {
          next = { ...next, player: { ...next.player, dHeld: false } };
        }
        return computePlayerVelocity(next);
      });
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [panel, patch, screen]);
}
