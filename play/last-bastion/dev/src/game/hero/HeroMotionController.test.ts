import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import { HeroMotionController } from "./HeroMotionController";
import { MARINE } from "./marine";

function intent(overrides: Partial<PlayerIntent> = {}): PlayerIntent {
  return {
    move: { x: 0, y: 0 },
    aim: { x: 1, y: 0 },
    fireHeld: false,
    evasiveMovePressed: false,
    interactPressed: false,
    ultimatePressed: false,
    pausePressed: false,
    ...overrides,
  };
}

describe("HeroMotionController", () => {
  it("moves from a synthetic intent without physical input", () => {
    const controller = new HeroMotionController(MARINE);
    const frame = controller.update(intent({ move: { x: 1, y: 0 } }), 0.2);

    expect(frame.state).toBe("moving");
    expect(frame.displacementMetres.x).toBeCloseTo(1.05);
  });

  it("uses the last movement direction for a synthetic roll intent", () => {
    const controller = new HeroMotionController(MARINE);
    controller.update(intent({ move: { x: 0, y: -1 } }), 0.01);
    const frame = controller.update(intent({ evasiveMovePressed: true }), 0.1);

    expect(frame.state).toBe("evading");
    expect(frame.displacementMetres.y).toBeLessThan(0);
    expect(frame.isInvulnerable).toBe(true);
  });
});
