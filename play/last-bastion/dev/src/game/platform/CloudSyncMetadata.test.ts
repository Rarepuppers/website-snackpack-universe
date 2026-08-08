import { describe, expect, it } from "vitest";
import { DEFAULT_SAVE, type SaveData } from "../save/LocalSaveStore";
import {
  CLOUD_SYNC_METADATA_KEY,
  CloudSyncMetadataStore,
  cloudSaveContentHash,
  portableCloudSave,
} from "./CloudSyncMetadata";

function storage(initial?: string) {
  const values = new Map<string, string>();
  if (initial) values.set(CLOUD_SYNC_METADATA_KEY, initial);
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

function save(): SaveData {
  return JSON.parse(JSON.stringify(DEFAULT_SAVE)) as SaveData;
}

describe("cloud-sync metadata", () => {
  it("round-trips valid metadata and rejects corrupt metadata", () => {
    const target = storage();
    const store = new CloudSyncMetadataStore(target);
    store.save({
      deviceId: "deck", revision: 4, updatedAtMs: 50, contentHash: "0123abcd",
      pendingAchievementIds: ["first-drop"],
    });
    expect(store.load()).toEqual({
      deviceId: "deck", revision: 4, updatedAtMs: 50, contentHash: "0123abcd",
      pendingAchievementIds: ["first-drop"],
    });
    expect(new CloudSyncMetadataStore(storage('{"deviceId":"broken"}')).load()).toBeNull();
  });

  it("updates cloud state and achievement queue without overwriting the other", () => {
    const target = storage();
    const store = new CloudSyncMetadataStore(target);
    store.save({
      deviceId: "deck", revision: 1, updatedAtMs: 10, contentHash: "0123abcd",
      pendingAchievementIds: ["first-drop"],
    });
    store.updateCloudState({
      deviceId: "deck", revision: 2, updatedAtMs: 20, contentHash: "abcd0123",
    });
    expect(store.load()?.pendingAchievementIds).toEqual(["first-drop"]);
    store.updatePendingAchievementIds(["wave-ten"]);
    expect(store.load()).toMatchObject({
      revision: 2, updatedAtMs: 20, contentHash: "abcd0123",
      pendingAchievementIds: ["wave-ten"],
    });
  });

  it("strips device display choices from cloud content and its fingerprint", () => {
    const first = save();
    first.settings.displaySizePercent = 80;
    first.settings.selectedDisplayId = "deck-panel";
    first.settings.fullscreenMode = "borderless";
    first.settings.brightness = 0.7;
    const second = save();
    second.settings.displaySizePercent = 175;
    second.settings.selectedDisplayId = "ultrawide";
    second.settings.gamma = 1.8;

    expect(cloudSaveContentHash(first)).toBe(cloudSaveContentHash(second));
    expect(portableCloudSave(first).settings).toMatchObject({
      displaySizePercent: 100,
      presentationMode: "auto",
      fullscreenMode: "windowed",
      selectedDisplayId: null,
      frameCap: "display",
      brightness: 1,
      gamma: 1,
    });
  });

  it("changes the fingerprint when portable progress changes", () => {
    const changed = save();
    changed.progress.totalKills = 1;
    expect(cloudSaveContentHash(changed)).not.toBe(cloudSaveContentHash(save()));
  });

  it("fingerprints equivalent keyed progress independently of insertion order", () => {
    const first = save();
    first.progress.bestiary = {
      scuttler: { seen: 4, kills: 2 },
      ripper: { seen: 1, kills: 1 },
    };
    const second = save();
    second.progress.bestiary = {
      ripper: { seen: 1, kills: 1 },
      scuttler: { seen: 4, kills: 2 },
    };
    expect(cloudSaveContentHash(first)).toBe(cloudSaveContentHash(second));
  });
});
