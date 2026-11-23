import * as THREE from 'three';

export interface MaterialBank {
  cuticleBump: THREE.CanvasTexture;
  mossAlbedo: THREE.CanvasTexture;
  mossBump: THREE.CanvasTexture;
  groundDisp: THREE.CanvasTexture;
  groundRoughness: THREE.CanvasTexture;
  gutterMetalAlbedo: THREE.CanvasTexture;
  gutterBump: THREE.CanvasTexture;
  furAlbedo: THREE.CanvasTexture;
  kitchenFloorAlbedo: THREE.CanvasTexture;
  leafAlbedo: THREE.CanvasTexture;
  contactShadowTex: THREE.CanvasTexture;
  waterMat: THREE.MeshPhysicalMaterial;
  lucyMat: THREE.MeshPhysicalMaterial;
  algaeMat: THREE.MeshPhysicalMaterial;
  dustMat: THREE.MeshStandardMaterial;
  pebbleMat: THREE.MeshStandardMaterial;
  rootMat: THREE.MeshStandardMaterial;
  leafMat: THREE.MeshStandardMaterial;
  silkMat: THREE.MeshStandardMaterial;
  magicGlowMat: THREE.MeshStandardMaterial;
  grassUniforms: { uTime: { value: number } };
  createSwayingGrassMaterial: (baseHex: number) => THREE.MeshStandardMaterial;
  updateWindTime: (time: number) => void;
  dispose: () => void;
}

function makeCanvas(size = 512): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  return [c, ctx];
}

// Deterministic PRNG so textures look crisp & consistent
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Draw wrapped across 3x3 toroidal offsets so textures tile with ZERO seams!
function drawWrapped(size: number, x: number, y: number, fn: (wx: number, wy: number) => void) {
  for (let ox = -1; ox <= 1; ox++) {
    for (let oy = -1; oy <= 1; oy++) {
      fn(x + ox * size, y + oy * size);
    }
  }
}

