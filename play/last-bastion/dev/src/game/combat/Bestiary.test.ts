import { describe, expect, it } from "vitest";
import { CombatSimulation } from "./CombatSimulation";

describe("bestiary tagging", () => {
  it("tags ordinary aliens with their enemy type on spawn and defeat", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const id = simulation.spawnEnemy("brain-blob", { x: 4, y: 4 });
    const spawned = simulation.snapshot().events
      .find((event) => event.type === "enemy-spawned");
    expect(spawned && "bestiaryKey" in spawned && spawned.bestiaryKey).toBe("brain-blob");

    simulation.dealDamage(id, 9999);
    const defeated = simulation.snapshot().events
      .find((event) => event.type === "enemy-defeated");
    expect(defeated && "bestiaryKey" in defeated && defeated.bestiaryKey).toBe("brain-blob");
  });

  it("gives an elite its own dex identity rather than its base family", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const id = simulation.spawnElite("carapace-scuttler", { x: 6, y: 6 });

    // spawnEnemy emits before the elite rank is applied, so the spawn event
    // must be re-tagged — otherwise this reads "scuttler".
    const spawned = simulation.snapshot().events
      .find((event) => event.type === "enemy-spawned");
    expect(spawned && "bestiaryKey" in spawned && spawned.bestiaryKey).toBe("carapace-scuttler");

    simulation.dealDamage(id, 9999);
    const defeated = simulation.snapshot().events
      .find((event) => event.type === "enemy-defeated");
    expect(defeated && "bestiaryKey" in defeated && defeated.bestiaryKey).toBe("carapace-scuttler");
    // The base type is still reported for rendering.
    expect(defeated && "enemyType" in defeated && defeated.enemyType).toBe("scuttler");
  });

  it("gives a mini-boss its own dex identity", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const id = simulation.spawnMiniBoss("brood-warden", { x: 8, y: 8 });
    const spawned = simulation.snapshot().events
      .find((event) => event.type === "enemy-spawned");
    expect(spawned && "bestiaryKey" in spawned && spawned.bestiaryKey).toBe("brood-warden");

    simulation.dealDamage(id, 99999);
    const defeated = simulation.snapshot().events
      .find((event) => event.type === "enemy-defeated");
    expect(defeated && "bestiaryKey" in defeated && defeated.bestiaryKey).toBe("brood-warden");
  });

  it("only re-tags the spawn it caused when several spawn in one frame", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    simulation.spawnEnemy("scuttler", { x: 2, y: 2 });
    simulation.spawnElite("carapace-scuttler", { x: 9, y: 9 });

    const keys = simulation.snapshot().events
      .filter((event) => event.type === "enemy-spawned")
      .map((event) => ("bestiaryKey" in event ? event.bestiaryKey : null));
    expect(keys).toEqual(["scuttler", "carapace-scuttler"]);
  });

  it("uses dex keys the codex can derive from its own entry ids", () => {
    // The codex names monsters mon-<bestiaryKey>; this guards that contract.
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const cases: [string, () => number][] = [
      ["scuttler", () => simulation.spawnEnemy("scuttler", { x: 3, y: 3 })],
      ["siege-crusher", () => simulation.spawnMiniBoss("siege-crusher", { x: 12, y: 6 })],
      ["aurum-hoarder", () => simulation.spawnAurumHoarder({ x: 16, y: 8 })!],
    ];
    for (const [expected, spawn] of cases) {
      spawn();
      const keys = simulation.snapshot().events
        .filter((event) => event.type === "enemy-spawned")
        .map((event) => ("bestiaryKey" in event ? event.bestiaryKey : ""));
      expect(keys).toContain(expected);
    }
  });
});
