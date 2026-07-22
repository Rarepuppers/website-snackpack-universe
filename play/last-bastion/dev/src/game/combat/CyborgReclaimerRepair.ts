import type { Vector2Data } from "../math/Vector2Data";

export const RECLAIMER_PATCH_CHARGES = 3;
export const RECLAIMER_CHANNEL_SECONDS = 1.25;
export const RECLAIMER_RECOVERY_SECONDS = 1;
export const RECLAIMER_COOLDOWN_SECONDS = 3.2;
export const RECLAIMER_REPAIR_AMOUNT = 4;
export const RECLAIMER_ACQUISITION_RANGE_METRES = 6.5;
export const RECLAIMER_LINK_BREAK_RANGE_METRES = 7.5;

export type ReclaimerRepairRank = "standard" | "elite" | "mini-boss" | "boss";
export type ReclaimerRepairPhase = "seeking" | "channel" | "recovery";

export interface ReclaimerRepairTarget {
  readonly id: number;
  readonly type: string;
  readonly position: Vector2Data;
  readonly health: number;
  readonly maxHealth: number;
  readonly dead: boolean;
  readonly machine: boolean;
  readonly rank: ReclaimerRepairRank;
}

export interface ReclaimerRepairState {
  readonly phase: ReclaimerRepairPhase;
  readonly phaseRemainingSeconds: number;
  readonly cooldownSeconds: number;
  readonly chargesRemaining: number;
  readonly targetId: number | null;
}

export interface ReclaimerRepairStepResult {
  readonly state: ReclaimerRepairState;
  readonly completedRepair: { readonly targetId: number; readonly amount: number } | null;
  readonly interrupted: boolean;
}

export function createReclaimerRepairBehavior(): ReclaimerRepairState {
  return {
    phase: "seeking",
    phaseRemainingSeconds: 0,
    cooldownSeconds: 0.7,
    chargesRemaining: RECLAIMER_PATCH_CHARGES,
    targetId: null,
  };
}

export function selectReclaimerRepairTarget(
  ownerId: number,
  ownerPosition: Readonly<Vector2Data>,
  targets: readonly ReclaimerRepairTarget[],
): ReclaimerRepairTarget | null {
  return targets.filter((target) => (
    target.id !== ownerId
    && target.type !== "cyborg-reclaimer"
    && target.machine
    && !target.dead
    && target.health > 0
    && target.health < target.maxHealth
    && target.rank !== "mini-boss"
    && target.rank !== "boss"
    && distance(ownerPosition, target.position) <= RECLAIMER_ACQUISITION_RANGE_METRES
  )).sort((left, right) => (
    left.health / left.maxHealth - right.health / right.maxHealth
    || distance(ownerPosition, left.position) - distance(ownerPosition, right.position)
    || left.id - right.id
  ))[0] ?? null;
}

/**
 * The encounter passes the current active-link owner. A different owner blocks
 * acquisition, guaranteeing that only one repair tether can exist at a time.
 */
export function tryBeginReclaimerRepair(
  state: ReclaimerRepairState,
  ownerId: number,
  ownerPosition: Readonly<Vector2Data>,
  targets: readonly ReclaimerRepairTarget[],
  activeLinkOwnerId: number | null,
): ReclaimerRepairState {
  if (
    state.phase !== "seeking"
    || state.cooldownSeconds > 0
    || state.chargesRemaining <= 0
    || (activeLinkOwnerId !== null && activeLinkOwnerId !== ownerId)
  ) return state;
  const target = selectReclaimerRepairTarget(ownerId, ownerPosition, targets);
  if (!target) return state;
  return {
    ...state,
    phase: "channel",
    phaseRemainingSeconds: RECLAIMER_CHANNEL_SECONDS,
    targetId: target.id,
  };
}

export function stepReclaimerRepair(
  state: ReclaimerRepairState,
  deltaSeconds: number,
  ownerPosition: Readonly<Vector2Data>,
  lockedTarget: ReclaimerRepairTarget | null,
  ownerWasDamaged: boolean,
): ReclaimerRepairStepResult {
  const delta = Math.max(0, deltaSeconds);
  if (state.phase === "seeking") {
    return {
      state: { ...state, cooldownSeconds: Math.max(0, state.cooldownSeconds - delta) },
      completedRepair: null,
      interrupted: false,
    };
  }

  if (state.phase === "channel") {
    const invalidTarget = !lockedTarget
      || lockedTarget.id !== state.targetId
      || lockedTarget.dead
      || lockedTarget.health <= 0
      || lockedTarget.health >= lockedTarget.maxHealth
      || !lockedTarget.machine
      || lockedTarget.type === "cyborg-reclaimer"
      || lockedTarget.rank === "mini-boss"
      || lockedTarget.rank === "boss"
      || distance(ownerPosition, lockedTarget.position) > RECLAIMER_LINK_BREAK_RANGE_METRES;
    if (ownerWasDamaged || invalidTarget) {
      return {
        state: enterRecovery(state, false),
        completedRepair: null,
        interrupted: true,
      };
    }
    const phaseRemainingSeconds = Math.max(0, state.phaseRemainingSeconds - delta);
    if (phaseRemainingSeconds > 0) {
      return {
        state: { ...state, phaseRemainingSeconds },
        completedRepair: null,
        interrupted: false,
      };
    }
    const amount = Math.min(RECLAIMER_REPAIR_AMOUNT, lockedTarget.maxHealth - lockedTarget.health);
    return {
      state: enterRecovery(state, true),
      completedRepair: { targetId: lockedTarget.id, amount },
      interrupted: false,
    };
  }

  const phaseRemainingSeconds = Math.max(0, state.phaseRemainingSeconds - delta);
  if (phaseRemainingSeconds > 0) {
    return {
      state: { ...state, phaseRemainingSeconds },
      completedRepair: null,
      interrupted: false,
    };
  }
  return {
    state: {
      phase: "seeking",
      phaseRemainingSeconds: 0,
      cooldownSeconds: RECLAIMER_COOLDOWN_SECONDS,
      chargesRemaining: state.chargesRemaining,
      targetId: null,
    },
    completedRepair: null,
    interrupted: false,
  };
}

export function applyReclaimerRepair(
  target: ReclaimerRepairTarget,
  amount: number,
): ReclaimerRepairTarget {
  return { ...target, health: Math.min(target.maxHealth, target.health + Math.max(0, amount)) };
}

function enterRecovery(state: ReclaimerRepairState, consumeCharge: boolean): ReclaimerRepairState {
  return {
    ...state,
    phase: "recovery",
    phaseRemainingSeconds: RECLAIMER_RECOVERY_SECONDS,
    chargesRemaining: Math.max(0, state.chargesRemaining - (consumeCharge ? 1 : 0)),
    targetId: null,
  };
}

function distance(left: Readonly<Vector2Data>, right: Readonly<Vector2Data>): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}
