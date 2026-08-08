import { describe, expect, it } from "vitest";
import {
  INFECTED_SURVIVOR_ACCELERATION,
  INFECTED_SURVIVOR_RECOVERY_SECONDS,
  INFECTED_SURVIVOR_SPRINT_SPEED,
  stepInfectedSurvivorBehavior,
  type InfectedSurvivorState,
} from "./InfectedSurvivorBehavior";

describe("InfectedSurvivorBehavior", () => {
  it("starts a telegraphed sprint only after hesitation expires", () => {
    const result = stepInfectedSurvivorBehavior(state({
      phase: "hesitate",
      phaseRemainingSeconds: 0.05,
      staminaSeconds: 1.2,
    }), input(0.05));

    expect(result).toMatchObject({
      state: { phase: "sprint", phaseRemainingSeconds: 1.2 },
      rushStarted: true,
      movementSpeedMetresPerSecond: 0,
    });
  });

  it("accelerates without exceeding the authored per-tick delta", () => {
    const result = stepInfectedSurvivorBehavior(state({
      phase: "sprint",
      phaseRemainingSeconds: 1.2,
      staminaSeconds: 1.2,
    }), input(0.05));

    expect(result.state.velocity.x).toBeCloseTo(INFECTED_SURVIVOR_ACCELERATION * 0.05);
    expect(result.state.velocity.y).toBeCloseTo(0);
    expect(result.movementSpeedMetresPerSecond).toBeLessThan(INFECTED_SURVIVOR_SPRINT_SPEED);
    expect(result.rushStarted).toBe(false);
  });

  it("enters recovery on exhaustion while preserving this tick's movement", () => {
    const result = stepInfectedSurvivorBehavior(state({
      phase: "sprint",
      phaseRemainingSeconds: 0.02,
      staminaSeconds: 0.02,
      velocity: { x: 2, y: 0 },
    }), input(0.05));

    expect(result.state).toMatchObject({
      phase: "recover",
      phaseRemainingSeconds: INFECTED_SURVIVOR_RECOVERY_SECONDS,
      staminaSeconds: 0,
    });
    expect(result.movementSpeedMetresPerSecond).toBeGreaterThan(2);
  });
});

function state(overrides: Partial<InfectedSurvivorState>): InfectedSurvivorState {
  return {
    phase: "hesitate",
    phaseRemainingSeconds: 0.3,
    staminaSeconds: 1.2,
    velocity: { x: 0, y: 0 },
    ...overrides,
  };
}

function input(deltaSeconds: number) {
  return {
    deltaSeconds,
    towardPlayer: { x: 1, y: 0 },
    separation: { x: 0, y: 0 },
    laneBias: 0,
  };
}
