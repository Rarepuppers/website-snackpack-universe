import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation, type CombatScenario, type CombatSnapshot } from "./CombatSimulation";
import type { ExpeditionEncounterDescriptor } from "../expedition/ExpeditionEncounter";
import type { ExpeditionBuildSnapshot } from "../expedition/ExpeditionRun";
import { expeditionBuildFromCombatSnapshot } from "../expedition/ExpeditionBuildSnapshot";
import type { HeroDefinition } from "../hero/HeroDefinition";

export const REPLAY_FORMAT_VERSION = 2;
export { SIMULATION_COMPATIBILITY_VERSION } from "./SimulationCompatibility";
import { SIMULATION_COMPATIBILITY_VERSION } from "./SimulationCompatibility";
export const REPLAY_FIXED_DELTA_SECONDS = 1 / 60;

export interface ReplayInputSpan {
  readonly frames: number;
  readonly move?: Readonly<{ x: number; y: number }>;
  readonly aim?: Readonly<{ x: number; y: number }>;
  readonly fireHeld?: boolean;
  readonly toggleFireModeOnFirstFrame?: boolean;
  readonly evasiveMoveOnFirstFrame?: boolean;
  readonly interactOnFirstFrame?: boolean;
  readonly ultimateOnFirstFrame?: boolean;
  readonly kitOnFirstFrame?: boolean;
  /** Deterministic harness setup for objective and ranked-reward branches. */
  readonly defeatAllEnemiesOnFirstFrame?: boolean;
  /** Replays the pause-menu abandon command before this span's first step. */
  readonly abandonOnFirstFrame?: boolean;
  /** Decision option applied before the first simulation frame in this span. */
  readonly decisionOnFirstFrame?: string;
}

export interface CombatReplayFixture {
  readonly formatVersion: number;
  readonly simulationVersion: number;
  readonly seed: number;
  readonly scenario: CombatScenario;
  readonly fixedDeltaSeconds: number;
  readonly inputSpans: readonly ReplayInputSpan[];
  readonly expeditionEncounter?: ExpeditionEncounterDescriptor;
  readonly heroId?: HeroDefinition["id"];
  /** Initial run state. In a sequence this is read only from the first fixture. */
  readonly startingBuild?: ExpeditionBuildSnapshot;
}

export interface ReplayResult {
  readonly framesRun: number;
  readonly digest: string;
  readonly spanDigests: readonly string[];
  readonly snapshot: CombatSnapshot;
  readonly endingBuild: ExpeditionBuildSnapshot;
}

export interface ReplaySequenceResult {
  readonly encountersRun: number;
  readonly framesRun: number;
  readonly digest: string;
  readonly encounterDigests: readonly string[];
  readonly encounterBuilds: readonly ExpeditionBuildSnapshot[];
  readonly finalBuild: ExpeditionBuildSnapshot;
}

const NEUTRAL: PlayerIntent = {
  move: { x: 0, y: 0 }, aim: { x: 1, y: 0 }, fireHeld: false,
  toggleFireModePressed: false, evasiveMovePressed: false, interactPressed: false,
  ultimatePressed: false, kitPressed: false, pausePressed: false, restartPressed: false,
};

