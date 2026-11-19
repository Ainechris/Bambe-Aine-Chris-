import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { afterDraw, createSafeWebGLRenderer, detectSoftwareWebGL } from '../lib/webglUtils.ts';

const ASSET_BASE_URL =
  'https://api.getlayers.ai/storage/v1/object/public/public/assets/ascend-d9857ad1f2';
const PLANET_GLB = `${ASSET_BASE_URL}/planet.glb`;
const PLANET_LIGHTS_GLB = `${ASSET_BASE_URL}/planet-lights.glb`;
const PLANET_CLOUDS_PNG = `${ASSET_BASE_URL}/planet-clouds.png`;

const CONFIG = {
  rimColor: '#c1faff',
  rimPower: 2.4,
  nightLights: 10,
  terrainDepth: 0.33,
  terrainShade: 1.3,
  oceanGlint: 0.45,
  oceanDeep: 0.12,
  oceanFlow: 3,
  oceanFlowSpeed: 0.8,
  oceanFlowScale: 2.1,
  glowColor: '#3a6cff',
  glowIntensity: 3.35,
  planetRadius: 1.95,
  spin: 0.03,
  initRotation: 2.07,
  tilt: 0.37,
  autoRotate: 0,
  cloud1Height: 1.005,
  cloud1Opacity: 0.6,
  cloud1Spin: 0.06,
  cloud2Height: 1.03,
  cloud2Opacity: 0.5,
  cloud2Spin: 0.14,
  cloud3Height: 1.075,
  cloud3Opacity: 0.5,
  cloud3Spin: 0.1,
  bgColor: '#040a1e',
  flameColor: '#3a6cff',
  flameColor2: '#c1faff',
  flameAmt: 0.15,
  atmoColor: '#9fc4ff',
  atmoCount: 320,
  atmoSize: 22,
  atmoSpeed: 0.8,
  starColor: '#cfe0ff',
  starCount: 1400,
  starSize: 1.6,
  starFlicker: 1,
  markerColor: '#ffd27a',
  markerCount: 60,
  markerSize: 16,
  markerSpeed: 0.5,
} as const;

const LAYERS = {
  NONE: 0,
  TORUS_SCENE: 1,
  BLOOM_SCENE: 2,
  ENTIRE_SCENE: 3,
} as const;

const STOPS_X = [
  { p: 0, v: 0 },
  { p: 0.32, v: -3.1 },
  { p: 0.64, v: 3.2 },
  { p: 1, v: 0 },
];
const STOPS_Y = [
  { p: 0, v: -4.5 },
  { p: 0.32, v: 0.55 },
  { p: 0.64, v: 0.45 },
  { p: 1, v: 0.15 },
];
const STOPS_S = [
  { p: 0, v: 2.15 },
  { p: 0.32, v: 1.0 },
  { p: 0.64, v: 0.92 },
  { p: 1, v: 1.12 },
];
const STOPS_Z = [
  { p: 0, v: 0 },
  { p: 0.32, v: -0.45 },
  { p: 0.64, v: 0.3 },
  { p: 1, v: -0.25 },
];

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

function hexToVec3(hex: string): THREE.Vector3 {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b);
}

function sample(stops: Array<{ p: number; v: number }>, p: number): number {
  if (p <= stops[0].p) return stops[0].v;
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (p <= b.p) {
      const t = clamp((p - a.p) / (b.p - a.p), 0, 1);
      const s = t * t * (3 - 2 * t);
      return a.v + (b.v - a.v) * s;
    }
  }
  return stops[stops.length - 1].v;
}

