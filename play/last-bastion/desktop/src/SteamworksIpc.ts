import { ipcMain } from "electron";
import { STEAMWORKS_CHANNELS, type AchievementId } from "./BridgeContract.js";
import { assertAchievementId, assertCloudContents, assertCloudPath } from "./BridgeValidation.js";

export interface SteamworksHost {
  getAchievement(id: AchievementId): boolean | Promise<boolean>;
  setAchievement(id: AchievementId): void | Promise<void>;
  storeStats(): void | Promise<void>;
  readCloudFile(path: string): string | null | Promise<string | null>;
  writeCloudFile(path: string, contents: string): void | Promise<void>;
}

function requireHost(host: SteamworksHost | null): SteamworksHost {
  if (!host) throw new Error("Steamworks is unavailable");
  return host;
}

export function registerSteamworksIpc(host: SteamworksHost | null): void {
  ipcMain.handle(STEAMWORKS_CHANNELS.getAchievement, (_event, id: unknown) => {
    assertAchievementId(id);
    return requireHost(host).getAchievement(id);
  });
  ipcMain.handle(STEAMWORKS_CHANNELS.setAchievement, (_event, id: unknown) => {
    assertAchievementId(id);
    return requireHost(host).setAchievement(id);
  });
  ipcMain.handle(STEAMWORKS_CHANNELS.storeStats, () => requireHost(host).storeStats());
  ipcMain.handle(STEAMWORKS_CHANNELS.readCloudFile, (_event, path: unknown) => {
    assertCloudPath(path);
    return requireHost(host).readCloudFile(path);
  });
  ipcMain.handle(STEAMWORKS_CHANNELS.writeCloudFile, (_event, path: unknown, contents: unknown) => {
    assertCloudPath(path);
    assertCloudContents(contents);
    return requireHost(host).writeCloudFile(path, contents);
  });
}
