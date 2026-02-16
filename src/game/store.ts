import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createInitialGameState } from "./bootstrap";
import type { GameState, Panel, Screen } from "./types";

interface GameActions {
  initialize: (next: GameState) => void;
  setScreen: (screen: Screen) => void;
  setPanel: (panel: Panel) => void;
  patch: (updater: (state: GameState) => GameState) => void;
  resetGame: () => void;
}

type GameStore = GameState & GameActions;

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...createInitialGameState(),
      initialize: (next) => set(() => next),
      setScreen: (screen) => set((state) => ({ ...state, screen })),
      setPanel: (panel) => set((state) => ({ ...state, panel })),
      patch: (updater) => set((state) => updater(state)),
      resetGame: () => set(() => createInitialGameState()),
    }),
    {
      name: "cat-cafe-progress-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        soundOn: state.soundOn,
        musicOn: state.musicOn,
        player: {
          ...state.player,
          dx: 0,
          dy: 0,
          wHeld: false,
          aHeld: false,
          sHeld: false,
          dHeld: false,
          heldItem: null,
          moneyDelta: 0,
          moneyDeltaAt: 0,
        },
        counters: state.counters,
        prepTables: state.prepTables,
        chairs: state.chairs,
        customers: state.customers,
        runtime: {
          ...state.runtime,
          activeInteractable: null,
          popupUntil: 0,
          popupImage: null,
        },
        upgrades: state.upgrades,
      }),
      merge: (persisted, current) => {
        const data = persisted as Partial<GameState>;
        return {
          ...current,
          ...data,
          screen: "menu",
          panel: "none",
          ui: { ...current.ui, currentBanner: "item" },
          runtime: { ...current.runtime, ...(data.runtime ?? {}), activeInteractable: null, popupUntil: 0, popupImage: null },
        };
      },
    },
  ),
);
