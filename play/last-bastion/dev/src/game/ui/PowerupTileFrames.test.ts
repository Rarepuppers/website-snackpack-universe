import { describe, expect, it } from "vitest";
import type { PowerupType } from "../combat/CombatSimulation";
import {
  dedicatedPowerupFrame,
  POWERUP_IDENTITY_FRAMES,
  POWERUP_IDENTITY_TEXTURE,
  powerupPickupPresentation,
  powerupStatusPresentation,
} from "./PowerupTileFrames";

const DEDICATED_POWERUPS: readonly PowerupType[] = Object.freeze([
  "siege-loader",
  "phase-jacket",
  "hunter-optics",
  "last-stand-stimulant",
  "emp-charge",
  "butchers-serum",
]);

describe("PowerupTileFrames", () => {
  it("locks the six-frame atlas contract", () => {
    expect(POWERUP_IDENTITY_FRAMES).toEqual({
      "siege-loader": 0,
      "phase-jacket": 1,
      "hunter-optics": 2,
      "last-stand-stimulant": 3,
      "emp-charge": 4,
      "butchers-serum": 5,
    });
  });

  it.each(DEDICATED_POWERUPS)("uses dedicated pickup and HUD art for %s", (type) => {
    const frame = dedicatedPowerupFrame(type);
    expect(frame).toBeTypeOf("number");
    expect(powerupPickupPresentation(type)).toEqual({ texture: POWERUP_IDENTITY_TEXTURE, frame });
    expect(powerupStatusPresentation(type)).toEqual({ texture: POWERUP_IDENTITY_TEXTURE, frame });
  });

  it("preserves authored legacy and medkit presentations", () => {
    expect(powerupPickupPresentation("medkit")).toEqual({ texture: "pickups-v1", frame: 2 });
    expect(powerupPickupPresentation("overcharge")).toEqual({ texture: "batch-c-rewards-v1", frame: 8 });
    expect(powerupStatusPresentation("uranium-core-rounds")).toEqual({ texture: "uranium-status-v1" });
  });
});
