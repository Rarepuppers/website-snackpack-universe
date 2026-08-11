import {
  CombatSimulation,
  type BossKind,
  type CombatEvent,
  type CombatSnapshot,
  type EnemySnapshot,
} from "../combat/CombatSimulation";
import { VERTICAL_SLICE_WEAPON_IDS } from "../content/weaponCatalog";
import type { ExpeditionBuildSnapshot } from "../expedition/ExpeditionRun";
import type { HeroDefinition } from "../hero/HeroDefinition";
import type { PlayerIntent } from "../input/PlayerIntent";
import type { Vector2Data } from "../math/Vector2Data";

export type RegionalBossStrategy = "warning-response" | "core-rush" | "summon-control";

export interface RegionalBossAuditRow {
  readonly boss: Exclude<BossKind, "bastion-eater">;
  readonly strategy: RegionalBossStrategy;
  readonly heroId: HeroDefinition["id"];
  readonly seed: number;
  readonly outcome: "victory" | "defeat" | "timeout";
  readonly durationSeconds: number;
  readonly damageTaken: number;
  readonly bossDamage: number;
  readonly peakLiveEnemies: number;
  readonly phaseTransitions: number;
  readonly pulseHits: number;
  readonly floodHits: number;
  readonly fabricationWaves: number;
  readonly fabricatedChildren: number;
  readonly childDefeats: number;
}

export interface RegionalBossAuditSummary {
  readonly boss: RegionalBossAuditRow["boss"];
  readonly strategy: RegionalBossStrategy;
  readonly runs: number;
  readonly wins: number;
  readonly winRate: number;
  readonly medianDurationSeconds: number;
  readonly medianDamageTaken: number;
  readonly medianPeakLiveEnemies: number;
}

const HERO_ROTATION: readonly HeroDefinition["id"][] = ["marine", "medic", "assault", "tactician", "scout"];
const STEP_SECONDS = 0.05;

/**
 * Deterministic boss-only preflight for catching impossible mechanics and large
 * strategy imbalances before observed campaign runs. It intentionally uses the
 * public simulation contract and a documented level-10 boss-entry build inside
 * the projected campaign band; it is not a claim about full-run completion balance.
 */
export function runRegionalBossBalanceAudit(seeds = 5, maxSeconds = 180): RegionalBossAuditRow[] {
  const rows: RegionalBossAuditRow[] = [];
  const count = Math.max(1, Math.floor(seeds));
  for (let seed = 1; seed <= count; seed += 1) {
    const heroId = HERO_ROTATION[(seed - 1) % HERO_ROTATION.length]!;
    rows.push(runBoss("the-choir", "warning-response", heroId, seed, maxSeconds));
    rows.push(runBoss("foundry-sovereign", "core-rush", heroId, seed, maxSeconds));
    rows.push(runBoss("foundry-sovereign", "summon-control", heroId, seed, maxSeconds));
  }
  return rows;
}