export function runCombatReplay(fixture: CombatReplayFixture): ReplayResult {
  validateReplayFixture(fixture);
  const simulation = new CombatSimulation({
    seed: fixture.seed,
    scenario: fixture.scenario,
    startingWeaponIds: ["bastion-service-rifle"],
    startingBuild: fixture.startingBuild,
    heroId: fixture.heroId,
    autoFireEnabled: false,
    expeditionEncounter: fixture.expeditionEncounter,
  });
  let framesRun = 0;
  const spanDigests: string[] = [];
  for (const span of fixture.inputSpans) {
    if (span.decisionOnFirstFrame && !simulation.chooseOption(span.decisionOnFirstFrame)) {
      throw new Error(`Replay decision is unavailable: ${span.decisionOnFirstFrame}`);
    }
    if (span.defeatAllEnemiesOnFirstFrame) {
      for (const enemy of simulation.snapshot().enemies) simulation.dealDamage(enemy.id, 99_999);
    }
    if (span.abandonOnFirstFrame) simulation.abandonRun();
    for (let frame = 0; frame < span.frames; frame += 1) {
      simulation.step({
        ...NEUTRAL,
        move: span.move ? { ...span.move } : NEUTRAL.move,
        aim: span.aim ? { ...span.aim } : NEUTRAL.aim,
        fireHeld: Boolean(span.fireHeld),
        toggleFireModePressed: Boolean(span.toggleFireModeOnFirstFrame && frame === 0),
        evasiveMovePressed: Boolean(span.evasiveMoveOnFirstFrame && frame === 0),
        interactPressed: Boolean(span.interactOnFirstFrame && frame === 0),
        ultimatePressed: Boolean(span.ultimateOnFirstFrame && frame === 0),
        kitPressed: Boolean(span.kitOnFirstFrame && frame === 0),
      }, fixture.fixedDeltaSeconds);
      framesRun += 1;
    }
    spanDigests.push(replaySnapshotDigest(simulation.snapshot(), fixture.seed));
  }
  const snapshot = simulation.snapshot();
  return {
    framesRun,
    digest: replaySnapshotDigest(snapshot, fixture.seed),
    spanDigests,
    snapshot,
    endingBuild: expeditionBuildFromCombatSnapshot(snapshot),
  };
}

/** Runs encounters in order, carrying the live game's saved build boundary between each node. */
export function runCombatReplaySequence(fixtures: readonly CombatReplayFixture[]): ReplaySequenceResult {
  if (fixtures.length === 0) throw new Error("Replay sequence requires at least one encounter");
  const results: ReplayResult[] = [];
  let carriedBuild: ExpeditionBuildSnapshot | undefined;
  fixtures.forEach((fixture, index) => {
    const result = runCombatReplay({
      ...fixture,
      startingBuild: index === 0 ? fixture.startingBuild : carriedBuild,
    });
    results.push(result);
    carriedBuild = result.endingBuild;
  });
  const encounterDigests = results.map((result) => result.digest);
  const encounterBuilds = results.map((result) => result.endingBuild);
  return {
    encountersRun: results.length,
    framesRun: results.reduce((total, result) => total + result.framesRun, 0),
    digest: fnvDigest(JSON.stringify(fixtures.map((fixture, index) => ({
      seed: fixture.seed,
      encounterSeed: fixture.expeditionEncounter?.seed ?? null,
      digest: encounterDigests[index],
    })))),
    encounterDigests,
    encounterBuilds,
    finalBuild: encounterBuilds[encounterBuilds.length - 1]!,
  };
}

export function validateReplayFixture(fixture: CombatReplayFixture): void {
  if (fixture.formatVersion !== REPLAY_FORMAT_VERSION) throw new Error(`Unsupported replay format ${fixture.formatVersion}`);
  if (fixture.simulationVersion !== SIMULATION_COMPATIBILITY_VERSION) throw new Error(`Unsupported simulation version ${fixture.simulationVersion}`);
  if (fixture.fixedDeltaSeconds !== REPLAY_FIXED_DELTA_SECONDS) throw new Error("Replay must use the canonical fixed timestep");
  if (!Number.isSafeInteger(fixture.seed)) throw new Error("Replay seed must be a safe integer");
  if (fixture.inputSpans.some((span) => !Number.isInteger(span.frames) || span.frames <= 0)) throw new Error("Replay spans require positive whole frames");
}

