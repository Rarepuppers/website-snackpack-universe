import { describe, expect, it } from "vitest";
import { ENEMY_CATALOG } from "../content/enemyCatalog";
import { WEAPON_CATALOG } from "../content/weaponCatalog";
import { PLAYER_ATTACK_DAMAGE_BASELINES, PLAYER_MAX_HEALTH } from "./CombatSimulation";
import { STATUS_BUILDUP_THRESHOLD, STATUS_RULES } from "./damageTypes";

describe("2-damage combat scale", () => {
  it("locks the starter two-bullet Scuttler rule", () => {
    const rifleDamage = WEAPON_CATALOG["bastion-service-rifle"].projectileDamage;
    const scuttlerHealth = ENEMY_CATALOG.scuttler.maxHealth;

    expect(rifleDamage).toBe(2);
    expect(scuttlerHealth - rifleDamage).toBeGreaterThan(0);
    expect(scuttlerHealth - rifleDamage * 2).toBe(0);
  });

  it("keeps every authored enemy hit at or below half fresh Marine health", () => {
    const authoredAttacks = Object.values(PLAYER_ATTACK_DAMAGE_BASELINES);
    const contactAttacks = Object.values(ENEMY_CATALOG).map((enemy) => enemy.contactDamage);

    expect(PLAYER_MAX_HEALTH).toBe(10);
    expect(Math.max(...authoredAttacks, ...contactAttacks)).toBeLessThanOrEqual(PLAYER_MAX_HEALTH / 2);
  });

  it("rescales status magnitudes and buildup with direct damage", () => {
    expect(STATUS_BUILDUP_THRESHOLD).toBe(8);
    expect(STATUS_RULES.blaze.damagePerSecond).toBe(0.5);
    expect(STATUS_RULES.blaze.durationSeconds).toBe(3);
  });
});
