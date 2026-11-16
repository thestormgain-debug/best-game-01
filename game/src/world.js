// The simulation: one step(seconds, intents) advances the whole run — the moth's flight and dash,
// the lantern's flicker, the wave's spawner, every wisp's chase, the sparks and shard shots, the
// collisions, and the screen transitions title → play → boons → play … → victory/defeat.
import { ARENA, LANTERN, PALETTE, PLAYER, WAVES } from './config.js';
import { makeBullet, makeLantern, makePlayer, makeWisp, makeWispShot } from './entities.js';
import { applyBoon, makeMods, offerBoons } from './boons.js';
import { burst, emberDrift, makeParticles, stepParticles } from './particles.js';
import { makeWaveState, waveCleared } from './waves.js';
import { makeRandom } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_WAVE_END = 1;
export const EVENT_OVER = 2;
export const EVENT_VICTORY = 4;

const MAX_ENEMIES = 46;

/** A fresh run: seeded randomness, cleared entities, wave 1 waiting on the title screen. */
export function makeWorld(seed = (Math.random() * 4294967296) >>> 0) {
  const random = makeRandom(seed);
  return {
    seed,
    random,
    screen: 'title',
    waveState: makeWaveState(1, random),
    player: makePlayer(),
    lantern: makeLantern(),
    enemies: [],
    bullets: [],
    shots: [],
    particles: makeParticles(),
    mods: makeMods(),
    boonsChosen: [],
    offer: [],
    score: 0,
    time: 0,
    shake: 0,
    novaTimer: 0,
    novaRadius: 0,
    events: EVENT_NONE,
  };
}

export function resetWorld(world) {
  const fresh = makeWorld((Math.random() * 4294967296) >>> 0);
  Object.assign(world, fresh);
}

function distance(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }

function moveToward(mover, targetX, targetY, pace, seconds) {
  const separation = Math.hypot(targetX - mover.x, targetY - mover.y) || 1;
  mover.x += (targetX - mover.x) / separation * pace * seconds;
  mover.y += (targetY - mover.y) / separation * pace * seconds;
}

function clampToArena(body) {
  body.x = Math.min(ARENA.width - body.radius, Math.max(body.radius, body.x));
  body.y = Math.min(ARENA.height - body.radius, Math.max(body.radius, body.y));
}

/** Damage everything alive inside `radius` of the nova's centre; the moth's brightest trick. */
export function fireNova(world) {
  const lantern = world.lantern;
  world.novaRadius = 10;
  world.novaTimer = 0.5;
  world.shake = Math.max(world.shake, 6);
  for (let index = world.enemies.length - 1; index >= 0; index -= 1) {
    const wisp = world.enemies[index];
    if (distance(wisp, lantern) < 200) {
      wisp.hp -= 60;
      burst(world.particles, wisp.x, wisp.y, 6, PALETTE[wisp.color], { speed: 220, life: 0.5 });
      if (wisp.hp <= 0) removeWisp(world, index);
    }
  }
}

function removeWisp(world, index) {
  const wisp = world.enemies[index];
  world.score += wisp.score;
  burst(world.particles, wisp.x, wisp.y, 14, PALETTE[wisp.color], { speed: 200, life: 0.7, size: 4 });
  if (world.mods.siphonHeal > 0) {
    world.lantern.hp = Math.min(world.lantern.maxHp, world.lantern.hp + world.mods.siphonHeal);
  }
  world.enemies.splice(index, 1);
}

function hurtLantern(world, amount) {
  world.lantern.hp -= amount;
  world.lantern.flicker = 0.4;
  world.shake = Math.max(world.shake, 5);
}

function hurtMoth(world, amount) {
  const player = world.player;
  if (player.hitTimer > 0) return;
  player.hp -= amount;
  player.hitTimer = PLAYER.hitCooldown;
  world.shake = Math.max(world.shake, 8);
}

