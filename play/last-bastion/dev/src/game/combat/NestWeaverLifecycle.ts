import type { Vector2Data } from "../math/Vector2Data";

export const NEST_WEAVER_MAX_LIVE_PODS = 2;
export const NEST_WEAVER_PLACEMENT_CHARGES = 3;
export const NEST_POD_MAX_HEALTH = 9;
export const NEST_POD_HATCH_SECONDS = 6;
export const NEST_POD_THREAT_COST = 2;
export const NEST_HATCHLING_COUNT = 3;
export const NEST_HATCHLING_THREAT_COST = 1;

export interface NestPlacementContext {
  readonly activePodsForOwner: number;
  readonly ownerChargesRemaining: number;
  readonly liveUnits: number;
  readonly reservedLiveSlots: number;
  readonly liveCap: number;
  readonly remainingThreat: number;
}

export interface NestPodReservation {
  readonly immediatePodThreat: number;
  readonly reservedHatchlingThreat: number;
  readonly reservedHatchlingSlots: number;
}

export type NestPlacementResult =
  | { readonly accepted: true; readonly reservation: NestPodReservation }
  | { readonly accepted: false; readonly reason: "charges" | "owner-pod-cap" | "live-cap" | "threat-budget" };

export type NestPodStatus = "counting" | "hatched" | "destroyed";

export interface NestPodState {
  readonly id: number;
  readonly ownerId: number;
  readonly position: Vector2Data;
  readonly health: number;
  readonly remainingSeconds: number;
  readonly status: NestPodStatus;
  readonly reservation: NestPodReservation;
}

export interface NestPodStepResult {
  readonly pod: NestPodState;
  readonly hatchlingCount: number;
  readonly consumedReservedSlots: number;
  readonly consumedReservedThreat: number;
}

export interface NestPodDamageResult {
  readonly pod: NestPodState;
  readonly releasedReservedSlots: number;
  readonly releasedReservedThreat: number;
}

export const NEST_HATCHLING_PAYLOAD = Object.freeze({
  type: "nest-hatchling" as const,
  count: NEST_HATCHLING_COUNT,
  canSummon: false as const,
});

export function tryReserveNestPod(context: NestPlacementContext): NestPlacementResult {
  if (context.ownerChargesRemaining <= 0) return { accepted: false, reason: "charges" };
  if (context.activePodsForOwner >= NEST_WEAVER_MAX_LIVE_PODS) return { accepted: false, reason: "owner-pod-cap" };
  const reservedHatchlingSlots = NEST_HATCHLING_COUNT;
  if (context.liveUnits + 1 + context.reservedLiveSlots + reservedHatchlingSlots > context.liveCap) {
    return { accepted: false, reason: "live-cap" };
  }
  const reservedHatchlingThreat = NEST_HATCHLING_COUNT * NEST_HATCHLING_THREAT_COST;
  if (context.remainingThreat < NEST_POD_THREAT_COST + reservedHatchlingThreat) {
    return { accepted: false, reason: "threat-budget" };
  }
  return {
    accepted: true,
    reservation: {
      immediatePodThreat: NEST_POD_THREAT_COST,
      reservedHatchlingThreat,
      reservedHatchlingSlots,
    },
  };
}

export function createNestPod(
  id: number,
  ownerId: number,
  position: Readonly<Vector2Data>,
  reservation: NestPodReservation,
): NestPodState {
  return {
    id,
    ownerId,
    position: { ...position },
    health: NEST_POD_MAX_HEALTH,
    remainingSeconds: NEST_POD_HATCH_SECONDS,
    status: "counting",
    reservation,
  };
}

export function stepNestPod(pod: NestPodState, deltaSeconds: number): NestPodStepResult {
  if (pod.status !== "counting") {
    return { pod, hatchlingCount: 0, consumedReservedSlots: 0, consumedReservedThreat: 0 };
  }
  const remainingSeconds = Math.max(0, pod.remainingSeconds - Math.max(0, deltaSeconds));
  if (remainingSeconds > 0) {
    return {
      pod: { ...pod, remainingSeconds },
      hatchlingCount: 0,
      consumedReservedSlots: 0,
      consumedReservedThreat: 0,
    };
  }
  return {
    pod: { ...pod, remainingSeconds: 0, status: "hatched" },
    hatchlingCount: NEST_HATCHLING_COUNT,
    consumedReservedSlots: pod.reservation.reservedHatchlingSlots,
    consumedReservedThreat: pod.reservation.reservedHatchlingThreat,
  };
}

export function damageNestPod(pod: NestPodState, rawDamage: number): NestPodDamageResult {
  if (pod.status !== "counting" || rawDamage <= 0) {
    return { pod, releasedReservedSlots: 0, releasedReservedThreat: 0 };
  }
  const health = Math.max(0, pod.health - rawDamage);
  if (health > 0) {
    return { pod: { ...pod, health }, releasedReservedSlots: 0, releasedReservedThreat: 0 };
  }
  return {
    pod: { ...pod, health: 0, status: "destroyed" },
    releasedReservedSlots: pod.reservation.reservedHatchlingSlots,
    releasedReservedThreat: pod.reservation.reservedHatchlingThreat,
  };
}
