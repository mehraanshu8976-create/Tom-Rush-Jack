import { BASE_SPEED, GRAVITY, HEROES, JUMP_VELOCITY, LANE_WIDTH, MAX_SPEED, WORLDS } from './catalog';
import type { HeroId, LaneIndex, SaveData, SimEntity, WorldId } from './types';

export interface PlayerSimState {
  lane: LaneIndex;
  x: number;
  y: number;
  vy: number;
  grounded: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;
  slideTimer: number;
  invulnTimer: number;
  hearts: number;
  maxHearts: number;
  powerCharge: number; // 0..100
  powerActiveTimer: number;
  shieldTimer: number;
  magnetTimer: number;
  jetTimer: number;
  multiplierTimer: number;
  score: number;
  coins: number;
  raccoons: number;
  distance: number;
  speed: number;
  comboCount: number;
  comboTimer: number;
  squashX: number;
  squashY: number;
  hitstopTimer: number;
  shakeTrauma: number;
  onRamp: boolean;
  dead: boolean;
}

export function createInitialPlayerState(heroId: HeroId): PlayerSimState {
  const hero = HEROES[heroId];
  return {
    lane: 0,
    x: 0,
    y: 0,
    vy: 0,
    grounded: true,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    slideTimer: 0,
    invulnTimer: 0,
    hearts: 3,
    maxHearts: 3,
    powerCharge: 35,
    powerActiveTimer: 0,
    shieldTimer: 0,
    magnetTimer: 0,
    jetTimer: 0,
    multiplierTimer: 0,
    score: 0,
    coins: 0,
    raccoons: 0,
    distance: 0,
    speed: BASE_SPEED * hero.speedBonus,
    comboCount: 0,
    comboTimer: 0,
    squashX: 1,
    squashY: 1,
    hitstopTimer: 0,
    shakeTrauma: 0,
    onRamp: false,
    dead: false,
  };
}

export function laneToX(lane: LaneIndex): number {
  return lane * LANE_WIDTH;
}

export function shiftLane(current: LaneIndex, delta: -1 | 1): LaneIndex {
  const next = current + delta;
  if (next < -1) return -1;
  if (next > 1) return 1;
  return next as LaneIndex;
}

export function computeTargetSpeed(distance: number, heroId: HeroId, jetActive: boolean, powerActive: boolean): number {
  const hero = HEROES[heroId];
  const rampSpeed = Math.min(MAX_SPEED, BASE_SPEED + distance * 0.016);
  let speed = rampSpeed * hero.speedBonus;
  if (jetActive) speed *= 1.48;
  else if (powerActive) speed *= 1.32;
  return speed;
}

export function getPlayerHitbox(player: PlayerSimState): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
} {
  const halfW = 0.48;
  const height = player.slideTimer > 0 ? 0.78 : 1.65;
  return {
    minX: player.x - halfW,
    maxX: player.x + halfW,
    minY: player.y,
    maxY: player.y + height,
    minZ: -0.45,
    maxZ: 0.45,
  };
}

export function getRampSurfaceY(playerX: number, ramp: SimEntity): { onRamp: boolean; surfaceY: number; nearLip: boolean } {
  const halfW = ramp.width * 0.52;
  if (Math.abs(playerX - ramp.x) > halfW) {
    return { onRamp: false, surfaceY: 0, nearLip: false };
  }
  const progress = (ramp.z + ramp.depth * 0.5) / ramp.depth;
  if (progress < -0.05 || progress > 1.05) {
    return { onRamp: false, surfaceY: 0, nearLip: false };
  }
  const clamped = Math.max(0, Math.min(1, progress));
  return {
    onRamp: true,
    surfaceY: clamped * ramp.height,
    nearLip: progress >= 0.88,
  };
}

export type CollisionOutcome =
  | { type: 'none' }
  | { type: 'coin'; value: number }
  | { type: 'powerup'; kind: 'shield' | 'magnet' | 'jetboost' | 'multiplier' }
  | { type: 'raccoon_ko'; bonusScore: number }
  | { type: 'shield_break' }
  | { type: 'damaged'; remainingHearts: number; gameOver: boolean }
  | { type: 'obstacle_smashed' };

