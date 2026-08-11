import type { DamageType } from "./damageTypes";

export interface IronhideAdaptiveArmourState {
  lastDamageType: DamageType | null;
  repeatCount: number;
  bonusArmour: number;
}

export const IRONHIDE_MAX_ADAPTIVE_ARMOUR = 4;

export function createIronhideAdaptiveArmour(): IronhideAdaptiveArmourState {
  return { lastDamageType: null, repeatCount: 0, bonusArmour: 0 };
}

/** Every consecutive pair of the same damage type hardens the Ironhide for later hits. */
export function recordIronhideDamageType(
  state: IronhideAdaptiveArmourState,
  damageType: DamageType,
): { state: IronhideAdaptiveArmourState; armourGained: number } {
  const repeatCount = state.lastDamageType === damageType ? state.repeatCount + 1 : 1;
  if (repeatCount < 2) {
    return { state: { ...state, lastDamageType: damageType, repeatCount }, armourGained: 0 };
  }
  const nextArmour = Math.min(IRONHIDE_MAX_ADAPTIVE_ARMOUR, state.bonusArmour + 1);
  return {
    state: { lastDamageType: damageType, repeatCount: 0, bonusArmour: nextArmour },
    armourGained: nextArmour - state.bonusArmour,
  };
}
