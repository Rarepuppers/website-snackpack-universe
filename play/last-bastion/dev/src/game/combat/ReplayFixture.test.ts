import { describe, expect, it } from "vitest";
import {
  REPLAY_FIXED_DELTA_SECONDS,
  REPLAY_FORMAT_VERSION,
  SIMULATION_COMPATIBILITY_VERSION,
  replaySnapshotDigest,
  runCombatReplay,
  runCombatReplaySequence,
  type CombatReplayFixture,
} from "./ReplayFixture";
import { CombatSimulation } from "./CombatSimulation";
import type { PlayerIntent } from "../input/PlayerIntent";
import { generateExpeditionMap } from "../expedition/ExpeditionMap";
import { expeditionEncounterForNode } from "../expedition/ExpeditionEncounter";

const NEUTRAL_INTENT: PlayerIntent = {
  move: { x: 0, y: 0 }, aim: { x: 1, y: 0 }, fireHeld: false,
  evasiveMovePressed: false, interactPressed: false,
  ultimatePressed: false, kitPressed: false, pausePressed: false, restartPressed: false,
};

const FIXTURE: CombatReplayFixture = {
  formatVersion: REPLAY_FORMAT_VERSION,
  simulationVersion: SIMULATION_COMPATIBILITY_VERSION,
  seed: 61061,
  scenario: "corrupted-marine",
  fixedDeltaSeconds: REPLAY_FIXED_DELTA_SECONDS,
  inputSpans: [
    { frames: 90, move: { x: 0, y: -1 }, aim: { x: -1, y: 0 }, fireHeld: true },
    { frames: 1, move: { x: 1, y: 0 }, aim: { x: -1, y: 0 }, evasiveMoveOnFirstFrame: true },
    { frames: 119, move: { x: 1, y: 0 }, aim: { x: -1, y: 0 }, fireHeld: true },
  ],
};

describe("versioned fixed-step replay fixture", () => {
  it("replays the same seed and inputs to the same digest", () => {
    const first = runCombatReplay(FIXTURE);
    const second = runCombatReplay(FIXTURE);
    expect(first.framesRun).toBe(210);
    expect(first.digest).toBe(second.digest);
    expect(first.digest).toBe("346f7115");
  });

  it("detects seed and input divergence", () => {
    const baseline = runCombatReplay(FIXTURE).digest;
    expect(runCombatReplay({ ...FIXTURE, seed: FIXTURE.seed + 1 }).digest).not.toBe(baseline);
    expect(runCombatReplay({ ...FIXTURE, inputSpans: [{ frames: 210, move: { x: -1, y: 0 } }] }).digest).not.toBe(baseline);
  });

  it("rejects incompatible formats, simulation rules, and timesteps", () => {
    expect(() => runCombatReplay({ ...FIXTURE, formatVersion: 2 })).toThrow("Unsupported replay format");
    expect(() => runCombatReplay({ ...FIXTURE, simulationVersion: 2 })).toThrow("Unsupported simulation version");
    expect(() => runCombatReplay({ ...FIXTURE, fixedDeltaSeconds: 0.05 })).toThrow("canonical fixed timestep");
  });

  it("replays a portable weapon-placement decision", () => {
    const decisionFixture: CombatReplayFixture = {
      ...FIXTURE,
      scenario: "weapon-gate",
      inputSpans: [{ frames: 1, decisionOnFirstFrame: "place:rack:rack-3" }],
    };
    const result = runCombatReplay(decisionFixture);
    expect(result.snapshot.pendingDecision).toBeNull();
    expect(result.snapshot.equippedWeapons.map((weapon) => weapon.weaponId))
      .toEqual(["bastion-service-rifle", "scattergun"]);
    expect(() => runCombatReplay({ ...decisionFixture, inputSpans: [{ frames: 1, decisionOnFirstFrame: "missing" }] }))
      .toThrow("Replay decision is unavailable");
  });

  it("replays a seeded expedition encounter descriptor deterministically", () => {
    const map = generateExpeditionMap(88421);
    const node = map.nodes.find((candidate) => candidate.type === "combat" && candidate.column >= 2)!;
    const encounter = expeditionEncounterForNode(map.seed, node);
    const expeditionFixture: CombatReplayFixture = {
      ...FIXTURE,
      seed: encounter.seed,
      scenario: "density-capacity",
      expeditionEncounter: encounter,
      inputSpans: [{ frames: 180, move: { x: 0, y: 1 }, aim: { x: 1, y: 0 }, fireHeld: true }],
    };
    const first = runCombatReplay(expeditionFixture);
    const second = runCombatReplay(expeditionFixture);
    expect(first.snapshot.totalWaves).toBe(encounter.waves.length);
    expect(first.digest).toBe(second.digest);
  });

  it("guards a longer ordered expedition encounter chain", () => {
    const map = generateExpeditionMap(88421);
    const nodes = map.nodes.filter((node) => node.type === "combat" || node.type === "elite").slice(0, 3);
    expect(nodes).toHaveLength(3);
    const fixtures = nodes.map((node, index): CombatReplayFixture => {
      const encounter = expeditionEncounterForNode(map.seed, node);
      return {
        ...FIXTURE,
        seed: encounter.seed,
        scenario: "density-capacity",
        expeditionEncounter: encounter,
        inputSpans: [
          { frames: 180, move: { x: index % 2 === 0 ? 1 : -1, y: 0 }, aim: { x: 0, y: -1 }, fireHeld: true },
          { frames: 60, move: { x: 0, y: 1 }, aim: { x: 1, y: 0 }, fireHeld: true },
        ],
      };
    });
    const first = runCombatReplaySequence(fixtures);
    const second = runCombatReplaySequence(fixtures);
    expect(first).toEqual(second);
    expect(first.encountersRun).toBe(3);
    expect(first.framesRun).toBe(720);
    // Golden digest updated 31 July 2026: the wave-drop rotation gained its
    // four unreachable entries and now offsets by the encounter seed, so these
    // encounters drop different powerups and the pickups alter player state.
    // Still deterministic — the offset is a pure function of the descriptor
    // seed and never touches the simulation's RNG stream.
    // Then updated again the same day: placement now admits interactables whose
    // verb combat can honour (Supply Chest, Scrap Seam, gates), so furnished
    // rooms hold objects they previously filtered out and the layout shifts.
    // Previous goldens: 84fc796d (23 July, one powerup per wave),
    // 2cb124a9 (26 July, seeded world-object placement),
    // 559b0de8 (31 July, powerup rotation offset).
    expect(first.digest).toBe("4dd2f610");
    expect(runCombatReplaySequence([...fixtures].reverse()).digest).not.toBe(first.digest);
    expect(() => runCombatReplaySequence([])).toThrow("at least one encounter");
  });
});

