// A small seeded generator (mulberry32): every screenshot scene replays the same cave because the
// world and its spawner draw their randomness through one stream that a seed can reset.
export function makeRandom(seed) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range(min, max) { return min + next() * (max - min); },
    int(min, max) { return Math.floor(this.range(min, max + 1)); },
    pick(items) { return items[Math.floor(next() * items.length)]; },
    angle() { return next() * Math.PI * 2; },
  };
}
