import { describe, expect, it } from "vitest";
import {
  applyDeadzone,
  DISCONNECTED_GAMEPAD,
  GamepadIntentMapper,
  mergeIntents,
  type GamepadStateSnapshot,
} from "./GamepadIntentMapper";
import type { PlayerIntent } from "./PlayerIntent";

function padState(overrides: Partial<GamepadStateSnapshot> = {}): GamepadStateSnapshot {
  return {
    ...DISCONNECTED_GAMEPAD,
    connected: true,
    ...overrides,
  };
}

function keyboardIntent(overrides: Partial<PlayerIntent> = {}): PlayerIntent {
  return {
    move: { x: 0, y: 0 },
    aim: { x: 1, y: 0 },
    fireHeld: false,
    evasiveMovePressed: false,
    interactPressed: false,
    ultimatePressed: false,
    kitPressed: false,
    pausePressed: false,
    restartPressed: false,
    ...overrides,
  };
}

describe("GamepadIntentMapper", () => {
  it("ignores stick drift inside the deadzone and rescales outside it", () => {
    expect(applyDeadzone({ x: 0.2, y: 0 })).toEqual({ x: 0, y: 0 });
    const scaled = applyDeadzone({ x: 1, y: 0 });
    expect(scaled.x).toBeCloseTo(1);
    const partial = applyDeadzone({ x: 0.625, y: 0 });
    expect(partial.x).toBeGreaterThan(0);
    expect(partial.x).toBeLessThan(0.625);
  });

  it("keeps right-stick aiming independent from the manual-fire trigger", () => {
    const mapper = new GamepadIntentMapper();
    const intent = mapper.update(padState({ rightStick: { x: 0.9, y: 0 } }));
    expect(intent.fireHeld).toBe(false);
    expect(intent.aim.x).toBeCloseTo(1);

    const firing = mapper.update(padState({ rightStick: { x: 0.9, y: 0 }, fireHeld: true }));
    expect(firing.fireHeld).toBe(true);
  });

  it("edge-triggers pressed buttons like keyboard JustDown", () => {
    const mapper = new GamepadIntentMapper();
    const first = mapper.update(padState({ southPressed: true }));
    const held = mapper.update(padState({ southPressed: true }));
    const released = mapper.update(padState());
    const again = mapper.update(padState({ southPressed: true }));

    expect(first.evasiveMovePressed).toBe(true);
    expect(held.evasiveMovePressed).toBe(false);
    expect(released.evasiveMovePressed).toBe(false);
    expect(again.evasiveMovePressed).toBe(true);
  });

  it("maps the east face button to the consumable kit", () => {
    const mapper = new GamepadIntentMapper();
    expect(mapper.update(padState({ eastPressed: true })).kitPressed).toBe(true);
    expect(mapper.update(padState({ eastPressed: true })).kitPressed).toBe(false);
  });

  it("edge-triggers the R3 fire-mode toggle", () => {
    const mapper = new GamepadIntentMapper();
    expect(mapper.update(padState({ rightStickPressed: true })).toggleFireModePressed).toBe(true);
    expect(mapper.update(padState({ rightStickPressed: true })).toggleFireModePressed).toBe(false);
    mapper.update(padState());
    expect(mapper.update(padState({ rightStickPressed: true })).toggleFireModePressed).toBe(true);
  });

  it("produces a neutral intent while disconnected", () => {
    const mapper = new GamepadIntentMapper();
    const intent = mapper.update(DISCONNECTED_GAMEPAD);
    expect(intent.move).toEqual({ x: 0, y: 0 });
    expect(intent.fireHeld).toBe(false);
    expect(intent.pausePressed).toBe(false);
  });

  it("lets the active device win when merging with keyboard and mouse", () => {
    const mapper = new GamepadIntentMapper();
    const gamepad = mapper.update(padState({
      leftStick: { x: 0, y: 1 },
      rightStick: { x: 0, y: -1 },
    }));
    const merged = mergeIntents(keyboardIntent(), gamepad);
    expect(merged.move.y).toBeCloseTo(1);
    expect(merged.aim.y).toBeCloseTo(-1);
    expect(merged.fireHeld).toBe(false);

    const idlePad = mapper.update(padState());
    const keyboardWins = mergeIntents(keyboardIntent({ move: { x: -1, y: 0 }, fireHeld: true }), idlePad);
    expect(keyboardWins.move.x).toBe(-1);
    expect(keyboardWins.aim.x).toBe(1);
    expect(keyboardWins.fireHeld).toBe(true);
  });
});
