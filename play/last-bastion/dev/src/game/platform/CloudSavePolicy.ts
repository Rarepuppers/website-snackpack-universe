import { normalizeControlBindings } from "../input/ControlBindings";
import { SAVE_SCHEMA_VERSION, type BestiaryEntry, type SaveData } from "../save/LocalSaveStore";
import type { ThreatTier } from "../expedition/ThreatTier";

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
  if (local.save.version !== SAVE_SCHEMA_VERSION || remote.save.version !== SAVE_SCHEMA_VERSION) {
    throw new Error("Cloud save schema is unsupported");
  }
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
      version: SAVE_SCHEMA_VERSION,
      settings: mergeSettingsForDevice(local.save.settings, preferred.save.settings),
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
        threatTierBestNodes: mergeTierCounts(
          local.save.progress.threatTierBestNodes,
          remote.save.progress.threatTierBestNodes,
        ),
        threatTierVictories: mergeTierCounts(
          local.save.progress.threatTierVictories,
          remote.save.progress.threatTierVictories,
        ),
      },
      expedition: preferred.save.expedition ?? secondary.save.expedition,
      selectedPerkId: preferred.save.selectedPerkId,
      selectedHeroId: preferred.save.selectedHeroId,
      selectedThreatTier: preferred.save.selectedThreatTier,
      lastRunSummary: preferred.save.lastRunSummary ?? secondary.save.lastRunSummary,
    },
  };
}

function mergeTierCounts(
  left: Readonly<Record<ThreatTier, number>>,
  right: Readonly<Record<ThreatTier, number>>,
): Record<ThreatTier, number> {
  return {
    0: Math.max(left[0], right[0]),
    1: Math.max(left[1], right[1]),
    2: Math.max(left[2], right[2]),
  };
}

/**
 * Cloud progress/preferences may follow the newer revision, but monitor and
 * presentation choices belong to the device performing the reconciliation.
 * This prevents a Deck, laptop, or ultrawide desktop from inheriting another
 * machine's monitor id, fullscreen state, frame cap, or calibration.
 */
function mergeSettingsForDevice(
  local: SaveData["settings"],
  preferred: SaveData["settings"],
): SaveData["settings"] {
  return {
    ...preferred,
    displaySizePercent: local.displaySizePercent,
    presentationMode: local.presentationMode,
    fullscreenMode: local.fullscreenMode,
    selectedDisplayId: local.selectedDisplayId,
    frameCap: local.frameCap,
    brightness: local.brightness,
    gamma: local.gamma,
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
