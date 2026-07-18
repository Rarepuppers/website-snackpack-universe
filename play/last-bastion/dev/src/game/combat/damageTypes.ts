export type DamageType = "physical" | "fire" | "shock" | "cryo" | "toxic";

/**
 * Floating-damage-number colours, shared by the number pool and any future HUD
 * legend so the colour language is defined once: standard/physical ivory, fire
 * red, shock/lightning teal, cryo/frozen blue, toxic/poison green. Hex values
 * match the codex damage-type swatches.
 */
export const DAMAGE_TYPE_COLOURS: Readonly<Record<DamageType, number>> = Object.freeze({
  physical: 0xe9e3cf,
  fire: 0xff5148,
  shock: 0x68e4e8,
  cryo: 0x6fb0ff,
  toxic: 0x7ed957,
});

export type StatusEffectType = "blaze" | "overload" | "freeze" | "corrode";

export interface StatusEffectRule {
  durationSeconds: number;
  damagePerSecond: number;
  speedMultiplier: number;
  stunned: boolean;
  armourReduction: number;
}

export const STATUS_BY_DAMAGE_TYPE: Readonly<Partial<Record<DamageType, StatusEffectType>>> = Object.freeze({
  fire: "blaze",
  shock: "overload",
  cryo: "freeze",
  toxic: "corrode",
});

export const STATUS_BUILDUP_THRESHOLD = 8;

export const STATUS_RULES: Readonly<Record<StatusEffectType, Readonly<StatusEffectRule>>> = Object.freeze({
  blaze: Object.freeze({
    durationSeconds: 3,
    damagePerSecond: 0.5,
    speedMultiplier: 1,
    stunned: false,
    armourReduction: 0,
  }),
  overload: Object.freeze({
    durationSeconds: 0.8,
    damagePerSecond: 0,
    speedMultiplier: 0,
    stunned: true,
    armourReduction: 0,
  }),
  freeze: Object.freeze({
    durationSeconds: 2.2,
    damagePerSecond: 0,
    speedMultiplier: 0.35,
    stunned: false,
    armourReduction: 0,
  }),
  corrode: Object.freeze({
    durationSeconds: 4,
    damagePerSecond: 0.8,
    speedMultiplier: 1,
    stunned: false,
    armourReduction: 3,
  }),
});
