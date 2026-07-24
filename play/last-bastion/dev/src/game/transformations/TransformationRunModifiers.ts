import type { TransformationAffinityState } from "./TransformationAffinity";
import {
  transformationChoiceById,
  transformationEffectValue,
  type TransformationChoiceId,
  type TransformationEffectDefinition,
} from "./TransformationChoiceCatalog";

/**
 * The flat, resolved effect bag combat reads once a transformation path is
 * committed (3+ Affinity) — mirrors `RelicRunModifiers`. Multipliers default to
 * 1 (no change), additive bonuses default to 0. Effects apply only for the
 * committed path; uncommitted exposure in other paths has no combat effect,
 * matching the design ("reaching 3 Affinity commits a path and applies its
 * combat effects").
 *
 * Fourteen of the catalogue's 27 effect metrics are wired here — the ones with
 * a direct existing stat hook in `CombatSimulation`. The rest (retaliation
 * damage, nearby-kill healing beyond the existing lifesteal pattern, drone
 * shot damage, gravity-pulse radius, telekinetic push distance, weapon
 * spread, projectile speed, and the three "received" elemental-buildup
 * metrics, which have no hook at all because the player never takes status
 * effects from enemies) are deliberately unconsumed for now — the same
 * carry-now/wire-later shape `RelicRunModifiers` already uses for over half
 * its own fields (see `relicCatalog.ts`).
 */
export interface TransformationRunModifiers {
  committedPathId: TransformationAffinityState["committedPathId"];
  maxHealthMultiplier: number;
  movementSpeedMultiplier: number;
  armourBonus: number;
  maxShieldBonus: number;
  shieldRechargeMultiplier: number;
  fireRateMultiplier: number;
  explosionRadiusMultiplier: number;
  ultimateCooldownMultiplier: number;
  healingReceivedMultiplier: number;
  pickupRadiusMultiplier: number;
  regenerationPerSecondBonus: number;
  longRangeDamageMultiplier: number;
  closeRangeDamageMultiplier: number;
  heavyWeaponDamageMultiplier: number;
}

export const NO_TRANSFORMATION_MODIFIERS: Readonly<TransformationRunModifiers> = Object.freeze({
  committedPathId: null,
  maxHealthMultiplier: 1,
  movementSpeedMultiplier: 1,
  armourBonus: 0,
  maxShieldBonus: 0,
  shieldRechargeMultiplier: 1,
  fireRateMultiplier: 1,
  explosionRadiusMultiplier: 1,
  ultimateCooldownMultiplier: 1,
  healingReceivedMultiplier: 1,
  pickupRadiusMultiplier: 1,
  regenerationPerSecondBonus: 0,
  longRangeDamageMultiplier: 1,
  closeRangeDamageMultiplier: 1,
  heavyWeaponDamageMultiplier: 1,
});

/** Long-range beyond this, close-range within this — matches the choice catalogue's own rule text. */
export const TRANSFORMATION_LONG_RANGE_METRES = 8;
export const TRANSFORMATION_CLOSE_RANGE_METRES = 3;

function applyPercent(multiplier: number, effect: TransformationEffectDefinition, rank: number): number {
  const value = transformationEffectValue(effect, rank) / 100;
  return multiplier * (effect.operation === "increase" ? 1 + value : 1 - value);
}

function applyPoints(bonus: number, effect: TransformationEffectDefinition, rank: number): number {
  const value = transformationEffectValue(effect, rank);
  return bonus + (effect.operation === "increase" ? value : -value);
}

/** Resolves the committed path's active choice history into a flat modifier bag. */
export function resolveTransformationModifiers(
  state: TransformationAffinityState | null | undefined,
): TransformationRunModifiers {
  if (!state?.committedPathId) {
    return NO_TRANSFORMATION_MODIFIERS;
  }
  const progress = state.paths.find((candidate) => candidate.pathId === state.committedPathId);
  if (!progress) {
    return NO_TRANSFORMATION_MODIFIERS;
  }

  const modifiers: TransformationRunModifiers = { ...NO_TRANSFORMATION_MODIFIERS, committedPathId: state.committedPathId };
  const ranks = new Map<TransformationChoiceId, number>();
  for (const choiceId of progress.choiceIds) {
    ranks.set(choiceId, (ranks.get(choiceId) ?? 0) + 1);
  }

  for (const [choiceId, rank] of ranks) {
    const definition = transformationChoiceById(choiceId);
    for (const trait of [definition.boon, definition.scar]) {
      for (const effect of trait.effects) {
        switch (effect.metric) {
          case "maximum-health":
            modifiers.maxHealthMultiplier = applyPercent(modifiers.maxHealthMultiplier, effect, rank);
            break;
          case "movement-speed":
            modifiers.movementSpeedMultiplier = applyPercent(modifiers.movementSpeedMultiplier, effect, rank);
            break;
          case "armour":
            modifiers.armourBonus = applyPoints(modifiers.armourBonus, effect, rank);
            break;
          case "maximum-shield":
            modifiers.maxShieldBonus = applyPoints(modifiers.maxShieldBonus, effect, rank);
            break;
          case "shield-recharge-rate":
            modifiers.shieldRechargeMultiplier = applyPercent(modifiers.shieldRechargeMultiplier, effect, rank);
            break;
          case "fire-rate":
            modifiers.fireRateMultiplier = applyPercent(modifiers.fireRateMultiplier, effect, rank);
            break;
          case "blast-radius":
            modifiers.explosionRadiusMultiplier = applyPercent(modifiers.explosionRadiusMultiplier, effect, rank);
            break;
          case "ultimate-cooldown":
            modifiers.ultimateCooldownMultiplier = applyPercent(modifiers.ultimateCooldownMultiplier, effect, rank);
            break;
          case "healing-received":
            modifiers.healingReceivedMultiplier = applyPercent(modifiers.healingReceivedMultiplier, effect, rank);
            break;
          case "pickup-radius":
            modifiers.pickupRadiusMultiplier = applyPercent(modifiers.pickupRadiusMultiplier, effect, rank);
            break;
          case "health-regeneration-per-second":
            modifiers.regenerationPerSecondBonus = applyPoints(modifiers.regenerationPerSecondBonus, effect, rank);
            break;
          case "long-range-damage":
            modifiers.longRangeDamageMultiplier = applyPercent(modifiers.longRangeDamageMultiplier, effect, rank);
            break;
          case "close-range-damage":
            modifiers.closeRangeDamageMultiplier = applyPercent(modifiers.closeRangeDamageMultiplier, effect, rank);
            break;
          case "heavy-weapon-damage":
            modifiers.heavyWeaponDamageMultiplier = applyPercent(modifiers.heavyWeaponDamageMultiplier, effect, rank);
            break;
          default:
            break;
        }
      }
    }
  }

  modifiers.maxHealthMultiplier = Math.max(0.1, modifiers.maxHealthMultiplier);
  modifiers.movementSpeedMultiplier = Math.max(0.1, modifiers.movementSpeedMultiplier);
  modifiers.shieldRechargeMultiplier = Math.max(0, modifiers.shieldRechargeMultiplier);
  modifiers.fireRateMultiplier = Math.max(0.1, modifiers.fireRateMultiplier);
  return modifiers;
}
