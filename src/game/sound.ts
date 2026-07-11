/** Modern layered procedural SFX, all routed through the shared audio core. */

import { connectVoice, getAudioCore, setCoreMuted } from './audioCore';
import { getStoredMuted, setStoredMuted } from './storage';
import { startMusic, stopMusic } from './music';

let muted = getStoredMuted();
let noiseBuffer: AudioBuffer | null = null;

interface ToneOptions {
  frequency: number;
  endFrequency?: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
  harmonic?: number;
  detune?: number;
  filterStart?: number;
  filterEnd?: number;
  wet?: number;
  delay?: number;
  attack?: number;
}

function audio(): AudioContext | null {
  if (muted) return null;
  return getAudioCore()?.context ?? null;
}

function tone(options: ToneOptions): void {
  const ac = audio();
  if (!ac) return;
  const {
    frequency, endFrequency = frequency, duration, gain, type = 'sine', harmonic = 0,
    detune = 0, filterStart = 5000, filterEnd = 900, wet = 0.08, delay = 0, attack = 0.008,
  } = options;
  const at = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const filter = ac.createBiquadFilter();
  const env = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(1, frequency), at);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), at + duration);
  osc.detune.value = detune;
  filter.type = 'lowpass';
  filter.Q.value = 0.75;
  filter.frequency.setValueAtTime(Math.max(80, filterStart), at);
  filter.frequency.exponentialRampToValueAtTime(Math.max(80, filterEnd), at + duration);
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(gain, at + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(filter).connect(env);

  let upper: OscillatorNode | null = null;
  let upperGain: GainNode | null = null;
  if (harmonic > 0) {
    upper = ac.createOscillator();
    upperGain = ac.createGain();
    upper.type = 'sine';
    upper.frequency.setValueAtTime(frequency * harmonic, at);
    upper.frequency.exponentialRampToValueAtTime(endFrequency * harmonic, at + duration);
    upper.detune.value = 4;
    upperGain.gain.value = 0.28;
    upper.connect(upperGain).connect(filter);
    upper.start(at);
    upper.stop(at + duration + 0.03);
  }

  const disconnectMix = connectVoice(env, 'sfx', wet);
  osc.onended = () => {
    disconnectMix();
    osc.disconnect(); filter.disconnect(); env.disconnect();
    upper?.disconnect(); upperGain?.disconnect();
  };
  osc.start(at);
  osc.stop(at + duration + 0.03);
}

function getNoise(ac: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === ac.sampleRate) return noiseBuffer;
  noiseBuffer = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.55), ac.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

function noise(
  duration: number,
  gain: number,
  frequencyStart: number,
  frequencyEnd: number,
  type: BiquadFilterType = 'bandpass',
  wet = 0.05,
  delay = 0,
): void {
  const ac = audio();
  if (!ac) return;
  const at = ac.currentTime + delay;
  const source = ac.createBufferSource();
  const filter = ac.createBiquadFilter();
  const env = ac.createGain();
  source.buffer = getNoise(ac);
  filter.type = type;
  filter.Q.value = type === 'bandpass' ? 1.2 : 0.7;
  filter.frequency.setValueAtTime(Math.max(80, frequencyStart), at);
  filter.frequency.exponentialRampToValueAtTime(Math.max(80, frequencyEnd), at + duration);
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(gain, at + Math.min(0.012, duration * 0.2));
  env.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  source.connect(filter).connect(env);
  const disconnectMix = connectVoice(env, 'sfx', wet);
  source.onended = () => {
    disconnectMix();
    source.disconnect(); filter.disconnect(); env.disconnect();
  };
  source.start(at);
  source.stop(at + duration + 0.02);
}

/** Soft mallet-like selection tick. */
export function sfxSelect(): void {
  tone({ frequency: 520, endFrequency: 470, duration: 0.085, gain: 0.075, harmonic: 2.02, filterStart: 3000, filterEnd: 700, wet: 0.05 });
  noise(0.035, 0.018, 3200, 1800, 'bandpass', 0.02);
}

