import { describe, expect, it } from "vitest";
import {
  FOUNDRY_TURRET_COOLDOWN_SECONDS,
  FOUNDRY_TURRET_RECOVERY_SECONDS,
  FOUNDRY_TURRET_WARNING_SECONDS,
  stepFoundryChildBehavior,
  type FoundryChildBehaviorState,
} from "./FoundryChildBehavior";

const TRACKING: FoundryChildBehaviorState = {
  remainingSeconds: 12,
  turretPhase: "tracking",
  turretPhaseRemainingSeconds: 0,
  turretTarget: { x: 0, y: 0 },
  attackCooldownSeconds: 0,
};

describe("FoundryChildBehavior", () => {
  it("powers down deterministically and gives owner defeat precedence", () => {
    const ownerDefeated = step(false, false, { ...TRACKING, remainingSeconds: 0.01 }, 0.05);
    expect(ownerDefeated.powerDownReason).toBe("owner-defeated");
    expect(ownerDefeated.movement.kind).toBe("none");
    expect(step(true, false, { ...TRACKING, remainingSeconds: 0.01 }, 0.05).powerDownReason).toBe("expired");
  });

  it("moves drones and advances a turret through warning, fire, and recovery", () => {
    expect(step(true, true, TRACKING, 0.05).movement).toMatchObject({
      kind: "fixed", speedMetresPerSecond: 2.4,
    });
    const warning = step(true, false, TRACKING, 0.05);
    expect(warning.warningStarted).toBe(true);
    expect(warning.state).toMatchObject({
      turretPhase: "warning", turretPhaseRemainingSeconds: FOUNDRY_TURRET_WARNING_SECONDS,
    });
    const fired = step(true, false, { ...warning.state, turretPhaseRemainingSeconds: 0.01 }, 0.05);
    expect(fired.firesTurret).toBe(true);
    expect(fired.state).toMatchObject({
      turretPhase: "recovery",
      turretPhaseRemainingSeconds: FOUNDRY_TURRET_RECOVERY_SECONDS,
      attackCooldownSeconds: FOUNDRY_TURRET_COOLDOWN_SECONDS,
    });
    expect(step(true, false, { ...fired.state, turretPhaseRemainingSeconds: 0.01 }, 0.05).state.turretPhase)
      .toBe("tracking");
  });
});

function step(
  ownerAlive: boolean,
  mobile: boolean,
  state: FoundryChildBehaviorState,
  deltaSeconds: number,
) {
  return stepFoundryChildBehavior(state, {
    deltaSeconds,
    ownerAlive,
    mobile,
    position: { x: 0, y: 0 },
    playerPosition: { x: 8, y: 0 },
    movementSpeedMetresPerSecond: 2.4,
  });
}
