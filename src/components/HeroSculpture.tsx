import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

function detectSoftwareWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export const HeroSculpture: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSoftwareGl = detectSoftwareWebGL();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));

    const initialWidth = Math.max(container.clientWidth, 300);
    const initialHeight = Math.max(container.clientHeight, 320);
    renderer.setSize(initialWidth, initialHeight);
    renderer.domElement.className = 'w-full h-full block outline-none';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0d0f, 0.032);

    const camera = new THREE.PerspectiveCamera(38, initialWidth / initialHeight, 0.1, 100);
    camera.position.set(0, 0.25, 7.6);
    camera.lookAt(0, 0, 0);

    // Procedural Studio Reflections for metallic silver & anodized teal surfaces
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    // Studio 3-point lighting with warm ivory key & cool teal fill
    const hemiLight = new THREE.HemisphereLight(0x4db6ac, 0x0a0d0f, 0.75);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xf6f2e9, 2.2);
    keyLight.position.set(5.5, 6.5, 5.5);
    scene.add(keyLight);

    const tealRim = new THREE.DirectionalLight(0x4db6ac, 1.55);
    tealRim.position.set(-5.5, -2.5, -4.5);
    scene.add(tealRim);

    const silverFill = new THREE.DirectionalLight(0xd4dce0, 0.85);
    silverFill.position.set(-3.5, 4, 4);
    scene.add(silverFill);

    // Track disposable resources
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
      geometries.push(g);
      return g;
    };
    const trackMat = <T extends THREE.Material>(m: T): T => {
      materials.push(m);
      return m;
    };

    // Sculptural Materials (Charcoal Matte, Anodized Deep Teal, Brushed Silver, Warm Ivory Ceramic)
    const charcoalMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x171d21,
        metalness: 0.35,
        roughness: 0.64,
      }),
    );

    const tealMetalMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0x1e6b70,
        metalness: 0.86,
        roughness: 0.22,
        clearcoat: 0.6,
        clearcoatRoughness: 0.2,
      }),
    );

    const silverMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0xd0d7da,
        metalness: 0.94,
        roughness: 0.17,
        anisotropy: 0.65,
      }),
    );

    const ivoryMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xebe6dc,
        metalness: 0.08,
        roughness: 0.72,
      }),
    );

    const wireMat = trackMat(
      new THREE.LineBasicMaterial({
        color: 0x4db6ac,
        transparent: true,
        opacity: 0.38,
      }),
    );

    // Composite Abstract Architectural Sculpture (7+ distinct parts)
    const sculptureGroup = new THREE.Group();
    scene.add(sculptureGroup);

    // Part 1: Fluted Hyperbolic Monolith Core (LatheGeometry)
    const lathePoints: THREE.Vector2[] = [];
    for (let i = 0; i <= 28; i++) {
      const t = i / 28;
      const y = (t - 0.5) * 3.1;
      const waist = 0.42 + 0.34 * Math.pow(Math.sin(t * Math.PI), 0.75);
      const flare = 0.14 * Math.cos(t * Math.PI * 3);
      lathePoints.push(new THREE.Vector2(Math.max(0.06, waist + flare * 0.4), y));
    }
    const coreGeo = trackGeo(new THREE.LatheGeometry(lathePoints, 48));
    const coreMesh = new THREE.Mesh(coreGeo, charcoalMat);
    coreMesh.rotation.z = 0.18;
    sculptureGroup.add(coreMesh);

    // Part 2: Chamfered Architectural Fin Ribs (ExtrudeGeometry)
    const finShape = new THREE.Shape();
    finShape.moveTo(0, -1.2);
    finShape.quadraticCurveTo(0.85, -0.4, 0.95, 0.15);
    finShape.quadraticCurveTo(0.75, 0.95, 0, 1.3);
    finShape.quadraticCurveTo(0.32, 0.15, 0, -1.2);

    const finGeo = trackGeo(
      new THREE.ExtrudeGeometry(finShape, {
        depth: 0.09,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.03,
        bevelSegments: 3,
      }),
    );
    finGeo.center();

    const finAngles = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];
    const finGroup = new THREE.Group();
    finAngles.forEach((angle) => {
      const fin = new THREE.Mesh(finGeo, silverMat);
      fin.position.set(Math.cos(angle) * 0.62, 0, Math.sin(angle) * 0.62);
      fin.rotation.y = -angle;
      finGroup.add(fin);
    });
    finGroup.rotation.z = -0.16;
    sculptureGroup.add(finGroup);

    // Part 3: Primary Anodized Teal Torus Ring
    const mainRingGeo = trackGeo(new THREE.TorusGeometry(1.75, 0.085, 28, 110));
    const mainRing = new THREE.Mesh(mainRingGeo, tealMetalMat);
    mainRing.rotation.set(Math.PI / 3.1, Math.PI / 5.5, 0.25);
    sculptureGroup.add(mainRing);

    // Part 4: Secondary Counter-Tilted Silver Torus Ring
    const secondaryRingGeo = trackGeo(new THREE.TorusGeometry(1.42, 0.045, 22, 96));
    const secondaryRing = new THREE.Mesh(secondaryRingGeo, silverMat);
    secondaryRing.rotation.set(-Math.PI / 3.4, -Math.PI / 4, -0.35);
    sculptureGroup.add(secondaryRing);

    // Part 5: Sculptural Harmonic Ribbon (TubeGeometry along closed CatmullRomCurve3)
    const curvePoints: THREE.Vector3[] = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      curvePoints.push(
        new THREE.Vector3(
          Math.cos(a) * (1.28 + 0.25 * Math.cos(2 * a)),
          Math.sin(2 * a) * 0.72,
          Math.sin(a) * (1.28 + 0.25 * Math.cos(2 * a)),
        ),
      );
    }
    const harmonicCurve = new THREE.CatmullRomCurve3(curvePoints, true);
    const ribbonGeo = trackGeo(new THREE.TubeGeometry(harmonicCurve, 120, 0.038, 16, true));
    const ribbonMesh = new THREE.Mesh(ribbonGeo, ivoryMat);
    ribbonMesh.rotation.z = 0.35;
    sculptureGroup.add(ribbonMesh);

    // Part 6: Ceramic Ivory Satellite Facets
    const satGeo1 = trackGeo(new THREE.OctahedronGeometry(0.24, 0));
    const sat1 = new THREE.Mesh(satGeo1, ivoryMat);
    sat1.position.set(1.68, 1.05, 0.45);
    sculptureGroup.add(sat1);

    const satGeo2 = trackGeo(new THREE.IcosahedronGeometry(0.18, 0));
    const sat2 = new THREE.Mesh(satGeo2, tealMetalMat);
    sat2.position.set(-1.55, -0.95, 0.65);
    sculptureGroup.add(sat2);

    // Part 7: Precision Architectural Wireframe Orbit
    const orbitPts: THREE.Vector3[] = [];
    for (let i = 0; i < 96; i++) {
      const theta = (i / 96) * Math.PI * 2;
      orbitPts.push(new THREE.Vector3(Math.cos(theta) * 2.25, 0, Math.sin(theta) * 2.25));
    }
    const orbitGeo = trackGeo(new THREE.BufferGeometry().setFromPoints(orbitPts));
    const orbitLine = new THREE.LineLoop(orbitGeo, wireMat);
    orbitLine.rotation.set(0.55, 0.2, -0.4);
    sculptureGroup.add(orbitLine);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Pointer parallax targets (zero GC allocations inside loop)
    let pointerX = 0;
    let pointerY = 0;
    let frameId = 0;
    let disposed = false;
    let contextLost = false;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const renderSingleFrame = () => {
      if (disposed || contextLost) return;
      renderer.render(scene, camera);
    };

    const tick = () => {
      if (disposed || contextLost) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        sculptureGroup.rotation.y += dt * 0.22;
        mainRing.rotation.z += dt * 0.14;
        secondaryRing.rotation.x -= dt * 0.18;
        finGroup.rotation.y -= dt * 0.1;
        sat1.position.y = 1.05 + Math.sin(elapsed * 1.1) * 0.14;
        sat2.position.y = -0.95 + Math.cos(elapsed * 0.9) * 0.14;
      }

      const targetTiltX = pointerY * 0.22;
      const targetTiltZ = -pointerX * 0.18;
      sculptureGroup.rotation.x = THREE.MathUtils.damp(
        sculptureGroup.rotation.x,
        targetTiltX,
        4.5,
        dt,
      );
      sculptureGroup.rotation.z = THREE.MathUtils.damp(
        sculptureGroup.rotation.z,
        targetTiltZ,
        4.5,
        dt,
      );

      renderer.render(scene, camera);

      if (prefersReducedMotion) {
        return;
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      pointerX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      if (prefersReducedMotion) {
        sculptureGroup.rotation.x = pointerY * 0.16;
        sculptureGroup.rotation.y = pointerX * 0.24;
        renderSingleFrame();
      }
    };

    const handlePointerLeave = () => {
      pointerX = 0;
      pointerY = 0;
      if (prefersReducedMotion) {
        sculptureGroup.rotation.set(0, 0, 0);
        renderSingleFrame();
      }
    };

    const handleResize = () => {
      if (disposed) return;
      const width = Math.max(container.clientWidth, 260);
      const height = Math.max(container.clientHeight, 260);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      if (prefersReducedMotion) {
        renderSingleFrame();
      }
    };

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
    };

    const handleContextRestored = () => {
      contextLost = false;
      tick();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerleave', handlePointerLeave);
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    if (prefersReducedMotion) {
      renderSingleFrame();
    } else {
      tick();
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);

      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (webglUnavailable) {
    return (
      <div
        aria-hidden="true"
        className="w-full h-[380px] sm:h-[480px] lg:h-[540px] flex items-center justify-center"
      >
        <svg viewBox="0 0 400 400" className="w-72 h-72 sm:w-96 sm:h-96">
          <circle
            cx="200"
            cy="200"
            r="148"
            fill="none"
            stroke="rgba(77,182,172,0.3)"
            strokeWidth="1"
          />
          <ellipse
            cx="200"
            cy="200"
            rx="132"
            ry="58"
            transform="rotate(-28 200 200)"
            fill="none"
            stroke="#1E6B70"
            strokeWidth="6"
          />
          <ellipse
            cx="200"
            cy="200"
            rx="116"
            ry="44"
            transform="rotate(34 200 200)"
            fill="none"
            stroke="#C4CCCD"
            strokeWidth="3"
          />
          <polygon points="200,82 232,200 200,318 168,200" fill="#171D21" stroke="#F2EFE9" strokeOpacity="0.22" />
        </svg>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      aria-label="Interactive abstract architectural sculpture"
      role="img"
      className="w-full h-[360px] sm:h-[460px] lg:h-[540px] relative select-none cursor-grab active:cursor-grabbing"
    />
  );
};
