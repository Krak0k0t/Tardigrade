import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { VignetteShader } from 'three/addons/shaders/VignetteShader.js';
import { createMaterialBank, MaterialBank } from './materials';
import { createTikhonRig, TikhonRig } from './models';
import { buildBiome, BuiltBiome, WorldInteractable } from './biomes';
import { audioEngine } from './audioEngine';
import { computeModifiers, getChapterProgressRatio, isChapterExitReady, stepResources } from './gameLogic';
import { SECONDARY_JUMP_KEY } from './inputConfig';
import {
  ChapterId,
  GameSaveState,
  GameScreenState,
  GameSettings,
  HudSnapshot,
  WeatherCondition,
} from './types';

const ChromaticShader = {
  uniforms: {
    tDiffuse: { value: null },
    amount: { value: 0.0018 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    varying vec2 vUv;
    void main() {
      vec2 dir = vUv - 0.5;
      float d = length(dir);
      float r = texture2D(tDiffuse, vUv - dir * amount * d).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv + dir * amount * d).b;
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
};

// Subtle cool nocturnal color grading: cool blue-teal shadows + gentle filmic contrast
const ColorGradingShader = {
  uniforms: {
    tDiffuse: { value: null },
    coolShift: { value: new THREE.Vector3(0.93, 0.99, 1.09) },
    shadowTint: { value: new THREE.Vector3(0.02, 0.045, 0.085) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec3 coolShift;
    uniform vec3 shadowTint;
    varying vec2 vUv;
    void main() {
      vec4 tex = texture2D(tDiffuse, vUv);
      float luma = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
      vec3 graded = tex.rgb * coolShift + shadowTint * (1.0 - smoothstep(0.0, 0.45, luma));
      // Preserve warm organic tones on highlights
      graded = mix(graded, tex.rgb, smoothstep(0.55, 0.95, luma) * 0.45);
      gl_FragColor = vec4(max(graded, vec3(0.0)), tex.a);
    }
  `,
};

export interface EngineCallbacks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onInteract: (item: WorldInteractable) => void;
  onBadDay: () => void;
  onResourceSync: (moisture: number, chewingEnergy: number) => void;
  onPatienceComplete: () => void;
  onOpenDiary: () => void;
  onTogglePause: () => void;
}

// Pre-allocated scratch math helpers (Zero-GC in animation loop)
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _rayPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _mouseNdc = new THREE.Vector2();
const _dummy = new THREE.Object3D();

export function detectSoftwareWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2');
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

export class SceneEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  private isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private chromaPass: ShaderPass | null = null;
  private vignettePass: ShaderPass | null = null;
  private mats: MaterialBank;
  private tikhon: TikhonRig;
  private biome: BuiltBiome | null = null;
  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private heroLight: THREE.PointLight;
  private senseRing: THREE.Mesh;
  private senseArrow: THREE.Mesh;

  // Pooled particle ring buffer (Zero-GC)
  private particleMesh: THREE.InstancedMesh;
  private particlePool: { pos: THREE.Vector3; vel: THREE.Vector3; life: number; maxLife: number }[] = [];
  private particleCursor = 0;

  // Slowly drifting nocturnal dust motes & spores (Zero-GC InstancedMesh)
  private ambientMotesMesh: THREE.InstancedMesh;
  private ambientMotes: { x: number; y: number; z: number; phase: number; speed: number; scale: number }[] = [];

  private screenState: GameScreenState = 'title';
  private settings: GameSettings;
  private saveState: GameSaveState;
  private activeChapterRendered: ChapterId | null = null;
  private activeQualityRendered: string | null = null;

  // Simulation state
  private playerPos = new THREE.Vector3(0, 0, 5.5);
  private playerVelY = 0;
  private playerYaw = Math.PI;
  private isGrounded = true;
  private squashY = 1.0;
  private distanceTraveled = 0;
  private clickTarget: THREE.Vector3 | null = null;

  private isTun = false;
  private isJelly = false;
  private menuTunPreview = false;
  private menuTunTimer = 0;
  private isTransitioning = false;
  private transitionTimer = 0;
  private transitionDuration = 0.85;
  private transitionCallback: (() => void) | null = null;

  private waterSenseTimer = 0;
  private weather: WeatherCondition = 'calm';
  private simTime = 0;
  private lastFrameTime = performance.now();
  private lastHudEmit = 0;
  private stepAudioCooldown = 0;
  private patienceTimer = 0;

  // Input state
  private keysHeld = new Set<string>();
  private virtualStick = { x: 0, y: 0 };
  private raycaster = new THREE.Raycaster();
  private frameId = 0;
  private disposed = false;
  private resizeObserver: ResizeObserver;

  constructor(
    container: HTMLElement,
    initialSettings: GameSettings,
    initialSave: GameSaveState,
    callbacks: EngineCallbacks
  ) {
    this.container = container;
    this.settings = initialSettings;
    this.saveState = initialSave;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareWebGL();

    const width = Math.max(320, container.clientWidth || window.innerWidth);
    const height = Math.max(240, container.clientHeight || window.innerHeight);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setSize(width, height);
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.2, 180);
    // Start immediately in intimate macro Title framing (no cold-start lerp!)
    this.camera.position.set(-1.55, 2.35, 9.95);
    this.camera.lookAt(-1.15, 0.55, 5.5);

    // Mandatory studio environment reflection map on every device
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.45;
    pmrem.dispose();

    // Contrasting nocturnal moonlight rig (no flat uniform AmbientLight!)
    this.hemiLight = new THREE.HemisphereLight(0x26486e, 0x070e0c, 0.36);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xaad4ff, 2.55);
    this.keyLight.position.set(13, 21, 9);
    this.keyLight.shadow.camera.left = -22;
    this.keyLight.shadow.camera.right = 22;
    this.keyLight.shadow.camera.top = 22;
    this.keyLight.shadow.camera.bottom = -22;
    this.keyLight.shadow.camera.near = 2;
    this.keyLight.shadow.camera.far = 65;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.85);
    rimLight.position.set(-14, 7, -14);
    this.scene.add(rimLight);

    // Subtle warm personal glow near Tikhon so she looks warm & alive against cool night shadows
    this.heroLight = new THREE.PointLight(0xffdfb8, 1.15, 8.5, 1.5);
    this.heroLight.position.set(0.8, 2.2, 7.0);
    this.scene.add(this.heroLight);

    this.mats = createMaterialBank(this.renderer, this.isSoftwareGl);
    this.tikhon = createTikhonRig(this.mats);
    this.tikhon.setPattern(initialSave.activePattern);
    this.scene.add(this.tikhon.root);

    // Water Sense visual compass ring around Tikhon
    this.senseRing = new THREE.Mesh(
      new THREE.RingGeometry(1.4, 1.58, 32),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      })
    );
    this.senseRing.rotation.x = -Math.PI / 2;
    this.senseRing.position.y = 0.12;
    this.scene.add(this.senseRing);

    this.senseArrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.24, 0.65, 8),
      new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0 })
    );
    this.senseArrow.rotation.x = Math.PI / 2;
    this.senseArrow.position.y = 0.35;
    this.scene.add(this.senseArrow);

    // Zero-GC Pooled Particle Ring Buffer
    const pCount = 72;
    const pGeo = new THREE.SphereGeometry(0.09, 6, 6);
    const pMat = new THREE.MeshStandardMaterial({
      color: 0xa5f3fc,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.4,
      transparent: true,
      opacity: 0.82,
    });
    this.particleMesh = new THREE.InstancedMesh(pGeo, pMat, pCount);
    this.particleMesh.frustumCulled = false;
    for (let i = 0; i < pCount; i++) {
      this.particlePool.push({
        pos: new THREE.Vector3(0, -50, 0),
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
      });
      _dummy.position.set(0, -50, 0);
      _dummy.scale.setScalar(0.001);
      _dummy.updateMatrix();
      this.particleMesh.setMatrixAt(i, _dummy.matrix);
    }
    this.scene.add(this.particleMesh);

    // Slowly drifting nocturnal dust motes & spores (InstancedMesh)
    const moteCount = 64;
    const mGeo = new THREE.SphereGeometry(0.06, 6, 6);
    const mMat = new THREE.MeshStandardMaterial({
      color: 0xe2f4ff,
      emissive: 0xcffafe,
      emissiveIntensity: 1.4,
      transparent: true,
      opacity: 0.72,
    });
    this.ambientMotesMesh = new THREE.InstancedMesh(mGeo, mMat, moteCount);
    this.ambientMotesMesh.frustumCulled = false;
    for (let i = 0; i < moteCount; i++) {
      const mx = Math.sin(i * 1.7) * 18;
      const mz = Math.cos(i * 2.3) * 18 - 2;
      const my = 0.5 + ((i * 17) % 36) / 10;
      this.ambientMotes.push({
        x: mx,
        y: my,
        z: mz,
        phase: i * 0.7,
        speed: 0.25 + (i % 5) * 0.08,
        scale: 0.55 + (i % 4) * 0.25,
      });
      _dummy.position.set(mx, my, mz);
      _dummy.scale.setScalar(0.8);
      _dummy.updateMatrix();
      this.ambientMotesMesh.setMatrixAt(i, _dummy.matrix);
    }
    this.ambientMotesMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.ambientMotesMesh);

    this.applyGraphicsQuality();
    this.loadChapterBiome(initialSave.chapter);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);

    this.lastFrameTime = performance.now();
    this.tick();
  }

  private setupComposer(width: number, height: number) {
    if (this.isSoftwareGl) {
      this.composer = null;
      return;
    }
    const q = this.settings.graphics;
    if (q === 'low' || q === 'balanced') {
      this.composer = null;
      return;
    }

    const composer = new EffectComposer(this.renderer);
    composer.addPass(new RenderPass(this.scene, this.camera));

    // Selective HDR Bloom: high threshold (0.92) catches only emissive droplets, magic rings, spiderwebs & portal
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(Math.floor(width / 2), Math.floor(height / 2)),
      q === 'cinematic' ? 0.62 : 0.48,
      0.52,
      0.92
    );
    composer.addPass(bloom);
    this.bloomPass = bloom;

    // Mystical cool nocturnal color grading pass
    composer.addPass(new ShaderPass(ColorGradingShader));

    if (q === 'cinematic') {
      const chroma = new ShaderPass(ChromaticShader);
      composer.addPass(chroma);
      this.chromaPass = chroma;
    } else {
      this.chromaPass = null;
    }

    const vig = new ShaderPass(VignetteShader);
    vig.uniforms['offset'].value = 0.98;
    vig.uniforms['darkness'].value = 1.08;
    composer.addPass(vig);
    this.vignettePass = vig;

    composer.addPass(new OutputPass());
    this.composer = composer;
  }

  private applyGraphicsQuality() {
    const q = this.settings.graphics;
    if (this.activeQualityRendered === q) return;
    this.activeQualityRendered = q;

    const width = Math.max(320, this.container.clientWidth || window.innerWidth);
    const height = Math.max(240, this.container.clientHeight || window.innerHeight);

    if (this.isSoftwareGl) {
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false;
      this.keyLight.castShadow = false;
      this.composer = null;
      return;
    }

    const prCap = q === 'low' ? 1 : q === 'balanced' ? 1.25 : q === 'high' ? 1.75 : 2;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, prCap));

    const useShadows = q === 'high' || q === 'cinematic';
    this.renderer.shadowMap.enabled = useShadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.keyLight.castShadow = useShadows;
    if (useShadows) {
      const size = q === 'cinematic' ? 2048 : 1024;
      if (this.keyLight.shadow.mapSize.width !== size) {
        this.keyLight.shadow.mapSize.set(size, size);
        this.keyLight.shadow.map?.dispose();
        this.keyLight.shadow.map = null;
      }
    }

    this.setupComposer(width, height);
  }

  private loadChapterBiome(chapter: ChapterId) {
    if (this.biome) {
      this.scene.remove(this.biome.group);
      this.biome.dispose();
    }
    this.biome = buildBiome(chapter, this.mats, this.settings.graphics);
    this.scene.add(this.biome.group);
    this.activeChapterRendered = chapter;

    this.scene.background = new THREE.Color(this.biome.skyColor);
    this.scene.fog = new THREE.FogExp2(this.biome.skyColor, this.biome.fogDensity);
    this.keyLight.color.setHex(this.biome.keyLightColor);
    this.keyLight.intensity = this.biome.keyLightIntensity;
    this.hemiLight.color.setHex(this.biome.hemiSky);
    this.hemiLight.groundColor.setHex(this.biome.hemiGround);

    this.playerPos.copy(this.biome.spawnPoint);
    this.playerVelY = 0;
    this.isGrounded = true;
    this.clickTarget = null;
    this.patienceTimer = 0;

    this.weather = chapter === 2 ? 'rain' : chapter === 5 ? 'heat' : chapter === 6 ? 'mist' : 'calm';
    audioEngine.setEnvironment(chapter, this.weather, this.isJelly, this.isTun);
  }

  public syncExternalState(
    screenState: GameScreenState,
    settings: GameSettings,
    saveState: GameSaveState
  ) {
    const prevScreen = this.screenState;
    this.screenState = screenState;
    this.settings = settings;
    this.saveState = saveState;

    if (prevScreen !== screenState && screenState === 'playing') {
      this.keysHeld.clear();
      this.menuTunPreview = false;
      this.isTransitioning = false;
      if (saveState.barrelChallenge) {
        this.isTun = true;
      }
    }

    audioEngine.setMusicMode(screenState === 'title' ? 'menu' : 'adventure');
    this.tikhon.setPattern(saveState.activePattern);

    const qualityChanged = this.activeQualityRendered !== settings.graphics;
    if (qualityChanged) {
      this.applyGraphicsQuality();
    }

    if (this.activeChapterRendered !== saveState.chapter || qualityChanged) {
      this.loadChapterBiome(saveState.chapter);
    }

    audioEngine.setEnvironment(saveState.chapter, this.weather, this.isJelly, this.isTun);
  }

  public startMenuTransition(onDone: () => void) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.transitionTimer = 0;
    this.menuTunPreview = false;
    this.transitionCallback = onDone;
    audioEngine.setMusicMode('adventure');
  }

  public setVirtualStick(x: number, y: number) {
    this.virtualStick.x = x;
    this.virtualStick.y = y;
  }

  public triggerJump() {
    if (this.screenState !== 'playing' || !this.isGrounded) return;
    this.playerVelY = this.isTun ? 7.2 : 6.4;
    this.isGrounded = false;
    this.squashY = 1.24;
    audioEngine.playJump();
    this.spawnBurst(this.playerPos, 5);
  }

  public triggerTunToggle() {
    if (this.screenState !== 'playing') return;
    if (this.saveState.barrelChallenge && this.isTun) return; // Barrel mode locks Tun!
    this.isTun = !this.isTun;
    if (this.isTun) this.isJelly = false;
    audioEngine.playTunToggle(this.isTun);
    audioEngine.setEnvironment(this.saveState.chapter, this.weather, this.isJelly, this.isTun);
    this.spawnBurst(this.playerPos, 6);
  }

  public triggerJellyToggle() {
    if (this.screenState !== 'playing') return;
    if (!this.isJelly && this.saveState.chewingEnergy < 5) return;
    this.isJelly = !this.isJelly;
    if (this.isJelly) this.isTun = false;
    audioEngine.setEnvironment(this.saveState.chapter, this.weather, this.isJelly, this.isTun);
    this.spawnBurst(this.playerPos, 8);
  }

  public triggerWaterSense() {
    if (this.screenState !== 'playing') return;
    this.waterSenseTimer = 3.2;
    const nearest = this.findNearestWater();
    const norm = nearest ? Math.min(1, nearest.dist / 24) : 1;
    audioEngine.playSensePulse(norm);
  }

  public triggerInteractNearest() {
    if (this.screenState !== 'playing') return;
    const nearest = this.findNearestInteractable();
    if (nearest) {
      this.callbacks.onInteract(nearest);
    }
  }

  public markCollected(id: string) {
    const item = this.biome?.interactables.find((x) => x.id === id);
    if (!item) return;
    item.collected = true;
    item.mesh.visible = false;
    this.spawnBurst(item.position, 10);
  }

  private spawnBurst(origin: THREE.Vector3, count: number) {
    for (let i = 0; i < count; i++) {
      const p = this.particlePool[this.particleCursor];
      this.particleCursor = (this.particleCursor + 1) % this.particlePool.length;
      p.pos.set(
        origin.x + (Math.random() - 0.5) * 0.6,
        origin.y + 0.35 + Math.random() * 0.3,
        origin.z + (Math.random() - 0.5) * 0.6
      );
      p.vel.set((Math.random() - 0.5) * 2.4, 1.4 + Math.random() * 2.0, (Math.random() - 0.5) * 2.4);
      p.maxLife = 0.55 + Math.random() * 0.35;
      p.life = p.maxLife;
    }
  }

  private findNearestWater(): { angle: number; dist: number } | null {
    if (!this.biome) return null;
    let bestDist = Infinity;
    let bestPos: THREE.Vector3 | null = null;
    for (const item of this.biome.interactables) {
      if (item.kind === 'droplet' && !item.collected) {
        const d = this.playerPos.distanceTo(item.position);
        if (d < bestDist) {
          bestDist = d;
          bestPos = item.position;
        }
      }
    }
    if (!bestPos) return null;
    const angle = Math.atan2(bestPos.x - this.playerPos.x, bestPos.z - this.playerPos.z);
    return { angle, dist: bestDist };
  }

  private findNearestInteractable(): WorldInteractable | null {
    if (!this.biome) return null;
    let best: WorldInteractable | null = null;
    let bestDist = Infinity;
    for (const item of this.biome.interactables) {
      if (item.collected) continue;
      const d = this.playerPos.distanceTo(item.position);
      if (d <= item.radius && d < bestDist) {
        bestDist = d;
        best = item;
      }
    }
    return best;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    // Allow normal typing inside inputs (e.g., naming droplets!)
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    this.keysHeld.add(e.code);
    audioEngine.unlock();

    const b = this.settings.bindings;
    if (e.code === b.pause || e.code === 'KeyP') {
      if (this.screenState === 'playing' || this.screenState === 'paused') {
        this.callbacks.onTogglePause();
      }
      return;
    }

    if (this.screenState !== 'playing') return;

    if (e.code === b.jump || e.code === SECONDARY_JUMP_KEY) {
      e.preventDefault();
      this.triggerJump();
    } else if (e.code === b.tun) {
      this.triggerTunToggle();
    } else if (e.code === b.jelly) {
      this.triggerJellyToggle();
    } else if (e.code === b.waterSense) {
      this.triggerWaterSense();
    } else if (e.code === b.interact) {
      this.triggerInteractNearest();
    } else if (e.code === b.diary) {
      this.callbacks.onOpenDiary();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysHeld.delete(e.code);
  };

  private onWindowBlur = () => {
    this.keysHeld.clear();
  };

  private isHittingTikhon(clientX: number, clientY: number): boolean {
    const rect = this.renderer.domElement.getBoundingClientRect();
    _mouseNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    _mouseNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(_mouseNdc, this.camera);
    if (this.raycaster.intersectObject(this.tikhon.root, true).length > 0) {
      return true;
    }
    _v1.set(this.playerPos.x, this.playerPos.y + 0.55, this.playerPos.z);
    return this.raycaster.ray.distanceToPoint(_v1) < 1.35;
  }

  private onPointerMove = (e: PointerEvent) => {
    if (this.screenState === 'title' && !this.isTransitioning) {
      this.renderer.domElement.style.cursor = this.isHittingTikhon(e.clientX, e.clientY)
        ? 'pointer'
        : 'default';
    } else if (this.renderer.domElement.style.cursor !== 'default') {
      this.renderer.domElement.style.cursor = 'default';
    }
  };

  private onPointerDown = (e: PointerEvent) => {
    audioEngine.unlock();

    // Title screen interactive Tikhon hero click -> curl into Tun barrel & back!
    if (this.screenState === 'title' && !this.isTransitioning && e.button === 0) {
      if (this.isHittingTikhon(e.clientX, e.clientY)) {
        this.menuTunPreview = !this.menuTunPreview;
        this.menuTunTimer = this.menuTunPreview ? 3.2 : 0;
        document.body.dataset.menuTun = this.menuTunPreview ? '1' : '0';
        audioEngine.playTunToggle(this.menuTunPreview);
        this.spawnBurst(this.playerPos, 7);
      }
      return;
    }

    if (this.screenState !== 'playing') return;

    const b = this.settings.bindings;
    const mouseCode = `Mouse${e.button}`;

    if (mouseCode === b.jump) {
      e.preventDefault();
      this.triggerJump();
      return;
    }
    if (mouseCode === b.tun) {
      this.triggerTunToggle();
      return;
    }
    if (mouseCode === b.jelly) {
      this.triggerJellyToggle();
      return;
    }

    // Left click on canvas: interact with clicked object if close, otherwise click-to-move!
    if (e.button === 0) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      _mouseNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _mouseNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(_mouseNdc, this.camera);

      // Check interactables first
      if (this.biome) {
        const activeMeshes = this.biome.interactables
          .filter((it) => !it.collected)
          .map((it) => it.mesh);
        const hits = this.raycaster.intersectObjects(activeMeshes, true);
        if (hits.length > 0) {
          const hitObj = hits[0].object;
          const found = this.biome.interactables.find((it) => {
            let cur: THREE.Object3D | null = hitObj;
            while (cur) {
              if (cur === it.mesh) return true;
              cur = cur.parent;
            }
            return false;
          });
          if (found) {
            if (this.playerPos.distanceTo(found.position) <= found.radius + 1.1) {
              this.callbacks.onInteract(found);
              return;
            } else {
              this.clickTarget = found.position.clone();
              return;
            }
          }
        }
      }

      // Intersect ground plane for click-to-move
      if (this.raycaster.ray.intersectPlane(_rayPlane, _v1)) {
        _v1.x = THREE.MathUtils.clamp(_v1.x, -20, 20);
        _v1.z = THREE.MathUtils.clamp(_v1.z, -20, 20);
        this.clickTarget = _v1.clone();
      }
    }
  };

  private onContextMenu = (e: MouseEvent) => {
    // Prevent browser context menu on canvas so Right-Click Jump works seamlessly!
    e.preventDefault();
  };

  private bindEvents() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onWindowBlur);
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.addEventListener('contextmenu', this.onContextMenu);
  }

  private handleResize() {
    if (this.disposed) return;
    const width = Math.max(320, this.container.clientWidth || window.innerWidth);
    const height = Math.max(240, this.container.clientHeight || window.innerHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    if (this.composer) {
      this.composer.setSize(width, height);
      if (this.bloomPass) {
        this.bloomPass.resolution.set(Math.floor(width / 2), Math.floor(height / 2));
      }
    }
    if (this.composer && !this.isSoftwareGl) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (typeof gl.fenceSync === 'function') {
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    } else {
      this.frameId = window.setTimeout(cb, 80);
    }
  }

  private tick = () => {
    if (this.disposed) return;

    const now = performance.now();
    const rawDt = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;
    const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
    this.simTime += dt;
    this.mats.updateWindTime(this.simTime);

    if (this.menuTunPreview && this.menuTunTimer > 0) {
      this.menuTunTimer -= dt;
      if (this.menuTunTimer <= 0) {
        this.menuTunPreview = false;
        audioEngine.playTunToggle(false);
      }
    }

    // Gentle biome ambient animations
    if (this.biome) {
      this.biome.exitBeacon.rotation.y += dt * 1.1;
      const exitReady = isChapterExitReady(this.saveState);
      const exitMat = this.biome.exitBeacon.material as THREE.MeshStandardMaterial;
      exitMat.emissiveIntensity = exitReady ? 1.45 + Math.sin(this.simTime * 4) * 0.35 : 0.3;

      if (this.biome.swayMode === 'dog_walk') {
        // Baron breathes and sways periodically!
        this.biome.group.rotation.z = Math.sin(this.simTime * 0.85) * 0.025;
        this.biome.group.position.y = Math.sin(this.simTime * 1.7) * 0.12;
      } else {
        this.biome.group.rotation.z = 0;
        this.biome.group.position.y = 0;
      }

      // Spin Bubble's ciliary crown and animate floating drops
      this.biome.interactables.forEach((it, idx) => {
        if (it.collected) return;
        if (it.kind === 'droplet' || it.kind === 'algae' || it.kind === 'dust') {
          it.mesh.rotation.y += dt * 0.9;
          it.mesh.position.y =
            this.biome!.groundHeightAt(it.position.x, it.position.z) +
            Math.sin(this.simTime * 2.2 + idx) * 0.06;
        }
        const crown = it.mesh.getObjectByName('spinCrown');
        if (crown) crown.rotation.z += dt * 8;
      });
    }

    // Gameplay simulation when playing
    let moveSpeed = 0;
    let isMoving = false;
    if (this.screenState === 'playing' && this.biome) {
      const mods = computeModifiers({
        difficulty: this.settings.difficulty,
        character: this.saveState.character,
        isTun: this.isTun,
        isJelly: this.isJelly,
        legsCount: this.saveState.legsCount,
        stickyFeetUpgrade: this.saveState.stickyFeetUpgrade,
        chapter: this.saveState.chapter,
      });

      const simDt = dt * (this.isJelly ? 0.48 : 1.0);
      const b = this.settings.bindings;

      let mx = this.virtualStick.x;
      let mz = this.virtualStick.y;
      if (this.keysHeld.has(b.moveLeft) || this.keysHeld.has('ArrowLeft')) mx -= 1;
      if (this.keysHeld.has(b.moveRight) || this.keysHeld.has('ArrowRight')) mx += 1;
      if (this.keysHeld.has(b.moveForward) || this.keysHeld.has('ArrowUp')) mz -= 1;
      if (this.keysHeld.has(b.moveBackward) || this.keysHeld.has('ArrowDown')) mz += 1;

      if (Math.abs(mx) > 0.05 || Math.abs(mz) > 0.05) {
        this.clickTarget = null;
      } else if (this.clickTarget) {
        _v2.subVectors(this.clickTarget, this.playerPos);
        _v2.y = 0;
        const dist = _v2.length();
        if (dist > 0.35) {
          mx = _v2.x / dist;
          mz = _v2.z / dist;
        } else {
          this.clickTarget = null;
        }
      }

      const len = Math.hypot(mx, mz);
      if (len > 0.05) {
        isMoving = true;
        const nx = mx / Math.max(1, len);
        const nz = mz / Math.max(1, len);
        const baseSpeed = 4.6 * mods.speedMultiplier;
        moveSpeed = baseSpeed;

        // Gentle gutter current drift in Ch2 unless Jelly is active
        const currentPush = this.saveState.chapter === 2 && !this.isJelly ? -0.9 : 0;

        this.playerPos.x = THREE.MathUtils.clamp(this.playerPos.x + nx * baseSpeed * dt, -19, 19);
        this.playerPos.z = THREE.MathUtils.clamp(
          this.playerPos.z + (nz * baseSpeed + currentPush) * dt,
          -19,
          19
        );
        this.distanceTraveled += baseSpeed * dt;

        const targetYaw = Math.atan2(nx, nz);
        let diff = targetYaw - this.playerYaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.playerYaw += diff * (1 - Math.exp(-10 * dt));

        this.stepAudioCooldown -= dt;
        if (this.stepAudioCooldown <= 0 && this.isGrounded && !this.isTun) {
          audioEngine.playStep();
          this.stepAudioCooldown = 0.24;
        }
      }

      // Gravity & Grounding
      const floorY = this.biome.groundHeightAt(this.playerPos.x, this.playerPos.z);
      if (!this.isGrounded) {
        this.playerVelY -= 17.5 * dt;
        this.playerPos.y += this.playerVelY * dt;
        if (this.playerPos.y <= floorY) {
          this.playerPos.y = floorY;
          this.playerVelY = 0;
          this.isGrounded = true;
          this.squashY = 0.78;
          this.spawnBurst(this.playerPos, 4);
        }
      } else {
        this.playerPos.y = floorY;
      }

      this.squashY = THREE.MathUtils.damp(this.squashY, 1.0, 12, dt);

      // Update Resources (Moisture & Algae Fuel)
      const resStep = stepResources(
        this.saveState.moisture,
        this.saveState.chewingEnergy,
        simDt,
        mods,
        this.isJelly
      );
      this.saveState.moisture = resStep.moisture;
      this.saveState.chewingEnergy = resStep.chewingEnergy;
      if (resStep.jellyDepleted) {
        this.isJelly = false;
      }
      if (resStep.triggeredBadDay) {
        this.isTun = true;
        this.playerPos.copy(this.biome.spawnPoint);
        this.callbacks.onBadDay();
      }

      // Ch5 Patience Trial near Tick Semyon: stand completely still!
      if (this.saveState.chapter === 5 && !this.saveState.puzzles.ch5PatienceDone) {
        const semyon = this.biome.interactables.find((i) => i.id === 'npc_semyon');
        if (semyon && this.playerPos.distanceTo(semyon.position) < 4.5 && !isMoving) {
          this.patienceTimer += dt;
          if (this.patienceTimer >= 6.0) {
            this.patienceTimer = 6.0;
            this.callbacks.onPatienceComplete();
          }
        } else {
          this.patienceTimer = Math.max(0, this.patienceTimer - dt * 1.5);
        }
      }

      // Water sense fade
      if (this.waterSenseTimer > 0) {
        this.waterSenseTimer = Math.max(0, this.waterSenseTimer - dt);
      }
    }

    // Update Tikhon visual rig & warm personal fill light
    if (this.screenState === 'title') {
      this.playerYaw = -0.32 + Math.sin(this.simTime * 0.42) * 0.07;
    }
    this.tikhon.root.position.copy(this.playerPos);
    this.tikhon.root.rotation.y = this.playerYaw;
    this.tikhon.updateVisualState({
      time: this.simTime,
      distanceTraveled: this.distanceTraveled,
      speed: moveSpeed,
      isTun: this.screenState === 'title' ? this.menuTunPreview : this.isTun,
      isJelly: this.isJelly,
      isBubble: this.saveState.character === 'bubble',
      legsCount: this.saveState.legsCount,
      squashY: this.squashY,
      rollSpeed: isMoving ? 0.14 : 0.01,
    });
    this.heroLight.position.set(this.playerPos.x + 0.6, this.playerPos.y + 1.9, this.playerPos.z + 1.4);

    // Water sense ring + directional needle
    const nearestWater = this.findNearestWater();
    const senseAlpha = this.waterSenseTimer > 0 ? Math.min(0.85, this.waterSenseTimer * 0.5) : 0;
    (this.senseRing.material as THREE.MeshBasicMaterial).opacity = senseAlpha * 0.55;
    (this.senseArrow.material as THREE.MeshBasicMaterial).opacity = nearestWater ? senseAlpha : 0;
    this.senseRing.position.set(this.playerPos.x, this.playerPos.y + 0.12, this.playerPos.z);
    if (nearestWater) {
      this.senseArrow.position.set(
        this.playerPos.x + Math.sin(nearestWater.angle) * 1.9,
        this.playerPos.y + 0.35,
        this.playerPos.z + Math.cos(nearestWater.angle) * 1.9
      );
      this.senseArrow.rotation.y = nearestWater.angle;
    }

    // Update slowly floating nocturnal dust motes (InstancedMesh, Zero-GC)
    for (let i = 0; i < this.ambientMotes.length; i++) {
      const m = this.ambientMotes[i];
      const dy = Math.sin(this.simTime * m.speed + m.phase) * 0.45;
      const dx = Math.cos(this.simTime * m.speed * 0.7 + m.phase) * 0.55;
      const dz = Math.sin(this.simTime * m.speed * 0.6 + m.phase * 1.3) * 0.55;
      _dummy.position.set(m.x + dx, m.y + dy, m.z + dz);
      const pulse = m.scale * (0.8 + 0.25 * Math.sin(this.simTime * 1.4 + m.phase));
      _dummy.scale.setScalar(pulse);
      _dummy.updateMatrix();
      this.ambientMotesMesh.setMatrixAt(i, _dummy.matrix);
    }
    this.ambientMotesMesh.instanceMatrix.needsUpdate = true;

    // Update pooled particles in-place
    for (let i = 0; i < this.particlePool.length; i++) {
      const p = this.particlePool[i];
      if (p.life > 0) {
        p.life -= dt;
        p.vel.y -= 5.2 * dt;
        p.pos.addScaledVector(p.vel, dt);
        const s = Math.max(0.001, (p.life / p.maxLife) * 1.2);
        _dummy.position.copy(p.pos);
        _dummy.scale.setScalar(s);
      } else {
        _dummy.position.set(0, -50, 0);
        _dummy.scale.setScalar(0.001);
      }
      _dummy.updateMatrix();
      this.particleMesh.setMatrixAt(i, _dummy.matrix);
    }
    this.particleMesh.instanceMatrix.needsUpdate = true;

    // Camera choreography:
    // 1) Cinematic transition zoom-in toward Tikhon before entering active play
    // 2) Title screen -> slow macro pan/zoom glide over the nocturnal moss
    // 3) Playing -> 3/4 isometric micro-lens follow with exponential damping
    if (this.isTransitioning) {
      this.transitionTimer += dt;
      const tNorm = Math.min(1, this.transitionTimer / this.transitionDuration);
      const ease = 1 - Math.pow(1 - tNorm, 3);
      if (tNorm < 0.65) {
        const zProgress = tNorm / 0.65;
        _v1.set(
          THREE.MathUtils.lerp(-1.55, this.playerPos.x + 0.35, zProgress),
          THREE.MathUtils.lerp(2.35, this.playerPos.y + 1.45, zProgress),
          THREE.MathUtils.lerp(9.95, this.playerPos.z + 2.55, zProgress)
        );
      } else {
        const sProgress = (tNorm - 0.65) / 0.35;
        _v1.set(
          THREE.MathUtils.lerp(this.playerPos.x + 0.35, this.playerPos.x + 3.4, sProgress),
          THREE.MathUtils.lerp(this.playerPos.y + 1.45, this.playerPos.y + 7.6, sProgress),
          THREE.MathUtils.lerp(this.playerPos.z + 2.55, this.playerPos.z + 9.2, sProgress)
        );
      }
      this.camera.position.lerp(_v1, 1 - Math.exp(-8.5 * dt));
      _v2.set(
        THREE.MathUtils.lerp(-1.15, this.playerPos.x, ease),
        this.playerPos.y + 0.5,
        this.playerPos.z - ease * 0.4
      );
      this.camera.lookAt(_v2);

      if (tNorm >= 1) {
        this.isTransitioning = false;
        const cb = this.transitionCallback;
        this.transitionCallback = null;
        if (cb) cb();
      }
    } else if (this.screenState === 'title') {
      const orbitAngle = Math.sin(this.simTime * 0.16) * 0.42;
      const macroZoom = Math.sin(this.simTime * 0.22) * 0.55;
      _v1.set(
        this.playerPos.x - 1.55 + Math.sin(orbitAngle) * 2.1,
        this.playerPos.y + 2.35 + Math.cos(this.simTime * 0.19) * 0.28,
        this.playerPos.z + 4.45 + macroZoom
      );
      this.camera.position.lerp(_v1, 1 - Math.exp(-3.2 * dt));
      _v2.set(
        this.playerPos.x - 1.15 + Math.sin(this.simTime * 0.14) * 0.22,
        this.playerPos.y + 0.55,
        this.playerPos.z - 0.25
      );
      this.camera.lookAt(_v2);
    } else {
      _v1.set(this.playerPos.x + 3.4, this.playerPos.y + 7.6, this.playerPos.z + 9.2);
      this.camera.position.lerp(_v1, 1 - Math.exp(-5.5 * dt));
      _v2.set(this.playerPos.x, this.playerPos.y + 0.4, this.playerPos.z - 0.5);
      this.camera.lookAt(_v2);
    }

    // Throttle React HUD updates to <= 10Hz
    if (now - this.lastHudEmit > 110) {
      this.lastHudEmit = now;
      const nearby = this.findNearestInteractable();
      this.callbacks.onResourceSync(this.saveState.moisture, this.saveState.chewingEnergy);
      this.callbacks.onHudUpdate({
        moisture: Math.round(this.saveState.moisture),
        chewingEnergy: Math.round(this.saveState.chewingEnergy),
        isTun: this.isTun,
        isJelly: this.isJelly,
        waterSenseActive: this.waterSenseTimer > 0,
        nearestWaterAngle: nearestWater ? nearestWater.angle : null,
        nearestWaterDist: nearestWater ? nearestWater.dist : null,
        weather: this.weather,
        legsCount: this.saveState.legsCount,
        nearbyPrompt: nearby
          ? { id: nearby.id, labelKey: nearby.labelKey, kind: nearby.kind }
          : null,
        patienceActive:
          this.saveState.chapter === 5 &&
          !this.saveState.puzzles.ch5PatienceDone &&
          this.patienceTimer > 0.2,
        patienceProgress: this.patienceTimer / 6.0,
        isMoving,
        chapterProgress: getChapterProgressRatio(this.saveState),
      });
    }

    // Render
    if (this.composer && !this.isSoftwareGl) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.resizeObserver.disconnect();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onWindowBlur);
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.removeEventListener('contextmenu', this.onContextMenu);

    if (this.biome) this.biome.dispose();
    this.mats.dispose();
    this.particleMesh.geometry.dispose();
    (this.particleMesh.material as THREE.Material).dispose();
    this.ambientMotesMesh.geometry.dispose();
    (this.ambientMotesMesh.material as THREE.Material).dispose();
    this.senseRing.geometry.dispose();
    (this.senseRing.material as THREE.Material).dispose();
    this.senseArrow.geometry.dispose();
    (this.senseArrow.material as THREE.Material).dispose();
    this.composer?.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
