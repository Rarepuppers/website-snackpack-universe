import { describe, expect, it } from "vitest";
import { WEAPON_CATALOG, type WeaponId } from "../content/weaponCatalog";
import {
  PROJECTILE_PRESENTATIONS,
  projectilePresentation,
  projectileTrailLength,
} from "./ProjectilePresentation";

const ids = Object.keys(WEAPON_CATALOG) as WeaponId[];
const projectileIds = ids.filter((id) => {
  const pattern = WEAPON_CATALOG[id].attackPattern;
  return pattern === "projectile" || pattern === "scatter" || pattern === "chain-projectile" || id === "sentry-stake";
});

describe("friendly projectile presentation", () => {
  it("makes an exhaustive decision for every weapon", () => {
    expect(Object.keys(PROJECTILE_PRESENTATIONS).sort()).toEqual([...ids].sort());
    expect(projectileIds).toHaveLength(18);
    for (const id of ids) {
      expect(PROJECTILE_PRESENTATIONS[id] !== null).toBe(projectileIds.includes(id));
    }
  });

  it("gives every emitted projectile a readable body, halo, trail, and impact", () => {
    for (const id of projectileIds) {
      const presentation = projectilePresentation(id);
      expect(presentation.scale * 64, `${id} body span`).toBeGreaterThanOrEqual(20);
      expect(presentation.haloRadius, `${id} halo`).toBeGreaterThanOrEqual(5);
      expect(presentation.trailLength, `${id} trail`).toBeGreaterThanOrEqual(12);
      expect(presentation.impact.durationMilliseconds, `${id} impact`).toBeGreaterThan(0);
    }
  });

  it("keeps authored scales authoritative and strengthens the Marine tracer", () => {
    expect(projectilePresentation("marauder-ar").scale).toBe(0.42);
    expect(projectilePresentation("bastion-service-rifle")).toMatchObject({
      scale: 0.48,
      tintWithWeaponColor: true,
    });
  });

  it("removes motion trails without removing projectile presentation", () => {
    expect(projectileTrailLength("bastion-service-rifle", false)).toBe(20);
    expect(projectileTrailLength("bastion-service-rifle", true)).toBe(0);
    expect(projectilePresentation("bastion-service-rifle").haloRadius).toBeGreaterThan(0);
  });
});
