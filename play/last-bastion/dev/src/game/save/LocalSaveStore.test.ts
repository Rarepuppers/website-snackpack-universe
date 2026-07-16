import { describe, expect, it } from "vitest";
import { DEFAULT_SAVE, LocalSaveStore, SAVE_STORAGE_KEY } from "./LocalSaveStore";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    dump: () => data,
  };
}

describe("LocalSaveStore", () => {
  it("returns defaults when storage is empty or unavailable", () => {
    expect(new LocalSaveStore(fakeStorage()).load()).toEqual(DEFAULT_SAVE);
    expect(new LocalSaveStore(null).load()).toEqual(DEFAULT_SAVE);
  });

  it("returns defaults for corrupt or foreign-version payloads", () => {
    const corrupt = new LocalSaveStore(fakeStorage({ [SAVE_STORAGE_KEY]: "{not json" }));
    expect(corrupt.load()).toEqual(DEFAULT_SAVE);

    const foreign = new LocalSaveStore(fakeStorage({
      [SAVE_STORAGE_KEY]: JSON.stringify({ version: 99, settings: { soundEnabled: false } }),
    }));
    expect(foreign.load()).toEqual(DEFAULT_SAVE);
  });

  it("persists settings updates across store instances", () => {
    const storage = fakeStorage();
    new LocalSaveStore(storage).updateSettings({ screenShakeEnabled: false });

    const reloaded = new LocalSaveStore(storage).load();
    expect(reloaded.settings.screenShakeEnabled).toBe(false);
    expect(reloaded.settings.soundEnabled).toBe(true);
  });

  it("records run outcomes and keeps the best wave reached", () => {
    const storage = fakeStorage();
    const store = new LocalSaveStore(storage);

    store.recordRunEnd({ victory: false, waveReached: 3 });
    store.recordRunEnd({ victory: true, waveReached: 5 });
    const after = store.recordRunEnd({ victory: false, waveReached: 2 });

    expect(after.progress.runsFinished).toBe(3);
    expect(after.progress.victories).toBe(1);
    expect(after.progress.bestWaveReached).toBe(5);

    const reloaded = new LocalSaveStore(storage).load();
    expect(reloaded.progress.bestWaveReached).toBe(5);
  });

  it("sanitizes malformed numeric progress fields", () => {
    const storage = fakeStorage({
      [SAVE_STORAGE_KEY]: JSON.stringify({
        version: 1,
        settings: { screenShakeEnabled: "yes" },
        progress: { runsFinished: -4, victories: Number.NaN, bestWaveReached: 3.9 },
      }),
    });
    const loaded = new LocalSaveStore(storage).load();
    expect(loaded.settings.screenShakeEnabled).toBe(true);
    expect(loaded.progress.runsFinished).toBe(0);
    expect(loaded.progress.victories).toBe(0);
    expect(loaded.progress.bestWaveReached).toBe(3);
  });
});
