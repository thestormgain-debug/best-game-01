// Everything the canvas shows: the cave, the lantern's light, the moth, the wisps, the sparks,
// the shards and the particles — all drawn from geometry with the palette, no images anywhere.
import { ARENA, LANTERN, PALETTE, PLAYER, WISPS } from './config.js';

const CAVE_ROCKS = (() => {
  // A fixed scatter of floor stones so the cave reads as a place, seeded once, drawn every frame.
  const rocks = [];
  let seed = 1234567;
  const next = () => { seed = (seed * 1103515245 + 12345) >>> 0; return (seed / 4294967296); };
  for (let index = 0; index < 34; index += 1) {
    rocks.push({
      x: next() * ARENA.width,
      y: next() * ARENA.height,
      r: 8 + next() * 26,
      shade: next(),
    });
  }
  return rocks;
})();

function drawCave(context) {
  context.fillStyle = PALETTE.background;
  context.fillRect(0, 0, ARENA.width, ARENA.height);
  for (const rock of CAVE_ROCKS) {
    context.fillStyle = rock.shade > 0.5 ? PALETTE.caveFloor : PALETTE.caveEdge;
    context.beginPath();
    context.ellipse(rock.x, rock.y, rock.r, rock.r * 0.72, rock.shade * 3, 0, Math.PI * 2);
    context.fill();
  }
  // The dark rim: the vale closes in at the edges, so the light is the only safety.
  const rim = context.createRadialGradient(ARENA.width / 2, ARENA.height / 2, 220, ARENA.width / 2, ARENA.height / 2, 760);
  rim.addColorStop(0, 'rgba(0,0,0,0)');
  rim.addColorStop(1, 'rgba(2,4,8,0.82)');
  context.fillStyle = rim;
  context.fillRect(0, 0, ARENA.width, ARENA.height);
}

function drawLantern(context, lantern) {
  const flickerBoost = lantern.flicker > 0 ? Math.sin(lantern.flicker * 40) * 0.4 : 0;
  const lifeRatio = Math.max(0.15, lantern.hp / lantern.maxHp);
  const reach = 190 + lifeRatio * 260 + flickerBoost * 60;
  const glow = context.createRadialGradient(lantern.x, lantern.y, 10, lantern.x, lantern.y, reach);
  glow.addColorStop(0, 'rgba(255,179,71,0.55)');
  glow.addColorStop(0.45, PALETTE.emberGlow);
  glow.addColorStop(1, 'rgba(255,179,71,0)');
  context.fillStyle = glow;
  context.fillRect(lantern.x - reach, lantern.y - reach, reach * 2, reach * 2);

  // The iron cage of the lantern, its flame inside.
  context.fillStyle = PALETTE.caveEdge;
  context.fillRect(lantern.x - 22, lantern.y - 30, 44, 10);
  context.fillRect(lantern.x - 3, lantern.y - 40, 6, 12);
  context.fillStyle = PALETTE.emberDeep;
  context.beginPath();
  context.arc(lantern.x, lantern.y + 4, LANTERN.radius - 6, 0, Math.PI * 2);
  context.fill();
  const flameH = LANTERN.wickHeight * (0.7 + lifeRatio * 0.5 + flickerBoost);
  context.fillStyle = PALETTE.ember;
  context.beginPath();
  context.moveTo(lantern.x - 12, lantern.y + 8);
  context.quadraticCurveTo(lantern.x, lantern.y + 8 - flameH * 1.6, lantern.x + 12, lantern.y + 8);
  context.closePath();
  context.fill();
  context.fillStyle = '#ffe9b3';
  context.beginPath();
  context.arc(lantern.x, lantern.y + 2, 5 + lifeRatio * 3, 0, Math.PI * 2);
  context.fill();
}

