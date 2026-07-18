import { describe, expect, it } from "vitest";
import { scaleEnemyHealth, scaleEnemyHit, waveScaling } from "./WaveScaling";

describe("authored per-wave scaling", () => {
  it("uses base values on wave one and non-compounding growth thereafter", () => {
    expect(waveScaling(1, "scuttler")).toEqual({
      healthMultiplier: 1, armourBonus: 0, maxShield: 0, speedMultiplier: 1, damageMultiplier: 1,
    });
    const waveFour = waveScaling(4, "scuttler");
    expect(scaleEnemyHealth(4, waveFour)).toBeCloseTo(7.36);
    expect(waveFour.armourBonus).toBe(1);
    expect(waveFour.speedMultiplier).toBeCloseTo(1.09);
    expect(waveFour.damageMultiplier).toBeCloseTo(1.45);
  });

  it("adds late shields only to eligible units and leaves bosses authored", () => {
    expect(waveScaling(5, "quillback").maxShield).toBe(2);
    expect(waveScaling(5, "scuttler").maxShield).toBe(0);
    expect(waveScaling(9, "scuttler", { elite: true }).maxShield).toBe(10);
    expect(waveScaling(9, "siege-crusher", { boss: true })).toEqual({
      healthMultiplier: 1, armourBonus: 0, maxShield: 0, speedMultiplier: 1, damageMultiplier: 1,
    });
  });

  it("caps every scaled hit at five damage", () => {
    expect(scaleEnemyHit(3, waveScaling(10, "scuttler"))).toBe(5);
  });
});
