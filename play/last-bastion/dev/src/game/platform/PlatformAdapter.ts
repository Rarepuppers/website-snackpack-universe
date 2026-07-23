import { ACHIEVEMENT_IDS, type AchievementId, type AchievementUnlockEvent } from "./PlatformProgress";
import type { CloudSaveEnvelope } from "./CloudSavePolicy";

export const CLOUD_SAVE_SLOT = "last-bastion-save-v7.json";

export interface PlatformAdapter {
  readonly kind: "browser" | "steam";
  unlockedAchievementIds(): Promise<readonly AchievementId[]>;
  unlockAchievement(id: AchievementId): Promise<void>;
  commitAchievements(): Promise<void>;
  readCloudSave(): Promise<CloudSaveEnvelope | null>;
  writeCloudSave(envelope: CloudSaveEnvelope): Promise<void>;
}

/** Minimal surface that a desktop shell exposes after initializing Steamworks. */
export interface SteamworksBridge {
  getAchievement(id: AchievementId): boolean | Promise<boolean>;
  setAchievement(id: AchievementId): void | Promise<void>;
  storeStats(): void | Promise<void>;
  readCloudFile(path: string): string | null | Promise<string | null>;
  writeCloudFile(path: string, contents: string): void | Promise<void>;
}

export interface AchievementSyncResult {
  readonly acknowledged: readonly AchievementId[];
  readonly pending: readonly AchievementId[];
}

export function createSteamPlatformAdapter(bridge: SteamworksBridge): PlatformAdapter {
  return {
    kind: "steam",
    async unlockedAchievementIds() {
      const unlocked: AchievementId[] = [];
      for (const id of ACHIEVEMENT_IDS) if (await bridge.getAchievement(id)) unlocked.push(id);
      return unlocked;
    },
    async unlockAchievement(id) { await bridge.setAchievement(id); },
    async commitAchievements() { await bridge.storeStats(); },
    async readCloudSave() {
      const serialized = await bridge.readCloudFile(CLOUD_SAVE_SLOT);
      if (serialized === null) return null;
      return parseCloudEnvelope(serialized);
    },
    async writeCloudSave(envelope) {
      assertCloudEnvelope(envelope);
      await bridge.writeCloudFile(CLOUD_SAVE_SLOT, JSON.stringify(envelope));
    },
  };
}

/**
 * Unlock calls are idempotent. Events are acknowledged only after Steam accepts
 * the batch stats commit, so a failed commit remains safe to retry next boot.
 */
export async function synchronizeAchievementEvents(
  adapter: PlatformAdapter,
  events: readonly AchievementUnlockEvent[],
): Promise<AchievementSyncResult> {
  const alreadyUnlocked = new Set(await adapter.unlockedAchievementIds());
  const pending = [...new Set(events.map((event) => event.id))]
    .filter((id) => !alreadyUnlocked.has(id));
  if (pending.length === 0) return { acknowledged: [], pending: [] };
  try {
    for (const id of pending) await adapter.unlockAchievement(id);
    await adapter.commitAchievements();
    return { acknowledged: pending, pending: [] };
  } catch {
    return { acknowledged: [], pending };
  }
}

export function parseCloudEnvelope(serialized: string): CloudSaveEnvelope {
  let value: unknown;
  try {
    value = JSON.parse(serialized);
  } catch {
    throw new Error("Cloud save is not valid JSON");
  }
  assertCloudEnvelope(value);
  return value;
}

function assertCloudEnvelope(value: unknown): asserts value is CloudSaveEnvelope {
  if (!value || typeof value !== "object") throw new Error("Cloud save envelope is invalid");
  const envelope = value as Partial<CloudSaveEnvelope>;
  if (typeof envelope.deviceId !== "string" || envelope.deviceId.length === 0
    || !Number.isSafeInteger(envelope.revision) || (envelope.revision ?? -1) < 0
    || !Number.isFinite(envelope.updatedAtMs) || (envelope.updatedAtMs ?? -1) < 0
    || !envelope.save || envelope.save.version !== 9) {
    throw new Error("Cloud save envelope is invalid");
  }
}
