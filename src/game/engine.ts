import { GAME_HEIGHT, GAME_WIDTH, ITEM_KEYS, PLAYER_SIZE } from "./constants";
import type { CupItem, CustomerState, Direction, GameState, Panel, Rect } from "./types";
import { playMeowAngry, playMeowHappy, startBackgroundMusic, stopBackgroundMusic } from "../audio/sounds";

const FRAME_TIME_MS = 16;
const POPUP_DURATION_MS = 1000;
const DIAGONAL_NORMALIZER = Math.sqrt(2);
const SLIDE_FACTOR = 0.1;
const CUSTOMER_SIZE = 40;
const INSUFFICIENT_MESSAGE_IMAGE = "/assets/insufficientMessage.png";

const rand = (max: number) => Math.floor(Math.random() * max);
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

const intersects = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const playerHitRect = (state: GameState): Rect => ({ x: Math.round(state.player.x) + 2, y: Math.round(state.player.y) + 2, w: 44, h: 44 });
const playerRectAt = (x: number, y: number): Rect => ({ x: Math.round(x) + 5, y: Math.round(y) + 5, w: 30, h: 30 });

const withCupImage = (cup: CupItem): CupItem => ({
  ...cup,
  image: cup.ingredients.length > 0 ? "/assets/filledCup.png" : "/assets/emptyCup.png",
});

const withActiveInteractable = (
  state: GameState,
  activeInteractable: GameState["runtime"]["activeInteractable"],
): GameState => ({
  ...state,
  runtime: {
    ...state.runtime,
    activeInteractable,
  },
});

const withCounterStockDecremented = (state: GameState, counterId: string): GameState["counters"] =>
  state.counters.map((counter) => (counter.id === counterId ? { ...counter, stock: counter.stock - 1 } : counter));

const directionFromDelta = (dx: number, dy: number, fallback: Direction): Direction => {
  if (dx > 0) return "right";
  if (dx < 0) return "left";
  if (dy > 0) return "down";
  if (dy < 0) return "up";
  return fallback;
};

export function randomOrder(): string[] {
  const liquid = ITEM_KEYS.liquids[rand(ITEM_KEYS.liquids.length)];
  const topping = ITEM_KEYS.toppings[rand(ITEM_KEYS.toppings.length)];
  const order: string[] = [liquid, topping];
  if (rand(2) === 0) order.push("sugar");
  if (rand(2) === 0) order.push("ice");
  return order;
}

function createCup(): CupItem {
  return { kind: "cup", image: "/assets/emptyCup.png", ingredients: [] };
}

function solidRects(state: GameState): Rect[] {
  return [
    ...state.walls,
    ...state.decorations.map((value) => value.rect),
    ...state.counters.map((value) => value.rect),
    ...state.prepTables.map((value) => value.rect),
    ...state.trashbins.map((value) => value.rect),
    ...state.chairs.map((value) => value.collisionRect),
  ];
}

function updateActiveInteractable(state: GameState): GameState {
  const hit = playerHitRect(state);

  const counter = state.counters.find((value) => intersects(hit, value.hitBox));
  if (counter) {
    return withActiveInteractable(state, {
      kind: "counter",
      id: counter.id,
      popupDirection: counter.popupDirection,
      rect: counter.rect,
    });
  }

  const prep = state.prepTables.find((value) => intersects(hit, value.hitBox));
  if (prep) {
    return withActiveInteractable(state, {
      kind: "prepTable",
      id: prep.id,
      popupDirection: prep.popupDirection,
      rect: prep.rect,
    });
  }

  const trash = state.trashbins.find((value) => intersects(hit, value.hitBox));
  if (trash) {
    return withActiveInteractable(state, {
      kind: "trashbin",
      id: trash.id,
      popupDirection: trash.popupDirection,
      rect: trash.rect,
    });
  }

  const chair = state.chairs.find(
    (value) =>
      intersects(hit, value.hitBox) &&
      state.customers.some((customer) => customer.id === value.customerId && customer.seated),
  );
  if (chair) {
    return withActiveInteractable(state, {
      kind: "chair",
      id: chair.id,
      popupDirection: chair.popupDirection,
      rect: chair.rect,
    });
  }

  return withActiveInteractable(state, null);
}