function createWrinkleBump(anisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const [c, ctx] = makeCanvas(size);
  const rand = mulberry32(101);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 7) {
    const shade = 110 + Math.sin(y * 0.25) * 32;
    ctx.strokeStyle = `rgb(${shade},${shade},${shade})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= size; x += 16) {
      ctx.lineTo(x, y + Math.sin((x / size) * Math.PI * 2 + y) * 2.2);
    }
    ctx.stroke();
  }
  // Fine organic skin pores
  for (let i = 0; i < 650; i++) {
    const v = 86 + Math.floor(rand() * 88);
    ctx.fillStyle = `rgba(${v},${v},${v},0.32)`;
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, 1 + rand() * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = anisotropy;
  return tex;
}

function createMossTextures(anisotropy: number): {
  albedo: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
  disp: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
} {
  const size = 512;
  const [ac, actx] = makeCanvas(size);
  const [bc, bctx] = makeCanvas(size);
  const [dc, dctx] = makeCanvas(size);
  const [rc, rctx] = makeCanvas(size);
  const rand = mulberry32(412);

  actx.fillStyle = '#12261c';
  actx.fillRect(0, 0, size, size);
  bctx.fillStyle = '#585858';
  bctx.fillRect(0, 0, size, size);
  dctx.fillStyle = '#6e6e6e';
  dctx.fillRect(0, 0, size, size);
  rctx.fillStyle = '#d4d4d4'; // ~0.83 roughness base
  rctx.fillRect(0, 0, size, size);

  // Soft dark peat/loam mounds wrapped toroidally
  for (let i = 0; i < 85; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 22 + rand() * 42;
    const isHummock = i % 2 === 0;
    drawWrapped(size, x, y, (wx, wy) => {
      const grad = actx.createRadialGradient(wx, wy, 2, wx, wy, r);
      grad.addColorStop(0, isHummock ? 'rgba(18, 48, 36, 0.52)' : 'rgba(13, 18, 16, 0.62)');
      grad.addColorStop(1, 'rgba(13, 18, 16, 0)');
      actx.fillStyle = grad;
      actx.beginPath();
      actx.arc(wx, wy, r, 0, Math.PI * 2);
      actx.fill();

      const dgrad = dctx.createRadialGradient(wx, wy, 2, wx, wy, r);
      dgrad.addColorStop(0, isHummock ? 'rgba(210, 210, 210, 0.45)' : 'rgba(40, 40, 40, 0.45)');
      dgrad.addColorStop(1, 'rgba(110, 110, 110, 0)');
      dctx.fillStyle = dgrad;
      dctx.beginPath();
      dctx.arc(wx, wy, r, 0, Math.PI * 2);
      dctx.fill();

      // Damp hollows slightly glossier, moss cushions matte (~0.9)
      const rgrad = rctx.createRadialGradient(wx, wy, 2, wx, wy, r);
      rgrad.addColorStop(0, isHummock ? 'rgba(235, 235, 235, 0.45)' : 'rgba(135, 135, 135, 0.45)');
      rgrad.addColorStop(1, 'rgba(212, 212, 212, 0)');
      rctx.fillStyle = rgrad;
      rctx.beginPath();
      rctx.arc(wx, wy, r, 0, Math.PI * 2);
      rctx.fill();
    });
  }

  // Fine organic bryophyte fiber strokes (deep emerald -> nocturnal teal -> mossy olive)
  const greens = ['#19402d', '#1f543b', '#1b5e58', '#143325', '#2a6b48', '#224f4c'];
  for (let i = 0; i < 5800; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const angle = rand() * Math.PI * 2;
    const len = 4 + rand() * 10;
    const dx = Math.cos(angle) * len;
    const dy = Math.sin(angle) * len;
    const col = greens[i % greens.length];
    const bv = 95 + Math.floor(rand() * 150);

    drawWrapped(size, x, y, (wx, wy) => {
      actx.strokeStyle = col;
      actx.lineWidth = 1.6;
      actx.beginPath();
      actx.moveTo(wx, wy);
      actx.lineTo(wx + dx, wy + dy);
      actx.stroke();

      bctx.strokeStyle = `rgb(${bv},${bv},${bv})`;
      bctx.lineWidth = 1.6;
      bctx.beginPath();
      bctx.moveTo(wx, wy);
      bctx.lineTo(wx + dx, wy + dy);
      bctx.stroke();
    });
  }

  const albedo = new THREE.CanvasTexture(ac);
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.wrapS = albedo.wrapT = THREE.RepeatWrapping;
  albedo.repeat.set(10, 10);
  albedo.anisotropy = anisotropy;

  const bump = new THREE.CanvasTexture(bc);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(10, 10);
  bump.anisotropy = anisotropy;

  const disp = new THREE.CanvasTexture(dc);
  disp.wrapS = disp.wrapT = THREE.RepeatWrapping;
  disp.repeat.set(6, 6);

  const roughness = new THREE.CanvasTexture(rc);
  roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping;
  roughness.repeat.set(10, 10);

  return { albedo, bump, disp, roughness };
}

function createGutterTextures(anisotropy: number): {
  albedo: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const size = 512;
  const [ac, actx] = makeCanvas(size);
  const [bc, bctx] = makeCanvas(size);
  const rand = mulberry32(202);
  actx.fillStyle = '#33414e';
  actx.fillRect(0, 0, size, size);
  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 1100; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const len = 18 + rand() * 70;
    const isRust = i % 8 === 0;
    const col = isRust ? 'rgba(115, 70, 44, 0.32)' : 'rgba(175, 200, 222, 0.14)';
    const bv = i % 2 === 0 ? 'rgba(215,215,215,0.24)' : 'rgba(55,55,55,0.24)';

    drawWrapped(size, x, y, (wx, wy) => {
      actx.strokeStyle = col;
      actx.lineWidth = isRust ? 2.2 : 1;
      actx.beginPath();
      actx.moveTo(wx, wy);
      actx.lineTo(wx + len, wy + (rand() - 0.5) * 3);
      actx.stroke();

      bctx.strokeStyle = bv;
      bctx.beginPath();
      bctx.moveTo(wx, wy);
      bctx.lineTo(wx + len, wy);
      bctx.stroke();
    });
  }

  const albedo = new THREE.CanvasTexture(ac);
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.wrapS = albedo.wrapT = THREE.RepeatWrapping;
  albedo.repeat.set(6, 6);
  albedo.anisotropy = anisotropy;

  const bump = new THREE.CanvasTexture(bc);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(6, 6);
  bump.anisotropy = anisotropy;
  return { albedo, bump };
}

function createFurTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const [c, ctx] = makeCanvas(size);
  const rand = mulberry32(404);
  ctx.fillStyle = '#543018';
  ctx.fillRect(0, 0, size, size);
  const tones = ['#855228', '#3e210e', '#9e6839', '#311a0b', '#b38354'];
  for (let i = 0; i < 3200; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const col = tones[i % tones.length];
    drawWrapped(size, x, y, (wx, wy) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.quadraticCurveTo(wx + 10, wy + 14, wx + 22, wy + 32);
      ctx.stroke();
    });
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.anisotropy = anisotropy;
  return tex;
}

function createKitchenFloorTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const [c, ctx] = makeCanvas(size);
  const rand = mulberry32(505);
  ctx.fillStyle = '#262528';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(12, 13, 18, 0.65)';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 252, 252);
  ctx.strokeRect(258, 2, 252, 252);
  ctx.strokeRect(2, 258, 252, 252);
  ctx.strokeRect(258, 258, 252, 252);

  for (let i = 0; i < 1400; i++) {
    const shade = 55 + Math.floor(rand() * 65);
    const x = rand() * size;
    const y = rand() * size;
    ctx.fillStyle = `rgba(${shade},${shade + 2},${shade + 6},0.2)`;
    ctx.fillRect(x, y, 2 + rand() * 4, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.anisotropy = anisotropy;
  return tex;
}

function createLeafTexture(anisotropy: number): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(256);
  ctx.fillStyle = '#4e3b27';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#6c5338';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(128, 0);
  ctx.lineTo(128, 256);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  for (let y = 16; y < 256; y += 24) {
    ctx.beginPath();
    ctx.moveTo(128, y);
    ctx.lineTo(18, y - 18);
    ctx.moveTo(128, y);
    ctx.lineTo(238, y - 18);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = anisotropy;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(128);
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
  grad.addColorStop(0, 'rgba(3, 7, 12, 0.72)');
  grad.addColorStop(0.55, 'rgba(3, 7, 12, 0.34)');
  grad.addColorStop(1, 'rgba(3, 7, 12, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export function createMaterialBank(
  renderer: THREE.WebGLRenderer,
  isSoftwareGl: boolean
): MaterialBank {
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const cuticleBump = createWrinkleBump(anisotropy);
  const moss = createMossTextures(anisotropy);
  const gutter = createGutterTextures(anisotropy);
  const furAlbedo = createFurTexture(anisotropy);
  const kitchenFloorAlbedo = createKitchenFloorTexture(anisotropy);
  const leafAlbedo = createLeafTexture(anisotropy);
  const contactShadowTex = createContactShadowTexture();

  // Turquoise HDR-glowing water materials so selective Bloom catches water droplets!
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x67e8f9),
    emissive: new THREE.Color(0x06b6d4),
    emissiveIntensity: 1.35,
    roughness: 0.08,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    ior: 1.333,
    transmission: isSoftwareGl ? 0 : 0.84,
    thickness: 1.2,
    attenuationColor: new THREE.Color(0x22d3ee),
    attenuationDistance: 2.5,
    transparent: true,
    opacity: isSoftwareGl ? 0.84 : 0.96,
  });

  const lucyMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xa5f3fc),
    emissive: new THREE.Color(0x22d3ee),
    emissiveIntensity: 1.5,
    roughness: 0.06,
    metalness: 0.0,
    clearcoat: 1.0,
    ior: 1.34,
    transmission: isSoftwareGl ? 0 : 0.85,
    transparent: true,
    opacity: isSoftwareGl ? 0.86 : 0.96,
  });

  const algaeMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x4ade80),
    emissive: new THREE.Color(0x15803d),
    emissiveIntensity: 0.95,
    roughness: 0.35,
    clearcoat: 0.55,
    bumpMap: cuticleBump,
    bumpScale: 0.03,
  });

  const dustMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xfef08a),
    emissive: new THREE.Color(0xf59e0b),
    emissiveIntensity: 1.45,
    roughness: 0.4,
    metalness: 0.2,
  });

  const pebbleMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x8a97a3),
    roughness: 0.88,
    metalness: 0.04,
    bumpMap: gutter.bump,
    bumpScale: 0.06,
  });

  const rootMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x5c412d),
    roughness: 0.86,
    metalness: 0.02,
    bumpMap: cuticleBump,
    bumpScale: 0.07,
  });

  const leafMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xd6a474),
    map: leafAlbedo,
    roughness: 0.78,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  // Pearly white magic spiderweb / silk glow (caught selectively by Bloom)
  const silkMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xf8fafc),
    emissive: new THREE.Color(0xe2f4ff),
    emissiveIntensity: 1.55,
    roughness: 0.4,
    transparent: true,
    opacity: 0.82,
  });

  // Warm white / pale gold magic ring accent
  const magicGlowMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xfffbeb),
    emissive: new THREE.Color(0xfef3c7),
    emissiveIntensity: 1.7,
    roughness: 0.25,
  });

  const grassUniforms = {
    uTime: { value: 0 },
  };

  const createdGrassMats: THREE.MeshStandardMaterial[] = [];
  const createSwayingGrassMaterial = (baseHex: number) => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(baseHex),
      vertexColors: true,
      roughness: 0.84,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = grassUniforms.uTime;
      shader.vertexShader =
        `uniform float uTime;\n` +
        shader.vertexShader.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          float tipFactor = clamp(position.y / 0.95, 0.0, 1.0);
          float phase = position.x * 2.3 + position.z * 1.9;
          #ifdef USE_INSTANCING
            phase += instanceMatrix[3][0] * 0.45 + instanceMatrix[3][2] * 0.35;
          #endif
          transformed.x += sin(uTime * 1.45 + phase) * 0.085 * tipFactor * tipFactor;
          transformed.z += cos(uTime * 1.15 + phase * 0.8) * 0.065 * tipFactor * tipFactor;`
        );
    };
    mat.customProgramCacheKey = () => `swaying-grass-${baseHex}`;
    createdGrassMats.push(mat);
    return mat;
  };

  return {
    cuticleBump,
    mossAlbedo: moss.albedo,
    mossBump: moss.bump,
    groundDisp: moss.disp,
    groundRoughness: moss.roughness,
    gutterMetalAlbedo: gutter.albedo,
    gutterBump: gutter.bump,
    furAlbedo,
    kitchenFloorAlbedo,
    leafAlbedo,
    contactShadowTex,
    waterMat,
    lucyMat,
    algaeMat,
    dustMat,
    pebbleMat,
    rootMat,
    leafMat,
    silkMat,
    magicGlowMat,
    grassUniforms,
    createSwayingGrassMaterial,
    updateWindTime: (time: number) => {
      grassUniforms.uTime.value = time;
    },
    dispose: () => {
      cuticleBump.dispose();
      moss.albedo.dispose();
      moss.bump.dispose();
      moss.disp.dispose();
      moss.roughness.dispose();
      gutter.albedo.dispose();
      gutter.bump.dispose();
      furAlbedo.dispose();
      kitchenFloorAlbedo.dispose();
      leafAlbedo.dispose();
      contactShadowTex.dispose();
      waterMat.dispose();
      lucyMat.dispose();
      algaeMat.dispose();
      dustMat.dispose();
      pebbleMat.dispose();
      rootMat.dispose();
      leafMat.dispose();
      silkMat.dispose();
      magicGlowMat.dispose();
      createdGrassMats.forEach((m) => m.dispose());
    },
  };
}
