"use client";

import { useEffect, useRef, useState } from "react";
import type { PredictionResponse } from "@/lib/types";

const CANVAS_SIZE = 256; // matches the backend's IMG_SIZE -- landmark/mask
// coordinates from the API are already in this frame, so no rescaling needed.
const DISPLAY_SIZE = 384; // upscaled via CSS for legibility on screen

interface Props {
  imageUrl: string;
  prediction: PredictionResponse;
}

export function CLOverlay({ imageUrl, prediction }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      // Stretch to 256x256 -- the same frame the model actually saw.
      ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);

      drawMaskOverlay(ctx, prediction.mask);
      drawLandmarks(ctx, prediction);
    };
    img.src = imageUrl;
  }, [imageUrl, prediction]);

  return (
    <div
      className={`${fullScreen ? "fixed top-0 left-0 w-full h-full z-20 bg-black/20 backdrop-blur-sm flex items-center justify-center" : "relative flex flex-col gap-3"}`}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        // style={{ width: DISPLAY_SIZE, height: DISPLAY_SIZE }}
        className={`rounded-md border border-slate-700 bg-black ${
          fullScreen
            ? "w-[90vmin] h-[90vmin] cursor-zoom-out"
            : `w-[${DISPLAY_SIZE}px] h-[${DISPLAY_SIZE}px] cursor-zoom-in`
        }`}
        onClick={() => setFullScreen(!fullScreen)}
      />
      <Legend className={`${fullScreen ? "hidden" : ""}`} />
    </div>
  );
}

function drawMaskOverlay(ctx: CanvasRenderingContext2D, mask: number[][]) {
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = CANVAS_SIZE;
  maskCanvas.height = CANVAS_SIZE;
  const maskCtx = maskCanvas.getContext("2d");
  if (!maskCtx) return;

  const imageData = maskCtx.createImageData(CANVAS_SIZE, CANVAS_SIZE);
  const teal = [45, 212, 191];

  for (let y = 0; y < CANVAS_SIZE; y++) {
    for (let x = 0; x < CANVAS_SIZE; x++) {
      const idx = (y * CANVAS_SIZE + x) * 4;
      const isMask = mask[y]?.[x] === 1;
      imageData.data[idx] = teal[0];
      imageData.data[idx + 1] = teal[1];
      imageData.data[idx + 2] = teal[2];
      imageData.data[idx + 3] = isMask ? 110 : 0; // alpha channel only
    }
  }

  maskCtx.putImageData(imageData, 0, 0);
  ctx.drawImage(maskCanvas, 0, 0); // composites with alpha over the base image
}

function drawLandmarks(ctx: CanvasRenderingContext2D, prediction: PredictionResponse) {
  const [ioX, ioY] = prediction.internal_os;
  const [eoX, eoY] = prediction.external_os;

  ctx.strokeStyle = "#a3e635";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ioX, ioY);
  ctx.lineTo(eoX, eoY);
  ctx.stroke();

  drawPoint(ctx, ioX, ioY, "#22d3ee", "IO");
  drawPoint(ctx, eoX, eoY, "#facc15", "EO");
}

function drawPoint(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, label: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "11px monospace";
  ctx.fillStyle = "#f8fafc";
  ctx.fillText(label, x + 6, y + 6);
}

function Legend({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 text-xs font-mono text-slate-400 ${className}`}>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" /> Internal Os
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" /> External Os
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-3 bg-teal-400/40" /> Segmented Canal
      </span>
    </div>
  );
}