export function computePlayerVelocity(state: GameState): GameState {
  const { wHeld, aHeld, sHeld, dHeld, speed } = state.player;
  let direction: Direction = state.player.direction;
  if (dHeld && !aHeld) direction = "right";
  else if (aHeld && !dHeld) direction = "left";
  else if (wHeld && !sHeld) direction = "up";
  else if (sHeld && !wHeld) direction = "down";
  return {
    ...state,
    player: {
      ...state.player,
      dx: (aHeld ? -speed : 0) + (dHeld ? speed : 0),
      dy: (wHeld ? -speed : 0) + (sHeld ? speed : 0),
      direction,
    },
  };
}

export function tickMovement(state: GameState): GameState {
  let { dx, dy, x, y } = state.player;
  const oldX = x;
  const oldY = y;
  if (dx !== 0 && dy !== 0) {
    dx = Math.sign(dx) * (state.player.speed / DIAGONAL_NORMALIZER);
    dy = Math.sign(dy) * (state.player.speed / DIAGONAL_NORMALIZER);
  }

  const isInBounds = (px: number, py: number) =>
    !(px <= 0 || px >= GAME_WIDTH - PLAYER_SIZE || py <= 0 || py >= GAME_HEIGHT - PLAYER_SIZE * 2);
  const collidesAt = (px: number, py: number) => {
    const rect = playerRectAt(px, py);
    return solidRects(state).some((value) => intersects(rect, value));
  };
  const canMoveTo = (px: number, py: number) => isInBounds(px, py) && !collidesAt(px, py);

  // Resolve movement per-axis to support reliable sliding along obstacles.
  x = oldX;
  y = oldY;
  const diagonalInput = state.player.dx !== 0 && state.player.dy !== 0;
  let movedX = false;
  let movedY = false;

  if (dx !== 0) {
    const nextX = oldX + dx;
    if (canMoveTo(nextX, y)) {
      x = nextX;
      movedX = true;
    }
  }
  if (dy !== 0) {
    const nextY = oldY + dy;
    if (canMoveTo(x, nextY)) {
      y = nextY;
      movedY = true;
    }
  }

  if (diagonalInput && movedX !== movedY) {
    // When only one axis is free during diagonal movement, slow down slide speed.
    x = oldX + (x - oldX) * SLIDE_FACTOR;
    y = oldY + (y - oldY) * SLIDE_FACTOR;
  }

  const nextState: GameState = {
    ...state,
    player: {
      ...state.player,
      x,
      y,
      dx,
      dy,
    },
    runtime: {
      ...state.runtime,
      ms: state.runtime.ms + FRAME_TIME_MS,
    },
  };

  return updateActiveInteractable(nextState);
}

