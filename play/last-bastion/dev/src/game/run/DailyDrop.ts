/**
 * Daily Drop: one seeded Quick Drop per local calendar day.
 *
 * Every player who starts the Daily on the same local date gets the same combat
 * seed, so the same wave composition — a shared challenge without a server.
 * Days are the player's own (`localDayKey`), never UTC: the Daily changes at
 * the player's midnight, which is the only boundary a player would expect.
 *
 * Results are kept per day in the save as a best-of record. Every attempt on
 * the day counts and the best one is kept; a streak is derived, never stored,
 * so it cannot drift from the records it summarises.
 */

export interface DailyRecord {
  /** Furthest wave reached on that day's best attempt. */
  readonly bestWave: number;
  /** Kills on that best attempt; breaks ties between equal waves. */
  readonly bestKills: number;
  /** True once any attempt that day survived every wave. */
  readonly cleared: boolean;
  readonly attempts: number;
}

/** Waves in a Quick Drop, and so in a Daily Drop. CombatSimulation reads this too. */
export const QUICK_DROP_WAVES = 10;

/** Old days are pruned so the save cannot grow without bound. */
export const DAILY_HISTORY_LIMIT = 60;

const DAY_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isDailyKey(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = DAY_KEY_PATTERN.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/**
 * FNV-1a over the day key. Stable across builds and platforms, never zero
 * (zero is the "no seed" sentinel elsewhere), and unrelated to the clock, so a
 * replayed Daily from a copied link is the same fight.
 */
export function dailySeed(dayKey: string): number {
  let hash = 0x811c9dc5;
  const salted = `last-bastion-daily:${dayKey}`;
  for (let index = 0; index < salted.length; index += 1) {
    hash ^= salted.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash === 0 ? 1 : hash;
}

/** The local day before `dayKey`. Built from local date parts so DST cannot skip a day. */
export function previousDailyKey(dayKey: string): string {
  const match = DAY_KEY_PATTERN.exec(dayKey);
  if (!match) return "";
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]) - 1);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Consecutive played days ending today — or ending yesterday when today has
 * not been played yet, so a streak does not read as broken all morning.
 */
export function dailyStreak(records: Readonly<Record<string, DailyRecord>>, todayKey: string): number {
  let cursor = records[todayKey] ? todayKey : previousDailyKey(todayKey);
  let streak = 0;
  while (cursor && records[cursor]) {
    streak += 1;
    cursor = previousDailyKey(cursor);
  }
  return streak;
}

export function recordDailyAttempt(
  records: Readonly<Record<string, DailyRecord>>,
  dayKey: string,
  attempt: { waveReached: number; kills: number; victory: boolean },
): Record<string, DailyRecord> {
  if (!isDailyKey(dayKey)) return { ...records };
  const previous = records[dayKey];
  const wave = Math.max(0, Math.floor(attempt.waveReached));
  const kills = Math.max(0, Math.floor(attempt.kills));
  const better = !previous
    || wave > previous.bestWave
    || (wave === previous.bestWave && kills > previous.bestKills);
  const next: DailyRecord = {
    bestWave: better ? wave : previous.bestWave,
    bestKills: better ? kills : previous.bestKills,
    cleared: (previous?.cleared ?? false) || attempt.victory,
    attempts: (previous?.attempts ?? 0) + 1,
  };
  return pruneDailyRecords({ ...records, [dayKey]: next });
}

export function pruneDailyRecords(records: Readonly<Record<string, DailyRecord>>): Record<string, DailyRecord> {
  const keys = Object.keys(records).filter(isDailyKey).sort().slice(-DAILY_HISTORY_LIMIT);
  const pruned: Record<string, DailyRecord> = {};
  for (const key of keys) pruned[key] = { ...records[key]! };
  return pruned;
}

/**
 * Cloud-save merge: the union of days, keeping the better result per day. Attempts
 * take the larger count rather than the sum — both sides may hold the same attempts.
 */
export function mergeDailyRecords(
  left: Readonly<Record<string, DailyRecord>>,
  right: Readonly<Record<string, DailyRecord>>,
): Record<string, DailyRecord> {
  const merged: Record<string, DailyRecord> = { ...left };
  for (const [key, theirs] of Object.entries(right)) {
    const ours = merged[key];
    if (!ours) {
      merged[key] = { ...theirs };
      continue;
    }
    const theirsBetter = theirs.bestWave > ours.bestWave
      || (theirs.bestWave === ours.bestWave && theirs.bestKills > ours.bestKills);
    const best = theirsBetter ? theirs : ours;
    merged[key] = {
      bestWave: best.bestWave,
      bestKills: best.bestKills,
      cleared: ours.cleared || theirs.cleared,
      attempts: Math.max(ours.attempts, theirs.attempts),
    };
  }
  return pruneDailyRecords(merged);
}

/** Saves written before the Daily existed have no record map; that is an empty history, not an error. */
export function readDailyRecords(value: unknown): Record<string, DailyRecord> {
  if (typeof value !== "object" || value === null) return {};
  const records: Record<string, DailyRecord> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (!isDailyKey(key) || typeof entry !== "object" || entry === null) continue;
    const candidate = entry as Partial<DailyRecord>;
    const attempts = readCount(candidate.attempts);
    if (attempts === 0) continue;
    records[key] = {
      bestWave: readCount(candidate.bestWave),
      bestKills: readCount(candidate.bestKills),
      cleared: candidate.cleared === true,
      attempts,
    };
  }
  return pruneDailyRecords(records);
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** "11 OCT" — short enough for a menu card and a debrief header. */
export function dailyLabel(dayKey: string): string {
  const match = DAY_KEY_PATTERN.exec(dayKey);
  if (!match) return "";
  return `${Number(match[3])} ${MONTHS[Number(match[2]) - 1] ?? ""}`;
}

export const LAST_BASTION_PUBLIC_URL = "https://www.snackpackuniverse.com/play/last-bastion/";

/** The line a player pastes to a friend. Plain text; no emoji, no tracking parameters. */
export function dailyShareText(input: {
  dayKey: string;
  waveReached: number;
  totalWaves: number;
  kills: number;
  heroName: string;
  cleared: boolean;
  streak: number;
}): string {
  const result = input.cleared
    ? `cleared all ${input.totalWaves} waves`
    : `reached wave ${input.waveReached}/${input.totalWaves}`;
  const streak = input.streak > 1 ? ` Streak: ${input.streak} days.` : "";
  return `Last Bastion Daily Drop, ${dailyLabel(input.dayKey)}: ${result} with ${input.kills} ${input.kills === 1 ? "kill" : "kills"} as the ${input.heroName}.${streak} ${LAST_BASTION_PUBLIC_URL}`;
}

function readCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