export function replaySnapshotDigest(snapshot: CombatSnapshot, seed = 0): string {
  const canonical = JSON.stringify({
    seed,
    status: snapshot.status,
    wave: snapshot.waveNumber,
    hero: snapshot.heroId,
    health: [
      round(snapshot.playerHealth),
      round(snapshot.playerMaxHealth),
      round(snapshot.playerBonusHealth),
      round(snapshot.playerMaxBonusHealth),
    ],
    shield: [round(snapshot.playerShield), round(snapshot.playerMaxShield)],
    progression: [snapshot.level, snapshot.experience, snapshot.experienceForNextLevel, snapshot.securedScrap],
    heroAction: {
      state: snapshot.heroState,
      evasiveReady: snapshot.evasiveReady,
      evasiveCooldown: round(snapshot.evasiveCooldownRemainingSeconds),
      ultimateReady: snapshot.ultimateReady,
      ultimateCooldown: round(snapshot.ultimateCooldownRemainingSeconds),
      uraniumKitAvailable: snapshot.uraniumKitAvailable,
    },
    player: [round(snapshot.playerPosition.x), round(snapshot.playerPosition.y)],
    kills: snapshot.runMetrics.kills,
    decision: snapshot.pendingDecision?.kind ?? "",
    weapons: snapshot.weaponInventory.rack.map((slot) => slot.tile
      ? [slot.id, slot.tile.instanceId, slot.tile.weaponId, slot.tile.tier]
      : [slot.id]),
    stash: snapshot.weaponInventory.stash.map((tile) => tile
      ? [tile.instanceId, tile.weaponId, tile.tier]
      : null),
    upgrades: [...snapshot.upgradeLevels]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((upgrade) => [upgrade.id, upgrade.level]),
    transformation: {
      committed: snapshot.transformation.committedPathId,
      paths: [...snapshot.transformation.paths]
        .sort((left, right) => left.pathId.localeCompare(right.pathId))
        .map((path) => [path.pathId, path.affinity, [...path.choiceIds]]),
    },
    holdings: {
      relics: [...snapshot.relicIds].sort(),
      items: [...snapshot.ownedItemIds].sort(),
      itemStats: Object.entries(snapshot.itemStats).sort(([left], [right]) => left.localeCompare(right)),
      bannedShopIds: [...snapshot.bannedShopIds].sort(),
      artifact: snapshot.equippedArtifactId,
      maxHealthBonus: snapshot.rewardMaxHealthBonus,
      weaponSlotBonus: snapshot.rewardWeaponSlotBonus,
    },
    objectives: {
      escort: snapshot.escortObjective ? {
        status: snapshot.escortObjective.status,
        health: round(snapshot.escortObjective.health),
        progress: round(snapshot.escortObjective.progress),
        underAttack: snapshot.escortObjective.underAttack,
      } : null,
      deny: snapshot.denyObjective ? {
        status: snapshot.denyObjective.status,
        corruption: round(snapshot.denyObjective.corruption),
        terminals: snapshot.denyObjective.terminals.map((terminal) => [terminal.id, terminal.active]),
      } : null,
      collect: snapshot.collectObjective ? {
        status: snapshot.collectObjective.status,
        collected: snapshot.collectObjective.collected,
        total: snapshot.collectObjective.total,
        remaining: round(snapshot.collectObjective.remainingSeconds),
      } : null,
    },
    activeBuffs: [...snapshot.activeBuffs]
      .sort((left, right) => left.type.localeCompare(right.type))
      .map((buff) => [buff.type, round(buff.remainingSeconds)]),
    defeatCause: snapshot.runMetrics.defeatCause,
    enemies: snapshot.enemies.map((enemy) => [
      enemy.id, enemy.type, round(enemy.position.x), round(enemy.position.y), round(enemy.health),
      enemy.corruptedMarinePhase ?? enemy.brainPhase ?? enemy.spitterPhase ?? enemy.ripperPhase ?? enemy.miniBossKind ?? "",
    ]),
    projectiles: snapshot.projectiles.map((projectile) => [
      projectile.id, projectile.weaponId, round(projectile.position.x), round(projectile.position.y), round(projectile.rotationRadians),
    ]),
  });
  return fnvDigest(canonical);
}

function fnvDigest(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function round(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
