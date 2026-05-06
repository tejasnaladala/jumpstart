"use client";
import { useEffect, useRef } from "react";

// Fragment shader smoke background. Adapted from a 21st.dev recipe but
// retuned for our palette: highlight color is our YC orange (#FF6600 default)
// over the espresso surface, with the noise field tinted warm.
//
// Tuning vs the source:
//   - Time scale 0.012 instead of 0.015 (editorial pace, not nightclub pace)
//   - DPR clamped to 1.5 max so high-DPI laptops do not burn GPU on a
//     decorative background
//   - prefers-reduced-motion: skip the WebGL init entirely; parent
//     espresso bg shows through as the static state
//   - Pause RAF when document.hidden is true (tab in background)
//   - Floor color clamped to the espresso bg so smoke fades into the
//     parent surface rather than going black

const fragmentShaderSrc = [
  "#version 300 es",
  "precision highp float;",
  "out vec4 O;",
  "uniform float u_time;",
  "uniform vec2 u_resolution;",
  "uniform vec3 u_color;",
  "uniform float u_intensity;",
  "#define FC gl_FragCoord.xy",
  "#define R u_resolution",
  "#define T (u_time + 660.0)",
  "float rnd(vec2 p){p=fract(p*vec2(12.9898,78.233));p+=dot(p,p+34.56);return fract(p.x*p.y);}",
  "float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(rnd(i),rnd(i+vec2(1,0)),u.x),mix(rnd(i+vec2(0,1)),rnd(i+1.),u.x),u.y);}",
  "float fbm(vec2 p){float t=0.,a=1.;for(int i=0;i<5;i++){t+=a*noise(p);p*=mat2(1.,-1.2,.2,1.2)*2.;a*=.5;}return t;}",
  "void main() {",
  "  vec2 uv = (FC - 0.5 * R) / R.y;",
  "  uv.x += 0.25;",
  "  uv *= vec2(2.0, 1.0);",
  "  float n = fbm(uv * 0.28 - vec2(T * 0.012, 0.0));",
  "  n = noise(uv * 3.0 + n * 2.0);",
  "  vec3 col = vec3(1.0);",
  "  col.r -= fbm(uv + vec2(0.0, T * 0.014) + n);",
  "  col.g -= fbm(uv * 1.003 + vec2(0.0, T * 0.014) + n + 0.003);",
  "  col.b -= fbm(uv * 1.006 + vec2(0.0, T * 0.014) + n + 0.006);",
  "  col = mix(col, u_color, dot(col, vec3(0.21, 0.71, 0.07)) * u_intensity);",
  "  col = max(col, vec3(0.176, 0.141, 0.090));",
  "  col = clamp(col, vec3(0.176, 0.141, 0.090), vec3(1.0));",
  "  O = vec4(col, 1.0);",
  "}",
].join("\n");

const vertexShaderSrc = [
  "#version 300 es",
  "precision highp float;",
  "in vec4 position;",
  "void main() { gl_Position = position; }",
].join("\n");

type Props = {
  // Highlight color in hex. Default: our YC accent #FF6600.
  color?: string;
  // 0..1, how strongly the highlight color shows. Default 0.6 so the
  // smoke is atmospheric, not loud.
  intensity?: number;
  className?: string;
};

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return [1, 0.4, 0];
  return [
    parseInt(m[1]!, 16) / 255,
    parseInt(m[2]!, 16) / 255,
    parseInt(m[3]!, 16) / 255,
  ];
}

export function SmokeBackground({
  color = "#FF6600",
  intensity = 0.6,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2");
    if (!gl) return;

    function compile(type: number, source: string): WebGLShader | null {
      const sh = gl!.createShader(type);
      if (!sh) return null;
      gl!.shaderSource(sh, source);
      gl!.compileShader(sh);
      return sh;
    }

    const vs = compile(gl.VERTEX_SHADER, vertexShaderSrc);
    const fs = compile(gl.FRAGMENT_SHADER, fragmentShaderSrc);
    if (!vs || !fs) return;
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]),
      gl.STATIC_DRAW
    );
    const posLoc = gl.getAttribLocation(program, "position");
    const timeLoc = gl.getUniformLocation(program, "u_time");
    const resLoc = gl.getUniformLocation(program, "u_resolution");
    const colLoc = gl.getUniformLocation(program, "u_color");
    const intLoc = gl.getUniformLocation(program, "u_intensity");

    const rgb = hexToRgb(color);

    function resize() {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      const rect = canvas!.getBoundingClientRect();
      canvas!.width = Math.max(1, rect.width * dpr);
      canvas!.height = Math.max(1, rect.height * dpr);
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let running = true;
    const start = performance.now();

    function frame() {
      if (!running || !gl || !program) return;
      raf = requestAnimationFrame(frame);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
      const t = (performance.now() - start) * 0.001;
      gl.uniform1f(timeLoc, t);
      gl.uniform2f(resLoc, canvas!.width, canvas!.height);
      gl.uniform3f(colLoc, rgb[0], rgb[1], rgb[2]);
      gl.uniform1f(intLoc, intensity);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    frame();

    function onVisibility() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        frame();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [color, intensity]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
