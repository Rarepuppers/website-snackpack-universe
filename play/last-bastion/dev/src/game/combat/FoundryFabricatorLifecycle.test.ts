import { describe, expect, it } from "vitest";
import {
  FOUNDRY_CHANNEL_SECONDS,
  FOUNDRY_FABRICATION_CHARGES,
  FOUNDRY_MAX_LIVE_CHILDREN,
  FOUNDRY_PAD_HEALTH,
  beginFoundryFabrication,
  createFoundryFabricatorBehavior,
  damageFoundryPad,
  powerDownFoundryChildren,
  stepFoundryFabrication,
  tryReserveFoundryChild,
} from "./FoundryFabricatorLifecycle";

const OPEN_CONTEXT = {
  childType: "foundry-drone" as const,
  activeChildrenForOwner: 0,
  ownerChargesRemaining: 3,
  liveUnits: 8,
  reservedLiveSlots: 0,
  liveCap: 18,
  remainingThreat: 10,
};

describe("Foundry Fabricator reservation lifecycle", () => {
  it("reserves one live slot and exact child threat before channeling", () => {
    expect(tryReserveFoundryChild(OPEN_CONTEXT)).toEqual({
      accepted: true,
      reservation: { childType: "foundry-drone", reservedThreat: 2, reservedLiveSlots: 1 },
    });
    expect(tryReserveFoundryChild({ ...OPEN_CONTEXT, childType: "foundry-turret" })).toEqual({
      accepted: true,
      reservation: { childType: "foundry-turret", reservedThreat: 3, reservedLiveSlots: 1 },
    });
  });

  it("rejects exhausted charges, owner cap, live cap, and threat overflow", () => {
    expect(tryReserveFoundryChild({ ...OPEN_CONTEXT, ownerChargesRemaining: 0 })).toEqual({ accepted: false, reason: "charges" });
    expect(tryReserveFoundryChild({ ...OPEN_CONTEXT, activeChildrenForOwner: FOUNDRY_MAX_LIVE_CHILDREN })).toEqual({ accepted: false, reason: "owner-child-cap" });
    expect(tryReserveFoundryChild({ ...OPEN_CONTEXT, liveCap: 8 })).toEqual({ accepted: false, reason: "live-cap" });
    expect(tryReserveFoundryChild({ ...OPEN_CONTEXT, remainingThreat: 1 })).toEqual({ accepted: false, reason: "threat-budget" });
  });

  it("locks a pad and spawns one finite non-fabricating child", () => {
    const accepted = tryReserveFoundryChild(OPEN_CONTEXT);
    if (!accepted.accepted) throw new Error("expected reservation");
    const channel = beginFoundryFabrication(createFoundryFabricatorBehavior(), { x: 4, y: 5 }, accepted.reservation);
    const completed = stepFoundryFabrication(channel, FOUNDRY_CHANNEL_SECONDS, false);
    expect(completed).toMatchObject({
      interrupted: false,
      spawnedChild: { type: "foundry-drone", position: { x: 4, y: 5 }, remainingSeconds: 12, canFabricate: false },
      state: { phase: "recovery", chargesRemaining: FOUNDRY_FABRICATION_CHARGES - 1 },
    });
    expect(stepFoundryFabrication(completed.state, 0.2, false).spawnedChild).toBeNull();
  });

  it("refunds the complete reservation when owner damage or pad destruction interrupts", () => {
    const accepted = tryReserveFoundryChild(OPEN_CONTEXT);
    if (!accepted.accepted) throw new Error("expected reservation");
    const channel = beginFoundryFabrication(createFoundryFabricatorBehavior(), { x: 4, y: 5 }, accepted.reservation);
    const ownerInterrupted = stepFoundryFabrication(channel, 0.2, true);
    expect(ownerInterrupted).toMatchObject({
      interrupted: true,
      spawnedChild: null,
      releasedReservation: accepted.reservation,
      state: { chargesRemaining: FOUNDRY_FABRICATION_CHARGES },
    });
    const brokenPad = damageFoundryPad(channel, FOUNDRY_PAD_HEALTH);
    expect(stepFoundryFabrication(brokenPad, 0.1, false)).toMatchObject({
      interrupted: true,
      releasedReservation: accepted.reservation,
    });
  });

  it("powers down only children owned by an exiting Fabricator", () => {
    expect(powerDownFoundryChildren(7, [
      { id: 1, ownerId: 7, type: "foundry-drone", position: { x: 1, y: 1 }, remainingSeconds: 2, canFabricate: false },
      { id: 2, ownerId: 8, type: "foundry-turret", position: { x: 2, y: 2 }, remainingSeconds: 2, canFabricate: false },
      { id: 3, ownerId: 7, type: "foundry-turret", position: { x: 3, y: 3 }, remainingSeconds: 2, canFabricate: false },
    ])).toEqual([1, 3]);
  });
});
