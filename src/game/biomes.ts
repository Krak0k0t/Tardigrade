import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MaterialBank } from './materials';
import { createNpcModel } from './models';
import { ChapterId, GraphicsQuality } from './types';

// Volumetric cross-blade & arched grass/moss cluster with vertex color gradient (dark green -> teal)
function createVolumetricGrassTuftGeometry(): THREE.BufferGeometry {
  const blades: THREE.BufferGeometry[] = [];
  const baseCol = new THREE.Color(0x1b543a);
  const midCol = new THREE.Color(0x329c6d);
  const tipCol = new THREE.Color(0x4fd1c5);
  const tmpCol = new THREE.Color();

  for (let b = 0; b < 6; b++) {
    const h = 0.72 + (b % 3) * 0.22;
    const w = 0.19 + (b % 2) * 0.05;
    const plane = new THREE.PlaneGeometry(w, h, 1, 3);
    plane.translate(0, h * 0.5, 0);

    // Bend blade organically outward & apply vertical vertexColors
    const pos = plane.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = Math.max(0, Math.min(1, y / h));
      // Taper width toward tip & arch outward
      const x = pos.getX(i) * (1 - t * 0.85);
      const zCurve = t * t * 0.24;
      pos.setXYZ(i, x, y, pos.getZ(i) + zCurve);

      if (t < 0.55) {
        tmpCol.lerpColors(baseCol, midCol, t / 0.55);
      } else {
        tmpCol.lerpColors(midCol, tipCol, (t - 0.55) / 0.45);
      }
      colors[i * 3] = tmpCol.r;
      colors[i * 3 + 1] = tmpCol.g;
      colors[i * 3 + 2] = tmpCol.b;
    }
    plane.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const angle = (b / 6) * Math.PI * 2 + (b % 2) * 0.35;
    plane.rotateY(angle);
    plane.translate(Math.cos(angle) * 0.09, 0, Math.sin(angle) * 0.09);
    plane.computeVertexNormals();
    blades.push(plane);
  }

  const merged = mergeGeometries(blades);
  blades.forEach((b) => b.dispose());
  return merged;
}

function createOrganicPebbleGeometry(): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(0.7, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const n = 1 + 0.18 * Math.sin(x * 3.1 + z * 2.7) * Math.cos(y * 2.9);
    pos.setXYZ(i, x * n * 1.2, y * n * 0.58, z * n);
  }
  geo.computeVertexNormals();
  return geo;
}

function createTwistedRootGeometry(): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.3, 0.04, -0.25),
    new THREE.Vector3(-0.45, 0.22, 0.18),
    new THREE.Vector3(0.45, 0.14, -0.15),
    new THREE.Vector3(1.35, 0.02, 0.28),
  ]);
  return new THREE.TubeGeometry(curve, 12, 0.11, 7, false);
}

function createFallenLeafGeometry(): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(0.75, 1.15, 2, 4);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const taper = Math.max(0.15, 1 - Math.pow(z / 0.6, 2));
    const curlY = Math.pow(Math.abs(x) * 2.2, 2) * 0.08 + Math.sin(z * 3.2) * 0.05;
    pos.setXYZ(i, x * taper, curlY + 0.04, z);
  }
  geo.computeVertexNormals();
  return geo;
}

function createSpiderwebGroup(silkMat: THREE.Material): THREE.Group {
  const web = new THREE.Group();
  const radialCount = 7;
  const radius = 2.1;
  const threadGeo = new THREE.CylinderGeometry(0.014, 0.014, radius, 5);
  for (let i = 0; i < radialCount; i++) {
    const ang = (i / radialCount) * Math.PI * 0.9 - Math.PI * 0.45;
    const strand = new THREE.Mesh(threadGeo, silkMat);
    strand.position.set(Math.sin(ang) * radius * 0.5, 1.1 + Math.cos(ang) * radius * 0.5, 0);
    strand.rotation.z = -ang;
    web.add(strand);
  }
  for (let ring = 0; ring < 3; ring++) {
    const r = 0.55 + ring * 0.48;
    const arc = new THREE.Mesh(new THREE.TorusGeometry(r, 0.013, 5, 18, Math.PI * 0.85), silkMat);
    arc.position.set(0, 1.1, 0);
    arc.rotation.z = Math.PI * 0.075;
    web.add(arc);
  }
  return web;
}

