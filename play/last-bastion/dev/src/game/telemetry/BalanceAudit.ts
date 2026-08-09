import { CombatSimulation } from "../combat/CombatSimulation";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatTelemetryAccumulator, type CombatTelemetrySnapshot } from "./CombatTelemetry";

export type BalanceAuditPolicy = "cautious" | "greedy-damage" | "sustain-first" | "random";
export interface BalanceAuditOptions { seeds?: number; policies?: readonly BalanceAuditPolicy[]; maxSeconds?: number; }
export interface BalanceAuditRow extends CombatTelemetrySnapshot { heroId: string; seed: number; policy: BalanceAuditPolicy; level: number; outcome: string; finalScrap: number; }
export interface BalanceAuditPercentiles { heroId: string; policy: BalanceAuditPolicy; bossEntryLevel: [number, number, number]; finalScrap: [number, number, number]; purchases: [number, number, number]; damageTaken: [number, number, number]; peakDensity: [number, number, number]; winRate: number; }

const idle: PlayerIntent = { move: { x: 0, y: 0 }, aim: { x: 1, y: 0 }, fireHeld: true, evasiveMovePressed: false, ultimatePressed: false, interactPressed: false, kitPressed: false, pausePressed: false, restartPressed: false };
function choosePolicyOption(simulation: CombatSimulation, policy: BalanceAuditPolicy, options: readonly { id: string }[]): void {
  if (!options.length) return;
  const index = policy === "greedy-damage" ? 0 : policy === "sustain-first" ? Math.min(1, options.length - 1) : 0;
  simulation.chooseOption(options[index]?.id ?? options[0]?.id ?? "");
}

export function runBalanceAudit(options: BalanceAuditOptions = {}): BalanceAuditRow[] {
  const seeds = Math.max(1, Math.floor(options.seeds ?? 100));
  const policies = options.policies ?? ["cautious", "greedy-damage", "sustain-first", "random"];
  const maxSeconds = Math.max(1, options.maxSeconds ?? 90);
  const rows: BalanceAuditRow[] = [];
  for (const heroId of ["marine", "medic", "assault"] as const) for (let seed = 1; seed <= seeds; seed += 1) for (const policy of policies) {
    const simulation = new CombatSimulation({ heroId, seed, autoStartWaves: true, autoFireEnabled: true });
    const telemetry = new CombatTelemetryAccumulator();
    let snapshot = simulation.snapshot();
    for (let elapsed = 0; elapsed < maxSeconds && snapshot.status === "combat"; elapsed += 0.05) {
      if (snapshot.pendingDecision) choosePolicyOption(simulation, policy, snapshot.pendingDecision.options);
      snapshot = simulation.step(idle, 0.05);
      telemetry.recordSnapshot(0.05, snapshot);
    }
    rows.push({ ...telemetry.toSnapshot(), heroId, seed, policy, level: snapshot.level, outcome: snapshot.status, finalScrap: snapshot.securedScrap });
  }
  return rows;
}

function percentiles(values: number[]): [number, number, number] {
  const ordered = [...values].sort((a, b) => a - b);
  const at = (fraction: number) => ordered[Math.min(ordered.length - 1, Math.floor(ordered.length * fraction))] ?? 0;
  return [at(0.1), at(0.5), at(0.9)];
}

export function summarizeBalanceAudit(rows: readonly BalanceAuditRow[]): BalanceAuditPercentiles[] {
  const groups = new Map<string, BalanceAuditRow[]>();
  for (const row of rows) {
    const key = `${row.heroId}:${row.policy}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups.values()].map((group) => ({
    heroId: group[0]?.heroId ?? "unknown",
    policy: group[0]?.policy ?? "cautious",
    bossEntryLevel: percentiles(group.map((row) => row.level)),
    finalScrap: percentiles(group.map((row) => row.finalScrap)),
    purchases: percentiles(group.map(() => 0)),
    damageTaken: percentiles(group.map((row) => Object.values(row.damageTaken).reduce((sum, value) => sum + value, 0))),
    peakDensity: percentiles(group.map((row) => row.peakLiveEnemies)),
    winRate: group.filter((row) => row.outcome === "victory").length / group.length,
  }));
}
