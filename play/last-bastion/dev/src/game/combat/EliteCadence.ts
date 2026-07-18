export type EliteKind =
  | "carapace-scuttler"
  | "razorlord"
  | "blightspitter"
  | "quillback-matriarch";

export const FAST_ELITE_KINDS: readonly EliteKind[] = Object.freeze(["razorlord", "blightspitter"]);

export function isFastElite(kind: EliteKind): boolean {
  return FAST_ELITE_KINDS.includes(kind);
}

/** Ten-wave authored cadence; `roll` only chooses which fast family appears. */
export function eliteKindsForWave(waveNumber: number, roll: number): readonly EliteKind[] {
  const fast: EliteKind = roll < 0.5 ? "razorlord" : "blightspitter";
  if (waveNumber === 4) return ["carapace-scuttler"];
  if (waveNumber === 6) return ["quillback-matriarch"];
  if (waveNumber === 7) return [fast];
  if (waveNumber === 8) return [fast, "carapace-scuttler"];
  if (waveNumber === 9) return [fast, "quillback-matriarch"];
  return [];
}
