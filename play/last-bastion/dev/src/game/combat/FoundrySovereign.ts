export type FoundrySovereignPhase = "cooldown" | "warning" | "fabricating";
export type SovereignChildType = "foundry-drone" | "foundry-turret";

export interface FoundrySovereignState {
  readonly phase: FoundrySovereignPhase;
  readonly phaseRemainingSeconds: number;
  readonly waveIndex: number;
}

export interface FoundrySovereignStepResult {
  readonly state: FoundrySovereignState;
  readonly warning: boolean;
  readonly fabricated: readonly SovereignChildType[];
  readonly summonBuffMultiplier: number;
}

export const SOVEREIGN_WARNING_SECONDS = 0.9;

export function createFoundrySovereignState(): FoundrySovereignState {
  return { phase: "cooldown", phaseRemainingSeconds: 1.4, waveIndex: 0 };
}

export function sovereignWave(waveIndex: number): readonly SovereignChildType[] {
  const pattern = Math.max(0, Math.floor(waveIndex)) % 3;
  if (pattern === 0) return ["foundry-drone", "foundry-drone"];
  if (pattern === 1) return ["foundry-drone", "foundry-turret"];
  return ["foundry-turret", "foundry-turret"];
}

export function sovereignSummonBuff(waveIndex: number): number {
  return Math.min(1.5, 1 + Math.max(0, Math.floor(waveIndex)) * 0.1);
}

export function stepFoundrySovereign(
  state: FoundrySovereignState,
  deltaSeconds: number,
): FoundrySovereignStepResult {
  let phaseRemainingSeconds = state.phaseRemainingSeconds - deltaSeconds;
  let phase = state.phase;
  let waveIndex = state.waveIndex;
  let warning = false;
  let fabricated: readonly SovereignChildType[] = [];

  if (phaseRemainingSeconds <= 0) {
    if (phase === "cooldown") {
      phase = "warning";
      phaseRemainingSeconds = SOVEREIGN_WARNING_SECONDS;
      warning = true;
    } else if (phase === "warning") {
      phase = "fabricating";
      phaseRemainingSeconds = 0.45;
      fabricated = sovereignWave(waveIndex);
    } else {
      waveIndex += 1;
      phase = "cooldown";
      phaseRemainingSeconds = Math.max(2.8, 5 - waveIndex * 0.25);
    }
  }

  return {
    state: { phase, phaseRemainingSeconds, waveIndex },
    warning,
    fabricated,
    summonBuffMultiplier: sovereignSummonBuff(waveIndex),
  };
}
