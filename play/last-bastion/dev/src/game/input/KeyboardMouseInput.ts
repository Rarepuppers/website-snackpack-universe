import Phaser from "phaser";
import type { PlayerIntent } from "./PlayerIntent";
import { normalizeVector } from "../math/Vector2Data";

interface ControlKeys {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  upAlt: Phaser.Input.Keyboard.Key;
  downAlt: Phaser.Input.Keyboard.Key;
  leftAlt: Phaser.Input.Keyboard.Key;
  rightAlt: Phaser.Input.Keyboard.Key;
  evade: Phaser.Input.Keyboard.Key;
  interact: Phaser.Input.Keyboard.Key;
  ultimate: Phaser.Input.Keyboard.Key;
  pause: Phaser.Input.Keyboard.Key;
}

export class KeyboardMouseInput {
  private readonly keys: ControlKeys;

  constructor(private readonly scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;

    if (!keyboard) {
      throw new Error("Keyboard input is unavailable in this browser.");
    }

    this.keys = keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      upAlt: Phaser.Input.Keyboard.KeyCodes.UP,
      downAlt: Phaser.Input.Keyboard.KeyCodes.DOWN,
      leftAlt: Phaser.Input.Keyboard.KeyCodes.LEFT,
      rightAlt: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      evade: Phaser.Input.Keyboard.KeyCodes.SPACE,
      interact: Phaser.Input.Keyboard.KeyCodes.E,
      ultimate: Phaser.Input.Keyboard.KeyCodes.R,
      pause: Phaser.Input.Keyboard.KeyCodes.ESC,
    }) as unknown as ControlKeys;
  }

  read(playerPosition: { x: number; y: number }): PlayerIntent {
    const pointer = this.scene.input.activePointer;
    const horizontal = Number(this.keys.right.isDown || this.keys.rightAlt.isDown)
      - Number(this.keys.left.isDown || this.keys.leftAlt.isDown);
    const vertical = Number(this.keys.down.isDown || this.keys.downAlt.isDown)
      - Number(this.keys.up.isDown || this.keys.upAlt.isDown);

    return {
      move: normalizeVector({ x: horizontal, y: vertical }),
      aim: normalizeVector({
        x: pointer.worldX - playerPosition.x,
        y: pointer.worldY - playerPosition.y,
      }),
      fireHeld: pointer.leftButtonDown(),
      evasiveMovePressed: Phaser.Input.Keyboard.JustDown(this.keys.evade),
      interactPressed: Phaser.Input.Keyboard.JustDown(this.keys.interact),
      ultimatePressed: Phaser.Input.Keyboard.JustDown(this.keys.ultimate),
      pausePressed: Phaser.Input.Keyboard.JustDown(this.keys.pause),
    };
  }
}