function stepPlayer(world, seconds, intents) {
  const player = world.player;
  const mods = world.mods;
  const input = intents;

  // Aim always follows the pointer; flight follows the held keys, or a dash overrides it.
  player.angle = Math.atan2(input.pointer.y - player.y, input.pointer.x - player.x);

  if (player.dashing) {
    player.dashTimer -= seconds;
    player.x += player.dashDirectionX * PLAYER.dashSpeed * seconds;
    player.y += player.dashDirectionY * PLAYER.dashSpeed * seconds;
    if (player.dashTimer <= 0) player.dashing = false;
  } else {
    const move = input.move;
    const length = Math.hypot(move.x, move.y);
    if (length > 0) {
      const pace = PLAYER.speed * mods.speedMult;
      player.x += move.x / length * pace * seconds;
      player.y += move.y / length * pace * seconds;
    }
    if (input.dashPressed && player.dashCharge >= 1) {
      player.dashing = true;
      player.dashTimer = PLAYER.dashTime;
      player.dashCharge = 0;
      const direction = length > 0 ? move : { x: Math.cos(player.angle), y: Math.sin(player.angle) };
      const normal = Math.hypot(direction.x, direction.y) || 1;
      player.dashDirectionX = direction.x / normal;
      player.dashDirectionY = direction.y / normal;
    }
  }
  player.dashCharge = Math.min(1, player.dashCharge + seconds / mods.dashCooldown);
  player.hitTimer = Math.max(0, player.hitTimer - seconds);
  clampToArena(player);

  // Firing: hold the trigger to loose sparks; twin sparks fan out symmetrically.
  player.fireTimer -= seconds;
  if (input.shooting && player.fireTimer <= 0) {
    player.fireTimer = mods.fireInterval;
    const spread = 0.14;
    for (let index = 0; index < mods.shots; index += 1) {
      const offset = (index - (mods.shots - 1) / 2) * spread;
      world.bullets.push(makeBullet(
        player.x + Math.cos(player.angle) * PLAYER.muzzleOffset,
        player.y + Math.sin(player.angle) * PLAYER.muzzleOffset,
        player.angle + offset,
        mods,
      ));
    }
    input.fired = true;
  }
}

function stepEnemies(world, seconds) {
  const lantern = world.lantern;
  const player = world.player;
  for (let index = world.enemies.length - 1; index >= 0; index -= 1) {
    const wisp = world.enemies[index];
    wisp.wobble += seconds * 3;
    const sway = Math.sin(wisp.wobble) * 30;
    if (wisp.target === 'moth') {
      moveToward(wisp, player.x + sway, player.y + sway, wisp.speed, seconds);
    } else {
      moveToward(wisp, lantern.x + sway * 0.3, lantern.y + sway * 0.3, wisp.speed, seconds);
    }
    if (wisp.ranged) {
      wisp.shotTimer -= seconds;
      if (wisp.shotTimer <= 0) {
        wisp.shotTimer = wisp.shotInterval;
        world.shots.push(makeWispShot(wisp, lantern.x, lantern.y));
      }
    }
    // Touching the lantern eats its light; touching the moth costs the moth's own health.
    if (distance(wisp, lantern) < LANTERN.radius + wisp.radius) {
      hurtLantern(world, wisp.touch);
      burst(world.particles, wisp.x, wisp.y, 6, PALETTE[wisp.color]);
      removeWisp(world, index);
      continue;
    }
    if (distance(wisp, player) < PLAYER.radius + wisp.radius) {
      hurtMoth(world, wisp.touch);
      burst(world.particles, wisp.x, wisp.y, 6, PALETTE[wisp.color]);
      removeWisp(world, index);
      continue;
    }
  }
}

function stepShots(world, seconds) {
  // The warden's shard shots fly straight and hurt whatever they touch first.
  for (let index = world.shots.length - 1; index >= 0; index -= 1) {
    const shard = world.shots[index];
    shard.x += shard.vx * seconds;
    shard.y += shard.vy * seconds;
    shard.life -= seconds;
    if (distance(shard, world.lantern) < LANTERN.radius + 4) {
      hurtLantern(world, shard.damage);
      world.shots.splice(index, 1);
      continue;
    }
    if (distance(shard, world.player) < PLAYER.radius + 4 && world.player.hitTimer <= 0) {
      hurtMoth(world, shard.damage);
      world.shots.splice(index, 1);
      continue;
    }
    if (shard.life <= 0) world.shots.splice(index, 1);
  }
}

