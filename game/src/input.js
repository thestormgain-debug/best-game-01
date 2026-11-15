// Keyboard and pointer state, normalised into intents the world reads each step: a direction key
// set, the aim point in arena coordinates, whether the spark trigger is held, and edge events
// (dash, restart, confirm) that only read true once per press.
export function createInput(canvas) {
  const keys = new Set();
  const edges = new Set();
  const pointer = { x: 1280 / 2, y: 800 / 2, down: false, downEdge: false };

  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    Space: 'dash',
    Enter: 'confirm', KeyR: 'restart',
    Digit1: 'pick1', Digit2: 'pick2', Digit3: 'pick3',
  };

  function toArena(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / rect.width * 1280,
      y: (event.clientY - rect.top) / rect.height * 800,
    };
  }

  window.addEventListener('keydown', (event) => {
    const intent = KEYMAP[event.code];
    if (intent === undefined) return;
    event.preventDefault();
    if (!keys.has(intent)) edges.add(intent);
    keys.add(intent);
  });
  window.addEventListener('keyup', (event) => {
    const intent = KEYMAP[event.code];
    if (intent !== undefined) keys.delete(intent);
  });
  window.addEventListener('mousemove', (event) => {
    Object.assign(pointer, toArena(event));
  });
  window.addEventListener('mousedown', (event) => {
    if (event.button === 0) {
      Object.assign(pointer, toArena(event));
      pointer.down = true;
      pointer.downEdge = true;
    }
  });
  window.addEventListener('mouseup', (event) => {
    if (event.button === 0) pointer.down = false;
  });
  window.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    pointer,
    /** Unit-less move intent (-1..1 each axis) from the held direction keys. */
    moveIntent() {
      return {
        x: (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0),
        y: (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0),
      };
    },
    shooting() { return pointer.down; },
    pressed(intent) {
      if (edges.has(intent)) { edges.delete(intent); return true; }
      return false;
    },
    /** The world drains edges each frame; anything it never read is dropped, never queued. */
    flush() { edges.clear(); pointer.downEdge = false; },
  };
}