function drawPlayer(context, player) {
  const blink = player.hitTimer > 0 && Math.floor(player.hitTimer * 14) % 2 === 0;
  if (blink) return;
  context.save();
  context.translate(player.x, player.y);
  context.rotate(player.angle);
  // The moth: two swept wings and a slim body, all geometry.
  context.fillStyle = PALETTE.mothDark;
  context.beginPath();
  context.moveTo(-4, -6);
  context.quadraticCurveTo(-20, -22, -8, -4);
  context.closePath();
  context.fill();
  context.beginPath();
  context.moveTo(-4, 6);
  context.quadraticCurveTo(-20, 22, -8, 4);
  context.closePath();
  context.fill();
  context.fillStyle = PALETTE.moth;
  context.beginPath();
  context.moveTo(-6, -10);
  context.quadraticCurveTo(-16, -16, -4, -2);
  context.closePath();
  context.fill();
  context.beginPath();
  context.moveTo(-6, 10);
  context.quadraticCurveTo(-16, 16, -4, 2);
  context.closePath();
  context.fill();
  context.fillStyle = '#ffffff';
  context.beginPath();
  context.arc(6, 0, 4, 0, Math.PI * 2);
  context.fill();
  context.restore();
  // A dash ring shows the dash is charged again.
  if (player.dashCharge >= 1) {
    context.strokeStyle = 'rgba(125,224,211,0.5)';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(player.x, player.y, PLAYER.radius + 6, 0, Math.PI * 2);
    context.stroke();
  }
}

function drawWisp(context, wisp) {
  const color = PALETTE[wisp.color];
  const dark = wisp.color === 'wisp' ? PALETTE.wispDark : color;
  const pulse = 1 + Math.sin(wisp.wobble * 2) * 0.08;
  context.fillStyle = dark;
  context.beginPath();
  context.arc(wisp.x, wisp.y, wisp.radius * pulse, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = color;
  context.beginPath();
  context.arc(wisp.x, wisp.y, wisp.radius * 0.6 * pulse, 0, Math.PI * 2);
  context.fill();
  // Three cold eyes for the warden, none for the rest.
  if (wisp.ranged) {
    context.fillStyle = '#2b0a18';
    for (const offset of [-0.45, 0, 0.45]) {
      const eyeX = wisp.x + Math.cos(offset) * wisp.radius * 0.5;
      const eyeY = wisp.y + Math.sin(offset) * wisp.radius * 0.5;
      context.beginPath();
      context.arc(eyeX, eyeY, 3.4, 0, Math.PI * 2);
      context.fill();
    }
  }
  // A health sliver over anything still alive and wounded.
  if (wisp.hp < wisp.maxHp) {
    context.fillStyle = 'rgba(0,0,0,0.55)';
    context.fillRect(wisp.x - wisp.radius, wisp.y - wisp.radius - 9, wisp.radius * 2, 4);
    context.fillStyle = PALETTE.good;
    context.fillRect(wisp.x - wisp.radius, wisp.y - wisp.radius - 9, wisp.radius * 2 * (wisp.hp / wisp.maxHp), 4);
  }
}

function drawProjectiles(context, world) {
  context.fillStyle = PALETTE.bullet;
  for (const spark of world.bullets) {
    context.beginPath();
    context.ellipse(spark.x, spark.y, 9, 4, Math.atan2(spark.vy, spark.vx), 0, Math.PI * 2);
    context.fill();
  }
  context.fillStyle = PALETTE.warden;
  for (const shard of world.shots) {
    context.beginPath();
    context.arc(shard.x, shard.y, 6, 0, Math.PI * 2);
    context.fill();
  }
}

function drawParticles(context, particles) {
  for (const dot of particles) {
    context.globalAlpha = Math.max(0, dot.life / dot.maxLife);
    context.fillStyle = dot.color;
    context.beginPath();
    context.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
}

function drawNova(context, world) {
  if (world.novaTimer <= 0) return;
  context.strokeStyle = PALETTE.ember;
  context.globalAlpha = world.novaTimer / 0.5;
  context.lineWidth = 6;
  context.beginPath();
  context.arc(world.lantern.x, world.lantern.y, world.novaRadius, 0, Math.PI * 2);
  context.stroke();
  context.globalAlpha = 1;
}

/** The whole play frame; `shake` jitters the cave so every hard hit reads. */
export function drawPlay(context, world) {
  context.save();
  if (world.shake > 0) {
    context.translate((Math.random() - 0.5) * world.shake, (Math.random() - 0.5) * world.shake);
  }
  drawCave(context);
  drawLantern(context, world.lantern);
  drawNova(context, world);
  for (const wisp of world.enemies) drawWisp(context, wisp);
  drawProjectiles(context, world);
  drawPlayer(context, world.player);
  drawParticles(context, world.particles);
  context.restore();
}

export function clearCanvas(context) {
  context.fillStyle = PALETTE.background;
  context.fillRect(0, 0, ARENA.width, ARENA.height);
}
