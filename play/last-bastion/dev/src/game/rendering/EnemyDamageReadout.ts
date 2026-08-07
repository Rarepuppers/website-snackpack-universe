import { ENEMY_CATALOG, type EnemyType } from "../content/enemyCatalog";
import {
  STATUS_BUILDUP_THRESHOLD,
  STATUS_BY_DAMAGE_TYPE,
  type DamageType,
  type StatusEffectType,
} from "../combat/damageTypes";

/**
 * Turns the resistance and status-buildup data the simulation already holds into
 * something the HUD can draw. See §11.6 of the improvement plan: 29 of 36
 * enemies carry a resistance profile and the player could not see any of it, so
 * the whole rock-paper-scissors layer was invisible.
 *
 * Phaser-free on purpose — `EnemyHealthBars` imports Phaser, and putting the
 * rules here keeps them testable without booting a scene.
 */

/** Above this an enemy counts as weak; below the reciprocal, resistant. */
export const WEAKNESS_THRESHOLD = 1.15;
export const RESISTANCE_THRESHOLD = 0.85;

export type DamageAffinity = "weak" | "resistant";

export interface DamageAffinityMark {
  readonly damageType: DamageType;
  readonly affinity: DamageAffinity;
  /** The raw multiplier, so callers can rank or tooltip it. */
  readonly multiplier: number;
}

/**
 * The single most decision-relevant affinity for an enemy, or null.
 *
 * One mark, not a list: at 30+ enemy density a stack of glyphs per enemy is
 * noise, and the player only needs to know which weapon to point at this thing.
 * Weakness outranks resistance because "hit it with fire" is actionable and
 * "don't hit it with toxic" mostly is not.
 */
export function primaryDamageAffinity(type: EnemyType): DamageAffinityMark | null {
  const resistances = ENEMY_CATALOG[type]?.resistances;
  if (!resistances) return null;

  let weakest: DamageAffinityMark | null = null;
  let toughest: DamageAffinityMark | null = null;
  for (const [key, value] of Object.entries(resistances)) {
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    const damageType = key as DamageType;
    if (value >= WEAKNESS_THRESHOLD && (!weakest || value > weakest.multiplier)) {
      weakest = { damageType, affinity: "weak", multiplier: value };
    }
    if (value <= RESISTANCE_THRESHOLD && (!toughest || value < toughest.multiplier)) {
      toughest = { damageType, affinity: "resistant", multiplier: value };
    }
  }
  return weakest ?? toughest;
}

/**
 * How close the enemy is to its next status proc, 0..1, for the status that is
 * furthest along. Returns null when nothing is building, so the bar can stay
 * clean on the common case.
 *
 * Only statuses that are NOT already active count: once an enemy is burning,
 * the meaningful readout is the status itself, not progress toward re-applying
 * it.
 */
export function dominantBuildupProgress(
  buildup: Readonly<Partial<Record<StatusEffectType, number>>>,
  activeStatuses: readonly StatusEffectType[],
): { readonly status: StatusEffectType; readonly progress: number } | null {
  let best: { status: StatusEffectType; progress: number } | null = null;
  for (const [key, value] of Object.entries(buildup)) {
    const status = key as StatusEffectType;
    if (typeof value !== "number" || value <= 0) continue;
    if (activeStatuses.includes(status)) continue;
    const progress = Math.min(1, value / STATUS_BUILDUP_THRESHOLD);
    if (!best || progress > best.progress) best = { status, progress };
  }
  return best;
}

/** Damage type a status came from, for colouring the buildup tick. */
export function damageTypeForStatus(status: StatusEffectType): DamageType | null {
  for (const [damageType, mapped] of Object.entries(STATUS_BY_DAMAGE_TYPE)) {
    if (mapped === status) return damageType as DamageType;
  }
  return null;
}
