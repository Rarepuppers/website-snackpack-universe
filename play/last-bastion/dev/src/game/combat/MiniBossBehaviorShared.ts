import { normalizeVector, type Vector2Data } from "../math/Vector2Data";

export function siegeCrusherEnrageTier(health: number, maxHealth: number): 0 | 1 | 2 {
  const ratio = maxHealth > 0 ? health / maxHealth : 0;
  if (ratio <= 0.2) return 2;
  if (ratio <= 0.5) return 1;
  return 0;
}

export function broodWardenEnrageTier(health: number, maxHealth: number): 0 | 1 | 2 {
  return siegeCrusherEnrageTier(health, maxHealth);
}

export function riftStalkerFrenzyTier(health: number, maxHealth: number): 0 | 1 | 2 {
  return siegeCrusherEnrageTier(health, maxHealth);
}

/** Orbiting setup movement shared by the three original mini-bosses. */
export function miniBossRepositionDirection(
  position: Vector2Data,
  playerPosition: Vector2Data,
  preferredDistanceMetres: number,
  orbitSign: -1 | 1,
): Vector2Data {
  const offset = {
    x: playerPosition.x - position.x,
    y: playerPosition.y - position.y,
  };
  const currentDistance = Math.hypot(offset.x, offset.y);
  const towardPlayer = normalizeVector(offset);
  const radialIntent = clamp(
    (currentDistance - preferredDistanceMetres) / Math.max(1.5, preferredDistanceMetres * 0.45),
    -1,
    1,
  );
  const tangent = {
    x: -towardPlayer.y * orbitSign,
    y: towardPlayer.x * orbitSign,
  };
  return normalizeVector({
    x: towardPlayer.x * radialIntent + tangent.x * 0.82,
    y: towardPlayer.y * radialIntent + tangent.y * 0.82,
  });
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
