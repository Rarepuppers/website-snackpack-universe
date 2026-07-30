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
 * Twenty-two of the catalogue's 26 effect metrics resolve here. The four that
 * do not are listed against the `default` arm below, each with the reason it
 * has no hook yet. Prefer reading that list over this paragraph — it sits next
 * to the code that would have to change, so it cannot drift the way a header
 * count does.
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
  /** Mutagenic "Reactive Blood": acid burst when health damage lands. */
  retaliationDamage: number;
  /** Alien "Feeding Tendrils": health restored by a nearby kill. */
  nearbyKillHealing: number;
  /** Cybernetic "Rigid Shell" scar / Psionic "Rift Step" boon. */
  evasiveCooldownMultiplier: number;
  evasiveDistanceMultiplier: number;
  /** Cybernetic "Targeting Uplink": tighter spread, faster rounds. */
  weaponSpreadMultiplier: number;
  projectileSpeedMultiplier: number;
  /** Mutagenic "Acidic Secretions": more Corrode buildup *dealt* by attacks. */
  corrodeBuildupMultiplier: number;
  /** Psionic "Telekinetic Focus": metres an ordinary enemy is shoved, periodically. */
  telekineticPushMetres: number;
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
  retaliationDamage: 0,
  nearbyKillHealing: 0,
  evasiveCooldownMultiplier: 1,
  evasiveDistanceMultiplier: 1,
  weaponSpreadMultiplier: 1,
  projectileSpeedMultiplier: 1,
  corrodeBuildupMultiplier: 1,
  telekineticPushMetres: 0,
});

/** "Telekinetic Focus" fires on every Nth qualifying attack, per its rule text. */
export const TELEKINETIC_PUSH_EVERY_NTH_ATTACK = 10;

/** "Reactive Blood" fires at most this often, per the trait's own rule text. */
export const RETALIATION_COOLDOWN_SECONDS = 5;
export const RETALIATION_RADIUS_METRES = 1.5;
/** "Feeding Tendrils" heals kills within this range, rate-limited by its rule text. */
export const NEARBY_KILL_HEAL_RADIUS_METRES = 2.5;
export const NEARBY_KILL_HEAL_WINDOW_SECONDS = 10;
export const NEARBY_KILL_HEAL_WINDOW_CAP = 1.5;

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
          case "retaliation-damage":
            modifiers.retaliationDamage = applyPoints(modifiers.retaliationDamage, effect, rank);
            break;
          case "nearby-kill-healing":
            modifiers.nearbyKillHealing = applyPoints(modifiers.nearbyKillHealing, effect, rank);
            break;
          case "evasive-cooldown":
            modifiers.evasiveCooldownMultiplier = applyPercent(modifiers.evasiveCooldownMultiplier, effect, rank);
            break;
          case "evasive-distance":
            modifiers.evasiveDistanceMultiplier = applyPercent(modifiers.evasiveDistanceMultiplier, effect, rank);
            break;
          case "weapon-spread":
            modifiers.weaponSpreadMultiplier = applyPercent(modifiers.weaponSpreadMultiplier, effect, rank);
            break;
          case "projectile-speed":
            modifiers.projectileSpeedMultiplier = applyPercent(modifiers.projectileSpeedMultiplier, effect, rank);
            break;
          case "telekinetic-push-distance":
            modifiers.telekineticPushMetres = applyPoints(modifiers.telekineticPushMetres, effect, rank);
            break;
          case "corrode-buildup":
            // A boon on *dealt* buildup, not damage received — it was previously
            // grouped with the "received" scars and left unwired by mistake.
            modifiers.corrodeBuildupMultiplier = applyPercent(modifiers.corrodeBuildupMultiplier, effect, rank);
            break;
          // Genuinely unattachable today, and deliberately left so:
          //  - `fire-damage-received` / `shock-buildup-received` are *scars*; the
          //    player never takes typed elemental damage, and deleting a downside
          //    would strictly buff those paths rather than fix them.
          //  - `drone-shot-damage` needs a player-side drone entity that does not exist.
          //  - `gravity-pulse-radius` needs a periodic player pull pulse.
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
  modifiers.evasiveCooldownMultiplier = Math.max(0.1, modifiers.evasiveCooldownMultiplier);
  modifiers.evasiveDistanceMultiplier = Math.max(0.1, modifiers.evasiveDistanceMultiplier);
  modifiers.weaponSpreadMultiplier = Math.max(0, modifiers.weaponSpreadMultiplier);
  modifiers.projectileSpeedMultiplier = Math.max(0.1, modifiers.projectileSpeedMultiplier);
  modifiers.corrodeBuildupMultiplier = Math.max(0, modifiers.corrodeBuildupMultiplier);
  return modifiers;
}
