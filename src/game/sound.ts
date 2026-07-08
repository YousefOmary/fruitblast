/**
 * Procedural sound via Web Audio — no audio files. One shared AudioContext is
 * created lazily on the first play() call (always inside a tap gesture).
 * The match sound rises in pitch with the cascade step: the classic "combo"
 * dopamine ladder.
 */

let ctx: AudioContext | null = null;
let muted = false;

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
