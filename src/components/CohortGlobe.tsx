"use client";
import { useEffect, useRef, useState } from "react";
import { geoOrthographic, geoPath, geoDistance } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import type { FeatureCollection, Geometry } from "geojson";

// Cohort waypoints. Anchor cities for the SS 2026 attendee graph.
// Each entry is rendered as a pulse marker that pings sequentially as the
// globe rotates past it on the front face.
const WAYPOINTS: Array<{ name: string; lat: number; lng: number }> = [
  { name: "San Francisco", lat: 37.7749, lng: -122.4194 },
  { name: "New York", lat: 40.7128, lng: -74.0060 },
  { name: "Toronto", lat: 43.6532, lng: -79.3832 },
  { name: "London", lat: 51.5074, lng: -0.1278 },
  { name: "Berlin", lat: 52.52, lng: 13.405 },
  { name: "Tel Aviv", lat: 32.0853, lng: 34.7818 },
  { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
  { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
  { name: "Sao Paulo", lat: -23.5505, lng: -46.6333 },
  { name: "Sydney", lat: -33.8688, lng: 151.2093 },
  { name: "Lagos", lat: 6.5244, lng: 3.3792 },
  { name: "Singapore", lat: 1.3521, lng: 103.8198 },
];

const COLORS = {
  cream: "#F8F5EA",
  surface: "#FDFDF8",
  ink: "#16140F",
  muted: "#463325",
  border: "#E8E3CC",
  accent: "#E85A1B",
  accentGlow: "rgba(255, 102, 0, 0.55)",
  accentFaint: "rgba(255, 102, 0, 0.32)",
  accentLand: "rgba(255, 102, 0, 0.85)",
  graticule: "rgba(255, 102, 0, 0.18)",
  backsideLand: "rgba(70, 51, 37, 0.13)",
  backsideGraticule: "rgba(70, 51, 37, 0.06)",
  scanline: "rgba(255, 102, 0, 0.55)",
};

type Pulse = { idx: number; t0: number };

export function CohortGlobe({ size = 460 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [land, setLand] = useState<FeatureCollection<Geometry> | null>(null);
  const [activeName, setActiveName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/world-110m.json")
      .then((r) => r.json())
      .then((world: Topology) => {
        if (cancelled) return;
        const fc = feature(
          world,
          world.objects.countries
        ) as unknown as FeatureCollection<Geometry>;
        setLand(fc);
      })
      .catch(() => {
        // best effort; if topo fails the canvas just shows a sphere
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const radius = size / 2 - 4;
    const cx = size / 2;
    const cy = size / 2;

    const projection = geoOrthographic()
      .scale(radius)
      .translate([cx, cy])
      .clipAngle(90);

    const path = geoPath(projection, ctx);

    const pulses: Pulse[] = [];
    const lastVisible = new Set<number>();

    let lambda = 0; // longitude rotation, degrees
    const phi = -10; // gentle latitude tilt
    let raf = 0;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lastT = performance.now();

    function frame(t: number) {
      const dt = Math.min(64, t - lastT);
      lastT = t;
      if (!reduced) {
        lambda += dt * 0.014; // a bit livelier for the holo feel
      }
      projection.rotate([lambda, phi]);

      ctx!.clearRect(0, 0, size, size);

      // Backside ghost: rotate by 180 degrees on a temporary projection,
      // draw country outlines at very low opacity. Reads like the back of
      // a glass globe with hairline ink shadows. Cool but quiet.
      if (land) {
        const back = geoOrthographic()
          .scale(radius)
          .translate([cx, cy])
          .clipAngle(90)
          .rotate([lambda + 180, -phi]);
        const backPath = geoPath(back, ctx!);
        ctx!.save();
        ctx!.beginPath();
        backPath(land);
        ctx!.strokeStyle = COLORS.backsideLand;
        ctx!.lineWidth = 0.45;
        ctx!.setLineDash([2, 2]);
        ctx!.stroke();
        ctx!.setLineDash([]);
        ctx!.restore();
      }

      // Soft outer aura around the sphere edge so it reads as glass.
      const aura = ctx!.createRadialGradient(cx, cy, radius * 0.95, cx, cy, radius * 1.06);
      aura.addColorStop(0, "rgba(255, 102, 0, 0)");
      aura.addColorStop(0.55, "rgba(255, 102, 0, 0.08)");
      aura.addColorStop(1, "rgba(255, 102, 0, 0)");
      ctx!.fillStyle = aura;
      ctx!.fillRect(0, 0, size, size);

      // Graticule (orange, faint).
      drawGraticule(ctx!, projection, cx, cy, radius, COLORS.graticule);

      // Land (front hemisphere), outline only with a subtle orange glow.
      if (land) {
        ctx!.save();
        ctx!.shadowColor = COLORS.accentGlow;
        ctx!.shadowBlur = 6;
        ctx!.beginPath();
        path(land);
        ctx!.strokeStyle = COLORS.accentLand;
        ctx!.lineWidth = 0.7;
        ctx!.stroke();
        ctx!.restore();
      }

      // Equator and prime meridian, slightly brighter for the techy feel.
      drawEmphasizedAxis(ctx!, projection, cx, cy, radius);

      // Sphere outline with a soft orange glow.
      ctx!.save();
      ctx!.shadowColor = COLORS.accentGlow;
      ctx!.shadowBlur = 10;
      ctx!.beginPath();
      path({ type: "Sphere" });
      ctx!.strokeStyle = COLORS.accent;
      ctx!.lineWidth = 1.1;
      ctx!.stroke();
      ctx!.restore();

      // Holo scanline: a thin horizontal beam that sweeps top-to-bottom
      // across the sphere every 5 seconds. Skipped under reduced motion.
      if (!reduced) {
        const period = 5000;
        const phase = (t % period) / period; // 0..1
        const lineY = cy - radius + phase * (radius * 2);
        const grad = ctx!.createLinearGradient(0, lineY - 12, 0, lineY + 12);
        grad.addColorStop(0, "rgba(255, 102, 0, 0)");
        grad.addColorStop(0.5, "rgba(255, 102, 0, 0.28)");
        grad.addColorStop(1, "rgba(255, 102, 0, 0)");
        ctx!.save();
        // Clip to sphere so the scanline only touches the globe.
        ctx!.beginPath();
        ctx!.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx!.clip();
        ctx!.fillStyle = grad;
        ctx!.fillRect(0, lineY - 12, size, 24);
        // The bright spine of the scanline.
        ctx!.fillStyle = COLORS.scanline;
        ctx!.fillRect(0, lineY - 0.5, size, 1);
        ctx!.restore();
      }

      // Waypoints
      const visibleNow = new Set<number>();
      let nearestIdx = -1;
      let nearestAngle = Infinity;

      WAYPOINTS.forEach((w, i) => {
        const ang = geoDistance([w.lng, w.lat], [-lambda, -phi]);
        if (ang > Math.PI / 2 - 0.04) return; // off the visible hemisphere
        const projected = projection([w.lng, w.lat]);
        if (!projected) return;
        const [px, py] = projected;
        visibleNow.add(i);
        if (ang < nearestAngle) {
          nearestAngle = ang;
          nearestIdx = i;
        }
        // Static dot with a soft halo for the holo feel.
        ctx!.save();
        ctx!.shadowColor = COLORS.accent;
        ctx!.shadowBlur = 12;
        ctx!.beginPath();
        ctx!.arc(px, py, 3.4, 0, Math.PI * 2);
        ctx!.fillStyle = COLORS.accent;
        ctx!.fill();
        ctx!.restore();
        // Thin cream rim so the dot sits on the wireframe cleanly.
        ctx!.beginPath();
        ctx!.arc(px, py, 3.4, 0, Math.PI * 2);
        ctx!.strokeStyle = "rgba(244, 241, 219, 0.55)";
        ctx!.lineWidth = 0.6;
        ctx!.stroke();
      });

      // Sequential ping: when a waypoint enters the visible hemisphere from
      // the back, queue a pulse.
      WAYPOINTS.forEach((_, i) => {
        if (visibleNow.has(i) && !lastVisible.has(i)) {
          pulses.push({ idx: i, t0: t });
        }
      });
      lastVisible.clear();
      visibleNow.forEach((i) => lastVisible.add(i));

      // Draw pulses (1.2s each)
      const aliveSinceDraw: Pulse[] = [];
      for (const pulse of pulses) {
        const age = (t - pulse.t0) / 1200;
        if (age >= 1) continue;
        aliveSinceDraw.push(pulse);
        const w = WAYPOINTS[pulse.idx]!;
        const projected = projection([w.lng, w.lat]);
        if (!projected) continue;
        const [px, py] = projected;
        const r = 4 + age * 22;
        const alpha = (1 - age) * 0.85;
        ctx!.beginPath();
        ctx!.arc(px, py, r, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(255, 102, 0, ${alpha})`;
        ctx!.lineWidth = 1.6;
        ctx!.stroke();
      }
      pulses.length = 0;
      pulses.push(...aliveSinceDraw);

      // Active label = nearest waypoint to the rotation center
      if (nearestIdx >= 0 && nearestAngle < 0.6) {
        const newName = WAYPOINTS[nearestIdx]!.name;
        if (newName !== activeNameRef.current) {
          activeNameRef.current = newName;
          setActiveName(newName);
        }
      }

      raf = requestAnimationFrame(frame);
    }

    const activeNameRef = { current: null as string | null };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [land, size]);

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <canvas ref={canvasRef} className="block" aria-label="Spinning globe with cohort waypoints" />
      {activeName ? (
        <div
          aria-live="polite"
          className="absolute left-1/2 -translate-x-1/2 -bottom-7 text-xxs font-mono uppercase tracking-wider text-muted whitespace-nowrap"
        >
          <span className="text-accent">●</span> {activeName}
        </div>
      ) : null}
    </div>
  );
}

function drawGraticule(
  ctx: CanvasRenderingContext2D,
  projection: ReturnType<typeof geoOrthographic>,
  cx: number,
  cy: number,
  radius: number,
  color: string = COLORS.graticule
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  // Lat lines
  for (let lat = -60; lat <= 60; lat += 20) {
    let started = false;
    for (let lng = -180; lng <= 180; lng += 4) {
      const p = projection([lng, lat]);
      if (!p) {
        started = false;
        continue;
      }
      // distance from globe center to projected point in 2D
      const dx = p[0] - cx;
      const dy = p[1] - cy;
      if (dx * dx + dy * dy > radius * radius) {
        started = false;
        continue;
      }
      if (!started) {
        ctx.moveTo(p[0], p[1]);
        started = true;
      } else {
        ctx.lineTo(p[0], p[1]);
      }
    }
  }
  // Lng lines
  for (let lng = -180; lng < 180; lng += 30) {
    let started = false;
    for (let lat = -90; lat <= 90; lat += 4) {
      const p = projection([lng, lat]);
      if (!p) {
        started = false;
        continue;
      }
      const dx = p[0] - cx;
      const dy = p[1] - cy;
      if (dx * dx + dy * dy > radius * radius) {
        started = false;
        continue;
      }
      if (!started) {
        ctx.moveTo(p[0], p[1]);
        started = true;
      } else {
        ctx.lineTo(p[0], p[1]);
      }
    }
  }
  ctx.stroke();
}

// Equator and prime meridian, slightly brighter than the regular graticule
// so the holo wireframe has a primary axis read.
function drawEmphasizedAxis(
  ctx: CanvasRenderingContext2D,
  projection: ReturnType<typeof geoOrthographic>,
  cx: number,
  cy: number,
  radius: number
) {
  ctx.save();
  ctx.shadowColor = COLORS.accentGlow;
  ctx.shadowBlur = 4;
  ctx.strokeStyle = COLORS.accentFaint;
  ctx.lineWidth = 0.7;
  // Equator (lat = 0)
  ctx.beginPath();
  let started = false;
  for (let lng = -180; lng <= 180; lng += 2) {
    const p = projection([lng, 0]);
    if (!p) {
      started = false;
      continue;
    }
    const dx = p[0] - cx;
    const dy = p[1] - cy;
    if (dx * dx + dy * dy > radius * radius) {
      started = false;
      continue;
    }
    if (!started) {
      ctx.moveTo(p[0], p[1]);
      started = true;
    } else {
      ctx.lineTo(p[0], p[1]);
    }
  }
  ctx.stroke();
  // Prime meridian (lng = 0)
  ctx.beginPath();
  started = false;
  for (let lat = -90; lat <= 90; lat += 2) {
    const p = projection([0, lat]);
    if (!p) {
      started = false;
      continue;
    }
    const dx = p[0] - cx;
    const dy = p[1] - cy;
    if (dx * dx + dy * dy > radius * radius) {
      started = false;
      continue;
    }
    if (!started) {
      ctx.moveTo(p[0], p[1]);
      started = true;
    } else {
      ctx.lineTo(p[0], p[1]);
    }
  }
  ctx.stroke();
  ctx.restore();
}
