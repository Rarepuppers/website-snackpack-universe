import type { Vector2Data } from "../math/Vector2Data";
import { normalizeVector } from "../math/Vector2Data";

export const SCRAP_SKITTERER_WINDUP_SECONDS = 0.55;
export const SCRAP_SKITTERER_RUSH_SECONDS = 0.65;
export const SCRAP_SKITTERER_BRAKE_SECONDS = 0.9;
export const SCRAP_SKITTERER_COOLDOWN_SECONDS = 2.3;
export const SCRAP_SKITTERER_APPROACH_SPEED = 2.15;
export const SCRAP_SKITTERER_RUSH_SPEED = 6.8;
export const SCRAP_SKITTERER_MIN_RUSH_RANGE = 2.8;
export const SCRAP_SKITTERER_MAX_RUSH_RANGE = 7.5;
export const SCRAP_SKITTERER_WRECK_SECONDS = 1.8;

export type ScrapSkittererPhase = "approach" | "rush-windup" | "rush" | "brake";

export interface ScrapSkittererState {
  readonly phase: ScrapSkittererPhase;
  readonly phaseRemainingSeconds: number;
  readonly cooldownSeconds: number;
  readonly lockedDirection: Vector2Data;
}

export interface ScrapSkittererStepResult {
  readonly state: ScrapSkittererState;
  readonly movementDirection: Vector2Data;
  readonly movementSpeedMetresPerSecond: number;
  readonly rushStarted: boolean;
}

export interface ScrapSkittererWreck {
  readonly position: Vector2Data;
  readonly remainingSeconds: number;
  readonly damagesPlayer: false;
}

export function createScrapSkittererBehavior(): ScrapSkittererState {
  return {
    phase: "approach",
    phaseRemainingSeconds: 0,
    cooldownSeconds: 0.6,
    lockedDirection: { x: 0, y: 0 },
  };
}

export function stepScrapSkittererBehavior(
  state: ScrapSkittererState,
  deltaSeconds: number,
  position: Readonly<Vector2Data>,
  playerPosition: Readonly<Vector2Data>,
): ScrapSkittererStepResult {
  const delta = Math.max(0, deltaSeconds);
  const toPlayer = {
    x: playerPosition.x - position.x,
    y: playerPosition.y - position.y,
  };
  const distance = Math.hypot(toPlayer.x, toPlayer.y);
  const approachDirection = normalizeVector(toPlayer);
  const phaseRemainingSeconds = Math.max(0, state.phaseRemainingSeconds - delta);
  const cooldownSeconds = Math.max(0, state.cooldownSeconds - delta);

  if (state.phase === "approach") {
    if (
      cooldownSeconds <= 0
      && distance >= SCRAP_SKITTERER_MIN_RUSH_RANGE
      && distance <= SCRAP_SKITTERER_MAX_RUSH_RANGE
    ) {
      return {
        state: {
          phase: "rush-windup",
          phaseRemainingSeconds: SCRAP_SKITTERER_WINDUP_SECONDS,
          cooldownSeconds: 0,
          lockedDirection: approachDirection,
        },
        movementDirection: { x: 0, y: 0 },
        movementSpeedMetresPerSecond: 0,
        rushStarted: false,
      };
    }
    return {
      state: { ...state, cooldownSeconds },
      movementDirection: approachDirection,
      movementSpeedMetresPerSecond: SCRAP_SKITTERER_APPROACH_SPEED,
      rushStarted: false,
    };
  }
  if (state.phase === "rush-windup") {
    if (phaseRemainingSeconds > 0) {
      return {
        state: { ...state, phaseRemainingSeconds },
        movementDirection: { x: 0, y: 0 },
        movementSpeedMetresPerSecond: 0,
        rushStarted: false,
      };
    }
    return {
      state: { ...state, phase: "rush", phaseRemainingSeconds: SCRAP_SKITTERER_RUSH_SECONDS },
      movementDirection: state.lockedDirection,
      movementSpeedMetresPerSecond: SCRAP_SKITTERER_RUSH_SPEED,
      rushStarted: true,
    };
  }
  if (state.phase === "rush") {
    if (phaseRemainingSeconds > 0) {
      return {
        state: { ...state, phaseRemainingSeconds },
        movementDirection: state.lockedDirection,
        movementSpeedMetresPerSecond: SCRAP_SKITTERER_RUSH_SPEED,
        rushStarted: false,
      };
    }
    return {
      state: { ...state, phase: "brake", phaseRemainingSeconds: SCRAP_SKITTERER_BRAKE_SECONDS },
      movementDirection: state.lockedDirection,
      movementSpeedMetresPerSecond: 0,
      rushStarted: false,
    };
  }
  if (phaseRemainingSeconds > 0) {
    return {
      state: { ...state, phaseRemainingSeconds },
      movementDirection: { x: 0, y: 0 },
      movementSpeedMetresPerSecond: 0,
      rushStarted: false,
    };
  }
  return {
    state: {
      phase: "approach",
      phaseRemainingSeconds: 0,
      cooldownSeconds: SCRAP_SKITTERER_COOLDOWN_SECONDS,
      lockedDirection: { x: 0, y: 0 },
    },
    movementDirection: approachDirection,
    movementSpeedMetresPerSecond: SCRAP_SKITTERER_APPROACH_SPEED,
    rushStarted: false,
  };
}

export function createScrapSkittererWreck(position: Readonly<Vector2Data>): ScrapSkittererWreck {
  return { position: { ...position }, remainingSeconds: SCRAP_SKITTERER_WRECK_SECONDS, damagesPlayer: false };
}

export function brakeScrapSkitterer(state: ScrapSkittererState): ScrapSkittererState {
  return {
    ...state,
    phase: "brake",
    phaseRemainingSeconds: SCRAP_SKITTERER_BRAKE_SECONDS,
  };
}

export function stepScrapSkittererWreck(
  wreck: ScrapSkittererWreck,
  deltaSeconds: number,
): ScrapSkittererWreck | null {
  const remainingSeconds = Math.max(0, wreck.remainingSeconds - Math.max(0, deltaSeconds));
  return remainingSeconds > 0 ? { ...wreck, remainingSeconds } : null;
}
