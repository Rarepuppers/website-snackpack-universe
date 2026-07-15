export type EvasiveMovePresentation = "roll" | "slide" | "dash" | "sprint" | "rush";

export interface EvasiveMoveStats {
  durationSeconds: number;
  distanceMetres: number;
  invulnerabilitySeconds: number;
}

export interface EvasiveMoveProfile extends EvasiveMoveStats {
  presentation: EvasiveMovePresentation;
}

export type EvasiveMoveStat = keyof EvasiveMoveStats;

export interface EvasiveMoveModifier {
  stat: EvasiveMoveStat;
  add?: number;
  multiply?: number;
}

export function validateEvasiveMoveStats(stats: EvasiveMoveStats): void {
  if (!Number.isFinite(stats.durationSeconds) || stats.durationSeconds <= 0) {
    throw new Error("Evasive-move duration must be greater than zero.");
  }

  if (!Number.isFinite(stats.distanceMetres) || stats.distanceMetres < 0) {
    throw new Error("Evasive-move distance cannot be negative.");
  }

  if (!Number.isFinite(stats.invulnerabilitySeconds) || stats.invulnerabilitySeconds < 0) {
    throw new Error("Evasive-move invulnerability cannot be negative.");
  }

  if (stats.invulnerabilitySeconds > stats.durationSeconds) {
    throw new Error("Invulnerability cannot exceed the evasive-move duration.");
  }
}

export function resolveEvasiveMoveStats(
  base: EvasiveMoveStats,
  modifiers: readonly EvasiveMoveModifier[],
): EvasiveMoveStats {
  validateEvasiveMoveStats(base);

  const resolved: EvasiveMoveStats = { ...base };

  for (const stat of Object.keys(resolved) as EvasiveMoveStat[]) {
    const relevant = modifiers.filter((modifier) => modifier.stat === stat);
    const additive = relevant.reduce((total, modifier) => total + (modifier.add ?? 0), 0);
    const multiplier = relevant.reduce((total, modifier) => total * (modifier.multiply ?? 1), 1);
    resolved[stat] = (resolved[stat] + additive) * multiplier;
  }

  validateEvasiveMoveStats(resolved);
  return resolved;
}
