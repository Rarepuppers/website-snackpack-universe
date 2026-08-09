import type { WeaponAttackPattern } from "../content/weaponCatalog";
import { calculateWeaponRingLayout } from "../equipment/WeaponRingLayout";
import type { Vector2Data } from "../math/Vector2Data";

export type WeaponFireKind =
  | "ordinary-projectile" | "melee-sweep" | "beam"
  | "orbit" | "orbit-blade" | "deployable";

export interface WeaponFirePlan {
  readonly anchor: Vector2Data;
  readonly kind: WeaponFireKind;
}

/** Pure ring-anchor placement and attack-pattern routing for one equipped weapon. */
export function planWeaponFire(input: {
  readonly equippedWeaponCount: number;
  readonly weaponIndex: number;
  readonly playerPosition: Vector2Data;
  readonly aimDirection: Vector2Data;
  readonly attackPattern: WeaponAttackPattern;
}): WeaponFirePlan {
  const aimAngle = Math.atan2(input.aimDirection.y, input.aimDirection.x);
  const slot = calculateWeaponRingLayout(input.equippedWeaponCount, aimAngle)[input.weaponIndex] ?? { x: 0, y: 0 };
  return {
    anchor: {
      x: input.playerPosition.x + slot.x,
      y: input.playerPosition.y + slot.y,
    },
    kind: fireKind(input.attackPattern),
  };
}

function fireKind(pattern: WeaponAttackPattern): WeaponFireKind {
  switch (pattern) {
    case "melee-sweep": return "melee-sweep";
    case "beam": return "beam";
    case "orbit": return "orbit";
    case "orbit-blade": return "orbit-blade";
    case "deployable": return "deployable";
    case "projectile":
    case "scatter":
    case "chain-projectile":
      return "ordinary-projectile";
  }
}
