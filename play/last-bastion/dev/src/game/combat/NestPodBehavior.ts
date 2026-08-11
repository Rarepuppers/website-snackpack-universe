import type { Vector2Data } from "../math/Vector2Data";
import { stepNestPod, type NestPodState } from "./NestWeaverLifecycle";

const HATCH_OFFSETS: readonly Vector2Data[] = Object.freeze([
  Object.freeze({ x: -0.48, y: 0.12 }),
  Object.freeze({ x: 0.48, y: 0.12 }),
  Object.freeze({ x: 0, y: -0.46 }),
  Object.freeze({ x: -0.42, y: -0.38 }),
  Object.freeze({ x: 0.42, y: -0.38 }),
  Object.freeze({ x: 0, y: 0.52 }),
]);

export interface NestPodHatchAction {
  readonly kind: "hatch";
  readonly offsets: readonly Vector2Data[];
  readonly consumedReservedSlots: number;
  readonly consumedReservedThreat: number;
}

export interface NestPodBehaviorResult {
  readonly pod: NestPodState;
  readonly action: NestPodHatchAction | null;
}

/**
 * Advances the pod's existing finite lifecycle and translates a completed
 * hatch into a deterministic world-action payload. Reservation accounting and
 * entity spawning stay with CombatSimulation.
 */
export function stepNestPodBehavior(
  pod: NestPodState,
  deltaSeconds: number,
): NestPodBehaviorResult {
  const result = stepNestPod(pod, deltaSeconds);
  if (result.hatchlingCount <= 0) return { pod: result.pod, action: null };
  return {
    pod: result.pod,
    action: {
      kind: "hatch",
      offsets: HATCH_OFFSETS.slice(0, result.hatchlingCount),
      consumedReservedSlots: result.consumedReservedSlots,
      consumedReservedThreat: result.consumedReservedThreat,
    },
  };
}
