// The screens the run shows over the cave: the title, the boon choice, the victory and the defeat,
// each drawn on top of a live or frozen play frame so the vale is always behind the words.
import { ARENA, PALETTE, WAVES } from './config.js';
import { clearCanvas, drawPlay } from './render.js';

function panel(context, width, height) {
  const x = (ARENA.width - width) / 2;
  const y = (ARENA.height - height) / 2;
  context.fillStyle = 'rgba(8,11,17,0.86)';
  context.fillRect(x, y, width, height);
  context.strokeStyle = PALETTE.emberDeep;
  context.lineWidth = 2;
  context.strokeRect(x, y, width, height);
  return { x, y };
}

function centre(context, text, y, { size = 40, color = PALETTE.text, font = 'Georgia, serif' } = {}) {
  context.font = `bold ${size}px ${font}`;
  context.fillStyle = color;
  context.textAlign = 'center';
  context.fillText(text, ARENA.width / 2, y);
}

export function drawTitle(context, world) {
  clearCanvas(context);
  drawPlay(context, world);
  panel(context, 760, 420);
  centre(context, 'EMBERMOTH', ARENA.height / 2 - 90, { size: 64, color: PALETTE.ember });
  centre(context, 'the vale is dark, and the wisps want the lantern', ARENA.height / 2 - 34, { size: 19, color: PALETTE.textDim });
  const lines = [
    'Fly the moth:  WASD or the arrow keys   ·   Aim with the mouse',
    'Hold the left button to loose sparks   ·   SPACE to dash',
    'Guard the lantern through ten waves.  Between waves,',
    'choose one of three boons — your build is your survival.',
  ];
  lines.forEach((line, index) => centre(context, line, ARENA.height / 2 + 22 + index * 30, { size: 17, color: PALETTE.text }));
  centre(context, 'PRESS ENTER OR CLICK TO LIGHT THE WICK', ARENA.height / 2 + 162, { size: 21, color: PALETTE.moth });
}

/** The boon menu: three named choices, keys 1 2 3 or a click, over a paused play frame. */
export function drawBoons(context, world) {
  clearCanvas(context);
  drawPlay(context, world);
  panel(context, 900, 330);
  centre(context, `WAVE ${world.waveState.wave - 1} HELD — CHOOSE ONE BOON`, ARENA.height / 2 - 104, { size: 26, color: PALETTE.ember });
  const width = 272;
  const gap = 26;
  const startX = (ARENA.width - width * 3 - gap * 2) / 2;
  world.offer.forEach((boon, index) => {
    const x = startX + index * (width + gap);
    const y = ARENA.height / 2 - 60;
    context.fillStyle = 'rgba(17,24,35,0.95)';
    context.fillRect(x, y, width, 160);
    context.strokeStyle = PALETTE.mothDark;
    context.lineWidth = 2;
    context.strokeRect(x, y, width, 160);
    centre(context, `${index + 1}`, x + width / 2, y + 34, { size: 20, color: PALETTE.moth });
    centre(context, boon.name, x + width / 2, y + 74, { size: 22, color: PALETTE.text });
    context.font = '15px Georgia, serif';
    context.fillStyle = PALETTE.textDim;
    context.textAlign = 'center';
    context.fillText(boon.desc, x + width / 2, y + 104);
  });
  centre(context, 'PRESS 1, 2 OR 3 — OR CLICK A BOON', ARENA.height / 2 + 130, { size: 17, color: PALETTE.textDim });
}

function drawEnd(context, world, { headline, colour, detail }) {
  clearCanvas(context);
  drawPlay(context, world);
  panel(context, 760, 400);
  centre(context, headline, ARENA.height / 2 - 80, { size: 54, color: colour });
  centre(context, detail, ARENA.height / 2 - 20, { size: 19, color: PALETTE.text });
  centre(context, `FINAL SCORE  ${world.score}`, ARENA.height / 2 + 34, { size: 30, color: PALETTE.ember });
  centre(context, `waves held: ${world.waveState.wave - 1} of ${WAVES.total}`, ARENA.height / 2 + 72, { size: 16, color: PALETTE.textDim });
  centre(context, 'PRESS ENTER OR R TO FLY AGAIN', ARENA.height / 2 + 140, { size: 21, color: PALETTE.moth });
}

export function drawVictory(context, world) {
  drawEnd(context, world, {
    headline: 'THE VALE HOLDS',
    colour: PALETTE.good,
    detail: 'Ten waves of wisps burned away. The lantern stands.',
  });
}

export function drawDefeat(context, world) {
  const byLantern = world.lantern.hp <= 0;
  drawEnd(context, world, {
    headline: 'THE LIGHT DIES',
    colour: PALETTE.bad,
    detail: byLantern
      ? 'The wisps swallowed the lantern’s flame.'
      : 'The moth fell, and the lantern stood alone.',
  });
}
