import { describe, expect, it } from "vitest";
import {
  beginAurumHoarderFlee,
  shouldAurumHoarderEscape,
  stepAurumHoarderBehavior,
  type AurumHoarderBehaviorState,
} from "./AurumHoarderBehavior";

const FORAGING: AurumHoarderBehaviorState = {
  phase: "forage",
  phaseRemainingSeconds: 3,
  exitTarget: { x: 44.3, y: 12 },
};

describe("AurumHoarderBehavior", () => {
  it("forages away from the player and requests a post-movement transition", () => {
    const result = stepAurumHoarderBehavior(FORAGING, {
      deltaSeconds: 3,
      position: { x: 20, y: 12 },
      playerPosition: { x: 22, y: 12 },
      forageSpeedMetresPerSecond: 1.35,
      fleeSpeedMetresPerSecond: 2.8,
    });
    expect(result.state.phase).toBe("forage");
    expect(result.beginsFleeing).toBe(true);
    expect(result.movement).toMatchObject({ kind: "fixed", speedMetresPerSecond: 1.35 });
    expect(result.facingDirection.x).toBeLessThan(0);
  });

  it("selects its exit after movement and escapes by range or timer", () => {
    const fleeing = beginAurumHoarderFlee(FORAGING, { x: 19.8, y: 12 }, { x: 22, y: 12 }, 45, 25);
    expect(fleeing).toMatchObject({ phase: "flee", phaseRemainingSeconds: 9 });
    expect(fleeing.exitTarget.x).toBeCloseTo(44.3);
    expect(shouldAurumHoarderEscape(fleeing, { x: 44.2, y: 12 })).toBe(true);
    expect(shouldAurumHoarderEscape({ ...fleeing, phaseRemainingSeconds: 0 }, { x: 10, y: 12 })).toBe(true);
    expect(shouldAurumHoarderEscape(fleeing, { x: 10, y: 12 })).toBe(false);
  });
});
