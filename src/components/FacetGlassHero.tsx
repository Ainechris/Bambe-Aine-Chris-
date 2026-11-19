import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Menu, X } from 'lucide-react';
import type { Profile, RoutePath } from '../types/portfolio.ts';
import {
  afterDraw,
  buildRoundedPolygonShape,
  computeHomographyMatrix3d,
  createSafeWebGLRenderer,
  detectSoftwareWebGL,
  insetConvexPolygon,
  type Vec2,
} from '../lib/webglUtils.ts';
import { AnimatedHeading, TypingRoleTicker } from './AnimatedText.tsx';

interface FacetGlassHeroProps {
  profile: Profile;
  onNavigate: (path: RoutePath) => void;
  onExploreWork: () => void;
}

interface ShardDef {
  id: string;
  isNav?: boolean;
  pointIndices?: number[];
}

interface SpringState {
  z: number;
  vz: number;
  rx: number;
  vrx: number;
  ry: number;
  vry: number;
  hoverAmount: number;
}

interface ShatterParams {
  vx: number;
  vy: number;
  vz: number;
  gravity: number;
  axis: THREE.Vector3;
  angle: number;
  delay: number;
}

const SHARD_DEFS: ShardDef[] = [
  { id: 'nav', isNav: true },
  { id: 'A', pointIndices: [0, 1, 9, 7, 8] }, // TL, tAB, J0, bAD, BL (hero)
  { id: 'B', pointIndices: [1, 2, 10, 9] }, // tAB, tBC, J1, J0
  { id: 'C', pointIndices: [2, 3, 11, 10] }, // tBC, tCE, J2, J1
  { id: 'D', pointIndices: [9, 10, 11, 6, 7] }, // J0, J1, J2, bDE, bAD
  { id: 'E', pointIndices: [3, 4, 5, 6, 11] }, // tCE, TR, BR, bDE, J2
];

// Base normalized points in [0..1] (x right, y down)
const BASE_POINTS: Vec2[] = [
  { x: 0, y: 0 }, // 0: TL
  { x: 0.22, y: 0 }, // 1: tAB
  { x: 0.515, y: 0 }, // 2: tBC
  { x: 0.84, y: 0 }, // 3: tCE
  { x: 1, y: 0 }, // 4: TR
  { x: 1, y: 1 }, // 5: BR
  { x: 0.865, y: 1 }, // 6: bDE
  { x: 0.34, y: 1 }, // 7: bAD
  { x: 0, y: 1 }, // 8: BL
  { x: 0.385, y: 0.72 }, // 9: J0
  { x: 0.48, y: 0.62 }, // 10: J1
  { x: 0.716, y: 0.49 }, // 11: J2
];

// Drift periods & phases per point (10–20s periods)
const DRIFT_CONFIG = BASE_POINTS.map((_, idx) => ({
  isCorner: idx === 0 || idx === 4 || idx === 5 || idx === 8,
  isEdgeX: idx === 1 || idx === 2 || idx === 3 || idx === 6 || idx === 7,
  isJunction: idx >= 9,
  freqX: (2 * Math.PI) / (11 + (idx * 1.37) % 8.5),
  freqY: (2 * Math.PI) / (12.5 + (idx * 1.91) % 7.5),
  phaseX: idx * 1.13,
  phaseY: idx * 2.07,
}));

const FIVE_PILLARS = [
  {
    term: 'Intango TSS · L4 SOD',
    desc: 'Studying Software Development in Busanza, Nyarutarama, Rwanda (CLA), turning structured coursework into working applications and disciplined engineering habits.',
  },
  {
    term: 'SAMS Architecture',
    desc: 'A Flask and SQLite school attendance management system featuring a student check-in kiosk, controlled gate sessions, and role-based workspaces.',
  },
  {
    term: 'Node.js & Express APIs',
    desc: 'Building structured server-side endpoints, request validation, and persistent SQLite and MySQL workflows for real web applications.',
  },
  {
    term: 'Backend Direction',
    desc: 'Building toward backend development with Node.js, Express.js, MySQL, JavaScript, Git, and GitHub—focusing on clean APIs, validation, and relational data.',
  },
  {
    term: 'Stories in Motion',
    desc: 'Creating Roblox-style animated school stories on YouTube (@VazukoYT), pairing technical curiosity with clear pacing and storytelling.',
  },
];

