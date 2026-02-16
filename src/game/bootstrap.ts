import { CHAIR_LAYOUT, COUNTER_LAYOUT, DECORATIONS, PREP_TABLE_LAYOUT, TRASHBIN_LAYOUT, WALLS } from "./constants";
import type { GameState, ItemDefinition } from "./types";

const asset = (file: string) => `/assets/${file}`;

function createItemDefinitions(): Record<string, ItemDefinition> {
  const defs: ItemDefinition[] = [
    { key: "cup", cost: 1, image: asset("emptyCup.png") },
    { key: "boba", cost: 2, image: asset("boba.png") },
    { key: "jelly", cost: 2, image: asset("jelly.png") },
    { key: "milk", cost: 2, image: asset("milk.png") },
    { key: "grapefruit", cost: 2, image: asset("grapefruit.png") },
    { key: "greentea", cost: 2, image: asset("greentea.png") },
    { key: "lychee", cost: 2, image: asset("lychee.png") },
    { key: "mango", cost: 2, image: asset("mango.png") },
    { key: "sugar", cost: 1, image: asset("sugar.png") },
    { key: "ice", cost: 1, image: asset("ice.png") },
  ];

  return Object.fromEntries(defs.map((item) => [item.key, item]));
}

export function createInitialGameState(): GameState {
  return {
    screen: "menu",
    panel: "none",
    soundOn: true,
    musicOn: false,
    player: {
      x: 100,
      y: 100,
      dx: 0,
      dy: 0,
      speed: 2.2,
      direction: "down",
      wHeld: false,
      aHeld: false,
      sHeld: false,
      dHeld: false,
      heldItem: null,
      money: 1000,
      tips: 0,
      moneyDelta: 0,
      moneyDeltaAt: 0,
    },
    runtime: {
      ms: 0,
      customerChance: 10,
      chanceDivisor: 1,
      popupUntil: 0,
      popupImage: null,
      activeInteractable: null,
    },
    ui: {
      currentBanner: "item",
      restockCounterId: "counter-cup",
      restockAmount: 0,
    },
    upgrades: {
      advertisementLevel: 0,
      energyLevel: 0,
      cutenessLevel: 0,
      meowmaxLevel: 0,
      advertisementCost: 20,
      energyCost: 10,
      cutenessCost: 50,
      meowmaxCost: 100,
      maxLevel: 5,
    },
    items: createItemDefinitions(),
    counters: COUNTER_LAYOUT.map((counter) => ({ ...counter })),
    prepTables: PREP_TABLE_LAYOUT.map((table) => ({ ...table, cup: null })),
    trashbins: TRASHBIN_LAYOUT.map((trash) => ({ ...trash })),
    chairs: CHAIR_LAYOUT.map((chair) => ({ ...chair, customerId: null })),
    decorations: DECORATIONS,
    walls: WALLS,
    customers: [],
  };
}
