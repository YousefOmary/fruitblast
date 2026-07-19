/** Shared mode rules and deterministic Daily Challenge helpers. */

export type GameMode = 'campaign' | 'endless' | 'time' | 'daily';

/** Runtime rules consumed by the single GameScene engine. */
export interface ModeConfig {
  title: string;
  limit: 'moves' | 'time' | 'none';
  moves?: number;
  seconds?: number;
  colors: number;
}

export function modeConfig(mode: GameMode): ModeConfig {
  if (mode === 'endless') return { title: 'ZEN', limit: 'none', colors: 5 };
  if (mode === 'time') return { title: 'TIME ATTACK', limit: 'time', seconds: 120, colors: 5 };
  if (mode === 'daily') return { title: 'DAILY CHALLENGE', limit: 'moves', moves: 30, colors: 5 };
  return { title: 'CAMPAIGN', limit: 'moves', colors: 6 };
}

/** UTC date key, ensuring the same challenge date worldwide. */
export function dailyDate(date = new Date()): string { return date.toISOString().slice(0, 10); }

/** Stable 32-bit string hash. */
export function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Small deterministic RNG suitable for reproducible board/refill sequences. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seed used by every player for a given UTC day. */
export function dailySeed(dateKey: string): number { return hashString(`fruitblast:${dateKey}`); }

/** Spoiler-free share text: result only, never board state or moves. */
export function dailyShare(dateKey: string, score: number): string {
  const rank = score >= 9000 ? 'CROWN' : score >= 5200 ? 'GOLD' : score >= 2600 ? 'SILVER' : 'FRESH';
  return `Fruit Blast Daily ${dateKey}\n${rank} · ${score.toLocaleString('en-US')} points`;
}
