import { describe, expect, it } from "vitest";
import {
  ARTIFACT_CATALOG,
  ARTIFACT_IDS,
  NO_RELIC_MODIFIERS,
  RELIC_CATALOG,
  RELIC_IDS,
  artifactById,
  isArtifactId,
  isRelicId,
  relicById,
  resolveRelicModifiers,
} from "./relicCatalog";

describe("relic/artifact catalog integrity", () => {
  it("has six relics and three artifacts with unique ids and copy", () => {
    expect(RELIC_CATALOG).toHaveLength(6);
    expect(ARTIFACT_CATALOG).toHaveLength(3);
    expect(new Set(RELIC_IDS).size).toBe(6);
    expect(new Set(ARTIFACT_IDS).size).toBe(3);
    for (const relic of RELIC_CATALOG) {
      expect(relic.id.startsWith("rel-")).toBe(true);
      expect(relic.name.length).toBeGreaterThan(0);
      expect(relic.description.length).toBeGreaterThan(0);
    }
    for (const artifact of ARTIFACT_CATALOG) {
      expect(artifact.id.startsWith("art-")).toBe(true);
    }
  });

  it("guards ids and looks up definitions", () => {
    expect(isRelicId("rel-blast-baffle")).toBe(true);
    expect(isRelicId("art-event-horizon-core")).toBe(false);
    expect(isRelicId(42)).toBe(false);
    expect(isArtifactId("art-broodbreaker-seal")).toBe(true);
    expect(isArtifactId("rel-blast-baffle")).toBe(false);
    expect(relicById("rel-kinetic-greaves").name).toBe("Kinetic Greaves");
    expect(artifactById("art-last-bastion-protocol").name).toBe("Last Bastion Protocol");
  });
});

describe("resolveRelicModifiers", () => {
  it("returns the neutral bag for no relics and no artifact", () => {
    expect(resolveRelicModifiers([], null)).toEqual(NO_RELIC_MODIFIERS);
    expect(resolveRelicModifiers(null, undefined)).toEqual(NO_RELIC_MODIFIERS);
  });

  it("applies each relic's effect", () => {
    expect(resolveRelicModifiers(["rel-stabiliser-gyro"], null).movingSpreadMultiplier).toBeLessThan(1);
    const capacitor = resolveRelicModifiers(["rel-salvaged-capacitor"], null);
    expect(capacitor.chainArcEveryNthAttack).toBe(5);
    expect(capacitor.chainArcDamage).toBeGreaterThan(0);
    const baffle = resolveRelicModifiers(["rel-blast-baffle"], null);
    expect(baffle.selfExplosiveDamageMultiplier).toBe(0.5);
    expect(baffle.explosionRadiusMultiplier).toBeGreaterThan(1);
    expect(resolveRelicModifiers(["rel-hunters-beacon"], null).eliteMarkedEarlier).toBe(true);
    expect(resolveRelicModifiers(["rel-field-lattice"], null).healthPickupSlowPulse).toBe(true);
    const greaves = resolveRelicModifiers(["rel-kinetic-greaves"], null);
    expect(greaves.evasiveDistanceMultiplier).toBeGreaterThan(1);
    expect(greaves.evasiveRecoveryMultiplier).toBeGreaterThan(1);
  });

  it("aggregates several relics at once", () => {
    const combined = resolveRelicModifiers(["rel-stabiliser-gyro", "rel-blast-baffle", "rel-kinetic-greaves"], null);
    expect(combined.movingSpreadMultiplier).toBeLessThan(1);
    expect(combined.selfExplosiveDamageMultiplier).toBe(0.5);
    expect(combined.evasiveDistanceMultiplier).toBeGreaterThan(1);
  });

  it("applies a duplicate relic id only once (no double-stacking)", () => {
    const once = resolveRelicModifiers(["rel-blast-baffle"], null);
    const twice = resolveRelicModifiers(["rel-blast-baffle", "rel-blast-baffle"], null);
    expect(twice).toEqual(once);
  });

  it("ignores unknown ids without throwing", () => {
    const modifiers = resolveRelicModifiers(["rel-does-not-exist" as never, "rel-field-lattice"], null);
    expect(modifiers.healthPickupSlowPulse).toBe(true);
  });

  it("equips exactly one artifact's effect", () => {
    const core = resolveRelicModifiers([], "art-event-horizon-core");
    expect(core.equippedArtifactId).toBe("art-event-horizon-core");
    expect(core.implosionEverySeconds).toBeGreaterThan(0);
    expect(core.eggDeathDamage).toBe(0);

    const seal = resolveRelicModifiers([], "art-broodbreaker-seal");
    expect(seal.eggDeathDamage).toBeGreaterThan(0);
    expect(seal.preventHatchDuringCrack).toBe(true);
    expect(seal.implosionEverySeconds).toBeNull();

    const protocol = resolveRelicModifiers([], "art-last-bastion-protocol");
    expect(protocol.criticalHealthBraceFormation).toBe(true);
  });

  it("combines relics and an artifact in one bag", () => {
    const bag = resolveRelicModifiers(["rel-salvaged-capacitor"], "art-last-bastion-protocol");
    expect(bag.chainArcEveryNthAttack).toBe(5);
    expect(bag.criticalHealthBraceFormation).toBe(true);
  });
});
