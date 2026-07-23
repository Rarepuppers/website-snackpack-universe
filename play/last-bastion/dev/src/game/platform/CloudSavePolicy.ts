import { normalizeControlBindings } from "../input/ControlBindings";
import type { BestiaryEntry, SaveData } from "../save/LocalSaveStore";

export interface CloudSaveEnvelope {
  readonly deviceId: string;
  readonly revision: number;
  readonly updatedAtMs: number;
  readonly save: SaveData;
}

export interface CloudSaveResolution {
  readonly save: SaveData;
  readonly preference: "local" | "remote";
  readonly divergentActiveRuns: boolean;
}

/**
 * Monotonic progress merges by maxima to avoid double-counting the same run.
 * User preferences and the active run come from the deterministic newer side.
 */
export function resolveCloudSaveConflict(local: CloudSaveEnvelope, remote: CloudSaveEnvelope): CloudSaveResolution {
  if (local.save.version !== 9 || remote.save.version !== 9) throw new Error("Cloud save schema is unsupported");
  const remotePreferred = compareEnvelope(remote, local) > 0;
  const preferred = remotePreferred ? remote : local;
  const secondary = remotePreferred ? local : remote;
  const bestiary = mergeBestiary(local.save.progress.bestiary, remote.save.progress.bestiary);
  const divergentActiveRuns = Boolean(
    local.save.expedition && remote.save.expedition
    && (local.save.expedition.mapSeed !== remote.save.expedition.mapSeed
      || local.save.expedition.currentNodeId !== remote.save.expedition.currentNodeId),
  );
  return {
    preference: remotePreferred ? "remote" : "local",
    divergentActiveRuns,
    save: {
      version: 9,
      settings: { ...preferred.save.settings },
      controls: normalizeControlBindings(preferred.save.controls),
      progress: {
        runsFinished: Math.max(local.save.progress.runsFinished, remote.save.progress.runsFinished),
        victories: Math.max(local.save.progress.victories, remote.save.progress.victories),
        bestWaveReached: Math.max(local.save.progress.bestWaveReached, remote.save.progress.bestWaveReached),
        nodesCleared: Math.max(local.save.progress.nodesCleared, remote.save.progress.nodesCleared),
        bestNodesCleared: Math.max(local.save.progress.bestNodesCleared, remote.save.progress.bestNodesCleared),
        totalKills: Math.max(local.save.progress.totalKills, remote.save.progress.totalKills),
        totalDamage: Math.max(local.save.progress.totalDamage, remote.save.progress.totalDamage),
        totalScrapEarned: Math.max(local.save.progress.totalScrapEarned, remote.save.progress.totalScrapEarned),
        bestiary,
      },
      expedition: preferred.save.expedition ?? secondary.save.expedition,
      selectedPerkId: preferred.save.selectedPerkId,
      selectedHeroId: preferred.save.selectedHeroId,
      lastRunSummary: preferred.save.lastRunSummary ?? secondary.save.lastRunSummary,
    },
  };
}

function compareEnvelope(left: CloudSaveEnvelope, right: CloudSaveEnvelope): number {
  if (left.revision !== right.revision) return left.revision - right.revision;
  if (left.updatedAtMs !== right.updatedAtMs) return left.updatedAtMs - right.updatedAtMs;
  return left.deviceId.localeCompare(right.deviceId);
}

function mergeBestiary(
  left: Readonly<Record<string, BestiaryEntry>>,
  right: Readonly<Record<string, BestiaryEntry>>,
): Record<string, BestiaryEntry> {
  const merged: Record<string, BestiaryEntry> = {};
  for (const key of new Set([...Object.keys(left), ...Object.keys(right)])) {
    merged[key] = {
      seen: Math.max(left[key]?.seen ?? 0, right[key]?.seen ?? 0),
      kills: Math.max(left[key]?.kills ?? 0, right[key]?.kills ?? 0),
    };
  }
  return merged;
}
