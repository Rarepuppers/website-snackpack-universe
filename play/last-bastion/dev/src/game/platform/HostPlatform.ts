import {
  createSteamPlatformAdapter,
  type PlatformAdapter,
  type SteamworksBridge,
} from "./PlatformAdapter";

export interface SteamworksWindow {
  readonly steamworks?: SteamworksBridge;
}

export function createBrowserPlatformAdapter(): PlatformAdapter {
  return {
    kind: "browser",
    async unlockedAchievementIds() { return []; },
    async unlockAchievement() { throw new Error("Steam achievements are unavailable in the browser"); },
    async commitAchievements() { return; },
    async readCloudSave() { return null; },
    async writeCloudSave() { return; },
  };
}

export function createPlatformAdapterForHost(host: SteamworksWindow): PlatformAdapter {
  return host.steamworks
    ? createSteamPlatformAdapter(host.steamworks)
    : createBrowserPlatformAdapter();
}
