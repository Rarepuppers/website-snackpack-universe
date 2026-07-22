import { describe, expect, it } from "vitest";
import {
  STORM_CHAIN_MAX_HOPS,
  STORM_CHAIN_TELL_SECONDS,
  STORM_SAVANT_OVERLOAD_RECOVERY_SECONDS,
  createConductiveNode,
  clipStormChainToCover,
  damageConductiveNode,
  hasStormEscapeLane,
  lockStormChain,
  planStormNodePlacement,
  pointInsideStormChain,
  stepStormChain,
} from "./StormSavantLightning";
import type { ArenaDefinition } from "../arena/ArenaDefinition";

describe("Storm Savant locked lightning contract", () => {
  const nodes = [
    createConductiveNode(1, { x: 4, y: 2 }),
    createConductiveNode(2, { x: 8, y: 2 }),
    createConductiveNode(3, { x: 12, y: 2 }),
  ];

  it("locks a finite path and never exceeds the hop cap", () => {
    const chain = lockStormChain({ x: 0, y: 2 }, nodes);
    expect(chain).not.toBeNull();
    expect(chain!.lockedNodeIds).toEqual([1, 2]);
    expect(chain!.segments).toHaveLength(STORM_CHAIN_MAX_HOPS);
    expect(chain!.segments[1]).toMatchObject({ from: { x: 4, y: 2 }, to: { x: 8, y: 2 } });
  });

  it("discharges once on the original segments without retargeting", () => {
    const chain = lockStormChain({ x: 0, y: 2 }, nodes)!;
    const movedNodes = nodes.map((node) => ({ ...node, position: { x: node.position.x, y: 9 } }));
    const discharge = stepStormChain(chain, STORM_CHAIN_TELL_SECONDS, movedNodes);
    expect(discharge.discharged).toBe(true);
    expect(discharge.state.segments).toEqual(chain.segments);
    expect(pointInsideStormChain({ x: 6, y: 2 }, discharge.state.segments, 0.5)).toBe(true);
    expect(pointInsideStormChain({ x: 6, y: 4 }, discharge.state.segments, 0.5)).toBe(false);
  });

  it("destroying any locked node cancels discharge into vulnerable overload", () => {
    const chain = lockStormChain({ x: 0, y: 2 }, nodes)!;
    const brokenNodes = [damageConductiveNode(nodes[0]!, 99), nodes[1]!, nodes[2]!];
    const result = stepStormChain(chain, 0.1, brokenNodes);
    expect(result).toMatchObject({
      discharged: false,
      state: {
        phase: "overload-recovery",
        phaseRemainingSeconds: STORM_SAVANT_OVERLOAD_RECOVERY_SECONDS,
        lockedNodeIds: [],
        segments: [],
      },
    });
  });

  it("requires at least one sampled player-sized escape lane", () => {
    const chain = lockStormChain({ x: 0, y: 2 }, nodes)!;
    expect(hasStormEscapeLane([{ x: 2, y: 2 }, { x: 2, y: 4 }], chain.segments, 0.55)).toBe(true);
    expect(hasStormEscapeLane([{ x: 2, y: 2 }, { x: 6, y: 2 }], chain.segments, 0.55)).toBe(false);
  });

  it("clips at the first cover piece and prevents downstream propagation", () => {
    const chain = lockStormChain({ x: 0, y: 2 }, nodes)!;
    const visible = clipStormChainToCover(chain.segments, [
      { id: "far", kind: "barricade", x: 6, y: 1, width: 1, height: 2 },
      { id: "near", kind: "cargo-crate", x: 2, y: 1, width: 1, height: 2 },
    ]);
    expect(visible).toHaveLength(1);
    expect(visible[0]).toMatchObject({
      to: { x: 2, y: 2 },
      blockedByObstacleId: "near",
    });
    expect(pointInsideStormChain({ x: 3.5, y: 2 }, visible, 0)).toBe(false);
  });

  it("places two nodes deterministically outside cover with an escape lane", () => {
    const arena: ArenaDefinition = {
      id: "storm-test",
      widthMetres: 20,
      heightMetres: 12,
      tileSizeMetres: 1,
      obstacles: [{ id: "northwest", kind: "barricade", x: 5, y: 2, width: 2, height: 2 }],
    };
    const first = planStormNodePlacement({ x: 2, y: 6 }, { x: 10, y: 6 }, arena, 20, 0.55);
    const repeat = planStormNodePlacement({ x: 2, y: 6 }, { x: 10, y: 6 }, arena, 20, 0.55);
    expect(first).toEqual(repeat);
    expect(first?.nodes).toHaveLength(2);
    expect(first?.nodes.map((node) => node.id)).toEqual([20, 21]);
    expect(first?.escapeSamples.some((point) => (
      !pointInsideStormChain(point, first.chain.segments, 0.55)
    ))).toBe(true);
  });
});
