import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { RoutePath, Video } from '../types/portfolio.ts';
import { afterDraw, detectSoftwareWebGL } from '../lib/webglUtils.ts';

interface VanteRibbonShowcaseProps {
  videos: Video[];
  onNavigate: (path: RoutePath) => void;
}

interface RibbonItem {
  title: string;
  subtitle: string;
  badge: string;
  url?: string;
  route?: RoutePath;
  thumbnailUrl?: string;
  accent: string;
}

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);
const out = (t: number) => 1 - Math.pow(1 - t, 3);
const span = (p: number, a: number, b: number) => clamp((p - a) / (b - a));

export const VanteRibbonShowcase: React.FC<VanteRibbonShowcaseProps> = ({
  videos,
  onNavigate,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const l1Ref = useRef<HTMLDivElement>(null);
  const l2Ref = useRef<HTMLDivElement>(null);
  const capRef = useRef<HTMLDivElement>(null);
  const ruleRef = useRef<HTMLDivElement>(null);
  const introRefs = useRef<Array<HTMLDivElement | null>>([]);
  const nameRef = useRef<HTMLDivElement>(null);

  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const items: RibbonItem[] = videos.map((v, i) => ({
    title: v.title,
    subtitle: 'Watch on YouTube (@VazukoYT)',
    badge: `${String(i + 1).padStart(2, '0')} · ${v.category}`,
    url: v.videoUrl,
    thumbnailUrl: v.thumbnailUrl,
    accent: i % 2 === 0 ? '#7dd3fc' : '#34d399',
  }));

  useEffect(() => {
    if (reducedMotion) return;
    const track = trackRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!track || !stage || !canvas) return;

    const isSoftwareGl = detectSoftwareWebGL();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.setClearColor(0, 0);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

    const scene = new THREE.Scene();
    const FOV = 35;
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);

    // Build Vante CatmullRomCurve3 rail
    const SAMPLES = 1200;
    const pathP: THREE.Vector3[] = [];
    const pathT: THREE.Vector3[] = [];
    const PH0 = -1.5;
    const PH1 = Math.PI * 2 + 1.35;

    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 160; i++) {
      const t = i / 160;
      const ph = mix(PH0, PH1, t);
      const cs = Math.cos(ph);
      const u = 2 * t - 1;
      const depth = cs > 0 ? 7.6 + 16.4 * Math.pow(cs, 0.9) : 7.6 + 2.2 * cs;
      const edge = 0.84 + 0.5 * span(0.14 - t, 0, 0.14) + 0.8 * span(t, 0.84, 1);
      pts.push(
        new THREE.Vector3(
          edge * Math.sin(ph) * depth * 0.561,
          0.5 * Math.sign(u) * Math.pow(Math.abs(u), 1.4) * depth * 0.63,
          -depth
        )
      );
    }
    const path = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    path.arcLengthDivisions = 1500;
    const PATH_L = path.getLength();
    for (let i = 0; i <= SAMPLES; i++) {
      const u = i / SAMPLES;
      pathP.push(path.getPointAt(u));
      pathT.push(path.getTangentAt(u));
    }

    const at = (s: number, op: THREE.Vector3, ot: THREE.Vector3) => {
      const f = clamp(s / PATH_L) * SAMPLES;
      const i = Math.min(SAMPLES - 1, Math.floor(f));
      const k = f - i;
      op.lerpVectors(pathP[i], pathP[i + 1], k);
      ot.lerpVectors(pathT[i], pathT[i + 1], k).normalize();
    };

    const CARD_W = 2.1;
    const CARD_H = 1.32;
    const GAP = 0.03;
    const STEP = CARD_W + GAP;
    const NX = 28;
    const NY = 3;

    const vs = `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
    const fs = `uniform sampler2D map;uniform vec2 cover;uniform float aspect,ready,radius;varying vec2 vUv;
void main(){
  vec2 q=(abs(vUv-.5)-.5)*vec2(aspect,1.)+radius;
  float d=length(max(q,0.))+min(max(q.x,q.y),0.)-radius;
  float px=fwidth(d),a=1.-smoothstep(-px,px,d);
  if(a<.01)discard;
  vec2 uv=vUv;if(!gl_FrontFacing)uv.x=1.-uv.x;
  vec3 c=mix(vec3(.075),texture2D(map,(uv-.5)*cover+.5).rgb,ready);
  float edge=smoothstep(-.012-px,-.012,d);
  gl_FragColor=vec4(mix(c,vec3(1.),edge*.12),a);
}`;

    function createCardTexture(item: RibbonItem, img?: HTMLImageElement): THREE.CanvasTexture {
      const c = document.createElement('canvas');
      c.width = 960;
      c.height = 600;
      const ctx = c.getContext('2d');
      if (ctx) {
        const bgGrad = ctx.createLinearGradient(0, 0, 960, 600);
        bgGrad.addColorStop(0, '#1c2636');
        bgGrad.addColorStop(1, '#121822');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 960, 600);

        if (img && img.complete && img.naturalWidth > 0) {
          try {
            const ia = img.naturalWidth / img.naturalHeight;
            const ca = 960 / 600;
            let dw = 960;
            let dh = 600;
            let dx = 0;
            let dy = 0;
            if (ia > ca) {
              dw = 600 * ia;
              dx = (960 - dw) / 2;
            } else {
              dh = 960 / ia;
              dy = (600 - dh) / 2;
            }
            ctx.drawImage(img, dx, dy, dw, dh);
            const scrim = ctx.createLinearGradient(0, 120, 0, 600);
            scrim.addColorStop(0, 'rgba(15,20,28,0.14)');
            scrim.addColorStop(1, 'rgba(15,20,28,0.92)');
            ctx.fillStyle = scrim;
            ctx.fillRect(0, 0, 960, 600);
          } catch {
            // Fallback to procedural card below
          }
        } else {
          ctx.strokeStyle = 'rgba(237, 242, 247, 0.08)';
          ctx.lineWidth = 1;
          for (let gx = 48; gx < 960; gx += 64) {
            ctx.beginPath();
            ctx.moveTo(gx, 0);
            ctx.lineTo(gx, 600);
            ctx.stroke();
          }
          for (let gy = 48; gy < 600; gy += 64) {
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(960, gy);
            ctx.stroke();
          }
        }

        // Accent bar
        ctx.fillStyle = item.accent;
        ctx.fillRect(48, 48, 42, 3);

        // Badge
        ctx.font = '500 20px "IBM Plex Mono", monospace';
        ctx.fillStyle = 'rgba(237, 242, 247, 0.78)';
        ctx.fillText(item.badge, 48, 94);

        // Title (wrapped cleanly)
        ctx.font = '600 42px "Inter", system-ui, sans-serif';
        ctx.fillStyle = '#edf2f7';
        const words = item.title.split(' ');
        let line = '';
        let y = 435;
        const lines: string[] = [];
        for (const w of words) {
          const test = line ? `${line} ${w}` : w;
          if (ctx.measureText(test).width > 840) {
            lines.push(line);
            line = w;
          } else {
            line = test;
          }
        }
        if (line) lines.push(line);
        lines.slice(0, 2).forEach((ln, idx) => {
          ctx.fillText(ln, 48, y + idx * 50);
        });

        ctx.font = '400 22px "Inter", system-ui, sans-serif';
        ctx.fillStyle = 'rgba(237, 242, 247, 0.78)';
        ctx.fillText(item.subtitle, 48, 545);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.NoColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      return tex;
    }

    const cards = items.map((item, i) => {
      const tex = createCardTexture(item);
      if (item.thumbnailUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const updated = createCardTexture(item, img);
          mat.uniforms.map.value = updated;
          tex.dispose();
          cObj.tex = updated;
        };
        img.src = item.thumbnailUrl;
      }

      const geo = new THREE.PlaneGeometry(1, 1, NX, NY);
      const mat = new THREE.ShaderMaterial({
        vertexShader: vs,
        fragmentShader: fs,
        transparent: true,
        side: THREE.DoubleSide,
        uniforms: {
          map: { value: tex },
          cover: { value: new THREE.Vector2(1, 1) },
          aspect: { value: CARD_W / CARD_H },
          ready: { value: 1 },
          radius: { value: 0.018 },
        },
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      scene.add(mesh);
      const cObj = {
        i,
        item,
        tex,
        geo,
        mat,
        mesh,
        rect: null as {
          x: number;
          y: number;
          w: number;
          h: number;
          vw: number;
          vh: number;
          c: number;
          r: number;
        } | null,
      };
      return cObj;
    });

    const GZ = 8;
    let W = 1;
    let H = 1;
    let asp = 1;
    let cols = 3;
    let rows = 2;
    let tanH = 0.3153;

    const resize = () => {
      W = stage.clientWidth || window.innerWidth;
      H = stage.clientHeight || window.innerHeight;
      asp = W / H;
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
      renderer.setSize(W, H, false);
      camera.aspect = asp;
      camera.fov = asp < 16 / 9 ? (Math.atan(0.561 / asp) * 360) / Math.PI : FOV;
      camera.updateProjectionMatrix();
      tanH = Math.tan((camera.fov * Math.PI) / 360);
      cols = asp < 0.9 ? (cards.length <= 3 ? 1 : 2) : Math.min(3, Math.max(1, cards.length));
      rows = Math.max(1, Math.ceil(cards.length / cols));
    };
    resize();
    window.addEventListener('resize', resize);

    function grid(i: number) {
      const vh = 2 * GZ * tanH;
      const vw = vh * asp;
      const gw = vw * (cols === 3 ? 0.74 : 0.88);
      const gap = gw * 0.017;
      const cw = (gw - gap * (cols - 1)) / cols;
      const ch = cw / (CARD_W / CARD_H);
      const gh = ch * rows + gap * 1.6 * (rows - 1);
      const c = i % cols;
      const r = Math.floor(i / cols);
      return {
        x: -gw / 2 + cw / 2 + c * (cw + gap),
        y: gh / 2 - ch / 2 - r * (ch + gap * 1.6),
        w: cw,
        h: ch,
        vw,
        vh,
        c,
        r,
      };
    }

    let target = 0;
    let p = 0;
    let inView = false;

    const readScroll = () => {
      const rect = track.getBoundingClientRect();
      const scrollable = Math.max(1, track.offsetHeight - stage.offsetHeight);
      target = clamp(-rect.top / scrollable);
    };
    window.addEventListener('scroll', readScroll, { passive: true });
    readScroll();

    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? false;
      },
      { threshold: 0.01 }
    );
    observer.observe(track);

    const op = new THREE.Vector3();
    const ot = new THREE.Vector3();
    const up = new THREE.Vector3();
    const Y = new THREE.Vector3(0, 1, 0);
    const vp = new THREE.Vector3();

    function poseRibbon(c: (typeof cards)[number], head: number) {
      const pos = c.geo.attributes.position;
      const centre = head - c.i * STEP;
      for (let iy = 0; iy <= NY; iy++) {
        for (let ix = 0; ix <= NX; ix++) {
          const k = iy * (NX + 1) + ix;
          const lu = ix / NX - 0.5;
          const lv = 0.5 - iy / NY;
          at(centre + lu * CARD_W, op, ot);
          up.copy(Y).addScaledVector(ot, -Y.dot(ot)).normalize();
          vp.copy(op).addScaledVector(up, lv * CARD_H);
          pos.setXYZ(k, vp.x, vp.y, vp.z);
        }
      }
      pos.needsUpdate = true;
    }

    function poseGrid(c: (typeof cards)[number], q: number) {
      const g = grid(c.i);
      const pos = c.geo.attributes.position;
      const dx = (g.c - (cols - 1) / 2) * 1.2;
      const dy = rows === 1 ? -1 : g.r < rows / 2 ? 1 : -1;
      const ox = dx * g.vw * 0.62 * (1 - q);
      const oy = dy * g.vh * (g.c === 1 ? 0.95 : 0.34) * (1 - q);
      const tilt = (1 - q) * 0.22 * (g.c - 1 || 0.5) * dy;
      const cs = Math.cos(tilt);
      const sn = Math.sin(tilt);
      for (let iy = 0; iy <= NY; iy++) {
        for (let ix = 0; ix <= NX; ix++) {
          const k = iy * (NX + 1) + ix;
          const x = (ix / NX - 0.5) * g.w;
          const y = (0.5 - iy / NY) * g.h;
          pos.setXYZ(
            k,
            g.x + ox + x * cs - y * sn,
            g.y + oy + x * sn + y * cs,
            -GZ - (1 - q) * 0.6 * Math.sin((ix / NX) * Math.PI)
          );
        }
      }
      pos.needsUpdate = true;
      c.rect = g;
    }

    const RIB_A = 0.14;
    const RIB_B = 0.63;

    const renderFrame = () => {
      const pp = p;
      const rise = 1 - out(span(pp, 0, 0.12));
      const run = mix(-50, 76, span(pp, 0, 0.58));
      if (l1Ref.current) {
        l1Ref.current.style.transform = `translate3d(${run}vw,${rise * 34}vh,0)`;
      }
      if (l2Ref.current) {
        l2Ref.current.style.transform = `translate3d(${-run}vw,${rise * 34}vh,0)`;
      }
      const capA = 1 - span(pp, 0.52, 0.57);
      if (capRef.current) {
        capRef.current.style.opacity = String(capA);
        capRef.current.style.transform = `translate(-50%,calc(-50% + ${rise * 34}vh))`;
      }
      const intro = 1 - span(pp, 0, 0.05);
      introRefs.current.forEach((el) => {
        if (el) el.style.opacity = String(intro);
      });
      if (ruleRef.current) {
        ruleRef.current.style.opacity = rows > 1 ? '1' : '0';
        ruleRef.current.style.transform = `scaleX(${ease(span(pp, 0.72, 0.86))})`;
      }

      const pr = span(pp, RIB_A, RIB_B);
      const head = mix(0, PATH_L + cards.length * STEP, pr);
      for (const c of cards) {
        const s = head - c.i * STEP;
        const end = PATH_L - CARD_W;
        if (s < end) {
          c.mesh.visible = s > CARD_W;
          c.rect = null;
          if (c.mesh.visible) poseRibbon(c, head);
        } else if (c.i < cols * rows) {
          const st = mix(RIB_A, RIB_B, (end + c.i * STEP) / (PATH_L + cards.length * STEP));
          const q = out(span(pp, st, st + 0.13));
          c.mesh.visible = q > 0.001;
          if (c.mesh.visible) poseGrid(c, q);
        } else {
          c.mesh.visible = false;
          c.rect = null;
        }
      }
      renderer.render(scene, camera);
    };

    let hoveredCard: (typeof cards)[number] | null = null;
    const handlePointerMove = (e: PointerEvent) => {
      let hit: (typeof cards)[number] | null = null;
      if (p > 0.8) {
        const rect = stage.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / W - 0.5;
        const ny = 0.5 - (e.clientY - rect.top) / H;
        for (const c of cards) {
          const g = c.rect;
          if (!g) continue;
          const x = nx * g.vw;
          const y = ny * g.vh;
          if (Math.abs(x - g.x) < g.w / 2 && Math.abs(y - g.y) < g.h / 2) hit = c;
        }
      }
      hoveredCard = hit;
      stage.style.cursor = hit ? 'pointer' : 'default';
      if (nameRef.current) {
        nameRef.current.style.opacity = hit ? '1' : '0';
        if (hit) {
          nameRef.current.textContent = `${hit.item.title} ↗`;
          nameRef.current.style.transform = `translate(${e.clientX + 14}px,${e.clientY + 16}px)`;
        }
      }
    };

    const handleClick = () => {
      if (!hoveredCard) return;
      if (hoveredCard.item.url) {
        window.open(hoveredCard.item.url, '_blank', 'noopener,noreferrer');
      } else if (hoveredCard.item.route) {
        onNavigate(hoveredCard.item.route);
      }
    };

    stage.addEventListener('pointermove', handlePointerMove);
    stage.addEventListener('click', handleClick);

    let frameId = 0;
    let disposed = false;

    const loop = () => {
      if (disposed) return;
      if (inView || Math.abs(target - p) > 0.001) {
        p += (target - p) * 0.09;
        if (Math.abs(target - p) < 0.00005) p = target;
        renderFrame();
      }
      if (isSoftwareGl) {
        afterDraw(renderer, loop, (id) => {
          frameId = id;
        });
      } else {
        frameId = requestAnimationFrame(loop);
      }
    };
    loop();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      observer.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', readScroll);
      stage.removeEventListener('pointermove', handlePointerMove);
      stage.removeEventListener('click', handleClick);
      for (const c of cards) {
        c.geo.dispose();
        c.mat.dispose();
        c.tex.dispose();
      }
      renderer.dispose();
    };
  }, [reducedMotion, videos]);

  if (reducedMotion) {
    return (
      <section className="py-24 px-6 max-w-[1360px] mx-auto">
        <div className="mb-10">
          <p className="text-xs font-mono-tech uppercase tracking-[0.2em] text-[#7dd3fc] mb-3">
            CODE, CURIOSITY & CREATIVE STORIES
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[#edf2f7]">
            Stories in motion.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((it) => (
            <a
              key={it.title}
              href={it.url}
              target="_blank"
              rel="noopener noreferrer"
              className="portfolio-card portfolio-card-interactive p-6 flex flex-col justify-between"
            >
              <div>
                <p className="text-xs font-mono-tech text-[#8ca0b8] mb-2">{it.badge}</p>
                <h3 className="text-lg font-medium text-[#edf2f7]">{it.title}</h3>
                <p className="text-sm text-[#a2b3c7] mt-1">{it.subtitle}</p>
              </div>
            </a>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={trackRef}
      style={{ height: '300vh' }}
      className="relative bg-[#141b26] border-y border-[#283344]"
      aria-label="Stories in motion 3D ribbon showcase"
    >
      <div
        ref={stageRef}
        className="sticky top-0 h-screen overflow-hidden bg-[#141b26]"
      >
        <div
          ref={l1Ref}
          aria-hidden="true"
          className="font-display absolute left-0 right-0 text-center font-medium whitespace-nowrap pointer-events-none select-none"
          style={{
            top: 'calc(50% - 0.98em)',
            fontSize: 'clamp(40px, 6.7vw, 130px)',
            lineHeight: 1,
            letterSpacing: '-0.055em',
          }}
        >
          <span className="inline-block mr-[15vw] text-[#edf2f7]">STORIES IN</span>
        </div>
        <div
          ref={l2Ref}
          aria-hidden="true"
          className="font-display absolute left-0 right-0 text-center font-medium whitespace-nowrap pointer-events-none select-none"
          style={{
            top: 'calc(50% + 0.03em)',
            fontSize: 'clamp(40px, 6.7vw, 130px)',
            lineHeight: 1,
            letterSpacing: '-0.055em',
          }}
        >
          <span className="inline-block ml-[15vw] text-[#edf2f7]">MOTION</span>
        </div>

        <div
          ref={capRef}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[18em] text-center text-[11px] sm:text-xs font-medium leading-[1.35] tracking-[0.04em] uppercase text-[#a2b3c7] pointer-events-none"
        >
          CODE, CURIOSITY & CREATIVE STORIES BY @VAZUKOYT
        </div>

        <div
          ref={(el) => {
            introRefs.current[0] = el;
          }}
          className="absolute left-0 right-0 top-0 h-[42%] pointer-events-none"
          style={{
            background:
              'linear-gradient(rgba(125,211,252,0.06), rgba(125,211,252,0))',
          }}
        />
        <div
          ref={(el) => {
            introRefs.current[1] = el;
          }}
          className="absolute left-8 right-8 top-[37.5%] h-px bg-[#283344] pointer-events-none"
        >
          <span className="absolute left-1/2 -top-[0.65em] -ml-[0.3em] font-mono-tech text-[13px] text-[#8ca0b8] bg-[#141b26] px-1.5">
            +
          </span>
        </div>

        <div
          ref={ruleRef}
          className="absolute left-[3.5vw] right-[3.5vw] top-1/2 h-px bg-[#283344] origin-left scale-x-0 pointer-events-none"
        />

        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

        {/* Corner framing labels matching editorial stage */}
        <div className="absolute left-6 sm:left-8 top-6 right-6 sm:right-8 flex items-center justify-between pointer-events-none">
          <span className="font-mono-tech text-[11px] tracking-[0.12em] uppercase text-[#8ca0b8]">
            CREATIVE SHOWCASE · @VAZUKOYT
          </span>
          <button
            type="button"
            onClick={() => onNavigate('/youtube')}
            className="pointer-events-auto font-mono-tech text-[11px] tracking-[0.08em] uppercase text-[#edf2f7] hover:text-[#34d399] border-b border-[#3b4b63] pb-1 transition-colors cursor-pointer"
          >
            OPEN YOUTUBE STUDIO →
          </button>
        </div>

        <div className="absolute left-6 sm:left-8 right-6 sm:right-8 bottom-6 flex items-end justify-between text-xs pointer-events-none">
          <p className="max-w-[24em] text-[#a2b3c7] leading-snug">
            Scroll to sweep animated school story episodes across the 3D rail into the grid.
          </p>
          <span className="hidden md:block font-mono-tech text-[11px] tracking-[0.08em] text-[#8ca0b8]">
            ROBLOX STORIES / @VAZUKOYT / YOUTUBE
          </span>
        </div>

        <div
          ref={nameRef}
          className="fixed left-0 top-0 z-30 px-3 py-1.5 bg-[#34d399] text-[#071510] rounded-[6px] text-[11.5px] font-semibold tracking-[0.04em] pointer-events-none opacity-0 transition-opacity duration-150 whitespace-nowrap"
        />
      </div>
    </section>
  );
};
