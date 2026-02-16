import { useEffect, useRef } from "react";
import { GAME_HEIGHT, GAME_WIDTH } from "../game/constants";
import { useGameStore } from "../game/store";

type ImageMap = Record<string, HTMLImageElement>;

const bannerByPanel = {
  item: "/assets/itemBanner.png",
  restock: "/assets/restockBanner.png",
  orders: "/assets/ordersBanner.png",
  upgrades: "/assets/upgradesBanner.png",
} as const;

function useImageCache(paths: string[]) {
  const cacheRef = useRef<ImageMap>({});
  useEffect(() => {
    paths.forEach((path) => {
      if (!cacheRef.current[path]) {
        const image = new Image();
        image.src = path;
        cacheRef.current[path] = image;
      }
    });
  }, [paths]);
  return cacheRef.current;
}

function drawSheet(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  frameW: number,
  frameH: number,
  frameIndex: number,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  if (!image.naturalWidth || !image.naturalHeight) return;
  const cols = Math.floor(image.naturalWidth / frameW);
  const rows = Math.floor(image.naturalHeight / frameH);
  const total = Math.max(1, cols * rows);
  const index = frameIndex % total;
  const sx = (index % cols) * frameW;
  const sy = Math.floor(index / cols) * frameH;
  ctx.drawImage(image, sx, sy, frameW, frameH, x, y, w, h);
}

