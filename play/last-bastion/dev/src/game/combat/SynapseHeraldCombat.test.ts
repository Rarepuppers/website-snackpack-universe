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
  id: "synapse-test",
  widthMetres: 30,
  heightMetres: 20,
  tileSizeMetres: 1,
  obstacles: [],
};

function simulation(): CombatSimulation {
  return new CombatSimulation({
    autoStartWaves: false,
    autoFireEnabled: false,
    arena: EMPTY_ARENA,
    widthMetres: 30,
    heightMetres: 20,
  });
}

function collect(subject: CombatSimulation, seconds: number): CombatEvent[] {
  const events: CombatEvent[] = [];
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.05) {
    events.push(...subject.step(IDLE, 0.05).events);
  }
  return events;
}

describe("Synapse Herald live behavior gate", () => {
  it("authors a three-zone committed warning and one eruption", () => {
    const subject = new CombatSimulation({ scenario: "synapse-herald", seed: 66001 });
    const events = collect(subject, 3.3);
    const warning = events.find((event) => (
      event.type === "synapse-herald-warning" && event.move === "marked-zones"
    ));
    const eruption = events.find((event) => event.type === "synapse-herald-zones-erupted");
    expect(warning).toMatchObject({ type: "synapse-herald-warning", move: "marked-zones" });
    if (warning?.type !== "synapse-herald-warning") throw new Error("missing zone warning");
    expect(warning.targets).toHaveLength(3);
    expect(eruption).toMatchObject({ type: "synapse-herald-zones-erupted", zones: warning.targets });
    expect(events.filter((event) => event.type === "synapse-herald-zones-erupted")).toHaveLength(1);
  });

  it("executes the locked lunge chain without adding a third step above frenzy", () => {
    const subject = simulation();
    subject.spawnEnemy("scuttler", { x: 28, y: 2 });
    subject.spawnEnemy("scuttler", { x: 28, y: 18 });
    const bossId = subject.spawnMiniBoss("synapse-herald", { x: 6, y: 10 });
    const events = collect(subject, 3.3);
    const warning = events.find((event) => (
      event.type === "synapse-herald-warning" && event.enemyId === bossId
    ));
    expect(warning).toMatchObject({ type: "synapse-herald-warning", move: "lunge-chain" });
    if (warning?.type !== "synapse-herald-warning") throw new Error("missing lunge warning");
    expect(warning.targets).toHaveLength(2);
    expect(events.some((event) => event.type === "synapse-herald-lunge" && event.enemyId === bossId))
      .toBe(true);
  });

  it("links one ordinary Brain Blob, mitigates damage, and breaks immediately on target death", () => {
    const subject = simulation();
    const blobId = subject.spawnEnemy("brain-blob", { x: 9, y: 10 });
    const bossId = subject.spawnMiniBoss("synapse-herald", { x: 6, y: 10 });
    const events = collect(subject, 2.8);
    expect(events).toContainEqual(expect.objectContaining({
      type: "synapse-herald-link-started",
      enemyId: bossId,
      targetId: blobId,
    }));
    const before = subject.snapshot().enemies.find((enemy) => enemy.id === bossId)!.health;
    subject.dealDamage(bossId, 10, "physical");
    const after = subject.snapshot().enemies.find((enemy) => enemy.id === bossId)!.health;
    expect(before - after).toBeGreaterThan(0);
    expect(before - after).toBeLessThan(8);

    subject.dealDamage(blobId, 999, "physical");
    const broken = collect(subject, 0.05);
    expect(broken).toContainEqual(expect.objectContaining({
      type: "synapse-herald-link-broken",
      enemyId: bossId,
      targetId: blobId,
      reason: "target",
    }));
    expect(subject.snapshot().enemies.find((enemy) => enemy.id === bossId))
      .toMatchObject({ synapseHeraldPhase: "recovery" });
  });

  it("uses the standard mini-boss rank and reward while remaining out of random promotion", () => {
    const subject = simulation();
    const bossId = subject.spawnMiniBoss("synapse-herald", { x: 5, y: 5 });
    expect(subject.snapshot().enemies.find((enemy) => enemy.id === bossId))
      .toMatchObject({ miniBossKind: "synapse-herald", rank: "mini-boss", health: 560 });
    expect(MINI_BOSS_POOL).not.toContain("synapse-herald");
    subject.dealDamage(bossId, 9999, "physical");
    expect(subject.snapshot().events).toContainEqual(expect.objectContaining({
      type: "mini-boss-reward-dropped",
      miniBossKind: "synapse-herald",
    }));
  });

  it("keeps the dedicated lab beneath its ten-unit cap", () => {
    const subject = new CombatSimulation({ scenario: "synapse-herald", seed: 66002 });
    expect(subject.snapshot().enemies).toHaveLength(3);
    collect(subject, 8);
    expect(subject.snapshot().density.peakLiveEnemies).toBeLessThanOrEqual(10);
  });
});
