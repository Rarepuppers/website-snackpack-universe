import type { AchievementId } from "./BridgeContract.js";
import type { SteamworksHost } from "./SteamworksIpc.js";

export interface SteamworksClient {
  achievement: {
    isActivated(id: string): boolean;
    activate(id: string): boolean;
  };
  stats: {
    store(): boolean;
  };
  cloud: {
    fileExists(path: string): boolean;
    readFile(path: string): string;
    writeFile(path: string, contents: string): boolean;
  };
}

interface SteamworksModule {
  init(appId?: number): SteamworksClient;
  electronEnableSteamOverlay(disableEachFrameInvalidation?: boolean): void;
}

export function readSteamAppId(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new TypeError("LAST_BASTION_STEAM_APP_ID must be a positive integer");
  }
  return parsed;
}

export function createSteamworksHost(client: SteamworksClient): SteamworksHost {
  return Object.freeze({
    getAchievement: (id: AchievementId) => client.achievement.isActivated(id),
    setAchievement: (id: AchievementId) => {
      if (!client.achievement.activate(id)) throw new Error(`Steam rejected achievement ${id}`);
    },
    storeStats: () => {
      if (!client.stats.store()) throw new Error("Steam rejected the stats commit");
    },
    readCloudFile: (path: string) => client.cloud.fileExists(path) ? client.cloud.readFile(path) : null,
    writeCloudFile: (path: string, contents: string) => {
      if (!client.cloud.writeFile(path, contents)) throw new Error(`Steam rejected cloud write ${path}`);
    },
  });
}

export async function initializeSteamworksHost(
  appIdValue = process.env.LAST_BASTION_STEAM_APP_ID,
): Promise<SteamworksHost | null> {
  try {
    const appId = readSteamAppId(appIdValue);
    const imported = await import("steamworks.js") as unknown as SteamworksModule & { default?: SteamworksModule };
    const steamworks = imported.default ?? imported;
    const client = steamworks.init(appId);
    steamworks.electronEnableSteamOverlay();
    return createSteamworksHost(client);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.warn(`[Last Bastion] Steamworks unavailable; using browser platform: ${detail}`);
    return null;
  }
}
