export type DamageType = "physical" | "fire" | "shock" | "cryo" | "toxic";

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

export const STATUS_BUILDUP_THRESHOLD = 40;

export const STATUS_RULES: Readonly<Record<StatusEffectType, Readonly<StatusEffectRule>>> = Object.freeze({
  blaze: Object.freeze({
    durationSeconds: 3,
    damagePerSecond: 7,
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
    damagePerSecond: 4,
    speedMultiplier: 1,
    stunned: false,
    armourReduction: 3,
  }),
});
