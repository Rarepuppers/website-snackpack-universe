import { describe, expect, it } from "vitest";
import { lockVoltaicSecondaryLane } from "./VoltaicWardenBeam";

describe("Voltaic Warden chained lane", () => {
  it("locks a distinct, finite secondary lane", () => {
    const lane = lockVoltaicSecondaryLane({ x: 2, y: 5 }, { x: 8, y: 5 }, [], 1)!;
    expect(lane.direction.y).toBeGreaterThan(0);
    expect(lane.to).not.toEqual({ x: 8, y: 5 });
  });
});
