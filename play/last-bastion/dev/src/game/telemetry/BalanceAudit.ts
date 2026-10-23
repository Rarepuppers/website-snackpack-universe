import { CombatSimulation } from "../combat/CombatSimulation";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatTelemetryAccumulator, type CombatTelemetrySnapshot } from "./CombatTelemetry";

export const BALANCE_AUDIT_POLICIES = ["cautious", "greedy-damage", "sustain-first", "random"] as const;
export type BalanceAuditPolicy = typeof BALANCE_AUDIT_POLICIES[number];
export interface BalanceAuditOptions { seeds?: number; policies?: readonly BalanceAuditPolicy[]; maxSeconds?: number; }
export interface BalanceAuditRow extends Omit<CombatTelemetrySnapshot, "dodges" | "xpSpawned" | "xpLost"> {
  heroId: string; seed: number; policy: BalanceAuditPolicy; level: number;
  outcome: "victory" | "defeat" | "censored"; finalStatus: string; finalScrap: number;
  budgetSeconds: number; simulatedSeconds: number;
  dodges: null; xpSpawned: null; xpLost: null;
}
export interface BalanceAuditPercentiles {
  heroId: string; policy: BalanceAuditPolicy; finalLevel: [number, number, number];
  finalScrap: [number, number, number]; purchases: null;
  damageTaken: [number, number, number]; peakDensity: [number, number, number];
  runs: number; completed: number; censored: number; wins: number; losses: number;
  completedWinRate: number | null;
}

export function normalizeBalanceAuditOptions(options: BalanceAuditOptions = {}): Required<BalanceAuditOptions> {
  const seeds = options.seeds ?? 100;
  const policies = options.policies ?? BALANCE_AUDIT_POLICIES;
  const maxSeconds = options.maxSeconds ?? 90;
  if (!Number.isSafeInteger(seeds) || seeds < 1 || seeds > 1000) throw new Error("seeds must be an integer from 1 to 1000");
  if (!Number.isFinite(maxSeconds) || maxSeconds <= 0 || maxSeconds > 3600) throw new Error("maxSeconds must be greater than 0 and at most 3600");
  if (!policies.length || new Set(policies).size !== policies.length || policies.some(policy => !BALANCE_AUDIT_POLICIES.includes(policy))) {
    throw new Error("policies must be a nonempty, unique list of supported policies");
  }
  return { seeds, policies: [...policies], maxSeconds };
}

const idle: PlayerIntent = { move: { x: 0, y: 0 }, aim: { x: 1, y: 0 }, fireHeld: true, evasiveMovePressed: false, ultimatePressed: false, interactPressed: false, kitPressed: false, pausePressed: false, restartPressed: false };

function auditIntent(policy: BalanceAuditPolicy, elapsed: number, seed: number): PlayerIntent {
  const frame = Math.round(elapsed / 0.05);
  const phase = elapsed * 0.72 + seed * 0.37;
  const aimPhase = elapsed * 0.41 + seed * 0.19;
  const move = policy === "greedy-damage"
    ? { x: 0, y: 0 }
    : policy === "sustain-first"
      ? { x: Math.cos(phase) * 0.7, y: Math.sin(phase) * 0.7 }
      : policy === "random"
        ? { x: Math.cos(phase * 2.17), y: Math.sin(phase * 1.63) }
        : { x: Math.cos(phase), y: Math.sin(phase) };
  const evadeCadenceFrames = policy === "sustain-first" ? 72 : policy === "greedy-damage" ? 150 : 100;
  return {
    ...idle,
    move,
    aim: { x: Math.cos(aimPhase), y: Math.sin(aimPhase) },
    evasiveMovePressed: frame % evadeCadenceFrames === 0,
    ultimatePressed: frame % 20 === 0,
  };
}
function choosePolicyOption(simulation: CombatSimulation, policy: BalanceAuditPolicy, options: readonly { id: string }[]): void {
  if (!options.length) return;
  const index = policy === "greedy-damage" ? 0 : policy === "sustain-first" ? Math.min(1, options.length - 1) : 0;
  simulation.chooseOption(options[index]?.id ?? options[0]?.id ?? "");
}

export function runBalanceAudit(options: BalanceAuditOptions = {}): BalanceAuditRow[] {
  const { seeds, policies, maxSeconds } = normalizeBalanceAuditOptions(options);
  const rows: BalanceAuditRow[] = [];
  for (const heroId of ["marine", "medic", "assault", "tactician", "scout"] as const) for (let seed = 1; seed <= seeds; seed += 1) for (const policy of policies) {
    const simulation = new CombatSimulation({ heroId, seed, autoStartWaves: true, autoFireEnabled: true });
    const telemetry = new CombatTelemetryAccumulator();
    let snapshot = simulation.snapshot();
    let budgetSeconds = 0;
    for (let tick = 0; tick < Math.ceil(maxSeconds / 0.05) && snapshot.status !== "victory" && snapshot.status !== "defeat"; tick++) {
      const elapsed = tick * 0.05;
      const delta = Math.min(0.05, maxSeconds - elapsed);
      if (snapshot.pendingDecision) choosePolicyOption(simulation, policy, snapshot.pendingDecision.options);
      const previousSeconds = snapshot.runMetrics.elapsedSeconds;
      snapshot = simulation.step(auditIntent(policy, elapsed, seed), delta);
      telemetry.recordSnapshot(snapshot.runMetrics.elapsedSeconds - previousSeconds, snapshot);
      budgetSeconds = elapsed + delta;
    }
    rows.push({ ...telemetry.toSnapshot(), dodges: null, xpSpawned: null, xpLost: null,
      heroId, seed, policy, level: snapshot.level,
      outcome: snapshot.status === "victory" || snapshot.status === "defeat" ? snapshot.status : "censored",
      finalStatus: snapshot.status, finalScrap: snapshot.securedScrap,
      budgetSeconds, simulatedSeconds: snapshot.runMetrics.elapsedSeconds });
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
    finalLevel: percentiles(group.map((row) => row.level)),
    finalScrap: percentiles(group.map((row) => row.finalScrap)),
    purchases: null,
    damageTaken: percentiles(group.map((row) => Object.values(row.damageTaken).reduce((sum, value) => sum + value, 0))),
    peakDensity: percentiles(group.map((row) => row.peakLiveEnemies)),
    runs: group.length,
    completed: group.filter(row => row.outcome !== "censored").length,
    censored: group.filter(row => row.outcome === "censored").length,
    wins: group.filter(row => row.outcome === "victory").length,
    losses: group.filter(row => row.outcome === "defeat").length,
    completedWinRate: group.some(row => row.outcome !== "censored")
      ? group.filter(row => row.outcome === "victory").length / group.filter(row => row.outcome !== "censored").length
      : null,
  }));
}
