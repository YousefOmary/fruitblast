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
const K_LAST = 'fruitblast:lastCampaign';
const K_MODE = 'fruitblast:lastMode';
const K_ENDLESS_BEST = 'fruitblast:endlessBest';
const K_TIME_BEST = 'fruitblast:timeBest';
const K_DAILY_DATE = 'fruitblast:dailyDate';
const K_DAILY_BEST = 'fruitblast:dailyBest';
const K_DAILY_LAST = 'fruitblast:dailyLastCompleted';
const K_DAILY_STREAK = 'fruitblast:dailyStreak';

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

function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* storage unavailable — ignore. */
  }
}

function readNumber(key: string): number {
  const n = Number.parseInt(read(key) ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Persisted best score (0 if none / unreadable). */
export function getBest(): number {
  return readNumber(K_BEST);
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

/** Exact campaign level most recently launched. */
export function getLastCampaign(): number {
  const n = Number.parseInt(read(K_LAST) ?? '', 10);
  return Number.isFinite(n) && n >= 0 ? n : getUnlocked();
}

export function setLastCampaign(index: number): void { write(K_LAST, String(Math.max(0, Math.floor(index)))); }

/** Whether returning-player progress exists; legacy unlocked/stars keys count. */
export function hasCampaignProgress(): boolean {
  return getUnlocked() > 0 || getLastCampaign() > 0 || getStars().some((stars) => stars > 0);
}

/** Reset campaign-only progression while preserving global and mode bests. */
export function resetCampaign(): void {
  remove(K_UNLOCKED);
  remove(K_STARS);
  remove(K_LAST);
}

export function getLastMode(): string { return read(K_MODE) ?? 'campaign'; }
export function setLastMode(mode: string): void { write(K_MODE, mode); }

/** Best score for a non-campaign mode. */
export function getModeBest(mode: 'endless' | 'time'): number {
  return readNumber(mode === 'endless' ? K_ENDLESS_BEST : K_TIME_BEST);
}

export function setModeBest(mode: 'endless' | 'time', score: number): void {
  const key = mode === 'endless' ? K_ENDLESS_BEST : K_TIME_BEST;
  if (score > readNumber(key)) write(key, String(score));
}

/** Today's saved Daily best (zero until today's first completed run). */
export function getDailyBest(dateKey: string): number {
  return read(K_DAILY_DATE) === dateKey ? readNumber(K_DAILY_BEST) : 0;
}

export function getDailyStreak(): number { return readNumber(K_DAILY_STREAK); }

/** Bank a Daily score and advance the streak at most once per UTC day. */
export function recordDailyResult(dateKey: string, score: number): { best: number; streak: number } {
  const previousDate = read(K_DAILY_DATE);
  const previousBest = previousDate === dateKey ? readNumber(K_DAILY_BEST) : 0;
  const best = Math.max(previousBest, score);
  write(K_DAILY_DATE, dateKey);
  write(K_DAILY_BEST, String(best));

  let streak = getDailyStreak();
  const lastCompleted = read(K_DAILY_LAST);
  if (lastCompleted !== dateKey) {
    const yesterday = new Date(`${dateKey}T00:00:00.000Z`);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    streak = lastCompleted === yesterday.toISOString().slice(0, 10) ? Math.max(1, streak + 1) : 1;
    write(K_DAILY_STREAK, String(streak));
    write(K_DAILY_LAST, dateKey);
  }
  return { best, streak };
}
