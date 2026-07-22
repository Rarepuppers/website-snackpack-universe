import { describe, expect, it } from "vitest";
import type { ArenaDefinition } from "../arena/ArenaDefinition";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation, MINI_BOSS_POOL, type CombatEvent } from "./CombatSimulation";

const IDLE: PlayerIntent = {
  move: { x: 0, y: 0 }, aim: { x: 0, y: 0 }, fireHeld: false,
  evasiveMovePressed: false, interactPressed: false, ultimatePressed: false,
  kitPressed: false, pausePressed: false, restartPressed: false,
};

const EMPTY_ARENA: ArenaDefinition = {
  id: "regent-live-test",
  widthMetres: 30,
  heightMetres: 20,
  tileSizeMetres: 1,
  obstacles: [],
};

function collect(subject: CombatSimulation, seconds: number): CombatEvent[] {
  const events: CombatEvent[] = [];
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.05) {
    events.push(...subject.step(IDLE, 0.05).events);
  }
  return events;
}

describe("Storm Regent live behavior gate", () => {
  it("owns exactly three targetable six-health finite nodes", () => {
    const subject = new CombatSimulation({ scenario: "storm-regent", seed: 66030 });
    const boss = subject.snapshot().enemies.find((enemy) => enemy.miniBossKind === "storm-regent")!;
    const nodes = subject.snapshot().enemies.filter((enemy) => enemy.stormNodeOwnerId === boss.id);
    expect(nodes).toHaveLength(3);
    expect(nodes.every((node) => node.type === "storm-node" && node.health === 6 && node.maxHealth === 6)).toBe(true);
  });

  it("interrupts a committed node overcharge immediately when its node is destroyed", () => {
    const subject = new CombatSimulation({ scenario: "storm-regent", seed: 66031 });
    const warningEvents = collect(subject, 2.1);
    const warning = warningEvents.find((event) => (
      event.type === "storm-regent-warning" && event.move === "node-overcharge"
    ));
    if (warning?.type !== "storm-regent-warning" || warning.nodeId === undefined) {
      throw new Error("missing node warning");
    }
    subject.dealDamage(warning.nodeId, 99, "physical");
    const interrupted = collect(subject, 0.05);
    expect(interrupted).toContainEqual(expect.objectContaining({
      type: "storm-regent-interrupted",
      enemyId: warning.enemyId,
      move: "node-overcharge",
    }));
    expect(subject.snapshot().enemies.find((enemy) => enemy.id === warning.enemyId))
      .toMatchObject({ stormRegentPhase: "recovery" });
  });

  it("warns and resolves each finite pattern exactly once per committed action", () => {
    const subject = new CombatSimulation({ scenario: "storm-regent", seed: 66032 });
    const events = collect(subject, 12);
    const warnings = events.filter((event) => event.type === "storm-regent-warning");
    expect(warnings.map((event) => event.type === "storm-regent-warning" ? event.move : null))
      .toEqual(["node-overcharge", "coil-burst", "chain-strike"]);
    const discharges = events.filter((event) => event.type === "storm-regent-discharged");
    expect(discharges.map((event) => event.type === "storm-regent-discharged" ? event.move : null))
      .toEqual(["node-overcharge", "coil-burst", "chain-strike"]);
  });

  it("applies player-radius coil damage and preserves standard reward/pool rules", () => {
    const subject = new CombatSimulation({
      autoStartWaves: false,
      autoFireEnabled: false,
      arena: EMPTY_ARENA,
      widthMetres: 30,
      heightMetres: 20,
    });
    const player = subject.snapshot().playerPosition;
    subject.spawnEnemy("scuttler", { x: 1, y: 1 });
    const bossId = subject.spawnMiniBoss("storm-regent", { x: player.x - 2.5, y: player.y });
    const events = collect(subject, 3);
    expect(events).toContainEqual(expect.objectContaining({
      type: "storm-regent-discharged",
      enemyId: bossId,
      move: "coil-burst",
      hitPlayer: true,
    }));
    expect(MINI_BOSS_POOL).not.toContain("storm-regent");
    subject.dealDamage(bossId, 9999, "physical");
    expect(subject.snapshot().events).toContainEqual(expect.objectContaining({
      type: "mini-boss-reward-dropped",
      miniBossKind: "storm-regent",
    }));
    expect(subject.snapshot().enemies.some((enemy) => enemy.stormNodeOwnerId === bossId)).toBe(false);
  });

  it("keeps the dedicated route beneath its ten-unit ceiling", () => {
    const subject = new CombatSimulation({ scenario: "storm-regent", seed: 66033 });
    expect(subject.snapshot().enemies).toHaveLength(6);
    collect(subject, 14);
    expect(subject.snapshot().density.peakLiveEnemies).toBeLessThanOrEqual(10);
  });
});
