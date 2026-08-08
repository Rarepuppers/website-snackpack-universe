import { describe, expect, it } from "vitest";
import type { ArenaDefinition } from "../arena/ArenaDefinition";
import {
  SPINEWHEEL_BASE_ROLL_SPEED,
  SPINEWHEEL_BOUNCE_SPEED_MULTIPLIER,
  SPINEWHEEL_MAX_REBOUNDS,
  SPINEWHEEL_MAX_ROLL_SECONDS,
  SPINEWHEEL_RECOVERY_SECONDS,
  SPINEWHEEL_WINDUP_SECONDS,
  stepSpinewheelBehavior,
  type SpinewheelState,
} from "./SpinewheelBehavior";

const EMPTY_ARENA: ArenaDefinition = {
  id: "spinewheel-behavior-test",
  widthMetres: 12,
  heightMetres: 8,
  tileSizeMetres: 1,
  obstacles: [],
};

describe("SpinewheelBehavior", () => {
  it("locks its pre-movement heading when positioning expires", () => {
    const result = stepSpinewheelBehavior(
      state({ phaseRemainingSeconds: 0.05 }),
      input({ deltaSeconds: 0.05, position: { x: 2, y: 4 }, playerPosition: { x: 10, y: 4 } }),
    );

    expect(result.state).toMatchObject({
      phase: "windup",
      phaseRemainingSeconds: SPINEWHEEL_WINDUP_SECONDS,
      direction: { x: 1, y: 0 },
    });
    expect(result.movement).toMatchObject({ kind: "fixed", direction: { x: 1, y: 0 } });
    expect(result.warningFired).toBe(true);
  });

  it("starts each roll at the authored speed and rebound budget", () => {
    const result = stepSpinewheelBehavior(
      state({ phase: "windup", phaseRemainingSeconds: 0.05 }),
      input({ deltaSeconds: 0.05 }),
    );

    expect(result.state).toMatchObject({
      phase: "rolling",
      phaseRemainingSeconds: SPINEWHEEL_MAX_ROLL_SECONDS,
      speedMetresPerSecond: SPINEWHEEL_BASE_ROLL_SPEED,
      bouncesRemaining: SPINEWHEEL_MAX_REBOUNDS,
    });
  });

  it("resolves rolling movement and reports a swept player crossing", () => {
    const result = stepSpinewheelBehavior(
      state({ phase: "rolling", phaseRemainingSeconds: 2, direction: { x: 1, y: 0 } }),
      input({ position: { x: 2, y: 4 }, playerPosition: { x: 2.2, y: 4 } }),
    );

    expect(result.position.x).toBeCloseTo(2.35);
    expect(result.crossedPlayer).toBe(true);
    expect(result.recoveryFired).toBe(false);
  });

  it("decays speed on a permitted rebound", () => {
    const result = stepSpinewheelBehavior(
      state({
        phase: "rolling",
        phaseRemainingSeconds: 2,
        direction: { x: 1, y: 0 },
        bouncesRemaining: 2,
      }),
      input({ position: { x: 11.2, y: 4 }, playerPosition: { x: 2, y: 4 } }),
    );

    expect(result.bounceFired).toBe(true);
    expect(result.state.bouncesRemaining).toBe(1);
    expect(result.state.speedMetresPerSecond).toBeCloseTo(
      SPINEWHEEL_BASE_ROLL_SPEED * SPINEWHEEL_BOUNCE_SPEED_MULTIPLIER,
    );
    expect(result.state.direction.x).toBeLessThan(0);
  });

  it("enters exposed recovery instead of emitting a third rebound", () => {
    const result = stepSpinewheelBehavior(
      state({
        phase: "rolling",
        phaseRemainingSeconds: 2,
        direction: { x: 1, y: 0 },
        bouncesRemaining: 0,
      }),
      input({ position: { x: 11.2, y: 4 }, playerPosition: { x: 2, y: 4 } }),
    );

    expect(result.state).toMatchObject({
      phase: "recovery",
      phaseRemainingSeconds: SPINEWHEEL_RECOVERY_SECONDS,
      bouncesRemaining: 0,
    });
    expect(result.bounceFired).toBe(false);
    expect(result.recoveryFired).toBe(true);
  });
});

function state(overrides: Partial<SpinewheelState> = {}): SpinewheelState {
  return {
    phase: "positioning",
    phaseRemainingSeconds: 0.6,
    direction: { x: 1, y: 0 },
    speedMetresPerSecond: SPINEWHEEL_BASE_ROLL_SPEED,
    bouncesRemaining: SPINEWHEEL_MAX_REBOUNDS,
    playerHitCooldownSeconds: 0,
    ...overrides,
  };
}

function input(overrides: Partial<Parameters<typeof stepSpinewheelBehavior>[1]> = {}) {
  return {
    deltaSeconds: 0.05,
    position: { x: 4, y: 4 },
    playerPosition: { x: 8, y: 4 },
    positioningSpeedMetresPerSecond: 1.8,
    statusSpeedMultiplier: 1,
    radiusMetres: 0.68,
    playerRadiusMetres: 0.4,
    arena: EMPTY_ARENA,
    ...overrides,
  };
}
