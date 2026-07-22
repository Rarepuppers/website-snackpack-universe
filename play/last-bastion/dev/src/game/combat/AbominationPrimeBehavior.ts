import { collidesWithObstacle, type ArenaDefinition } from "../arena/ArenaDefinition";
import type { Vector2Data } from "../math/Vector2Data";

export const ABOMINATION_PRIME_ENTRANCE_SECONDS = 1.05;
export const ABOMINATION_PRIME_SETUP_SECONDS = 0.85;
export const ABOMINATION_PRIME_SLAM_RADIUS_METRES = 1.8;
export const ABOMINATION_PRIME_GRAB_RANGE_METRES = 4.6;
export const ABOMINATION_PRIME_GRAB_HARD_RANGE_METRES = 5.5;
export const ABOMINATION_PRIME_GRAB_BREAK_DAMAGE = 32;
export const ABOMINATION_PRIME_THROW_RADIUS_METRES = 2.1;
export const ABOMINATION_PRIME_HAZARD_SECONDS = 4.5;
export const ABOMINATION_PRIME_BIOMASS_REGEN_SECONDS = 5.5;

export type AbominationPrimeMove = "ground-slam" | "biomass-grab" | "thrown-biomass";
export type AbominationPrimePhase = "entrance" | "setup" | "windup" | "action" | "recovery";

export interface AbominationPrimeHazard {
  readonly centre: Vector2Data;
  readonly radiusMetres: number;
  readonly remainingSeconds: number;
}

export interface AbominationPrimeContext {
  readonly ownerPosition: Vector2Data;
  readonly playerPosition: Vector2Data;
  readonly ownerHealth: number;
  readonly ownerMaxHealth: number;
  readonly arena: Readonly<ArenaDefinition>;
  readonly playerRadiusMetres: number;
  readonly grabLineClear: boolean;
  readonly playerDodged: boolean;
}

export interface AbominationPrimeState {
  readonly phase: AbominationPrimePhase;
  readonly phaseRemainingSeconds: number;
  readonly move: AbominationPrimeMove | null;
  readonly previousMove: AbominationPrimeMove | null;
  readonly attackIndex: number;
  readonly seedOffset: number;
  readonly lockedTarget: Vector2Data | null;
  readonly grabDamageTaken: number;
  readonly biomassCooldownSeconds: number;
  readonly hazard: AbominationPrimeHazard | null;
  readonly escapeSamples: readonly Vector2Data[];
}

export interface AbominationPrimeStepResult {
  readonly state: AbominationPrimeState;
  readonly moveStarted: AbominationPrimeMove | null;
  readonly actionStarted: AbominationPrimeMove | null;
  readonly moveResolved: AbominationPrimeMove | null;
  readonly grabBroken: boolean;
  readonly hazardCreated: AbominationPrimeHazard | null;
  readonly hazardExpired: boolean;
}

const MOVE_ORDER: readonly AbominationPrimeMove[] = Object.freeze([
  "ground-slam",
  "biomass-grab",
  "thrown-biomass",
]);

export function createAbominationPrimeBehavior(
  seed: number,
  context: AbominationPrimeContext,
): AbominationPrimeState {
  return {
    phase: "entrance",
    phaseRemainingSeconds: ABOMINATION_PRIME_ENTRANCE_SECONDS,
    move: null,
    previousMove: null,
    attackIndex: 0,
    seedOffset: Math.abs(Math.floor(seed)) % MOVE_ORDER.length,
    lockedTarget: null,
    grabDamageTaken: 0,
    biomassCooldownSeconds: 0,
    hazard: null,
    escapeSamples: buildEscapeSamples(context),
  };
}

export function damageAbominationPrimeGrab(
  state: AbominationPrimeState,
  damage: number,
): AbominationPrimeState {
  if (state.move !== "biomass-grab" || state.phase !== "action") return state;
  return { ...state, grabDamageTaken: state.grabDamageTaken + Math.max(0, damage) };
}

export function selectAbominationPrimeMove(
  state: AbominationPrimeState,
  context: AbominationPrimeContext,
): AbominationPrimeMove | null {
  const start = (state.seedOffset + state.attackIndex) % MOVE_ORDER.length;
  for (let offset = 0; offset < MOVE_ORDER.length; offset += 1) {
    const candidate = MOVE_ORDER[(start + offset) % MOVE_ORDER.length]!;
    if (candidate === state.previousMove || !moveIsAvailable(candidate, state, context)) continue;
    return candidate;
  }
  return null;
}

