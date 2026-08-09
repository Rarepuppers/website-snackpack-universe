import { createRunSummary, type RunSummary } from "./RunSummary";

export const MAX_RUN_HISTORY = 20;
const MAX_JAVASCRIPT_DATE_MS = 8_640_000_000_000_000;

export interface RunHistoryEntry {
  /** Stable across cloud reconciliation; includes a content fingerprint. */
  readonly id: string;
  readonly completedAtMs: number;
  readonly summary: RunSummary;
}

export function createRunHistoryEntry(
  summary: RunSummary,
  completedAtMs: number,
  sequence: number,
): RunHistoryEntry {
  const normalized = createRunSummary(summary);
  const timestamp = normalizeCompletedAtMs(completedAtMs);
  const ordinal = finiteCount(sequence);
  return {
    id: `run-${timestamp}-${ordinal}-${fingerprint(normalized)}`,
    completedAtMs: timestamp,
    summary: normalized,
  };
}

export function normalizeCompletedAtMs(value: number): number {
  return Math.min(MAX_JAVASCRIPT_DATE_MS, finiteCount(value));
}

export function prependRunHistory(
  history: readonly RunHistoryEntry[],
  entry: RunHistoryEntry,
): RunHistoryEntry[] {
  return mergeRunHistories([entry], history);
}

/** Union divergent device histories, newest first, without duplicating synced runs. */
export function mergeRunHistories(
  left: readonly RunHistoryEntry[],
  right: readonly RunHistoryEntry[],
): RunHistoryEntry[] {
  const byId = new Map<string, RunHistoryEntry>();
  for (const entry of [...left, ...right]) {
    if (!byId.has(entry.id)) byId.set(entry.id, cloneRunHistoryEntry(entry));
  }
  return [...byId.values()]
    .sort((a, b) => b.completedAtMs - a.completedAtMs || b.id.localeCompare(a.id))
    .slice(0, MAX_RUN_HISTORY);
}

export function cloneRunHistoryEntry(entry: RunHistoryEntry): RunHistoryEntry {
  return {
    id: entry.id,
    completedAtMs: entry.completedAtMs,
    summary: createRunSummary(entry.summary),
  };
}

function finiteCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

/** Small deterministic FNV-1a fingerprint; identity, not security. */
function fingerprint(summary: RunSummary): string {
  const value = JSON.stringify(summary);
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}
