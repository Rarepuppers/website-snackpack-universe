import { describe, expect, it } from "vitest";
import {
  createSynapseHeraldBehavior,
  selectSynapseHeraldMove,
  stepSynapseHeraldBehavior,
  type SynapseHeraldContext,
  type SynapseHeraldState,
} from "./SynapseHeraldBehavior";

const BASE: SynapseHeraldContext = {
  ownerPosition: { x: 5, y: 5 },
  playerPosition: { x: 10, y: 8 },
  ownerHealth: 560,
  ownerMaxHealth: 560,
  arenaWidthMetres: 20,
  arenaHeightMetres: 14,
  brainBlobs: [],
};

function setupState(seed = 0): SynapseHeraldState {
  let state = createSynapseHeraldBehavior(seed);
  state = stepSynapseHeraldBehavior(state, 1, BASE).state;
  return state;
}

describe("Synapse Herald behavior boundary", () => {
  it("deterministically skips an unavailable link and never immediately repeats", () => {
    const state = { ...setupState(2), previousMove: "marked-zones" as const, attackIndex: 0 };
    expect(selectSynapseHeraldMove(state, BASE)).toBe("lunge-chain");
    expect(selectSynapseHeraldMove(state, BASE)).not.toBe(state.previousMove);
  });

  it("locks lunge waypoints at windup start instead of retargeting the player", () => {
    const setup = setupState(0);
    const begun = stepSynapseHeraldBehavior(setup, 1, BASE);
    expect(begun).toMatchObject({ moveStarted: "lunge-chain" });
    expect(begun.state.lungeTargets).toHaveLength(2);
    const moved = stepSynapseHeraldBehavior(begun.state, 0.2, {
      ...BASE,
      playerPosition: { x: 18, y: 1 },
    });
    expect(moved.state.lungeTargets).toEqual(begun.state.lungeTargets);
    expect(moved.state.lockedPlayerTarget).toEqual(BASE.playerPosition);
  });

  it("locks exactly three in-bounds marked zones without adding frenzy coverage", () => {
    const setup = { ...setupState(1), previousMove: "lunge-chain" as const };
    const begun = stepSynapseHeraldBehavior(setup, 1, {
      ...BASE,
      playerPosition: { x: 19.8, y: 13.8 },
      ownerHealth: 50,
    });
    expect(begun.moveStarted).toBe("marked-zones");
    expect(begun.state.markedZones).toHaveLength(3);
    for (const zone of begun.state.markedZones) {
      expect(zone.x).toBeGreaterThanOrEqual(0.8);
      expect(zone.x).toBeLessThanOrEqual(19.2);
      expect(zone.y).toBeGreaterThanOrEqual(0.8);
      expect(zone.y).toBeLessThanOrEqual(13.2);
    }
  });

  it("links the nearest ordinary Brain Blob with ID as the stable tie-break", () => {
    const context: SynapseHeraldContext = {
      ...BASE,
      brainBlobs: [
        { id: 9, position: { x: 7, y: 5 }, dead: false, rank: "standard" },
        { id: 3, position: { x: 7, y: 5 }, dead: false, rank: "standard" },
        { id: 1, position: { x: 5.5, y: 5 }, dead: false, rank: "elite" },
      ],
    };
    const setup = setupState(2);
    const begun = stepSynapseHeraldBehavior(setup, 1, context);
    expect(begun).toMatchObject({ moveStarted: "synapse-link" });
    expect(begun.state.linkTargetId).toBe(3);
  });

  it("breaks an active link immediately when its committed blob dies", () => {
    const blob = { id: 4, position: { x: 7, y: 5 }, dead: false, rank: "standard" as const };
    const context = { ...BASE, brainBlobs: [blob] };
    const begun = stepSynapseHeraldBehavior(setupState(2), 1, context).state;
    const active = stepSynapseHeraldBehavior(begun, 1, context).state;
    expect(active).toMatchObject({ phase: "action", move: "synapse-link", linkTargetId: 4 });
    const broken = stepSynapseHeraldBehavior(active, 0.01, {
      ...context,
      brainBlobs: [{ ...blob, dead: true }],
    });
    expect(broken).toMatchObject({ linkBroken: true, moveResolved: "synapse-link" });
    expect(broken.state).toMatchObject({ phase: "recovery", linkTargetId: null });
  });

  it("final frenzy shortens tells and adds one lunge without increasing marked zones or links", () => {
    const normal = stepSynapseHeraldBehavior(setupState(0), 1, BASE).state;
    const frenzy = stepSynapseHeraldBehavior(setupState(0), 1, { ...BASE, ownerHealth: 100 }).state;
    expect(frenzy.phaseRemainingSeconds).toBeLessThan(normal.phaseRemainingSeconds);
    expect(normal.lungeTargets).toHaveLength(2);
    expect(frenzy.lungeTargets).toHaveLength(3);
  });
});
