import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canAffordAndUnlockHero,
  canAffordAndUnlockWorld,
  createInitialPlayerState,
  getRampSurfaceY,
  laneToX,
  resolveEntityInteraction,
  shiftLane,
  stepPlayerMotion,
} from './engineLogic';
import { DEFAULT_SAVE_DATA } from './catalog';
import type { SimEntity } from './types';

function makeEntity(overrides: Partial<SimEntity>): SimEntity {
  return {
    id: 1,
    kind: 'coin',
    lane: 0,
    x: 0,
    y: 0,
    z: 0,
    width: 1.0,
    height: 1.0,
    depth: 1.0,
    collected: false,
    defeated: false,
    knockVelX: 0,
    knockVelY: 0,
    knockVelZ: 0,
    knockTimer: 0,
    phase: 0,
    ...overrides,
  };
}

test('lane shifting clamps cleanly within -1, 0, +1', () => {
  assert.equal(shiftLane(0, -1), -1);
  assert.equal(shiftLane(-1, -1), -1);
  assert.equal(shiftLane(0, 1), 1);
  assert.equal(shiftLane(1, 1), 1);
  assert.equal(laneToX(-1), -3.2);
  assert.equal(laneToX(1), 3.2);
});

test('jump buffering and gravity bring hero cleanly back to ground', () => {
  const player = createInitialPlayerState('jack_tom');
  const startStep = stepPlayerMotion(player, 0.016, 'jack_tom', true, false, false);
  assert.equal(startStep.jumped, true);
  assert.equal(player.grounded, false);
  assert.ok(player.y > 0);

  let landed = false;
  for (let i = 0; i < 90; i++) {
    const res = stepPlayerMotion(player, 0.016, 'jack_tom', false, false, false);
    if (res.landed) landed = true;
  }
  assert.equal(landed, true);
  assert.equal(player.grounded, true);
  assert.equal(player.y, 0);
});

test('sliding shrinks hitbox height so high beam is cleared cleanly', () => {
  const player = createInitialPlayerState('jack_tom');
  const beam = makeEntity({ kind: 'beam_high', y: 1.1, height: 2.0, width: 1.8, depth: 1.2 });

  // Standing hero hits high beam
  const hitRes = resolveEntityInteraction(player, beam, 'jack_tom');
  assert.equal(hitRes.type, 'damaged');

  // Reset and slide under beam
  const slidingPlayer = createInitialPlayerState('jack_tom');
  stepPlayerMotion(slidingPlayer, 0.016, 'jack_tom', false, true, false);
  const slideRes = resolveEntityInteraction(slidingPlayer, beam, 'jack_tom');
  assert.equal(slideRes.type, 'none');
});

test('ramp surface height interpolates smoothly from 0 at front to ramp height at lip', () => {
  const ramp = makeEntity({ kind: 'ramp', x: 0, z: -3, width: 2.4, height: 2.6, depth: 6 });
  const front = getRampSurfaceY(0, ramp);
  assert.equal(front.onRamp, true);
  assert.ok(Math.abs(front.surfaceY - 0) < 0.01);

  ramp.z = 0;
  const mid = getRampSurfaceY(0, ramp);
  assert.equal(mid.onRamp, true);
  assert.ok(Math.abs(mid.surfaceY - 1.3) < 0.01);

  ramp.z = 2.8;
  const lip = getRampSurfaceY(0, ramp);
  assert.equal(lip.onRamp, true);
  assert.equal(lip.nearLip, true);
  assert.ok(lip.surfaceY > 2.3);
});

test('raccoon stomp & super power knock out raccoons and grant score & power', () => {
  const player = createInitialPlayerState('jack_tom');
  player.y = 0.85;
  player.vy = -4.0;
  const raccoon = makeEntity({ kind: 'raccoon_patrol', y: 0, height: 1.5, width: 1.2, depth: 1.2 });
  const res = resolveEntityInteraction(player, raccoon, 'jack_tom');
  assert.equal(res.type, 'raccoon_ko');
  assert.equal(player.raccoons, 1);
  assert.equal(raccoon.defeated, true);
  assert.ok(player.vy > 0);
});

test('3 heart hits transition player to game over', () => {
  const player = createInitialPlayerState('jack_tom');
  for (let i = 0; i < 3; i++) {
    player.invulnTimer = 0;
    const barrier = makeEntity({ id: i + 10, kind: 'barrier_low', y: 0, height: 1.2, width: 1.6, depth: 1.0 });
    const res = resolveEntityInteraction(player, barrier, 'jack_tom');
    assert.equal(res.type, 'damaged');
    if (i === 2) {
      assert.equal(res.gameOver, true);
      assert.equal(player.dead, true);
    }
  }
});

test('unlocking heroes and worlds deducts coins and selects item', () => {
  const save = { ...DEFAULT_SAVE_DATA, totalCoins: 200 };
  const heroRes = canAffordAndUnlockHero(save, 'cyber_tom');
  assert.equal(heroRes.ok, true);
  assert.equal(heroRes.nextSave.totalCoins, 120);
  assert.equal(heroRes.nextSave.selectedHero, 'cyber_tom');
  assert.ok(heroRes.nextSave.unlockedHeroes.includes('cyber_tom'));

  const failWorld = canAffordAndUnlockWorld(heroRes.nextSave, 'pharaoh_temple');
  assert.equal(failWorld.ok, false);

  const okWorld = canAffordAndUnlockWorld(heroRes.nextSave, 'arctic_canyon');
  assert.equal(okWorld.ok, true);
  assert.equal(okWorld.nextSave.totalCoins, 20);
  assert.equal(okWorld.nextSave.selectedWorld, 'arctic_canyon');
});
