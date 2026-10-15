export type GamepadMenuAction = "back" | "confirm" | "up" | "down" | "left" | "right";
export interface MenuPad { connected: boolean; buttons: readonly { pressed: boolean }[]; leftStick?: { x: number; y: number }; }
/** Physical menu controls stay independent of remappable combat actions. */
export class GamepadMenuInput {
  private previous = new Set<GamepadMenuAction>();
  private reconnect = false;
  read(pad: MenuPad | null): GamepadMenuAction | null {
    if (!pad?.connected) { this.previous.clear(); this.reconnect = true; return null; }
    const held = new Set<GamepadMenuAction>();
    const pressed = (index: number) => pad.buttons[index]?.pressed === true;
    if (pressed(1) || pressed(9)) held.add("back");
    if (pressed(0)) held.add("confirm");
    const x = pad.leftStick?.x ?? 0, y = pad.leftStick?.y ?? 0;
    if (pressed(12) || y < -0.5) held.add("up");
    if (pressed(13) || y > 0.5) held.add("down");
    if (pressed(14) || x < -0.5) held.add("left");
    if (pressed(15) || x > 0.5) held.add("right");
    if (this.reconnect) {
      this.previous = held;
      if (!held.size) this.reconnect = false;
      return null;
    }
    const action = [...held].find(value => !this.previous.has(value)) ?? null;
    this.previous = held;
    return action;
  }
}