/** Quiet airy swap whoosh. */
export function sfxSwap(): void {
  noise(0.16, 0.055, 700, 3100, 'bandpass', 0.035);
  tone({ frequency: 250, endFrequency: 410, duration: 0.13, gain: 0.035, filterStart: 1300, filterEnd: 2600, wet: 0.03 });
}

/** Warm descending rejection thud. */
export function sfxInvalid(): void {
  tone({ frequency: 185, endFrequency: 92, duration: 0.18, gain: 0.105, type: 'triangle', harmonic: 2, filterStart: 1200, filterEnd: 280, wet: 0.025 });
  noise(0.07, 0.028, 500, 180, 'lowpass', 0.01);
}

/** Warm bell/pluck that rises a semitone for every cascade step. */
export function sfxMatch(step: number): void {
  const base = 440 * Math.pow(2, Math.min(step, 8) / 12);
  tone({ frequency: base, endFrequency: base * 0.985, duration: 0.22, gain: 0.125, type: 'triangle', harmonic: 2.01, filterStart: 4300, filterEnd: 850, wet: 0.13, attack: 0.005 });
  tone({ frequency: base * 1.5, endFrequency: base * 1.48, duration: 0.16, gain: 0.045, harmonic: 2, filterStart: 5200, filterEnd: 1200, wet: 0.11, delay: 0.018 });
  noise(0.045, 0.022, 4200, 1700, 'bandpass', 0.025);
}

/** Detuned shimmer/riser when a special is forged. */
export function sfxSpecialCreate(): void {
  [-8, 7].forEach((detune) => tone({ frequency: 590, endFrequency: 1280, duration: 0.3, gain: 0.07, harmonic: 2, detune, filterStart: 1200, filterEnd: 6200, wet: 0.17 }));
  tone({ frequency: 1180, endFrequency: 2140, duration: 0.22, gain: 0.035, harmonic: 1.5, filterStart: 2600, filterEnd: 7600, wet: 0.2, delay: 0.07 });
}

/** Punchy filtered-noise rocket with a rising tonal core. */
export function sfxRocket(): void {
  noise(0.3, 0.13, 480, 5200, 'bandpass', 0.09);
  tone({ frequency: 145, endFrequency: 920, duration: 0.25, gain: 0.105, type: 'triangle', harmonic: 2.02, filterStart: 900, filterEnd: 5200, wet: 0.1 });
  noise(0.07, 0.05, 180, 900, 'highpass', 0.02);
}

/** Deep sub impact, low-passed thump and a compact reverb boom. */
export function sfxBomb(): void {
  tone({ frequency: 105, endFrequency: 38, duration: 0.46, gain: 0.24, type: 'sine', harmonic: 2, filterStart: 900, filterEnd: 180, wet: 0.2, attack: 0.004 });
  tone({ frequency: 58, endFrequency: 32, duration: 0.38, gain: 0.14, type: 'triangle', filterStart: 420, filterEnd: 120, wet: 0.16 });
  noise(0.34, 0.17, 1500, 150, 'lowpass', 0.18);
  noise(0.055, 0.06, 5000, 1100, 'bandpass', 0.04);
}

/** Layered major arpeggio/chord celebration. */
export function sfxWin(): void {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((frequency, index) => tone({
    frequency, endFrequency: frequency * 0.995, duration: 0.32, gain: 0.105,
    type: index < 3 ? 'triangle' : 'sine', harmonic: 2.01,
    filterStart: 5200, filterEnd: 1100, wet: 0.2, delay: index * 0.085,
  }));
  notes.slice(0, 3).forEach((frequency) => tone({
    frequency: frequency / 2, duration: 0.55, gain: 0.045, type: 'sine',
    filterStart: 1200, filterEnd: 500, wet: 0.13, delay: 0.26,
  }));
}

/** Set and persist the global mute gate. */
export function setMuted(value: boolean): void {
  muted = value;
  setStoredMuted(value);
  setCoreMuted(value);
  if (value) stopMusic();
  else startMusic();
}

export function getMuted(): boolean { return muted; }

export function toggleMute(): boolean { setMuted(!muted); return muted; }

export function isMuted(): boolean { return muted; }
