import { describe, expect, it, vi } from "vitest";
import { projectileContactsEnemy } from "./ProjectileEnemyContact";

const target = { id: 7, position: { x: 1, y: 0 }, dead: false };

describe("ProjectileEnemyContact", () => {
  it("includes contact exactly on the supplied collision radius", () => {
    expect(projectileContactsEnemy({
      projectilePosition: { x: 0, y: 0 }, target, hitEnemyIds: new Set(), contactRadiusMetres: () => 1,
    })).toBe(true);
  });

  it("rejects dead and previously hit targets", () => {
    const contactRadiusMetres = vi.fn(() => 2);
    expect(projectileContactsEnemy({
      projectilePosition: { x: 0, y: 0 }, target: { ...target, dead: true },
      hitEnemyIds: new Set(), contactRadiusMetres,
    })).toBe(false);
    expect(projectileContactsEnemy({
      projectilePosition: { x: 0, y: 0 }, target,
      hitEnemyIds: new Set([target.id]), contactRadiusMetres: () => 2,
    })).toBe(false);
    expect(contactRadiusMetres).not.toHaveBeenCalled();
  });

  it("rejects a live unhit target beyond the collision radius", () => {
    expect(projectileContactsEnemy({
      projectilePosition: { x: 0, y: 0 }, target, hitEnemyIds: new Set(), contactRadiusMetres: () => 0.999,
    })).toBe(false);
  });
});
