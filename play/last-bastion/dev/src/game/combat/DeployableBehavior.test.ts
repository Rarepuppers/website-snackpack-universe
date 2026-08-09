import { describe, expect, it } from "vitest";
import { commitDeployableFire, stepDeployableBehavior, type DeployableBehaviorState } from "./DeployableBehavior";

const STRUCTURE: DeployableBehaviorState = {
  kind: "structure",
  position: { x: 2, y: 3 },
  health: 10,
  remainingSeconds: 1,
  cooldownSeconds: 0.1,
  orbitAngleRadians: 0,
  dead: false,
};

describe("DeployableBehavior", () => {
  it("expires a structure before advancing its firing cooldown", () => {
    const result = stepDeployableBehavior({ ...STRUCTURE, remainingSeconds: 0.05 }, {
      deltaSeconds: 0.05,
      playerPosition: { x: 5, y: 5 },
      widthMetres: 10,
      heightMetres: 8,
    });
    expect(result).toMatchObject({
      state: { dead: true, remainingSeconds: 0, cooldownSeconds: 0.1 },
      expired: true,
      requestsTarget: false,
    });
  });

  it("moves an auxiliary drone before requesting a target and clamps its orbit", () => {
    const result = stepDeployableBehavior({
      ...STRUCTURE,
      kind: "auxiliary-drone",
      position: { x: 0, y: 0 },
      remainingSeconds: Number.MAX_SAFE_INTEGER,
      cooldownSeconds: 0.05,
    }, {
      deltaSeconds: 0.05,
      playerPosition: { x: 0.2, y: 0.2 },
      widthMetres: 10,
      heightMetres: 8,
    });
    expect(result.state.orbitAngleRadians).toBeCloseTo(0.07);
    expect(result.state.position.x).toBeGreaterThan(1);
    expect(result.state.position.y).toBe(0.4);
    expect(result.requestsTarget).toBe(true);
  });

  it("commits the authored drone cadence or engineering-scaled structure cadence", () => {
    expect(commitDeployableFire(STRUCTURE, {
      fireIntervalSeconds: 0.4,
      deployFireIntervalSeconds: 1.2,
      engineeringScale: 1.5,
    }).cooldownSeconds).toBeCloseTo(0.8);
    expect(commitDeployableFire({ ...STRUCTURE, kind: "auxiliary-drone" }, {
      fireIntervalSeconds: 0.4,
      deployFireIntervalSeconds: 1.2,
      engineeringScale: 1.5,
    }).cooldownSeconds).toBe(0.4);
  });
});
