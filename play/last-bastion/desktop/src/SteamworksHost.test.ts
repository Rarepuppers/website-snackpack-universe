import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSteamworksHost, readSteamAppId, type SteamworksClient } from "./SteamworksHost.js";

function client(overrides: Partial<SteamworksClient> = {}): SteamworksClient {
  return {
    achievement: {
      isActivated: () => false,
      activate: () => true,
    },
    stats: { store: () => true },
    cloud: {
      fileExists: () => false,
      readFile: () => "",
      writeFile: () => true,
    },
    ...overrides,
  };
}

describe("Steamworks host", () => {
  it("uses steam_appid.txt when the environment override is absent", () => {
    assert.equal(readSteamAppId(undefined), undefined);
    assert.equal(readSteamAppId("  "), undefined);
    assert.equal(readSteamAppId("480"), 480);
    assert.throws(() => readSteamAppId("0"), /positive integer/);
    assert.throws(() => readSteamAppId("1.5"), /positive integer/);
  });

  it("maps achievements, stats and the missing-cloud-file result", async () => {
    const calls: string[] = [];
    const host = createSteamworksHost(client({
      achievement: {
        isActivated: (id) => id === "first-drop",
        activate: (id) => { calls.push(`activate:${id}`); return true; },
      },
      stats: { store: () => { calls.push("store"); return true; } },
      cloud: {
        fileExists: () => false,
        readFile: () => { throw new Error("must not read"); },
        writeFile: (path, contents) => { calls.push(`write:${path}:${contents}`); return true; },
      },
    }));

    assert.equal(await host.getAchievement("first-drop"), true);
    assert.equal(await host.readCloudFile("save.json"), null);
    await host.setAchievement("first-victory");
    await host.storeStats();
    await host.writeCloudFile("save.json", "{}");
    assert.deepEqual(calls, ["activate:first-victory", "store", "write:save.json:{}"]);
  });

  it("turns false native results into retryable bridge failures", async () => {
    const host = createSteamworksHost(client({
      achievement: { isActivated: () => false, activate: () => false },
      stats: { store: () => false },
      cloud: { fileExists: () => false, readFile: () => "", writeFile: () => false },
    }));

    assert.throws(() => host.setAchievement("first-drop"), /rejected achievement/);
    assert.throws(() => host.storeStats(), /stats commit/);
    assert.throws(() => host.writeCloudFile("save.json", "{}"), /cloud write/);
  });
});