const SNOISE = `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + 1.0 * C.xxx; vec3 x2 = x0 - i2 + 2.0 * C.xxx; vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0; vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
  vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy; vec4 y = y_ *ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0; vec4 s1 = floor(b1)*2.0 + 1.0; vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y); vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0); m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

export const PlanetBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallbackMode, setFallbackMode] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSoftwareGl = detectSoftwareWebGL();

    const maybeRenderer = createSafeWebGLRenderer({
      canvas,
      antialias: !isSoftwareGl,
      alpha: false,
      powerPreference: 'default',
    });
    if (!maybeRenderer) {
      setFallbackMode(true);
      return;
    }
    const renderer = maybeRenderer;

    const dpr = isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    let W = window.innerWidth;
    let H = window.innerHeight;

    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = false;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 200);
    camera.position.set(0, 0, 8);
    camera.layers.enable(LAYERS.TORUS_SCENE);
    camera.layers.enable(LAYERS.BLOOM_SCENE);
    camera.layers.enable(LAYERS.ENTIRE_SCENE);
    scene.add(camera);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    ambientLight.layers.set(LAYERS.ENTIRE_SCENE);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(0, 10, 2);
    dirLight.layers.set(LAYERS.ENTIRE_SCENE);
    scene.add(dirLight);

    const blackDummy = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
    blackDummy.needsUpdate = true;

    const FinalPassShader = {
      uniforms: {
        iTime: { value: 0 },
        tDiffuse: { value: null },
        torusTexture: { value: blackDummy },
        bloomTexture: { value: blackDummy },
        haloTexture: { value: blackDummy },
        uBg: { value: hexToVec3(CONFIG.bgColor) },
        uFlameA: { value: hexToVec3(CONFIG.flameColor) },
        uFlameB: { value: hexToVec3(CONFIG.flameColor2) },
        uFlameAmt: { value: CONFIG.flameAmt },
      },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }`,
      fragmentShader: `
        uniform float iTime;
        uniform sampler2D tDiffuse;
        uniform sampler2D bloomTexture;
        uniform sampler2D torusTexture;
        uniform sampler2D haloTexture;
        uniform vec3 uBg;
        uniform vec3 uFlameA;
        uniform vec3 uFlameB;
        uniform float uFlameAmt;
        varying vec2 vUv;
        vec3 warp3d(vec3 pos, float t){
          float curv=.8,a=1.9,b=0.7; pos*=2.;
          pos.x+=curv*sin(t+a*pos.y)+t*b; pos.y+=curv*cos(t+a*pos.x);
          pos.y+=curv*sin(t+a*pos.z)+t*b; pos.z+=curv*cos(t+a*pos.y);
          pos.z+=curv*sin(t+a*pos.x)+t*b; pos.x+=curv*cos(t+a*pos.z);
          return 0.5+0.5*cos(pos.xyz+vec3(1,2,4));
        }
        void main(){
          vec2 uv = 2.*vUv - 1.;
          vec3 w = pow(warp3d(vec3(uv.x, sin(uv.y), uv.y), iTime*1.5), vec3(1.5));
          vec3 flame = 1.5*uFlameA*w.x; flame*=w.y; flame += uFlameB*w.z;
          flame *= smoothstep(0.25, 1., abs(uv.y));
          float md = smoothstep(-0.7, 1., -uv.y*uv.x); flame *= md*md;
          vec3 bg = uBg * (1.0 - 0.4 * length(uv));
          vec3 halo = texture2D(haloTexture, vUv).xyz;
          gl_FragColor = vec4(bg + flame*uFlameAmt + texture2D(bloomTexture, vUv).xyz + texture2D(torusTexture, vUv).xyz + texture2D(tDiffuse, vUv).xyz + halo, 1.);
        }
      `,
    };

    const finalPass = new ShaderPass(FinalPassShader);
    const finalComposer = new EffectComposer(renderer);
    finalComposer.setPixelRatio(dpr);
    finalComposer.setSize(W, H);
    finalComposer.addPass(new RenderPass(scene, camera));
    finalComposer.addPass(finalPass);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.enabled = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = CONFIG.autoRotate;
    controls.minDistance = 3.5;
    controls.maxDistance = 16;
    controls.target.set(0, 0, 0);

    // Hierarchy
    const worldGroup = new THREE.Group();
    worldGroup.position.set(STOPS_X[0].v, STOPS_Y[0].v, 0);
    worldGroup.scale.setScalar(STOPS_S[0].v);
    scene.add(worldGroup);

    const planetGroup = new THREE.Group();
    planetGroup.rotation.z = CONFIG.tilt;
    planetGroup.rotation.y = CONFIG.initRotation;
    worldGroup.add(planetGroup);

    const cloudGroup = new THREE.Group();
    cloudGroup.rotation.z = CONFIG.tilt;
    cloudGroup.visible = false;
    worldGroup.add(cloudGroup);

    // Atmosphere halo billboard
    const glowMat = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uGlow: { value: hexToVec3(CONFIG.glowColor) },
        uIntensity: { value: CONFIG.glowIntensity },
      },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        uniform vec3 uGlow; uniform float uIntensity; varying vec2 vUv;
        void main(){
          float d = length(vUv - 0.5) * 2.0;
          float a = pow(clamp(1.0 - d, 0.0, 1.0), 2.2);
          gl_FragColor = vec4(uGlow * a * uIntensity, a);
        }
      `,
    });
    const glowGeo = new THREE.PlaneGeometry(2, 2);
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.scale.setScalar(CONFIG.planetRadius * 2.3);
    glowMesh.layers.set(LAYERS.ENTIRE_SCENE);
    worldGroup.add(glowMesh);

    const resVec = new THREE.Vector2(W, H);

    // Starfield on sphere r=90
    const starPositions = new Float32Array(CONFIG.starCount * 3);
    const starSeeds = new Float32Array(CONFIG.starCount);
    const starBrights = new Float32Array(CONFIG.starCount);
    for (let i = 0; i < CONFIG.starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = 90;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);
      starSeeds[i] = Math.random() * Math.PI * 2;
      starBrights[i] = 0.35 + Math.random() * 0.65;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('seed', new THREE.BufferAttribute(starSeeds, 1));
    starGeo.setAttribute('bright', new THREE.BufferAttribute(starBrights, 1));

    const starMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: CONFIG.starSize },
        uFlicker: { value: CONFIG.starFlicker },
        uColor: { value: hexToVec3(CONFIG.starColor) },
        uRes: { value: resVec },
      },
      vertexShader: `
        attribute float seed; attribute float bright;
        uniform float uTime; uniform float uSize; uniform float uFlicker; uniform vec2 uRes;
        varying float vTw;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float tw = 0.6 + 0.4 * sin(uTime * uFlicker + seed);
          vTw = bright * tw;
          gl_PointSize = max(uSize * uRes.y / 900.0 * (90.0 / max(-mv.z, 1.0)), 1.0);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor; varying float vTw;
        void main(){
          vec2 p = gl_PointCoord - 0.5; float l = length(p); if (l > 0.5) discard;
          float core = smoothstep(0.5, 0.0, l);
          gl_FragColor = vec4(uColor, core * vTw);
        }
      `,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    starPoints.frustumCulled = false;
    starPoints.layers.set(LAYERS.ENTIRE_SCENE);
    scene.add(starPoints);

    // Ambient atmosphere motes
    const atmoPos = new Float32Array(CONFIG.atmoCount * 3);
    const atmoSizeAttr = new Float32Array(CONFIG.atmoCount);
    const atmoSeedAttr = new Float32Array(CONFIG.atmoCount);
    for (let i = 0; i < CONFIG.atmoCount; i++) {
      atmoPos[i * 3] = Math.random() * 2 - 1;
      atmoPos[i * 3 + 1] = Math.random() * 2 - 1;
      atmoPos[i * 3 + 2] = Math.random() * 2 - 1;
      atmoSizeAttr[i] = CONFIG.atmoSize * (0.4 + Math.random());
      atmoSeedAttr[i] = Math.random() * 100;
    }
    const atmoGeo = new THREE.BufferGeometry();
    atmoGeo.setAttribute('position', new THREE.BufferAttribute(atmoPos, 3));
    atmoGeo.setAttribute('size', new THREE.BufferAttribute(atmoSizeAttr, 1));
    atmoGeo.setAttribute('seed', new THREE.BufferAttribute(atmoSeedAttr, 1));

    const atmoMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: hexToVec3(CONFIG.atmoColor) },
        uRes: { value: resVec },
      },
      vertexShader: `
        attribute float size; attribute float seed; uniform float uTime; uniform vec2 uRes;
        varying float vA;
        vec3 warp(vec3 p, float t){ float c=0.9,a=1.9,b=0.02,s=0.05; p*=2.;
          p.x+=c*sin(s*t+a*p.y)+t*b; p.y+=c*cos(s*t+a*p.x); p.y+=c*sin(s*t+a*p.z)+t*b;
          p.z+=c*cos(s*t+a*p.y); p.z+=c*sin(s*t+a*p.x)+t*b; p.x+=c*cos(s*t+a*p.z);
          return cos(p+vec3(1,2,4)); }
        void main(){
          vec3 v = position*4.0 + warp(position, uTime)*1.2;
          vec4 mv = modelViewMatrix * vec4(v, 1.0);
          float r = length(v); float farF = 1.0 - smoothstep(5.0, 6.5, r); float nearF = smoothstep(0.0, 0.5, -mv.z);
          vA = farF * nearF;
          gl_PointSize = size * uRes.y / 900.0 / -mv.z; gl_PointSize = max(gl_PointSize, 1.0);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor; varying float vA;
        void main(){ vec2 p = gl_PointCoord - 0.5; float l = length(p); if (l > 0.5) discard;
          float tex = smoothstep(0.5, 0.0, l); gl_FragColor = vec4(uColor * tex, tex * vA * 0.55); }
      `,
    });
    const atmoPoints = new THREE.Points(atmoGeo, atmoMat);
    atmoPoints.frustumCulled = false;
    atmoPoints.layers.set(LAYERS.ENTIRE_SCENE);
    atmoPoints.onBeforeRender = () => {
      const perf = performance.now() / 1000;
      atmoMat.uniforms.uTime.value = perf * CONFIG.atmoSpeed * 8;
      atmoPoints.position.copy(camera.position);
      finalPass.uniforms.iTime.value = perf;
    };
    scene.add(atmoPoints);

    // Mutable shader times
    let planetTime = 0;
    let cloudTime = 0;
    let starTime = 0;
    let markerTime = 0;
    let disposed = false;

    const disposables: Array<{ dispose: () => void }> = [
      glowGeo,
      glowMat,
      starGeo,
      starMat,
      atmoGeo,
      atmoMat,
      blackDummy,
    ];

    // Clouds (3 layers)
    const texLoader = new THREE.TextureLoader();
    texLoader.setCrossOrigin('anonymous');
    const cloudTex = texLoader.load(PLANET_CLOUDS_PNG);
    cloudTex.wrapS = THREE.RepeatWrapping;
    cloudTex.wrapT = THREE.RepeatWrapping;
    cloudTex.repeat.set(5, 5);
    disposables.push(cloudTex);

    const cloudLayers: Array<{
      mesh: THREE.Mesh;
      spin: number;
      mat: THREE.MeshStandardMaterial;
    }> = [];

    const cloudConfigs = [
      { h: CONFIG.cloud1Height, o: CONFIG.cloud1Opacity, s: CONFIG.cloud1Spin, ry: 0.0, phase: 0.0 },
      { h: CONFIG.cloud2Height, o: CONFIG.cloud2Opacity, s: CONFIG.cloud2Spin, ry: 2.2, phase: 13.0 },
      { h: CONFIG.cloud3Height, o: CONFIG.cloud3Opacity, s: CONFIG.cloud3Spin, ry: 4.3, phase: 27.0 },
    ];

    const cloudTimeUniform = { value: 0 };

    cloudConfigs.forEach((cfg) => {
      const geo = new THREE.SphereGeometry(CONFIG.planetRadius * cfg.h, 64, 64);
      const mat = new THREE.MeshStandardMaterial({
        map: cloudTex,
        transparent: true,
        depthWrite: false,
      });
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = cloudTimeUniform;
        shader.uniforms.noiseScale = { value: 20 };
        shader.uniforms.uSpeedX = { value: 1 };
        shader.uniforms.uSpeedY = { value: 2 };
        shader.uniforms.uSpeedZ = { value: 2 };
        shader.uniforms.uOpacity = { value: cfg.o };
        shader.uniforms.uPhase = { value: cfg.phase };

        shader.vertexShader =
          'varying vec2 vCloudUv;\n' +
          shader.vertexShader.replace('void main() {', 'void main() {\n  vCloudUv = uv;');

        shader.fragmentShader =
          `uniform float uTime;\nuniform float noiseScale;\nuniform float uSpeedX;\nuniform float uSpeedY;\nuniform float uSpeedZ;\nuniform float uOpacity;\nuniform float uPhase;\nvarying vec2 vCloudUv;\n${SNOISE}\n` +
          shader.fragmentShader.replace(
            '#include <dithering_fragment>',
            `#include <dithering_fragment>
            gl_FragColor.rgb = vec3(1.0);
            float cloudNoise = snoise(vec3(vCloudUv.x * noiseScale + uTime * uSpeedX + uPhase, vCloudUv.y * noiseScale - uTime * uSpeedY + uPhase, uTime * uSpeedZ + uPhase));
            float cloudNdv = max(dot(normalize(vNormal), normalize(vViewPosition)), 0.0);
            float cloudEdge = pow(1.0 - cloudNdv, 3.0);
            float cloudMod = mix(cloudNoise, 1.0, cloudEdge);
            float cloudNdl = dot(normalize(vNormal), normalize(vec3(-0.9, 0.18, 0.4)));
            float cloudDay = 1.0 - smoothstep(0.30, -0.30, cloudNdl) * 0.9;
            gl_FragColor.a *= cloudMod * uOpacity * cloudDay;`
          );
      };
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.y = cfg.ry;
      mesh.renderOrder = 2;
      mesh.layers.set(LAYERS.ENTIRE_SCENE);
      cloudGroup.add(mesh);
      cloudLayers.push({ mesh, spin: cfg.s, mat });
      disposables.push(geo, mat);
    });

    // Entry animation state
    let planetLoaded = false;
    let entryElapsed = reducedMotion ? 1.9 : 0;
    const ENTRY_DUR = 1.9;
    const ENTRY_START_Y = -6.5;
    let markerMat: THREE.ShaderMaterial | null = null;
    const planetTimeUniform = { value: 0 };

    // Load DRACO-compressed Earth & night lights
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setCrossOrigin('anonymous');
    gltfLoader.setDRACOLoader(dracoLoader);

    Promise.all([gltfLoader.loadAsync(PLANET_LIGHTS_GLB), gltfLoader.loadAsync(PLANET_GLB)])
      .then(([lightsGltf, planetGltf]) => {
        if (disposed) return;

        let nightTex: THREE.Texture | null = null;
        lightsGltf.scene.traverse((obj) => {
          if (!nightTex && (obj as THREE.Mesh).isMesh) {
            const m = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (m && m.map) nightTex = m.map;
          }
        });

        let planetMesh: THREE.Mesh | null = null;
        planetGltf.scene.traverse((obj) => {
          if (!planetMesh && (obj as THREE.Mesh).isMesh) {
            planetMesh = obj as THREE.Mesh;
          }
        });

        if (!planetMesh) return;
        const pMesh = planetMesh as THREE.Mesh;
        pMesh.geometry.computeBoundingSphere();
        const bsRadius = pMesh.geometry.boundingSphere?.radius || 1;
        const scaleFactor = CONFIG.planetRadius / bsRadius;
        pMesh.scale.setScalar(scaleFactor);

        const origMat = pMesh.material as THREE.MeshStandardMaterial;
        const planetMat = origMat.clone();
        planetMat.metalness = 0;
        planetMat.roughness = 1;
        planetMat.envMapIntensity = 0;

        planetMat.onBeforeCompile = (shader) => {
          shader.uniforms.time = planetTimeUniform;
          shader.uniforms.noiseScale = { value: 30 };
          shader.uniforms.speedX = { value: 1.5 };
          shader.uniforms.speedY = { value: 2.0 };
          shader.uniforms.speedZ = { value: 2.5 };
          shader.uniforms.rimColor = { value: hexToVec3(CONFIG.rimColor) };
          shader.uniforms.rimPower = { value: CONFIG.rimPower };
          shader.uniforms.nightBlendTexture = { value: nightTex || blackDummy };
          shader.uniforms.nightLights = { value: CONFIG.nightLights };
          shader.uniforms.terrainDepth = { value: CONFIG.terrainDepth };
          shader.uniforms.terrainShade = { value: CONFIG.terrainShade };
          shader.uniforms.oceanGlint = { value: CONFIG.oceanGlint };
          shader.uniforms.oceanDeep = { value: CONFIG.oceanDeep };
          shader.uniforms.oceanFlow = { value: CONFIG.oceanFlow };
          shader.uniforms.oceanFlowSpeed = { value: CONFIG.oceanFlowSpeed };
          shader.uniforms.oceanFlowScale = { value: CONFIG.oceanFlowScale };

          shader.vertexShader =
            'varying vec2 vCustomUv;\n' +
            shader.vertexShader.replace('void main() {', 'void main() {\n  vCustomUv = uv;');

          shader.fragmentShader =
            `uniform float time;\nuniform float noiseScale;\nuniform float speedX;\nuniform float speedY;\nuniform float speedZ;\nuniform vec3 rimColor;\nuniform float rimPower;\nuniform sampler2D nightBlendTexture;\nuniform float nightLights;\nuniform float terrainDepth;\nuniform float terrainShade;\nuniform float oceanGlint;\nuniform float oceanDeep;\nuniform float oceanFlow;\nuniform float oceanFlowSpeed;\nuniform float oceanFlowScale;\nvarying vec2 vCustomUv;\n${SNOISE}\n` +
            shader.fragmentShader.replace(
              '#include <dithering_fragment>',
              `#include <dithering_fragment>
              vec3 normalizedNormal = normalize(vNormal);
              vec3 viewDir = normalize(vViewPosition);
              float rim = 1.0 - max(dot(viewDir, normalizedNormal), 0.0);
              rim = pow(rim, rimPower); rim = pow(rim, 1.5); rim *= 0.7;
              vec3 currentColor = gl_FragColor.rgb;
              float blueDom = currentColor.b - max(currentColor.r, currentColor.g);
              float waterMask = clamp(smoothstep(-0.005, 0.03, blueDom), 0.0, 1.0);
              float shimmer = snoise(vec3(vCustomUv.x * noiseScale + time * speedX, vCustomUv.y * noiseScale - time * speedY, time * speedZ));
              gl_FragColor.rgb += waterMask * shimmer * 0.025;
              float fT = time * oceanFlowSpeed * 4.0;
              float fS = 4.0 * oceanFlowScale;
              float warp = snoise(vec3(vCustomUv.x * fS - fT * 0.5, vCustomUv.y * fS + fT * 0.4, fT * 0.5));
              float flow = snoise(vec3(vCustomUv.x * fS * 2.0 + fT * 0.6 + warp, vCustomUv.y * fS * 2.0 - fT * 0.5, fT * 0.7));
              flow = warp * 0.6 + flow * 0.4;
              gl_FragColor.rgb += waterMask * flow * 0.12 * oceanFlow;
              gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.01, 0.06, 0.16), waterMask * oceanDeep);
              vec3 finalColor = mix(gl_FragColor.rgb, rimColor, rim);
              gl_FragColor = vec4(finalColor, 1.0);
              vec3 surfPos = -vViewPosition;
              float terrH = dot(texture2D(map, vCustomUv).rgb, vec3(0.299, 0.587, 0.114));
              vec3 sigX = dFdx(surfPos), sigY = dFdy(surfPos);
              vec3 vR1 = cross(sigY, normalizedNormal), vR2 = cross(normalizedNormal, sigX);
              float fDet = dot(sigX, vR1);
              vec3 vGrad = sign(fDet) * (dFdx(terrH) * vR1 + dFdy(terrH) * vR2);
              vec3 bumpedNormal = normalize(abs(fDet) * normalizedNormal - terrainDepth * vGrad);
              vec3 shadeNormal = mix(bumpedNormal, normalizedNormal, waterMask);
              vec3 cityLights = texture2D(nightBlendTexture, vCustomUv).rgb * gl_FragColor.rgb * nightLights;
              vec3 viewSunDir = normalize(vec3(-0.9, 0.18, 0.4));
              float ndl = dot(normalizedNormal, viewSunDir);
              float dayAmt = smoothstep(-0.05, 0.35, ndl);
              float relief = dot(shadeNormal, viewSunDir) - ndl;
              gl_FragColor.rgb *= clamp(1.0 + relief * terrainShade * dayAmt, 0.55, 1.6);
              float nightFactor  = smoothstep(0.18, -0.30, ndl);
              float lightsFactor = smoothstep(0.30, -0.35, ndl);
              gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * 0.08, nightFactor);
              gl_FragColor.rgb += cityLights * lightsFactor;
              vec3 halfDir = normalize(viewSunDir + viewDir);
              float ripple = snoise(vec3(vCustomUv * 240.0, time * 4.0));
              float ndh = max(dot(normalizedNormal, halfDir) + ripple * 0.02, 0.0);
              float glint = pow(ndh, 140.0);
              gl_FragColor.rgb += glint * waterMask * dayAmt * oceanGlint * vec3(1.0, 0.97, 0.88);`
            );
        };

        pMesh.material = planetMat;
        pMesh.layers.set(LAYERS.ENTIRE_SCENE);
        planetGroup.add(pMesh);
        cloudGroup.visible = true;
        planetLoaded = true;
        disposables.push(pMesh.geometry, planetMat);
        if (nightTex) disposables.push(nightTex);

        // Area-weighted land marker sampling
        const baseMap = planetMat.map;
        const img = baseMap?.image as HTMLImageElement | HTMLCanvasElement | undefined;
        if (img && img.width > 0 && img.height > 0) {
          const texCanvas = document.createElement('canvas');
          texCanvas.width = img.width;
          texCanvas.height = img.height;
          const texCtx = texCanvas.getContext('2d');
          if (texCtx) {
            texCtx.drawImage(img as CanvasImageSource, 0, 0);
            const imgData = texCtx.getImageData(0, 0, texCanvas.width, texCanvas.height).data;
            const posAttr = pMesh.geometry.attributes.position;
            const uvAttr = pMesh.geometry.attributes.uv;
            const idxAttr = pMesh.geometry.index;
            if (posAttr && uvAttr) {
              const triCount = idxAttr ? idxAttr.count / 3 : posAttr.count / 3;
              const cumArea = new Float32Array(triCount);
              const va = new THREE.Vector3();
              const vb = new THREE.Vector3();
              const vc = new THREE.Vector3();
              const e1 = new THREE.Vector3();
              const e2 = new THREE.Vector3();
              let totalArea = 0;

              for (let t = 0; t < triCount; t++) {
                const i0 = idxAttr ? idxAttr.getX(t * 3) : t * 3;
                const i1 = idxAttr ? idxAttr.getX(t * 3 + 1) : t * 3 + 1;
                const i2 = idxAttr ? idxAttr.getX(t * 3 + 2) : t * 3 + 2;
                va.fromBufferAttribute(posAttr, i0);
                vb.fromBufferAttribute(posAttr, i1);
                vc.fromBufferAttribute(posAttr, i2);
                e1.subVectors(vb, va);
                e2.subVectors(vc, va);
                totalArea += e1.cross(e2).length() * 0.5;
                cumArea[t] = totalArea;
              }

              const markerPositions: number[] = [];
              const markerSeeds: number[] = [];
              let attempts = 0;
              while (markerSeeds.length < CONFIG.markerCount && attempts < 2400 && totalArea > 0) {
                attempts++;
                const r = Math.random() * totalArea;
                let lo = 0;
                let hi = triCount - 1;
                while (lo < hi) {
                  const mid = (lo + hi) >> 1;
                  if (cumArea[mid] < r) lo = mid + 1;
                  else hi = mid;
                }
                const i0 = idxAttr ? idxAttr.getX(lo * 3) : lo * 3;
                const i1 = idxAttr ? idxAttr.getX(lo * 3 + 1) : lo * 3 + 1;
                const i2 = idxAttr ? idxAttr.getX(lo * 3 + 2) : lo * 3 + 2;

                let r1 = Math.random();
                let r2 = Math.random();
                if (r1 + r2 > 1) {
                  r1 = 1 - r1;
                  r2 = 1 - r2;
                }
                const r0 = 1 - r1 - r2;

                const u =
                  r0 * uvAttr.getX(i0) + r1 * uvAttr.getX(i1) + r2 * uvAttr.getX(i2);
                const v =
                  r0 * uvAttr.getY(i0) + r1 * uvAttr.getY(i1) + r2 * uvAttr.getY(i2);
                const px = Math.min(
                  texCanvas.width - 1,
                  Math.max(0, Math.floor((((u % 1) + 1) % 1) * texCanvas.width))
                );
                const py = Math.min(
                  texCanvas.height - 1,
                  Math.max(0, Math.floor((1 - (((v % 1) + 1) % 1)) * texCanvas.height))
                );
                const off = (py * texCanvas.width + px) * 4;
                const cr = imgData[off];
                const cg = imgData[off + 1];
                const cb = imgData[off + 2];

                if (cb > cr + 6 && cb > cg + 6) continue;

                const wx =
                  (r0 * posAttr.getX(i0) + r1 * posAttr.getX(i1) + r2 * posAttr.getX(i2)) *
                  1.012;
                const wy =
                  (r0 * posAttr.getY(i0) + r1 * posAttr.getY(i1) + r2 * posAttr.getY(i2)) *
                  1.012;
                const wz =
                  (r0 * posAttr.getZ(i0) + r1 * posAttr.getZ(i1) + r2 * posAttr.getZ(i2)) *
                  1.012;

                markerPositions.push(wx, wy, wz);
                markerSeeds.push(Math.random());
              }

              if (markerSeeds.length > 0) {
                const mGeo = new THREE.BufferGeometry();
                mGeo.setAttribute(
                  'position',
                  new THREE.Float32BufferAttribute(markerPositions, 3)
                );
                mGeo.setAttribute('seed', new THREE.Float32BufferAttribute(markerSeeds, 1));
                const mMat = new THREE.ShaderMaterial({
                  transparent: true,
                  depthTest: true,
                  depthWrite: false,
                  blending: THREE.AdditiveBlending,
                  uniforms: {
                    uTime: { value: 0 },
                    uColor: { value: hexToVec3(CONFIG.markerColor) },
                    uSize: { value: CONFIG.markerSize },
                    uSpeed: { value: CONFIG.markerSpeed },
                    uRes: { value: resVec },
                  },
                  vertexShader: `
                    attribute float seed; uniform float uSize; uniform vec2 uRes;
                    varying float vSeed; varying float vFade;
                    void main(){
                      vSeed = seed;
                      vec4 mv = modelViewMatrix * vec4(position, 1.0);
                      vec3 vn = normalize(normalMatrix * normalize(position));
                      vec3 vd = normalize(-mv.xyz);
                      vFade = smoothstep(0.15, 0.5, dot(vn, vd));
                      gl_PointSize = max(uSize * uRes.y / 900.0 * (7.0 / max(-mv.z, 1.0)), 2.0);
                      gl_Position = projectionMatrix * mv;
                    }
                  `,
                  fragmentShader: `
                    uniform vec3 uColor; uniform float uTime; uniform float uSpeed;
                    varying float vSeed; varying float vFade;
                    void main(){
                      if (vFade <= 0.001) discard;
                      vec2 p = gl_PointCoord - 0.5;
                      float d = length(p) * 2.0;
                      if (d > 1.0) discard;
                      float core = smoothstep(0.30, 0.0, d) * 1.2;
                      float ph = fract(uTime * uSpeed + vSeed);
                      float ring = smoothstep(0.07, 0.0, abs(d - ph)) * (1.0 - ph);
                      gl_FragColor = vec4(uColor, clamp(core + ring, 0.0, 1.0) * vFade);
                    }
                  `,
                });
                const mPoints = new THREE.Points(mGeo, mMat);
                mPoints.layers.set(LAYERS.ENTIRE_SCENE);
                pMesh.add(mPoints);
                markerMat = mMat;
                disposables.push(mGeo, mMat);
              }
            }
          }
        }
      })
      .catch(() => {
        // Keep stars/atmosphere running if remote GLTF assets fail
      });

    // Resize listener
    const handleResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      const nextDpr = isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(nextDpr);
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      finalComposer.setPixelRatio(nextDpr);
      finalComposer.setSize(W, H);
      resVec.set(W, H);
    };
    window.addEventListener('resize', handleResize);

    // Choreography state
    let curP = 0;
    let curX = STOPS_X[0].v;
    let curY = STOPS_Y[0].v;
    let curZ = STOPS_Z[0].v;
    let curS = STOPS_S[0].v;
    let spinPhase = 0;
    let lastTime = performance.now();
    let frameId = 0;

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      setFallbackMode(true);
    };
    canvas.addEventListener('webglcontextlost', handleContextLost);

    const tick = () => {
      if (disposed || renderer.getContext().isContextLost()) return;
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      planetTime += dt / 12;
      cloudTime += dt / 20;
      starTime += dt;
      markerTime += dt;

      planetTimeUniform.value = planetTime;
      cloudTimeUniform.value = cloudTime;
      starMat.uniforms.uTime.value = starTime;
      if (markerMat) markerMat.uniforms.uTime.value = markerTime;

      cloudLayers.forEach((c) => {
        c.mesh.rotation.y += dt * c.spin;
      });

      const scrollMax = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const pTarget = clamp(window.scrollY / scrollMax, 0, 1);
      curP += (pTarget - curP) * Math.min(1, dt * 4.5);

      const sideScale = clamp(window.innerWidth / 1200, 0.5, 1);
      const targetX = sample(STOPS_X, curP) * sideScale;
      const targetY = sample(STOPS_Y, curP);
      const targetZ = sample(STOPS_Z, curP);
      const targetS = sample(STOPS_S, curP);

      const dampK = Math.min(1, dt * 3.2);
      curX += (targetX - curX) * dampK;
      curY += (targetY - curY) * dampK;
      curZ += (targetZ - curZ) * dampK;
      curS += (targetS - curS) * dampK;

      let entryY = 0;
      if (!reducedMotion && planetLoaded && entryElapsed < ENTRY_DUR) {
        entryElapsed = Math.min(ENTRY_DUR, entryElapsed + dt);
        const t = entryElapsed / ENTRY_DUR;
        const easeOutCubic = 1 - Math.pow(1 - t, 3);
        entryY = ENTRY_START_Y * (1 - easeOutCubic);
      } else if (!reducedMotion && !planetLoaded) {
        entryY = ENTRY_START_Y;
      }

      worldGroup.position.set(curX, curY + entryY, curZ);
      worldGroup.scale.setScalar(curS);

      spinPhase += dt * CONFIG.spin;
      planetGroup.rotation.y = CONFIG.initRotation + spinPhase + curP * Math.PI * 1.8;
      planetGroup.rotation.x = Math.sin(curP * Math.PI) * 0.14;
      starPoints.rotation.y = curP * 0.36;
      starPoints.rotation.x = curP * 0.12;
      glowMesh.quaternion.copy(camera.quaternion);
      controls.update();

      camera.layers.set(LAYERS.ENTIRE_SCENE);
      finalComposer.render();

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
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      dracoLoader.dispose();
      controls.dispose();
      finalComposer.dispose();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    };
  }, []);

  if (fallbackMode) {
    return (
      <div
        className="planet-canvas"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(85% 55% at 50% 108%, rgba(58, 108, 255, 0.24) 0%, rgba(16, 40, 96, 0.16) 42%, rgba(4, 10, 30, 0.96) 76%, #04060f 100%)',
        }}
      />
    );
  }

  return <canvas ref={canvasRef} className="planet-canvas" aria-hidden="true" />;
};
