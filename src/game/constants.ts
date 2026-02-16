import type { DecorState, Direction, Rect } from "./types";

export const GAME_WIDTH = 1000;
export const GAME_HEIGHT = 700;
export const PLAYER_SIZE = 40;

export const ITEM_KEYS = {
  liquids: ["milk", "grapefruit", "greentea", "lychee", "mango"],
  toppings: ["boba", "jelly"],
} as const;

const hitbox = (x: number, y: number, w: number, h: number, hx: number, hy: number): Rect => ({
  x: x - hx,
  y: y - hy,
  w: w + hx * 2,
  h: h + hy * 2,
});

const counterDef = (id: string, itemKey: string, x: number, y: number, hx: number, hy: number, popupDirection: Direction, stock: number) => ({
  id,
  itemKey,
  stock,
  rect: { x, y, w: 75, h: 75 },
  hitBox: hitbox(x, y, 75, 75, hx, hy),
  popupDirection,
});

export const COUNTER_LAYOUT = [
  counterDef("counter-cup", "cup", 235, 150, 10, 10, "up", 3),
  counterDef("counter-boba", "boba", 150, 0, 0, 10, "down", 1),
  counterDef("counter-milk", "milk", 225, 0, 0, 10, "down", 1),
  counterDef("counter-sugar", "sugar", 300, 0, 0, 10, "down", 2),
  counterDef("counter-ice", "ice", 0, 225, 10, 0, "right", 2),
  counterDef("counter-grapefruit", "grapefruit", 0, 75, 10, 0, "right", 1),
  counterDef("counter-greentea", "greentea", 0, 150, 10, 0, "right", 1),
  counterDef("counter-jelly", "jelly", 150, 300, 0, 10, "up", 1),
  counterDef("counter-lychee", "lychee", 225, 300, 0, 10, "up", 1),
  counterDef("counter-mango", "mango", 300, 300, 0, 10, "up", 1),
];

export const PREP_TABLE_LAYOUT = [
  { id: "prep-1", rect: { x: 150, y: 150, w: 75, h: 75 }, hitBox: hitbox(150, 150, 75, 75, 10, 10), popupDirection: "up" as Direction },
  { id: "prep-2", rect: { x: 320, y: 150, w: 75, h: 75 }, hitBox: hitbox(320, 150, 75, 75, 10, 10), popupDirection: "up" as Direction },
];

export const TRASHBIN_LAYOUT = [
  { id: "trash-1", rect: { x: 0, y: 325, w: 50, h: 50 }, hitBox: hitbox(0, 325, 50, 50, 10, 10), popupDirection: "right" as Direction },
  { id: "trash-2", rect: { x: 75, y: 0, w: 50, h: 50 }, hitBox: hitbox(75, 0, 50, 50, 10, 10), popupDirection: "down" as Direction },
];

const chairDef = (
  id: string,
  x: number,
  y: number,
  chairRight: boolean,
  route: Array<{ x: number; y: number }>,
): {
  id: string;
  rect: Rect;
  collisionRect: Rect;
  hitBox: Rect;
  popupDirection: Direction;
  chairRight: boolean;
  route: Array<{ x: number; y: number }>;
} => ({
  id,
  rect: { x, y, w: 75, h: 75 },
  collisionRect: { x: x + 10, y: y + 13, w: 55, h: 60 },
  hitBox: hitbox(x, y, 75, 75, 10, 10),
  popupDirection: "up",
  chairRight,
  route,
});

export const CHAIR_LAYOUT = [
  chairDef("chair-1", 575, 385, false, [
    { x: 980, y: 180 },
    { x: 900, y: 180 },
    { x: 900, y: 350 },
    { x: 600, y: 350 },
    { x: 600, y: 380 },
  ]),
  chairDef("chair-2", 675, 385, false, [
    { x: 980, y: 180 },
    { x: 900, y: 180 },
    { x: 900, y: 350 },
    { x: 700, y: 350 },
    { x: 700, y: 380 },
  ]),
  chairDef("chair-3", 775, 385, true, [
    { x: 980, y: 180 },
    { x: 900, y: 180 },
    { x: 900, y: 350 },
    { x: 800, y: 350 },
    { x: 800, y: 380 },
  ]),
  chairDef("chair-4", 875, 385, true, [
    { x: 980, y: 180 },
    { x: 900, y: 180 },
    { x: 900, y: 350 },
    { x: 900, y: 380 },
  ]),
  chairDef("chair-5", 625, 62, false, [
    { x: 980, y: 180 },
    { x: 620, y: 180 },
    { x: 620, y: 100 },
  ]),
  chairDef("chair-6", 800, 62, true, [
    { x: 980, y: 180 },
    { x: 850, y: 180 },
    { x: 850, y: 100 },
  ]),
  chairDef("chair-7", 625, 242, false, [
    { x: 980, y: 180 },
    { x: 620, y: 180 },
    { x: 620, y: 260 },
  ]),
  chairDef("chair-8", 800, 242, true, [
    { x: 980, y: 180 },
    { x: 850, y: 180 },
    { x: 850, y: 260 },
  ]),
];

export const DECORATIONS: DecorState[] = [
  { id: "long-table", image: "/assets/longTable.png", rect: { x: 575, y: 475, w: 400, h: 100 } },
  { id: "table-1", image: "/assets/table.png", rect: { x: 700, y: 50, w: 100, h: 100 } },
  { id: "table-2", image: "/assets/table.png", rect: { x: 700, y: 230, w: 100, h: 100 } },
];

export const WALLS: Rect[] = [
  { x: 0, y: 423, w: 450, h: 4 },
  { x: 448, y: 75, w: 4, h: 275 },
  { x: 448, y: 425, w: 4, h: 165 },
  { x: 450, y: 588, w: 550, h: 4 },
];