export function interactWithActive(state: GameState): GameState {
  const target = state.runtime.activeInteractable;
  if (!target) return state;

  if (target.kind === "counter") {
    if (state.player.heldItem) return state;
    const counter = state.counters.find((value) => value.id === target.id);
    if (!counter) return state;
    if (counter.stock <= 0) {
      return {
        ...state,
        runtime: {
          ...state.runtime,
          popupUntil: performance.now() + POPUP_DURATION_MS,
          popupImage: INSUFFICIENT_MESSAGE_IMAGE,
        },
      };
    }
    if (counter.itemKey === "cup") {
      return {
        ...state,
        counters: withCounterStockDecremented(state, target.id),
        player: { ...state.player, heldItem: createCup() },
      };
    }
    return {
      ...state,
      counters: withCounterStockDecremented(state, target.id),
      player: {
        ...state.player,
        heldItem: { kind: "ingredient", key: counter.itemKey, image: state.items[counter.itemKey].image },
      },
    };
  }

  if (target.kind === "prepTable") {
    const table = state.prepTables.find((value) => value.id === target.id);
    if (!table) return state;
    const held = state.player.heldItem;
    if (!held && table.cup) {
      return {
        ...state,
        prepTables: state.prepTables.map((value) => (value.id === table.id ? { ...value, cup: null } : value)),
        player: { ...state.player, heldItem: withCupImage(table.cup) },
      };
    }
    if (!held) return state;
    if (held.kind === "cup" && !table.cup) {
      return {
        ...state,
        prepTables: state.prepTables.map((value) => (value.id === table.id ? { ...value, cup: withCupImage(held) } : value)),
        player: { ...state.player, heldItem: null },
      };
    }
    if (held.kind === "ingredient" && table.cup) {
      const nextCup = withCupImage({ ...table.cup, ingredients: [...table.cup.ingredients, held.key] });
      return {
        ...state,
        prepTables: state.prepTables.map((value) => (value.id === table.id ? { ...value, cup: nextCup } : value)),
        player: { ...state.player, heldItem: null },
      };
    }
    return state;
  }

  if (target.kind === "trashbin") {
    if (!state.player.heldItem) return state;
    return { ...state, player: { ...state.player, heldItem: null } };
  }

  if (target.kind === "chair") {
    if (!state.player.heldItem || state.player.heldItem.kind !== "cup") return state;
    const chair = state.chairs.find((value) => value.id === target.id);
    if (!chair || !chair.customerId) return state;
    const customer = state.customers.find((value) => value.id === chair.customerId);
    if (!customer) return state;

    const expected = customer.order;
    const actual = state.player.heldItem.ingredients;
    const isMatch =
      expected.length === actual.length &&
      expected.every((value) => actual.includes(value)) &&
      actual.every((value) => expected.includes(value));
    const orderCost = 1 + expected.reduce((sum, key) => sum + state.items[key].cost, 0);
    const moneyDelta = isMatch ? Math.trunc(orderCost * 1.5) + state.player.tips : -3;
    if (isMatch) {
      playMeowHappy(state.soundOn);
    } else {
      playMeowAngry(state.soundOn);
    }

    const route = chair.route;
    const lastPoint = route[route.length - 1];
    return {
      ...state,
      chairs: state.chairs.map((value) => (value.id === chair.id ? { ...value, customerId: null } : value)),
      customers: state.customers.map((value) =>
        value.id === customer.id
          ? {
              ...value,
              seated: false,
              leaving: true,
              x: lastPoint.x,
              y: lastPoint.y,
              w: CUSTOMER_SIZE,
              h: CUSTOMER_SIZE,
              currentTarget: route.length - 1,
            }
          : value,
      ),
      player: {
        ...state.player,
        heldItem: null,
        money: state.player.money + moneyDelta,
        moneyDelta,
        moneyDeltaAt: performance.now(),
      },
    };
  }

  return state;
}

export function maybeSpawnCustomer(state: GameState): GameState {
  const available = state.chairs.filter((value) => !value.customerId);
  if (available.length === 0) return state;

  const chanceBase = Math.max(1, Math.floor(state.runtime.customerChance / state.runtime.chanceDivisor));
  const randInt = rand(chanceBase);
  const nextChance = Math.max(1, Math.floor(state.runtime.customerChance / 1.08));

  if (randInt !== 0) {
    return {
      ...state,
      runtime: {
        ...state.runtime,
        customerChance: nextChance,
      },
    };
  }

  const chair = available[rand(available.length)];
  const customerId = makeId("customer");
  const customer: CustomerState = {
    id: customerId,
    x: 980,
    y: 180,
    w: CUSTOMER_SIZE,
    h: CUSTOMER_SIZE,
    seated: false,
    leaving: false,
    chairId: chair.id,
    currentTarget: 0,
    direction: "left",
    order: randomOrder(),
    seatNumber: 1,
  };

  return {
    ...state,
    runtime: {
      ...state.runtime,
      customerChance: 100 * (state.customers.length + 1),
    },
    chairs: state.chairs.map((value) => (value.id === chair.id ? { ...value, customerId } : value)),
    customers: [...state.customers, customer],
  };
}

