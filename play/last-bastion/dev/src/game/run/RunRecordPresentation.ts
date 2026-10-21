import { heroDefinition, isHeroId } from "../hero/HeroCatalog";
import type { RunSummary } from "./RunSummary";
import type { RunHistoryEntry } from "./RunHistory";
import { localDayKey } from "./LocalDayKey";

export function historyRecordPresentation(entry: RunHistoryEntry): { outcome: string; progress: string; date: string; detail: string } {
  const summary = entry.summary;
  const record = runRecordPresentation(summary);
  return {
    outcome: summary.outcome.toUpperCase(),
    progress: summary.mode === "expedition"
      ? `${summary.nodesCleared} NODES${summary.threatTier === null ? "" : `  T${summary.threatTier}`}`
      : `WAVE ${summary.waveReached}`,
    date: entry.completedAtMs > 0 ? localDayKey(entry.completedAtMs) : "LEGACY SAVE",
    detail: `${record.heroLabel}  •  ${summary.kills} KILLS  •  ${summary.commandMarksEarned} MARKS  •  ${record.balanceSignal}`,
  };
}

export interface RunRecordPresentation {
  readonly heroLabel: string;
  readonly balanceSignal: string;
}

/**
 * Keeps the compact Records rows useful for observed balance tests. The save
 * already owns detailed damage telemetry; this turns the strongest signal into
 * something a tester can transcribe without opening a debug route.
 */
export function runRecordPresentation(summary: RunSummary): RunRecordPresentation {
  const heroLabel = isHeroId(summary.heroId)
    ? heroDefinition(summary.heroId).displayName.toUpperCase()
    : readableId(summary.heroId);

  if (summary.outcome === "defeat" && summary.defeatCause) {
    return { heroLabel, balanceSignal: `DOWNED BY ${readableId(summary.defeatCause)}` };
  }

  const threat = largestEntry(summary.damageTakenBySource);
  if (threat) {
    return {
      heroLabel,
      balanceSignal: `TOP THREAT ${readableId(threat.id)} ${Math.round(threat.value)}`,
    };
  }

  const weapon = largestEntry(summary.damageByWeapon);
  if (weapon) {
    return {
      heroLabel,
      balanceSignal: `TOP WEAPON ${readableId(weapon.id)} ${Math.round(weapon.value)}`,
    };
  }

  return { heroLabel, balanceSignal: "NO DAMAGE RECORDED" };
}

function largestEntry(values: Readonly<Record<string, number>>): { id: string; value: number } | null {
  let result: { id: string; value: number } | null = null;
  for (const [id, value] of Object.entries(values)) {
    if (!Number.isFinite(value) || value <= 0) continue;
    if (result === null || value > result.value || (value === result.value && id.localeCompare(result.id) < 0)) {
      result = { id, value };
    }
  }
  return result;
}

function readableId(value: string): string {
  const readable = value.trim().replace(/[-_]+/g, " ").replace(/\s+/g, " ").toUpperCase();
  return readable || "UNKNOWN";
}
