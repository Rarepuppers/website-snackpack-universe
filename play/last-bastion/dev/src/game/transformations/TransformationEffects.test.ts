import { describe, expect, it } from "vitest";
import {
  NO_TRANSFORMATION_MODIFIERS,
  resolveTransformationModifiers,
} from "./TransformationRunModifiers";
import {
  TRANSFORMATION_CHOICE_CATALOG,
  type TransformationEffectMetric,
} from "./TransformationChoiceCatalog";

/**
 * Transformation choices had the same disease as the relics: a committed path
 * set its modifier fields and combat read only half of them, so several
 * headline boons were purely cosmetic — a player could commit a path and get
 * nothing. These guards make that visible at the catalogue level instead of one
 * grep at a time.
 */

/** Metrics the resolver folds into the run-modifier bag. */
const CONSUMED: readonly TransformationEffectMetric[] = [
  "maximum-health", "movement-speed", "armour", "maximum-shield", "shield-recharge-rate",
  "fire-rate", "blast-radius", "ultimate-cooldown", "healing-received", "pickup-radius",
  "health-regeneration-per-second", "long-range-damage", "close-range-damage", "heavy-weapon-damage",
  "retaliation-damage", "nearby-kill-healing", "evasive-cooldown", "evasive-distance",
  "weapon-spread", "projectile-speed", "corrode-buildup", "telekinetic-push-distance",
  "drone-shot-damage",
  "gravity-pulse-radius",
];

/**
 * Metrics with no consumer, and why. Deliberately an allow-list so a newly
 * authored metric cannot quietly join the inert pile.
 */
const KNOWN_UNCONSUMED: Readonly<Record<string, string>> = Object.freeze({
  // Scars. The player never takes typed elemental damage or status buildup, so
  // these cannot be honoured — but they are DOWNSIDES, and deleting them would
  // strictly buff their paths rather than fix anything. Left deliberately.
  "fire-damage-received": "player takes no typed elemental damage",
  "shock-buildup-received": "player receives no status buildup",
});

function authoredMetrics(): Set<TransformationEffectMetric> {
  const metrics = new Set<TransformationEffectMetric>();
  for (const choice of TRANSFORMATION_CHOICE_CATALOG) {
    for (const trait of [choice.boon, choice.scar]) {
      for (const effect of trait.effects) metrics.add(effect.metric);
    }
  }
  return metrics;
}

describe("transformation effect coverage", () => {
  it("accounts for every authored metric — consumed, or explicitly explained", () => {
    const unaccounted = [...authoredMetrics()].filter((metric) => (
      !CONSUMED.includes(metric) && !(metric in KNOWN_UNCONSUMED)
    ));
    expect(unaccounted, "authored metric with no consumer and no explanation").toEqual([]);
  });

  it("keeps the allow-list honest — every exception is still authored and still unwired", () => {
    const authored = authoredMetrics();
    for (const metric of Object.keys(KNOWN_UNCONSUMED) as TransformationEffectMetric[]) {
      expect(authored.has(metric), `${metric} is allow-listed but no longer authored`).toBe(true);
      expect(CONSUMED.includes(metric), `${metric} is now wired — remove it from the allow-list`).toBe(false);
    }
  });

  it("does not claim to consume a metric nobody authors", () => {
    const authored = authoredMetrics();
    for (const metric of CONSUMED) {
      expect(authored.has(metric), `${metric} is listed as consumed but is not authored`).toBe(true);
    }
  });
});

describe("newly wired transformation metrics", () => {
  function committed(pathId: string, choiceId: string, ranks = 1) {
    return {
      committedPathId: pathId,
      paths: [{ pathId, affinity: 3, choiceIds: Array(ranks).fill(choiceId) }],
    } as never;
  }

  it("resolves Reactive Blood's retaliation damage", () => {
    const resolved = resolveTransformationModifiers(committed("mutagenic-evolution", "reactive-blood"));
    expect(resolved.retaliationDamage).toBeGreaterThan(0);
  });

  it("resolves Feeding Tendrils' nearby-kill healing", () => {
    const resolved = resolveTransformationModifiers(committed("alien-symbiosis", "feeding-tendrils"));
    expect(resolved.nearbyKillHealing).toBeGreaterThan(0);
  });

  it("resolves Acidic Secretions as extra Corrode buildup dealt", () => {
    const resolved = resolveTransformationModifiers(committed("alien-symbiosis", "acidic-secretions"));
    expect(resolved.corrodeBuildupMultiplier).toBeGreaterThan(1);
  });

  it("resolves Drone Controller's autonomous shot damage", () => {
    const resolved = resolveTransformationModifiers(committed("cybernetic-ascension", "auxiliary-drone", 3));
    expect(resolved.droneShotDamage).toBe(2);
  });

  it("resolves Gravity Adept's pull-pulse radius", () => {
    const resolved = resolveTransformationModifiers(committed("void-initiation", "gravity-adept", 3));
    expect(resolved.gravityPulseRadiusMetres).toBe(1.8);
  });

  it("leaves a neutral bag completely untouched", () => {
    expect(resolveTransformationModifiers(null)).toEqual(NO_TRANSFORMATION_MODIFIERS);
  });
});