export function stepAbominationPrimeBehavior(
  state: AbominationPrimeState,
  deltaSeconds: number,
  context: AbominationPrimeContext,
): AbominationPrimeStepResult {
  const delta = Math.max(0, deltaSeconds);
  const environment = advanceEnvironment(state, delta);
  if (environment.state.phase === "windup" && environment.state.move === "biomass-grab"
    && grabLostLock(environment.state, context)) {
    return result(enterRecovery(environment.state, context), {
      moveResolved: "biomass-grab",
      grabBroken: true,
      hazardExpired: environment.hazardExpired,
    });
  }
  if (environment.state.phase === "action" && environment.state.move === "biomass-grab"
    && grabWasBroken(environment.state, context)) {
    return result(enterRecovery(environment.state, context), {
      moveResolved: "biomass-grab",
      grabBroken: true,
      hazardExpired: environment.hazardExpired,
    });
  }

  const remaining = Math.max(0, environment.state.phaseRemainingSeconds - delta);
  if (remaining > 0) {
    return result({ ...environment.state, phaseRemainingSeconds: remaining }, {
      hazardExpired: environment.hazardExpired,
    });
  }

  switch (environment.state.phase) {
    case "entrance":
      return result({
        ...environment.state,
        phase: "setup",
        phaseRemainingSeconds: ABOMINATION_PRIME_SETUP_SECONDS,
      }, { hazardExpired: environment.hazardExpired });
    case "setup": {
      const move = selectAbominationPrimeMove(environment.state, context);
      if (!move) return result({
        ...environment.state,
        phaseRemainingSeconds: ABOMINATION_PRIME_SETUP_SECONDS,
      }, { hazardExpired: environment.hazardExpired });
      return result(beginMove(environment.state, move, context), {
        moveStarted: move,
        hazardExpired: environment.hazardExpired,
      });
    }
    case "windup":
      return result({
        ...environment.state,
        phase: "action",
        phaseRemainingSeconds: actionSeconds(environment.state.move!),
      }, {
        actionStarted: environment.state.move,
        hazardExpired: environment.hazardExpired,
      });
    case "action": {
      if (environment.state.move === "thrown-biomass") {
        const hazard: AbominationPrimeHazard = {
          centre: { ...environment.state.lockedTarget! },
          radiusMetres: ABOMINATION_PRIME_THROW_RADIUS_METRES,
          remainingSeconds: ABOMINATION_PRIME_HAZARD_SECONDS,
        };
        return result(enterRecovery({
          ...environment.state,
          hazard,
          biomassCooldownSeconds: ABOMINATION_PRIME_BIOMASS_REGEN_SECONDS,
        }, context), {
          moveResolved: "thrown-biomass",
          hazardCreated: hazard,
          hazardExpired: environment.hazardExpired,
        });
      }
      return result(enterRecovery(environment.state, context), {
        moveResolved: environment.state.move,
        hazardExpired: environment.hazardExpired,
      });
    }
    case "recovery":
      return result({
        ...environment.state,
        phase: "setup",
        phaseRemainingSeconds: ABOMINATION_PRIME_SETUP_SECONDS,
        move: null,
        lockedTarget: null,
        grabDamageTaken: 0,
      }, { hazardExpired: environment.hazardExpired });
  }
}

export function abominationPrimeMoveHasEscapeLane(
  state: AbominationPrimeState,
  context: AbominationPrimeContext,
): boolean {
  if (!state.lockedTarget || !state.move) return false;
  const radius = state.move === "ground-slam"
    ? ABOMINATION_PRIME_SLAM_RADIUS_METRES
    : state.move === "thrown-biomass" ? ABOMINATION_PRIME_THROW_RADIUS_METRES : 0;
  if (state.move === "biomass-grab") {
    return state.escapeSamples.length > 0;
  }
  return state.escapeSamples.some((sample) => (
    distance(sample, state.lockedTarget!) > radius + context.playerRadiusMetres
  ));
}

function beginMove(
  state: AbominationPrimeState,
  move: AbominationPrimeMove,
  context: AbominationPrimeContext,
): AbominationPrimeState {
  const target = move === "thrown-biomass" ? selectLandingTarget(context) : clampPoint(context.playerPosition, context);
  return {
    ...state,
    phase: "windup",
    phaseRemainingSeconds: windupSeconds(move, enrageTier(context)),
    move,
    attackIndex: state.attackIndex + 1,
    lockedTarget: target,
    grabDamageTaken: 0,
    escapeSamples: buildEscapeSamples(context),
  };
}

function moveIsAvailable(
  move: AbominationPrimeMove,
  state: AbominationPrimeState,
  context: AbominationPrimeContext,
): boolean {
  const ownerDistance = distance(context.ownerPosition, context.playerPosition);
  if (move === "ground-slam" && ownerDistance > 3.15) return false;
  if (move === "biomass-grab"
    && (ownerDistance > ABOMINATION_PRIME_GRAB_RANGE_METRES || !context.grabLineClear)) return false;
  if (move === "thrown-biomass"
    && (state.hazard !== null || state.biomassCooldownSeconds > 0 || selectLandingTarget(context) === null)) return false;
  const preview = {
    ...state,
    move,
    lockedTarget: move === "thrown-biomass" ? selectLandingTarget(context) : clampPoint(context.playerPosition, context),
    escapeSamples: buildEscapeSamples(context),
  };
  return abominationPrimeMoveHasEscapeLane(preview, context);
}

