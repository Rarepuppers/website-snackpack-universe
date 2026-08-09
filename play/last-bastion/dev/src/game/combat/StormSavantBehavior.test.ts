import { describe, expect, it } from "vitest";
import {
  STORM_SAVANT_COOLDOWN_SECONDS,
  STORM_SAVANT_RETRY_SECONDS,
  resolveStormSavantChainStart,
  stepStormSavantBehavior,
} from "./StormSavantBehavior";
import {
  STORM_CHAIN_TELL_SECONDS,
  createConductiveNode,
  createIdleStormChain,
  lockStormChain,
} from "./StormSavantLightning";

function input(position = { x: 0, y: 0 }) {
  return {
    deltaSeconds: 0.1,
    position,
    playerPosition: { x: 6, y: 0 },
    movementSpeedMetresPerSecond: 2,
    nodes: [],
  };
}

describe("StormSavantBehavior", () => {
  it("controls range and requests chain construction when its cooldown expires", () => {
    const idle = { chain: createIdleStormChain(), cooldownSeconds: 0.1 };
    const due = stepStormSavantBehavior(idle, input({ x: -4, y: 0 }));
    expect(due.movement).toMatchObject({ kind: "fixed", direction: { x: 1, y: 0 } });
    expect(due.requestsChainStart).toBe(true);

    const retreat = stepStormSavantBehavior(
      { ...idle, cooldownSeconds: 1 },
      input({ x: 3, y: 0 }),
    ).movement;
    expect(retreat).toMatchObject({ kind: "fixed" });
    if (retreat.kind !== "fixed") throw new Error("expected fixed retreat movement");
    expect(retreat.direction.x).toBe(-1);
    expect(Math.abs(retreat.direction.y)).toBe(0);
  });

  it("commits a built chain or schedules a short placement retry", () => {
    const idle = { chain: createIdleStormChain(), cooldownSeconds: 0 };
    const node = createConductiveNode(2, { x: 4, y: 0 });
    const chain = lockStormChain({ x: 0, y: 0 }, [node])!;
    expect(resolveStormSavantChainStart(idle, chain).chain).toBe(chain);
    expect(resolveStormSavantChainStart(idle, null).cooldownSeconds).toBe(STORM_SAVANT_RETRY_SECONDS);
  });

  it("reports interruption and restores the repeat cooldown after overload", () => {
    const node = createConductiveNode(2, { x: 4, y: 0 });
    const chain = lockStormChain({ x: 0, y: 0 }, [node])!;
    const discharged = stepStormSavantBehavior(
      { chain, cooldownSeconds: 0 },
      { ...input(), deltaSeconds: STORM_CHAIN_TELL_SECONDS, nodes: [node] },
    );
    expect(discharged.discharged).toBe(true);
    expect(discharged.state.chain.phase).toBe("discharge");
    const interrupted = stepStormSavantBehavior(
      { chain, cooldownSeconds: 0 },
      { ...input(), nodes: [{ ...node, destroyed: true, health: 0 }] },
    );
    expect(interrupted.interrupted).toBe(true);
    expect(interrupted.state.chain.phase).toBe("overload-recovery");

    const ready = stepStormSavantBehavior(
      {
        chain: { ...interrupted.state.chain, phaseRemainingSeconds: 0.05 },
        cooldownSeconds: 0,
      },
      { ...input(), deltaSeconds: 0.05 },
    );
    expect(ready.state).toMatchObject({
      chain: { phase: "idle" },
      cooldownSeconds: STORM_SAVANT_COOLDOWN_SECONDS,
    });
  });
});