export function stepPlayerMotion(
  player: PlayerSimState,
  dt: number,
  heroId: HeroId,
  wantJump: boolean,
  wantSlide: boolean,
  wantPower: boolean,
): { jumped: boolean; landed: boolean; activatedPower: boolean } {
  let jumped = false;
  let landed = false;
  let activatedPower = false;

  if (player.dead) {
    return { jumped, landed, activatedPower };
  }

  // Update timers
  if (player.coyoteTimer > 0) player.coyoteTimer = Math.max(0, player.coyoteTimer - dt);
  if (player.jumpBufferTimer > 0) player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - dt);
  if (player.slideTimer > 0) player.slideTimer = Math.max(0, player.slideTimer - dt);
  if (player.invulnTimer > 0) player.invulnTimer = Math.max(0, player.invulnTimer - dt);
  if (player.powerActiveTimer > 0) player.powerActiveTimer = Math.max(0, player.powerActiveTimer - dt);
  if (player.shieldTimer > 0) player.shieldTimer = Math.max(0, player.shieldTimer - dt);
  if (player.magnetTimer > 0) player.magnetTimer = Math.max(0, player.magnetTimer - dt);
  if (player.jetTimer > 0) player.jetTimer = Math.max(0, player.jetTimer - dt);
  if (player.multiplierTimer > 0) player.multiplierTimer = Math.max(0, player.multiplierTimer - dt);
  if (player.comboTimer > 0) {
    player.comboTimer = Math.max(0, player.comboTimer - dt);
    if (player.comboTimer === 0) player.comboCount = 0;
  }

  if (wantPower && player.powerCharge >= 100 && player.powerActiveTimer <= 0) {
    player.powerCharge = 0;
    player.powerActiveTimer = 5.0;
    player.hitstopTimer = 0.04;
    player.shakeTrauma = Math.min(1, player.shakeTrauma + 0.55);
    activatedPower = true;
  }

  if (wantJump) {
    player.jumpBufferTimer = 0.13;
  }

  if (wantSlide && player.jetTimer <= 0) {
    player.slideTimer = 0.62;
    if (!player.grounded && player.vy > -18) {
      player.vy = -22; // Fast-fall slam into slide!
    }
    player.squashX = 1.24;
    player.squashY = 0.72;
  }

  // Lane lateral damping
  const targetX = laneToX(player.lane);
  const lateralAlpha = 1 - Math.exp(-16 * dt);
  player.x += (targetX - player.x) * lateralAlpha;

  // Jet boost hovering mode
  if (player.jetTimer > 0) {
    const hoverY = 3.2;
    player.y += (hoverY - player.y) * (1 - Math.exp(-8 * dt));
    player.vy = 0;
    player.grounded = false;
    player.slideTimer = 0;
  } else {
    // Execute buffered jump if grounded or in coyote time
    if (player.jumpBufferTimer > 0 && (player.grounded || player.coyoteTimer > 0)) {
      player.vy = JUMP_VELOCITY;
      player.grounded = false;
      player.coyoteTimer = 0;
      player.jumpBufferTimer = 0;
      player.slideTimer = 0;
      player.squashX = 0.82;
      player.squashY = 1.22;
      jumped = true;
    }

    // Apply gravity
    if (!player.grounded) {
      player.vy += GRAVITY * dt;
      player.y += player.vy * dt;
      if (player.y <= 0) {
        player.y = 0;
        player.vy = 0;
        player.grounded = true;
        player.coyoteTimer = 0.1;
        player.squashX = 1.22;
        player.squashY = 0.78;
        landed = true;
      }
    } else {
      player.coyoteTimer = 0.1;
    }
  }

  // Relax squash & stretch
  const squashAlpha = 1 - Math.exp(-14 * dt);
  player.squashX += (1 - player.squashX) * squashAlpha;
  player.squashY += (1 - player.squashY) * squashAlpha;

  // Speed & distance progression
  player.speed = computeTargetSpeed(
    player.distance,
    heroId,
    player.jetTimer > 0,
    player.powerActiveTimer > 0,
  );
  const deltaDist = player.speed * dt;
  player.distance += deltaDist;
  const mult = (player.multiplierTimer > 0 ? 2 : 1) * HEROES[heroId].coinMultiplier;
  player.score += deltaDist * 4.5 * mult;

  return { jumped, landed, activatedPower };
}

