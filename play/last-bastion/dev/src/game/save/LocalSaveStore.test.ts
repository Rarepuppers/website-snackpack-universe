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
    // Untouched settings keep their defaults.
    expect(reloaded.settings.damageNumbersEnabled).toBe(true);
  });

  it("defaults damage numbers on and lets them be turned off", () => {
    expect(DEFAULT_SAVE.settings.damageNumbersEnabled).toBe(true);
    const storage = fakeStorage();
    new LocalSaveStore(storage).updateSettings({ damageNumbersEnabled: false });
    expect(new LocalSaveStore(storage).load().settings.damageNumbersEnabled).toBe(false);
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

  it("accumulates dex sightings and kills across batches and instances", () => {
    const storage = fakeStorage();
    const store = new LocalSaveStore(storage);

    store.recordBestiary({ scuttler: { seen: 8, kills: 6 }, "brain-blob": { seen: 2 } });
    store.recordBestiary({ scuttler: { seen: 4, kills: 5 } });

    const progress = store.load().progress;
    expect(progress.bestiary.scuttler).toEqual({ seen: 12, kills: 11 });
    expect(progress.bestiary["brain-blob"]).toEqual({ seen: 2, kills: 0 });

    const reloaded = new LocalSaveStore(storage).load();
    expect(reloaded.progress.bestiary.scuttler).toEqual({ seen: 12, kills: 11 });
  });

  it("ignores empty dex batches without touching storage", () => {
    const storage = fakeStorage();
    const store = new LocalSaveStore(storage);
    store.recordBestiary({});
    store.recordBestiary({ scuttler: { seen: 0, kills: 0 } });
    expect(store.load().progress.bestiary).toEqual({});
    expect(storage.dump().size).toBe(0);
  });

  it("keeps the dex when recording a run outcome", () => {
    const store = new LocalSaveStore(fakeStorage());
    store.recordBestiary({ ripper: { seen: 1, kills: 1 } });
    const after = store.recordRunEnd({ victory: true, waveReached: 5 });
    expect(after.progress.bestiary.ripper).toEqual({ seen: 1, kills: 1 });
    expect(after.progress.victories).toBe(1);
  });

  it("reads a pre-dex save without discarding it", () => {
    const storage = fakeStorage({
      [SAVE_STORAGE_KEY]: JSON.stringify({
        version: 1,
        settings: { screenShakeEnabled: false, soundEnabled: true },
        progress: { runsFinished: 3, victories: 1, bestWaveReached: 4 },
      }),
    });
    const loaded = new LocalSaveStore(storage).load();
    expect(loaded.progress.runsFinished).toBe(3);
    expect(loaded.settings.screenShakeEnabled).toBe(false);
    expect(loaded.progress.bestiary).toEqual({});
  });

  it("drops malformed dex rows rather than the whole save", () => {
    const storage = fakeStorage({
      [SAVE_STORAGE_KEY]: JSON.stringify({
        version: 1,
        settings: {},
        progress: {
          runsFinished: 2,
          bestiary: {
            scuttler: { seen: 5, kills: 3 },
            broken: "not an object",
            negative: { seen: -4, kills: Number.NaN },
          },
        },
      }),
    });
    const loaded = new LocalSaveStore(storage).load();
    expect(loaded.progress.runsFinished).toBe(2);
    expect(loaded.progress.bestiary).toEqual({ scuttler: { seen: 5, kills: 3 } });
  });

  it("returns an isolated dex copy that callers cannot mutate", () => {
    const store = new LocalSaveStore(fakeStorage());
    store.recordBestiary({ scuttler: { seen: 1, kills: 1 } });
    const first = store.load();
    first.progress.bestiary.scuttler!.kills = 999;
    expect(store.load().progress.bestiary.scuttler).toEqual({ seen: 1, kills: 1 });
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

describe("Save schema v2 — expedition autosave", () => {
  it("migrates a version-1 payload, preserving settings and progress with no run in progress", () => {
    const storage = fakeStorage({
      [SAVE_STORAGE_KEY]: JSON.stringify({
        version: 1,
        settings: { screenShakeEnabled: false, soundEnabled: true, damageNumbersEnabled: true, cooldownTimersEnabled: false },
        progress: { runsFinished: 4, victories: 2, bestWaveReached: 7, bestiary: { scuttler: { seen: 3, kills: 12 } } },
      }),
    });
    const save = new LocalSaveStore(storage).load();
    expect(save.version).toBe(2);
    expect(save.settings.screenShakeEnabled).toBe(false);
    expect(save.settings.cooldownTimersEnabled).toBe(false);
    expect(save.progress.runsFinished).toBe(4);
    expect(save.progress.bestiary.scuttler).toEqual({ seen: 3, kills: 12 });
    expect(save.expedition).toBeNull();
  });

  it("round-trips a mid-run expedition autosave through storage", () => {
    const storage = fakeStorage({});
    const store = new LocalSaveStore(storage);
    store.saveExpedition({
      mapSeed: 2026,
      currentNodeId: 5,
      clearedNodeIds: [1, 3, 5],
      build: {
        health: 7.4, shield: 1, level: 4, experience: 12, scrap: 55,
        weapons: [{ weaponId: "bastion-service-rifle", tier: 2 }],
        upgrades: [{ upgradeId: "rapid-cycling", level: 3 }],
      },
    });
    const reloaded = new LocalSaveStore(storage).load();
    expect(reloaded.expedition?.mapSeed).toBe(2026);
    expect(reloaded.expedition?.clearedNodeIds).toEqual([1, 3, 5]);
    expect(reloaded.expedition?.build?.health).toBeCloseTo(7.4, 5);
    expect(reloaded.expedition?.build?.weapons).toEqual([{ weaponId: "bastion-service-rifle", tier: 2 }]);
    const cleared = new LocalSaveStore(storage).clearExpedition();
    expect(cleared.expedition).toBeNull();
    expect(new LocalSaveStore(storage).load().expedition).toBeNull();
  });

  it("degrades a malformed expedition to no-run without touching settings", () => {
    const storage = fakeStorage({
      [SAVE_STORAGE_KEY]: JSON.stringify({
        version: 2,
        settings: { screenShakeEnabled: false, soundEnabled: true, damageNumbersEnabled: true, cooldownTimersEnabled: true },
        progress: { runsFinished: 1, victories: 0, bestWaveReached: 3, bestiary: {} },
        expedition: { mapSeed: "corrupt", clearedNodeIds: "nope" },
      }),
    });
    const save = new LocalSaveStore(storage).load();
    expect(save.expedition).toBeNull();
    expect(save.settings.screenShakeEnabled).toBe(false);
    expect(save.progress.bestWaveReached).toBe(3);
  });
});
