"use client";

import { useEffect, useRef, useState } from "react";

const SAMPLE_SIZE = 10;

function extractColors(img: HTMLImageElement): [string, string] {
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  const data = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;

  const half = Math.floor(SAMPLE_SIZE / 2);
  let r1 = 0, g1 = 0, b1 = 0, c1 = 0;
  let r2 = 0, g2 = 0, b2 = 0, c2 = 0;

  for (let y = 0; y < SAMPLE_SIZE; y++) {
    for (let x = 0; x < SAMPLE_SIZE; x++) {
      const i = (y * SAMPLE_SIZE + x) * 4;
      if (x < half) {
        r1 += data[i]; g1 += data[i + 1]; b1 += data[i + 2]; c1++;
      } else {
        r2 += data[i]; g2 += data[i + 1]; b2 += data[i + 2]; c2++;
      }
    }
  }

  const clr = (r: number, g: number, b: number, c: number) =>
    `rgb(${Math.round(r / c)}, ${Math.round(g / c)}, ${Math.round(b / c)})`;

  return [clr(r1, g1, b1, c1), clr(r2, g2, b2, c2)];
}

export function useImageColors(src: string | null | undefined) {
  const [gradient, setGradient] = useState<string | null>(null);
  const cache = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!src) { setGradient(null); return; }

    if (cache.current[src]) {
      setGradient(cache.current[src]);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const [c1, c2] = extractColors(img);
      const g = `linear-gradient(135deg, ${c1}, ${c2})`;
      cache.current[src] = g;
      setGradient(g);
    };
    img.src = src;
  }, [src]);

  return gradient;
}