function stepBullets(world, seconds) {
  for (let index = world.bullets.length - 1; index >= 0; index -= 1) {
    const spark = world.bullets[index];
    spark.x += spark.vx * seconds;
    spark.y += spark.vy * seconds;
    spark.life -= seconds;
    let spent = spark.life <= 0 || spark.x < 0 || spark.x > ARENA.width || spark.y < 0 || spark.y > ARENA.height;
    if (!spent) {
      for (let enemyIndex = 0; enemyIndex < world.enemies.length; enemyIndex += 1) {
        const wisp = world.enemies[enemyIndex];
        if (distance(spark, wisp) < wisp.radius + 5) {
          wisp.hp -= spark.damage;
          burst(world.particles, spark.x, spark.y, 4, PALETTE.bullet, { speed: 120, life: 0.3, size: 2 });
          spent = true;
          if (wisp.hp <= 0) removeWisp(world, enemyIndex);
          break;
        }
      }
    }
    if (spent) world.bullets.splice(index, 1);
  }
}

function stepWave(world, seconds) {
  const waveState = world.waveState;
  if (!waveState.spawning) {
    // The calm between waves: the moth earns its boon pick, then the wisps come.
    waveState.calmTimer -= seconds;
    if (waveState.calmTimer <= 0 && world.screen === 'play') waveState.spawning = true;
    return;
  }
  waveState.elapsed += seconds;
  while (waveState.nextSpawn < waveState.schedule.length
    && waveState.schedule[waveState.nextSpawn].at <= waveState.elapsed
    && world.enemies.length < MAX_ENEMIES) {
    const entry = waveState.schedule[waveState.nextSpawn];
    world.enemies.push(makeWisp(entry.kind, world.random, waveState.wave));
    waveState.nextSpawn += 1;
  }
  if (waveCleared(waveState, world.enemies)) {
    world.score += waveState.wave * 50;   // clear bonus grows with the wave
    world.events |= EVENT_WAVE_END;
  }
}

function beginNextWaveOrFinish(world) {
  const next = world.waveState.wave + 1;
  if (next > WAVES.total) {
    world.screen = 'victory';
    world.events |= EVENT_VICTORY;
    return;
  }
  world.waveState = makeWaveState(next, world.random);
  // Every wave after the first opens with the boon menu (the choice is the run's spine).
  world.offer = offerBoons(world.random, {
    lanternHpRatio: world.lantern.hp / world.lantern.maxHp,
    mothHpRatio: world.player.hp / world.player.maxHp,
  });
  world.screen = 'boons';
}

export function chooseBoon(world, boonId) {
  applyBoon(world, boonId);
  world.offer = [];
  world.waveState.spawning = true;
  world.screen = 'play';
  if (world.mods.novaOnWaveStart) fireNova(world);
}

function stepAmbience(world, seconds) {
  world.time += seconds;
  world.shake = Math.max(0, world.shake - seconds * 22);
  world.lantern.flicker = Math.max(0, world.lantern.flicker - seconds);
  world.novaTimer = Math.max(0, world.novaTimer - seconds);
  world.novaRadius += seconds * 520;
  if (Math.random() < seconds * 14) emberDrift(world.particles, world.lantern);
  stepParticles(world.particles, seconds);
}

/**
 * Advance the run one fixed step. `intents` is {move, pointer, shooting, dashPressed} — the input
 * layer's read of the human, or the autopilot's read of the scene. Returns the events the step
 * raised so main.js can react (sounds) and shots.js can tell where the run ended.
 */
export function stepWorld(world, seconds, intents) {
  world.events = EVENT_NONE;
  if (world.screen !== 'play') return world.events;
  stepPlayer(world, seconds, intents);
  stepEnemies(world, seconds);
  stepBullets(world, seconds);
  stepShots(world, seconds);
  stepWave(world, seconds);
  stepAmbience(world, seconds);
  if (world.lantern.hp <= 0 || world.player.hp <= 0) {
    world.screen = 'defeat';
    world.events |= EVENT_OVER;
  } else if ((world.events & EVENT_WAVE_END) !== 0) {
    beginNextWaveOrFinish(world);
  }
  return world.events;
}
