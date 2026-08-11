export type EliteKind =
  | "carapace-scuttler"
  | "razorlord"
  | "blightspitter"
  | "quillback-matriarch"
  | "ironhide-abomination"
  | "splitcaller-weaver"
  | "voltaic-warden";

/** Every authored elite identity. Keep audits and presentation keyed to this list. */
export const ELITE_KINDS: readonly EliteKind[] = Object.freeze([
  "carapace-scuttler",
  "razorlord",
  "blightspitter",
  "quillback-matriarch",
  "ironhide-abomination",
  "splitcaller-weaver",
  "voltaic-warden",
]);

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

const PATROL_PARTNERS: Readonly<Record<EliteKind, EliteKind>> = Object.freeze({
  "carapace-scuttler": "razorlord",
  razorlord: "quillback-matriarch",
  blightspitter: "ironhide-abomination",
  "quillback-matriarch": "voltaic-warden",
  "ironhide-abomination": "splitcaller-weaver",
  "splitcaller-weaver": "voltaic-warden",
  "voltaic-warden": "blightspitter",
});

/** Threat 2 adds a second, mechanically different patrol rather than another stat multiplier. */
export function elitePatrolKinds(primary: EliteKind, count: 0 | 1 | 2): readonly EliteKind[] {
  if (count === 0) return [];
  if (count === 1) return [primary];
  return [primary, PATROL_PARTNERS[primary]];
}
