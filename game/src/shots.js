// The screenshot scenes behind ?shot=start|play|boons|end. Each stages one deterministic frame of
// the real game: it steps the actual simulation forward under an autopilot (the same intents the
// keyboard and mouse would produce) and freezes when the scene is set, so every screenshot is the
// game's own render, reproducible from the seed.
import { ARENA, STEP, WAVES } from './config.js';
import { chooseBoon, makeWorld, stepWorld } from './world.js';

const START_SECONDS = 3;
const PLAY_SECONDS = 21;       // mid wave one: a busy HUD, wisps inbound, lantern still healthy
const BOONS_SECONDS = 31;
const END_LIMIT_SECONDS = 2400;

/**
 * Lead the shot: a wisp is flying at the lantern, so aim where it will be when the spark gets
 * there — its position pushed along its flight line by the spark's time of flight.
 */
function leadAim(target, lantern) {
  const gap = Math.hypot(target.x - lantern.x, target.y - lantern.y) || 1;
  const flightSeconds = gap / 620;
  const towardLanternX = (lantern.x - target.x) / gap;
  const towardLanternY = (lantern.y - target.y) / gap;
  const speedGuess = target.target === 'moth' ? 330 : target.speed;
  const lead = flightSeconds * speedGuess;
  return { x: target.x + towardLanternX * lead, y: target.y + towardLanternY * lead };
}

function nearestEnemy(world, fromX, fromY, range) {
  let best = null;
  let bestDistance = range;
  for (const wisp of world.enemies) {
    const gap = Math.hypot(wisp.x - fromX, wisp.y - fromY);
    if (gap < bestDistance) { bestDistance = gap; best = wisp; }
  }
  return best;
}

/**
 * The autopilot's intents for one step: kite the nearest wisp while keeping inside the lantern's
 * light, lead the aim at the closest enemy, hold the trigger when something is in range, and dash
 * out when a dart gets close. A `skill` of 1 keeps its distance well; lower skill drifts closer.
 */
export function autopilotIntents(world, { skill = 1 } = {}) {
  const player = world.player;
  const lantern = world.lantern;

  // Fly to the wisp most dangerous to the lantern; aim and shoot it. The pilot plays the job, not
  // the scoreboard: intercept first, kite whatever comes too close, stay in the lantern's glow.
  let target = null;
  let targetDanger = Infinity;
  for (const wisp of world.enemies) {
    const toLantern = Math.hypot(wisp.x - lantern.x, wisp.y - lantern.y);
    const closing = wisp.target === 'lantern' ? toLantern : toLantern * 1.6;
    if (closing < targetDanger) { targetDanger = closing; target = wisp; }
  }

  // Where to fly: hold a ring around the lantern, on the side of the target, so every wisp's
  // flight brings it close; kite anything that slips inside; stay in the glow.
  let moveX = 0;
  let moveY = 0;
  if (target !== null) {
    const gap = Math.hypot(target.x - lantern.x, target.y - lantern.y) || 1;
    const ringX = lantern.x + (target.x - lantern.x) / gap * 170;
    const ringY = lantern.y + (target.y - lantern.y) / gap * 170;
    const toRing = Math.hypot(ringX - player.x, ringY - player.y) || 1;
    moveX += (ringX - player.x) / toRing * 1.2;
    moveY += (ringY - player.y) / toRing * 1.2;
  }
  for (const wisp of world.enemies) {
    const gap = Math.hypot(player.x - wisp.x, player.y - wisp.y) || 1;
    if (gap < 110) { moveX += (player.x - wisp.x) / gap * 1.6; moveY += (player.y - wisp.y) / gap * 1.6; }
  }
  const fromLantern = Math.hypot(player.x - lantern.x, player.y - lantern.y) || 1;
  if (fromLantern > 280) { moveX += (lantern.x - player.x) / fromLantern * 1.4; moveY += (lantern.y - player.y) / fromLantern * 1.4; }
  if (player.x < 120) moveX += 0.8;
  if (player.x > ARENA.width - 120) moveX -= 0.8;
  if (player.y < 110) moveY += 0.8;
  if (player.y > ARENA.height - 110) moveY -= 0.8;

  const aim = target === null
    ? { x: lantern.x + Math.cos(world.time * 0.8) * 200, y: lantern.y + Math.sin(world.time * 0.8) * 200 }
    : leadAim(target, lantern);

  const dash = player.dashCharge >= 1 && Math.hypot(player.x - lantern.x, player.y - lantern.y) > 340;

  return {
    move: { x: moveX, y: moveY },
    pointer: aim,
    shooting: target !== null,
    dashPressed: dash,
  };
}

function playUntil(world, seconds, { skill = 1 } = {}) {
  const steps = Math.round(seconds / STEP);
  for (let index = 0; index < steps; index += 1) {
    const intents = autopilotIntents(world, { skill });
    const events = stepWorld(world, STEP, intents);
    // The boons screen pauses the sim; the pilot picks the first boon and flies on.
    if (world.screen === 'boons' && world.offer.length > 0) {
      chooseBoon(world, world.offer[0].id);
    }
    if ((events & 2) !== 0) return 'defeat';
    if ((events & 4) !== 0) return 'victory';
  }
  return null;
}

/**
 * Set `world` to the named scene and return it frozen. start → title, play → mid-fight with a busy
 * HUD, boons → the pick menu, end → whichever ending the pilot reaches (a weak pilot dies before
 * wave ten, so the defeat screen is the deterministic result).
 */
export function stageShot(name, seed = 20261116) {
  const world = makeWorld(seed);
  if (name !== 'play' && name !== 'boons' && name !== 'end') {
    world.screen = 'title';
    return world;
  }
  world.screen = 'play';
  if (name === 'play') {
    playUntil(world, PLAY_SECONDS, { skill: 1 });
    return world;
  }
  if (name === 'boons') {
    // Play to the end of wave one, then stop on the boon menu instead of picking.
    const steps = Math.round(BOONS_SECONDS / STEP);
    for (let index = 0; index < steps; index += 1) {
      const events = stepWorld(world, STEP, autopilotIntents(world, { skill: 1 }));
      if ((events & 2) !== 0 || world.screen === 'boons') return world;
    }
    return world;
  }
  // end: a weaker pilot runs the whole fight; it should fall and freeze on the defeat screen.
  const outcome = playUntil(world, END_LIMIT_SECONDS, { skill: 0.4 });
  if (outcome !== 'defeat') world.screen = 'victory';
  return world;
}
