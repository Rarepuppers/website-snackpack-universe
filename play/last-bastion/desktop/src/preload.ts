import { contextBridge, ipcRenderer } from "electron";
import { STEAMWORKS_CHANNELS, type AchievementId, type SteamworksBridge } from "./BridgeContract.js";

const steamworksBridge: SteamworksBridge = Object.freeze({
  getAchievement: (id: AchievementId) => ipcRenderer.invoke(STEAMWORKS_CHANNELS.getAchievement, id) as Promise<boolean>,
  setAchievement: (id: AchievementId) => ipcRenderer.invoke(STEAMWORKS_CHANNELS.setAchievement, id) as Promise<void>,
  storeStats: () => ipcRenderer.invoke(STEAMWORKS_CHANNELS.storeStats) as Promise<void>,
  readCloudFile: (path: string) => ipcRenderer.invoke(STEAMWORKS_CHANNELS.readCloudFile, path) as Promise<string | null>,
  writeCloudFile: (path: string, contents: string) => ipcRenderer.invoke(STEAMWORKS_CHANNELS.writeCloudFile, path, contents) as Promise<void>,
});

contextBridge.exposeInMainWorld("steamworks", steamworksBridge);
