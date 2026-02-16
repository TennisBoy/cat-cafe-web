export type Screen = "menu" | "instructions" | "game";
export type Panel = "none" | "restock" | "orders" | "upgrades";
export type Direction = "up" | "down" | "left" | "right";
export type Banner = "item" | "restock" | "orders" | "upgrades";
export type InteractableKind = "counter" | "prepTable" | "trashbin" | "chair";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ItemDefinition {
  key: string;
  cost: number;
  image: string;
}

export interface CupItem {
  kind: "cup";
  image: string;
  ingredients: string[];
}

export interface IngredientItem {
  kind: "ingredient";
  key: string;
  image: string;
}

export type HeldItem = CupItem | IngredientItem | null;

export interface CounterState {
  id: string;
  itemKey: string;
  stock: number;
  rect: Rect;
  hitBox: Rect;
  popupDirection: Direction;
}

export interface PrepTableState {
  id: string;
  rect: Rect;
  hitBox: Rect;
  popupDirection: Direction;
  cup: CupItem | null;
}

export interface TrashbinState {
  id: string;
  rect: Rect;
  hitBox: Rect;
  popupDirection: Direction;
}

export interface ChairState {
  id: string;
  rect: Rect;
  collisionRect: Rect;
  hitBox: Rect;
  popupDirection: Direction;
  chairRight: boolean;
  route: Array<{ x: number; y: number }>;
  customerId: string | null;
}

export interface DecorState {
  id: string;
  image: string;
  rect: Rect;
}

export interface CustomerState {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  seated: boolean;
  leaving: boolean;
  chairId: string;
  currentTarget: number;
  direction: Direction;
  order: string[];
  seatNumber: number;
}

export interface PlayerState {
  x: number;
  y: number;
  dx: number;
  dy: number;
  speed: number;
  direction: Direction;
  wHeld: boolean;
  aHeld: boolean;
  sHeld: boolean;
  dHeld: boolean;
  heldItem: HeldItem;
  money: number;
  tips: number;
  moneyDelta: number;
  moneyDeltaAt: number;
}

export interface UpgradeState {
  advertisementLevel: number;
  energyLevel: number;
  cutenessLevel: number;
  meowmaxLevel: number;
  advertisementCost: number;
  energyCost: number;
  cutenessCost: number;
  meowmaxCost: number;
  maxLevel: number;
}

export interface RuntimeState {
  ms: number;
  customerChance: number;
  chanceDivisor: number;
  popupUntil: number;
  popupImage: string | null;
  activeInteractable: { kind: InteractableKind; id: string; popupDirection: Direction; rect: Rect } | null;
}

export interface UiState {
  currentBanner: Banner;
  restockCounterId: string;
  restockAmount: number;
}

export interface GameState {
  screen: Screen;
  panel: Panel;
  soundOn: boolean;
  musicOn: boolean;
  player: PlayerState;
  runtime: RuntimeState;
  ui: UiState;
  upgrades: UpgradeState;
  items: Record<string, ItemDefinition>;
  counters: CounterState[];
  prepTables: PrepTableState[];
  trashbins: TrashbinState[];
  chairs: ChairState[];
  decorations: DecorState[];
  walls: Rect[];
  customers: CustomerState[];
}
