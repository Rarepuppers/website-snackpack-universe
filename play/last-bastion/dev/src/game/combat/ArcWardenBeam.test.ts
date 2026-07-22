import { describe, expect, it } from "vitest";
import type { ArenaObstacle } from "../arena/ArenaDefinition";
import {
  ARC_WARDEN_CHARGE_SECONDS,
  ARC_WARDEN_COOLDOWN_SECONDS,
  ARC_WARDEN_DISCHARGE_SECONDS,
  ARC_WARDEN_RECOVERY_SECONDS,
  createArcWardenBehavior,
  lockArcWardenLane,
  pointInsideArcWardenLane,
  stepArcWardenBehavior,
} from "./ArcWardenBeam";

const cover: ArenaObstacle = {
  id: "beam-cover",
  kind: "reinforced-cover",
  x: 4,
  y: 1,
  width: 1,
  height: 2,
};

describe("Arc Warden fixed-beam boundary", () => {
  it("locks aim through the complete charge even when the player moves", () => {
    let state = createArcWardenBehavior();
    state = stepArcWardenBehavior(state, 0.5, { x: 1, y: 2 }, { x: 7, y: 2 }, []).state;
    expect(state).toMatchObject({
      phase: "charge",
      phaseRemainingSeconds: ARC_WARDEN_CHARGE_SECONDS,
      lockedLane: { from: { x: 1, y: 2 }, direction: { x: 1, y: 0 } },
    });

    const fired = stepArcWardenBehavior(
      state,
      ARC_WARDEN_CHARGE_SECONDS,
      { x: 1, y: 2 },
      { x: 1, y: 8 },
      [],
    );
    expect(fired.discharged).toBe(true);
    expect(fired.state).toMatchObject({
      phase: "discharge",
      phaseRemainingSeconds: ARC_WARDEN_DISCHARGE_SECONDS,
      lockedLane: { direction: { x: 1, y: 0 } },
    });
  });

  it("terminates at first cover and never represents a downstream chain", () => {
    const lane = lockArcWardenLane({ x: 1, y: 2 }, { x: 8, y: 2 }, [cover]);
    expect(lane).not.toBeNull();
    expect(lane).toMatchObject({ to: { x: 4, y: 2 }, blockedByObstacleId: "beam-cover" });
    expect(lane!.unclippedTo.x).toBeGreaterThan(4);
    expect(pointInsideArcWardenLane({ x: 3.5, y: 2 }, lane!)).toBe(true);
    expect(pointInsideArcWardenLane({ x: 6, y: 2 }, lane!)).toBe(false);
  });

  it("uses narrow player-radius geometry with an endpoint-inclusive hit", () => {
    const lane = lockArcWardenLane({ x: 1, y: 2 }, { x: 8, y: 2 }, [])!;
    expect(pointInsideArcWardenLane({ x: lane.to.x, y: lane.to.y }, lane, 0.32)).toBe(true);
    expect(pointInsideArcWardenLane({ x: 5, y: 2.7 }, lane, 0.32)).toBe(false);
  });

  it("discharges once, recovers in place, then enforces a repeat cooldown", () => {
    let state = createArcWardenBehavior();
    state = stepArcWardenBehavior(state, 0.5, { x: 1, y: 2 }, { x: 7, y: 2 }, []).state;
    const discharge = stepArcWardenBehavior(state, ARC_WARDEN_CHARGE_SECONDS, { x: 1, y: 2 }, { x: 7, y: 2 }, []);
    expect(discharge.discharged).toBe(true);
    const recovery = stepArcWardenBehavior(discharge.state, ARC_WARDEN_DISCHARGE_SECONDS, { x: 1, y: 2 }, { x: 7, y: 2 }, []);
    expect(recovery).toMatchObject({
      discharged: false,
      state: { phase: "recovery", phaseRemainingSeconds: ARC_WARDEN_RECOVERY_SECONDS },
    });
    const ready = stepArcWardenBehavior(recovery.state, ARC_WARDEN_RECOVERY_SECONDS, { x: 1, y: 2 }, { x: 7, y: 2 }, []);
    expect(ready).toMatchObject({
      discharged: false,
      state: { phase: "reposition", cooldownSeconds: ARC_WARDEN_COOLDOWN_SECONDS, lockedLane: null },
    });
  });
});
