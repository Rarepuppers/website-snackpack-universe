import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation, type CombatEvent } from "./CombatSimulation";

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

describe("regional boss finale integration", () => {
  it("runs The Choir as one shared-health, three-voice boss with threshold transitions", () => {
    const subject = new CombatSimulation({ scenario: "the-choir", autoStartWaves: false, autoFireEnabled: false });
    let boss = subject.snapshot().enemies.find((enemy) => enemy.type === "the-choir")!;
    expect(boss).toMatchObject({ rank: "boss", health: 1800, maxHealth: 1800, choirPhase: "linked", choirVoicesActive: 3 });
    expect(boss.choirVoicePositions).toHaveLength(3);

    subject.dealDamage(boss.id, 481, "physical");
    let events = collect(subject, 0.05);
    boss = subject.snapshot().enemies.find((enemy) => enemy.id === boss.id)!;
    expect(boss.choirVoicesActive).toBe(2);
    expect(events).toContainEqual(expect.objectContaining({ type: "choir-voice-collapsed", voicesActive: 2 }));

    subject.dealDamage(boss.id, 481, "physical");
    events = collect(subject, 0.05);
    boss = subject.snapshot().enemies.find((enemy) => enemy.id === boss.id)!;
    expect(boss).toMatchObject({ choirPhase: "merged", choirVoicesActive: 1, choirSafeRadiusMetres: 4.5 });
    expect(events).toContainEqual(expect.objectContaining({ type: "choir-merged", safeRadiusMetres: 4.5 }));
  });

  it("telegraphs Sovereign fabrication, spawns owned children, and powers them down on victory", () => {
    const subject = new CombatSimulation({ scenario: "foundry-sovereign", autoStartWaves: false, autoFireEnabled: false });
    const boss = subject.snapshot().enemies.find((enemy) => enemy.type === "foundry-sovereign")!;
    expect(boss).toMatchObject({ rank: "boss", health: 2100, maxHealth: 2100, sovereignWaveIndex: 0 });
    const events = collect(subject, 2.4);
    const fabricated = events.find((event) => event.type === "sovereign-fabricated");
    expect(events).toContainEqual(expect.objectContaining({ type: "sovereign-fabrication-warning", waveIndex: 0 }));
    expect(fabricated).toEqual(expect.objectContaining({ childIds: expect.arrayContaining([expect.any(Number)]), buffMultiplier: 1 }));
    expect(subject.snapshot().enemies.filter((enemy) => enemy.foundryOwnerId === boss.id)).toHaveLength(2);

    subject.dealDamage(boss.id, 99999, "shock");
    const snapshot = subject.snapshot();
    expect(snapshot.status).toBe("victory");
    expect(snapshot.pendingDecision).toMatchObject({ kind: "rank-reward", title: expect.stringContaining("BOSS VAULT") });
    expect(snapshot.securedScrap).toBeGreaterThanOrEqual(80);
    expect(snapshot.enemies.some((enemy) => enemy.foundryOwnerId === boss.id)).toBe(false);
  });
});
