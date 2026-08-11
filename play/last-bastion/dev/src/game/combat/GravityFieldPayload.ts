import type { Vector2Data } from "../math/Vector2Data";

export interface GravityFieldPayload<TDamageType extends string, TWeaponId extends string> {
  readonly position: Vector2Data;
  readonly remainingSeconds: number;
  readonly durationSeconds: number;
  readonly pullStrengthMetresPerSecond: number;
  readonly pullRadiusMetres: number;
  readonly implosionRadiusMetres: number;
  readonly implosionDamage: number;
  readonly damageType: TDamageType;
  readonly weaponId: TWeaponId;
  readonly kind: "event-horizon" | "gravity-pulse";
}

/** Builds a delayed pull-then-implode field without allocating its runtime entity ID. */
export function planEventHorizonFieldPayload<TDamageType extends string, TWeaponId extends string>(input: {
  readonly position: Vector2Data;
  readonly durationSeconds: number;
  readonly pullStrengthMetresPerSecond: number;
  readonly pullRadiusMetres: number;
  readonly implosionRadiusMetres: number;
  readonly implosionDamage: number;
  readonly damageType: TDamageType;
  readonly weaponId: TWeaponId;
}): GravityFieldPayload<TDamageType, TWeaponId> {
  return {
    position: { ...input.position },
    remainingSeconds: input.durationSeconds,
    durationSeconds: input.durationSeconds,
    pullStrengthMetresPerSecond: input.pullStrengthMetresPerSecond,
    pullRadiusMetres: input.pullRadiusMetres,
    implosionRadiusMetres: input.implosionRadiusMetres,
    implosionDamage: input.implosionDamage,
    damageType: input.damageType,
    weaponId: input.weaponId,
    kind: "event-horizon",
  };
}

/** Builds a non-damaging Gravity Adept pulse without allocating its runtime entity ID. */
export function planGravityPulseFieldPayload<TWeaponId extends string>(input: {
  readonly position: Vector2Data;
  readonly durationSeconds: number;
  readonly pullStrengthMetresPerSecond: number;
  readonly pullRadiusMetres: number;
  readonly weaponId: TWeaponId;
}): GravityFieldPayload<"physical", TWeaponId> {
  return {
    position: { ...input.position },
    remainingSeconds: input.durationSeconds,
    durationSeconds: input.durationSeconds,
    pullStrengthMetresPerSecond: input.pullStrengthMetresPerSecond,
    pullRadiusMetres: input.pullRadiusMetres,
    implosionRadiusMetres: 0,
    implosionDamage: 0,
    damageType: "physical",
    weaponId: input.weaponId,
    kind: "gravity-pulse",
  };
}