export interface WorldInteractable {
  id: string;
  kind: 'npc' | 'puzzle' | 'droplet' | 'dust' | 'algae' | 'exit' | 'shop';
  labelKey: string;
  position: THREE.Vector3;
  radius: number;
  mesh: THREE.Object3D;
  collected?: boolean;
  npcKind?: 'bubble' | 'umo' | 'lucy' | 'dunya' | 'semyon' | 'gosha' | 'elder' | 'fleas';
  puzzleTag?: string;
}

export interface BuiltBiome {
  group: THREE.Group;
  interactables: WorldInteractable[];
  waterSources: THREE.Vector3[];
  spawnPoint: THREE.Vector3;
  exitPoint: THREE.Vector3;
  exitBeacon: THREE.Mesh;
  skyColor: number;
  fogDensity: number;
  keyLightColor: number;
  keyLightIntensity: number;
  hemiSky: number;
  hemiGround: number;
  swayMode: 'none' | 'dog_walk' | 'current';
  groundHeightAt: (x: number, z: number) => number;
  dispose: () => void;
}

export function buildBiome(
  chapter: ChapterId,
  mats: MaterialBank,
  quality: GraphicsQuality
): BuiltBiome {
  const group = new THREE.Group();
  const interactables: WorldInteractable[] = [];
  const waterSources: THREE.Vector3[] = [];
  const disposables: { dispose: () => void }[] = [];

  const densityScale =
    quality === 'low' ? 0.35 : quality === 'balanced' ? 0.6 : quality === 'high' ? 0.9 : 1.0;

  // Nocturnal dark bluish atmospheric fog + cool moonlight/window contrast
  const configs: Record<
    ChapterId,
    {
      sky: number;
      fog: number;
      key: number;
      keyInt: number;
      hemiS: number;
      hemiG: number;
      sway: BuiltBiome['swayMode'];
    }
  > = {
    1: { sky: 0x08131d, fog: 0.031, key: 0xaad4ff, keyInt: 2.55, hemiS: 0x26486e, hemiG: 0x070e0c, sway: 'none' },
    2: { sky: 0x071320, fog: 0.032, key: 0x93c5fd, keyInt: 2.45, hemiS: 0x1d4d73, hemiG: 0x060c14, sway: 'current' },
    3: { sky: 0x061521, fog: 0.03, key: 0xbae6fd, keyInt: 2.5, hemiS: 0x1e4e68, hemiG: 0x051017, sway: 'current' },
    4: { sky: 0x130e17, fog: 0.032, key: 0xd8c7ff, keyInt: 2.35, hemiS: 0x4b3869, hemiG: 0x140b08, sway: 'dog_walk' },
    5: { sky: 0x0a0d16, fog: 0.035, key: 0xbfd7ff, keyInt: 2.1, hemiS: 0x2a3b59, hemiG: 0x09080c, sway: 'none' },
    6: { sky: 0x08181c, fog: 0.026, key: 0xc7f0ff, keyInt: 2.65, hemiS: 0x295f66, hemiG: 0x071511, sway: 'none' },
  };
  const cfg = configs[chapter];

  const groundHeightAt = (x: number, z: number): number => {
    if (chapter === 1 || chapter === 6) {
      return (
        Math.sin(x * 0.16) * 0.44 +
        Math.cos(z * 0.18) * 0.38 +
        Math.sin((x + z) * 0.09) * 0.24
      );
    }
    if (chapter === 2) {
      return Math.min(2.4, x * x * 0.012) + Math.sin(z * 0.15) * 0.22;
    }
    if (chapter === 4) {
      return Math.cos(x * 0.09) * 0.52 + Math.sin(z * 0.12) * 0.3;
    }
    // Gentle outer edge mounds in Ch3/Ch5 while keeping central path smooth
    const radial = Math.max(0, Math.hypot(x, z) - 7) * 0.03;
    return Math.sin(x * 0.22) * Math.cos(z * 0.22) * Math.min(0.45, radial);
  };

  // --- GROUND TERRAIN (110x110 seamless horizon mesh with displacement hills) ---
  const terrainGeo = new THREE.PlaneGeometry(110, 110, 64, 64);
  terrainGeo.rotateX(-Math.PI / 2);
  const posAttr = terrainGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vz = posAttr.getZ(i);
    posAttr.setY(i, groundHeightAt(vx, vz));
  }
  terrainGeo.computeVertexNormals();
  disposables.push(terrainGeo);

  let groundMat: THREE.MeshStandardMaterial;
  if (chapter === 1 || chapter === 6) {
    groundMat = new THREE.MeshStandardMaterial({
      color: chapter === 6 ? 0xbef2dc : 0xcde7dc,
      map: mats.mossAlbedo,
      bumpMap: mats.mossBump,
      bumpScale: 0.26,
      displacementMap: mats.groundDisp,
      displacementScale: 0.28,
      displacementBias: -0.14,
      roughnessMap: mats.groundRoughness,
      roughness: 0.88,
      metalness: 0.02,
    });
  } else if (chapter === 2) {
    groundMat = new THREE.MeshStandardMaterial({
      color: 0xb8cbd9,
      map: mats.gutterMetalAlbedo,
      bumpMap: mats.gutterBump,
      bumpScale: 0.1,
      roughness: 0.48,
      metalness: 0.55,
    });
  } else if (chapter === 3) {
    groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f3b4c,
      roughness: 0.24,
      metalness: 0.1,
      bumpMap: mats.mossBump,
      bumpScale: 0.06,
    });
  } else if (chapter === 4) {
    groundMat = new THREE.MeshStandardMaterial({
      color: 0xdcc8b8,
      map: mats.furAlbedo,
      displacementMap: mats.groundDisp,
      displacementScale: 0.22,
      roughness: 0.9,
      metalness: 0.02,
    });
  } else {
    groundMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      map: mats.kitchenFloorAlbedo,
      roughness: 0.78,
      metalness: 0.05,
    });
  }
  disposables.push(groundMat);

  const ground = new THREE.Mesh(terrainGeo, groundMat);
  ground.receiveShadow = true;
  group.add(ground);

  // --- INSTANCED VOLUMETRIC GRASS / MOSS TUFTS (Vertex-colored + Swaying + Roughness 0.84) ---
  const grassCount = Math.floor(
    (chapter === 1 || chapter === 4 || chapter === 6 ? 340 : 180) * densityScale
  );
  const grassGeo =
    chapter === 5
      ? createOrganicPebbleGeometry()
      : chapter === 2 || chapter === 3
        ? createVolumetricGrassTuftGeometry()
        : createVolumetricGrassTuftGeometry();
  disposables.push(grassGeo);

  const grassMat =
    chapter === 5
      ? mats.pebbleMat
      : mats.createSwayingGrassMaterial(
          chapter === 4
            ? 0xd99b66
            : chapter === 2 || chapter === 3
              ? 0xb8f2f5
              : 0xffffff
        );

  const grassInst = new THREE.InstancedMesh(grassGeo, grassMat, grassCount);
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  const cDarkGreen = new THREE.Color(0x6da67b);
  const cTeal = new THREE.Color(0x7be0db);

  for (let i = 0; i < grassCount; i++) {
    const angle = (i * 137.508 * Math.PI) / 180;
    const dist = 3.2 + ((i * 6.7) % 38);
    let ix = Math.cos(angle) * dist;
    let iz = Math.sin(angle) * dist;
    if (Math.hypot(ix - 0, iz - 5.5) < 3.1) {
      ix += ix >= 0 ? 3.4 : -3.4;
      iz += 3.2;
    }
    const iy = groundHeightAt(ix, iz);

    dummy.position.set(ix, iy + (chapter === 5 ? 0.12 : 0.0), iz);
    const sc = 0.68 + ((i * 19) % 100) / 135;
    dummy.scale.set(sc, sc * (chapter === 4 ? 1.35 : 1.05), sc);
    dummy.rotation.set(Math.sin(i) * 0.14, (i * 0.73) % (Math.PI * 2), Math.cos(i) * 0.14);
    dummy.updateMatrix();
    grassInst.setMatrixAt(i, dummy.matrix);

    const mix = ((i * 29) % 100) / 100;
    tint.lerpColors(cDarkGreen, cTeal, mix);
    if (chapter === 4) tint.setRGB(0.75 + mix * 0.25, 0.54 + mix * 0.25, 0.34 + mix * 0.15);
    grassInst.setColorAt(i, tint);
  }
  grassInst.instanceMatrix.needsUpdate = true;
  if (grassInst.instanceColor) grassInst.instanceColor.needsUpdate = true;
  grassInst.computeBoundingSphere();
  grassInst.receiveShadow = true;
  grassInst.castShadow = true;
  group.add(grassInst);

  // --- INSTANCED PEBBLES / STONES ---
  const pebbleCount = Math.floor(85 * densityScale);
  const pebbleGeo = createOrganicPebbleGeometry();
  disposables.push(pebbleGeo);
  const pebbleInst = new THREE.InstancedMesh(pebbleGeo, mats.pebbleMat, pebbleCount);
  for (let i = 0; i < pebbleCount; i++) {
    const angle = (i * 97.3 * Math.PI) / 180;
    const dist = 4.2 + ((i * 9.1) % 34);
    let px = Math.cos(angle) * dist;
    let pz = Math.sin(angle) * dist;
    if (Math.hypot(px, pz - 5.5) < 3.6) {
      px += px >= 0 ? 3.8 : -3.8;
      pz -= 3.2;
    }
    const py = groundHeightAt(px, pz);
    const sc = 0.38 + ((i * 17) % 100) / 110;
    dummy.position.set(px, py + 0.08 * sc, pz);
    dummy.scale.set(sc * 1.1, sc * 0.85, sc);
    dummy.rotation.set(Math.sin(i) * 0.2, i * 1.1, Math.cos(i) * 0.2);
    dummy.updateMatrix();
    pebbleInst.setMatrixAt(i, dummy.matrix);
    const s = 0.68 + ((i * 23) % 35) / 100;
    tint.setRGB(s * 0.88, s * 0.94, s * 1.04);
    pebbleInst.setColorAt(i, tint);
  }
  pebbleInst.instanceMatrix.needsUpdate = true;
  if (pebbleInst.instanceColor) pebbleInst.instanceColor.needsUpdate = true;
  pebbleInst.computeBoundingSphere();
  pebbleInst.castShadow = true;
  pebbleInst.receiveShadow = true;
  group.add(pebbleInst);

  // --- INSTANCED TWISTED ROOTS & FALLEN LEAVES ---
  const rootCount = Math.floor((chapter === 1 || chapter === 6 || chapter === 2 ? 42 : 18) * densityScale);
  const rootGeo = createTwistedRootGeometry();
  disposables.push(rootGeo);
  const rootInst = new THREE.InstancedMesh(rootGeo, mats.rootMat, rootCount);
  for (let i = 0; i < rootCount; i++) {
    const angle = (i * 151.7 * Math.PI) / 180;
    const dist = 6.5 + ((i * 8.4) % 28);
    let rx = Math.cos(angle) * dist;
    let rz = Math.sin(angle) * dist;
    if (Math.hypot(rx, rz - 5.5) < 3.8) {
      rx += rx >= 0 ? 4.2 : -4.2;
      rz -= 3.8;
    }
    const ry = groundHeightAt(rx, rz);
    const sc = 0.8 + ((i * 13) % 80) / 100;
    dummy.position.set(rx, ry + 0.04, rz);
    dummy.scale.setScalar(sc);
    dummy.rotation.set(0, i * 0.9, 0);
    dummy.updateMatrix();
    rootInst.setMatrixAt(i, dummy.matrix);
    const s = 0.78 + ((i * 19) % 30) / 100;
    tint.setRGB(s, s * 0.88, s * 0.78);
    rootInst.setColorAt(i, tint);
  }
  rootInst.instanceMatrix.needsUpdate = true;
  if (rootInst.instanceColor) rootInst.instanceColor.needsUpdate = true;
  rootInst.computeBoundingSphere();
  rootInst.castShadow = true;
  rootInst.receiveShadow = true;
  group.add(rootInst);

  const leafCount = Math.floor(54 * densityScale);
  const leafGeo = createFallenLeafGeometry();
  disposables.push(leafGeo);
  const leafInst = new THREE.InstancedMesh(leafGeo, mats.leafMat, leafCount);
  for (let i = 0; i < leafCount; i++) {
    const angle = (i * 119.3 * Math.PI) / 180;
    const dist = 3.8 + ((i * 7.7) % 30);
    let lx = Math.cos(angle) * dist;
    let lz = Math.sin(angle) * dist;
    if (Math.hypot(lx, lz - 5.5) < 3.4) {
      lx += lx >= 0 ? 3.5 : -3.5;
      lz -= 3.2;
    }
    const ly = groundHeightAt(lx, lz);
    const sc = 0.65 + ((i * 21) % 70) / 100;
    dummy.position.set(lx, ly + 0.05, lz);
    dummy.scale.setScalar(sc);
    dummy.rotation.set(Math.sin(i) * 0.12, i * 1.35, Math.cos(i) * 0.12);
    dummy.updateMatrix();
    leafInst.setMatrixAt(i, dummy.matrix);
    const warm = 0.6 + ((i * 17) % 45) / 100;
    tint.setRGB(warm * 1.05, warm * 0.72, warm * 0.45);
    leafInst.setColorAt(i, tint);
  }
  leafInst.instanceMatrix.needsUpdate = true;
  if (leafInst.instanceColor) leafInst.instanceColor.needsUpdate = true;
  leafInst.computeBoundingSphere();
  leafInst.receiveShadow = true;
  group.add(leafInst);

  // --- GLOWING SPIDERWEBS / DEWY SILK ARCHES (White selective bloom contrast) ---
  const webPositions: [number, number, number][] = [
    [-8.5, -5.5, 0.5],
    [9.2, -7.8, -0.7],
    [-4.8, -13.5, 0.15],
  ];
  webPositions.forEach(([wx, wz, rotY]) => {
    const web = createSpiderwebGroup(mats.silkMat);
    web.position.set(wx, groundHeightAt(wx, wz), wz);
    web.rotation.y = rotY;
    group.add(web);
  });

  // --- NATURAL LANDMARK VISTAS WITH LOD (Level of Detail) ---
  if (chapter === 1 || chapter === 6) {
    const stalkHigh = new THREE.CylinderGeometry(0.11, 0.22, 6.8, 12);
    const stalkLow = new THREE.CylinderGeometry(0.12, 0.22, 6.8, 5);
    const capHigh = new THREE.SphereGeometry(0.65, 16, 12);
    const capLow = new THREE.SphereGeometry(0.65, 6, 5);
    const stalkMat = new THREE.MeshStandardMaterial({ color: 0x3b6e28, roughness: 0.8 });
    const capMat = new THREE.MeshStandardMaterial({
      color: 0xe6a145,
      emissive: 0x7c4a12,
      emissiveIntensity: 0.45,
      roughness: 0.55,
    });
    disposables.push(stalkHigh, stalkLow, capHigh, capLow, stalkMat, capMat);
    [
      [-7.5, -9],
      [9.5, -11],
      [-13, 4],
      [12, 6],
      [-16, -18],
      [16, -19],
    ].forEach(([lx, lz]) => {
      const sy = groundHeightAt(lx, lz);
      const lod = new THREE.LOD();

      const highGrp = new THREE.Group();
      const stH = new THREE.Mesh(stalkHigh, stalkMat);
      stH.position.set(0, 3.2, 0);
      stH.rotation.z = lx > 0 ? -0.11 : 0.11;
      stH.castShadow = true;
      const cpH = new THREE.Mesh(capHigh, capMat);
      cpH.scale.set(1, 1.35, 1);
      cpH.position.set(lx > 0 ? 0.35 : -0.35, 6.6, 0);
      cpH.castShadow = true;
      highGrp.add(stH, cpH);

      const lowGrp = new THREE.Group();
      const stL = new THREE.Mesh(stalkLow, stalkMat);
      stL.position.set(0, 3.2, 0);
      const cpL = new THREE.Mesh(capLow, capMat);
      cpL.position.set(0, 6.6, 0);
      lowGrp.add(stL, cpL);

      lod.addLevel(highGrp, 0);
      lod.addLevel(lowGrp, 18);
      lod.position.set(lx, sy, lz);
      group.add(lod);
    });
  }

  if (chapter === 2) {
    const streamGeo = new THREE.PlaneGeometry(8, 84);
    streamGeo.rotateX(-Math.PI / 2);
    const stream = new THREE.Mesh(streamGeo, mats.waterMat);
    stream.position.set(0, 0.14, 0);
    disposables.push(streamGeo);
    group.add(stream);
  } else if (chapter === 3) {
    const postGeo = new THREE.CylinderGeometry(0.14, 0.22, 3.8, 10);
    const bulbGeo = new THREE.SphereGeometry(0.45, 14, 12);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x155e75, roughness: 0.45 });
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.85,
      roughness: 0.15,
    });
    disposables.push(postGeo, bulbGeo, postMat, bulbMat);
    [
      [-8, -6],
      [8, -6],
      [0, -14],
    ].forEach(([px, pz]) => {
      const p = new THREE.Mesh(postGeo, postMat);
      p.position.set(px, 1.9, pz);
      const b = new THREE.Mesh(bulbGeo, bulbMat);
      b.position.set(px, 3.9, pz);
      group.add(p, b);
    });
  } else if (chapter === 4) {
    const collarGeo = new THREE.TorusGeometry(22, 2.2, 12, 48, Math.PI);
    const collarMat = new THREE.MeshStandardMaterial({ color: 0x6b1d1d, roughness: 0.7 });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.set(0, 1.8, -18);
    disposables.push(collarGeo, collarMat);
    group.add(collar);
  } else if (chapter === 5) {
    const fridgeGeo = new THREE.BoxGeometry(36, 14, 12);
    const fridgeMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6, metalness: 0.35 });
    const fridge = new THREE.Mesh(fridgeGeo, fridgeMat);
    fridge.position.set(0, 7.5, -20);
    disposables.push(fridgeGeo, fridgeMat);
    group.add(fridge);

    const lamp = new THREE.PointLight(0xfbbf24, 3.0, 26);
    lamp.position.set(0, 4.5, -11);
    group.add(lamp);
  } else if (chapter === 6) {
    const pipeGeo = new THREE.CylinderGeometry(1.1, 1.1, 16, 18);
    pipeGeo.rotateZ(Math.PI / 2.6);
    const pipeMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.35,
      metalness: 0.68,
    });
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.position.set(4, 2.4, -10);
    disposables.push(pipeGeo, pipeMat);
    group.add(pipe);
  }

  // --- HELPER TO ADD INTERACTABLES FLUSH ON GROUND ---
  const addDroplet = (id: string, x: number, z: number) => {
    const y = groundHeightAt(x, z);
    const g = new THREE.Group();
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 16), mats.waterMat);
    sphere.position.y = 0.44;
    sphere.scale.set(1.1, 0.84, 1.1);
    g.add(sphere);
    g.position.set(x, y, z);
    group.add(g);
    waterSources.push(new THREE.Vector3(x, y, z));
    interactables.push({
      id,
      kind: 'droplet',
      labelKey: 'prompt_droplet',
      position: new THREE.Vector3(x, y, z),
      radius: 2.1,
      mesh: g,
    });
  };

  const addAlgae = (id: string, x: number, z: number) => {
    const y = groundHeightAt(x, z);
    const g = new THREE.Group();
    const cell = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 1), mats.algaeMat);
    cell.position.y = 0.46;
    g.add(cell);
    g.position.set(x, y, z);
    group.add(g);
    interactables.push({
      id,
      kind: 'algae',
      labelKey: 'prompt_algae',
      position: new THREE.Vector3(x, y, z),
      radius: 2.0,
      mesh: g,
    });
  };

  const addDust = (id: string, x: number, z: number) => {
    const y = groundHeightAt(x, z);
    const g = new THREE.Group();
    const speck = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), mats.dustMat);
    speck.position.y = 0.56;
    g.add(speck);
    g.position.set(x, y, z);
    group.add(g);
    interactables.push({
      id,
      kind: 'dust',
      labelKey: 'prompt_dust',
      position: new THREE.Vector3(x, y, z),
      radius: 2.0,
      mesh: g,
    });
  };

  const addNpc = (
    id: string,
    npcKind: NonNullable<WorldInteractable['npcKind']>,
    labelKey: string,
    x: number,
    z: number,
    isShop = false
  ) => {
    const y = groundHeightAt(x, z);
    const model = createNpcModel(npcKind, mats);
    model.position.set(x, y, z);
    group.add(model);
    interactables.push({
      id,
      kind: isShop ? 'shop' : 'npc',
      npcKind,
      labelKey,
      position: new THREE.Vector3(x, y, z),
      radius: 2.8,
      mesh: model,
    });
  };

  const addPuzzleNode = (
    id: string,
    puzzleTag: string,
    labelKey: string,
    x: number,
    z: number,
    colorHex: number
  ) => {
    const y = groundHeightAt(x, z);
    const g = new THREE.Group();
    // Magic rings use white-gold HDR or turquoise water HDR for selective Bloom!
    const isWaterPuzzle = colorHex === 0x38bdf8 || colorHex === 0x67e8f9;
    const ringMat = new THREE.MeshStandardMaterial({
      color: isWaterPuzzle ? 0x67e8f9 : 0xfffbeb,
      emissive: isWaterPuzzle ? 0x22d3ee : 0xfef3c7,
      emissiveIntensity: 1.75,
      roughness: 0.22,
    });
    disposables.push(ringMat);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 0.25, 16), mats.pebbleMat);
    base.position.y = 0.14;
    const beacon = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 8, 24), ringMat);
    beacon.rotation.x = Math.PI / 2;
    beacon.position.y = 0.36;
    g.add(base, beacon);
    g.position.set(x, y, z);
    group.add(g);
    interactables.push({
      id,
      kind: 'puzzle',
      puzzleTag,
      labelKey,
      position: new THREE.Vector3(x, y, z),
      radius: 2.6,
      mesh: g,
    });
  };

  // --- POPULATE PER CHAPTER ---
  addDroplet(`drop_ch${chapter}_1`, -5.5, 2.5);
  addDroplet(`drop_ch${chapter}_2`, 6.2, -3.5);
  addDroplet(`drop_ch${chapter}_3`, -3.0, -9.5);
  addAlgae(`algae_ch${chapter}_1`, 4.2, 3.8);
  addAlgae(`algae_ch${chapter}_2`, -7.5, -4.5);
  addDust(`dust_ch${chapter}_1`, 8.2, 2.0);
  addDust(`dust_ch${chapter}_2`, -8.5, -7.2);

  if (chapter === 1) {
    addNpc('npc_bubble', 'bubble', 'Talk to Bubble', -4.2, -2.5);
    addPuzzleNode('puz_ch1_chan1', 'ch1_channel', 'Dig Moss Channel (1)', 2.8, -1.8, 0x38bdf8);
    addPuzzleNode('puz_ch1_chan2', 'ch1_channel', 'Dig Moss Channel (2)', 4.5, -6.2, 0x38bdf8);
    addPuzzleNode('puz_ch1_chan3', 'ch1_channel', 'Dig Moss Channel (3)', 0.5, -10.5, 0x38bdf8);
    addPuzzleNode('puz_ch1_recipe', 'ch1_recipe', 'Read Elders’ Greenhouse Note', -6.5, -11.0, 0xfbbf24);
  } else if (chapter === 2) {
    addNpc('npc_umo_2', 'umo', 'Snail Umo’s Shop', -5.0, 1.5, true);
    addNpc('npc_lucy_2', 'lucy', 'Guide Droplet Lucy to Shade', 5.2, 1.5);
    addPuzzleNode('puz_ch2_fib1', 'ch2_fiber', 'Place Capillary Fiber (1)', -2.2, -5.5, 0x38bdf8);
    addPuzzleNode('puz_ch2_fib2', 'ch2_fiber', 'Place Capillary Fiber (2)', 1.2, -8.5, 0x38bdf8);
    addPuzzleNode('puz_ch2_fib3', 'ch2_fiber', 'Bridge Siphon Rim (3)', 0.0, -12.0, 0x38bdf8);
  } else if (chapter === 3) {
    addNpc('npc_umo_3', 'umo', 'Snail Umo’s Shop', -6.2, 2.0, true);
    addNpc('npc_dunya', 'dunya', 'Calm Frantic Daphnia Dunya', 4.8, -2.0);
    addPuzzleNode('puz_ch3_del1', 'ch3_delivery', 'Cilia-Express Delivery 1', -4.5, -5.8, 0xfde047);
    addPuzzleNode('puz_ch3_del2', 'ch3_delivery', 'Cilia-Express Delivery 2', 6.5, -7.0, 0xfde047);
    addPuzzleNode('puz_ch3_del3', 'ch3_delivery', 'Cilia-Express Delivery 3', -1.5, -11.5, 0xfde047);
    addPuzzleNode('puz_ch3_calm', 'ch3_calm_daphnia', 'Teach Tun Rest to Daphnia', 3.5, -10.5, 0x67e8f9);
  } else if (chapter === 4) {
    addNpc('npc_fleas', 'fleas', 'Negotiate with Flea Collective', -5.2, -3.0);
    addNpc('npc_gosha_4', 'gosha', 'Lavender Basin & Gosha', 5.8, -9.5);
    addPuzzleNode('puz_ch4_scent1', 'ch4_scent', 'Mark Fur Scent Point (1)', 3.5, 1.2, 0xfb923c);
    addPuzzleNode('puz_ch4_scent2', 'ch4_scent', 'Mark Fur Scent Point (2)', -3.5, -7.5, 0xfb923c);
    addPuzzleNode('puz_ch4_scent3', 'ch4_scent', 'Mark Collar Ridge (3)', 0.5, -12.5, 0xfb923c);
  } else if (chapter === 5) {
    addNpc('npc_semyon', 'semyon', 'Sit Still with Tick Semyon', -4.5, -4.0);
    addNpc('npc_gosha_5', 'gosha', 'Barter Stories with Gosha II', 4.2, -10.5);
    addPuzzleNode('puz_ch5_trap', 'ch5_trap', 'Build Condenser Drip Trap', 5.0, -2.2, 0x38bdf8);
  } else {
    addNpc('npc_elder', 'elder', 'Awaken Elder Tikhon', -5.5, -9.0);
    addPuzzleNode('puz_ch6_pipe', 'ch6_pipe', 'Climb to Humidifier Pipe', 2.5, -4.5, 0x34d399);
    addPuzzleNode('puz_ch6_ladder', 'ch6_ladder', 'Weave Capillary Ladder', 4.5, -8.5, 0x38bdf8);
    addPuzzleNode('puz_ch6_clog', 'ch6_clog', 'Clear Dust Clog in Tun Barrel', 1.0, -12.5, 0xfbbf24);
  }

  // --- CHAPTER EXIT PORTAL (Selective Bloom Magic White + Turquoise Halo) ---
  const exitPoint = new THREE.Vector3(0, groundHeightAt(0, -15.5), -15.5);
  const exitGeo = new THREE.TorusGeometry(1.35, 0.15, 14, 36);
  const exitMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.75,
    roughness: 0.18,
  });
  disposables.push(exitGeo, exitMat);
  const exitBeacon = new THREE.Mesh(exitGeo, exitMat);
  exitBeacon.position.set(exitPoint.x, exitPoint.y + 1.38, exitPoint.z);
  group.add(exitBeacon);

  interactables.push({
    id: `exit_ch${chapter}`,
    kind: 'exit',
    labelKey: chapter === 6 ? 'Complete Journey' : 'Travel to Next Biome',
    position: exitPoint.clone(),
    radius: 2.8,
    mesh: exitBeacon,
  });

  return {
    group,
    interactables,
    waterSources,
    spawnPoint: new THREE.Vector3(0, groundHeightAt(0, 5.5), 5.5),
    exitPoint,
    exitBeacon,
    skyColor: cfg.sky,
    fogDensity: cfg.fog,
    keyLightColor: cfg.key,
    keyLightIntensity: cfg.keyInt,
    hemiSky: cfg.hemiS,
    hemiGround: cfg.hemiG,
    swayMode: cfg.sway,
    groundHeightAt,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