export function moveCustomers(state: GameState): GameState {
  const nextCustomers: CustomerState[] = [];

  for (const customer of state.customers) {
    const chair = state.chairs.find((value) => value.id === customer.chairId);
    if (!chair) continue;

    if (!customer.leaving) {
      if (customer.currentTarget >= chair.route.length) {
        nextCustomers.push({
          ...customer,
          seated: true,
          x: chair.rect.x,
          y: chair.rect.y,
          w: chair.rect.w,
          h: chair.rect.h,
        });
        continue;
      }

      const target = chair.route[customer.currentTarget];
      const dx = Math.sign(target.x - customer.x);
      const dy = Math.sign(target.y - customer.y);
      const reached = customer.x + dx === target.x && customer.y + dy === target.y;
      const direction = directionFromDelta(dx, dy, customer.direction);

      const nextTarget = reached ? customer.currentTarget + 1 : customer.currentTarget;
      const seated = reached && nextTarget >= chair.route.length;
      nextCustomers.push({
        ...customer,
        x: customer.x + dx,
        y: customer.y + dy,
        direction,
        currentTarget: nextTarget,
        seated,
        w: seated ? chair.rect.w : customer.w,
        h: seated ? chair.rect.h : customer.h,
      });
      continue;
    }

    const target = chair.route[customer.currentTarget];
    const dx = Math.sign(target.x - customer.x);
    const dy = Math.sign(target.y - customer.y);
    const nx = customer.x + dx;
    const ny = customer.y + dy;
    const reached = nx === target.x && ny === target.y;
    const direction = directionFromDelta(dx, dy, customer.direction);

    if (reached && customer.currentTarget === 0) {
      continue;
    }

    nextCustomers.push({
      ...customer,
      x: nx,
      y: ny,
      direction,
      currentTarget: reached ? customer.currentTarget - 1 : customer.currentTarget,
    });
  }

  const seated = nextCustomers.filter((value) => value.seated);
  const withSeatNumbers = nextCustomers.map((value) =>
    value.seated ? { ...value, seatNumber: seated.findIndex((entry) => entry.id === value.id) + 1 } : value,
  );

  return {
    ...state,
    customers: withSeatNumbers,
  };
}

export function setPanel(state: GameState, panel: Panel): GameState {
  const banner = panel === "none" ? "item" : panel;
  const shouldStopPlayer = panel === "upgrades";
  return {
    ...state,
    panel,
    ui: {
      ...state.ui,
      currentBanner: banner,
    },
    player: {
      ...state.player,
      dx: shouldStopPlayer ? 0 : state.player.dx,
      dy: shouldStopPlayer ? 0 : state.player.dy,
      wHeld: shouldStopPlayer ? false : state.player.wHeld,
      aHeld: shouldStopPlayer ? false : state.player.aHeld,
      sHeld: shouldStopPlayer ? false : state.player.sHeld,
      dHeld: shouldStopPlayer ? false : state.player.dHeld,
    },
  };
}

export function setRestockCounter(state: GameState, counterId: string): GameState {
  return {
    ...state,
    ui: {
      ...state.ui,
      restockCounterId: counterId,
      restockAmount: 0,
    },
  };
}

export function adjustRestockAmount(state: GameState, delta: number): GameState {
  return {
    ...state,
    ui: {
      ...state.ui,
      restockAmount: Math.max(0, state.ui.restockAmount + delta),
    },
  };
}