export function resolveEntityInteraction(
  player: PlayerSimState,
  entity: SimEntity,
  heroId: HeroId,
): CollisionOutcome {
  if (entity.collected || entity.defeated || player.dead) {
    return { type: 'none' };
  }

  const hb = getPlayerHitbox(player);
  const exMin = entity.x - entity.width * 0.5;
  const exMax = entity.x + entity.width * 0.5;
  const eyMin = entity.y;
  const eyMax = entity.y + entity.height;
  const ezMin = entity.z - entity.depth * 0.5;
  const ezMax = entity.z + entity.depth * 0.5;

  const overlapX = hb.maxX > exMin && hb.minX < exMax;
  const overlapY = hb.maxY > eyMin && hb.minY < eyMax;
  const overlapZ = hb.maxZ > ezMin && hb.minZ < ezMax;

  if (!overlapX || !overlapY || !overlapZ) {
    return { type: 'none' };
  }

  if (entity.kind === 'coin') {
    entity.collected = true;
    const coinVal = (player.multiplierTimer > 0 ? 2 : 1) * HEROES[heroId].coinMultiplier;
    player.coins += coinVal;
    player.score += 25 * coinVal;
    player.comboCount += 1;
    player.comboTimer = 1.6;
    player.powerCharge = Math.min(100, player.powerCharge + 4.5);
    return { type: 'coin', value: coinVal };
  }

  if (
    entity.kind === 'shield' ||
    entity.kind === 'magnet' ||
    entity.kind === 'jetboost' ||
    entity.kind === 'multiplier'
  ) {
    entity.collected = true;
    player.score += 100;
    if (entity.kind === 'shield') player.shieldTimer = 10;
    if (entity.kind === 'magnet') player.magnetTimer = 10;
    if (entity.kind === 'jetboost') player.jetTimer = 5.5;
    if (entity.kind === 'multiplier') player.multiplierTimer = 10;
    return { type: 'powerup', kind: entity.kind };
  }

  if (entity.kind === 'ramp') {
    return { type: 'none' };
  }

  const isInvincibleDash = player.powerActiveTimer > 0 || player.jetTimer > 0;

  if (
    entity.kind === 'raccoon_patrol' ||
    entity.kind === 'raccoon_jackhammer' ||
    entity.kind === 'raccoon_boss'
  ) {
    const isStomp = player.vy < 0 && player.y > entity.y + entity.height * 0.42;
    if (isInvincibleDash || isStomp) {
      entity.defeated = true;
      entity.knockTimer = 0.65;
      entity.knockVelX = (entity.x >= player.x ? 1 : -1) * 9.5;
      entity.knockVelY = 12.5;
      entity.knockVelZ = -18;
      if (isStomp && !isInvincibleDash) {
        player.vy = 11.5;
      }
      const bonus = entity.kind === 'raccoon_boss' ? 350 : 150;
      player.raccoons += 1;
      player.score += bonus;
      player.powerCharge = Math.min(100, player.powerCharge + 14);
      player.hitstopTimer = 0.045;
      player.shakeTrauma = Math.min(1, player.shakeTrauma + 0.45);
      return { type: 'raccoon_ko', bonusScore: bonus };
    }
  }

  // Solid obstacle or non-stomped raccoon
  if (isInvincibleDash) {
    entity.defeated = true;
    entity.knockTimer = 0.6;
    entity.knockVelX = (entity.x >= player.x ? 1 : -1) * 11;
    entity.knockVelY = 10;
    entity.knockVelZ = -15;
    player.score += 80;
    player.shakeTrauma = Math.min(1, player.shakeTrauma + 0.35);
    return { type: 'obstacle_smashed' };
  }

  if (player.invulnTimer > 0) {
    return { type: 'none' };
  }

  if (player.shieldTimer > 0) {
    player.shieldTimer = 0;
    player.invulnTimer = 1.1;
    entity.defeated = true;
    entity.knockTimer = 0.6;
    entity.knockVelX = (entity.x >= player.x ? 1 : -1) * 10;
    entity.knockVelY = 10;
    entity.knockVelZ = -14;
    player.hitstopTimer = 0.055;
    player.shakeTrauma = Math.min(1, player.shakeTrauma + 0.6);
    return { type: 'shield_break' };
  }

  // Take 1 heart damage
  player.hearts = Math.max(0, player.hearts - 1);
  player.invulnTimer = 1.35;
  player.hitstopTimer = 0.065;
  player.shakeTrauma = 0.85;
  player.squashX = 1.3;
  player.squashY = 0.68;

  if (player.hearts <= 0) {
    player.dead = true;
    return { type: 'damaged', remainingHearts: 0, gameOver: true };
  }

  return { type: 'damaged', remainingHearts: player.hearts, gameOver: false };
}

export function canAffordAndUnlockHero(save: SaveData, heroId: HeroId): { ok: boolean; nextSave: SaveData } {
  if (save.unlockedHeroes.includes(heroId)) {
    return { ok: true, nextSave: { ...save, selectedHero: heroId } };
  }
  const cost = HEROES[heroId].cost;
  if (save.totalCoins < cost) {
    return { ok: false, nextSave: save };
  }
  return {
    ok: true,
    nextSave: {
      ...save,
      totalCoins: save.totalCoins - cost,
      unlockedHeroes: [...save.unlockedHeroes, heroId],
      selectedHero: heroId,
    },
  };
}

export function canAffordAndUnlockWorld(save: SaveData, worldId: WorldId): { ok: boolean; nextSave: SaveData } {
  if (save.unlockedWorlds.includes(worldId)) {
    return { ok: true, nextSave: { ...save, selectedWorld: worldId } };
  }
  const cost = WORLDS[worldId].cost;
  if (save.totalCoins < cost) {
    return { ok: false, nextSave: save };
  }
  return {
    ok: true,
    nextSave: {
      ...save,
      totalCoins: save.totalCoins - cost,
      unlockedWorlds: [...save.unlockedWorlds, worldId],
      selectedWorld: worldId,
    },
  };
}
