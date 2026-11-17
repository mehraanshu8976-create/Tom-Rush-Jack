import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { soundEngine } from './audio';
import { HEROES, LANE_WIDTH, WORLDS } from './catalog';
import {
  createInitialPlayerState,
  getRampSurfaceY,
  laneToX,
  resolveEntityInteraction,
  shiftLane,
  stepPlayerMotion,
  type PlayerSimState,
} from './engineLogic';
import { buildEntityMesh, buildHeroModel, buildWorldProp, type HeroRig, type SharedAssets } from './models';
import {
  createContactShadowTexture,
  createHazardStripeTexture,
  createPawCoinTexture,
  createRampChevronTexture,
  createRoadTexture,
  createSurfaceBumpTexture,
} from './textures';
import type { EntityKind, GameState, HeroId, HudSnapshot, LaneIndex, SimEntity, WorldId } from './types';

export interface RunnerControlBridge {
  triggerPower: () => void;
  moveLane: (delta: -1 | 1) => void;
  jump: () => void;
  slide: () => void;
  resetRun: () => void;
}

interface RunnerCanvasProps {
  gameState: GameState;
  heroId: HeroId;
  worldId: WorldId;
  runNonce: number;
  onHudUpdate: (hud: HudSnapshot) => void;
  onGameOver: (snapshot: HudSnapshot) => void;
  onPauseToggle: () => void;
  bridgeRef: React.MutableRefObject<RunnerControlBridge | null>;
}

interface ActiveEntityRecord {
  sim: SimEntity;
  mesh: THREE.Group;
}

interface TrackChunk {
  group: THREE.Group;
  z: number;
}

interface ParticleSlot {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  scale: number;
  color: THREE.Color;
}

const _mat4 = new THREE.Matrix4();
const _vec3 = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _color = new THREE.Color();

