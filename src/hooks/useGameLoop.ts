import { useEffect } from "react";
import { maybeSpawnCustomer, moveCustomers, tickMovement, validateTransientUi } from "../game/engine";
import { useGameStore } from "../game/store";

export function useGameLoop() {
  const patch = useGameStore((state) => state.patch);
  const screen = useGameStore((state) => state.screen);

  useEffect(() => {
    if (screen !== "game") return;

    const movementTimer = window.setInterval(() => {
      patch((state) => validateTransientUi(tickMovement(state)));
    }, 16);

    const spawnTimer = window.setInterval(() => {
      patch((state) => maybeSpawnCustomer(state));
    }, 1350);

    const customerTimer = window.setInterval(() => {
      patch((state) => moveCustomers(state));
    }, 10);

    return () => {
      window.clearInterval(movementTimer);
      window.clearInterval(spawnTimer);
      window.clearInterval(customerTimer);
    };
  }, [patch, screen]);
}
