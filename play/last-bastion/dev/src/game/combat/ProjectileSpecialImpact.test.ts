import { describe, expect, it } from "vitest";
import { planProjectileSpecialImpact } from "./ProjectileSpecialImpact";

describe("ProjectileSpecialImpact", () => {
  it("requests the one-shot gravity pulse independently of ordinary impact routing", () => {
    expect(planProjectileSpecialImpact({
      triggersGravityPulse: true, spawnsGravityWellOnImpact: false,
      weaponId: "service-rifle", hitCount: 1,
    })).toEqual({ triggersGravityPulse: true, routesToGravityWell: false, boltHitIndex: null });
  });

  it("routes gravity-well impacts terminally before Bolt presentation", () => {
    expect(planProjectileSpecialImpact({
      triggersGravityPulse: true, spawnsGravityWellOnImpact: true,
      weaponId: "bolt-carbine", hitCount: 1,
    })).toEqual({ triggersGravityPulse: true, routesToGravityWell: true, boltHitIndex: null });
  });

  it("uses Bolt's first-hit presentation once and its follow-up presentation thereafter", () => {
    const plan = (hitCount: number) => planProjectileSpecialImpact({
      triggersGravityPulse: false, spawnsGravityWellOnImpact: false,
      weaponId: "bolt-carbine", hitCount,
    }).boltHitIndex;
    expect([plan(1), plan(2), plan(3)]).toEqual([1, 2, 2]);
  });
});
