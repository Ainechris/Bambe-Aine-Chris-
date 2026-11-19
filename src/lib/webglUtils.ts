import * as THREE from 'three';

export interface Vec2 {
  x: number;
  y: number;
}

let cachedSoftwareWebGL: boolean | null = null;

/**
 * Probes WebGL2 renderer string for software rasterizers (SwiftShader, llvmpipe, etc.).
 * Cached once per session and intentionally never calls WEBGL_lose_context.loseContext(),
 * because calling loseContext() causes Chromium to block WebGL creation on the page.
 */
export function detectSoftwareWebGL(): boolean {
  if (cachedSoftwareWebGL !== null) return cachedSoftwareWebGL;
  try {
    const probeCanvas = document.createElement('canvas');
    probeCanvas.width = 1;
    probeCanvas.height = 1;
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) {
      cachedSoftwareWebGL = true;
      return true;
    }
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    cachedSoftwareWebGL = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    return cachedSoftwareWebGL;
  } catch {
    cachedSoftwareWebGL = true;
    return true;
  }
}

export interface SafeWebGLRendererOptions {
  canvas?: HTMLCanvasElement;
  antialias?: boolean;
  alpha?: boolean;
  powerPreference?: WebGLPowerPreference;
}

/**
 * Safely acquires a WebGL2 context before instantiating THREE.WebGLRenderer so that
 * blocked or unavailable WebGL environments fall back cleanly without console errors.
 */
export function createSafeWebGLRenderer(
  options: SafeWebGLRendererOptions
): THREE.WebGLRenderer | null {
  try {
    const targetCanvas = options.canvas ?? document.createElement('canvas');
    const attrs: WebGLContextAttributes = {
      alpha: options.alpha ?? false,
      antialias: options.antialias ?? true,
      depth: true,
      stencil: true,
      powerPreference: options.powerPreference ?? 'default',
    };

    const gl = targetCanvas.getContext('webgl2', attrs);
    if (!gl || gl.isContextLost()) {
      return null;
    }

    return new THREE.WebGLRenderer({
      canvas: targetCanvas,
      context: gl,
      alpha: attrs.alpha,
      antialias: attrs.antialias,
      powerPreference: attrs.powerPreference,
    });
  } catch {
    return null;
  }
}

/**
 * Software-WebGL frame pacer that waits for GPU command completion via fenceSync
 * before scheduling the next frame with a short pause.
 */
export function afterDraw(
  renderer: THREE.WebGLRenderer,
  cb: () => void,
  registerTimer: (id: number) => void
): void {
  const gl = renderer.getContext() as WebGL2RenderingContext;
  if (!gl || gl.isContextLost() || typeof gl.fenceSync !== 'function') {
    registerTimer(window.setTimeout(cb, 80));
    return;
  }
  const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
  gl.flush();
  const poll = () => {
    if (gl.isContextLost()) {
      if (sync) gl.deleteSync(sync);
      return;
    }
    const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
    if (state === gl.UNSIGNALED) {
      registerTimer(window.setTimeout(poll, 5));
    } else {
      if (sync) gl.deleteSync(sync);
      registerTimer(window.setTimeout(cb, 80));
    }
  };
  registerTimer(window.setTimeout(poll, 5));
}

/**
 * Ensures polygon vertices are in Counter-Clockwise (CCW) order.
 */
export function ensureCCW(pts: Vec2[]): Vec2[] {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area < 0 ? [...pts].reverse() : pts;
}

/**
 * Insets a convex CCW polygon inward by `distance` pixels using shifted edge intersections.
 */
