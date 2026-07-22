import { describe, expect, it } from "vitest";
import { DEFAULT_SAVE } from "../save/LocalSaveStore";
import {
  createShellState,
  howToPlayPages,
  HOW_TO_PLAY_PAGES,
  LAB_ROUTES,
  MENU_CARDS,
  ROSTER,
  SETTINGS_ROWS,
  stepShell,
  type ShellIntent,
  type ShellState,
} from "./ScreenFlow";
import { rebindGamepad, rebindKeyboard } from "../input/ControlBindings";

function boot(screen: Parameters<typeof createShellState>[1] = "title"): ShellState {
  return createShellState(DEFAULT_SAVE.settings, screen);
}

function drive(state: ShellState, intents: readonly ShellIntent[]): ShellState {
  return intents.reduce((current, intent) => stepShell(current, intent).state, state);
}

describe("Shell screen flow", () => {
  it("advances title to menu on confirm and returns on back", () => {
    const menu = stepShell(boot(), "confirm").state;
    expect(menu.screen).toBe("menu");
    expect(stepShell(menu, "back").state.screen).toBe("title");
  });

  it("navigates the menu with wrapping focus and opens every card's screen", () => {
    let state = boot("menu");
    expect(stepShell(state, "up").state.menuIndex).toBe(MENU_CARDS.length - 1);
    state = drive(state, ["down", "down"]);
    expect(state.menuIndex).toBe(2);

    const targets: Record<string, string> = {
      expedition: "character-select",
      "how-to-play": "how-to-play",
      settings: "settings",
      lab: "lab",
    };
    for (const [cardId, screen] of Object.entries(targets)) {
      const index = MENU_CARDS.findIndex((card) => card.id === cardId);
      const opened = stepShell({ ...boot("menu"), menuIndex: index }, "confirm").state;
      expect(opened.screen).toBe(screen);
    }
  });

  it("opens the codex externally and Records as a real screen", () => {
    const codexIndex = MENU_CARDS.findIndex((card) => card.id === "codex");
    const codex = stepShell({ ...boot("menu"), menuIndex: codexIndex }, "confirm");
    expect(codex.effects).toEqual([{ type: "open-url", url: "last-bastion-codex.html" }]);
    expect(codex.state.screen).toBe("menu");

    const recordsIndex = MENU_CARDS.findIndex((card) => card.id === "records");
    const records = stepShell({ ...boot("menu"), menuIndex: recordsIndex }, "confirm");
    expect(records.effects).toEqual([]);
    expect(records.state.screen).toBe("records");
    expect(stepShell(records.state, "back").state.screen).toBe("menu");
  });

  it("pages How to Play within bounds and closes from the last page", () => {
    let state = boot("how-to-play");
    expect(stepShell(state, "left").state.howToPlayPage).toBe(0);
    for (let page = 0; page < HOW_TO_PLAY_PAGES.length - 1; page += 1) {
      state = stepShell(state, "right").state;
    }
    expect(state.howToPlayPage).toBe(HOW_TO_PLAY_PAGES.length - 1);
    expect(stepShell(state, "right").state.howToPlayPage).toBe(HOW_TO_PLAY_PAGES.length - 1);
    expect(stepShell(state, "confirm").state.screen).toBe("menu");
    expect(stepShell(state, "back").state.screen).toBe("menu");
  });

  it("toggles a setting, mirrors it in state, and emits the persistence effect", () => {
    const state = boot("settings");
    const row = SETTINGS_ROWS[0]!;
    if (row.key === "controls") throw new Error("Expected a boolean settings row");
    const result = stepShell(state, "confirm");
    expect(result.state.settings[row.key]).toBe(!DEFAULT_SAVE.settings[row.key]);
    expect(result.effects).toEqual([{ type: "set-setting", key: row.key, value: !DEFAULT_SAVE.settings[row.key] }]);
    const reverted = stepShell(result.state, "left");
    expect(reverted.state.settings[row.key]).toBe(DEFAULT_SAVE.settings[row.key]);
  });

  it("opens control bindings and requests capture per selected device/action", () => {
    const controlsIndex = SETTINGS_ROWS.findIndex((row) => row.key === "controls");
    const controls = stepShell({ ...boot("settings"), settingsIndex: controlsIndex }, "confirm").state;
    expect(controls.screen).toBe("controls");
    const keyboardCapture = stepShell({ ...controls, controlIndex: 4 }, "confirm");
    expect(keyboardCapture.effects).toEqual([{ type: "capture-binding", device: "keyboard", action: "evade" }]);
    const gamepad = stepShell(controls, "right").state;
    expect(stepShell({ ...gamepad, controlIndex: 4 }, "confirm").effects)
      .toEqual([{ type: "capture-binding", device: "gamepad", action: "evade" }]);
    expect(stepShell(gamepad, "confirm").effects).toEqual([]);
    expect(stepShell(gamepad, "back").state.screen).toBe("settings");
  });

  it("builds help copy from the active bindings", () => {
    let controls = rebindKeyboard(DEFAULT_SAVE.controls, "evade", "KeyF");
    controls = rebindGamepad(controls, "evade", "north");
    const pages = howToPlayPages(controls);
    expect(pages[0]!.body).toContain("F / Y/△ rolls");
  });

  it("launches lab routes as URL effects", () => {
    const state = drive(boot("lab"), ["down", "down"]);
    const result = stepShell(state, "confirm");
    expect(result.effects).toEqual([{ type: "open-url", url: LAB_ROUTES[2]!.url }]);
  });

  it("starts a run only for a playable hero", () => {
    const state = boot("character-select");
    expect(ROSTER[0]!.status).toBe("playable");
    expect(stepShell(state, "confirm").effects).toEqual([{ type: "start-run", heroId: "marine", perkId: "perk-veteran" }]);

    const medic = stepShell(state, "right").state;
    expect(stepShell(medic, "confirm").effects).toEqual([{ type: "start-run", heroId: "medic", perkId: "perk-veteran" }]);

    const locked = stepShell(medic, "right").state;
    expect(ROSTER[locked.rosterIndex]!.status).not.toBe("playable");
    expect(stepShell(locked, "confirm").effects).toEqual([]);
    expect(stepShell(locked, "confirm").state.screen).toBe("character-select");
  });

  it("returns from every sub-screen to the menu with back", () => {
    for (const screen of ["how-to-play", "settings", "lab", "records", "character-select"] as const) {
      expect(stepShell(boot(screen), "back").state.screen).toBe("menu");
    }
    expect(stepShell(boot("controls"), "back").state.screen).toBe("settings");
  });
});
