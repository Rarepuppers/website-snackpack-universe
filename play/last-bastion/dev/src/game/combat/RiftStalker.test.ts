import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import {
  CombatSimulation,
  MINI_BOSS_POOL,
  PLAYER_MAX_HEALTH,
  RIFT_STALKER_CLOAK_DAMAGE_MULTIPLIER,
  RIFT_STALKER_POUNCE_RADIUS_METRES,
  riftStalkerFrenzyTier,
  type CombatEvent,
  type RiftStalkerPhase,
} from "./CombatSimulation";

function intent(overrides: Partial<PlayerIntent> = {}): PlayerIntent {
  return {
    move: { x: 0, y: 0 },
    aim: { x: 1, y: 0 },
    fireHeld: false,
    evasiveMovePressed: false,
    interactPressed: false,
    ultimatePressed: false,
    kitPressed: false,
    pausePressed: false,
    restartPressed: false,
    ...overrides,
  };
}

function riftPhase(simulation: CombatSimulation): RiftStalkerPhase | undefined {
  return simulation.snapshot().enemies
    .find((enemy) => enemy.miniBossKind === "rift-stalker")?.riftStalkerPhase;
}

describe("Rift Stalker rules", () => {
  it("belongs to the seeded mini-boss pool and reuses the final-20% frenzy tier", () => {
    expect(MINI_BOSS_POOL).toContain("rift-stalker");
    expect(riftStalkerFrenzyTier(520, 520)).toBe(0);
    expect(riftStalkerFrenzyTier(260, 520)).toBe(1);
    expect(riftStalkerFrenzyTier(104, 520)).toBe(2);
  });

  it("cycles cloak, decoy mark, warp, pounce, and punishable recovery", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, scenario: "rift-stalker", seed: 5 });
    const phases = new Set<string>();
    const events = new Set<string>();
    for (let frame = 0; frame < 400; frame += 1) {
      const snapshot = simulation.step(intent(), 0.05);
      const boss = snapshot.enemies.find((enemy) => enemy.miniBossKind === "rift-stalker");
      if (boss?.riftStalkerPhase) phases.add(boss.riftStalkerPhase);
      for (const event of snapshot.events) events.add(event.type);
    }
    for (const phase of ["cloak", "mark", "warp", "pounce", "recovery"]) {
      expect(phases).toContain(phase);
    }
    expect(events).toContain("rift-stalker-mark");
    expect(events).toContain("rift-stalker-warp-out");
    expect(events).toContain("rift-stalker-pounce");
    expect(events).toContain("rift-stalker-fan");
  });

  it("pounces the marked point, so a moving Marine escapes the strike", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, scenario: "rift-stalker", seed: 5 });
    let markTarget: { x: number; y: number } | null = null;
    let pounce: Extract<CombatEvent, { type: "rift-stalker-pounce" }> | null = null;
    for (let frame = 0; frame < 400 && !pounce; frame += 1) {
      const snapshot = simulation.step(intent({ move: { x: 1, y: 0 } }), 0.05);
      for (const event of snapshot.events) {
        if (event.type === "rift-stalker-mark") markTarget = { ...event.target };
        if (event.type === "rift-stalker-pounce") pounce = event;
      }
    }
    expect(pounce).not.toBeNull();
    expect(markTarget).not.toBeNull();
    const landingError = Math.hypot(
      pounce!.position.x - markTarget!.x,
      pounce!.position.y - markTarget!.y,
    );
    expect(landingError).toBeLessThanOrEqual(1);
    expect(pounce!.radiusMetres).toBe(RIFT_STALKER_POUNCE_RADIUS_METRES);
    expect(pounce!.hitPlayer).toBe(false);
    expect(simulation.snapshot().playerHealth).toBe(PLAYER_MAX_HEALTH);
  });

  it("reduces damage while cloaked and takes full damage in recovery", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, scenario: "rift-stalker", seed: 5 });
    const boss = simulation.snapshot().enemies.find((enemy) => enemy.miniBossKind === "rift-stalker")!;
    // flat reduction 2 turns a 10 raw hit into 8 mitigated.
    const uncloakedHit = 8;

    for (let frame = 0; frame < 60 && riftPhase(simulation) !== "cloak"; frame += 1) {
      simulation.step(intent(), 0.05);
    }
    expect(riftPhase(simulation)).toBe("cloak");
    let before = simulation.snapshot().enemies.find((enemy) => enemy.id === boss.id)!.health;
    simulation.dealDamage(boss.id, 10);
    let after = simulation.snapshot().enemies.find((enemy) => enemy.id === boss.id)!.health;
    expect(before - after).toBeCloseTo(uncloakedHit * RIFT_STALKER_CLOAK_DAMAGE_MULTIPLIER, 5);

    for (let frame = 0; frame < 600 && riftPhase(simulation) !== "recovery"; frame += 1) {
      simulation.step(intent({ move: { x: 1, y: 0 } }), 0.05);
    }
    expect(riftPhase(simulation)).toBe("recovery");
    before = simulation.snapshot().enemies.find((enemy) => enemy.id === boss.id)!.health;
    simulation.dealDamage(boss.id, 10);
    after = simulation.snapshot().enemies.find((enemy) => enemy.id === boss.id)!.health;
    expect(before - after).toBeCloseTo(uncloakedHit, 5);
  });

  it("chains a second warp only in the final-20% frenzy", () => {
    const calm = new CombatSimulation({ autoStartWaves: false, scenario: "rift-stalker", seed: 5 });
    expect(observesPounceToMarkChain(calm, 400)).toBe(false);

    const frenzied = new CombatSimulation({ autoStartWaves: false, scenario: "rift-stalker", seed: 5 });
    const boss = frenzied.snapshot().enemies.find((enemy) => enemy.miniBossKind === "rift-stalker")!;
    damageToRatio(frenzied, boss.id, 0.15);
    const wounded = frenzied.snapshot().enemies.find((enemy) => enemy.id === boss.id)!;
    expect(wounded.health / wounded.maxHealth).toBeGreaterThan(0);
    expect(observesPounceToMarkChain(frenzied, 400)).toBe(true);
  });

  it("releases a wider rift-spike fan in frenzy", () => {
    const frenzied = new CombatSimulation({ autoStartWaves: false, scenario: "rift-stalker", seed: 5 });
    const boss = frenzied.snapshot().enemies.find((enemy) => enemy.miniBossKind === "rift-stalker")!;
    damageToRatio(frenzied, boss.id, 0.15);
    let fanCount = 0;
    for (let frame = 0; frame < 400 && fanCount === 0; frame += 1) {
      const snapshot = frenzied.step(intent({ move: { x: 1, y: 0 } }), 0.05);
      for (const event of snapshot.events) {
        if (event.type === "rift-stalker-fan") fanCount = event.count;
      }
    }
    expect(fanCount).toBe(5);
  });
});

function damageToRatio(simulation: CombatSimulation, enemyId: number, targetRatio: number): void {
  const enemy = simulation.snapshot().enemies.find((candidate) => candidate.id === enemyId)!;
  // Repeated small physical hits step past flat reduction deterministically.
  while (true) {
    const current = simulation.snapshot().enemies.find((candidate) => candidate.id === enemyId);
    if (!current || current.health / current.maxHealth <= targetRatio) return;
    simulation.dealDamage(enemyId, Math.max(enemy.maxHealth * 0.05, 8));
  }
}

function observesPounceToMarkChain(simulation: CombatSimulation, frames: number): boolean {
  let lastPhase: RiftStalkerPhase | undefined;
  for (let frame = 0; frame < frames; frame += 1) {
    simulation.step(intent({ move: { x: 1, y: 0 } }), 0.05);
    const phase = riftPhase(simulation);
    if (lastPhase === "pounce" && phase === "mark") return true;
    if (phase) lastPhase = phase;
  }
  return false;
}
