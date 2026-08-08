import { ipcMain } from "electron";
import { DESKTOP_SAVE_CHANNELS } from "./BridgeContract.js";
import { assertLocalSaveKey, assertLocalSaveValue, type AtomicSaveStorage } from "./AtomicSaveStorage.js";

interface SyncResult<T> {
  readonly ok: boolean;
  readonly value?: T;
  readonly error?: string;
}

function failure(error: unknown): SyncResult<never> {
  return { ok: false, error: error instanceof Error ? error.message : String(error) };
}

export function registerDesktopSaveIpc(storage: AtomicSaveStorage): void {
  ipcMain.on(DESKTOP_SAVE_CHANNELS.getItem, (event, key: unknown) => {
    try {
      assertLocalSaveKey(key);
      event.returnValue = { ok: true, value: storage.getItem(key) } satisfies SyncResult<string | null>;
    } catch (error) {
      event.returnValue = failure(error);
    }
  });
  ipcMain.on(DESKTOP_SAVE_CHANNELS.setItem, (event, key: unknown, value: unknown) => {
    try {
      assertLocalSaveKey(key);
      assertLocalSaveValue(value);
      storage.setItem(key, value);
      event.returnValue = { ok: true } satisfies SyncResult<void>;
    } catch (error) {
      event.returnValue = failure(error);
    }
  });
}
