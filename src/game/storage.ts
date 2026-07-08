/**
 * The single gateway to localStorage. Every read/write is wrapped in try/catch
 * because the Capacitor webview and private-browsing mode can throw on access —
 * a failed persist must never crash the game, it just falls back to defaults.
 */

const K_MUTED = 'fruitblast:muted';
const K_MUSIC = 'fruitblast:music';
const K_BEST = 'fruitblast:best';

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