export function insetConvexPolygon(rawPts: Vec2[], distance: number): Vec2[] {
  const pts = ensureCCW(rawPts);
  const n = pts.length;
  if (n < 3 || distance <= 0) return pts;

  const lines: Array<{ p: Vec2; d: Vec2 }> = [];
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const ex = b.x - a.x;
    const ey = b.y - a.y;
    const len = Math.hypot(ex, ey) || 1;
    // Inward normal for CCW polygon is (-ey, ex) / len
    const nx = -ey / len;
    const ny = ex / len;
    lines.push({
      p: { x: a.x + nx * distance, y: a.y + ny * distance },
      d: { x: ex / len, y: ey / len },
    });
  }

  const out: Vec2[] = [];
  for (let i = 0; i < n; i++) {
    const l1 = lines[(i - 1 + n) % n];
    const l2 = lines[i];
    const denom = l1.d.x * l2.d.y - l1.d.y * l2.d.x;
    if (Math.abs(denom) < 1e-5) {
      out.push(l2.p);
    } else {
      const dx = l2.p.x - l1.p.x;
      const dy = l2.p.y - l1.p.y;
      const t = (dx * l2.d.y - dy * l2.d.x) / denom;
      out.push({
        x: l1.p.x + l1.d.x * t,
        y: l1.p.y + l1.d.y * t,
      });
    }
  }
  return out;
}

/**
 * Creates a rounded THREE.Shape from a polygon with quadratic corner rounding.
 */
export function buildRoundedPolygonShape(pts: Vec2[], radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const n = pts.length;
  if (n < 3) return shape;

  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const curr = pts[i];
    const next = pts[(i + 1) % n];

    const v1x = prev.x - curr.x;
    const v1y = prev.y - curr.y;
    const l1 = Math.hypot(v1x, v1y) || 1;

    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;
    const l2 = Math.hypot(v2x, v2y) || 1;

    const r = Math.min(radius, l1 * 0.42, l2 * 0.42);
    const pStart = { x: curr.x + (v1x / l1) * r, y: curr.y + (v1y / l1) * r };
    const pEnd = { x: curr.x + (v2x / l2) * r, y: curr.y + (v2y / l2) * r };

    if (i === 0) {
      shape.moveTo(pStart.x, pStart.y);
    } else {
      shape.lineTo(pStart.x, pStart.y);
    }
    shape.quadraticCurveTo(curr.x, curr.y, pEnd.x, pEnd.y);
  }
  shape.closePath();
  return shape;
}

/**
 * Solves an 8x8 linear system (Gaussian elimination with partial pivoting)
 * to compute a CSS `matrix3d(...)` homography mapping a W×H DOM element
 * onto four 2D screen corners [topLeft, topRight, bottomRight, bottomLeft].
 */
export function computeHomographyMatrix3d(
  w: number,
  h: number,
  dst: [Vec2, Vec2, Vec2, Vec2]
): string {
  const src: [Vec2, Vec2, Vec2, Vec2] = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];

  const A: number[][] = [];
  const B: number[] = [];

  for (let i = 0; i < 4; i++) {
    const sx = src[i].x;
    const sy = src[i].y;
    const dx = dst[i].x;
    const dy = dst[i].y;
    A.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy]);
    B.push(dx);
    A.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy]);
    B.push(dy);
  }

  const n = 8;
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let r = i + 1; r < n; r++) {
      if (Math.abs(A[r][i]) > Math.abs(A[maxRow][i])) maxRow = r;
    }
    [A[i], A[maxRow]] = [A[maxRow], A[i]];
    [B[i], B[maxRow]] = [B[maxRow], B[i]];

    const pivot = A[i][i];
    if (Math.abs(pivot) < 1e-10) {
      return 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)';
    }
    for (let j = i; j < n; j++) A[i][j] /= pivot;
    B[i] /= pivot;

    for (let r = 0; r < n; r++) {
      if (r === i) continue;
      const factor = A[r][i];
      for (let j = i; j < n; j++) A[r][j] -= factor * A[i][j];
      B[r] -= factor * B[i];
    }
  }

  const [a, b, c, d, e, f, g, hCoeff] = B;
  // Column-major 4x4 CSS matrix3d
  return `matrix3d(${a.toFixed(6)},${d.toFixed(6)},0,${g.toFixed(8)},${b.toFixed(6)},${e.toFixed(6)},0,${hCoeff.toFixed(8)},0,0,1,0,${c.toFixed(4)},${f.toFixed(4)},0,1)`;
}
