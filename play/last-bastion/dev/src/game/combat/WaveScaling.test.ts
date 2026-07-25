import { describe, expect, it } from "vitest";
import {
  ENEMY_HIT_CAP,
  RANKED_ENEMY_HIT_CAP,
  scaleEnemyHealth,
  scaleEnemyHit,
  waveScaling,
} from "./WaveScaling";

describe("authored per-wave scaling", () => {
  it("uses base values on wave one and non-compounding growth thereafter", () => {
    expect(waveScaling(1, "scuttler")).toEqual({
      healthMultiplier: 1, armourBonus: 0, maxShield: 0, speedMultiplier: 1, damageMultiplier: 1,
      radiusMultiplier: 1,
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
      radiusMultiplier: 1,
    });
  });

  it("caps every scaled hit at five damage, and higher for ranked enemies", () => {
    expect(scaleEnemyHit(3, waveScaling(10, "scuttler"))).toBe(ENEMY_HIT_CAP);
    // Mini-boss move baselines already sit at 4.4-5, so without the raised cap
    // their damage scaling would be clamped away entirely.
    expect(scaleEnemyHit(5, waveScaling(10, "scuttler"), RANKED_ENEMY_HIT_CAP)).toBe(RANKED_ENEMY_HIT_CAP);
  });

  it("scales mini-bosses with depth, more gently than elites so the telegraphs stay readable", () => {
    // The bug this fixes: mini-bosses used to be pinned at 1x forever, making a
    // column-7 mini-boss less threatening than the elites escorting it.
    const early = waveScaling(1, "siege-crusher", { miniBoss: true });
    expect(early.speedMultiplier).toBe(1);
    expect(early.damageMultiplier).toBe(1);
    expect(early.radiusMultiplier).toBe(1);

    const late = waveScaling(9, "siege-crusher", { miniBoss: true });
    expect(late.healthMultiplier).toBeCloseTo(2.44);
    expect(late.speedMultiplier).toBeCloseTo(1.16);
    expect(late.damageMultiplier).toBeCloseTo(1.6); // capped
    expect(late.radiusMultiplier).toBeCloseTo(1.24);

    // Gentler than the elite curve on every axis that can outrun a telegraph.
    const lateElite = waveScaling(9, "scuttler", { elite: true });
    expect(late.speedMultiplier).toBeLessThan(lateElite.speedMultiplier);
    expect(late.damageMultiplier).toBeLessThan(lateElite.damageMultiplier);
  });
});
