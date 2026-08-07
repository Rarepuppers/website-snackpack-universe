import { describe, expect, it } from "vitest";
import { healthBarView } from "./formatStat";

/** §11.2 of the improvement plan: shield as a blue bar on the health bar's scale. */
describe("healthBarView", () => {
  it("fills proportionally at partial health", () => {
    expect(healthBarView(6, 12, 0, 0).healthFraction).toBeCloseTo(0.5);
  });

  it("clamps the health fill so it can never leave its frame", () => {
    // The overheal case. Before the clamp the fill scaled past 1 and overflowed
    // the bar the moment health could exceed maximum.
    expect(healthBarView(16, 12, 0, 0).healthFraction).toBe(1);
  });

  it("never returns a negative fraction when health is below zero", () => {
    expect(healthBarView(-5, 12, 0, 0).healthFraction).toBe(0);
  });

  it("survives a zero maximum without dividing by zero", () => {
    const view = healthBarView(0, 0, 0, 0);
    expect(Number.isFinite(view.healthFraction)).toBe(true);
    expect(view.healthFraction).toBe(0);
  });

  it("scales shield against MAX HEALTH, not against max shield", () => {
    // The whole point: 3 shield on a 12 HP pool must read as a quarter of the
    // bar. Scaling against maxShield would make 3/3 shield look like a full
    // second health bar.
    expect(healthBarView(12, 12, 3, 3).shieldFraction).toBeCloseTo(0.25);
  });

  it("gives one shield point the same width as one health point", () => {
    const health = healthBarView(4, 16, 0, 0).healthFraction;
    const shield = healthBarView(16, 16, 4, 8).shieldFraction;
    expect(shield).toBeCloseTo(health);
  });

  it("hides both shield elements entirely when the hero has no shield capacity", () => {
    const view = healthBarView(12, 12, 0, 0);
    expect(view.shieldTrackVisible).toBe(false);
    expect(view.shieldFillVisible).toBe(false);
  });

  it("keeps the track visible while shield is depleted so recharge is legible", () => {
    const view = healthBarView(12, 12, 0, 3);
    expect(view.shieldTrackVisible).toBe(true);
    expect(view.shieldFillVisible).toBe(false);
  });

  it("shows the fill once any shield is present", () => {
    expect(healthBarView(12, 12, 0.5, 3).shieldFillVisible).toBe(true);
  });

  it("clamps a shield larger than the health pool", () => {
    expect(healthBarView(4, 4, 99, 99).shieldFraction).toBe(1);
  });
});
