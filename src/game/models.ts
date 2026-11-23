import * as THREE from 'three';
import { MaterialBank } from './materials';
import { DorsalPattern } from './types';

export interface TikhonRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  tunGroup: THREE.Group;
  bubbleGroup: THREE.Group;
  legs: THREE.Group[]; // 8 individual legs (index 2 is 3rd leg!)
  patternGroup: THREE.Group;
  eyeLeft: THREE.Mesh;
  eyeRight: THREE.Mesh;
  ciliaLeft: THREE.Mesh;
  ciliaRight: THREE.Mesh;
  jellyShell: THREE.Mesh;
  contactShadow: THREE.Mesh;
  setPattern: (pattern: DorsalPattern) => void;
  updateVisualState: (params: {
    time: number;
    distanceTraveled: number;
    speed: number;
    isTun: boolean;
    isJelly: boolean;
    isBubble: boolean;
    legsCount: number;
    squashY: number;
    rollSpeed: number;
  }) => void;
}

export function createContactShadow(
  mats: MaterialBank,
  radius = 1.15
): THREE.Mesh {
  const geo = new THREE.CircleGeometry(radius, 24);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    map: mats.contactShadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.72,
  });
  const m = new THREE.Mesh(geo, mat);
  m.position.y = 0.015;
  return m;
}

