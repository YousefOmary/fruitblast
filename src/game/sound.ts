/**
 * Procedural sound via Web Audio — no audio files. One shared AudioContext is
 * created lazily on the first play() call (always inside a tap gesture).
 * The match sound rises in pitch with the cascade step: the classic "combo"
 * dopamine ladder.
 */

let ctx: AudioContext | null = null;
let muted = false;
let noiseBuf: AudioBuffer | null = null;

function audio(): AudioContext | null {
  if (muted) return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, freqEnd: number, dur: number, type: OscillatorType, gain: number, delay = 0): void {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(gain, t0 + 0.006);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(env).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/** A band-passed white-noise burst — the "air" behind rockets and blasts. */
function noise(dur: number, gain: number, freqStart: number, freqEnd: number): void {
  const ac = audio();
  if (!ac) return;
  if (!noiseBuf) {
    noiseBuf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.5), ac.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const t0 = ac.currentTime;
  const src = ac.createBufferSource();
  src.buffer = noiseBuf;
  const flt = ac.createBiquadFilter();
  flt.type = 'bandpass';
  flt.frequency.setValueAtTime(freqStart, t0);
  flt.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
  const env = ac.createGain();
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(flt).connect(env).connect(ac.destination);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

/** Tap/select blip. */
export function sfxSelect(): void {
  tone(420, 560, 0.05, 'triangle', 0.1);
}

/** Swap whoosh. */
export function sfxSwap(): void {
  tone(300, 460, 0.08, 'sine', 0.12);
}

/** Rejected move. */
export function sfxInvalid(): void {
  tone(200, 90, 0.16, 'sawtooth', 0.14);
}

/** Match clear — pitch climbs with the cascade `step` (0-based) for a combo feel. */
export function sfxMatch(step: number): void {
  const base = 523 * Math.pow(2, Math.min(step, 8) / 12); // up a semitone per cascade
  tone(base, base * 1.5, 0.12, 'triangle', 0.18);
  tone(base * 1.5, base * 2, 0.12, 'sine', 0.09, 0.03);
}

/** Sparkly rising chime when a special tile is forged from a 4+ match. */
export function sfxSpecialCreate(): void {
  tone(660, 1320, 0.14, 'triangle', 0.16);
  tone(990, 1980, 0.16, 'sine', 0.10, 0.04);
}

/** Rocket launch: a fast upward pitch sweep with an airy noise tail. */
export function sfxRocket(): void {
  tone(320, 1500, 0.22, 'sawtooth', 0.13);
  noise(0.24, 0.10, 1000, 4200);
}

/** Colour-bomb blast: a deep pitch drop plus a filtered noise thump. */
export function sfxBomb(): void {
  tone(240, 42, 0.32, 'sawtooth', 0.20);
  tone(120, 30, 0.42, 'sine', 0.18);
  noise(0.3, 0.16, 1800, 180);
}

/** Level/goal fanfare. */
export function sfxWin(): void {
  [523, 659, 784, 1046].forEach((f, i) => tone(f, f, 0.16, 'triangle', 0.2, i * 0.09));
}

/** Toggle all sound; returns new muted state. */
export function toggleMute(): boolean {
  muted = !muted;
  return muted;
}

export function isMuted(): boolean {
  return muted;
}
