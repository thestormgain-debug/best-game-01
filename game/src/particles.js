// Particle bursts: motes of ember light and wisp ash that carry every impact's feedback without a
// sprite sheet. Each burst is a plain array of dots with a short life; the renderer fades them by
// the life they have left.
import { PALETTE } from './config.js';

export function makeParticles() {
  return [];
}

export function burst(particles, x, y, count, color, { speed = 160, life = 0.6, size = 3 } = {}) {
  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const pace = speed * (0.3 + Math.random() * 0.7);
    particles.push({
      x, y,
      vx: Math.cos(angle) * pace,
      vy: Math.sin(angle) * pace,
      life: life * (0.6 + Math.random() * 0.6),
      maxLife: life,
      size: size * (0.5 + Math.random()),
      color,
    });
  }
}

/** Ember sparks drifting upward from the lantern's flame, spawned a few per second. */
export function emberDrift(particles, lantern) {
  particles.push({
    x: lantern.x + (Math.random() - 0.5) * 14,
    y: lantern.y - 10,
    vx: (Math.random() - 0.5) * 20,
    vy: -30 - Math.random() * 40,
    life: 1.2,
    maxLife: 1.2,
    size: 2 + Math.random() * 2,
    color: PALETTE.ember,
  });
}

export function stepParticles(particles, seconds) {
  for (let index = particles.length - 1; index >= 0; index -= 1) {
    const dot = particles[index];
    dot.x += dot.vx * seconds;
    dot.y += dot.vy * seconds;
    dot.vx *= 0.96;
    dot.vy *= 0.96;
    dot.life -= seconds;
    if (dot.life <= 0) particles.splice(index, 1);
  }
}
