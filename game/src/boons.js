// The boon system: between waves the vale offers three of the eight boons, and picking one lands
// its effect on the run's modifiers. Choices matter because each stack rewrites how the moth plays
// — twin sparks and heavy sparks multiply together, swift wings change the kite.
import { BOONS, LANTERN, PLAYER } from './config.js';
import { makeRandom } from './random.js';

export function makeMods() {
  return {
    speedMult: 1,
    damageMult: 1,
    fireInterval: PLAYER.fireInterval,
    shots: 1,
    dashCooldown: PLAYER.dashCooldown,
    siphonHeal: 0,
    novaOnWaveStart: false,
  };
}

/** Three distinct boons, drawn from the catalog with a run-seeded stream. */
export function offerBoons(random, alreadyChosen) {
  const stream = makeRandom((random.next() * 4294967296) >>> 0);
  const pool = BOONS.filter((boon) => boon.id !== 'mend' && boon.id !== 'wick');
  const offer = [];
  while (offer.length < 3 && offer.length < pool.length) {
    const boon = stream.pick(pool);
    if (!offer.some((picked) => picked.id === boon.id)) offer.push(boon);
  }
  // The two one-shot mend/wick boons can still surface in place of a repeat: swap one in when the
  // lantern or moth is hurting, so a wounded run gets a real chance to recover.
  const wounded = alreadyChosen.lanternHpRatio < 0.55 || alreadyChosen.mothHpRatio < 0.45;
  if (wounded && stream.next() < 0.75) {
    const relief = stream.pick([BOONS.find((b) => b.id === 'mend'), BOONS.find((b) => b.id === 'wick')]);
    offer[stream.int(0, 2)] = relief;
  }
  return offer;
}

/** Apply a picked boon to the run's state; one-shot boons change health directly. */
export function applyBoon(state, boonId) {
  const mods = state.mods;
  state.boonsChosen.push(boonId);
  if (boonId === 'swift') mods.speedMult *= 1.25;
  else if (boonId === 'twin') mods.shots += 1;
  else if (boonId === 'bright') mods.novaOnWaveStart = true;
  else if (boonId === 'siphon') mods.siphonHeal += 2;
  else if (boonId === 'heavy') mods.damageMult *= 1.6;
  else if (boonId === 'flicker') mods.dashCooldown *= 0.5;
  else if (boonId === 'mend') state.player.hp = state.player.maxHp;
  else if (boonId === 'wick') {
    state.lantern.maxHp += 40;
    state.lantern.hp = Math.min(state.lantern.maxHp, state.lantern.hp + 40);
  }
  return mods;
}
