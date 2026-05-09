"use client";

import { useEffect, useRef } from "react";

type Point = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  label: string;
};

function rand(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

export function SignalField(): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const surface = canvas;
    const context = ctx;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const random = rand(20260508);
    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let points: Point[] = [];

    function reset(): void {
      const rect = surface.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      surface.width = Math.floor(width * dpr);
      surface.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.max(34, Math.min(82, Math.floor(width / 18)));
      points = Array.from({ length: count }, (_, index) => ({
        x: random() * width,
        y: random() * height,
        vx: (random() - 0.5) * 0.16,
        vy: (random() - 0.5) * 0.16,
        label: String([47, 59, 68, 71, 76, 83, 87, 94, 99][index % 9]),
      }));
    }

    function drawObject(time: number): void {
      const cx = width * 0.67;
      const cy = height * 0.5 + Math.sin(time * 0.0007) * 8;
      const radius = Math.min(width, height) * 0.13;
      const facets = 14;

      context.save();
      context.translate(cx, cy);
      context.rotate(time * 0.00008);
      context.globalAlpha = 0.74;
      context.strokeStyle = "rgba(255,255,255,0.62)";
      context.fillStyle = "rgba(160,165,177,0.18)";
      context.lineWidth = 1;

      for (let ring = 0; ring < 3; ring += 1) {
        const r = radius * (1 - ring * 0.2);
        context.beginPath();
        for (let i = 0; i <= facets; i += 1) {
          const angle = (Math.PI * 2 * i) / facets;
          const wobble = Math.sin(time * 0.001 + i * 1.7 + ring) * 7;
          const x = Math.cos(angle) * (r + wobble);
          const y = Math.sin(angle) * (r * 0.72 + wobble * 0.45);
          if (i === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.closePath();
        context.fill();
        context.stroke();
      }

      context.globalAlpha = 0.42;
      for (let i = 0; i < facets; i += 1) {
        const angle = (Math.PI * 2 * i) / facets;
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.72);
        context.stroke();
      }

      context.restore();
    }

    function frame(time = 0): void {
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#101010";
      context.fillRect(0, 0, width, height);

      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "rgba(160,165,177,0.62)");
      gradient.addColorStop(0.48, "rgba(16,16,16,0.12)");
      gradient.addColorStop(1, "rgba(255,214,0,0.14)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      for (const point of points) {
        if (!reduced) {
          point.x += point.vx;
          point.y += point.vy;
          if (point.x < -20) point.x = width + 20;
          if (point.x > width + 20) point.x = -20;
          if (point.y < -20) point.y = height + 20;
          if (point.y > height + 20) point.y = -20;
        }
      }

      context.lineWidth = 1;
      for (let i = 0; i < points.length; i += 1) {
        for (let j = i + 1; j < points.length; j += 1) {
          const a = points[i];
          const b = points[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 165) {
            const alpha = (1 - dist / 165) * 0.42;
            context.strokeStyle = `rgba(255,255,255,${alpha})`;
            context.beginPath();
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.stroke();
          }
        }
      }

      context.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
      context.fillStyle = "rgba(255,255,255,0.54)";
      for (const point of points.slice(0, 32)) {
        context.beginPath();
        context.arc(point.x, point.y, 1.5, 0, Math.PI * 2);
        context.fill();
        context.fillText(point.label, point.x + 6, point.y - 5);
      }

      drawObject(time);

      context.fillStyle = "rgba(255,214,0,0.92)";
      context.beginPath();
      context.arc(width * 0.21, height * 0.32, 3.5, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.arc(width * 0.48, height * 0.72, 2.6, 0, Math.PI * 2);
      context.fill();

      if (!reduced) raf = requestAnimationFrame(frame);
    }

    reset();
    frame();
    window.addEventListener("resize", reset);

    return () => {
      window.removeEventListener("resize", reset);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 h-full w-full"
    />
  );
}
