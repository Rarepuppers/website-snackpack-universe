import { LocalSaveStore, type StorageLike } from "./LocalSaveStore";

export interface DesktopSaveBridge extends StorageLike {}

export interface SaveStorageHost {
  readonly desktopSave?: DesktopSaveBridge;
  readonly localStorage?: StorageLike;
}

export function storageForHost(host: SaveStorageHost | null): StorageLike | null {
  if (!host) return null;
  if (host.desktopSave
    && typeof host.desktopSave.getItem === "function"
    && typeof host.desktopSave.setItem === "function") {
    return host.desktopSave;
  }
  try {
    return host.localStorage ?? null;
  } catch {
    return null;
  }
}

export function createLocalSaveStore(host: SaveStorageHost | null): LocalSaveStore {
  return new LocalSaveStore(storageForHost(host));
}
