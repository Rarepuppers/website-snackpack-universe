import { describe, expect, it } from "vitest";
import { planProjectileArmourImpact } from "./ProjectileArmourImpact";

describe("ProjectileArmourImpact", () => {
  it("reduces a frontal Carapace hit and requests armour presentation", () => {
    expect(planProjectileArmourImpact({
      eliteKind: "carapace-scuttler",
      carapacePhase: "guard",
      projectileVelocity: { x: 1, y: 0 },
      enemyFacingDirection: { x: -1, y: 0 },
    })).toEqual({ damageMultiplier: 0.25, emitsArmourHit: true });
  });

  it("does not reduce recovery, non-Carapace, or threshold-edge impacts", () => {
    const base = {
      eliteKind: "carapace-scuttler",
      carapacePhase: "guard",
      projectileVelocity: { x: -1, y: 0 },
      enemyFacingDirection: { x: 0.25, y: 0 },
    };
    expect(planProjectileArmourImpact(base).damageMultiplier).toBe(1);
    expect(planProjectileArmourImpact({ ...base, carapacePhase: "recovery" }).damageMultiplier).toBe(1);
    expect(planProjectileArmourImpact({ ...base, eliteKind: null }).damageMultiplier).toBe(1);
  });

  it("treats zero-speed contact as non-frontal", () => {
    expect(planProjectileArmourImpact({
      eliteKind: "carapace-scuttler",
      carapacePhase: "guard",
      projectileVelocity: { x: 0, y: 0 },
      enemyFacingDirection: { x: 1, y: 0 },
    })).toEqual({ damageMultiplier: 1, emitsArmourHit: false });
  });
});