export function createTikhonRig(mats: MaterialBank): TikhonRig {
  const root = new THREE.Group();

  const contactShadow = createContactShadow(mats, 1.25);
  root.add(contactShadow);

  // --- 1. TIKHON NORMAL FORM (Composite 12+ part creature) ---
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const skinMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xd8bf9f),
    emissive: new THREE.Color(0x2c1a0e),
    emissiveIntensity: 0.16,
    roughness: 0.68,
    metalness: 0.02,
    sheen: 0.82,
    sheenColor: new THREE.Color(0xffe6c7),
    sheenRoughness: 0.72,
    clearcoat: 0.14,
    clearcoatRoughness: 0.62,
    bumpMap: mats.cuticleBump,
    bumpScale: 0.05,
  });

  const foldMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xa68b6b),
    emissive: new THREE.Color(0x1e1108),
    emissiveIntensity: 0.1,
    roughness: 0.82,
    metalness: 0.01,
    bumpMap: mats.cuticleBump,
    bumpScale: 0.055,
  });

  const clawMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x4a3b2c),
    roughness: 0.36,
    metalness: 0.1,
  });

  // 4 plump segmented torso lobes + cute head
  const segSpecs = [
    { z: 0.58, r: 0.44, sx: 1.0, sy: 0.88, sz: 1.05 }, // Head
    { z: 0.18, r: 0.54, sx: 1.08, sy: 0.94, sz: 1.05 },
    { z: -0.26, r: 0.56, sx: 1.12, sy: 0.96, sz: 1.08 },
    { z: -0.68, r: 0.46, sx: 0.98, sy: 0.86, sz: 1.05 }, // Rear
  ];
  const segGeo = new THREE.SphereGeometry(1, 20, 16);
  segSpecs.forEach((s, idx) => {
    const seg = new THREE.Mesh(segGeo, idx % 2 === 0 ? skinMat : foldMat);
    seg.scale.set(s.r * s.sx, s.r * s.sy, s.r * s.sz);
    seg.position.set(0, 0.48, s.z);
    seg.castShadow = true;
    seg.receiveShadow = true;
    bodyGroup.add(seg);
  });

  // Wrinkle armor collar plates (distinct silhouette ridges)
  const ridgeGeo = new THREE.TorusGeometry(0.46, 0.06, 10, 24);
  [-0.04, -0.46].forEach((z) => {
    const ridge = new THREE.Mesh(ridgeGeo, foldMat);
    ridge.position.set(0, 0.5, z);
    ridge.scale.set(1.05, 0.86, 1);
    ridge.castShadow = true;
    bodyGroup.add(ridge);
  });

  // Buccal mouth tube ("suction snout")
  const snoutGeo = new THREE.CylinderGeometry(0.08, 0.14, 0.22, 14);
  snoutGeo.rotateX(Math.PI / 2);
  const snout = new THREE.Mesh(snoutGeo, foldMat);
  snout.position.set(0, 0.42, 0.98);
  bodyGroup.add(snout);

  const lipGeo = new THREE.TorusGeometry(0.09, 0.028, 8, 16);
  const lip = new THREE.Mesh(lipGeo, clawMat);
  lip.position.set(0, 0.42, 1.09);
  bodyGroup.add(lip);

  // Huge suction-cup cute eyes with glossy cornea
  const eyeSocketGeo = new THREE.SphereGeometry(0.14, 14, 12);
  const eyeMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x161c1a),
    roughness: 0.08,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });
  const glintGeo = new THREE.SphereGeometry(0.045, 8, 8);
  const glintMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xdbeafe,
    emissiveIntensity: 0.85,
    roughness: 0.2,
  });

  const eyeLeft = new THREE.Mesh(eyeSocketGeo, eyeMat);
  eyeLeft.position.set(-0.24, 0.65, 0.88);
  const glintL = new THREE.Mesh(glintGeo, glintMat);
  glintL.position.set(-0.04, 0.05, 0.11);
  eyeLeft.add(glintL);
  bodyGroup.add(eyeLeft);

  const eyeRight = new THREE.Mesh(eyeSocketGeo, eyeMat);
  eyeRight.position.set(0.24, 0.65, 0.88);
  const glintR = new THREE.Mesh(glintGeo, glintMat);
  glintR.position.set(-0.04, 0.05, 0.11);
  eyeRight.add(glintR);
  bodyGroup.add(eyeRight);

  // 8 Short Legs with 3 tiny curved claws each (Leg #2 = 3rd leg can detach/regenerate!)
  const legs: THREE.Group[] = [];
  const legGeo = new THREE.CapsuleGeometry(0.11, 0.22, 6, 10);
  const clawGeo = new THREE.ConeGeometry(0.03, 0.11, 6);
  const legCoords = [
    { x: -0.52, z: 0.44, side: -1 },
    { x: 0.52, z: 0.44, side: 1 },
    { x: -0.58, z: 0.04, side: -1 }, // Index 2 -> 3rd leg!
    { x: 0.58, z: 0.04, side: 1 },
    { x: -0.55, z: -0.34, side: -1 },
    { x: 0.55, z: -0.34, side: 1 },
    { x: -0.4, z: -0.8, side: -1 },
    { x: 0.4, z: -0.8, side: 1 },
  ];

  legCoords.forEach((lc) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(lc.x, 0.3, lc.z);

    const limb = new THREE.Mesh(legGeo, skinMat);
    limb.rotation.z = lc.side * 0.52;
    limb.position.set(lc.side * 0.06, -0.1, 0);
    limb.castShadow = true;
    legPivot.add(limb);

    // 3 tiny clawed toes
    for (let c = -1; c <= 1; c++) {
      const claw = new THREE.Mesh(clawGeo, clawMat);
      claw.position.set(lc.side * 0.16 + c * 0.04, -0.25, 0.05 + Math.abs(c) * -0.02);
      claw.rotation.x = Math.PI * 0.85;
      legPivot.add(claw);
    }

    bodyGroup.add(legPivot);
    legs.push(legPivot);
  });

  // Dorsal pattern group (Snail Umo cosmetics!)
  const patternGroup = new THREE.Group();
  bodyGroup.add(patternGroup);

  const setPattern = (pattern: DorsalPattern) => {
    while (patternGroup.children.length > 0) {
      const child = patternGroup.children.pop()!;
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    }
    if (pattern === 'none') return;

    const colorMap: Record<Exclude<DorsalPattern, 'none'>, number> = {
      moss_stripes: 0x4ade80,
      dew_spots: 0x38bdf8,
      golden_amber: 0xf59e0b,
      starlight: 0xc084fc,
    };
    const pMat = new THREE.MeshStandardMaterial({
      color: colorMap[pattern],
      emissive: pattern === 'starlight' ? 0x6b21a8 : 0x000000,
      emissiveIntensity: pattern === 'starlight' ? 0.7 : 0,
      roughness: 0.35,
    });
    const dotGeo = new THREE.SphereGeometry(0.08, 10, 8);
    const positions =
      pattern === 'moss_stripes'
        ? [
            [0, 0.94, 0.18],
            [0, 0.96, -0.22],
            [0, 0.84, -0.58],
          ]
        : [
            [-0.18, 0.88, 0.2],
            [0.18, 0.88, 0.2],
            [-0.22, 0.9, -0.24],
            [0.22, 0.9, -0.24],
            [0, 0.86, -0.55],
          ];
    positions.forEach(([x, y, z]) => {
      const m = new THREE.Mesh(dotGeo, pMat);
      m.position.set(x, y, z);
      m.scale.set(pattern === 'moss_stripes' ? 2.4 : 1.0, 0.45, 0.8);
      patternGroup.add(m);
    });
  };

  // --- 2. TUN ANABIOSIS BARREL FORM ---
  const tunGroup = new THREE.Group();
  tunGroup.visible = false;
  root.add(tunGroup);

  const tunMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xc99c4d),
    roughness: 0.72,
    metalness: 0.1,
    bumpMap: mats.cuticleBump,
    bumpScale: 0.09,
  });
  const barrelCore = new THREE.Mesh(new THREE.SphereGeometry(0.56, 20, 16), tunMat);
  barrelCore.scale.set(0.95, 0.86, 1.12);
  barrelCore.position.y = 0.5;
  barrelCore.castShadow = true;
  tunGroup.add(barrelCore);

  const tunRingGeo = new THREE.TorusGeometry(0.49, 0.055, 8, 20);
  [-0.22, 0, 0.22].forEach((z) => {
    const r = new THREE.Mesh(tunRingGeo, foldMat);
    r.position.set(0, 0.5, z);
    tunGroup.add(r);
  });

  // --- 3. BUBBLE THE ROTIFER (NG+ Playable Character) ---
  const bubbleGroup = new THREE.Group();
  bubbleGroup.visible = false;
  root.add(bubbleGroup);

  const rotiferMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x7be0d6),
    emissive: new THREE.Color(0x134e4a),
    emissiveIntensity: 0.25,
    roughness: 0.2,
    clearcoat: 0.9,
    transparent: true,
    opacity: 0.88,
  });
  const rotBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 0.72, 10, 16), rotiferMat);
  rotBody.rotation.x = Math.PI / 2;
  rotBody.position.y = 0.5;
  rotBody.castShadow = true;
  bubbleGroup.add(rotBody);

  const ciliaGeo = new THREE.TorusGeometry(0.18, 0.04, 8, 16);
  const ciliaMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.4,
    roughness: 0.3,
  });
  const ciliaLeft = new THREE.Mesh(ciliaGeo, ciliaMat);
  ciliaLeft.position.set(-0.2, 0.55, 0.65);
  bubbleGroup.add(ciliaLeft);

  const ciliaRight = new THREE.Mesh(ciliaGeo, ciliaMat);
  ciliaRight.position.set(0.2, 0.55, 0.65);
  bubbleGroup.add(ciliaRight);

  // --- 4. HYDRO-JELLY CRYPTOBIOSIS AURA ---
  const jellyShell = new THREE.Mesh(
    new THREE.SphereGeometry(1.05, 22, 16),
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x5eead4),
      emissive: new THREE.Color(0x0f766e),
      emissiveIntensity: 0.35,
      roughness: 0.08,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    })
  );
  jellyShell.position.y = 0.55;
  jellyShell.visible = false;
  root.add(jellyShell);

  const updateVisualState: TikhonRig['updateVisualState'] = ({
    time,
    distanceTraveled,
    speed,
    isTun,
    isJelly,
    isBubble,
    legsCount,
    squashY,
    rollSpeed,
  }) => {
    bodyGroup.visible = !isTun && !isBubble;
    tunGroup.visible = isTun;
    bubbleGroup.visible = !isTun && isBubble;
    jellyShell.visible = isJelly;

    const invXZ = 1 / Math.sqrt(Math.max(0.5, squashY));
    root.scale.set(invXZ, squashY, invXZ);

    if (isTun) {
      tunGroup.rotation.x += rollSpeed;
      tunGroup.position.y = Math.abs(Math.sin(time * 4)) * (speed > 0.2 ? 0.08 : 0);
    } else if (isBubble) {
      ciliaLeft.rotation.z = time * 14;
      ciliaRight.rotation.z = -time * 14;
      bubbleGroup.position.y = Math.sin(time * 4) * 0.06;
    } else {
      // Gait synced strictly to distance traveled + gentle warm breathing pulse when idle!
      const stridePhase = distanceTraveled * 5.2;
      const breath = Math.sin(time * 2.15);
      const idleBob = breath * 0.018;
      const breathExpand = 1 + breath * 0.028;
      bodyGroup.scale.set(breathExpand, 1 - breath * 0.016, breathExpand);
      bodyGroup.position.y = idleBob + Math.abs(Math.sin(stridePhase)) * (speed > 0.1 ? 0.04 : 0);

      legs.forEach((leg, i) => {
        // Leg #3 (index 2) disappears when lost in Chapter 4!
        leg.visible = !(i === 2 && legsCount < 8);
        if (!leg.visible) return;
        const phaseOffset = i % 2 === 0 ? 0 : Math.PI;
        const rowOffset = Math.floor(i / 2) * 0.9;
        const swing =
          speed > 0.1
            ? Math.sin(stridePhase + phaseOffset + rowOffset) * 0.42
            : Math.sin(time * 1.9 + i * 0.7) * 0.06;
        leg.rotation.x = swing;
      });
    }

    if (isJelly) {
      const pulse = 1 + Math.sin(time * 5) * 0.04;
      jellyShell.scale.set(pulse, pulse, pulse);
    }
  };

  return {
    root,
    bodyGroup,
    tunGroup,
    bubbleGroup,
    legs,
    patternGroup,
    eyeLeft,
    eyeRight,
    ciliaLeft,
    ciliaRight,
    jellyShell,
    contactShadow,
    setPattern,
    updateVisualState,
  };
}

