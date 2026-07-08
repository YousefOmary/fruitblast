/**
 * The single gateway to localStorage. Every read/write is wrapped in try/catch
 * because the Capacitor webview and private-browsing mode can throw on access —
 * a failed persist must never crash the game, it just falls back to defaults.
 */

const K_MUTED = 'fruitblast:muted';
const K_MUSIC = 'fruitblast:music';
const K_BEST = 'fruitblast:best';
const K_UNLOCKED = 'fruitblast:unlocked';
const K_STARS = 'fruitblast:stars';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode / webview) — ignore. */
  }
}

/** Persisted best score (0 if none / unreadable). */
export function getBest(): number {
  const n = Number.parseInt(read(K_BEST) ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function setBest(value: number): void {
  write(K_BEST, String(value));
}

/** Persisted mute flag (default: not muted). */
export function getStoredMuted(): boolean {
  return read(K_MUTED) === 'true';
}

export function setStoredMuted(muted: boolean): void {
  write(K_MUTED, muted ? 'true' : 'false');
}

/** Persisted music preference (default: on). Playback itself lands in Phase 5. */
export function getMusic(): boolean {
  return read(K_MUSIC) !== 'off';
}

export function setMusic(on: boolean): void {
  write(K_MUSIC, on ? 'on' : 'off');
}

/**
 * Highest level index the player has unlocked (0 = only level 1 available).
 * Bumped to `justCleared + 1` on a win so the next level opens.
 */
export function getUnlocked(): number {
  const n = Number.parseInt(read(K_UNLOCKED) ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Raise the unlocked ceiling to `index` (never lowers it). */
export function setUnlocked(index: number): void {
  if (index > getUnlocked()) write(K_UNLOCKED, String(index));
}

/**
 * Best star count (0–3) earned per level, indexed by level. Stored as a JSON
 * array; a corrupt/missing value degrades to an empty record rather than crash.
 */
export function getStars(): number[] {
  try {
    const raw = read(K_STARS);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((n) => (Number.isFinite(n) ? Number(n) : 0)) : [];
  } catch {
    return [];
  }
}

/** Record `stars` for `levelIndex` if it beats the stored best. */
export function setStars(levelIndex: number, stars: number): void {
  const all = getStars();
  if ((all[levelIndex] ?? 0) >= stars) return;
  all[levelIndex] = stars;
  write(K_STARS, JSON.stringify(all));
}