/**
 * Closing a coverage hole flagged in `last-bastion-content-debt-plan.md`: the
 * rank-kill item grant added a `random()` draw on mini-boss/boss death, and no
 * replay fixture ever kills a ranked enemy — so the digest passed while saying
 * nothing about that branch of the stream. The gameplay fixtures cannot reach a
 * mini-boss kill inside a few hundred frames, so this drives the same
 * deterministic path directly and digests the result.
 */
describe("ranked-kill determinism (the branch no gameplay fixture reaches)", () => {
  const rankedKillRun = (seed: number): { digest: string; items: readonly string[] } => {
    const simulation = new CombatSimulation({ seed, autoStartWaves: false });
    const miniBossId = simulation.spawnMiniBoss("siege-crusher", { x: 6, y: 6 });
    simulation.dealDamage(miniBossId, 99_999);
    for (let frame = 0; frame < 60; frame += 1) {
      simulation.step(NEUTRAL_INTENT, REPLAY_FIXED_DELTA_SECONDS);
    }
    const snapshot = simulation.snapshot();
    return { digest: replaySnapshotDigest(snapshot, seed), items: snapshot.ownedItemIds };
  };

  it("grants the same item and reaches the same state for the same seed", () => {
    const first = rankedKillRun(4242);
    const second = rankedKillRun(4242);
    expect(first.digest).toBe(second.digest);
    expect(first.items).toEqual(second.items);
    // The draw really happened — this is the branch the fixtures never entered.
    expect(first.items.length).toBeGreaterThan(0);
  });

  it("diverges by seed, so the draw is genuinely seeded and not constant", () => {
    // Widely-spread seeds on purpose. The simulation's LCG
    // (`state = state * 1664525 + 1013904223`) maps small, evenly-spaced seeds
    // to a tight band of first outputs — seeds 11…88 all yield 0.24–0.27 — so a
    // draw consumed on frame 0 picks the same item for all of them. That is a
    // property of the generator, not of this branch, and it only bites a draw
    // taken before any other `random()` call. Worth knowing; not fixed here.
    const digests = new Set<string>();
    const grants = new Set<string>();
    for (const seed of [101, 7919, 104_729, 1_299_709, 15_485_863, 2_147_483_647, 999_999_937]) {
      const run = rankedKillRun(seed);
      digests.add(run.digest);
      grants.add(run.items.join(","));
    }
    expect(digests.size).toBeGreaterThan(1);
    expect(grants.size).toBeGreaterThan(1);
  });

  it("does not consume the draw for an ordinary kill", () => {
    const simulation = new CombatSimulation({ seed: 4242, autoStartWaves: false });
    const scuttlerId = simulation.spawnEnemy("scuttler", { x: 6, y: 6 });
    simulation.dealDamage(scuttlerId, 9_999);
    simulation.step(NEUTRAL_INTENT, REPLAY_FIXED_DELTA_SECONDS);
    expect(simulation.snapshot().ownedItemIds).toEqual([]);
  });
});
