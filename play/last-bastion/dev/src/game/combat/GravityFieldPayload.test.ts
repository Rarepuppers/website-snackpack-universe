import { describe, expect, it } from "vitest";
import { planEventHorizonFieldPayload, planGravityPulseFieldPayload } from "./GravityFieldPayload";

describe("GravityFieldPayload", () => {
  it("constructs an Event Horizon field with matched initial lifetime and implosion payload", () => {
    const position = { x: 2, y: 3 };
    const result = planEventHorizonFieldPayload({
      position,
      durationSeconds: 1.5,
      pullStrengthMetresPerSecond: 4,
      pullRadiusMetres: 3,
      implosionRadiusMetres: 2,
      implosionDamage: 25,
      damageType: "energy",
      weaponId: "event-horizon",
    });
    expect(result).toEqual({
      position,
      remainingSeconds: 1.5,
      durationSeconds: 1.5,
      pullStrengthMetresPerSecond: 4,
      pullRadiusMetres: 3,
      implosionRadiusMetres: 2,
      implosionDamage: 25,
      damageType: "energy",
      weaponId: "event-horizon",
      kind: "event-horizon",
    });
    expect(result.position).not.toBe(position);
  });

  it("constructs a non-damaging physical gravity pulse", () => {
    expect(planGravityPulseFieldPayload({
      position: { x: 1, y: 1 },
      durationSeconds: 0.4,
      pullStrengthMetresPerSecond: 5,
      pullRadiusMetres: 2.5,
      weaponId: "service-rifle",
    })).toMatchObject({
      remainingSeconds: 0.4,
      durationSeconds: 0.4,
      implosionRadiusMetres: 0,
      implosionDamage: 0,
      damageType: "physical",
      kind: "gravity-pulse",
    });
  });
});
