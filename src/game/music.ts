/** Warm procedural background loop routed through the shared audio core. */

import { connectVoice, getAudioCore, getAudioCoreState } from './audioCore';
import { getMusic, getStoredMuted, setMusic } from './storage';

const CHORDS = [
  [220.00, 261.63, 329.63],
  [196.00, 246.94, 293.66],
  [174.61, 220.00, 261.63],
  [196.00, 246.94, 329.63],
] as const;
const STEP_SECONDS = 0.5;
const CHORD_SECONDS = STEP_SECONDS * 4;
const SCHEDULE_AHEAD_SECONDS = 1.15;

let timer: number | null = null;
let playing = false;
let nextChordAt = 0;
let chordIndex = 0;
let scheduledNotes = 0;
const voices = new Set<OscillatorNode>();

function track(
  oscillators: OscillatorNode[],
  nodes: AudioNode[],
  disconnectMix: () => void,
  startAt: number,
  stopAt: number,
): void {
  for (const osc of oscillators) {
    voices.add(osc);
    osc.start(startAt);
    osc.stop(stopAt);
  }
  oscillators[0].onended = () => {
    for (const osc of oscillators) { voices.delete(osc); osc.disconnect(); }
    for (const node of nodes) node.disconnect();
    disconnectMix();
  };
}

function pad(context: AudioContext, frequencies: readonly number[], at: number): void {
  const filter = context.createBiquadFilter();
  const env = context.createGain();
  filter.type = 'lowpass';
  filter.frequency.value = 1700;
  filter.Q.value = 0.5;
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(0.045, at + 0.3);
  env.gain.setValueAtTime(0.04, at + CHORD_SECONDS * 0.72);
  env.gain.exponentialRampToValueAtTime(0.0001, at + CHORD_SECONDS * 1.05);
  filter.connect(env);
  const oscillators = frequencies.flatMap((frequency) => [-5, 5].map((detune) => {
    const osc = context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    osc.detune.value = detune;
    osc.connect(filter);
    return osc;
  }));
  const disconnectMix = connectVoice(env, 'music', 0.18);
  track(oscillators, [filter, env], disconnectMix, at, at + CHORD_SECONDS * 1.08);
  scheduledNotes += oscillators.length;
}

function bass(context: AudioContext, root: number, at: number): void {
  const env = context.createGain();
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 520;
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(0.095, at + 0.08);
  env.gain.exponentialRampToValueAtTime(0.0001, at + CHORD_SECONDS * 0.92);
  filter.connect(env);
  const levels: GainNode[] = [];
  const oscillators = [0, 1].map((index) => {
    const osc = context.createOscillator();
    osc.type = index === 0 ? 'sine' : 'triangle';
    osc.frequency.value = root / 2;
    osc.detune.value = index === 0 ? 0 : 3;
    const level = context.createGain();
    level.gain.value = index === 0 ? 1 : 0.22;
    levels.push(level);
    osc.connect(level).connect(filter);
    return osc;
  });
  const disconnectMix = connectVoice(env, 'music', 0.08);
  track(oscillators, [filter, env, ...levels], disconnectMix, at, at + CHORD_SECONDS);
  scheduledNotes += oscillators.length;
}

function pluck(context: AudioContext, frequency: number, at: number): void {
  const env = context.createGain();
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2800, at);
  filter.frequency.exponentialRampToValueAtTime(700, at + STEP_SECONDS * 1.55);
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(0.07, at + 0.025);
  env.gain.exponentialRampToValueAtTime(0.0001, at + STEP_SECONDS * 1.6);
  filter.connect(env);
  const levels: GainNode[] = [];
  const oscillators = [1, 2.01].map((ratio, index) => {
    const osc = context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frequency * ratio;
    const level = context.createGain();
    level.gain.value = index === 0 ? 1 : 0.2;
    levels.push(level);
    osc.connect(level).connect(filter);
    return osc;
  });
  const disconnectMix = connectVoice(env, 'music', 0.12);
  track(oscillators, [filter, env, ...levels], disconnectMix, at, at + STEP_SECONDS * 1.65);
  scheduledNotes += oscillators.length;
}

function schedule(): void {
  if (!playing) return;
  const core = getAudioCore();
  if (!core) return;
  while (nextChordAt < core.context.currentTime + SCHEDULE_AHEAD_SECONDS) {
    const chord = CHORDS[chordIndex % CHORDS.length];
    pad(core.context, chord, nextChordAt);
    bass(core.context, chord[0], nextChordAt);
    for (let step = 0; step < 4; step++) {
      pluck(core.context, chord[step % chord.length] * (step === 3 ? 2 : 1), nextChordAt + step * STEP_SECONDS);
    }
    nextChordAt += CHORD_SECONDS;
    chordIndex++;
  }
}

/** Start exactly one ambient scheduler if both sound preferences allow it. */
export function startMusic(): void {
  if (playing || getStoredMuted() || !getMusic()) return;
  const core = getAudioCore();
  if (!core) return;
  playing = true;
  nextChordAt = core.context.currentTime + 0.04;
  schedule();
  timer = window.setInterval(schedule, 400);
}

/** Stop scheduling and immediately dispose every scheduled oscillator. */
export function stopMusic(): void {
  playing = false;
  if (timer !== null) { window.clearInterval(timer); timer = null; }
  for (const voice of [...voices]) {
    try { voice.stop(); } catch { /* voice ended between iteration and stop */ }
  }
  voices.clear();
}

/** Persist the music preference and apply it from the current gesture. */
export function setMusicEnabled(enabled: boolean): void {
  setMusic(enabled);
  if (enabled) startMusic();
  else stopMusic();
}

/** Playback diagnostics used by settings/browser verification. */
export function getMusicState(): {
  enabled: boolean;
  muted: boolean;
  playing: boolean;
  contextState: AudioContextState | 'unavailable';
  activeVoices: number;
  scheduledNotes: number;
} {
  return {
    enabled: getMusic(), muted: getStoredMuted(), playing,
    contextState: getAudioCoreState().contextState,
    activeVoices: voices.size, scheduledNotes,
  };
}
