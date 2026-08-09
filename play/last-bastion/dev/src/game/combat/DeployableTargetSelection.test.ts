import { describe, expect, it } from "vitest";
import { selectDeployableTarget } from "./DeployableTargetSelection";

const target = (id: number, x: number, dead = false) => ({
  id,
  position: { x, y: 0 },
  dead,
  label: `target-${id}`,
});

describe("DeployableTargetSelection", () => {
  it("selects the nearest live target", () => {
    const result = selectDeployableTarget({
      targets: [target(1, 0.5, true), target(2, 3), target(3, 1)],
      origin: { x: 0, y: 0 },
      rangeMetres: 4,
    });
    expect(result?.label).toBe("target-3");
  });

  it("breaks equal-distance ties on the lower entity ID", () => {
    const result = selectDeployableTarget({
      targets: [target(9, -2), target(4, 2)],
      origin: { x: 0, y: 0 },
      rangeMetres: 3,
    });
    expect(result?.id).toBe(4);
  });

  it("preserves strict range exclusion at the exact boundary", () => {
    expect(selectDeployableTarget({
      targets: [target(1, 3)],
      origin: { x: 0, y: 0 },
      rangeMetres: 3,
    })).toBeNull();
  });
});
