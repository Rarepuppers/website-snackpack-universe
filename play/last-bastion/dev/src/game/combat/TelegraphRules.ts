import type { Vector2Data } from "../math/Vector2Data";

export type CombatTelegraphKind =
  | "ground-slam"
  | "rain-of-spines"
  | "sweeping-arc"
  | "beam"
  | "radial-pulse"
  | "offscreen-warning";

export interface CombatTelegraphSnapshot {
  id: string;
  groupId: string;
  kind: CombatTelegraphKind;
  origin: Vector2Data;
  direction?: Vector2Data;
  radiusMetres?: number;
  lengthMetres?: number;
  halfArcRadians?: number;
  remainingSeconds: number;
  durationSeconds: number;
  major: boolean;
}

export const GROUND_SLAM_TELL_SECONDS = 0.8;
export const GROUND_SLAM_RECOVERY_SECONDS = 1.3;
export const RAIN_OF_SPINES_TELL_SECONDS = 1.2;
export const SWEEPING_ARC_TELL_SECONDS = 0.7;
export const BEAM_TELL_SECONDS = 1;
export const RADIAL_PULSE_TELL_SECONDS = 0.45;
export const MAX_MAJOR_TELEGRAPH_GROUPS = 2;
export const MAX_RAIN_ARENA_COVERAGE = 0.35;

export interface TelegraphShapeCue {
  /** Stable non-colour identity used by both code and authored decals. */
  readonly signature: "ring-cross" | "reticle" | "wedge" | "double-rail" | "concentric" | "edge-chevron";
  readonly edgeWeight: number;
  readonly markerCount: number;
}

const TELEGRAPH_SHAPE_CUES: Readonly<Record<CombatTelegraphKind, TelegraphShapeCue>> = Object.freeze({
  "ground-slam": { signature: "ring-cross", edgeWeight: 4, markerCount: 4 },
  "rain-of-spines": { signature: "reticle", edgeWeight: 3, markerCount: 4 },
  "sweeping-arc": { signature: "wedge", edgeWeight: 5, markerCount: 2 },
  beam: { signature: "double-rail", edgeWeight: 4, markerCount: 2 },
  "radial-pulse": { signature: "concentric", edgeWeight: 3, markerCount: 8 },
  "offscreen-warning": { signature: "edge-chevron", edgeWeight: 4, markerCount: 1 },
});

export function telegraphShapeCue(kind: CombatTelegraphKind): TelegraphShapeCue {
  return TELEGRAPH_SHAPE_CUES[kind];
}

const RAIN_RADIUS_METRES = 0.82;
const RAIN_OFFSETS: readonly Vector2Data[] = Object.freeze([
  { x: 0, y: 0 },
  { x: 1.65, y: 0.45 },
  { x: -1.55, y: 0.75 },
  { x: 0.7, y: -1.6 },
  { x: -1.05, y: -1.55 },
]);

export function buildRainOfSpinesTargets(
  centre: Vector2Data,
  arenaWidthMetres: number,
  arenaHeightMetres: number,
): readonly Vector2Data[] {
  return RAIN_OFFSETS.map((offset) => ({
    x: clamp(centre.x + offset.x, RAIN_RADIUS_METRES, arenaWidthMetres - RAIN_RADIUS_METRES),
    y: clamp(centre.y + offset.y, RAIN_RADIUS_METRES, arenaHeightMetres - RAIN_RADIUS_METRES),
  }));
}

/** Conservative sum-of-circles measurement: overlap never understates occupied space. */
export function rainCoverageFraction(
  targetCount: number,
  arenaWidthMetres: number,
  arenaHeightMetres: number,
  radiusMetres = RAIN_RADIUS_METRES,
): number {
  return targetCount * Math.PI * radiusMetres * radiusMetres
    / (arenaWidthMetres * arenaHeightMetres);
}

export function rainRadiusMetres(): number {
  return RAIN_RADIUS_METRES;
}

export function pointInsideTelegraphedArc(
  origin: Vector2Data,
  direction: Vector2Data,
  point: Vector2Data,
  radiusMetres: number,
  halfArcRadians: number,
): boolean {
  const offset = { x: point.x - origin.x, y: point.y - origin.y };
  const magnitude = Math.hypot(offset.x, offset.y);
  if (magnitude > radiusMetres || magnitude <= 0.0001) return magnitude <= radiusMetres;
  const dot = (offset.x / magnitude) * direction.x + (offset.y / magnitude) * direction.y;
  return dot >= Math.cos(halfArcRadians);
}

export function createBeamTelegraph(
  id: string,
  origin: Vector2Data,
  direction: Vector2Data,
  lengthMetres: number,
): CombatTelegraphSnapshot {
  return {
    id,
    groupId: id,
    kind: "beam",
    origin: { ...origin },
    direction: { ...direction },
    lengthMetres,
    remainingSeconds: BEAM_TELL_SECONDS,
    durationSeconds: BEAM_TELL_SECONDS,
    major: true,
  };
}

export function limitMajorTelegraphs(
  telegraphs: readonly CombatTelegraphSnapshot[],
): readonly CombatTelegraphSnapshot[] {
  const admittedGroups = new Set<string>();
  return telegraphs.filter((telegraph) => {
    if (!telegraph.major || admittedGroups.has(telegraph.groupId)) return true;
    if (admittedGroups.size >= MAX_MAJOR_TELEGRAPH_GROUPS) return false;
    admittedGroups.add(telegraph.groupId);
    return true;
  });
}

/** Returns the inset edge marker, or null while the source is visible. */
export function offscreenWarningPosition(
  source: Vector2Data,
  viewport: { x: number; y: number; width: number; height: number },
  inset = 0.5,
): Vector2Data | null {
  const right = viewport.x + viewport.width;
  const bottom = viewport.y + viewport.height;
  if (source.x >= viewport.x && source.x <= right && source.y >= viewport.y && source.y <= bottom) return null;
  return {
    x: clamp(source.x, viewport.x + inset, right - inset),
    y: clamp(source.y, viewport.y + inset, bottom - inset),
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
