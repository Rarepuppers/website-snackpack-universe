import { describe, expect, it } from "vitest";
import { planUpgradeEffect } from "./UpgradeEffectPlanning";

describe("upgrade effect planning", () => {
  it("plans weapon geometry and scalar upgrades", () => {
    expect(planUpgradeEffect("twin-shot", 1)).toEqual({
      weapon: { projectileCountDelta: 1, minimumSpreadRadians: 0.11 },
    });
    const explosive = planUpgradeEffect("explosive-payload", 2);
    expect(explosive.weapon).toEqual({ minimumExplosionRadiusMetres: 1.8 });
    expect(explosive.minimumExplosionSplashMultiplier).toBeCloseTo(0.6);
    expect(planUpgradeEffect("field-magnet", 3)).toEqual({ magnetMultiplier: 1.5 });
  });

  it("plans level-specific elemental paths", () => {
    expect(planUpgradeEffect("incendiary-rounds", 1)).toEqual({ weapon: { damageType: "fire" } });
    expect(planUpgradeEffect("incendiary-rounds", 2)).toEqual({
      status: { buildupMultiplierSet: { fire: 1.2 }, blazeBonusDamagePerSecond: 0.3 },
    });
    expect(planUpgradeEffect("cryo-coating", 3)).toEqual({
      status: { freezeDurationBonusSeconds: 0.8, freezeSpeedMultiplierOverride: 0.15 },
    });
    expect(planUpgradeEffect("corrosive-rounds", 3)).toEqual({
      status: { corrodeBonusDamagePerSecond: 0.7 },
    });
  });

  it("plans additive buildup, defence, support, and economy changes", () => {
    expect(planUpgradeEffect("catalyst-array", 1)).toEqual({
      status: { buildupMultiplierDelta: { fire: 0.15, shock: 0.15, cryo: 0.15, toxic: 0.15 } },
    });
    expect(planUpgradeEffect("kinetic-buffer", 2)).toEqual({
      defence: { hitInvulnerabilitySecondsDelta: 0.05, slowResistanceDelta: 0.25 },
    });
    expect(planUpgradeEffect("field-transfusion", 1)).toEqual({ supportEffectMultiplier: 1.25 });
    expect(planUpgradeEffect("salvage-drones", 1)).toEqual({ scrapMultiplier: 1.2 });
  });
});
