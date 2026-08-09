import { distance, normalizeVector, type Vector2Data } from "../math/Vector2Data";
import { fixedDirection, NO_MOVEMENT, type EnemyMovementIntent } from "./EnemyMovementIntent";
import {
  stepStormChain,
  type ConductiveNodeState,
  type StormChainState,
} from "./StormSavantLightning";

export const STORM_SAVANT_RETREAT_RANGE_METRES = 5;
export const STORM_SAVANT_APPROACH_RANGE_METRES = 9;
export const STORM_SAVANT_COOLDOWN_SECONDS = 2.4;
export const STORM_SAVANT_RETRY_SECONDS = 0.5;

export interface StormSavantBehaviorState {
  readonly chain: StormChainState;
  readonly cooldownSeconds: number;
}

export interface StormSavantStepInput {
  readonly deltaSeconds: number;
  readonly position: Vector2Data;
  readonly playerPosition: Vector2Data;
  readonly movementSpeedMetresPerSecond: number;
  readonly nodes: readonly ConductiveNodeState[];
}

export interface StormSavantStepResult {
  readonly state: StormSavantBehaviorState;
  readonly movement: EnemyMovementIntent;
  readonly facingDirection: Vector2Data;
  readonly requestsChainStart: boolean;
  readonly interrupted: boolean;
  readonly discharged: boolean;
}

export function stepStormSavantBehavior(
  state: StormSavantBehaviorState,
  input: StormSavantStepInput,
): StormSavantStepResult {
  const towardPlayer = normalizeVector({
    x: input.playerPosition.x - input.position.x,
    y: input.playerPosition.y - input.position.y,
  });
  if (state.chain.phase === "idle") {
    const cooldownSeconds = Math.max(0, state.cooldownSeconds - input.deltaSeconds);
    const playerDistance = distance(input.position, input.playerPosition);
    const movement = playerDistance > STORM_SAVANT_APPROACH_RANGE_METRES
      ? fixedDirection(towardPlayer, input.movementSpeedMetresPerSecond)
      : playerDistance < STORM_SAVANT_RETREAT_RANGE_METRES
        ? fixedDirection(
          { x: -towardPlayer.x, y: -towardPlayer.y },
          input.movementSpeedMetresPerSecond,
        )
        : NO_MOVEMENT;
    return {
      state: { ...state, cooldownSeconds },
      movement,
      facingDirection: towardPlayer,
      requestsChainStart: cooldownSeconds <= 0,
      interrupted: false,
      discharged: false,
    };
  }

  const previousPhase = state.chain.phase;
  const stepped = stepStormChain(state.chain, input.deltaSeconds, input.nodes);
  return {
    state: {
      chain: stepped.state,
      cooldownSeconds: previousPhase === "overload-recovery" && stepped.state.phase === "idle"
        ? STORM_SAVANT_COOLDOWN_SECONDS
        : state.cooldownSeconds,
    },
    movement: NO_MOVEMENT,
    facingDirection: towardPlayer,
    requestsChainStart: false,
    interrupted: previousPhase === "tell" && stepped.state.phase === "overload-recovery",
    discharged: stepped.discharged,
  };
}

export function resolveStormSavantChainStart(
  state: StormSavantBehaviorState,
  chain: StormChainState | null,
): StormSavantBehaviorState {
  return chain
    ? { ...state, chain }
    : { ...state, cooldownSeconds: STORM_SAVANT_RETRY_SECONDS };
}