function easeInCubic(t: number): number {
  return t * t * t;
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export const FacetGlassHero: React.FC<FacetGlassHeroProps> = ({
  profile,
  onNavigate,
  onExploreWork,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const navDomRef = useRef<HTMLDivElement>(null);
  const panelDomRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);

  const [webglDisabled, setWebglDisabled] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [shatteredView, setShatteredView] = useState<boolean>(false);
  const [manifestOpacity, setManifestOpacity] = useState<number>(0);
  const [backHovered, setBackHovered] = useState<boolean>(false);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

  // Interactive hover state shared between DOM hit targets and 3D printed CanvasTexture
  const hoverFlagsRef = useRef({
    exploreBtn: false,
    journeyLink: false,
    navIndex: -1, // 0..4 nav links, 5 github
    backSliver: false,
  });

  // Mutable animation controller ref so React handlers trigger 3D transitions without re-mounting WebGL
  const animControllerRef = useRef<{
    triggerShatter: () => void;
    triggerReassemble: () => void;
    redrawTextures: () => void;
  } | null>(null);

  // Layout dimensions state for the DOM homography overlay
  const [domBox, setDomBox] = useState({
    navW: 1100,
    navH: 76,
    panelW: 1100,
    panelH: 600,
    S: 1100 / 1730,
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setWebglDisabled(true);
      return;
    }

    const host = canvasHostRef.current;
    const container = containerRef.current;
    if (!host || !container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const maybeRenderer = createSafeWebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'default',
    });
    if (!maybeRenderer) {
      setWebglDisabled(true);
      return;
    }
    const renderer = maybeRenderer;

    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));

    host.innerHTML = '';
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglDisabled(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    const scene = new THREE.Scene();

    // PMREM RoomEnvironment
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    scene.environmentIntensity = 0.42;
    roomEnv.dispose();
    pmrem.dispose();

    // Soft white-blue key light from top-left + subtle sky fill
    const keyLight = new THREE.DirectionalLight(0xe4eeff, 2.1);
    keyLight.position.set(-700, 680, 900);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.65);
    rimLight.position.set(600, -450, 500);
    scene.add(rimLight);

    const FOV = 30;
    const camera = new THREE.PerspectiveCamera(FOV, 1, 10, 8000);

    // Master tilted slab group
    const blockGroup = new THREE.Group();
    scene.add(blockGroup);

    // Shared cursor-glow uniform state
    const pointerWorld = new THREE.Vector3(0, 0, 0);
    const glowUniforms = {
      uPointerWorld: { value: pointerWorld },
      uGlowStrength: { value: 0 },
      uGlowScale: { value: 260 },
    };

    function createSmokedGlassMaterial(
      withCursorGlow: boolean,
      baseIridescence: number
    ): THREE.MeshPhysicalMaterial {
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0x1b2432,
        roughness: 0.36,
        metalness: 0.04,
        clearcoat: 0.7,
        clearcoatRoughness: 0.12,
        specularIntensity: 0.7,
        iridescence: baseIridescence,
        iridescenceIOR: 1.3,
        iridescenceThicknessRange: [250, 650],
        envMapIntensity: 1.0,
      });

      if (withCursorGlow) {
        mat.onBeforeCompile = (shader) => {
          shader.uniforms.uPointerWorld = glowUniforms.uPointerWorld;
          shader.uniforms.uGlowStrength = glowUniforms.uGlowStrength;
          shader.uniforms.uGlowScale = glowUniforms.uGlowScale;

          shader.vertexShader =
            'varying vec3 vFacetWorldPos;\n' +
            shader.vertexShader.replace(
              '#include <worldpos_vertex>',
              `#include <worldpos_vertex>
               vFacetWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
            );

          shader.fragmentShader =
            `uniform vec3 uPointerWorld;
             uniform float uGlowStrength;
             uniform float uGlowScale;
             varying vec3 vFacetWorldPos;\n` +
            shader.fragmentShader.replace(
              '#include <emissivemap_fragment>',
              `#include <emissivemap_fragment>
               float dGlow = distance(vFacetWorldPos.xy, uPointerWorld.xy);
               float glowFalloff = exp(-1.6 * pow(dGlow / max(uGlowScale, 1.0), 2.0));
               totalEmissiveRadiance += vec3(0.20, 0.56, 0.48) * 0.14 * uGlowStrength * glowFalloff;`
            );
        };
      }
      return mat;
    }

    // Offscreen high-DPI canvases for printed glass typography
    const panelCanvas = document.createElement('canvas');
    const navCanvas = document.createElement('canvas');
    const panelTex = new THREE.CanvasTexture(panelCanvas);
    panelTex.colorSpace = THREE.SRGBColorSpace;
    panelTex.minFilter = THREE.LinearFilter;
    panelTex.magFilter = THREE.LinearFilter;
    const navTex = new THREE.CanvasTexture(navCanvas);
    navTex.colorSpace = THREE.SRGBColorSpace;
    navTex.minFilter = THREE.LinearFilter;
    navTex.magFilter = THREE.LinearFilter;

    const panelPrintMat = new THREE.MeshBasicMaterial({
      map: panelTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const navPrintMat = new THREE.MeshBasicMaterial({
      map: navTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    // Layout metrics updated on resize
    let W = container.clientWidth || window.innerWidth;
    let H = container.clientHeight || window.innerHeight;
    let blockW = 1000;
    let blockH = 700;
    let navW = 1000;
    let navH = 76;
    let panelW = 1000;
    let panelH = 610;
    let gapY = 14;
    let S = 1;
    let navCenterY = 0;
    let panelCenterY = 0;

    // Build 6 piece groups (nav + A, B, C, D, E)
    interface PieceRuntime {
      def: ShardDef;
      group: THREE.Group;
      glassMesh: THREE.Mesh;
      printMesh: THREE.Mesh;
      mat: THREE.MeshPhysicalMaterial;
      spring: SpringState;
      shatter: ShatterParams;
      homeX: number;
      homeY: number;
    }

    const pieces: PieceRuntime[] = SHARD_DEFS.map((def, idx) => {
      const group = new THREE.Group();
      const mat = createSmokedGlassMaterial(true, 0.55);
      const glassMesh = new THREE.Mesh(new THREE.BufferGeometry(), mat);
      const printMesh = new THREE.Mesh(
        new THREE.BufferGeometry(),
        def.isNav ? navPrintMat : panelPrintMat
      );
      printMesh.renderOrder = 2;
      glassMesh.userData.pieceIndex = idx;
      group.add(glassMesh);
      group.add(printMesh);
      blockGroup.add(group);

      const angleDir = (idx / SHARD_DEFS.length) * Math.PI * 2 + 0.4;
      return {
        def,
        group,
        glassMesh,
        printMesh,
        mat,
        spring: { z: 0, vz: 0, rx: 0, vrx: 0, ry: 0, vry: 0, hoverAmount: 0 },
        shatter: {
          vx: (def.isNav ? 0.15 : Math.cos(angleDir)) * (260 + idx * 45),
          vy: def.isNav ? 280 : -220 - idx * 55,
          vz: 460 + idx * 65,
          gravity: 1100,
          axis: new THREE.Vector3(
            Math.sin(idx * 1.9 + 0.5),
            Math.cos(idx * 2.3 + 0.3),
            0.4
          ).normalize(),
          angle: 2.2 + (idx % 3) * 0.65,
          delay: def.isNav ? 0 : idx * 0.032,
        },
        homeX: 0,
        homeY: 0,
      };
    });

    // "← Back" 3D smoked-glass sliver
    const backSliverGroup = new THREE.Group();
    backSliverGroup.visible = false;
    scene.add(backSliverGroup);
    const backSliverMat = createSmokedGlassMaterial(false, 0.35);
    const backSliverMesh = new THREE.Mesh(new THREE.BufferGeometry(), backSliverMat);
    backSliverGroup.add(backSliverMesh);

    const backCanvas = document.createElement('canvas');
    const backTex = new THREE.CanvasTexture(backCanvas);
    backTex.colorSpace = THREE.SRGBColorSpace;
    const backPrintMat = new THREE.MeshBasicMaterial({
      map: backTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const backPrintMesh = new THREE.Mesh(new THREE.BufferGeometry(), backPrintMat);
    backSliverGroup.add(backPrintMesh);

    function drawNavCanvas(): void {
      const dpr = Math.max(window.devicePixelRatio || 1.5, 2);
      const cw = Math.max(2, Math.round(navW * dpr));
      const ch = Math.max(2, Math.round(navH * dpr));
      if (navCanvas.width !== cw || navCanvas.height !== ch) {
        navCanvas.width = cw;
        navCanvas.height = ch;
      }
      const ctx = navCanvas.getContext('2d');
      if (!ctx) return;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, navW, navH);

      const padX = Math.max(18, 36 * S);
      const cy = navH * 0.5;
      const markSize = Math.max(12, 16 * S);

      // Geometric square mark + Brand Name
      ctx.strokeStyle = 'rgba(243, 246, 255, 0.78)';
      ctx.lineWidth = Math.max(1.2, 1.8 * S);
      ctx.strokeRect(padX, cy - markSize / 2, markSize, markSize);
      ctx.fillStyle = '#5df0a8';
      ctx.fillRect(
        padX + markSize * 0.28,
        cy - markSize * 0.22,
        markSize * 0.44,
        markSize * 0.44
      );

      const brandFontSize = Math.max(12, 17 * S);
      ctx.font = `600 ${brandFontSize}px "Plus Jakarta Sans", "Inter", system-ui, sans-serif`;
      ctx.fillStyle = '#f3f6ff';
      ctx.textBaseline = 'middle';
      ctx.fillText('Bambe Aine Chris', padX + markSize + Math.max(10, 14 * S), cy + 0.5);

      // Center links (desktop widths)
      if (navW > 640) {
        const brandLabel = 'Bambe Aine Chris';
        const brandEndX = padX + markSize + Math.max(10, 14 * S) + ctx.measureText(brandLabel).width;
        const rightPreviewSize = Math.max(11, 14 * S);
        ctx.font = `500 ${rightPreviewSize}px "Inter", system-ui, sans-serif`;
        const rightStartX = navW - padX - ctx.measureText('GitHub ↗').width;

        const links = ['Home', 'About', 'Skills', 'Projects', 'YouTube', 'Contact'];
        const linkSize = Math.max(11, 14 * S);
        ctx.font = `500 ${linkSize}px "Inter", system-ui, sans-serif`;
        const gap = Math.max(12, 26 * S);
        const widths = links.map((l) => ctx.measureText(l).width);
        const totalW = widths.reduce((a, b) => a + b, 0) + gap * (links.length - 1);
        const minLx = brandEndX + 20;
        const maxLx = rightStartX - 20 - totalW;
        let lx = Math.max(minLx, Math.min(maxLx, navW * 0.54 - totalW / 2));
        links.forEach((label, idx) => {
          const isActiveOrHover = idx === 0 || hoverFlagsRef.current.navIndex === idx;
          ctx.fillStyle = isActiveOrHover ? '#5df0a8' : '#9aa6c4';
          ctx.fillText(label, lx, cy + 0.5);
          lx += widths[idx] + gap;
        });
      }

      // Right link: GitHub (leave room for mobile drawer trigger on <= 640px)
      const rightSize = Math.max(11, 14 * S);
      ctx.font = `500 ${rightSize}px "Inter", system-ui, sans-serif`;
      const rightLabel = 'GitHub ↗';
      const rw = ctx.measureText(rightLabel).width;
      const mobileMenuReserve = navW <= 640 ? 40 : 0;
      ctx.fillStyle = hoverFlagsRef.current.navIndex === 6 ? '#5df0a8' : '#f3f6ff';
      ctx.fillText(rightLabel, navW - padX - rw - mobileMenuReserve, cy + 0.5);

      ctx.restore();
      navTex.needsUpdate = true;
    }

    function drawPanelCanvas(): void {
      const dpr = Math.max(window.devicePixelRatio || 1.5, 2);
      const cw = Math.max(2, Math.round(panelW * dpr));
      const ch = Math.max(2, Math.round(panelH * dpr));
      if (panelCanvas.width !== cw || panelCanvas.height !== ch) {
        panelCanvas.width = cw;
        panelCanvas.height = ch;
      }
      const ctx = panelCanvas.getContext('2d');
      if (!ctx) return;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, panelW, panelH);

      const isCompact = panelW < 620;
      const padX = isCompact ? Math.max(22, panelW * 0.075) : Math.max(36, 76 * S);

      // 1. Eyebrow at 13.5% height
      const eyebrowY = panelH * 0.135;
      const eyebrowSize = Math.max(9.5, 11.5 * S);
      ctx.font = `500 ${eyebrowSize}px "IBM Plex Mono", monospace`;
      ctx.fillStyle = '#5df0a8';
      ctx.textBaseline = 'middle';
      drawTrackedText(
        ctx,
        'SEEKING INTERNSHIP OPPORTUNITIES · RWANDA',
        padX,
        eyebrowY,
        eyebrowSize * 0.14
      );

      // 2. Headline
      const headSize = Math.max(32, Math.min(panelW * 0.068, panelH * 0.175));
      const lineHeight = headSize * 0.99;
      const headStartY = eyebrowY + Math.max(30, panelH * 0.085);
      ctx.font = `600 ${headSize}px "Plus Jakarta Sans", "Inter", system-ui, sans-serif`;
      ctx.textBaseline = 'top';

      const grad = ctx.createLinearGradient(0, headStartY, 0, headStartY + lineHeight * 2);
      grad.addColorStop(0, '#f3f6ff');
      grad.addColorStop(1, '#c5d2e2');
      ctx.fillStyle = grad;

      drawTrackedText(ctx, 'Bambe Aine', padX, headStartY, -headSize * 0.035);
      drawTrackedText(ctx, 'Chris.', padX, headStartY + lineHeight, -headSize * 0.035);

      // 3. Two-line subtext (comfortable AA slate contrast)
      const subSize = Math.max(12.5, Math.min(17.5 * S, panelW * 0.022));
      const subY = headStartY + lineHeight * 2 + Math.max(20, 28 * S);
      ctx.font = `400 ${subSize}px "Inter", system-ui, sans-serif`;
      ctx.fillStyle = '#9aa6c4';
      const line1 = 'Student software developer & aspiring backend engineer.';
      const line2 = 'Building REST APIs, MySQL schemas, SAMS, and web systems.';
      ctx.fillText(line1, padX, subY);
      ctx.fillText(line2, padX, subY + subSize * 1.48);

      // 4. Primary button ("View Projects") + Underlined link ("Read journey →")
      const btnY = subY + subSize * 3.4 + Math.max(10, 14 * S);
      const btnW = Math.max(134, 158 * S);
      const btnH = Math.max(38, 42 * S);
      const btnR = Math.max(6, 7 * S);

      ctx.fillStyle = hoverFlagsRef.current.exploreBtn ? '#73f5b5' : '#5df0a8';
      roundRectPath(ctx, padX, btnY, btnW, btnH, btnR);
      ctx.fill();

      const btnFontSize = Math.max(12, 13.5 * S);
      ctx.font = `600 ${btnFontSize}px "Inter", system-ui, sans-serif`;
      ctx.fillStyle = '#032018';
      ctx.textBaseline = 'middle';
      const btnLabel = 'View Projects';
      const btnLabelW = ctx.measureText(btnLabel).width;
      ctx.fillText(btnLabel, padX + (btnW - btnLabelW) / 2, btnY + btnH / 2 + 0.5);

      // Secondary link: "Read journey →"
      const linkX = padX + btnW + Math.max(18, 28 * S);
      const linkLabel = 'Read journey →';
      ctx.font = `500 ${btnFontSize}px "Inter", system-ui, sans-serif`;
      ctx.fillStyle = hoverFlagsRef.current.journeyLink ? '#7dd3fc' : '#f3f6ff';
      ctx.fillText(linkLabel, linkX, btnY + btnH / 2 + 0.5);
      if (hoverFlagsRef.current.journeyLink) {
        const lw = ctx.measureText(linkLabel).width;
        ctx.fillRect(linkX, btnY + btnH / 2 + btnFontSize * 0.65, lw, 1.2);
      }

      // 4b. Right-column JSON Developer Profile Terminal Card (desktop widths)
      if (panelW >= 820) {
        const cardW = Math.min(panelW * 0.36, 460 * S + 80);
        const cardH = Math.min(panelH * 0.56, Math.max(212, 260 * S + 44));
        const cardX = panelW - padX - cardW;
        const cardY = (panelH - cardH) * 0.49;

        ctx.fillStyle = 'rgba(6, 10, 24, 0.78)';
        roundRectPath(ctx, cardX, cardY, cardW, cardH, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(150, 175, 230, 0.22)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Terminal window header bar
        const barH = Math.max(28, 30 * S);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        roundRectPath(ctx, cardX, cardY, cardW, barH, 12);
        ctx.fill();
        const barLabelSize = Math.max(10, 11 * S);
        ctx.font = `500 ${barLabelSize}px "IBM Plex Mono", monospace`;
        ctx.fillStyle = '#9aa6c4';
        ctx.textBaseline = 'middle';
        ctx.fillText('developer-profile.json', cardX + 18, cardY + barH / 2 + 0.5);

        const codeSize = Math.max(10.5, 13 * S);
        ctx.font = `400 ${codeSize}px "IBM Plex Mono", monospace`;
        ctx.textBaseline = 'top';
        const codePadX = cardX + 18;
        let cy = cardY + barH + Math.max(14, 18 * S);
        const stepY = codeSize * 1.62;

        const drawJsonLine = (keyText: string | null, valText: string) => {
          let x = codePadX;
          if (keyText) {
            ctx.fillStyle = '#7dd3fc';
            ctx.fillText(keyText, x, cy);
            x += ctx.measureText(keyText).width;
          }
          ctx.fillStyle = keyText ? '#5df0a8' : '#9aa6c4';
          ctx.fillText(valText, x, cy);
          cy += stepY;
        };

        drawJsonLine(null, '{');
        drawJsonLine('  "name": ', '"Bambe Aine Chris",');
        drawJsonLine('  "role": ', '"Student Developer",');
        drawJsonLine('  "school": ', '"Intango TSS · L4 SOD",');
        drawJsonLine('  "focus": ', '"Backend Development",');
        drawJsonLine('  "stack": ', '["Node.js", "Express", "MySQL"],');
        drawJsonLine('  "building": ', '["SAMS", "REST APIs"]');
        drawJsonLine(null, '}');
      }

      // 5. Bottom-left & Bottom-right metadata
      const footSize = Math.max(10, 11.5 * S);
      const footY = panelH - Math.max(20, 30 * S);
      ctx.font = `400 ${footSize}px "IBM Plex Mono", monospace`;
      ctx.fillStyle = '#9aa6c4';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Intango TSS · Busanza, Nyarutarama, Rwanda', padX, footY);

      const rightFoot = 'Node.js · Express.js · MySQL · Git';
      const rfw = ctx.measureText(rightFoot).width;
      ctx.fillText(rightFoot, panelW - padX - rfw, footY);

      ctx.restore();
      panelTex.needsUpdate = true;
    }

    function drawBackSliverCanvas(): void {
      const dpr = Math.max(window.devicePixelRatio || 1.5, 2);
      const cw = 360;
      const ch = 160;
      if (backCanvas.width !== cw * dpr || backCanvas.height !== ch * dpr) {
        backCanvas.width = cw * dpr;
        backCanvas.height = ch * dpr;
      }
      const ctx = backCanvas.getContext('2d');
      if (!ctx) return;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, cw, ch);
      const fontSize = Math.max(13, W * 0.0066 * 1.45);
      ctx.font = `500 ${fontSize}px "Inter", system-ui, sans-serif`;
      ctx.fillStyle = hoverFlagsRef.current.backSliver ? '#5df0a8' : '#f3f6ff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('← Back', cw / 2, ch / 2);
      ctx.restore();
      backTex.needsUpdate = true;
    }

    function roundRectPath(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ): void {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    function drawTrackedText(
      ctx: CanvasRenderingContext2D,
      text: string,
      x: number,
      y: number,
      tracking: number
    ): void {
      let curX = x;
      for (const ch of text) {
        ctx.fillText(ch, curX, y);
        curX += ctx.measureText(ch).width + tracking;
      }
    }

    // Current dynamic pointer in panel-normalized space [0..1]
    const pointerNorm = { x: 0.5, y: 0.5, active: false };
    const pointerNDC = new THREE.Vector2(0, 0);
    let glowStrength = 0;

    // Build / rebuild shard geometries
    function rebuildShardGeometries(elapsedSec: number): void {
      const depth = 13 * S;
      const bevel = 2.6 * S;
      const cornerR = 20 * S;
      const halfGap = 7 * S;
      const insetDist = halfGap + bevel;
      const topZ = depth / 2 + bevel + 0.35;

      // 1. Nav slab geometry
      const navPiece = pieces[0];
      navPiece.homeX = 0;
      navPiece.homeY = navCenterY;
      const navPts: Vec2[] = [
        { x: -navW / 2 + bevel, y: -navH / 2 + bevel },
        { x: navW / 2 - bevel, y: -navH / 2 + bevel },
        { x: navW / 2 - bevel, y: navH / 2 - bevel },
        { x: -navW / 2 + bevel, y: navH / 2 - bevel },
      ];
      const navShape = buildRoundedPolygonShape(navPts, cornerR);
      const navGeo = new THREE.ExtrudeGeometry(navShape, {
        depth,
        bevelEnabled: true,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 3,
        curveSegments: 8,
      });
      navGeo.translate(0, 0, -depth / 2);
      navPiece.glassMesh.geometry.dispose();
      navPiece.glassMesh.geometry = navGeo;

      const navPrintShape = buildRoundedPolygonShape(
        [
          { x: -navW / 2 + 1, y: -navH / 2 + 1 },
          { x: navW / 2 - 1, y: -navH / 2 + 1 },
          { x: navW / 2 - 1, y: navH / 2 - 1 },
          { x: -navW / 2 + 1, y: navH / 2 - 1 },
        ],
        cornerR
      );
      const navPrintGeo = new THREE.ShapeGeometry(navPrintShape, 8);
      const navPos = navPrintGeo.attributes.position;
      const navUv = new Float32Array(navPos.count * 2);
      for (let i = 0; i < navPos.count; i++) {
        navUv[i * 2] = navPos.getX(i) / navW + 0.5;
        navUv[i * 2 + 1] = navPos.getY(i) / navH + 0.5;
      }
      navPrintGeo.setAttribute('uv', new THREE.BufferAttribute(navUv, 2));
      navPrintGeo.translate(0, 0, topZ);
      navPiece.printMesh.geometry.dispose();
      navPiece.printMesh.geometry = navPrintGeo;

      // 2. Compute live drifted + cursor-pushed normalized points
      const portrait = panelH > panelW;
      const liveNormPts: Vec2[] = BASE_POINTS.map((bp, idx) => {
        const cfg = DRIFT_CONFIG[idx];
        let nx = bp.x;
        let ny = bp.y;

        if (!cfg.isCorner) {
          if (cfg.isEdgeX || cfg.isJunction) {
            nx += Math.sin(elapsedSec * cfg.freqX + cfg.phaseX) * 0.03;
          }
          if (cfg.isJunction) {
            ny += Math.sin(elapsedSec * cfg.freqY + cfg.phaseY) * 0.05;
          }

          if (pointerNorm.active) {
            const px = portrait ? pointerNorm.y : pointerNorm.x;
            const py = portrait ? pointerNorm.x : pointerNorm.y;
            const dx = nx - px;
            const dy = ny - py;
            const dist = Math.hypot(dx, dy);
            if (dist > 0.001 && dist < 0.6) {
              const push = (1 - dist / 0.6) * 0.05;
              if (cfg.isEdgeX || cfg.isJunction) {
                nx += (dx / dist) * push;
              }
              if (cfg.isJunction) {
                ny += (dy / dist) * push;
              }
            }
          }

          // Clamp safely so edge junctions stay strictly ordered
          nx = Math.max(0.08, Math.min(0.92, nx));
          if (cfg.isJunction) {
            ny = Math.max(0.14, Math.min(0.86, ny));
          }
        }

        return portrait ? { x: ny, y: nx } : { x: nx, y: ny };
      });

      // Keep top/bottom edge points monotonically ordered so cells stay convex
      if (portrait) {
        liveNormPts[2].y = Math.max(liveNormPts[1].y + 0.14, liveNormPts[2].y);
        liveNormPts[3].y = Math.max(liveNormPts[2].y + 0.14, liveNormPts[3].y);
        liveNormPts[6].y = Math.max(liveNormPts[7].y + 0.18, liveNormPts[6].y);
      } else {
        liveNormPts[2].x = Math.max(liveNormPts[1].x + 0.14, liveNormPts[2].x);
        liveNormPts[3].x = Math.max(liveNormPts[2].x + 0.14, liveNormPts[3].x);
        liveNormPts[6].x = Math.max(liveNormPts[7].x + 0.18, liveNormPts[6].x);
      }

      // 3. Build 5 shard cells (A, B, C, D, E)
      for (let pIdx = 1; pIdx < pieces.length; pIdx++) {
        const piece = pieces[pIdx];
        piece.homeX = 0;
        piece.homeY = panelCenterY;
        const rawWorldPts: Vec2[] = (piece.def.pointIndices || []).map((ptIdx) => {
          const n = liveNormPts[ptIdx];
          return {
            x: (n.x - 0.5) * panelW,
            y: (0.5 - n.y) * panelH,
          };
        });

        const insetPts = insetConvexPolygon(rawWorldPts, insetDist);
        const glassShape = buildRoundedPolygonShape(insetPts, cornerR);
        const glassGeo = new THREE.ExtrudeGeometry(glassShape, {
          depth,
          bevelEnabled: true,
          bevelThickness: bevel,
          bevelSize: bevel,
          bevelSegments: 3,
          curveSegments: 8,
        });
        glassGeo.translate(0, 0, -depth / 2);
        piece.glassMesh.geometry.dispose();
        piece.glassMesh.geometry = glassGeo;

        // Top printed overlay mapped to full panel canvas UV space
        const printInsetPts = insetConvexPolygon(rawWorldPts, halfGap + bevel * 0.45);
        const printShape = buildRoundedPolygonShape(printInsetPts, cornerR);
        const printGeo = new THREE.ShapeGeometry(printShape, 8);
        const posAttr = printGeo.attributes.position;
        const uvArr = new Float32Array(posAttr.count * 2);
        for (let k = 0; k < posAttr.count; k++) {
          const vx = posAttr.getX(k);
          const vy = posAttr.getY(k);
          uvArr[k * 2] = vx / panelW + 0.5;
          uvArr[k * 2 + 1] = vy / panelH + 0.5;
        }
        printGeo.setAttribute('uv', new THREE.BufferAttribute(uvArr, 2));
        printGeo.translate(0, 0, topZ);
        piece.printMesh.geometry.dispose();
        piece.printMesh.geometry = printGeo;
      }
    }

    function rebuildBackSliverGeometry(): void {
      const k = W / 1918;
      // Viewport fractions: (.147,.243) (.252,.169) (.287,.277) (.151,.258)
      const cx = 0.219;
      const cy = 0.238;
      const rawFrac: Vec2[] = [
        { x: 0.147, y: 0.243 },
        { x: 0.252, y: 0.169 },
        { x: 0.287, y: 0.277 },
        { x: 0.151, y: 0.258 },
      ];
      const localPts: Vec2[] = rawFrac.map((pt) => ({
        x: (pt.x - cx) * W,
        y: (cy - pt.y) * H,
      }));
      const sliverDepth = Math.max(4, 11 * k);
      const sliverBevel = Math.max(1.2, 2.2 * k);
      const sliverR = Math.max(6, 14 * k);
      const shape = buildRoundedPolygonShape(localPts, sliverR);
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: sliverDepth,
        bevelEnabled: true,
        bevelThickness: sliverBevel,
        bevelSize: sliverBevel,
        bevelSegments: 2,
        curveSegments: 8,
      });
      geo.translate(0, 0, -sliverDepth / 2);
      backSliverMesh.geometry.dispose();
      backSliverMesh.geometry = geo;

      // Print label plane centered on sliver
      const planeW = Math.max(120, W * 0.11);
      const planeH = planeW * (160 / 360);
      const pGeo = new THREE.PlaneGeometry(planeW, planeH);
      pGeo.translate(0, 0, sliverDepth / 2 + sliverBevel + 0.5);
      backPrintMesh.geometry.dispose();
      backPrintMesh.geometry = pGeo;

      backSliverGroup.position.set((cx - 0.5) * W, (0.5 - cy) * H, 10);
    }

    function updateResize(): void {
      W = container?.clientWidth || window.innerWidth;
      H = container?.clientHeight || window.innerHeight;
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
      renderer.setSize(W, H, false);

      camera.aspect = W / H;
      camera.fov = FOV;
      camera.position.set(0, 0, H / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2))));
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();

      const isPhone = W < 640;
      const sideMargin = isPhone ? 16 : W * 0.055;
      const topBottomMargin = isPhone ? 16 : H * 0.085;
      blockW = Math.max(280, W - sideMargin * 2);
      blockH = Math.max(420, H - topBottomMargin * 2);
      S = blockW / 1730;
      gapY = 14;
      navH = blockH * 0.108;
      panelH = blockH - navH - gapY;
      navW = blockW;
      panelW = blockW;

      navCenterY = blockH / 2 - navH / 2;
      panelCenterY = -blockH / 2 + panelH / 2;

      glowUniforms.uGlowScale.value = 300 * S;

      setDomBox({ navW, navH, panelW, panelH, S });
      drawNavCanvas();
      drawPanelCanvas();
      drawBackSliverCanvas();
      rebuildShardGeometries(0);
      rebuildBackSliverGeometry();
    }

    updateResize();
    window.addEventListener('resize', updateResize);

    // Interaction & animation state
    let mode: 'entering' | 'idle' | 'shattering' | 'shattered' | 'reassembling' = 'entering';
    let modeTime = 0;
    const SHATTER_DUR = 0.72;

    let targetRotX = 0.8 * (Math.PI / 180);
    let targetRotY = -1.2 * (Math.PI / 180);
    let currentRotX = targetRotX;
    let currentRotY = targetRotY;
    let hoveredPieceIdx = -1;

    const raycaster = new THREE.Raycaster();
    const hitPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const tmpVec = new THREE.Vector3();
    const tmpCorner = new THREE.Vector3();

    const glassMeshes = pieces.map((p) => p.glassMesh);

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      pointerNDC.set(nx, ny);

      // Global tilt: rotateY = x * 7° - 1.2°, rotateX = -y * 5.5° + 0.8°
      targetRotY = THREE.MathUtils.degToRad(nx * 7 - 1.2);
      targetRotX = THREE.MathUtils.degToRad(-ny * 5.5 + 0.8);

      // Raycast to plane z=0 for cursor glow & normalized panel push
      raycaster.setFromCamera(pointerNDC, camera);
      if (raycaster.ray.intersectPlane(hitPlane, tmpVec)) {
        pointerWorld.copy(tmpVec);
        pointerNorm.x = THREE.MathUtils.clamp(tmpVec.x / panelW + 0.5, 0, 1);
        pointerNorm.y = THREE.MathUtils.clamp(0.5 - (tmpVec.y - panelCenterY) / panelH, 0, 1);
        pointerNorm.active = true;
      }

      if (mode === 'idle') {
        const hits = raycaster.intersectObjects(glassMeshes, false);
        hoveredPieceIdx = hits.length > 0 ? (hits[0].object.userData.pieceIndex as number) : -1;
      } else {
        hoveredPieceIdx = -1;
      }
    };

    const handlePointerLeave = () => {
      pointerNorm.active = false;
      hoveredPieceIdx = -1;
      targetRotY = THREE.MathUtils.degToRad(-1.2);
      targetRotX = THREE.MathUtils.degToRad(0.8);
    };

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerleave', handlePointerLeave);

    animControllerRef.current = {
      triggerShatter: () => {
        if (mode === 'shattering' || mode === 'shattered') return;
        mode = 'shattering';
        modeTime = 0;
        hoveredPieceIdx = -1;
        setShatteredView(true);
        setManifestOpacity(0);
      },
      triggerReassemble: () => {
        if (mode === 'reassembling' || mode === 'idle') return;
        mode = 'reassembling';
        modeTime = 0;
        setManifestOpacity(0);
        setShatteredView(false);
      },
      redrawTextures: () => {
        drawNavCanvas();
        drawPanelCanvas();
        drawBackSliverCanvas();
      },
    };

    // Pre-warm shaders once on GPU
    if (!isSoftwareGl) {
      try {
        renderer.compile(scene, camera);
      } catch {
        // Ignore shader pre-warm error and render directly
      }
    }

    let lastTime = performance.now();
    let lastRebuildTime = 0;
    let frameId = 0;
    let disposed = false;

    const projectCorner = (lx: number, ly: number, lz: number, parentMatrix: THREE.Matrix4): Vec2 => {
      tmpCorner.set(lx, ly, lz).applyMatrix4(parentMatrix).project(camera);
      return {
        x: ((tmpCorner.x + 1) * 0.5) * W,
        y: ((1 - tmpCorner.y) * 0.5) * H,
      };
    };

    const tick = () => {
      if (disposed || renderer.getContext().isContextLost()) return;
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const elapsedSec = now / 1000;

      // Smooth cursor glow strength
      const targetGlow = pointerNorm.active && mode === 'idle' ? 1 : 0;
      glowStrength += (targetGlow - glowStrength) * Math.min(1, dt * 8);
      glowUniforms.uGlowStrength.value = glowStrength;

      // Global block tilt (0.3s exponential damping)
      const tiltAlpha = 1 - Math.exp(-dt / 0.3);
      currentRotX += (targetRotX - currentRotX) * tiltAlpha;
      currentRotY += (targetRotY - currentRotY) * tiltAlpha;
      blockGroup.rotation.set(currentRotX, currentRotY, 0);

      // Rebuild cut geometry ~45x/s while idle
      if ((mode === 'idle' || mode === 'entering') && now - lastRebuildTime >= 22) {
        lastRebuildTime = now;
        rebuildShardGeometries(elapsedSec);
      }

      // Advance shatter / enter / reassemble timeline
      if (mode === 'entering' || mode === 'reassembling') {
        modeTime += dt;
        const maxDur = SHATTER_DUR + 0.16;
        if (modeTime >= maxDur) {
          mode = 'idle';
        }
      } else if (mode === 'shattering') {
        modeTime += dt;
        if (modeTime >= 0.28) {
          const fadeP = Math.min(1, (modeTime - 0.28) / 0.4);
          setManifestOpacity(fadeP);
        }
        if (modeTime >= SHATTER_DUR + 0.25) {
          mode = 'shattered';
          setManifestOpacity(1);
        }
      }

      // Update each piece transform & hover spring (k = 170, c = 19)
      for (let i = 0; i < pieces.length; i++) {
        const piece = pieces[i];
        const sp = piece.spring;
        const sh = piece.shatter;

        const isHovered = mode === 'idle' && hoveredPieceIdx === i;
        const targetZ = isHovered ? (piece.def.isNav ? 32 * S : 50 * S) : 0;

        let targetPieceRx = 0;
        let targetPieceRy = 0;
        if (isHovered && pointerNorm.active) {
          const relX = THREE.MathUtils.clamp((pointerWorld.x - piece.homeX) / (blockW * 0.35), -1, 1);
          const relY = THREE.MathUtils.clamp((pointerWorld.y - piece.homeY) / (blockH * 0.35), -1, 1);
          // Edge nearest pointer dips away (positive ry tips right edge away, negative rx tips top edge away)
          targetPieceRy = relX * 0.24;
          targetPieceRx = -relY * 0.24;
        }

        const kSpring = 170;
        const cSpring = 19;
        sp.vz += (-kSpring * (sp.z - targetZ) - cSpring * sp.vz) * dt;
        sp.z += sp.vz * dt;
        sp.vrx += (-kSpring * (sp.rx - targetPieceRx) - cSpring * sp.vrx) * dt;
        sp.rx += sp.vrx * dt;
        sp.vry += (-kSpring * (sp.ry - targetPieceRy) - cSpring * sp.vry) * dt;
        sp.ry += sp.vry * dt;

        // Hover iridescence (0.55 -> 1.0) & envMapIntensity (1 -> 1.9)
        const targetHov = isHovered ? 1 : 0;
        sp.hoverAmount += (targetHov - sp.hoverAmount) * Math.min(1, dt * 10);
        piece.mat.iridescence = THREE.MathUtils.lerp(0.55, 1.0, sp.hoverAmount);
        piece.mat.envMapIntensity = THREE.MathUtils.lerp(1.0, 1.9, sp.hoverAmount);

        // Shatter / enter offset
        let flightT = 0; // 0 = home, 1 = flown off
        if (mode === 'shattering') {
          const localT = THREE.MathUtils.clamp((modeTime - sh.delay) / SHATTER_DUR, 0, 1);
          flightT = easeInCubic(localT);
        } else if (mode === 'shattered') {
          flightT = 1;
        } else if (mode === 'entering' || mode === 'reassembling') {
          const localT = THREE.MathUtils.clamp((modeTime - sh.delay) / SHATTER_DUR, 0, 1);
          flightT = 1 - easeOutBack(localT);
        }

        piece.group.visible = flightT < 0.999;
        if (piece.group.visible) {
          const fx = sh.vx * flightT;
          const fy = sh.vy * flightT - 0.5 * sh.gravity * flightT * flightT;
          const fz = sh.vz * S * flightT;
          piece.group.position.set(piece.homeX + fx, piece.homeY + fy, sp.z + fz);

          piece.group.rotation.set(sp.rx, sp.ry, 0);
          if (Math.abs(flightT) > 0.001) {
            piece.group.rotateOnAxis(sh.axis, sh.angle * flightT);
          }
        }
      }

      // Back sliver animation when shattered
      const showBack = mode === 'shattering' || mode === 'shattered' || mode === 'reassembling';
      if (showBack) {
        let grow = 0;
        if (mode === 'shattering') {
          grow = THREE.MathUtils.clamp((modeTime - 0.3) / 0.38, 0, 1);
          grow = easeOutBack(grow);
        } else if (mode === 'shattered') {
          grow = 1;
        } else if (mode === 'reassembling') {
          grow = 1 - THREE.MathUtils.clamp(modeTime / 0.25, 0, 1);
        }
        backSliverGroup.visible = grow > 0.01;
        if (backSliverGroup.visible) {
          backSliverGroup.scale.setScalar(Math.max(0.01, grow));
          const idleWobbleX = Math.sin(elapsedSec * 2.1) * 0.035;
          const idleWobbleY = Math.cos(elapsedSec * 1.7) * 0.035;
          const hovTip = hoverFlagsRef.current.backSliver ? 0.14 : 0;
          backSliverGroup.rotation.set(
            0.08 + idleWobbleX + hovTip * 0.5,
            -0.16 + idleWobbleY + hovTip,
            0
          );
          if (backButtonRef.current) {
            backButtonRef.current.style.opacity = String(THREE.MathUtils.clamp(grow, 0, 1));
            backButtonRef.current.style.transform = `translate(-50%, -50%) scale(${Math.max(0.5, grow)})`;
          }
        }
      } else {
        backSliverGroup.visible = false;
      }

      blockGroup.updateMatrixWorld(true);

      // Update transparent DOM homography overlays for selectable text & interactive buttons
      const topZ = (13 * S) / 2 + 2.6 * S + 0.5;
      if (navDomRef.current) {
        const navGroup = pieces[0].group;
        const m = navGroup.matrixWorld;
        const corners: [Vec2, Vec2, Vec2, Vec2] = [
          projectCorner(-navW / 2, navH / 2, topZ, m),
          projectCorner(navW / 2, navH / 2, topZ, m),
          projectCorner(navW / 2, -navH / 2, topZ, m),
          projectCorner(-navW / 2, -navH / 2, topZ, m),
        ];
        navDomRef.current.style.transform = computeHomographyMatrix3d(navW, navH, corners);
        navDomRef.current.style.pointerEvents = mode === 'idle' ? 'auto' : 'none';
        navDomRef.current.style.opacity = mode === 'shattered' || mode === 'shattering' ? '0' : '1';
      }

      if (panelDomRef.current) {
        // Map panel DOM onto hero slab tilt plane
        const blockMat = blockGroup.matrixWorld;
        const corners: [Vec2, Vec2, Vec2, Vec2] = [
          projectCorner(-panelW / 2, panelCenterY + panelH / 2, topZ, blockMat),
          projectCorner(panelW / 2, panelCenterY + panelH / 2, topZ, blockMat),
          projectCorner(panelW / 2, panelCenterY - panelH / 2, topZ, blockMat),
          projectCorner(-panelW / 2, panelCenterY - panelH / 2, topZ, blockMat),
        ];
        panelDomRef.current.style.transform = computeHomographyMatrix3d(panelW, panelH, corners);
        panelDomRef.current.style.pointerEvents = mode === 'idle' ? 'auto' : 'none';
        panelDomRef.current.style.opacity = mode === 'shattered' || mode === 'shattering' ? '0' : '1';
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(renderer, tick, (id) => {
          frameId = id;
        });
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', updateResize);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);

      for (const p of pieces) {
        p.glassMesh.geometry.dispose();
        p.printMesh.geometry.dispose();
        p.mat.dispose();
      }
      backSliverMesh.geometry.dispose();
      backPrintMesh.geometry.dispose();
      backSliverMat.dispose();
      backPrintMat.dispose();
      panelPrintMat.dispose();
      navPrintMat.dispose();
      panelTex.dispose();
      navTex.dispose();
      backTex.dispose();
      envRT.dispose();
      renderer.dispose();
    };
  }, [reducedMotion]);

  const handleReadJourney = () => {
    if (webglDisabled) {
      setShatteredView(true);
      setManifestOpacity(1);
      return;
    }
    animControllerRef.current?.triggerShatter();
  };

  const handleBackFromManifest = () => {
    if (webglDisabled) {
      setShatteredView(false);
      setManifestOpacity(0);
      return;
    }
    animControllerRef.current?.triggerReassemble();
  };

  const navItems: Array<{ label: string; path: RoutePath }> = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Skills', path: '/skills' },
    { label: 'Projects', path: '/projects' },
    { label: 'YouTube', path: '/youtube' },
    { label: 'Contact', path: '/contact' },
  ];

  // Static accessible HTML fallback when prefers-reduced-motion or no WebGL
  if (webglDisabled) {
    return (
      <section
        className="relative min-h-screen w-full flex items-center justify-center p-4 sm:px-[5.5vw] sm:py-[8.5vh]"
        style={{
          background:
            'radial-gradient(125% 62% at 50% -10%, rgba(4,6,15,0.82) 0%, rgba(4,6,15,0.28) 44%, transparent 68%)',
        }}
      >
        {!shatteredView ? (
          <div className="w-full max-w-[1360px] flex flex-col gap-[14px]">
            <header className="w-full rounded-2xl bg-[rgba(12,18,38,0.68)] backdrop-blur-md border border-[rgba(150,175,230,0.2)] px-6 sm:px-9 py-4 flex items-center justify-between gap-6">
              <button
                type="button"
                onClick={() => onNavigate('/')}
                className="flex items-center gap-3 text-sm sm:text-base font-semibold tracking-tight text-[#f3f6ff] whitespace-nowrap shrink-0 cursor-pointer rounded"
              >
                <span className="w-4 h-4 border border-[#9aa6c4] flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-[#5df0a8]" />
                </span>
                Bambe Aine Chris
              </button>
              <nav className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-medium" aria-label="Primary navigation">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    aria-current={item.path === '/' ? 'page' : undefined}
                    onClick={() => onNavigate(item.path)}
                    className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer rounded ${
                      item.path === '/'
                        ? 'text-[#5df0a8]'
                        : 'text-[#9aa6c4] hover:text-[#f3f6ff]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
              <div className="flex items-center gap-3 shrink-0">
                <a
                  href={profile.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[#f3f6ff] hover:text-[#5df0a8] whitespace-nowrap shrink-0 rounded"
                >
                  GitHub ↗
                </a>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen((v) => !v)}
                  className="md:hidden p-1.5 rounded-md text-[#9aa6c4] hover:text-[#f3f6ff] cursor-pointer"
                  aria-expanded={mobileNavOpen}
                  aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
                >
                  {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </header>

            {mobileNavOpen && (
              <div className="md:hidden rounded-2xl border border-[rgba(150,175,230,0.2)] bg-[rgba(12,18,38,0.82)] backdrop-blur-md px-5 py-4 space-y-1.5">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    aria-current={item.path === '/' ? 'page' : undefined}
                    onClick={() => {
                      setMobileNavOpen(false);
                      onNavigate(item.path);
                    }}
                    className={`block w-full text-left py-2.5 px-3 rounded-lg text-sm font-medium cursor-pointer ${
                      item.path === '/'
                        ? 'text-[#5df0a8] bg-[rgba(93,240,168,0.08)]'
                        : 'text-[#9aa6c4] hover:text-[#f3f6ff]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            <div className="relative rounded-2xl bg-[rgba(12,18,38,0.65)] backdrop-blur-md border border-[rgba(150,175,230,0.2)] px-6 sm:px-14 py-12 sm:py-16 min-h-[520px] flex flex-col justify-between overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono-tech uppercase tracking-[0.18em]">
                <span className="text-[#5df0a8]">SEEKING INTERNSHIP OPPORTUNITIES · RWANDA</span>
                <span className="text-[#6b7796]" aria-hidden="true">/</span>
                <TypingRoleTicker
                  phrases={[
                    'Backend Engineering',
                    'Node.js & Express APIs',
                    'SAMS & MySQL Schemas',
                  ]}
                  className="text-[#7dd3fc]"
                />
              </div>

              <div className="my-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7">
                  <AnimatedHeading
                    as="h1"
                    trigger="mount"
                    text="Bambe Aine"
                    accentText="Chris."
                    className="font-display font-semibold text-4xl sm:text-6xl lg:text-[72px] leading-[1.02] tracking-[-0.035em] text-[#f3f6ff]"
                  />
                  <p className="mt-5 max-w-xl text-base sm:text-lg text-[#9aa6c4] leading-relaxed">
                    Student software developer & aspiring backend engineer. Building REST APIs,
                    MySQL schemas, SAMS, and web systems.
                  </p>

                  <div className="mt-7 flex flex-wrap items-center gap-6">
                    <button
                      type="button"
                      onClick={onExploreWork}
                      className="ascend-btn-primary"
                    >
                      View Projects
                    </button>
                    <button
                      type="button"
                      onClick={handleReadJourney}
                      className="text-sm font-medium text-[#f3f6ff] hover:text-[#7dd3fc] hover:underline underline-offset-4 cursor-pointer"
                    >
                      Read journey →
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 rounded-xl bg-[rgba(6,10,24,0.78)] border border-[rgba(150,175,230,0.18)] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[rgba(255,255,255,0.04)] border-b border-[rgba(150,175,230,0.12)]">
                    <span className="text-[11px] font-mono-tech text-[#9aa6c4]">
                      developer-profile.json
                    </span>
                  </div>
                  <pre className="p-4 sm:p-5 text-xs sm:text-[13px] font-mono-tech leading-relaxed overflow-x-auto text-[#9aa6c4]">
                    <code>
                      {'{\n'}
                      {'  '}<span className="text-[#7dd3fc]">"name"</span>: <span className="text-[#5df0a8]">"Bambe Aine Chris"</span>,{'\n'}
                      {'  '}<span className="text-[#7dd3fc]">"role"</span>: <span className="text-[#5df0a8]">"Student Developer"</span>,{'\n'}
                      {'  '}<span className="text-[#7dd3fc]">"school"</span>: <span className="text-[#5df0a8]">"Intango TSS · L4 SOD"</span>,{'\n'}
                      {'  '}<span className="text-[#7dd3fc]">"focus"</span>: <span className="text-[#5df0a8]">"Backend Development"</span>,{'\n'}
                      {'  '}<span className="text-[#7dd3fc]">"stack"</span>: <span className="text-[#5df0a8]">["Node.js", "Express", "MySQL"]</span>,{'\n'}
                      {'  '}<span className="text-[#7dd3fc]">"building"</span>: <span className="text-[#5df0a8]">["SAMS", "REST APIs"]</span>{'\n'}
                      {'}'}
                    </code>
                  </pre>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tech text-[#9aa6c4]">
                <span>Intango TSS · Busanza, Nyarutarama, Rwanda</span>
                <span>Node.js · Express.js · MySQL · Git</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-2xl px-6 py-16">
            <button
              type="button"
              onClick={handleBackFromManifest}
              className="mb-10 px-5 py-2.5 rounded-lg bg-[rgba(12,18,38,0.72)] border border-[rgba(150,175,230,0.2)] text-sm font-medium text-[#f3f6ff] hover:text-[#5df0a8] transition-colors cursor-pointer"
            >
              ← Back
            </button>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#f3f6ff] mb-8">
              Backend craft, in five pillars.
            </h2>
            <div className="space-y-5 text-sm sm:text-base leading-[1.72] text-[#9aa6c4]">
              {FIVE_PILLARS.map((pillar) => (
                <p key={pillar.term}>
                  <strong className="font-semibold text-[#f3f6ff]">{pillar.term}</strong> — {pillar.desc}
                </p>
              ))}
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <section
      ref={containerRef}
      className="relative h-screen min-h-[640px] w-full overflow-hidden select-text"
      style={{
        background:
          'radial-gradient(125% 62% at 50% -10%, rgba(4,6,15,0.82) 0%, rgba(4,6,15,0.28) 44%, transparent 68%)',
      }}
      aria-label="Hero showcase"
    >
      {/* Isolated WebGL canvas host */}
      <div ref={canvasHostRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Transparent DOM Homography Overlay — Nav Slab */}
      <div
        ref={navDomRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: `${domBox.navW}px`,
          height: `${domBox.navH}px`,
          transformOrigin: '0 0',
          zIndex: 10,
        }}
        className="facet-selectable flex items-center justify-between px-6 sm:px-9 text-transparent"
      >
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="h-10 px-2 text-sm font-semibold tracking-tight text-transparent cursor-pointer whitespace-nowrap shrink-0 rounded"
          aria-label="Bambe Aine Chris Home"
        >
          Bambe Aine Chris
        </button>

        {domBox.navW > 640 && (
          <nav className="flex items-center gap-5 lg:gap-7" aria-label="Primary navigation">
            {navItems.map((item, idx) => (
              <button
                key={item.path}
                type="button"
                aria-current={item.path === '/' ? 'page' : undefined}
                onClick={() => onNavigate(item.path)}
                onMouseEnter={() => {
                  hoverFlagsRef.current.navIndex = idx;
                  animControllerRef.current?.redrawTextures();
                }}
                onMouseLeave={() => {
                  hoverFlagsRef.current.navIndex = -1;
                  animControllerRef.current?.redrawTextures();
                }}
                className="h-10 px-1 text-sm text-transparent cursor-pointer whitespace-nowrap shrink-0 rounded"
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={profile.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => {
              hoverFlagsRef.current.navIndex = 6;
              animControllerRef.current?.redrawTextures();
            }}
            onMouseLeave={() => {
              hoverFlagsRef.current.navIndex = -1;
              animControllerRef.current?.redrawTextures();
            }}
            className="h-10 px-2 flex items-center text-sm text-transparent cursor-pointer whitespace-nowrap shrink-0 rounded"
          >
            GitHub ↗
          </a>

          {domBox.navW <= 640 && (
            <button
              type="button"
              onClick={() => setMobileNavOpen((v) => !v)}
              className="p-1.5 rounded-md text-[#9aa6c4] hover:text-[#f3f6ff] cursor-pointer"
              aria-expanded={mobileNavOpen}
              aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {mobileNavOpen && domBox.navW <= 640 && (
        <div className="absolute top-[92px] inset-x-4 z-30 rounded-2xl border border-[rgba(150,175,230,0.22)] bg-[rgba(12,18,38,0.85)] backdrop-blur-lg px-5 py-4 space-y-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.6)]">
          {navItems.map((item) => (
            <button
              key={item.path}
              type="button"
              aria-current={item.path === '/' ? 'page' : undefined}
              onClick={() => {
                setMobileNavOpen(false);
                onNavigate(item.path);
              }}
              className={`block w-full text-left py-2.5 px-3 rounded-lg text-sm font-medium cursor-pointer ${
                item.path === '/'
                  ? 'text-[#5df0a8] bg-[rgba(93,240,168,0.08)]'
                  : 'text-[#9aa6c4] hover:text-[#f3f6ff]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Transparent DOM Homography Overlay — Shard Panel */}
      <div
        ref={panelDomRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: `${domBox.panelW}px`,
          height: `${domBox.panelH}px`,
          transformOrigin: '0 0',
          zIndex: 10,
        }}
        className="facet-selectable text-transparent"
      >
        {(() => {
          const isCompact = domBox.panelW < 620;
          const padX = isCompact
            ? Math.max(22, domBox.panelW * 0.075)
            : Math.max(36, 76 * domBox.S);
          const eyebrowY = domBox.panelH * 0.135;
          const headSize = Math.max(32, Math.min(domBox.panelW * 0.068, domBox.panelH * 0.175));
          const lineHeight = headSize * 0.99;
          const headStartY = eyebrowY + Math.max(30, domBox.panelH * 0.085);
          const subSize = Math.max(12.5, Math.min(17.5 * domBox.S, domBox.panelW * 0.022));
          const subY = headStartY + lineHeight * 2 + Math.max(20, 28 * domBox.S);
          const btnY = subY + subSize * 3.4 + Math.max(10, 14 * domBox.S);
          const btnW = Math.max(134, 158 * domBox.S);
          const btnH = Math.max(38, 42 * domBox.S);
          const linkX = padX + btnW + Math.max(18, 28 * domBox.S);

          return (
            <>
              <div
                style={{
                  position: 'absolute',
                  left: padX,
                  top: eyebrowY - 8,
                  fontSize: Math.max(9.5, 11.5 * domBox.S),
                  letterSpacing: '0.14em',
                }}
              >
                SEEKING INTERNSHIP OPPORTUNITIES · RWANDA
              </div>

              <h1
                style={{
                  position: 'absolute',
                  left: padX,
                  top: headStartY,
                  fontSize: headSize,
                  lineHeight: 0.99,
                  letterSpacing: '-0.035em',
                }}
              >
                Bambe Aine
                <br />
                Chris.
              </h1>

              <p
                style={{
                  position: 'absolute',
                  left: padX,
                  top: subY,
                  fontSize: subSize,
                  lineHeight: 1.48,
                }}
              >
                Student software developer & aspiring backend engineer.
                <br />
                Building REST APIs, MySQL schemas, SAMS, and web systems.
              </p>

              <button
                type="button"
                onClick={onExploreWork}
                onMouseEnter={() => {
                  hoverFlagsRef.current.exploreBtn = true;
                  animControllerRef.current?.redrawTextures();
                }}
                onMouseLeave={() => {
                  hoverFlagsRef.current.exploreBtn = false;
                  animControllerRef.current?.redrawTextures();
                }}
                style={{
                  position: 'absolute',
                  left: padX,
                  top: btnY,
                  width: btnW,
                  height: btnH,
                }}
                className="cursor-pointer text-transparent rounded-[6px]"
              >
                View Projects
              </button>

              <button
                type="button"
                onClick={handleReadJourney}
                onMouseEnter={() => {
                  hoverFlagsRef.current.journeyLink = true;
                  animControllerRef.current?.redrawTextures();
                }}
                onMouseLeave={() => {
                  hoverFlagsRef.current.journeyLink = false;
                  animControllerRef.current?.redrawTextures();
                }}
                style={{
                  position: 'absolute',
                  left: linkX,
                  top: btnY,
                  height: btnH,
                  paddingInline: 6,
                }}
                className="cursor-pointer text-transparent whitespace-nowrap rounded"
              >
                Read journey →
              </button>
            </>
          );
        })()}
      </div>

      {/* Shattered Second View — 5 Pillars Manifesto + 3D "← Back" Sliver Hit Area */}
      {shatteredView && (
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            opacity: manifestOpacity,
            transition: 'opacity 0.25s ease',
          }}
        >
          {/* Hit area aligned to (.219 W, .238 H) smoked-glass sliver */}
          <button
            ref={backButtonRef}
            type="button"
            onClick={handleBackFromManifest}
            onMouseEnter={() => {
              setBackHovered(true);
              hoverFlagsRef.current.backSliver = true;
              animControllerRef.current?.redrawTextures();
            }}
            onMouseLeave={() => {
              setBackHovered(false);
              hoverFlagsRef.current.backSliver = false;
              animControllerRef.current?.redrawTextures();
            }}
            style={{
              left: '21.9%',
              top: '23.8%',
              transform: 'translate(-50%, -50%)',
            }}
            className={`absolute pointer-events-auto w-36 h-16 cursor-pointer text-transparent rounded ${
              backHovered ? 'text-[#5df0a8]' : ''
            }`}
            aria-label="Back to smoked glass hero"
          >
            ← Back
          </button>

          {/* 5 Pillars Editorial Column */}
          <div className="hidden md:block absolute left-[32.4%] w-[33.9%] top-[33%] text-left pointer-events-auto">
            <h2
              className="font-display font-semibold text-[#f3f6ff] tracking-[-0.022em] mb-[1.4vw]"
              style={{ fontSize: 'clamp(22px, 1.36vw, 32px)' }}
            >
              Backend craft, in five pillars.
            </h2>
            <div
              className="flex flex-col text-[#9aa6c4] leading-[1.72]"
              style={{
                fontSize: 'clamp(13px, 0.78vw, 17px)',
                gap: '1.05vw',
              }}
            >
              {FIVE_PILLARS.map((pillar) => (
                <p key={pillar.term}>
                  <strong className="font-semibold text-[#f3f6ff]">{pillar.term}</strong> —{' '}
                  {pillar.desc}
                </p>
              ))}
            </div>
          </div>

          {/* Mobile responsive manifest fallback */}
          <div className="md:hidden absolute inset-x-6 top-[32%] max-w-lg mx-auto pointer-events-auto">
            <h2 className="font-display text-2xl font-semibold text-[#f3f6ff] tracking-tight mb-5">
              Backend craft, in five pillars.
            </h2>
            <div className="space-y-4 text-sm leading-relaxed text-[#9aa6c4]">
              {FIVE_PILLARS.map((pillar) => (
                <p key={pillar.term}>
                  <strong className="font-semibold text-[#f3f6ff]">{pillar.term}</strong> —{' '}
                  {pillar.desc}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
