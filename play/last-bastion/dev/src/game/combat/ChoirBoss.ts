import type { Vector2Data } from "../math/Vector2Data";

export type ChoirPhase = "linked" | "merged";
export type ChoirAttackPhase = "cooldown" | "warning";

export interface ChoirBossState {
  readonly phase: ChoirPhase;
  readonly voicesActive: 1 | 2 | 3;
  readonly attackPhase: ChoirAttackPhase;
  readonly phaseRemainingSeconds: number;
  readonly floodTickRemainingSeconds: number;
  readonly attackCount: number;
}

export interface ChoirBossStepInput {
  readonly state: ChoirBossState;
  readonly deltaSeconds: number;
  readonly health: number;
  readonly maxHealth: number;
  readonly ownerPosition: Vector2Data;
  readonly playerPosition: Vector2Data;
}

export interface ChoirBossStepResult {
  readonly state: ChoirBossState;
  readonly voiceCollapsed: boolean;
  readonly merged: boolean;
  readonly warning: boolean;
  readonly pulse: boolean;
  readonly pulseHitPlayer: boolean;
  readonly floodHitPlayer: boolean;
  readonly pulseRadiusMetres: number;
  readonly safeRadiusMetres: number | null;
}

export const CHOIR_WARNING_SECONDS = 0.8;
export const CHOIR_LINKED_PULSE_RADIUS_METRES = 4.25;
export const CHOIR_MERGED_PULSE_RADIUS_METRES = 6.25;
export const CHOIR_FLOOD_SAFE_RADIUS_METRES = 4.5;
export const CHOIR_PULSE_DAMAGE = 2.25;
export const CHOIR_FLOOD_DAMAGE = 0.75;
export const CHOIR_FLOOD_TICK_SECONDS = 0.5;

export function createChoirBossState(): ChoirBossState {
  return {
    phase: "linked",
    voicesActive: 3,
    attackPhase: "cooldown",
    phaseRemainingSeconds: 1.2,
    floodTickRemainingSeconds: CHOIR_FLOOD_TICK_SECONDS,
    attackCount: 0,
  };
}

export function choirVoicePositions(position: Vector2Data, phase: ChoirPhase): readonly Vector2Data[] {
  if (phase === "merged") return [{ ...position }];
  return [
    { x: position.x, y: position.y - 1.55 },
    { x: position.x - 1.4, y: position.y + 0.9 },
    { x: position.x + 1.4, y: position.y + 0.9 },
  ];
}

export function stepChoirBoss(input: ChoirBossStepInput): ChoirBossStepResult {
  const ratio = input.maxHealth > 0 ? input.health / input.maxHealth : 0;
  const merged = input.state.phase === "linked" && ratio <= 0.5;
  const nextPhase: ChoirPhase = merged ? "merged" : input.state.phase;
  const desiredVoices: 1 | 2 | 3 = nextPhase === "merged" ? 1 : ratio <= 0.75 ? 2 : 3;
  const voiceCollapsed = desiredVoices < input.state.voicesActive;
  let attackPhase = input.state.attackPhase;
  let phaseRemainingSeconds = input.state.phaseRemainingSeconds - input.deltaSeconds;
  let warning = false;
  let pulse = false;
  let attackCount = input.state.attackCount;

  if (merged) {
    attackPhase = "warning";
    phaseRemainingSeconds = CHOIR_WARNING_SECONDS;
    warning = true;
  } else if (phaseRemainingSeconds <= 0) {
    if (attackPhase === "cooldown") {
      attackPhase = "warning";
      phaseRemainingSeconds = CHOIR_WARNING_SECONDS;
      warning = true;
    } else {
      attackPhase = "cooldown";
      phaseRemainingSeconds = nextPhase === "merged" ? 1.25 : 2.5 - (3 - desiredVoices) * 0.45;
      pulse = true;
      attackCount += 1;
    }
  }

  const pulseRadiusMetres = nextPhase === "merged"
    ? CHOIR_MERGED_PULSE_RADIUS_METRES
    : CHOIR_LINKED_PULSE_RADIUS_METRES;
  const pulseHitPlayer = pulse && choirVoicePositions(input.ownerPosition, nextPhase)
    .slice(0, desiredVoices)
    .some((voice) => distance(voice, input.playerPosition) <= pulseRadiusMetres);
  let floodTickRemainingSeconds = input.state.floodTickRemainingSeconds - input.deltaSeconds;
  let floodHitPlayer = false;
  if (nextPhase === "merged" && floodTickRemainingSeconds <= 0) {
    floodTickRemainingSeconds = CHOIR_FLOOD_TICK_SECONDS;
    floodHitPlayer = distance(input.ownerPosition, input.playerPosition) > CHOIR_FLOOD_SAFE_RADIUS_METRES;
  }

  return {
    state: {
      phase: nextPhase,
      voicesActive: desiredVoices,
      attackPhase,
      phaseRemainingSeconds,
      floodTickRemainingSeconds,
      attackCount,
    },
    voiceCollapsed,
    merged,
    warning,
    pulse,
    pulseHitPlayer,
    floodHitPlayer,
    pulseRadiusMetres,
    safeRadiusMetres: nextPhase === "merged" ? CHOIR_FLOOD_SAFE_RADIUS_METRES : null,
  };
}

function distance(left: Vector2Data, right: Vector2Data): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}
