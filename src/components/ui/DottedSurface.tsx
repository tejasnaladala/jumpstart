"use client";
import { cn } from "@/lib/utils";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// DottedSurface — 3D particle field that waves like a sea. Lift of the
// 21st.dev DottedSurface component. Stripped the next-themes dependency
// (we don't ship a theme switcher); colour is fixed via a `dotColor`
// prop, defaulting to a warm muted brown that reads as ambient texture
// on the cream pre-landing background.
//
// Used in the PreLandingHero as the deepest backdrop layer (L0), under
// the smoke + ripple + code-shimmer. Adds depth without competing with
// the JUMPSTART wordmark.
//
// Performance:
//  - 40x60 = 2400 particles. Constant-size geometry, single Points
//    object, single material. Cheap on integrated GPUs.
//  - Animation runs at 60fps via rAF. Pause when not visible would be
//    a future improvement (IntersectionObserver toggle).
//  - prefers-reduced-motion: animation skipped (positions stay flat).

type Props = Omit<React.ComponentProps<"div">, "ref"> & {
  // RGB color for the dots, 0-255 each. Defaults to warm brown that
  // reads on cream without competing.
  dotColor?: [number, number, number];
};

export function DottedSurface({
  className,
  dotColor = [70, 51, 37], // muted #463325
  ...props
}: Props): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    cleanup: () => void;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const SEPARATION = 150;
    const AMOUNTX = 40;
    const AMOUNTY = 60;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      1,
      10000
    );
    camera.position.set(0, 355, 1220);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      // WebGL unsupported — bail silently. The pre-landing has other
      // backdrop layers (smoke + ripple) that still render.
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const positions: number[] = [];
    const colors: number[] = [];
    const [r, g, b] = dotColor;
    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        const x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
        const z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;
        positions.push(x, 0, z);
        colors.push(r, g, b);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colors, 3)
    );

    const material = new THREE.PointsMaterial({
      size: 6,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let count = 0;
    let raf = 0;
    const animate = (): void => {
      raf = requestAnimationFrame(animate);
      if (!reduceMotion) {
        const positionAttribute = geometry.attributes.position;
        if (!positionAttribute) return;
        const positionsArr = positionAttribute.array as Float32Array;
        let i = 0;
        for (let ix = 0; ix < AMOUNTX; ix++) {
          for (let iy = 0; iy < AMOUNTY; iy++) {
            const idx = i * 3;
            positionsArr[idx + 1] =
              Math.sin((ix + count) * 0.3) * 50 +
              Math.sin((iy + count) * 0.5) * 50;
            i++;
          }
        }
        positionAttribute.needsUpdate = true;
        count += 0.06;
      }
      renderer.render(scene, camera);
    };
    animate();

    const onResize = (): void => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    sceneRef.current = {
      renderer,
      cleanup: () => {
        window.removeEventListener("resize", onResize);
        cancelAnimationFrame(raf);
        scene.traverse((obj) => {
          if (obj instanceof THREE.Points) {
            obj.geometry.dispose();
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        });
        renderer.dispose();
        try {
          if (renderer.domElement.parentNode === container) {
            container.removeChild(renderer.domElement);
          }
        } catch {
          /* noop */
        }
      },
    };

    return () => {
      sceneRef.current?.cleanup();
      sceneRef.current = null;
    };
    // dotColor changes are rare (passed once); we intentionally leave
    // it out of deps to avoid recreating the entire scene on color tweaks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("absolute inset-0 -z-10", className)}
      {...props}
    />
  );
}
