"use client";
import React, { useEffect, useRef } from "react";

// Smoke / flame WebGL2 backdrop. Borrowed from a 21st.dev component
// (spooky-smoke-animation), restyled for the YC SS 2026 cream-orange
// palette. No three.js dependency, raw WebGL2, ~10KB gzip.
//
// Inspired by the YC Startup School 2026 hero shot: vertical orange
// streaks rising on a cream background, fbm-noise warped, looks like
// flame ribbons or warm smoke.
//
// Two prop knobs:
//   - smokeColor: the high-luminance color the noise tints toward
//     (default = YC orange #E85A1B)
//   - bgColor: the canvas clear color (default cream #F8F5EA)
//
// Costs roughly one shader pass per frame, no overdraw, fbm capped at
// 5 octaves so it runs fine on integrated GPUs.

const fragmentShaderSource = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
uniform vec3 u_color;
uniform vec3 u_bg;

#define FC gl_FragCoord.xy
#define R resolution
#define T (time+660.)

float rnd(vec2 p){p=fract(p*vec2(12.9898,78.233));p+=dot(p,p+34.56);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(rnd(i),rnd(i+vec2(1,0)),u.x),mix(rnd(i+vec2(0,1)),rnd(i+1.),u.x),u.y);}
float fbm(vec2 p){float t=.0,a=1.;for(int i=0;i<5;i++){t+=a*noise(p);p*=mat2(1,-1.2,.2,1.2)*2.;a*=.5;}return t;}

void main(){
  vec2 uv = (FC - .5 * R) / R.y;
  vec3 col = vec3(1.0);
  uv.x += .25;
  uv *= vec2(2.0, 1.0);

  float n = fbm(uv * .28 - vec2(T * .01, 0));
  n = noise(uv * 3. + n * 2.);

  col.r -= fbm(uv + vec2(0, T * .015) + n);
  col.g -= fbm(uv * 1.003 + vec2(0, T * .015) + n + .003);
  col.b -= fbm(uv * 1.006 + vec2(0, T * .015) + n + .006);

  col = mix(col, u_color, dot(col, vec3(.21, .71, .07)));
  col = mix(u_bg, col, min(time * .1, 1.));
  col = clamp(col, u_bg, vec3(1.0));

  O = vec4(col, 1);
}`;

const vertexShaderSource = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`;

class Renderer {
  private readonly vertices = [-1, 1, -1, -1, 1, 1, 1, -1];
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;
  private program: WebGLProgram | null = null;
  private vs: WebGLShader | null = null;
  private fs: WebGLShader | null = null;
  private buffer: WebGLBuffer | null = null;
  private color: [number, number, number] = [1, 0.4, 0];
  private bg: [number, number, number] = [0.957, 0.945, 0.859];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext("webgl2");
    if (!gl) throw new Error("WebGL2 not supported");
    this.gl = gl;
    this.setup();
    this.init();
  }

  updateColor(c: [number, number, number]): void {
    this.color = c;
  }

  updateBg(c: [number, number, number]): void {
    this.bg = c;
  }

  updateScale(): void {
    const dpr = Math.max(1, window.devicePixelRatio);
    const { clientWidth: w, clientHeight: h } = this.canvas;
    this.canvas.width = Math.max(1, w * dpr);
    this.canvas.height = Math.max(1, h * dpr);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  private compile(shader: WebGLShader, source: string): void {
    const gl = this.gl;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      // eslint-disable-next-line no-console
      console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    }
  }

  private setup(): void {
    const gl = this.gl;
    this.vs = gl.createShader(gl.VERTEX_SHADER);
    this.fs = gl.createShader(gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!this.vs || !this.fs || !program) return;
    this.compile(this.vs, vertexShaderSource);
    this.compile(this.fs, fragmentShaderSource);
    this.program = program;
    gl.attachShader(program, this.vs);
    gl.attachShader(program, this.fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      // eslint-disable-next-line no-console
      console.error("Program link error:", gl.getProgramInfoLog(program));
    }
  }

  private init(): void {
    const { gl, program } = this;
    if (!program) return;
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.vertices),
      gl.STATIC_DRAW
    );
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  }

  render(now = 0): void {
    const { gl, program, buffer, canvas } = this;
    if (!program || !gl.isProgram(program)) return;
    gl.clearColor(this.bg[0], this.bg[1], this.bg[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.uniform2f(
      gl.getUniformLocation(program, "resolution"),
      canvas.width,
      canvas.height
    );
    gl.uniform1f(gl.getUniformLocation(program, "time"), now * 1e-3);
    gl.uniform3fv(gl.getUniformLocation(program, "u_color"), this.color);
    gl.uniform3fv(gl.getUniformLocation(program, "u_bg"), this.bg);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  reset(): void {
    const { gl, program, vs, fs, buffer } = this;
    if (vs) gl.deleteShader(vs);
    if (fs) gl.deleteShader(fs);
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    this.program = null;
  }
}

const hexToRgb = (hex: string): [number, number, number] => {
  // Use String.match (returns RegExpMatchArray | null) instead of regex.exec
  // to keep the hot path simple and side-effect free.
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return [1, 0.4, 0];
  return [
    parseInt(m[1]!, 16) / 255,
    parseInt(m[2]!, 16) / 255,
    parseInt(m[3]!, 16) / 255,
  ];
};

type Props = {
  smokeColor?: string;
  bgColor?: string;
  className?: string;
};

export function SmokeBackground({
  smokeColor = "#E85A1B",
  bgColor = "#F8F5EA",
  className,
}: Props): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    let renderer: Renderer;
    try {
      renderer = new Renderer(canvasRef.current);
    } catch (e) {
      // WebGL2 unsupported (older browsers, headless test runners). Bail.
      // eslint-disable-next-line no-console
      console.warn("SmokeBackground: WebGL2 unavailable.", e);
      return;
    }
    rendererRef.current = renderer;
    renderer.updateColor(hexToRgb(smokeColor));
    renderer.updateBg(hexToRgb(bgColor));

    const onResize = (): void => renderer.updateScale();
    onResize();
    window.addEventListener("resize", onResize);

    let raf = 0;
    const loop = (now: number): void => {
      renderer.render(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
      renderer.reset();
    };
  }, [smokeColor, bgColor]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={"w-full h-full block " + (className || "")}
    />
  );
}
