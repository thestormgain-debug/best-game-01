// The game's entry point: wires input, audio, the world and the renderer into a fixed-step loop
// and owns the screen state machine (title → play → boons → … → victory/defeat). With ?shot=<name>
// the page instead stages one deterministic screenshot scene of the real game and holds that frame.
import { ARENA, STEP } from './config.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { chooseBoon, makeWorld, resetWorld, stepWorld } from './world.js';
import { drawPlay, clearCanvas } from './render.js';
import { drawHud } from './hud.js';
import { drawBoons, drawDefeat, drawTitle, drawVictory } from './screens.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const statusLine = document.getElementById('status');
const context = canvas.getContext('2d');
const input = createInput(canvas);
const audio = createAudio();
const shotName = new URLSearchParams(window.location.search).get('shot');

let world = shotName === null ? makeWorld() : stageShot(shotName);

function announce(text) {
  statusLine.textContent = text;
}

function confirmPressed() {
  return input.pressed('confirm') || input.pointer.downEdge;
}

function readIntents() {
  return {
    move: input.moveIntent(),
    pointer: input.pointer,
    shooting: input.shooting(),
    dashPressed: input.pressed('dash'),
  };
}

/** Which boon card the pointer is over, or null when it is over none. */
function boonUnderPointer() {
  const width = 272;
  const gap = 26;
  const startX = (ARENA.width - width * 3 - gap * 2) / 2;
  const y = ARENA.height / 2 - 60;
  const p = input.pointer;
  for (let index = 0; index < 3; index += 1) {
    const x = startX + index * (width + gap);
    if (p.x >= x && p.x <= x + width && p.y >= y && p.y <= y + 160) return world.offer[index] ?? null;
  }
  return null;
}

function update(dt) {
  if (world.screen === 'title') {
    if (confirmPressed()) {
      audio.resume();
      resetWorld(world);
      world.screen = 'play';
      announce('Wave one begins. Guard the lantern.');
    }
  } else if (world.screen === 'play') {
    const events = stepWorld(world, dt, readIntents());
    if ((events & 2) !== 0) audio.defeat();
    if ((events & 4) !== 0) audio.victory();
    announce(`Wave ${world.waveState.wave}, score ${world.score}`);
  } else if (world.screen === 'boons') {
    for (const key of ['pick1', 'pick2', 'pick3']) {
      if (input.pressed(key)) {
        const boon = world.offer[Number(key.slice(-1)) - 1];
        if (boon) { chooseBoon(world, boon.id); audio.boon(); announce(`Boon taken: ${boon.name}`); }
      }
    }
    if (input.pointer.downEdge) {
      const picked = boonUnderPointer();
      if (picked !== null) { chooseBoon(world, picked.id); audio.boon(); announce(`Boon taken: ${picked.name}`); }
    }
  } else if (world.screen === 'victory' || world.screen === 'defeat') {
    if (confirmPressed() || input.pressed('restart')) {
      resetWorld(world);
      world.screen = 'play';
      audio.resume();
    }
  }
  input.flush();
}

function drawFrame() {
  clearCanvas(context);
  if (world.screen === 'title') drawTitle(context, world);
  else if (world.screen === 'boons') drawBoons(context, world);
  else if (world.screen === 'victory') drawVictory(context, world);
  else if (world.screen === 'defeat') drawDefeat(context, world);
  else {
    drawPlay(context, world);
    drawHud(context, world);
  }
}

// Fixed timestep: the simulation advances in STEP increments no matter the display's frame rate.
let last = performance.now();
let accumulator = 0;

function loop(now) {
  accumulator += Math.min((now - last) / 1000, 0.25);
  last = now;
  if (shotName === null) {
    while (accumulator >= STEP) {
      update(STEP);
      accumulator -= STEP;
    }
  }
  drawFrame();
  requestAnimationFrame(loop);
}

if (shotName === null) {
  requestAnimationFrame(loop);
} else {
  // Scene mode: paint the staged frame once synchronously (the backing store then holds it even
  // if this tab's display pipeline is throttled), and keep rendering per display frame besides.
  drawFrame();
  requestAnimationFrame(loop);
}
