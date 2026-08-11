import type { EnemySnapshot, PowerupType } from "../combat/CombatSimulation";

export interface StatusHudTiming {
  readonly fraction: number;
  readonly urgent: boolean;
  readonly timerLabel: string;
}

export interface BossHudPresentation {
  readonly name: string;
  readonly phaseLabel: string;
  readonly healthLabel: string;
  readonly healthRatio: number;
  readonly critical: boolean;
}

export function statusHudTiming(remainingSeconds: number, durationSeconds: number): StatusHudTiming {
  const safeRemaining = Math.max(0, remainingSeconds);
  return {
    fraction: Math.max(0, Math.min(safeRemaining / Math.max(durationSeconds, 0.001), 1)),
    urgent: safeRemaining <= 3,
    timerLabel: safeRemaining.toFixed(1),
  };
}

export function statusAbbreviation(type: PowerupType): string {
  switch (type) {
    case "overcharge": return "OC";
    case "adrenaline": return "AD";
    case "magnet-pulse": return "MP";
    case "uranium-core-rounds": return "U25";
    case "siege-loader": return "SGE";
    case "phase-jacket": return "PHJ";
    case "hunter-optics": return "OPT";
    case "last-stand-stimulant": return "LSS";
    default: return "SH";
  }
}

export function bossHudPresentation(enemies: readonly EnemySnapshot[]): BossHudPresentation | null {
  const boss = enemies.find((enemy) => enemy.rank === "boss" || enemy.rank === "mini-boss");
  if (!boss) return null;

  const healthRatio = Math.max(0, Math.min(boss.health / Math.max(1, boss.maxHealth), 1));
  const phase = boss.type === "bastion-eater"
    ? boss.bastionEaterPhase
    : boss.type === "the-choir"
      ? boss.choirPhase
      : boss.type === "foundry-sovereign"
        ? boss.sovereignPhase
    : boss.miniBossKind === "brood-warden"
      ? boss.broodWardenPhase
      : boss.miniBossKind === "rift-stalker"
        ? boss.riftStalkerPhase
        : boss.miniBossKind === "synapse-herald"
          ? boss.synapseHeraldPhase
          : boss.miniBossKind === "assembly-prime"
            ? boss.assemblyPrimePhase
            : boss.miniBossKind === "storm-regent"
              ? boss.stormRegentPhase
              : boss.miniBossKind === "abomination-prime"
                ? boss.abominationPrimePhase
                : boss.siegeCrusherPhase;
  const state = healthRatio <= 0.2 ? "FRENZY" : healthRatio <= 0.5 ? "ENRAGED" : "";

  return {
    name: bossName(boss),
    phaseLabel: `${(phase ?? "stalk").replaceAll("-", " ").toUpperCase()}${state ? `  /  ${state}` : ""}`,
    healthLabel: `${Math.ceil(boss.health)} / ${boss.maxHealth}`,
    healthRatio,
    critical: healthRatio <= 0.2,
  };
}

function bossName(boss: EnemySnapshot): string {
  if (boss.type === "bastion-eater") return "THE BASTION EATER";
  if (boss.type === "the-choir") return "THE CHOIR";
  if (boss.type === "foundry-sovereign") return "FOUNDRY SOVEREIGN";
  switch (boss.miniBossKind) {
    case "brood-warden": return "BROOD WARDEN";
    case "rift-stalker": return "RIFT STALKER";
    case "synapse-herald": return "SYNAPSE HERALD";
    case "assembly-prime": return "ASSEMBLY PRIME";
    case "storm-regent": return "STORM REGENT";
    case "abomination-prime": return "ABOMINATION PRIME";
    default: return "SIEGE CRUSHER";
  }
}
