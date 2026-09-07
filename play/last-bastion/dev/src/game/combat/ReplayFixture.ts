import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation, type CombatScenario, type CombatSnapshot } from "./CombatSimulation";
import type { ExpeditionEncounterDescriptor } from "../expedition/ExpeditionEncounter";
import type { ExpeditionBuildSnapshot } from "../expedition/ExpeditionRun";
import { expeditionBuildFromCombatSnapshot } from "../expedition/ExpeditionBuildSnapshot";

export const REPLAY_FORMAT_VERSION = 1;
export const SIMULATION_COMPATIBILITY_VERSION = 2;
export const REPLAY_FIXED_DELTA_SECONDS = 1 / 60;

export interface ReplayInputSpan {
  readonly frames: number;
  readonly move?: Readonly<{ x: number; y: number }>;
  readonly aim?: Readonly<{ x: number; y: number }>;
  readonly fireHeld?: boolean;
  readonly evasiveMoveOnFirstFrame?: boolean;
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
  /** Initial run state. In a sequence this is read only from the first fixture. */
  readonly startingBuild?: ExpeditionBuildSnapshot;
}

export interface ReplayResult {
  readonly framesRun: number;
  readonly digest: string;
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
    autoFireEnabled: false,
    expeditionEncounter: fixture.expeditionEncounter,
  });
  let framesRun = 0;
  for (const span of fixture.inputSpans) {
    if (span.decisionOnFirstFrame && !simulation.chooseOption(span.decisionOnFirstFrame)) {
      throw new Error(`Replay decision is unavailable: ${span.decisionOnFirstFrame}`);
    }
    for (let frame = 0; frame < span.frames; frame += 1) {
      simulation.step({
        ...NEUTRAL,
        move: span.move ? { ...span.move } : NEUTRAL.move,
        aim: span.aim ? { ...span.aim } : NEUTRAL.aim,
        fireHeld: Boolean(span.fireHeld),
        evasiveMovePressed: Boolean(span.evasiveMoveOnFirstFrame && frame === 0),
      }, fixture.fixedDeltaSeconds);
      framesRun += 1;
    }
  }
  const snapshot = simulation.snapshot();
  return {
    framesRun,
    digest: replaySnapshotDigest(snapshot, fixture.seed),
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