export function summarizeRegionalBossBalanceAudit(
  rows: readonly RegionalBossAuditRow[],
): RegionalBossAuditSummary[] {
  const groups = new Map<string, RegionalBossAuditRow[]>();
  for (const row of rows) {
    const key = `${row.boss}:${row.strategy}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups.values()].map((group) => {
    const wins = group.filter((row) => row.outcome === "victory").length;
    return {
      boss: group[0]!.boss,
      strategy: group[0]!.strategy,
      runs: group.length,
      wins,
      winRate: wins / group.length,
      medianDurationSeconds: median(group.map((row) => row.durationSeconds)),
      medianDamageTaken: median(group.map((row) => row.damageTaken)),
      medianPeakLiveEnemies: median(group.map((row) => row.peakLiveEnemies)),
    };
  });
}

function runBoss(
  boss: RegionalBossAuditRow["boss"],
  strategy: RegionalBossStrategy,
  heroId: HeroDefinition["id"],
  seed: number,
  maxSeconds: number,
): RegionalBossAuditRow {
  const simulation = new CombatSimulation({
    scenario: boss,
    heroId,
    seed,
    autoStartWaves: false,
    autoFireEnabled: true,
    startingBuild: representativeBossEntryBuild(),
  });
  let snapshot = simulation.snapshot();
  let elapsed = 0;
  let peakLiveEnemies = snapshot.enemies.length;
  let phaseTransitions = 0;
  let pulseHits = 0;
  let floodHits = 0;
  let fabricationWaves = 0;
  let fabricatedChildren = 0;
  let childDefeats = 0;

  while (elapsed < maxSeconds && snapshot.status === "combat") {
    if (snapshot.pendingDecision?.options[0]) simulation.chooseOption(snapshot.pendingDecision.options[0].id);
    snapshot = simulation.step(bossIntent(snapshot, boss, strategy, elapsed), STEP_SECONDS);
    elapsed += STEP_SECONDS;
    peakLiveEnemies = Math.max(peakLiveEnemies, snapshot.enemies.length);
    for (const event of snapshot.events) {
      if (event.type === "choir-voice-collapsed" || event.type === "choir-merged") phaseTransitions += 1;
      if (event.type === "choir-pulse" && event.hitPlayer) pulseHits += 1;
      if (event.type === "choir-flood-hit") floodHits += 1;
      if (event.type === "sovereign-fabricated") {
        fabricationWaves += 1;
        fabricatedChildren += event.childIds.length;
      }
      if (event.type === "enemy-defeated" && isFoundryChildDefeat(event)) childDefeats += 1;
    }
  }

  return {
    boss,
    strategy,
    heroId,
    seed,
    outcome: snapshot.status === "victory" || snapshot.status === "defeat" ? snapshot.status : "timeout",
    durationSeconds: round(elapsed),
    damageTaken: round(Object.values(snapshot.runMetrics.damageTakenBySource).reduce((sum, value) => sum + value, 0)),
    bossDamage: round(snapshot.runMetrics.bossDamage),
    peakLiveEnemies,
    phaseTransitions,
    pulseHits,
    floodHits,
    fabricationWaves,
    fabricatedChildren,
    childDefeats,
  };
}

function representativeBossEntryBuild(): ExpeditionBuildSnapshot {
  return {
    health: 99,
    shield: 2,
    level: 10,
    experience: 0,
    scrap: 0,
    weapons: VERTICAL_SLICE_WEAPON_IDS.map((weaponId) => ({ weaponId, tier: 2 })),
    upgrades: [],
    maxHealthBonus: 2,
    itemStats: {
      maxHpFlat: 3,
      armourFlat: 2,
      dodgePercent: 5,
      hpRegenPerSecond: 0.1,
    },
  };
}

function bossIntent(
  snapshot: CombatSnapshot,
  bossKind: RegionalBossAuditRow["boss"],
  strategy: RegionalBossStrategy,
  elapsed: number,
): PlayerIntent {
  const boss = snapshot.enemies.find((enemy) => enemy.type === bossKind);
  const children = snapshot.enemies.filter((enemy) => enemy.foundryOwnerId === boss?.id);
  const target = strategy === "summon-control" && children.length > 0
    ? nearest(snapshot.playerPosition, children)
    : boss;
  const aim = target ? normalizedToward(snapshot.playerPosition, target.position) : { x: 1, y: 0 };
  const move = bossKind === "the-choir" && boss
    ? choirMovement(snapshot.playerPosition, boss)
    : sovereignMovement(snapshot.playerPosition, boss, target, strategy, elapsed);
  const frame = Math.round(elapsed / STEP_SECONDS);
  return {
    move,
    aim,
    fireHeld: true,
    evasiveMovePressed: frame > 0 && frame % 50 === 0,
    ultimatePressed: frame > 0 && frame % 100 === 0,
    kitPressed: false,
    interactPressed: false,
    pausePressed: false,
    restartPressed: false,
  };
}

function choirMovement(player: Vector2Data, boss: EnemySnapshot): Vector2Data {
  const distance = separation(player, boss.position);
  const warning = boss.choirAttackPhase === "warning";
  // Linked/merged pulses are answered by leaving their warned radius. During
  // cooldown the policy collapses back inside the merged flood boundary.
  if (warning && distance < (boss.choirPhase === "merged" ? 7 : 5)) {
    return normalizedToward(boss.position, player);
  }
  if (!warning && boss.choirPhase === "merged" && distance > 3.6) {
    return normalizedToward(player, boss.position);
  }
  return tangentAround(player, boss.position);
}

function sovereignMovement(
  player: Vector2Data,
  boss: EnemySnapshot | undefined,
  target: EnemySnapshot | undefined,
  strategy: RegionalBossStrategy,
  elapsed: number,
): Vector2Data {
  if (!boss) return { x: 0, y: 0 };
  if (strategy === "summon-control" && target && target.id !== boss.id) {
    const distance = separation(player, target.position);
    return distance > 7 ? normalizedToward(player, target.position) : tangentAround(player, target.position);
  }
  const distance = separation(player, boss.position);
  if (distance > 7.5) return normalizedToward(player, boss.position);
  const tangent = tangentAround(player, boss.position);
  return elapsed % 8 < 4 ? tangent : { x: -tangent.x, y: -tangent.y };
}

function nearest(origin: Vector2Data, candidates: readonly EnemySnapshot[]): EnemySnapshot | undefined {
  return [...candidates].sort((left, right) => separation(origin, left.position) - separation(origin, right.position))[0];
}

function normalizedToward(from: Vector2Data, to: Vector2Data): Vector2Data {
  const x = to.x - from.x;
  const y = to.y - from.y;
  const length = Math.hypot(x, y);
  return length > 0.0001 ? { x: x / length, y: y / length } : { x: 0, y: 0 };
}

function tangentAround(from: Vector2Data, centre: Vector2Data): Vector2Data {
  const radial = normalizedToward(centre, from);
  return { x: -radial.y, y: radial.x };
}

function separation(left: Vector2Data, right: Vector2Data): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function isFoundryChildDefeat(event: Extract<CombatEvent, { type: "enemy-defeated" }>): boolean {
  return event.enemyType === "foundry-drone" || event.enemyType === "foundry-turret";
}

function median(values: readonly number[]): number {
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.floor(ordered.length / 2)] ?? 0;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
