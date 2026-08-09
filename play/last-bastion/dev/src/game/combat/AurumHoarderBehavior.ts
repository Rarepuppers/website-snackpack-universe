import { distance, normalizeVector, type Vector2Data } from "../math/Vector2Data";
import { fixedDirection, type EnemyMovementIntent } from "./EnemyMovementIntent";
import {
  AURUM_HOARDER_ESCAPE_SECONDS,
  AURUM_HOARDER_FORAGE_SECONDS,
  selectAurumExit,
} from "./AurumHoarder";

export type AurumHoarderPhase = "forage" | "flee";

export interface AurumHoarderBehaviorState {
  readonly phase: AurumHoarderPhase;
  readonly phaseRemainingSeconds: number;
  readonly exitTarget: Vector2Data;
}

export interface AurumHoarderStepInput {
  readonly deltaSeconds: number;
  readonly position: Vector2Data;
  readonly playerPosition: Vector2Data;
  readonly forageSpeedMetresPerSecond: number;
  readonly fleeSpeedMetresPerSecond: number;
}

export interface AurumHoarderStepResult {
  readonly state: AurumHoarderBehaviorState;
  readonly movement: EnemyMovementIntent;
  readonly facingDirection: Vector2Data;
  readonly beginsFleeing: boolean;
}

/** Advance timers and choose movement; post-movement transitions resolve separately. */
export function stepAurumHoarderBehavior(
  state: AurumHoarderBehaviorState,
  input: AurumHoarderStepInput,
): AurumHoarderStepResult {
  const phaseRemainingSeconds = state.phaseRemainingSeconds - input.deltaSeconds;
  if (state.phase === "forage") {
    const away = normalizeVector({
      x: input.position.x - input.playerPosition.x,
      y: input.position.y - input.playerPosition.y,
    });
    const wobble = Math.sin((AURUM_HOARDER_FORAGE_SECONDS - phaseRemainingSeconds) * 5) * 0.35;
    const direction = normalizeVector({ x: away.x - away.y * wobble, y: away.y + away.x * wobble });
    return {
      state: { ...state, phaseRemainingSeconds },
      movement: fixedDirection(direction, input.forageSpeedMetresPerSecond),
      facingDirection: direction,
      beginsFleeing: phaseRemainingSeconds <= 0,
    };
  }

  const toExit = normalizeVector({
    x: state.exitTarget.x - input.position.x,
    y: state.exitTarget.y - input.position.y,
  });
  const wobble = Math.sin((AURUM_HOARDER_ESCAPE_SECONDS - phaseRemainingSeconds) * 7) * 0.18;
  const direction = normalizeVector({ x: toExit.x - toExit.y * wobble, y: toExit.y + toExit.x * wobble });
  return {
    state: { ...state, phaseRemainingSeconds },
    movement: fixedDirection(direction, input.fleeSpeedMetresPerSecond),
    facingDirection: direction,
    beginsFleeing: false,
  };
}

/** Called after movement so the chosen exit uses the same position as the inline implementation. */
export function beginAurumHoarderFlee(
  state: AurumHoarderBehaviorState,
  position: Vector2Data,
  playerPosition: Vector2Data,
  widthMetres: number,
  heightMetres: number,
): AurumHoarderBehaviorState {
  return {
    phase: "flee",
    phaseRemainingSeconds: AURUM_HOARDER_ESCAPE_SECONDS,
    exitTarget: selectAurumExit(position, playerPosition, widthMetres, heightMetres),
  };
}

/** Called after applying flee movement, preserving the original arrival timing. */
export function shouldAurumHoarderEscape(
  state: AurumHoarderBehaviorState,
  position: Vector2Data,
): boolean {
  return state.phase === "flee"
    && (distance(position, state.exitTarget) <= 0.22 || state.phaseRemainingSeconds <= 0);
}
