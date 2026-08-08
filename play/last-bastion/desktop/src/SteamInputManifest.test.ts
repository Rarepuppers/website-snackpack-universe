import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const GAMEPLAY_ACTIONS = [
  "Move", "Aim", "Fire", "Evade", "Interact", "Ultimate", "Kit", "ToggleFireMode", "Pause",
] as const;
const MENU_ACTIONS = ["Navigate", "Confirm", "Back"] as const;

describe("Steam Input action manifest", () => {
  it("defines the complete localized action contract without placeholder App IDs", () => {
    const manifest = readFileSync(resolve(process.cwd(), "../steam-input/steam_input_manifest.vdf"), "utf8");
    assert.match(manifest, /^"Action Manifest"/);
    assert.match(manifest, /"Gameplay"/);
    assert.match(manifest, /"Menus"/);
    for (const action of [...GAMEPLAY_ACTIONS, ...MENU_ACTIONS]) {
      assert.match(manifest, new RegExp(`"${action}"`));
      assert.match(manifest, new RegExp(`"Action_${action}"`));
    }
    assert.doesNotMatch(manifest, /REPLACE|480|APP_ID/i);
  });
});
