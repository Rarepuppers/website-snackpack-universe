import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import {
  CombatSimulation,
  CORRUPTED_MARINE_COOLDOWN_SECONDS,
  CORRUPTED_MARINE_KNIFE_SPEED,
  CORRUPTED_MARINE_WINDUP_SECONDS,
  PLAYER_MAX_HEALTH,
  type CombatEvent,
} from "./CombatSimulation";

describe("Corrupted Marine knife lifecycle", () => {
  it("locks a tell, launches a slow visible knife, reports the player source, and recovers", () => {
    const simulation = marineSimulation();
    const marineId = spawnMarineLeft(simulation);
    const events: CombatEvent[] = [];
    const phases = new Set<string>();
    let maximumKnifeStep = 0;
    let previousKnifePosition: { x: number; y: number } | null = null;
    for (let frame = 0; frame < 100; frame += 1) {
      const snapshot = simulation.step(intent(), 0.05);
      const marine = snapshot.enemies.find((enemy) => enemy.id === marineId);
      if (marine?.corruptedMarinePhase) phases.add(marine.corruptedMarinePhase);
      events.push(...snapshot.events);
      const knife = snapshot.enemyProjectiles.find((projectile) => projectile.type === "corrupted-knife");
      if (knife && previousKnifePosition) {
        maximumKnifeStep = Math.max(
          maximumKnifeStep,
          Math.hypot(knife.position.x - previousKnifePosition.x, knife.position.y - previousKnifePosition.y),
        );
      }
      previousKnifePosition = knife ? { ...knife.position } : null;
    }

    const warning = events.find((event) => event.type === "corrupted-marine-warning");
    const fired = events.find((event) => event.type === "corrupted-marine-knife-fired");
    const impact = events.find((event) => event.type === "corrupted-marine-knife-impact");
    expect(warning?.enemyId).toBe(marineId);
    expect(fired?.enemyId).toBe(marineId);
    expect(impact).toMatchObject({ reason: "player", enemyId: marineId });
    expect(phases).toEqual(new Set(["windup", "throw", "recovery", "positioning"]));
    expect(maximumKnifeStep).toBeLessThanOrEqual(CORRUPTED_MARINE_KNIFE_SPEED * 0.05 + 1e-6);
    expect(simulation.snapshot().playerHealth).toBeLessThan(PLAYER_MAX_HEALTH);
  });

  it("uses the locked target so perpendicular movement deterministically dodges", () => {
    const simulation = marineSimulation();
    spawnMarineLeft(simulation);
    let lockedTarget: { x: number; y: number } | null = null;
    let impact: Extract<CombatEvent, { type: "corrupted-marine-knife-impact" }> | null = null;
    for (let frame = 0; frame < 100 && !impact; frame += 1) {
      const snapshot = simulation.step(intent({ move: lockedTarget ? { x: 0, y: 1 } : { x: 0, y: 0 } }), 0.05);
      for (const event of snapshot.events) {
        if (event.type === "corrupted-marine-warning") lockedTarget = { ...event.target };
        if (event.type === "corrupted-marine-knife-impact") impact = event;
      }
    }
    expect(lockedTarget).not.toBeNull();
    expect(impact).toMatchObject({ reason: "expired", damage: 0 });
    expect(simulation.snapshot().playerHealth).toBe(PLAYER_MAX_HEALTH);
  });

  it("lets cover intercept the knife and reports zero player damage", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      arena: {
        id: "knife-cover-test",
        widthMetres: 30,
        heightMetres: 16.875,
        tileSizeMetres: 1,
        obstacles: [{ id: "knife-cover", kind: "barricade", x: 11, y: 7.4, width: 1, height: 2 }],
      },
    });
    const marineId = simulation.spawnEnemy("corrupted-marine", { x: 7, y: 8.4375 });
    let impact: Extract<CombatEvent, { type: "corrupted-marine-knife-impact" }> | null = null;
    for (let frame = 0; frame < 80 && !impact; frame += 1) {
      const snapshot = simulation.step(intent(), 0.05);
      impact = snapshot.events.find((event): event is Extract<CombatEvent, { type: "corrupted-marine-knife-impact" }> => (
        event.type === "corrupted-marine-knife-impact"
      )) ?? null;
    }
    expect(impact).toMatchObject({ reason: "cover", damage: 0, enemyId: marineId });
    expect(simulation.snapshot().playerHealth).toBe(PLAYER_MAX_HEALTH);
  });

  it("cannot throw again before its authored cooldown and next tell", () => {
    const simulation = marineSimulation();
    spawnMarineLeft(simulation);
    const firedAt: number[] = [];
    for (let frame = 0; frame < 180 && firedAt.length < 2; frame += 1) {
      const snapshot = simulation.step(intent({ move: { x: 0, y: 1 } }), 0.05);
      if (snapshot.events.some((event) => event.type === "corrupted-marine-knife-fired")) {
        firedAt.push(frame * 0.05);
      }
    }
    expect(firedAt).toHaveLength(2);
    expect(firedAt[1]! - firedAt[0]!).toBeGreaterThanOrEqual(
      CORRUPTED_MARINE_COOLDOWN_SECONDS + CORRUPTED_MARINE_WINDUP_SECONDS - 0.06,
    );
  });
});

function marineSimulation(): CombatSimulation {
  return new CombatSimulation({
    autoStartWaves: false,
    arena: {
      id: "marine-test",
      widthMetres: 30,
      heightMetres: 16.875,
      tileSizeMetres: 1,
      obstacles: [],
    },
  });
}

function spawnMarineLeft(simulation: CombatSimulation): number {
  const player = simulation.snapshot().playerPosition;
  return simulation.spawnEnemy("corrupted-marine", { x: player.x - 7, y: player.y });
}

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
