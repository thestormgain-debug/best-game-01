// Factory functions for everything that moves: the moth player, the lantern, each wisp, and the
// sparks and shard shots they trade. Shapes are plain objects the world steps and the renderer
// draws, so save-loads and screenshot scenes can rebuild a state from these alone.
import { ARENA, LANTERN, PLAYER, WISPS } from './config.js';

export function makePlayer() {
  return {
    x: ARENA.width / 2 - 160,
    y: ARENA.height / 2,
    radius: PLAYER.radius,
    angle: 0,
    hp: PLAYER.maxHp,
    maxHp: PLAYER.maxHp,
    fireTimer: 0,
    hitTimer: 0,
    dashTimer: 0,
    dashCharge: 1,     // 1 means the dash is ready
    dashing: false,
    dashDirectionX: 0,
    dashDirectionY: 0,
  };
}

export function makeLantern() {
  return {
    x: ARENA.width / 2,
    y: ARENA.height / 2,
    hp: LANTERN.maxHp,
    maxHp: LANTERN.maxHp,
    flicker: 0,
  };
}

/** A wisp of `kind` entering from a random cave edge, aimed at its target. */
export function makeWisp(kind, seedRandom, wave) {
  const def = WISPS[kind];
  const edge = seedRandom.int(0, 3);
  const margin = 60;
  let x;
  let y;
  if (edge === 0) { x = seedRandom.range(margin, ARENA.width - margin); y = -margin; }
  else if (edge === 1) { x = ARENA.width + margin; y = seedRandom.range(margin, ARENA.height - margin); }
  else if (edge === 2) { x = seedRandom.range(margin, ARENA.width - margin); y = ARENA.height + margin; }
  else { x = -margin; y = seedRandom.range(margin, ARENA.height - margin); }
  // Later waves harden every wisp a little: more light to chew through, slightly quicker.
  const scale = 1 + (wave - 1) * 0.12;
  return {
    kind,
    x, y,
    radius: def.radius,
    hp: def.hp * scale,
    maxHp: def.hp * scale,
    speed: def.speed * (1 + (wave - 1) * 0.045),
    touch: def.touch,
    score: def.score,
    color: def.color,
    target: def.target,
    ranged: def.ranged ?? false,
    shotInterval: def.shotInterval ?? 0,
    shotSpeed: def.shotSpeed ?? 0,
    shotTimer: def.shotInterval ?? 0,
    wobble: seedRandom.angle(),
  };
}

export function makeBullet(x, y, angle, mods) {
  return {
    x, y,
    vx: Math.cos(angle) * PLAYER.bulletSpeed,
    vy: Math.sin(angle) * PLAYER.bulletSpeed,
    life: PLAYER.bulletLife,
    damage: PLAYER.bulletDamage * mods.damageMult,
  };
}

export function makeWispShot(wisp, targetX, targetY) {
  const distance = Math.hypot(targetX - wisp.x, targetY - wisp.y) || 1;
  return {
    x: wisp.x,
    y: wisp.y,
    vx: (targetX - wisp.x) / distance * wisp.shotSpeed,
    vy: (targetY - wisp.y) / distance * wisp.shotSpeed,
    life: 3,
    damage: 10,
  };
}
