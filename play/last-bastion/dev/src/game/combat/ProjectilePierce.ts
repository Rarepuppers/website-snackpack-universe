export interface ProjectilePierceContinuation {
  readonly pierceRemaining: number;
  readonly continues: boolean;
}

/** Resolves whether a projectile survives after every effect from one direct impact. */
export function resolveProjectilePierceContinuation(
  pierceRemaining: number,
): ProjectilePierceContinuation {
  return pierceRemaining > 0
    ? { pierceRemaining: pierceRemaining - 1, continues: true }
    : { pierceRemaining, continues: false };
}
