import { describe, expect, it } from "vitest";
import { powerupInspectCard } from "./InspectCardModel";

describe("power-up inspect card", () => {
  it("distinguishes a world pickup from a timed active effect", () => {
    expect(powerupInspectCard("phase-jacket")).toMatchObject({ title: "PHASE JACKET", detail: "MOVE CLOSER TO COLLECT" });
    expect(powerupInspectCard("phase-jacket", 7.25).detail).toBe("ACTIVE  7.3s");
  });

  it("labels instant pickups honestly", () => {
    expect(powerupInspectCard("emp-charge").detail).toBe("INSTANT EFFECT");
  });
});
