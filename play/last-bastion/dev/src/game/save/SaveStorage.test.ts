import { describe, expect, it, vi } from "vitest";
import { SAVE_STORAGE_KEY } from "./LocalSaveStore";
import { createLocalSaveStore, storageForHost } from "./SaveStorage";

describe("save storage host selection", () => {
  it("prefers the desktop bridge over browser localStorage", () => {
    const desktopSave = { getItem: vi.fn(() => null), setItem: vi.fn() };
    const localStorage = { getItem: vi.fn(() => null), setItem: vi.fn() };
    expect(storageForHost({ desktopSave, localStorage })).toBe(desktopSave);
  });

  it("retains browser localStorage when no desktop bridge exists", () => {
    const localStorage = { getItem: vi.fn(() => null), setItem: vi.fn() };
    expect(storageForHost({ localStorage })).toBe(localStorage);
  });

  it("constructs LocalSaveStore against the selected synchronous bridge", () => {
    const values = new Map<string, string>();
    const desktopSave = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
    };
    const store = createLocalSaveStore({ desktopSave });
    store.updateSettings({ brightness: 1.2 });
    expect(JSON.parse(values.get(SAVE_STORAGE_KEY)!).settings.brightness).toBe(1.2);
  });
});
