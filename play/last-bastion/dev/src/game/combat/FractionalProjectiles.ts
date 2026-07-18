export interface FractionalProjectileResolution {
  count: number;
  carry: number;
}

export function initialProjectileCarry(instanceId: number): number {
  return ((instanceId * 0.37) % 1 + 1) % 1;
}

/** Deterministic per-shot accumulator; callers persist `carry` per weapon instance. */
export function resolveFractionalProjectiles(
  projectileCount: number,
  previousCarry: number,
  minimumPerShot = 1,
): FractionalProjectileResolution {
  const safeCount = Math.max(0, projectileCount);
  const whole = Math.floor(safeCount);
  let carry = Math.max(0, previousCarry % 1) + (safeCount - whole);
  const bonus = Math.floor(carry + 1e-9);
  carry -= bonus;
  return {
    count: Math.max(whole + bonus, safeCount > 0 ? minimumPerShot : 0),
    carry,
  };
}
