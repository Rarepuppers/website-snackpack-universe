import { describe, expect, it } from "vitest";
import {
  ASSEMBLY_PRIME_LANE_COUNT,
  ASSEMBLY_PRIME_PAD_HEALTH,
  createAssemblyPrimeBehavior,
  damageAssemblyPrimePad,
  selectAssemblyPrimeMove,
  stepAssemblyPrimeBehavior,
  type AssemblyPrimeContext,
  type AssemblyPrimeState,
} from "./AssemblyPrimeBehavior";

const BASE: AssemblyPrimeContext = {
  ownerId: 40,
  ownerPosition: { x: 6, y: 6 },
  playerPosition: { x: 13, y: 8 },
  ownerHealth: 720,
  ownerMaxHealth: 720,
  liveUnits: 7,
  reservedLiveSlots: 0,
  liveCap: 14,
  remainingThreat: 10,
  children: [],
  ownerWasDamaged: false,
};

function setupState(seed = 0): AssemblyPrimeState {
  return stepAssemblyPrimeBehavior(createAssemblyPrimeBehavior(seed), 1, BASE).state;
}

describe("Assembly Prime behavior boundary", () => {
  it("uses deterministic no-repeat selection and waits when every alternative is unavailable", () => {
    const state = { ...setupState(0), previousMove: "rotating-lanes" as const };
    expect(selectAssemblyPrimeMove(state, BASE)).toBe("fabrication");
    const exhausted = { ...state, fabricationChargesRemaining: 0 };
    expect(selectAssemblyPrimeMove(exhausted, BASE)).toBeNull();
    const waited = stepAssemblyPrimeBehavior(exhausted, 1, BASE);
    expect(waited.state).toMatchObject({ phase: "setup", move: null });
    expect(waited.moveStarted).toBeNull();
  });

  it("locks exactly three warned lanes and never retargets them", () => {
    const begun = stepAssemblyPrimeBehavior(setupState(0), 1, BASE);
    expect(begun).toMatchObject({ moveStarted: "rotating-lanes" });
    expect(begun.state.lockedLanes).toHaveLength(ASSEMBLY_PRIME_LANE_COUNT);
    const moved = stepAssemblyPrimeBehavior(begun.state, 0.2, {
      ...BASE,
      playerPosition: { x: 2, y: 2 },
    });
    expect(moved.state.lockedLanes).toEqual(begun.state.lockedLanes);
  });

  it("reuses exact Foundry slot/threat reservations and creates one non-recursive finite child", () => {
    const begun = stepAssemblyPrimeBehavior(setupState(1), 1, BASE);
    expect(begun.state).toMatchObject({
      move: "fabrication",
      pendingReservation: { childType: "foundry-drone", reservedThreat: 2, reservedLiveSlots: 1 },
      padHealth: ASSEMBLY_PRIME_PAD_HEALTH,
    });
    const moved = stepAssemblyPrimeBehavior(begun.state, 0.1, {
      ...BASE,
      playerPosition: { x: 1, y: 1 },
    });
    expect(moved.state.fabricationTarget).toEqual(begun.state.fabricationTarget);
    expect(moved.state.pendingReservation).toEqual(begun.state.pendingReservation);
    const completed = stepAssemblyPrimeBehavior(begun.state, 2, BASE);
    expect(completed).toMatchObject({
      actionStarted: "fabrication",
      spawnedChild: { type: "foundry-drone", remainingSeconds: 12, canFabricate: false },
      state: { fabricationChargesRemaining: 2, pendingReservation: null },
    });
    expect(stepAssemblyPrimeBehavior(completed.state, 0.05, BASE).spawnedChild).toBeNull();
  });

  it("refunds the complete reservation and spends no charge when the pad or owner is hit", () => {
    const begun = stepAssemblyPrimeBehavior(setupState(1), 1, BASE).state;
    const reservation = begun.pendingReservation;
    const broken = stepAssemblyPrimeBehavior(
      damageAssemblyPrimePad(begun, ASSEMBLY_PRIME_PAD_HEALTH),
      0.01,
      BASE,
    );
    expect(broken).toMatchObject({
      interrupted: true,
      releasedReservation: reservation,
      state: { phase: "recovery", fabricationChargesRemaining: 3 },
    });
    const ownerHit = stepAssemblyPrimeBehavior(begun, 0.01, { ...BASE, ownerWasDamaged: true });
    expect(ownerHit).toMatchObject({ interrupted: true, releasedReservation: reservation });
  });

  it("recalls the lowest-lifetime owned drone once without reserving or creating a unit", () => {
    const context: AssemblyPrimeContext = {
      ...BASE,
      children: [
        { id: 8, ownerId: 40, type: "foundry-drone", position: { x: 8, y: 5 }, remainingSeconds: 5, dead: false },
        { id: 3, ownerId: 40, type: "foundry-drone", position: { x: 7, y: 5 }, remainingSeconds: 5, dead: false },
        { id: 1, ownerId: 99, type: "foundry-drone", position: { x: 6, y: 5 }, remainingSeconds: 1, dead: false },
      ],
    };
    const begun = stepAssemblyPrimeBehavior(setupState(2), 1, context).state;
    expect(begun).toMatchObject({ move: "drone-recall", recallTargetId: 3, pendingReservation: null });
    const recalled = stepAssemblyPrimeBehavior(begun, 1, context);
    expect(recalled).toMatchObject({
      actionStarted: "drone-recall",
      recalledChildId: 3,
      spawnedChild: null,
      state: { recallChargesRemaining: 0 },
    });
  });

  it("frenzy shortens lane timing without adding lanes, charges, children, slots, or threat", () => {
    const normal = stepAssemblyPrimeBehavior(setupState(0), 1, BASE).state;
    const frenzy = stepAssemblyPrimeBehavior(setupState(0), 1, { ...BASE, ownerHealth: 100 }).state;
    expect(frenzy.phaseRemainingSeconds).toBeLessThan(normal.phaseRemainingSeconds);
    expect(frenzy.lockedLanes).toHaveLength(ASSEMBLY_PRIME_LANE_COUNT);
    expect(frenzy.fabricationChargesRemaining).toBe(normal.fabricationChargesRemaining);
    expect(frenzy.recallChargesRemaining).toBe(normal.recallChargesRemaining);
    const cappedContext: AssemblyPrimeContext = {
      ...BASE,
      children: [
        { id: 1, ownerId: 40, type: "foundry-turret", position: { x: 5, y: 5 }, remainingSeconds: 9, dead: false },
        { id: 2, ownerId: 40, type: "foundry-turret", position: { x: 6, y: 5 }, remainingSeconds: 9, dead: false },
      ],
    };
    expect(selectAssemblyPrimeMove({ ...setupState(0), previousMove: "rotating-lanes" }, cappedContext)).toBeNull();
  });
});
