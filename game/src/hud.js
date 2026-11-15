// The HUD: wave and score at the top, the lantern's and moth's light gauges, the dash charge and
// the boon list — every number the player needs, always on screen during play.
import { ARENA, PALETTE, WAVES } from './config.js';
import { BOONS } from './config.js';

function gauge(context, x, y, width, height, ratio, fill, label, valueText) {
  context.fillStyle = 'rgba(10,14,20,0.8)';
  context.fillRect(x - 2, y - 2, width + 4, height + 4);
  context.fillStyle = '#242e3a';
  context.fillRect(x, y, width, height);
  context.fillStyle = fill;
  context.fillRect(x, y, width * Math.max(0, Math.min(1, ratio)), height);
  context.strokeStyle = 'rgba(242,234,217,0.35)';
  context.lineWidth = 1;
  context.strokeRect(x, y, width, height);
  context.font = 'bold 15px Georgia, serif';
  context.fillStyle = PALETTE.text;
  context.textAlign = 'left';
  context.fillText(label, x, y - 8);
  context.textAlign = 'right';
  context.fillText(valueText, x + width, y - 8);
}

function label(context, text, x, y, align = 'left', size = 15, color = PALETTE.text) {
  context.font = `bold ${size}px Georgia, serif`;
  context.fillStyle = color;
  context.textAlign = align;
  context.fillText(text, x, y);
}

export function drawHud(context, world) {
  const lanternRatio = world.lantern.hp / world.lantern.maxHp;
  const mothRatio = world.player.hp / world.player.maxHp;

  gauge(context, 40, 62, 300, 14, lanternRatio,
    lanternRatio > 0.35 ? PALETTE.ember : PALETTE.bad, 'LANTERN', `${Math.ceil(world.lantern.hp)} light`);
  gauge(context, 40, 110, 300, 14, mothRatio,
    mothRatio > 0.35 ? PALETTE.moth : PALETTE.bad, 'MOTH', `${Math.ceil(world.player.hp)} vigour`);

  label(context, `WAVE ${world.waveState.wave} / ${WAVES.total}`, ARENA.width - 40, 60, 'right', 24);
  label(context, `SCORE ${world.score}`, ARENA.width - 40, 90, 'right', 18, PALETTE.textDim);

  // Dash readiness: a small ring of text so keyboard-only players can time it.
  const dashReady = world.player.dashCharge >= 1;
  label(context, dashReady ? 'DASH READY' : 'DASH …', ARENA.width - 40, ARENA.height - 24, 'right', 14,
    dashReady ? PALETTE.moth : PALETTE.textDim);

  // The boons this run has taken, listed small down the left edge.
  const taken = world.boonsChosen;
  for (let index = 0; index < taken.length; index += 1) {
    const boon = BOONS.find((entry) => entry.id === taken[index]);
    label(context, `+ ${boon ? boon.name : taken[index]}`, 40, ARENA.height - 116 + index * 20, 'left', 13, PALETTE.ember);
  }

  // Incoming wave counter while wisps remain to arrive.
  const remaining = world.waveState.spawning
    ? world.waveState.schedule.length - world.waveState.nextSpawn + world.enemies.length
    : world.enemies.length;
  if (remaining > 0) label(context, `WISPS ${remaining}`, ARENA.width - 40, 118, 'right', 14, PALETTE.wisp);
}
