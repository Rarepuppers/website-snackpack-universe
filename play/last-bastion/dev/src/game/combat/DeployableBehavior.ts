import type { Vector2Data } from "../math/Vector2Data";

export type DeployableKind = "structure" | "auxiliary-drone";

export interface DeployableBehaviorState {
  readonly kind: DeployableKind;
  readonly position: Vector2Data;
  readonly health: number;
  readonly remainingSeconds: number;
  readonly cooldownSeconds: number;
  readonly orbitAngleRadians: number;
  readonly dead: boolean;
}

export interface DeployableStepResult {
  readonly state: DeployableBehaviorState;
  readonly expired: boolean;
  readonly requestsTarget: boolean;
}

export function stepDeployableBehavior(
  state: DeployableBehaviorState,
  input: {
    readonly deltaSeconds: number;
    readonly playerPosition: Vector2Data;
    readonly widthMetres: number;
    readonly heightMetres: number;
  },
): DeployableStepResult {
  if (state.dead) return { state, expired: false, requestsTarget: false };

  let next: DeployableBehaviorState = { ...state };
  if (state.kind === "auxiliary-drone") {
    const orbitAngleRadians = state.orbitAngleRadians + input.deltaSeconds * 1.4;
    next = {
      ...next,
      orbitAngleRadians,
      position: {
        x: clamp(input.playerPosition.x + Math.cos(orbitAngleRadians) * 1.15, 0.4, input.widthMetres - 0.4),
        y: clamp(input.playerPosition.y + Math.sin(orbitAngleRadians) * 0.7 - 0.45, 0.4, input.heightMetres - 0.4),
      },
    };
  } else {
    next = { ...next, remainingSeconds: state.remainingSeconds - input.deltaSeconds };
  }

  if ((next.kind === "structure" && next.remainingSeconds <= 0) || next.health <= 0) {
    return { state: { ...next, dead: true }, expired: true, requestsTarget: false };
  }

  next = { ...next, cooldownSeconds: next.cooldownSeconds - input.deltaSeconds };
  return { state: next, expired: false, requestsTarget: next.cooldownSeconds <= 0 };
}

export function commitDeployableFire(
  state: DeployableBehaviorState,
  input: {
    readonly fireIntervalSeconds: number;
    readonly deployFireIntervalSeconds: number;
    readonly engineeringScale: number;
  },
): DeployableBehaviorState {
  return {
    ...state,
    cooldownSeconds: state.kind === "auxiliary-drone"
      ? input.fireIntervalSeconds
      : input.deployFireIntervalSeconds / input.engineeringScale,
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
