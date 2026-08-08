import { contextBridge, ipcRenderer } from "electron";
import {
  DESKTOP_SAVE_CHANNELS,
  DESKTOP_DISPLAY_CHANNELS,
  STEAMWORKS_CHANNELS,
  type AchievementId,
  type DesktopSaveBridge,
  type DesktopDisplayBridge,
  type DesktopDisplayRequest,
  type SteamworksBridge,
} from "./BridgeContract.js";

interface SyncResult<T> {
  readonly ok: boolean;
  readonly value?: T;
  readonly error?: string;
}

function unwrapSyncResult<T>(result: SyncResult<T>): T {
  if (!result?.ok) throw new Error(result?.error || "Desktop save operation failed");
  return result.value as T;
}

const steamworksBridge: SteamworksBridge = Object.freeze({
  getControllerType: () => ipcRenderer.invoke(STEAMWORKS_CHANNELS.getControllerType) as Promise<string | null>,
  getAchievement: (id: AchievementId) => ipcRenderer.invoke(STEAMWORKS_CHANNELS.getAchievement, id) as Promise<boolean>,
  setAchievement: (id: AchievementId) => ipcRenderer.invoke(STEAMWORKS_CHANNELS.setAchievement, id) as Promise<void>,
  storeStats: () => ipcRenderer.invoke(STEAMWORKS_CHANNELS.storeStats) as Promise<void>,
  readCloudFile: (path: string) => ipcRenderer.invoke(STEAMWORKS_CHANNELS.readCloudFile, path) as Promise<string | null>,
  writeCloudFile: (path: string, contents: string) => ipcRenderer.invoke(STEAMWORKS_CHANNELS.writeCloudFile, path, contents) as Promise<void>,
});

if (ipcRenderer.sendSync(STEAMWORKS_CHANNELS.isAvailable) === true) {
  contextBridge.exposeInMainWorld("steamworks", steamworksBridge);
}

const desktopSaveBridge: DesktopSaveBridge = Object.freeze({
  getItem: (key: string) => unwrapSyncResult<string | null>(
    ipcRenderer.sendSync(DESKTOP_SAVE_CHANNELS.getItem, key) as SyncResult<string | null>,
  ),
  setItem: (key: string, value: string) => {
    unwrapSyncResult<void>(
      ipcRenderer.sendSync(DESKTOP_SAVE_CHANNELS.setItem, key, value) as SyncResult<void>,
    );
  },
});

contextBridge.exposeInMainWorld("desktopSave", desktopSaveBridge);

const desktopDisplayBridge: DesktopDisplayBridge = Object.freeze({
  getSnapshot: () => ipcRenderer.invoke(DESKTOP_DISPLAY_CHANNELS.getSnapshot) as Promise<Awaited<ReturnType<DesktopDisplayBridge["getSnapshot"]>>>,
  apply: (request: DesktopDisplayRequest) => ipcRenderer.invoke(DESKTOP_DISPLAY_CHANNELS.apply, request) as Promise<Awaited<ReturnType<DesktopDisplayBridge["apply"]>>>,
});

contextBridge.exposeInMainWorld("desktopDisplay", desktopDisplayBridge);