export function commitRestock(state: GameState): GameState {
  const counter = state.counters.find((value) => value.id === state.ui.restockCounterId);
  if (!counter || state.ui.restockAmount === 0) return state;
  const cost = state.items[counter.itemKey].cost * state.ui.restockAmount;
  if (state.player.money < cost) return state;
  return {
    ...state,
    counters: state.counters.map((value) =>
      value.id === counter.id ? { ...value, stock: value.stock + state.ui.restockAmount } : value,
    ),
    player: {
      ...state.player,
      money: state.player.money - cost,
    },
    ui: {
      ...state.ui,
      restockAmount: 0,
    },
  };
}

export function applyUpgrade(state: GameState, kind: "advertisement" | "energy" | "cuteness" | "meowmax"): GameState {
  const { upgrades } = state;

  switch (kind) {
    case "advertisement":
      if (state.player.money < upgrades.advertisementCost || upgrades.advertisementLevel >= upgrades.maxLevel) return state;
      return {
        ...state,
        runtime: {
          ...state.runtime,
          chanceDivisor: 1 + Math.pow(upgrades.advertisementLevel, 1.1) / 10,
        },
        player: {
          ...state.player,
          money: state.player.money - upgrades.advertisementCost,
        },
        upgrades: {
          ...upgrades,
          advertisementLevel: upgrades.advertisementLevel + 1,
          advertisementCost: upgrades.advertisementCost + 5,
        },
      };

    case "energy":
      if (state.player.money < upgrades.energyCost || upgrades.energyLevel >= upgrades.maxLevel) return state;
      return {
        ...state,
        player: {
          ...state.player,
          speed: state.player.speed + 0.2,
          money: state.player.money - upgrades.energyCost,
        },
        upgrades: {
          ...upgrades,
          energyLevel: upgrades.energyLevel + 1,
          energyCost: upgrades.energyCost + 5,
        },
      };

    case "cuteness":
      if (state.player.money < upgrades.cutenessCost || upgrades.cutenessLevel >= upgrades.maxLevel) return state;
      return {
        ...state,
        player: {
          ...state.player,
          tips: state.player.tips + 1,
          money: state.player.money - upgrades.cutenessCost,
        },
        upgrades: {
          ...upgrades,
          cutenessLevel: upgrades.cutenessLevel + 1,
          cutenessCost: upgrades.cutenessCost + 15,
        },
      };

    case "meowmax":
      if (state.player.money < upgrades.meowmaxCost || upgrades.meowmaxLevel >= 2) return state;
      return {
        ...state,
        player: {
          ...state.player,
          money: state.player.money - upgrades.meowmaxCost,
        },
        upgrades: {
          ...upgrades,
          meowmaxLevel: upgrades.meowmaxLevel + 1,
          meowmaxCost: upgrades.meowmaxCost + 100,
          maxLevel: upgrades.maxLevel + 3,
        },
      };

    default:
      return state;
  }
}

export function toggleSounds(state: GameState): GameState {
  const nextSoundsOn = !state.soundOn;
  if (!nextSoundsOn) {
    stopBackgroundMusic();
  } else {
    // Mirrors Swing behavior where turning sounds back on restarts background music.
    startBackgroundMusic(true);
  }
  return {
    ...state,
    soundOn: nextSoundsOn,
  };
}

export function toggleMusic(state: GameState): GameState {
  let nextMusicOn = !state.musicOn;
  if (!nextMusicOn) {
    stopBackgroundMusic();
  } else if (state.soundOn) {
    startBackgroundMusic(true);
  } else {
    nextMusicOn = false;
  }
  return {
    ...state,
    musicOn: nextMusicOn,
  };
}

export function validateTransientUi(state: GameState): GameState {
  if (state.runtime.popupUntil <= 0) return state;
  if (performance.now() <= state.runtime.popupUntil) return state;
  return {
    ...state,
    runtime: {
      ...state.runtime,
      popupUntil: 0,
      popupImage: null,
    },
  };
}