function grabLostLock(state: AbominationPrimeState, context: AbominationPrimeContext): boolean {
  return !state.lockedTarget
    || !context.grabLineClear
    || distance(context.ownerPosition, context.playerPosition) > ABOMINATION_PRIME_GRAB_HARD_RANGE_METRES;
}

function grabWasBroken(state: AbominationPrimeState, context: AbominationPrimeContext): boolean {
  return grabLostLock(state, context)
    || context.playerDodged
    || state.grabDamageTaken >= ABOMINATION_PRIME_GRAB_BREAK_DAMAGE;
}

function advanceEnvironment(
  state: AbominationPrimeState,
  deltaSeconds: number,
): { state: AbominationPrimeState; hazardExpired: boolean } {
  const biomassCooldownSeconds = Math.max(0, state.biomassCooldownSeconds - deltaSeconds);
  if (!state.hazard) return { state: { ...state, biomassCooldownSeconds }, hazardExpired: false };
  const remainingSeconds = Math.max(0, state.hazard.remainingSeconds - deltaSeconds);
  return remainingSeconds > 0
    ? { state: { ...state, biomassCooldownSeconds, hazard: { ...state.hazard, remainingSeconds } }, hazardExpired: false }
    : { state: { ...state, biomassCooldownSeconds, hazard: null }, hazardExpired: true };
}

function buildEscapeSamples(context: AbominationPrimeContext): readonly Vector2Data[] {
  const samples: Vector2Data[] = [];
  for (let index = 0; index < 12; index += 1) {
    const angle = index / 12 * Math.PI * 2;
    const point = clampPoint({
      x: context.playerPosition.x + Math.cos(angle) * 3.4,
      y: context.playerPosition.y + Math.sin(angle) * 3.4,
    }, context);
    if (!collidesWithObstacle(point, context.playerRadiusMetres, context.arena.obstacles)) samples.push(point);
  }
  return samples;
}

function selectLandingTarget(context: AbominationPrimeContext): Vector2Data | null {
  const offsets: readonly Vector2Data[] = [
    { x: 0, y: 0 }, { x: 1.2, y: 0 }, { x: -1.2, y: 0 }, { x: 0, y: 1.2 }, { x: 0, y: -1.2 },
  ];
  for (const offset of offsets) {
    const point = clampPoint({ x: context.playerPosition.x + offset.x, y: context.playerPosition.y + offset.y }, context);
    if (!collidesWithObstacle(point, 0.35, context.arena.obstacles)) return point;
  }
  return null;
}

function windupSeconds(move: AbominationPrimeMove, tier: 0 | 1 | 2): number {
  const base = move === "ground-slam" ? 1.05 : move === "biomass-grab" ? 1.15 : 1.3;
  return base * [1, 0.88, 0.74][tier]!;
}

function actionSeconds(move: AbominationPrimeMove): number {
  return move === "ground-slam" ? 0.22 : move === "biomass-grab" ? 1.8 : 0.55;
}

function enterRecovery(state: AbominationPrimeState, context: AbominationPrimeContext): AbominationPrimeState {
  return {
    ...state,
    phase: "recovery",
    phaseRemainingSeconds: [1.65, 1.38, 1.08][enrageTier(context)]!,
    previousMove: state.move,
    lockedTarget: null,
    grabDamageTaken: 0,
  };
}

function enrageTier(context: AbominationPrimeContext): 0 | 1 | 2 {
  const ratio = context.ownerMaxHealth > 0 ? context.ownerHealth / context.ownerMaxHealth : 0;
  return ratio <= 0.2 ? 2 : ratio <= 0.5 ? 1 : 0;
}

function clampPoint(point: Readonly<Vector2Data>, context: AbominationPrimeContext): Vector2Data {
  const margin = context.playerRadiusMetres + 0.25;
  return {
    x: Math.max(margin, Math.min(context.arena.widthMetres - margin, point.x)),
    y: Math.max(margin, Math.min(context.arena.heightMetres - margin, point.y)),
  };
}

function distance(left: Readonly<Vector2Data>, right: Readonly<Vector2Data>): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function result(
  state: AbominationPrimeState,
  values: Partial<Omit<AbominationPrimeStepResult, "state">> = {},
): AbominationPrimeStepResult {
  return {
    state,
    moveStarted: null,
    actionStarted: null,
    moveResolved: null,
    grabBroken: false,
    hazardCreated: null,
    hazardExpired: false,
    ...values,
  };
}
