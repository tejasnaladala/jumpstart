"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

// RippleShader — concentric pulse pattern from a 21st.dev component
// (shader-animation), adapted for the YC SS cream/orange palette.
// Generates a slow heartbeat of orange rings radiating from center,
// reads as the matchmaker network "pulsing" behind the founder graph.
//
// Tinted via three RGB channels with an orange bias, low alpha so it
// sits as ambient texture, not foreground. Honors a `paused` prop
// (used to halt the loop when the section is offscreen for perf).

const vertexShader = `
  void main() { gl_Position = vec4( position, 1.0 ); }
`;

// Fragment shader: builds vec3 colour over 5 concentric "lines" * 3
// channels, then mixes with the cream background so the rings stay
// soft and warm. Original three-channel ramp lives in the inner loop.
const fragmentShader = `
  #define TWO_PI 6.2831853072
  #define PI 3.14159265359
  precision highp float;
  uniform vec2 resolution;
  uniform float time;
  uniform vec3 u_bg;
  uniform vec3 u_accent;
  void main(void) {
    vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
    float t = time * 0.04;
    float lineWidth = 0.0018;
    float intensity = 0.0;
    for(int i=0; i<5; i++){
      intensity += lineWidth*float(i*i) /
        abs(fract(t + float(i)*0.012)*5.0 - length(uv) + mod(uv.x+uv.y, 0.2));
    }
    // Blend bg + accent based on the ripple intensity.
    vec3 col = mix(u_bg, u_accent, clamp(intensity * 1.4, 0.0, 0.9));
    gl_FragColor = vec4(col, 1.0);
  }
`;

type Props = {
  bgColor?: string;
  accentColor?: string;
  className?: string;
  // When true, skip rAF ticks (saves CPU when offscreen).
  paused?: boolean;
};

const hexToVec3 = (hex: string): [number, number, number] => {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return [1, 0.4, 0];
  return [
    parseInt(m[1]!, 16) / 255,
    parseInt(m[2]!, 16) / 255,
    parseInt(m[3]!, 16) / 255,
  ];
};

export function RippleShader({
  bgColor = "#F2CFA5",
  accentColor = "#E85A1B",
  className,
  paused = false,
}: Props): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    raf: number;
    renderer: THREE.WebGLRenderer;
    uniforms: {
      time: { value: number };
      resolution: { value: THREE.Vector2 };
      u_bg: { value: THREE.Vector3 };
      u_accent: { value: THREE.Vector3 };
    };
    cleanup: () => void;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const camera = new THREE.Camera();
    camera.position.z = 1;
    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);
    const bg = hexToVec3(bgColor);
    const accent = hexToVec3(accentColor);
    const uniforms = {
      time: { value: 1.0 },
      resolution: { value: new THREE.Vector2() },
      u_bg: { value: new THREE.Vector3(bg[0], bg[1], bg[2]) },
      u_accent: {
        value: new THREE.Vector3(accent[0], accent[1], accent[2]),
      },
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      // WebGL unsupported, bail silently.
      return;
    }
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const onResize = (): void => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      uniforms.resolution.value.x = renderer.domElement.width;
      uniforms.resolution.value.y = renderer.domElement.height;
    };
    onResize();
    window.addEventListener("resize", onResize);

    let raf = 0;
    const tick = (): void => {
      if (!paused) {
        uniforms.time.value += 0.04;
        renderer.render(scene, camera);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    sceneRef.current = {
      raf,
      renderer,
      uniforms,
      cleanup: () => {
        window.removeEventListener("resize", onResize);
        cancelAnimationFrame(raf);
        try {
          if (renderer.domElement.parentNode === container) {
            container.removeChild(renderer.domElement);
          }
        } catch {
          /* noop */
        }
        renderer.dispose();
        geometry.dispose();
        material.dispose();
      },
    };

    return () => {
      sceneRef.current?.cleanup();
      sceneRef.current = null;
    };
  }, [bgColor, accentColor, paused]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={"w-full h-full block " + (className || "")}
    />
  );
}
