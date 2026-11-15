// Wave bookkeeping: what each of the ten waves spawns, in what order the wisps arrive, and when
// the calm between waves ends. Difficulty rises three ways — more wisps, harder kinds, and the
// global hardening in makeWisp — so wave 10 asks far more of the moth than wave 1.
import { WAVES } from './config.js';

/** The mix of wisp kinds a wave may draw from; hard kinds unlock as the vale darkens. */
export function waveMix(wave) {
  if (wave >= 10) return ['wisp', 'dart', 'bloater', 'warden'];
  if (wave >= 8) return ['wisp', 'dart', 'bloater', 'warden'];
  if (wave >= 5) return ['wisp', 'dart', 'bloater'];
  if (wave >= 3) return ['wisp', 'dart'];
  return ['wisp'];
}

/** How many wisps wave `wave` sends in total. */
export function waveCount(wave) {
  return Math.round(6 + wave * 4.5);
}

/** The spawn schedule: an array of {kind, at} in seconds from the wave's first light. */
export function waveSchedule(wave, random) {
  const mix = waveMix(wave);
  const count = waveCount(wave);
  const schedule = [];
  let time = 0.4;
  let wardensPlaced = wave >= 8 ? (wave >= 10 ? 2 : 1) : 0;
  for (let index = 0; index < count; index += 1) {
    let kind = random.pick(mix);
    // The warden is a deliberate highlight, not a random draw: slot them mid and late wave.
    if (wardensPlaced > 0 && index === Math.floor(count * (wardensPlaced === 2 ? 0.45 : 0.6))) {
      kind = 'warden';
      wardensPlaced -= 1;
    }
    schedule.push({ kind, at: time });
    time += Math.max(0.35, 1.5 - wave * 0.09) + random.range(0, 0.6);
  }
  return schedule;
}

export function makeWaveState(wave, random) {
  return {
    wave,
    schedule: waveSchedule(wave, random),
    nextSpawn: 0,
    elapsed: 0,
    calmTimer: WAVES.secondsBetween,
    spawning: false,
  };
}

/** True once every scheduled wisp has arrived and every one has faded. */
export function waveCleared(waveState, enemies) {
  return waveState.spawning && waveState.nextSpawn >= waveState.schedule.length && enemies.length === 0;
}