export function createNpcModel(
  kind: 'bubble' | 'umo' | 'lucy' | 'dunya' | 'semyon' | 'gosha' | 'elder' | 'fleas',
  mats: MaterialBank
): THREE.Group {
  const g = new THREE.Group();
  g.add(createContactShadow(mats, 1.0));

  if (kind === 'bubble') {
    const m = new THREE.MeshPhysicalMaterial({
      color: 0x67e8f9,
      roughness: 0.15,
      clearcoat: 0.9,
      transparent: true,
      opacity: 0.88,
    });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.7, 8, 14), m);
    body.position.y = 0.72;
    body.castShadow = true;
    g.add(body);
    const crown = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.05, 8, 18),
      new THREE.MeshStandardMaterial({ color: 0xe0f2fe, emissive: 0x0284c7, emissiveIntensity: 0.4 })
    );
    crown.rotation.x = Math.PI / 2;
    crown.position.y = 1.25;
    crown.name = 'spinCrown';
    g.add(crown);
  } else if (kind === 'umo') {
    // Snail Umo: soft mossy body + spiral shell + merchant satchel
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xb8a384, roughness: 0.78 });
    const shellMat = new THREE.MeshStandardMaterial({
      color: 0x8b5a3c,
      roughness: 0.45,
      bumpMap: mats.cuticleBump,
      bumpScale: 0.06,
    });
    const foot = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 1.0, 8, 14), bodyMat);
    foot.rotation.x = Math.PI / 2;
    foot.position.y = 0.28;
    foot.castShadow = true;
    g.add(foot);

    const shell = new THREE.Mesh(new THREE.TorusKnotGeometry(0.38, 0.18, 48, 12, 2, 1), shellMat);
    shell.position.set(0, 0.78, -0.15);
    shell.castShadow = true;
    g.add(shell);

    const pack = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.25, 0.35),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.85 })
    );
    pack.position.set(0.38, 0.65, -0.1);
    g.add(pack);
  } else if (kind === 'lucy') {
    // Nervous water droplet Lucy
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.55, 22, 18), mats.lucyMat);
    drop.scale.set(1, 1.15, 1);
    drop.position.y = 0.65;
    drop.castShadow = true;
    g.add(drop);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x082f49, roughness: 0.25 });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), eyeMat);
    eyeL.position.set(-0.16, 0.74, 0.48);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.16;
    g.add(eyeL, eyeR);
  } else if (kind === 'dunya') {
    // Frantic Daphnia
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(0.48, 16, 14),
      new THREE.MeshPhysicalMaterial({ color: 0xfde68a, roughness: 0.22, transparent: true, opacity: 0.82 })
    );
    shell.scale.set(0.75, 1.25, 1.0);
    shell.position.y = 0.72;
    g.add(shell);
    const antGeo = new THREE.CylinderGeometry(0.02, 0.03, 0.65, 6);
    const antMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
    const antL = new THREE.Mesh(antGeo, antMat);
    antL.position.set(-0.34, 1.15, 0.15);
    antL.rotation.z = 0.6;
    const antR = antL.clone();
    antR.position.x = 0.34;
    antR.rotation.z = -0.6;
    g.add(antL, antR);
  } else if (kind === 'semyon') {
    // Philosopher Dust Mite Semyon
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 16, 14),
      new THREE.MeshStandardMaterial({
        color: 0xa8a29e,
        roughness: 0.85,
        bumpMap: mats.cuticleBump,
        bumpScale: 0.08,
      })
    );
    body.scale.set(1.05, 0.75, 1.15);
    body.position.y = 0.55;
    body.castShadow = true;
    g.add(body);
    const monocle = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.025, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.8, roughness: 0.25 })
    );
    monocle.position.set(0.18, 0.65, 0.52);
    g.add(monocle);
  } else if (kind === 'gosha') {
    // Sleek Swimmer/Cockroach Gosha
    const carapace = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.42, 0.85, 8, 14),
      new THREE.MeshPhysicalMaterial({ color: 0x6d3b22, roughness: 0.28, clearcoat: 0.75 })
    );
    carapace.rotation.x = Math.PI / 2;
    carapace.scale.set(1.15, 1.0, 0.65);
    carapace.position.y = 0.48;
    carapace.castShadow = true;
    g.add(carapace);
    const antGeo = new THREE.CylinderGeometry(0.015, 0.025, 0.9, 6);
    const antMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.4 });
    const a1 = new THREE.Mesh(antGeo, antMat);
    a1.position.set(-0.22, 0.65, 0.78);
    a1.rotation.set(0.9, 0, 0.3);
    const a2 = a1.clone();
    a2.position.x = 0.22;
    a2.rotation.z = -0.3;
    g.add(a1, a2);
  } else if (kind === 'fleas') {
    // Cluster of 3 noisy acrobatic fleas
    const fMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.35 });
    for (let i = 0; i < 3; i++) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), fMat);
      f.scale.set(0.7, 1.2, 1.1);
      f.position.set((i - 1) * 0.45, 0.4 + (i % 2) * 0.15, (i % 2) * 0.25);
      f.castShadow = true;
      g.add(f);
    }
  } else {
    // Elder Tikhon in golden-moss Tun shell
    const elderMat = new THREE.MeshStandardMaterial({
      color: 0xd4b46a,
      emissive: 0x4d3a10,
      emissiveIntensity: 0.28,
      roughness: 0.75,
      bumpMap: mats.cuticleBump,
      bumpScale: 0.09,
    });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.62, 18, 14), elderMat);
    body.scale.set(1.0, 0.85, 1.25);
    body.position.y = 0.56;
    body.castShadow = true;
    g.add(body);
    const mossCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.9 })
    );
    mossCap.scale.set(1.1, 0.45, 1.2);
    mossCap.position.y = 0.95;
    g.add(mossCap);
  }

  return g;
}
