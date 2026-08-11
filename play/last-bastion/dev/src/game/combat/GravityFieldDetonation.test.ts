import { describe, expect, it } from "vitest";
import { planGravityFieldDetonationImpact, stepGravityFieldLifetime } from "./GravityFieldDetonation";

describe("GravityFieldDetonation", () => {
  it("detonates an Event Horizon on expiry but silently expires a gravity pulse", () => {
    expect(stepGravityFieldLifetime({
      remainingSeconds: 0.1,
      deltaSeconds: 0.1,
      kind: "event-horizon",
    })).toEqual({ remainingSeconds: 0, expired: true, detonates: true });
    expect(stepGravityFieldLifetime({
      remainingSeconds: 0.1,
      deltaSeconds: 0.1,
      kind: "gravity-pulse",
    })).toEqual({ remainingSeconds: 0, expired: true, detonates: false });
  });

  it("keeps a positive-lifetime field active", () => {
    expect(stepGravityFieldLifetime({
      remainingSeconds: 1,
      deltaSeconds: 0.25,
      kind: "event-horizon",
    })).toEqual({ remainingSeconds: 0.75, expired: false, detonates: false });
  });

  it("includes a live target at the implosion edge and excludes dead or distant targets", () => {
    const candidate = { id: 1, position: { x: 2, y: 0 }, dead: false };
    const input = {
      candidate,
      fieldPosition: { x: 0, y: 0 },
      implosionRadiusMetres: 2,
      implosionDamage: 30,
    };
    expect(planGravityFieldDetonationImpact(input)).toEqual({ target: candidate, damage: 30 });
    expect(planGravityFieldDetonationImpact({
      ...input,
      candidate: { ...candidate, dead: true },
    })).toBeNull();
    expect(planGravityFieldDetonationImpact({
      ...input,
      candidate: { ...candidate, position: { x: 2.001, y: 0 } },
    })).toBeNull();
  });
});