export function RunnerCanvas({
  gameState,
  heroId,
  worldId,
  runNonce,
  onHudUpdate,
  onGameOver,
  onPauseToggle,
  bridgeRef,
}: RunnerCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const stateRef = useRef(gameState);
  const heroIdRef = useRef(heroId);
  const worldIdRef = useRef(worldId);
  const onHudRef = useRef(onHudUpdate);
  const onGameOverRef = useRef(onGameOver);
  const onPauseRef = useRef(onPauseToggle);
  const runNonceRef = useRef(runNonce);

  stateRef.current = gameState;
  heroIdRef.current = heroId;
  worldIdRef.current = worldId;
  onHudRef.current = onHudUpdate;
  onGameOverRef.current = onGameOver;
  onPauseRef.current = onPauseToggle;

  const rebuildSceneRef = useRef<{
    rebuildHero?: (id: HeroId) => void;
    rebuildWorld?: (id: WorldId) => void;
    resetRun?: () => void;
    actions?: { jump: boolean; slide: boolean; power: boolean; laneDelta: -1 | 0 | 1 };
  }>({});

  // Trigger hero/world swaps when props change
  useEffect(() => {
    rebuildSceneRef.current.rebuildHero?.(heroId);
  }, [heroId]);

  useEffect(() => {
    rebuildSceneRef.current.rebuildWorld?.(worldId);
  }, [worldId]);

  useEffect(() => {
    if (runNonce !== runNonceRef.current) {
      runNonceRef.current = runNonce;
      rebuildSceneRef.current.resetRun?.();
    }
  }, [runNonce]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL cleanly via GPU renderer string
    const isSoftwareGl = (() => {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) return true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param));
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: isSoftwareGl,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.tabIndex = 0;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      62,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.1,
      240,
    );

    // Studio environment map on every device
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // Warm Key + Cool Hemisphere + Rim Lighting
    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x334155, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff3d6, 2.2);
    keyLight.position.set(16, 28, 18);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 90;
    keyLight.shadow.camera.left = -22;
    keyLight.shadow.camera.right = 22;
    keyLight.shadow.camera.top = 24;
    keyLight.shadow.camera.bottom = -24;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.75);
    rimLight.position.set(-14, 12, -26);
    scene.add(rimLight);

    // Shared procedural textures
    const maxAniso = isSoftwareGl ? 1 : renderer.capabilities.getMaxAnisotropy();
    const bumpTex = createSurfaceBumpTexture(maxAniso);
    const sharedAssets: SharedAssets = {
      pawCoinTex: createPawCoinTexture(maxAniso),
      rampTex: createRampChevronTexture(maxAniso),
      hazardTex: createHazardStripeTexture(maxAniso),
      shadowTex: createContactShadowTexture(),
      shadowGeo: new THREE.CircleGeometry(0.85, 16),
    };

    // World materials & chunks
    const CHUNK_LENGTH = 30;
    const CHUNK_COUNT = 6;
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.72,
      metalness: 0.08,
      bumpMap: bumpTex,
      bumpScale: 0.03,
    });
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      roughness: 0.88,
      metalness: 0.02,
    });
    let activeRoadTex: THREE.CanvasTexture | null = null;

    const trackChunks: TrackChunk[] = [];
    const propGroup = new THREE.Group();
    scene.add(propGroup);

    const buildTrackChunks = (wId: WorldId) => {
      const world = WORLDS[wId];
      scene.background = new THREE.Color(world.fogColor);
      scene.fog = new THREE.Fog(world.fogColor, 48, 155);
      hemiLight.color.setHex(world.hemiSky);
      hemiLight.groundColor.setHex(world.hemiGround);
      keyLight.color.setHex(world.lightWarm);
      groundMat.color.setHex(world.groundColor);

      activeRoadTex?.dispose();
      activeRoadTex = createRoadTexture(world.roadColor, world.stripeColor, world.curbColor, maxAniso);
      roadMat.map = activeRoadTex;
      roadMat.needsUpdate = true;

      for (const chunk of trackChunks) {
        scene.remove(chunk.group);
      }
      trackChunks.length = 0;

      const roadGeo = new THREE.PlaneGeometry(11.4, CHUNK_LENGTH);
      const groundGeo = new THREE.PlaneGeometry(180, CHUNK_LENGTH);

      for (let i = 0; i < CHUNK_COUNT; i++) {
        const chunkGroup = new THREE.Group();
        const zPos = 12 - i * CHUNK_LENGTH;

        // Ground plane (y = -0.03 so road at y = 0 never Z-fights)
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.04;
        ground.receiveShadow = !isSoftwareGl;
        chunkGroup.add(ground);

        const road = new THREE.Mesh(roadGeo, roadMat);
        road.rotation.x = -Math.PI / 2;
        road.position.y = 0;
        road.receiveShadow = !isSoftwareGl;
        chunkGroup.add(road);

        // Roadside props on both sides
        for (let step = 0; step < 3; step++) {
          const pz = -CHUNK_LENGTH * 0.4 + step * (CHUNK_LENGTH / 3);
          const leftProp = buildWorldProp(wId, i * 3 + step, sharedAssets.shadowTex);
          leftProp.position.set(-9.5 - ((i + step) % 2) * 3.5, 0, pz);
          chunkGroup.add(leftProp);

          const rightProp = buildWorldProp(wId, i * 3 + step + 1, sharedAssets.shadowTex);
          rightProp.position.set(9.5 + ((i + step + 1) % 2) * 3.5, 0, pz);
          chunkGroup.add(rightProp);
        }

        chunkGroup.position.z = zPos;
        scene.add(chunkGroup);
        trackChunks.push({ group: chunkGroup, z: zPos });
      }
    };

    // Hero Rig
    let heroRig: HeroRig | null = null;
    const setHero = (hId: HeroId) => {
      if (heroRig) {
        scene.remove(heroRig.root);
      }
      heroRig = buildHeroModel(HEROES[hId], sharedAssets.shadowTex);
      scene.add(heroRig.root);
    };

    // Pooled InstancedMesh Particle Ring Buffer (Zero GC!)
    const PARTICLE_COUNT = 120;
    const particleGeo = new THREE.OctahedronGeometry(0.16, 0);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const particleInstanced = new THREE.InstancedMesh(particleGeo, particleMat, PARTICLE_COUNT);
    particleInstanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    particleInstanced.frustumCulled = false;
    scene.add(particleInstanced);

    const particles: ParticleSlot[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      active: false,
      x: 0,
      y: -50,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 0.5,
      scale: 0,
      color: new THREE.Color(0xfacc15),
    }));
    let particleCursor = 0;

    // Initialize zero-scale matrices
    _scale.set(0, 0, 0);
    _mat4.compose(_vec3.set(0, -50, 0), _quat, _scale);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particleInstanced.setMatrixAt(i, _mat4);
      particleInstanced.setColorAt(i, _color.setHex(0xfacc15));
    }
    particleInstanced.instanceMatrix.needsUpdate = true;
    if (particleInstanced.instanceColor) particleInstanced.instanceColor.needsUpdate = true;

    const spawnParticles = (x: number, y: number, z: number, count: number, hex: number, speed = 8) => {
      for (let i = 0; i < count; i++) {
        const slot = particles[particleCursor];
        particleCursor = (particleCursor + 1) % PARTICLE_COUNT;
        slot.active = true;
        slot.x = x;
        slot.y = y;
        slot.z = z;
        const angle = Math.random() * Math.PI * 2;
        const spd = speed * (0.45 + Math.random() * 0.7);
        slot.vx = Math.cos(angle) * spd;
        slot.vy = 2.5 + Math.random() * speed * 0.7;
        slot.vz = Math.sin(angle) * spd;
        slot.life = 0.35 + Math.random() * 0.3;
        slot.maxLife = slot.life;
        slot.scale = 0.65 + Math.random() * 0.8;
        slot.color.setHex(hex);
      }
    };

    // Simulation state & active entities
    let player: PlayerSimState = createInitialPlayerState(heroIdRef.current);
    const entities: ActiveEntityRecord[] = [];
    let nextEntityId = 1;
    let nextSpawnZ = -34; // First 34m are completely obstacle-free!
    let runGaitPhase = 0;
    let gameOverBeatTimer = -1;
    let hudEmitAccum = 0;
    let titleOrbitAngle = 0;

    const clearEntities = () => {
      for (const e of entities) {
        scene.remove(e.mesh);
      }
      entities.length = 0;
    };

    const addEntity = (kind: EntityKind, lane: LaneIndex, z: number, yOffset = 0) => {
      const dims: Record<EntityKind, { w: number; h: number; d: number }> = {
        coin: { w: 0.9, h: 0.9, d: 0.9 },
        shield: { w: 1.1, h: 1.2, d: 1.1 },
        magnet: { w: 1.1, h: 1.2, d: 1.1 },
        jetboost: { w: 1.1, h: 1.2, d: 1.1 },
        multiplier: { w: 1.1, h: 1.2, d: 1.1 },
        barrier_low: { w: 2.1, h: 1.1, d: 0.6 },
        beam_high: { w: 2.4, h: 1.85, d: 0.75 },
        truck: { w: 2.1, h: 2.1, d: 4.0 },
        dumpster: { w: 2.0, h: 1.55, d: 2.2 },
        ramp: { w: 2.3, h: 2.5, d: 6.0 },
        raccoon_patrol: { w: 1.1, h: 1.5, d: 1.1 },
        raccoon_jackhammer: { w: 1.15, h: 1.55, d: 1.15 },
        raccoon_boss: { w: 1.45, h: 2.05, d: 1.45 },
      };

      const d = dims[kind];
      const y = kind === 'beam_high' ? 1.15 : yOffset;
      const sim: SimEntity = {
        id: nextEntityId++,
        kind,
        lane,
        x: laneToX(lane),
        y,
        z,
        width: d.w,
        height: d.h,
        depth: d.d,
        collected: false,
        defeated: false,
        knockVelX: 0,
        knockVelY: 0,
        knockVelZ: 0,
        knockTimer: 0,
        phase: Math.random() * Math.PI * 2,
      };
      const mesh = buildEntityMesh(kind, sharedAssets);
      mesh.position.set(sim.x, sim.y, sim.z);
      if (kind === 'beam_high') {
        // Beam visual sits grounded at y=0 because pillars reach ground
        mesh.position.y = 0;
      }
      scene.add(mesh);
      entities.push({ sim, mesh });
    };

    const spawnStarterCoins = () => {
      // Friendly coin line right ahead of the starting hero so opening seconds shine
      for (let i = 0; i < 6; i++) {
        addEntity('coin', 0, -10 - i * 3.2, 0.25);
      }
    };

    const spawnPatternAt = (zBase: number) => {
      const dist = player.distance;
      const lanes: LaneIndex[] = [-1, 0, 1];
      const pickLane = (): LaneIndex => lanes[Math.floor(Math.random() * lanes.length)];
      const roll = Math.random();

      if (roll < 0.22) {
        // Neon Ramp + Aerial Coin Arc!
        const rLane = pickLane();
        addEntity('ramp', rLane, zBase);
        for (let i = 0; i < 6; i++) {
          const t = i / 5;
          const arcY = 2.6 + Math.sin(t * Math.PI) * 2.1;
          addEntity('coin', rLane, zBase - 4.5 - i * 2.6, arcY);
        }
        // Adjacent lane coin trail
        const otherLane = shiftLane(rLane, rLane === 1 ? -1 : 1);
        for (let i = 0; i < 4; i++) {
          addEntity('coin', otherLane, zBase - i * 2.6, 0.25);
        }
        nextSpawnZ -= 26;
      } else if (roll < 0.44) {
        // Two-lane obstacles + guaranteed open escape lane with coins or powerup
        const openLane = pickLane();
        for (const ln of lanes) {
          if (ln === openLane) {
            for (let i = 0; i < 4; i++) {
              addEntity('coin', ln, zBase - i * 2.8, 0.25);
            }
            if (Math.random() < 0.28) {
              const pKinds: EntityKind[] = ['shield', 'magnet', 'jetboost', 'multiplier'];
              addEntity(pKinds[Math.floor(Math.random() * pKinds.length)], ln, zBase - 12, 0.2);
            }
          } else {
            const obsKinds: EntityKind[] = dist > 120 ? ['truck', 'dumpster', 'barrier_low'] : ['barrier_low', 'dumpster'];
            addEntity(obsKinds[Math.floor(Math.random() * obsKinds.length)], ln, zBase);
          }
        }
        nextSpawnZ -= 22;
      } else if (roll < 0.66) {
        // Slide-under Overhead Beam + Jump-over Low Barrier combo
        const bLane = pickLane();
        addEntity('beam_high', bLane, zBase);
        addEntity('coin', bLane, zBase - 2.4, 0.25);
        addEntity('coin', bLane, zBase + 2.4, 0.25);
        const sideLane = shiftLane(bLane, bLane === 1 ? -1 : 1);
        addEntity('barrier_low', sideLane, zBase);
        addEntity('coin', sideLane, zBase, 1.8);
        nextSpawnZ -= 20;
      } else {
        // Raccoon Bandit Squad encounter!
        const enemyLane = pickLane();
        const rRoll = Math.random();
        const enemyKind: EntityKind =
          dist > 180 && rRoll < 0.25
            ? 'raccoon_boss'
            : rRoll < 0.6
              ? 'raccoon_jackhammer'
              : 'raccoon_patrol';
        addEntity(enemyKind, enemyLane, zBase);

        // Coins leading up to stomp or dodge
        const safeLane = shiftLane(enemyLane, enemyLane === -1 ? 1 : -1);
        for (let i = 0; i < 5; i++) {
          addEntity('coin', safeLane, zBase + 3 - i * 2.6, 0.25);
        }
        if (Math.random() < 0.22) {
          addEntity('jetboost', safeLane, zBase - 10, 0.2);
        }
        nextSpawnZ -= 22;
      }
    };

    const emitHud = () => {
      onHudRef.current({
        score: Math.floor(player.score),
        coins: player.coins,
        raccoons: player.raccoons,
        hearts: player.hearts,
        maxHearts: player.maxHearts,
        powerCharge: Math.round(player.powerCharge),
        powerActiveTimer: player.powerActiveTimer,
        shieldTimer: player.shieldTimer,
        magnetTimer: player.magnetTimer,
        jetTimer: player.jetTimer,
        multiplierTimer: player.multiplierTimer,
        distance: Math.floor(player.distance),
        speed: Math.round(player.speed),
        worldId: worldIdRef.current,
        heroId: heroIdRef.current,
        comboCount: player.comboCount,
      });
    };

    const resetRun = () => {
      clearEntities();
      player = createInitialPlayerState(heroIdRef.current);
      nextSpawnZ = -34;
      gameOverBeatTimer = -1;
      runGaitPhase = 0;
      if (heroRig) {
        heroRig.root.position.set(0, 0, 0);
        heroRig.visualGroup.rotation.set(0, 0, 0);
        heroRig.visualGroup.scale.set(1, 1, 1);
      }
      spawnStarterCoins();
      emitHud();
    };

    buildTrackChunks(worldIdRef.current);
    setHero(heroIdRef.current);
    resetRun();

    const pendingActions = {
      jump: false,
      slide: false,
      power: false,
      laneDelta: 0 as -1 | 0 | 1,
    };

    rebuildSceneRef.current = {
      rebuildHero: (id) => {
        setHero(id);
        player = createInitialPlayerState(id);
        emitHud();
      },
      rebuildWorld: (id) => {
        buildTrackChunks(id);
      },
      resetRun,
      actions: pendingActions,
    };

    bridgeRef.current = {
      triggerPower: () => {
        pendingActions.power = true;
      },
      moveLane: (delta) => {
        pendingActions.laneDelta = delta;
      },
      jump: () => {
        pendingActions.jump = true;
      },
      slide: () => {
        pendingActions.slide = true;
      },
      resetRun,
    };

    // Unified Keyboard & Touch Swipe Controls
    const heldKeys = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => {
      if (stateRef.current !== 'playing') return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      if (heldKeys.has(e.code)) return;
      heldKeys.add(e.code);

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        pendingActions.laneDelta = -1;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        pendingActions.laneDelta = 1;
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
        pendingActions.jump = true;
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        pendingActions.slide = true;
      } else if (e.code === 'KeyE' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        pendingActions.power = true;
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        onPauseRef.current();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      heldKeys.delete(e.code);
    };

    const clearHeld = () => {
      heldKeys.clear();
    };

    // Touch / pointer swipe gestures on canvas
    let touchStartX = 0;
    let touchStartY = 0;
    let touchTracking = false;
    const onPointerDown = (e: PointerEvent) => {
      if (stateRef.current !== 'playing') return;
      touchStartX = e.clientX;
      touchStartY = e.clientY;
      touchTracking = true;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!touchTracking || stateRef.current !== 'playing') return;
      const dx = e.clientX - touchStartX;
      const dy = e.clientY - touchStartY;
      if (Math.abs(dx) > 36 || Math.abs(dy) > 36) {
        touchTracking = false;
        if (Math.abs(dx) > Math.abs(dy)) {
          pendingActions.laneDelta = dx > 0 ? 1 : -1;
        } else if (dy < 0) {
          pendingActions.jump = true;
        } else {
          pendingActions.slide = true;
        }
      }
    };
    const onPointerUp = () => {
      touchTracking = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearHeld);
    document.addEventListener('visibilitychange', clearHeld);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let lastNow = performance.now();
    let frameId = 0;
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (status === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const now = performance.now();
      const rawDt = (now - lastNow) / 1000;
      lastNow = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
      const currentState = stateRef.current;

      if (currentState === 'title') {
        // Live 3D Showcase Camera orbiting the Hero on the illuminated runway!
        titleOrbitAngle += dt * 0.45;
        const camX = Math.sin(titleOrbitAngle) * 3.1;
        const camZ = 4.6 + Math.cos(titleOrbitAngle) * 0.85;
        camera.position.set(camX, 2.05, camZ);
        camera.lookAt(0, 1.05, 0);
        camera.fov += (54 - camera.fov) * (1 - Math.exp(-8 * dt));
        camera.updateProjectionMatrix();

        // Subtle world drift + hero idle pose
        for (const chunk of trackChunks) {
          chunk.z += 6.5 * dt;
          if (chunk.z > CHUNK_LENGTH * 1.1) {
            chunk.z -= CHUNK_LENGTH * CHUNK_COUNT;
          }
          chunk.group.position.z = chunk.z;
        }
        if (heroRig) {
          heroRig.root.position.set(0, 0, 0);
          heroRig.visualGroup.rotation.y = Math.PI + Math.sin(titleOrbitAngle * 1.4) * 0.25;
          heroRig.bodyGroup.position.y = (HEROES[heroIdRef.current].hasHoverBike ? 0.55 : 0) + Math.sin(titleOrbitAngle * 3.5) * 0.06;
          heroRig.leftArm.rotation.x = Math.sin(titleOrbitAngle * 3) * 0.2;
          heroRig.rightArm.rotation.x = -Math.sin(titleOrbitAngle * 3) * 0.2;
          if (heroRig.flameCone) {
            heroRig.flameCone.scale.setScalar(0.88 + Math.sin(titleOrbitAngle * 24) * 0.14);
          }
        }
        for (const e of entities) {
          if (e.sim.kind === 'coin') {
            e.mesh.rotation.y += 2.6 * dt;
          }
        }
      } else if (currentState === 'playing') {
        // Handle game-over dramatic beat
        if (player.dead) {
          if (gameOverBeatTimer < 0) {
            gameOverBeatTimer = 0.45;
          }
          gameOverBeatTimer -= dt;
          if (gameOverBeatTimer <= 0) {
            emitHud();
            onGameOverRef.current({
              score: Math.floor(player.score),
              coins: player.coins,
              raccoons: player.raccoons,
              hearts: 0,
              maxHearts: player.maxHearts,
              powerCharge: Math.round(player.powerCharge),
              powerActiveTimer: 0,
              shieldTimer: 0,
              magnetTimer: 0,
              jetTimer: 0,
              multiplierTimer: 0,
              distance: Math.floor(player.distance),
              speed: Math.round(player.speed),
              worldId: worldIdRef.current,
              heroId: heroIdRef.current,
              comboCount: player.comboCount,
            });
          }
        } else {
          // Hitstop freeze frames on heavy impact
          if (player.hitstopTimer > 0) {
            player.hitstopTimer = Math.max(0, player.hitstopTimer - dt);
          } else {
            // Consume edge inputs
            if (pendingActions.laneDelta !== 0) {
              const nextLane = shiftLane(player.lane, pendingActions.laneDelta);
              if (nextLane !== player.lane) {
                player.lane = nextLane;
                soundEngine.playLaneSwitch();
              }
              pendingActions.laneDelta = 0;
            }
            const wantJump = pendingActions.jump;
            const wantSlide = pendingActions.slide;
            const wantPower = pendingActions.power;
            pendingActions.jump = false;
            pendingActions.slide = false;
            pendingActions.power = false;

            const stepRes = stepPlayerMotion(player, dt, heroIdRef.current, wantJump, wantSlide, wantPower);
            if (stepRes.jumped) {
              soundEngine.playJump();
              spawnParticles(player.x, player.y + 0.1, 0, 6, 0xe2e8f0, 5);
            }
            if (stepRes.landed) {
              soundEngine.playLand();
              spawnParticles(player.x, 0.1, 0, 5, 0xcbd5e1, 4);
            }
            if (wantSlide) {
              soundEngine.playSlide();
            }
            if (stepRes.activatedPower) {
              soundEngine.playPowerActivate();
              spawnParticles(player.x, player.y + 0.9, 0, 26, HEROES[heroIdRef.current].auraColor, 15);
            }

            // Scroll road chunks
            for (const chunk of trackChunks) {
              chunk.z += player.speed * dt;
              if (chunk.z > CHUNK_LENGTH * 1.1) {
                chunk.z -= CHUNK_LENGTH * CHUNK_COUNT;
              }
              chunk.group.position.z = chunk.z;
            }

            // Spawn ahead up to -115m
            nextSpawnZ += player.speed * dt;
            while (nextSpawnZ > -115) {
              spawnPatternAt(nextSpawnZ);
            }

            // Magnet radius
            const magnetRadius =
              (player.magnetTimer > 0 ? 7.5 : 0) + HEROES[heroIdRef.current].magnetBonus;

            let ridingRamp = false;
            // Advance entities & test collisions
            for (let i = entities.length - 1; i >= 0; i--) {
              const rec = entities[i];
              const sim = rec.sim;

              if (sim.defeated) {
                sim.knockTimer -= dt;
                sim.x += sim.knockVelX * dt;
                sim.y += sim.knockVelY * dt;
                sim.z += sim.knockVelZ * dt;
                sim.knockVelY -= 26 * dt;
                rec.mesh.position.set(sim.x, sim.y, sim.z);
                rec.mesh.rotation.x += 12 * dt;
                rec.mesh.rotation.z += 9 * dt;
                if (sim.knockTimer <= 0) {
                  scene.remove(rec.mesh);
                  entities.splice(i, 1);
                }
                continue;
              }

              // Advance toward player (+Z)
              const relSpeed =
                sim.kind === 'raccoon_patrol'
                  ? player.speed + 2.4
                  : sim.kind === 'raccoon_boss'
                    ? player.speed + 1.5
                    : player.speed;
              sim.z += relSpeed * dt;
              sim.phase += dt * 4;

              // Distinct Raccoon enemy animations/policies
              if (sim.kind === 'raccoon_jackhammer') {
                rec.mesh.position.y = Math.abs(Math.sin(sim.phase * 2.4)) * 0.26;
              } else if (sim.kind === 'raccoon_boss') {
                // Boss subtly strafes side-to-side within lane
                rec.mesh.position.x = sim.x + Math.sin(sim.phase * 0.9) * 0.45;
              } else if (sim.kind === 'coin') {
                rec.mesh.rotation.y += 3.2 * dt;
                if (magnetRadius > 0) {
                  const dx = player.x - sim.x;
                  const dy = player.y + 0.7 - sim.y;
                  const dz = -sim.z;
                  const distSq = dx * dx + dy * dy + dz * dz;
                  if (distSq < magnetRadius * magnetRadius && distSq > 0.01) {
                    const pull = 1 - Math.exp(-12 * dt);
                    sim.x += dx * pull;
                    sim.y += dy * pull;
                    sim.z += dz * pull;
                  }
                }
              } else if (
                sim.kind === 'shield' ||
                sim.kind === 'magnet' ||
                sim.kind === 'jetboost' ||
                sim.kind === 'multiplier'
              ) {
                rec.mesh.rotation.y += 2.2 * dt;
                rec.mesh.position.y = sim.y + Math.sin(sim.phase) * 0.16;
              }

              // Ramp elevation check
              if (sim.kind === 'ramp') {
                const rampCheck = getRampSurfaceY(player.x, sim);
                if (rampCheck.onRamp && player.y <= rampCheck.surfaceY + 0.55 && player.vy <= 8) {
                  player.y = rampCheck.surfaceY;
                  player.grounded = true;
                  ridingRamp = true;
                  if (rampCheck.nearLip) {
                    player.vy = 11.8;
                    player.grounded = false;
                    soundEngine.playJump();
                    spawnParticles(player.x, player.y, 0, 8, 0x22d3ee, 7);
                  }
                }
              }

              rec.mesh.position.x = sim.kind === 'raccoon_boss' ? rec.mesh.position.x : sim.x;
              rec.mesh.position.z = sim.z;
              if (sim.kind === 'coin') {
                rec.mesh.position.y = sim.y;
              }

              // Collision check near player z=0
              if (Math.abs(sim.z) < 3.6) {
                const outcome = resolveEntityInteraction(player, sim, heroIdRef.current);
                if (outcome.type === 'coin') {
                  soundEngine.playCoin(player.comboCount);
                  spawnParticles(sim.x, sim.y + 0.5, 0, 5, 0xfacc15, 6);
                  scene.remove(rec.mesh);
                  entities.splice(i, 1);
                  continue;
                } else if (outcome.type === 'powerup') {
                  soundEngine.playPowerup();
                  spawnParticles(sim.x, sim.y + 0.9, 0, 14, 0x38bdf8, 9);
                  scene.remove(rec.mesh);
                  entities.splice(i, 1);
                  continue;
                } else if (outcome.type === 'raccoon_ko') {
                  soundEngine.playRaccoonKO();
                  spawnParticles(sim.x, sim.y + 0.9, 0, 16, 0x4ade80, 11);
                } else if (outcome.type === 'obstacle_smashed') {
                  soundEngine.playRaccoonKO();
                  spawnParticles(sim.x, sim.y + 0.9, 0, 14, 0xfacc15, 10);
                } else if (outcome.type === 'shield_break') {
                  soundEngine.playPowerActivate();
                  spawnParticles(player.x, player.y + 1, 0, 18, 0x38bdf8, 12);
                } else if (outcome.type === 'damaged') {
                  soundEngine.playHurt();
                  spawnParticles(player.x, player.y + 1, 0, 20, 0xef4444, 12);
                  if (outcome.gameOver) {
                    soundEngine.playGameOver();
                  }
                }
              }

              if (sim.z > 14) {
                scene.remove(rec.mesh);
                entities.splice(i, 1);
              }
            }

            if (!ridingRamp && player.y > 0 && player.grounded && player.jetTimer <= 0) {
              // Just stepped off a ramp without lip launch
              player.grounded = false;
            }
          }
        }

        // Update Hero visual rig
        if (heroRig) {
          heroRig.root.position.set(player.x, 0, 0);
          heroRig.visualGroup.position.y = player.y;

          // Contact shadow stays on ground y=0.018 and shrinks as hero jumps
          const shadowScale = Math.max(0.35, 1 - player.y * 0.14);
          heroRig.contactShadow.scale.setScalar(shadowScale);

          // Blink when invulnerable after taking damage
          heroRig.visualGroup.visible =
            player.invulnTimer <= 0 || Math.floor(player.invulnTimer * 18) % 2 === 0;

          // Bank into lane switches
          const targetX = laneToX(player.lane);
          const bankAngle = (player.x - targetX) * 0.12;
          heroRig.visualGroup.rotation.set(0, 0, bankAngle);

          // Squash & Stretch + Slide Compression
          if (player.slideTimer > 0) {
            heroRig.visualGroup.scale.set(1.15, 0.52, 1.2);
            heroRig.visualGroup.rotation.x = 0.45;
          } else {
            heroRig.visualGroup.scale.set(player.squashX, player.squashY, player.squashX);
            heroRig.visualGroup.rotation.x = player.jetTimer > 0 ? -0.25 : 0;
          }

          // Distance-synced running gait
          runGaitPhase += player.speed * dt * 0.65;
          if (player.grounded && player.slideTimer <= 0 && !HEROES[heroIdRef.current].hasHoverBike) {
            const swing = Math.sin(runGaitPhase) * 0.95;
            heroRig.leftLeg.rotation.x = swing;
            heroRig.rightLeg.rotation.x = -swing;
            heroRig.leftArm.rotation.x = -swing * 0.85;
            heroRig.rightArm.rotation.x = swing * 0.85;
            heroRig.bodyGroup.position.y = Math.abs(Math.cos(runGaitPhase)) * 0.1;
          } else if (!player.grounded) {
            heroRig.leftLeg.rotation.x = -0.4;
            heroRig.rightLeg.rotation.x = 0.35;
            heroRig.leftArm.rotation.x = -1.1;
            heroRig.rightArm.rotation.x = -1.1;
          }

          if (heroRig.cape) {
            heroRig.cape.rotation.x = 0.42 + Math.sin(runGaitPhase * 1.4) * 0.18;
          }
          if (heroRig.flameCone) {
            const boostScale = player.jetTimer > 0 || player.powerActiveTimer > 0 ? 1.5 : 1.0;
            heroRig.flameCone.scale.set(
              boostScale,
              boostScale * (0.85 + Math.sin(runGaitPhase * 5) * 0.2),
              boostScale,
            );
          }

          heroRig.shieldDome.visible = player.shieldTimer > 0;
          if (heroRig.shieldDome.visible) {
            heroRig.shieldDome.rotation.y += 2.2 * dt;
          }

          heroRig.powerRing.visible = player.powerActiveTimer > 0;
          if (heroRig.powerRing.visible) {
            const ringPulse = 1 + Math.sin(runGaitPhase * 2) * 0.25;
            heroRig.powerRing.scale.setScalar(ringPulse);
            heroRig.powerRing.rotation.z += 6 * dt;
          }
        }

        // Camera Follow + Trauma Shake + FOV Speed Kick
        player.shakeTrauma = Math.max(0, player.shakeTrauma - 1.8 * dt);
        const shake = player.shakeTrauma * player.shakeTrauma;
        const shakeX = (Math.random() - 0.5) * 0.65 * shake;
        const shakeY = (Math.random() - 0.5) * 0.55 * shake;

        const targetCamX = player.x * 0.68;
        const targetCamY = 3.95 + player.y * 0.52;
        const camAlpha = 1 - Math.exp(-10 * dt);
        camera.position.x += (targetCamX - camera.position.x) * camAlpha + shakeX;
        camera.position.y += (targetCamY - camera.position.y) * camAlpha + shakeY;
        camera.position.z = 6.7;
        camera.lookAt(player.x * 0.55, 1.3 + player.y * 0.45, -14);

        const targetFov =
          player.jetTimer > 0 ? 74 : player.powerActiveTimer > 0 ? 70 : 62 + Math.min(8, (player.speed - 18) * 0.35);
        camera.fov += (targetFov - camera.fov) * (1 - Math.exp(-6 * dt));
        camera.updateProjectionMatrix();

        // Throttled HUD updates (~12Hz)
        hudEmitAccum += dt;
        if (hudEmitAccum >= 0.08) {
          hudEmitAccum = 0;
          emitHud();
        }
      }

      // Update pooled particles in real dt
      let particlesDirty = false;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const slot = particles[i];
        if (!slot.active) continue;
        particlesDirty = true;
        slot.life -= dt;
        if (slot.life <= 0) {
          slot.active = false;
          _scale.set(0, 0, 0);
          _mat4.compose(_vec3.set(0, -50, 0), _quat, _scale);
          particleInstanced.setMatrixAt(i, _mat4);
          continue;
        }
        slot.x += slot.vx * dt;
        slot.y += slot.vy * dt;
        slot.z += slot.vz * dt;
        slot.vy -= 22 * dt;
        const s = slot.scale * (slot.life / slot.maxLife);
        _scale.setScalar(s);
        _mat4.compose(_vec3.set(slot.x, slot.y, slot.z), _quat, _scale);
        particleInstanced.setMatrixAt(i, _mat4);
        particleInstanced.setColorAt(i, slot.color);
      }
      if (particlesDirty) {
        particleInstanced.instanceMatrix.needsUpdate = true;
        if (particleInstanced.instanceColor) particleInstanced.instanceColor.needsUpdate = true;
      }

      renderer.render(scene, camera);
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearHeld);
      document.removeEventListener('visibilitychange', clearHeld);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      activeRoadTex?.dispose();
      bumpTex.dispose();
      sharedAssets.pawCoinTex.dispose();
      sharedAssets.rampTex.dispose();
      sharedAssets.hazardTex.dispose();
      sharedAssets.shadowTex.dispose();
      sharedAssets.shadowGeo.dispose();
      renderer.dispose();
    };
  }, [bridgeRef]);

  return (
    <div
      ref={mountRef}
      data-testid="runner-canvas-container"
      className="fixed inset-0 w-full h-full overflow-hidden"
    />
  );
}
