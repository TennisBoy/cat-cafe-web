import { useEffect, useRef } from "react";
import { useGameStore } from "../game/store";
import { playClick } from "../audio/sounds";

const WIDTH = 1000;
const HEIGHT = 700;

export function InstructionsScreen() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const setScreen = useGameStore((state) => state.setScreen);
  const soundsOn = useGameStore((state) => state.soundOn);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imagePaths = {
      background: "/assets/instructionsBackground.png",
      instructions: "/assets/instructionsImage.png",
      chair: "/assets/chairRight.png",
      seated: "/assets/chairSeatedRight.png",
      restock: "/assets/restockBtn.png",
      orders: "/assets/ordersBtn.png",
      stationary: "/assets/stationary.png",
      customerDown: "/assets/customerDown.png",
    };

    const images: Record<string, HTMLImageElement> = {};
    Object.entries(imagePaths).forEach(([key, src]) => {
      const image = new Image();
      image.src = src;
      images[key] = image;
    });

    let x = 440;
    let y = 200;
    let pauseUntil = 0;
    let seated = false;
    let frame = 0;

    const timer = window.setInterval(() => {
      const now = performance.now();
      if (now > pauseUntil) {
        y += 2;
        frame += 1;
        if (y > 300) {
          y = 200;
          seated = true;
          pauseUntil = now + 1000;
        } else {
          seated = false;
        }
      }

      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      if (images.background.complete) ctx.drawImage(images.background, 0, 0, WIDTH, HEIGHT);
      if (images.instructions.complete) ctx.drawImage(images.instructions, 90, 100);

      if (images.stationary.complete && images.stationary.naturalWidth >= 200 && images.stationary.naturalHeight >= 200) {
        const cols = Math.floor(images.stationary.naturalWidth / 200);
        const rows = Math.floor(images.stationary.naturalHeight / 200);
        const total = Math.max(1, cols * rows);
        const index = frame % total;
        const sx = (index % cols) * 200;
        const sy = Math.floor(index / cols) * 200;
        ctx.drawImage(images.stationary, sx, sy, 200, 200, 650, 190, 40, 40);
      }

      if (images.restock.complete) ctx.drawImage(images.restock, 480, 375, 120, 30);
      if (images.orders.complete) ctx.drawImage(images.orders, 750, 375, 120, 30);

      if (performance.now() > pauseUntil && images.customerDown.complete && images.customerDown.naturalWidth >= 200 && images.customerDown.naturalHeight >= 200) {
        const cols = Math.floor(images.customerDown.naturalWidth / 200);
        const rows = Math.floor(images.customerDown.naturalHeight / 200);
        const total = Math.max(1, cols * rows);
        const index = frame % total;
        const sx = (index % cols) * 200;
        const sy = Math.floor(index / cols) * 200;
        ctx.drawImage(images.customerDown, sx, sy, 200, 200, x, y, 40, 40);
      }

      const chair = seated ? images.seated : images.chair;
      if (chair.complete) ctx.drawImage(chair, 420, 300, 75, 75);
    }, 30);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return (
    <section className="screen instructions-screen">
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="instructions-canvas" />
      <button className="back-button" onMouseEnter={() => playClick(soundsOn)} onClick={() => setScreen("menu")}>
        <img src="/assets/backBtn.png" alt="Back" />
      </button>
    </section>
  );
}
