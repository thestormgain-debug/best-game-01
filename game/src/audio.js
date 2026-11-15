// Original synth sound: every effect is shaped live with the Web Audio API from oscillators and
// gain envelopes, so the game ships no audio file and plays identically offline.
export function createAudio() {
  let context = null;
  let master = null;
  let enabled = true;

  function ensureContext() {
    if (context !== null) return context;
    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextClass) { enabled = false; return null; }
    context = new AudioContextClass();
    master = context.createGain();
    master.gain.value = 0.35;
    master.connect(context.destination);
    return context;
  }

  /** One shaped tone: an oscillator of `type` sweeping `from` to `to` hertz over `seconds`. */
  function tone({ type = 'sine', from = 440, to = 220, seconds = 0.2, volume = 0.5, delay = 0 }) {
    if (!enabled || !ensureContext()) return;
    const now = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), now + seconds);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
    oscillator.connect(gain).connect(master);
    oscillator.start(now);
    oscillator.stop(now + seconds + 0.02);
  }

  function noise({ seconds = 0.25, volume = 0.4, delay = 0 }) {
    if (!enabled || !ensureContext()) return;
    const now = context.currentTime + delay;
    const length = Math.ceil(context.sampleRate * seconds);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) {
      channel[index] = (Math.random() * 2 - 1) * (1 - index / length);
    }
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
    source.connect(gain).connect(master);
    source.start(now);
  }

  return {
    resume() {
      if (ensureContext() && context.state === 'suspended') context.resume();
    },
    shoot() { tone({ type: 'square', from: 720, to: 260, seconds: 0.09, volume: 0.12 }); },
    hit() { tone({ type: 'triangle', from: 300, to: 120, seconds: 0.12, volume: 0.2 }); },
    fade() { tone({ type: 'sine', from: 520, to: 90, seconds: 0.3, volume: 0.25 }); },
    dash() { noise({ seconds: 0.12, volume: 0.18 }); },
    mothHurt() { tone({ type: 'sawtooth', from: 200, to: 70, seconds: 0.3, volume: 0.3 }); noise({ seconds: 0.2, volume: 0.2 }); },
    lanternHurt() { tone({ type: 'sawtooth', from: 160, to: 55, seconds: 0.4, volume: 0.3 }); },
    nova() { tone({ type: 'sine', from: 180, to: 720, seconds: 0.45, volume: 0.3 }); },
    boon() {
      tone({ type: 'triangle', from: 420, to: 640, seconds: 0.12, volume: 0.25 });
      tone({ type: 'triangle', from: 640, to: 880, seconds: 0.18, volume: 0.25, delay: 0.1 });
    },
    victory() {
      [392, 494, 587, 784].forEach((hertz, index) => tone({ type: 'triangle', from: hertz, to: hertz, seconds: 0.3, volume: 0.25, delay: index * 0.14 }));
    },
    defeat() {
      [392, 330, 262, 196].forEach((hertz, index) => tone({ type: 'sine', from: hertz, to: hertz * 0.9, seconds: 0.4, volume: 0.25, delay: index * 0.18 }));
    },
  };
}
