import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation, MINI_BOSS_POOL, type CombatEvent } from "./CombatSimulation";

const IDLE: PlayerIntent = {
  move: { x: 0, y: 0 }, aim: { x: 0, y: 0 }, fireHeld: false,
  evasiveMovePressed: false, interactPressed: false, ultimatePressed: false,
  kitPressed: false, pausePressed: false, restartPressed: false,
};

function collect(subject: CombatSimulation, seconds: number): CombatEvent[] {
  const events: CombatEvent[] = [];
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.05) {
    events.push(...subject.step(IDLE, 0.05).events);
  }
  return events;
}

describe("Assembly Prime live behavior gate", () => {
  it("reserves exact pressure through a ten-health pad and creates one finite child", () => {
    const subject = new CombatSimulation({ scenario: "assembly-prime", seed: 66020 });
    const boss = subject.snapshot().enemies.find((enemy) => enemy.miniBossKind === "assembly-prime")!;
    const warningEvents = collect(subject, 2);
    expect(warningEvents).toContainEqual(expect.objectContaining({
      type: "assembly-prime-warning", enemyId: boss.id, move: "fabrication",
    }));
    expect(subject.snapshot().density).toMatchObject({ reservedLiveSlots: 1, reservedThreat: 2 });
    expect(subject.snapshot().enemies.find((enemy) => enemy.type === "foundry-pad"))
      .toMatchObject({ health: 10, maxHealth: 10, foundryOwnerId: boss.id });
    const completed = collect(subject, 2);
    expect(completed).toContainEqual(expect.objectContaining({
      type: "assembly-prime-fabrication-completed", enemyId: boss.id, childType: "foundry-drone",
    }));
    expect(subject.snapshot().density).toMatchObject({ reservedLiveSlots: 0, reservedThreat: 0 });
  });

  it("recalls the same drone without cloning, healing, or extending its lifetime", () => {
    const subject = new CombatSimulation({ scenario: "assembly-prime", seed: 66021 });
    const events = collect(subject, 4);
    const created = events.find((event) => event.type === "assembly-prime-fabrication-completed");
    if (created?.type !== "assembly-prime-fabrication-completed") throw new Error("missing drone");
    const before = subject.snapshot().enemies.find((enemy) => enemy.id === created.childId)!;
    const followup = collect(subject, 3.2);
    expect(followup).toContainEqual(expect.objectContaining({
      type: "assembly-prime-drone-recalled", childId: created.childId,
    }));
    const children = subject.snapshot().enemies.filter((enemy) => enemy.foundryOwnerId === created.enemyId);
    expect(children.filter((enemy) => enemy.type === "foundry-drone")).toHaveLength(1);
    expect(children[0]!.id).toBe(created.childId);
    expect(children[0]!.foundryRemainingSeconds).toBeLessThan(before.foundryRemainingSeconds!);
    expect(subject.snapshot().density).toMatchObject({ reservedLiveSlots: 0, reservedThreat: 0 });
  });

  it("warns three locked lanes and fires each exactly once", () => {
    const subject = new CombatSimulation({ scenario: "assembly-prime", seed: 66022 });
    const events = collect(subject, 12);
    const warning = events.find((event) => (
      event.type === "assembly-prime-warning" && event.move === "rotating-lanes"
    ));
    if (warning?.type !== "assembly-prime-warning") throw new Error("missing lane warning");
    expect(warning.lanes).toHaveLength(3);
    const fired = events.filter((event) => event.type === "assembly-prime-lane-fired");
    expect(fired.map((event) => event.type === "assembly-prime-lane-fired" ? event.laneIndex : -1))
      .toEqual([0, 1, 2]);
  });

  it("preserves standard mini-boss reward rules without random-pool promotion", () => {
    const subject = new CombatSimulation({ scenario: "assembly-prime", seed: 66023 });
    const boss = subject.snapshot().enemies.find((enemy) => enemy.miniBossKind === "assembly-prime")!;
    expect(boss).toMatchObject({ rank: "mini-boss", health: 720, armour: 0 });
    expect(MINI_BOSS_POOL).not.toContain("assembly-prime");
    subject.dealDamage(boss.id, 9999, "physical");
    expect(subject.snapshot().events).toContainEqual(expect.objectContaining({
      type: "mini-boss-reward-dropped", miniBossKind: "assembly-prime",
    }));
  });

  it("keeps the dedicated route beneath its ten-unit ceiling", () => {
    const subject = new CombatSimulation({ scenario: "assembly-prime", seed: 66024 });
    expect(subject.snapshot().enemies).toHaveLength(4);
    collect(subject, 14);
    expect(subject.snapshot().density.peakLiveEnemies).toBeLessThanOrEqual(10);
  });
});