function drawCup(
  ctx: CanvasRenderingContext2D,
  cache: ImageMap,
  x: number,
  y: number,
  w: number,
  h: number,
  ingredientCount: number,
) {
  const sprite = ingredientCount > 0 ? cache["/assets/filledCup.png"] ?? cache["/assets/emptyCup.png"] : cache["/assets/emptyCup.png"];
  if (sprite) ctx.drawImage(sprite, x, y, w, h);
}

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const state = useGameStore((value) => value);

  const paths = [
    "/assets/background.png",
    "/assets/currentItemBackground.png",
    "/assets/filledCup.png",
    "/assets/emptyCup.png",
    "/assets/itemBanner.png",
    "/assets/restockBanner.png",
    "/assets/ordersBanner.png",
    "/assets/upgradesBanner.png",
    "/assets/insufficientMessage.png",
    "/assets/longTable.png",
    "/assets/table.png",
    "/assets/wall.png",
    "/assets/prepTable.png",
    "/assets/trashbin.png",
    "/assets/chairLeft.png",
    "/assets/chairRight.png",
    "/assets/chairSeatedLeft.png",
    "/assets/chairSeatedRight.png",
    "/assets/counterPopUp.png",
    "/assets/counterPopDown.png",
    "/assets/counterPopLeft.png",
    "/assets/counterPopRight.png",
    "/assets/rollRight.png",
    "/assets/rollLeft.png",
    "/assets/rollUp.png",
    "/assets/rollDown.png",
    "/assets/stationary.png",
    "/assets/customerUp.png",
    "/assets/customerDown.png",
    "/assets/customerLeft.png",
    "/assets/customerRight.png",
    ...state.counters.map((counter) => `/assets/${counter.itemKey}Counter.png`),
    ...Object.values(state.items).map((item) => item.image),
    ...Array.from({ length: 8 }, (_, index) => `/assets/customer${index + 1}PopUp.png`),
  ];
  const cache = useImageCache(paths);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    const frameTick = Math.floor(state.runtime.ms / 80);

    const background = cache["/assets/background.png"];
    if (background) ctx.drawImage(background, 0, 0, GAME_WIDTH, GAME_HEIGHT);

    state.decorations.forEach((decor) => {
      const image = cache[decor.image];
      if (image) ctx.drawImage(image, decor.rect.x, decor.rect.y, decor.rect.w, decor.rect.h);
    });

    state.walls.forEach((wall) => {
      const image = cache["/assets/wall.png"];
      if (image) ctx.drawImage(image, wall.x, wall.y, wall.w, wall.h);
    });

    state.counters.forEach((counter) => {
      const image = cache[`/assets/${counter.itemKey}Counter.png`];
      if (image) ctx.drawImage(image, counter.rect.x, counter.rect.y, counter.rect.w, counter.rect.h);
    });

    state.prepTables.forEach((table) => {
      const image = cache["/assets/prepTable.png"];
      if (image) ctx.drawImage(image, table.rect.x, table.rect.y, table.rect.w, table.rect.h);
      if (table.cup) {
        drawCup(ctx, cache, table.rect.x + 15, table.rect.y - 10, 50, 50, table.cup.ingredients.length);
      }
    });

    state.trashbins.forEach((trash) => {
      const image = cache["/assets/trashbin.png"];
      if (image) ctx.drawImage(image, trash.rect.x, trash.rect.y, trash.rect.w, trash.rect.h);
    });

    state.chairs.forEach((chair) => {
      const seated = chair.customerId && state.customers.find((customer) => customer.id === chair.customerId)?.seated;
      const image = seated
        ? cache[chair.chairRight ? "/assets/chairSeatedRight.png" : "/assets/chairSeatedLeft.png"]
        : cache[chair.chairRight ? "/assets/chairRight.png" : "/assets/chairLeft.png"];
      if (image) ctx.drawImage(image, chair.rect.x, chair.rect.y, chair.rect.w, chair.rect.h);
    });

    state.customers.forEach((customer) => {
      if (customer.seated) {
        const chair = state.chairs.find((value) => value.id === customer.chairId);
        const image = cache[chair?.chairRight ? "/assets/chairSeatedRight.png" : "/assets/chairSeatedLeft.png"];
        if (image) ctx.drawImage(image, customer.x, customer.y, customer.w, customer.h);
      } else {
        const sheet = cache[`/assets/customer${customer.direction.slice(0, 1).toUpperCase()}${customer.direction.slice(1)}.png`];
        if (sheet) drawSheet(ctx, sheet, 200, 200, frameTick, customer.x, customer.y, customer.w, customer.h);
      }

      if (customer.seated) {
        const icon = cache[`/assets/customer${customer.seatNumber}PopUp.png`];
        if (icon) ctx.drawImage(icon, customer.x, customer.y - 50, 50, 50);
      }
    });

    const playerSheet =
      state.player.dHeld && !state.player.aHeld
        ? cache["/assets/rollRight.png"]
        : state.player.aHeld && !state.player.dHeld
          ? cache["/assets/rollLeft.png"]
          : state.player.wHeld && !state.player.sHeld
            ? cache["/assets/rollUp.png"]
            : state.player.sHeld && !state.player.wHeld
              ? cache["/assets/rollDown.png"]
              : cache["/assets/stationary.png"];
    if (playerSheet) drawSheet(ctx, playerSheet, 200, 200, frameTick, Math.round(state.player.x), Math.round(state.player.y), 40, 40);

    const currentItemBackground = cache["/assets/currentItemBackground.png"];
    if (currentItemBackground) ctx.drawImage(currentItemBackground, 0, 435, 375, 150);

    const currentBanner = cache[bannerByPanel[state.ui.currentBanner]];
    if (currentBanner) ctx.drawImage(currentBanner, 375, 435);

    if (state.player.heldItem) {
      if (state.player.heldItem.kind === "cup") {
        const count = state.player.heldItem.ingredients.length;
        drawCup(ctx, cache, Math.round(state.player.x) + 40, Math.round(state.player.y) + 20, 25, 25, count);
        drawCup(ctx, cache, 280, 460, 90, 90, count);
      } else {
        const held = cache[state.player.heldItem.image];
        if (held) {
          ctx.drawImage(held, Math.round(state.player.x) + 40, Math.round(state.player.y) + 20, 25, 25);
          ctx.drawImage(held, 280, 460, 90, 90);
        }
      }
      ctx.fillStyle = "#000";
      ctx.font = "48px 'Waterlily Script'";
      ctx.fillText("Current Item:", 20, 480);
      ctx.fillText(state.player.heldItem.kind === "cup" ? "cup" : state.player.heldItem.key, 20, 540);
      if (state.player.heldItem.kind === "cup") {
        ctx.font = "36px 'Waterlily Script'";
        ctx.fillText("Ingredients:", 120, 520);
        ctx.font = "24px 'Waterlily Script'";
        state.player.heldItem.ingredients.forEach((ingredient, index) => {
          const col = Math.floor(index / 2);
          const row = index % 2;
          ctx.fillText(ingredient, 100 + col * 100, 550 + row * 25);
        });
      }
    } else {
      ctx.fillStyle = "#000";
      ctx.font = "48px 'Waterlily Script'";
      ctx.fillText("Current Item:", 20, 480);
      ctx.fillText("Nothing", 20, 540);
    }

    ctx.fillStyle = "#157811";
    ctx.font = "24px 'Waterlily Script'";
    ctx.fillText(`Money: $${state.player.money}`, 700, 650);

    if (performance.now() < state.player.moneyDeltaAt + 2000 && state.player.moneyDelta !== 0) {
      ctx.fillStyle = state.player.moneyDelta >= 0 ? "#157811" : "#cc1515";
      const rising = Math.floor((performance.now() - state.player.moneyDeltaAt) / 150);
      const sign = state.player.moneyDelta >= 0 ? "+" : "-";
      ctx.fillText(`${sign}$${Math.abs(state.player.moneyDelta)}`, 780, 620 + rising);
    }

    if (state.runtime.activeInteractable) {
      const active = state.runtime.activeInteractable;
      const popup =
        active.popupDirection === "up"
          ? cache["/assets/counterPopUp.png"]
          : active.popupDirection === "down"
            ? cache["/assets/counterPopDown.png"]
            : active.popupDirection === "left"
              ? cache["/assets/counterPopLeft.png"]
              : cache["/assets/counterPopRight.png"];
      if (popup) {
        const x =
          active.popupDirection === "left"
            ? active.rect.x - 50
            : active.popupDirection === "right"
              ? active.rect.x + active.rect.w
              : active.rect.x + active.rect.w / 2 - 25;
        const y =
          active.popupDirection === "up"
            ? active.rect.y - 50
            : active.popupDirection === "down"
              ? active.rect.y + active.rect.h
              : active.rect.y + active.rect.h / 2 - 25;
        ctx.drawImage(popup, x, y, 50, 50);
      }
    }

    if (state.runtime.popupImage && performance.now() < state.runtime.popupUntil) {
      const popup = cache[state.runtime.popupImage];
      if (popup) ctx.drawImage(popup, GAME_WIDTH / 2 - 250, GAME_HEIGHT / 2 - 50, 500, 100);
    }
  }, [cache, state]);

  return <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} className="game-canvas" />;
}
