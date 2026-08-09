import { describe, expect, it } from "vitest";
import { planProjectileExplosionRoute } from "./ProjectileExplosionRoute";

const plan = (overrides: Partial<Parameters<typeof planProjectileExplosionRoute>[0]> = {}) => (
  planProjectileExplosionRoute({
    eventHorizonCoreArmed: false,
    spawnsGravityWellOnImpact: false,
    explosionRadiusMetres: 0,
    artifactDurationSeconds: 1,
    artifactPullStrengthMetresPerSecond: 2,
    artifactPullRadiusMetres: 3,
    artifactImplosionRadiusMetres: 4,
    ...overrides,
  })
);

describe("ProjectileExplosionRoute", () => {
  it("routes an armed ordinary projectile into an artifact field and enforces minimum radius", () => {
    expect(plan({ eventHorizonCoreArmed: true, explosionRadiusMetres: 2 })).toEqual({
      kind: "artifact-field",
      consumesEventHorizonCore: true,
      pullFieldDurationSeconds: 1,
      pullStrengthMetresPerSecond: 2,
      pullRadiusMetres: 3,
      explosionRadiusMetres: 4,
    });
  });

  it("keeps native gravity wells ahead of ordinary routing without consuming the artifact", () => {
    expect(plan({
      eventHorizonCoreArmed: true,
      spawnsGravityWellOnImpact: true,
      explosionRadiusMetres: 2,
    })).toEqual({ kind: "gravity-well", consumesEventHorizonCore: false });
  });

  it("distinguishes ordinary explosions from zero-radius no-ops", () => {
    expect(plan({ explosionRadiusMetres: 0.5 }).kind).toBe("ordinary");
    expect(plan().kind).toBe("none");
  });
});
