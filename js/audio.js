// Tiny WebAudio synth: sound effects plus a looping gothic bass/arpeggio per area.

let ctx = null;
let master = null;
let music = { timer: null, area: -1 };

function ensure() {
  if (ctx) return ctx;
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.25;
  master.connect(ctx.destination);
  return ctx;
}

function tone(freq, dur, type = 'square', vol = 0.3, slide = 0, delay = 0) {
  const ac = ensure();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const SFX = {
  jump: () => tone(300, 0.12, 'square', 0.15, 300),
  jump2: () => tone(500, 0.14, 'triangle', 0.2, 400),
  swing: () => tone(900, 0.08, 'sawtooth', 0.08, -700),
  hit: () => tone(160, 0.1, 'square', 0.25, -80),
  kill: () => { tone(220, 0.2, 'sawtooth', 0.2, -180); tone(110, 0.3, 'square', 0.15, -60, 0.05); },
  hurt: () => tone(120, 0.25, 'sawtooth', 0.3, -60),
  dash: () => tone(200, 0.18, 'sawtooth', 0.15, 500),
  magic: () => { tone(880, 0.2, 'triangle', 0.15, 440); tone(1320, 0.2, 'sine', 0.1, 0, 0.05); },
  pickup: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'square', 0.15, 0, i * 0.08)),
  save: () => [392, 494, 587, 784].forEach((f, i) => tone(f, 0.35, 'triangle', 0.18, 0, i * 0.15)),
  door: () => tone(90, 0.2, 'square', 0.15, 40),
  windup: () => tone(70, 0.3, 'sawtooth', 0.2, 60),
  menu: () => tone(660, 0.06, 'square', 0.1),
  level: () => [523, 784, 1046, 1568].forEach((f, i) => tone(f, 0.25, 'square', 0.15, 0, i * 0.1)),
  form: () => tone(440, 0.25, 'triangle', 0.2, 660),
};

/** Play a sound effect by name (unknown names are ignored). */
export function sfx(name) {
  if (SFX[name]) SFX[name]();
}

const SCALES = [
  [110, 131, 147, 165, 196], [98, 117, 131, 147, 175], [123, 147, 165, 185, 220],
  [87, 104, 117, 131, 156], [104, 123, 139, 156, 185], [92, 110, 123, 139, 165],
];

/** Start (or switch) the looping area theme. */
export function playMusic(area) {
  if (!ensure() || music.area === area) return;
  stopMusic();
  music.area = area;
  const scale = SCALES[area % SCALES.length];
  let beat = 0;
  music.timer = setInterval(() => {
    if (beat % 8 === 0) tone(scale[0] / 2, 0.9, 'triangle', 0.22);
    const note = scale[[0, 2, 4, 3, 1, 3, 2, 4][beat % 8]] * 2;
    tone(note, 0.22, 'square', 0.05);
    beat++;
  }, 260);
}

export function stopMusic() {
  if (music.timer) clearInterval(music.timer);
  music = { timer: null, area: -1 };
}

/** Browsers start audio only after a user gesture. */
export function resumeAudio() {
  if (ctx && ctx.state === 'suspended') ctx.resume();
}
