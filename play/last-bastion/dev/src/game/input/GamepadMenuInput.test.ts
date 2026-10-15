import { expect, it } from "vitest";
import { GamepadMenuInput } from "./GamepadMenuInput";
const pad = (buttons: number[] = [], x = 0, y = 0) => ({ connected: true, buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: buttons.includes(i) })), leftStick: { x, y } });
it("uses physical A/B/Start and emits one action for conflicting buttons", () => {
  const menu = new GamepadMenuInput();
  expect(menu.read(pad([0, 1]))).toBe("back");
  expect(menu.read(pad([0, 1]))).toBeNull();
  menu.read(pad());
  expect(menu.read(pad([0]))).toBe("confirm");
  menu.read(pad());
  expect(menu.read(pad([9]))).toBe("back");
});
it("maps all D-pad directions and does not repeat a held stick plus D-pad", () => {
  const menu = new GamepadMenuInput();
  for (const [index, action] of [[12, "up"], [13, "down"], [14, "left"], [15, "right"]] as const) {
    expect(menu.read(pad([index]))).toBe(action);
    expect(menu.read(pad([index]))).toBeNull();
    menu.read(pad());
  }
  expect(menu.read(pad([15], 1))).toBe("right");
  expect(menu.read(pad([], 1))).toBeNull();
});
it("requires neutral after reconnect so held buttons cannot confirm", () => {
  const menu = new GamepadMenuInput();
  menu.read(null);
  expect(menu.read(pad([0]))).toBeNull();
  menu.read(pad());
  expect(menu.read(pad([0]))).toBe("confirm");
});
