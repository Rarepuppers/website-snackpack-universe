import type { Vector2Data } from "../math/Vector2Data";

export interface WeaponRingSlot extends Vector2Data {
  angleRadians: number;
  depthOffset: -1 | 1;
}

export function calculateWeaponRingLayout(
  count: number,
  singleWeaponAimAngle = 0,
): WeaponRingSlot[] {
  if (count <= 0) {
    return [];
  }

  if (count === 1) {
    return [slotAt(singleWeaponAimAngle, 0.82)];
  }

  const radiusMetres = 0.82 + Math.max(0, count - 4) * 0.045;
  const startAngle = -Math.PI / 2;

  return Array.from({ length: count }, (_, index) => (
    slotAt(startAngle + index * Math.PI * 2 / count, radiusMetres)
  ));
}

function slotAt(angleRadians: number, radiusMetres: number): WeaponRingSlot {
  const y = Math.sin(angleRadians) * radiusMetres;
  return {
    x: Math.cos(angleRadians) * radiusMetres,
    y,
    angleRadians,
    depthOffset: y < 0 ? -1 : 1,
  };
}
