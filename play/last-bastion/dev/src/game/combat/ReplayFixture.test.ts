import { describe, expect, it } from "vitest";
import {
  REPLAY_FIXED_DELTA_SECONDS,
  REPLAY_FORMAT_VERSION,
  SIMULATION_COMPATIBILITY_VERSION,
  runCombatReplay,
  runCombatReplaySequence,
  type CombatReplayFixture,
} from "./ReplayFixture";
import { generateExpeditionMap } from "../expedition/ExpeditionMap";
import { expeditionEncounterForNode } from "../expedition/ExpeditionEncounter";

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
    // Golden digest updated 23 July 2026: expedition waves now spawn one
    // powerup each (consumables-more-common pass), a deterministic sim change.
    expect(first.digest).toBe("84fc796d");
    expect(runCombatReplaySequence([...fixtures].reverse()).digest).not.toBe(first.digest);
    expect(() => runCombatReplaySequence([])).toThrow("at least one encounter");
  });
});
