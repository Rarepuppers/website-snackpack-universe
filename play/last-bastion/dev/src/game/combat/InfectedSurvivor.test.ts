import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import {
  approachVelocity,
  CombatSimulation,
  infectedSurvivorSteeringDirection,
  INFECTED_SURVIVOR_ACCELERATION,
  INFECTED_SURVIVOR_MAX_STAMINA_SECONDS,
  INFECTED_SURVIVOR_PACK_CAP,
  INFECTED_SURVIVOR_SPRINT_SPEED,
} from "./CombatSimulation";

describe("Infected Survivor movement gate", () => {
  it("approaches target velocity without overshoot", () => {
    expect(approachVelocity({ x: 0, y: 0 }, { x: 5, y: 0 }, 1.1)).toEqual({ x: 1.1, y: 0 });
    expect(approachVelocity({ x: 4.8, y: 0 }, { x: 5, y: 0 }, 1.1)).toEqual({ x: 5, y: 0 });
    expect(approachVelocity({ x: 3, y: 4 }, { x: 0, y: 0 }, 5)).toEqual({ x: 0, y: 0 });
  });

  it("keeps a forward pursuit floor despite separation and lane bias", () => {
    const toward = { x: 1, y: 0 };
    for (const separation of [
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ]) {
      const direction = infectedSurvivorSteeringDirection(toward, separation, 0.16);
      expect(direction.x).toBeGreaterThanOrEqual(0.55 - 1e-6);
      expect(Math.hypot(direction.x, direction.y)).toBeCloseTo(1);
    }
  });

  it("cycles hesitation, accelerated sprint, exhaustion, and recovery", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      scenario: "infected-survivor",
      seed: 58,
    });
    const phases = new Set<string>();
    let maximumSpeed = 0;
    let previousSpeed = 0;
    let maximumAcceleration = 0;
    for (let frame = 0; frame < 65; frame += 1) {
      const survivor = simulation.step(idleIntent(), 0.05).enemies
        .find((enemy) => enemy.type === "infected-survivor")!;
      phases.add(survivor.survivorPhase!);
      const speed = Math.hypot(survivor.survivorVelocity!.x, survivor.survivorVelocity!.y);
      maximumSpeed = Math.max(maximumSpeed, speed);
      maximumAcceleration = Math.max(maximumAcceleration, speed - previousSpeed);
      previousSpeed = speed;
      expect(survivor.survivorStaminaSeconds).toBeGreaterThanOrEqual(0);
      expect(survivor.survivorStaminaSeconds).toBeLessThanOrEqual(INFECTED_SURVIVOR_MAX_STAMINA_SECONDS);
    }
    expect(phases).toEqual(new Set(["hesitate", "sprint", "recover"]));
    expect(maximumSpeed).toBeGreaterThan(INFECTED_SURVIVOR_SPRINT_SPEED * 0.9);
    expect(maximumAcceleration).toBeLessThanOrEqual(INFECTED_SURVIVOR_ACCELERATION * 0.05 + 1e-6);
  });

  it("caps the authored lab pack and preserves a wide angular escape lane", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      scenario: "infected-survivor",
      seed: 58,
    });
    let narrowestEscapeLane = Math.PI * 2;
    for (let frame = 0; frame < 32; frame += 1) {
      const snapshot = simulation.step(idleIntent(), 0.05);
      const survivors = snapshot.enemies.filter((enemy) => enemy.type === "infected-survivor");
      expect(survivors).toHaveLength(INFECTED_SURVIVOR_PACK_CAP);
      narrowestEscapeLane = Math.min(
        narrowestEscapeLane,
        largestAngularGap(snapshot.playerPosition, survivors.map((enemy) => enemy.position)),
      );
    }
    expect(narrowestEscapeLane).toBeGreaterThan(Math.PI / 2);
  });
});

function idleIntent(): PlayerIntent {
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
  };
}

function largestAngularGap(
  origin: { x: number; y: number },
  points: readonly { x: number; y: number }[],
): number {
  if (points.length < 2) return Math.PI * 2;
  const angles = points
    .map((point) => Math.atan2(point.y - origin.y, point.x - origin.x))
    .sort((a, b) => a - b);
  let largest = angles[0]! + Math.PI * 2 - angles[angles.length - 1]!;
  for (let index = 1; index < angles.length; index += 1) {
    largest = Math.max(largest, angles[index]! - angles[index - 1]!);
  }
  return largest;
}
