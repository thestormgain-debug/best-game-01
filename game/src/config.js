// Every tunable number of Embermoth in one place: the arena, the palette, the moth, the lantern,
// and each wisp's behaviour so difficulty scaling can read it without reaching into game code.
export const ARENA = { width: 1280, height: 800 };

// The whole game's palette: warm ember ambers for light and life, cold teal for the moth, and a
// hostile rose for the wisps, all over a deep cave blue. Nothing draws a colour from elsewhere.
export const PALETTE = {
  background: '#0b0f14',
  caveFloor: '#111823',
  caveEdge: '#1a2432',
  ember: '#ffb347',
  emberDeep: '#e07b1f',
  emberGlow: 'rgba(255,179,71,0.16)',
  moth: '#7de0d3',
  mothDark: '#2b6b66',
  bullet: '#ffd98a',
  wisp: '#ff5d8f',
  wispDark: '#8f2c50',
  dart: '#c46bff',
  bloater: '#8fe06b',
  warden: '#ff8d5d',
  text: '#f2ead9',
  textDim: '#9aa5b1',
  good: '#8fe06b',
  bad: '#ff5d8f',
};

export const STEP = 1 / 60;

export const PLAYER = {
  radius: 14,
  speed: 300,            // px per second
  maxHp: 100,
  hitCooldown: 0.6,      // seconds of invulnerability after taking a hit
  dashSpeed: 950,
  dashTime: 0.16,
  dashCooldown: 1.6,
  fireInterval: 0.24,    // seconds between sparks
  bulletSpeed: 620,
  bulletDamage: 34,
  bulletLife: 1.1,
  muzzleOffset: 18,
};

export const LANTERN = {
  radius: 34,
  maxHp: 140,
  wickHeight: 26,
};

// Each wisp kind: how it moves, how hard it hits, and what it is worth when it fades.
export const WISPS = {
  wisp:    { radius: 13, hp: 40,  speed: 95,  target: 'lantern', touch: 7,  score: 15, color: 'wisp' },
  dart:    { radius: 10, hp: 30,  speed: 320, target: 'moth',    touch: 10, score: 25, color: 'dart' },
  bloater: { radius: 24, hp: 150, speed: 60,  target: 'lantern', touch: 14, score: 45, color: 'bloater' },
  warden:  { radius: 20, hp: 420, speed: 66,  target: 'lantern', touch: 16, score: 120, color: 'warden', ranged: true, shotInterval: 2.4, shotSpeed: 200 },
};

export const WAVES = {
  total: 10,
  secondsBetween: 3.0,   // calm between waves, also when the boon choice happens
};

// The boon menu offers three of these at random; effects land in world.js's applyBoon.
export const BOONS = [
  { id: 'swift',     name: 'Swift Wings',   desc: 'Fly 25% faster' },
  { id: 'twin',      name: 'Twin Sparks',   desc: 'Fire a second spark' },
  { id: 'bright',    name: 'Bright Ring',   desc: 'A searing nova opens each wave' },
  { id: 'siphon',    name: 'Ember Siphon',  desc: 'Fading wisps heal the lantern' },
  { id: 'heavy',     name: 'Heavy Spark',   desc: 'Sparks deal 60% more harm' },
  { id: 'flicker',   name: 'Flicker Dash',  desc: 'Dash recovers twice as fast' },
  { id: 'mend',      name: 'Moth Mend',     desc: 'Heal the moth fully, now' },
  { id: 'wick',      name: 'Long Wick',     desc: 'Lantern gains 40 light, now' },
];
