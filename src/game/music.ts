/**
 * Quiet procedural background music. The AudioContext is created lazily from
 * startMusic(), which is called by a real pointer gesture in main.ts so browser
 * autoplay rules are respected.
 */

import { getMusic, getStoredMuted, setMusic } from './storage';

const CHORDS = [
  [220.00, 261.63, 329.63],
  [196.00, 246.94, 293.66],
  [174.61, 220.00, 261.63],
  [196.00, 246.94, 329.63],
] as const;
const STEP_SECONDS = 0.48;
const CHORD_SECONDS = STEP_SECONDS * 4;
const SCHEDULE_AHEAD_SECONDS = 1.2;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let timer: number | null = null;
let playing = false;
let nextChordAt = 0;
let chordIndex = 0;
let scheduledNotes = 0;
const voices = new Set<OscillatorNode>();

function audio(): AudioContext | null {
  if (getStoredMuted() || !getMusic()) return null;
  if (!ctx) {
    const Ctor = window.AudioContext
      ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.32;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function note(ac: AudioContext, frequency: number, at: number, duration: number): void {
  if (!master) return;
  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, at);
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(0.026, at + 0.14);
  env.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(env).connect(master);
  voices.add(osc);
  scheduledNotes++;
  osc.onended = () => {
    voices.delete(osc);
    osc.disconnect();
    env.disconnect();
  };
  osc.start(at);
  osc.stop(at + duration + 0.04);
}

function schedule(): void {
  if (!playing || !ctx) return;
  while (nextChordAt < ctx.currentTime + SCHEDULE_AHEAD_SECONDS) {
    const chord = CHORDS[chordIndex % CHORDS.length];
    for (let step = 0; step < 4; step++) {
      const frequency = chord[step % chord.length] * (step === 3 ? 2 : 1);
      note(ctx, frequency, nextChordAt + step * STEP_SECONDS, STEP_SECONDS * 1.8);
    }
    nextChordAt += CHORD_SECONDS;
    chordIndex++;
  }
}

/** Start one ambient loop if both sound settings allow it. Safe to call repeatedly. */
export function startMusic(): void {
  if (playing || getStoredMuted() || !getMusic()) return;
  const ac = audio();
  if (!ac) return;
  playing = true;
  nextChordAt = ac.currentTime + 0.04;
  schedule();
  timer = window.setInterval(schedule, 400);
}

/** Stop scheduling and silence all already-scheduled notes immediately. */
export function stopMusic(): void {
  playing = false;
  if (timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }
  for (const voice of voices) {
    try {
      voice.stop();
    } catch {
      // A voice may already have ended between iteration and stop().
    }
  }
  voices.clear();
}

/** Persist the music preference and apply it immediately from the current gesture. */
export function setMusicEnabled(enabled: boolean): void {
  setMusic(enabled);
  if (enabled) startMusic();
  else stopMusic();
}

/** Observable playback state for diagnostics without exposing the game on window. */
export function getMusicState(): {
  enabled: boolean;
  muted: boolean;
  playing: boolean;
  contextState: AudioContextState | 'unavailable';
  activeVoices: number;
  scheduledNotes: number;
} {
  return {
    enabled: getMusic(),
    muted: getStoredMuted(),
    playing,
    contextState: ctx?.state ?? 'unavailable',
    activeVoices: voices.size,
    scheduledNotes,
  };
}
