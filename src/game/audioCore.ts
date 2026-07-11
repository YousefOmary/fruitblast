/** Shared procedural-audio graph used by music and every sound effect. */

import { getStoredMuted } from './storage';

/** Owner-tunable mix levels; adjust these by ear without touching synthesis code. */
export const AUDIO_LEVELS = {
  master: 0.78,
  music: 0.52,
  sfx: 0.76,
  reverbReturn: 0.22,
} as const;

export type MixBus = 'music' | 'sfx';

export interface AudioCore {
  context: AudioContext;
  analyser: AnalyserNode;
}

interface AudioGraph extends AudioCore {
  master: GainNode;
  music: GainNode;
  sfx: GainNode;
  reverb: ConvolverNode;
  reverbReturn: GainNode;
}

let graph: AudioGraph | null = null;

function audioContextConstructor(): typeof AudioContext | undefined {
  return window.AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
}

function impulse(context: AudioContext): AudioBuffer {
  const seconds = 0.72;
  const buffer = context.createBuffer(2, Math.floor(context.sampleRate * seconds), context.sampleRate);
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < data.length; i++) {
      const decay = Math.pow(1 - i / data.length, 3.8);
      data[i] = (Math.random() * 2 - 1) * decay;
    }
  }
  return buffer;
}

function createGraph(): AudioGraph | null {
  const Ctor = audioContextConstructor();
  if (!Ctor) return null;
  const context = new Ctor();
  const master = context.createGain();
  const limiter = context.createDynamicsCompressor();
  const analyser = context.createAnalyser();
  const music = context.createGain();
  const sfx = context.createGain();
  const reverb = context.createConvolver();
  const reverbReturn = context.createGain();

  master.gain.value = getStoredMuted() ? 0 : AUDIO_LEVELS.master;
  music.gain.value = AUDIO_LEVELS.music;
  sfx.gain.value = AUDIO_LEVELS.sfx;
  reverbReturn.gain.value = AUDIO_LEVELS.reverbReturn;
  limiter.threshold.value = -10;
  limiter.knee.value = 12;
  limiter.ratio.value = 8;
  limiter.attack.value = 0.004;
  limiter.release.value = 0.18;
  analyser.fftSize = 2048;
  reverb.buffer = impulse(context);

  music.connect(master);
  sfx.connect(master);
  reverb.connect(reverbReturn).connect(master);
  master.connect(limiter).connect(analyser).connect(context.destination);
  return { context, analyser, master, music, sfx, reverb, reverbReturn };
}

/** Lazily create/resume the one AudioContext. Must be called from a user gesture. */
export function getAudioCore(): AudioCore | null {
  if (getStoredMuted()) return null;
  graph ??= createGraph();
  if (!graph) return null;
  if (graph.context.state === 'suspended') void graph.context.resume();
  return graph;
}

/** Route one voice envelope to its dry bus and an optional shared reverb send. */
export function connectVoice(source: AudioNode, bus: MixBus, wet = 0): () => void {
  if (!graph) return () => source.disconnect();
  const dry = bus === 'music' ? graph.music : graph.sfx;
  source.connect(dry);
  let send: GainNode | null = null;
  if (wet > 0) {
    send = graph.context.createGain();
    send.gain.value = wet;
    source.connect(send).connect(graph.reverb);
  }
  return () => {
    try { source.disconnect(); } catch { /* already disconnected */ }
    try { send?.disconnect(); } catch { /* already disconnected */ }
  };
}

/** Smoothly gate the whole graph while retaining the shared context. */
export function setCoreMuted(muted: boolean): void {
  if (!graph) return;
  const now = graph.context.currentTime;
  graph.master.gain.cancelScheduledValues(now);
  graph.master.gain.setTargetAtTime(muted ? 0 : AUDIO_LEVELS.master, now, 0.012);
}

/** Set the master output level (normally use AUDIO_LEVELS.master). */
export function setMasterVolume(value: number): void {
  if (graph) graph.master.gain.setTargetAtTime(getStoredMuted() ? 0 : Math.max(0, value), graph.context.currentTime, 0.02);
}

/** Set the music-bus level independently of sound effects. */
export function setMusicVolume(value: number): void {
  if (graph) graph.music.gain.setTargetAtTime(Math.max(0, value), graph.context.currentTime, 0.02);
}

/** Set the SFX-bus level independently of music. */
export function setSfxVolume(value: number): void {
  if (graph) graph.sfx.gain.setTargetAtTime(Math.max(0, value), graph.context.currentTime, 0.02);
}

/** Read-only shared-context diagnostics without exposing the game on window. */
export function getAudioCoreState(): {
  contextState: AudioContextState | 'unavailable';
  sampleRate: number;
  fftSize: number;
} {
  return {
    contextState: graph?.context.state ?? 'unavailable',
    sampleRate: graph?.context.sampleRate ?? 0,
    fftSize: graph?.analyser.fftSize ?? 0,
  };
}
