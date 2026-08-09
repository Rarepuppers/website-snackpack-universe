import { describe, expect, it } from "vitest";
import { DEFAULT_SAVE } from "../save/LocalSaveStore";
import {
  createShellState,
  howToPlayPages,
  HOW_TO_PLAY_PAGES,
  LAB_ROUTES,
  MENU_CARDS,
  perkTilePosition,
  ROSTER,
  SETTINGS_ROWS,
  stepShell,
  type ShellIntent,
  type ShellState,
} from "./ScreenFlow";
import { SCOUT_DEPLOYMENT_RELEASED } from "../progression/ArmoryProgression";
import { rebindGamepad, rebindKeyboard } from "../input/ControlBindings";
import { browserDisplayCapabilities, desktopDisplayCapabilities } from "../rendering/DisplayCapabilities";
import { PERK_CATALOG } from "../perks/perkCatalog";
import { settingsRowsForDisplayCapabilities } from "./ScreenFlow";

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
      armory: "armory",
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

  it("scrolls the six-row recent-run window within the retained history", () => {
    let state = { ...boot("records"), runHistoryCount: 20 };
    for (let index = 0; index < 30; index += 1) state = stepShell(state, "down").state;
    expect(state.recordsOffset).toBe(14);
    state = stepShell(state, "up").state;
    expect(state.recordsOffset).toBe(13);
    expect(stepShell(state, "confirm").state.screen).toBe("menu");
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

  it("lists no setting that gameplay ignores", () => {
    // Every row here must change something the player can perceive. These keys
    // still persist in GameSettings, but nothing reads them yet: there is no
    // music, AudioMixer's ui/music/ambience buses are unrouted, and aiming is
    // absolute so a sensitivity multiplier has no rate to scale. Re-list each
    // one in the same change that gives it a consumer.
    const inertKeys = [
      "uiVolume", "musicVolume", "ambienceVolume", "gamepadAimSensitivity",
      "fullscreenMode", "selectedDisplayId", "frameCap",
    ];
    const listed = SETTINGS_ROWS.map((row) => row.key);
    for (const key of inertKeys) {
      expect(listed).not.toContain(key);
    }
  });

  it("offers only presentation modes the current renderer can complete", () => {
    const presentation = SETTINGS_ROWS.find((row) => row.key === "presentationMode");
    expect(presentation).toEqual({
      kind: "choice", key: "presentationMode", label: "Presentation", options: ["auto", "crisp", "fill"],
    });
  });

  it("adds fullscreen to both rendering and navigation only when the host supports it", () => {
    const unavailable = settingsRowsForDisplayCapabilities(browserDisplayCapabilities({ fullscreenApiAvailable: false }));
    expect(unavailable.some((row) => row.key === "fullscreenMode")).toBe(false);

    const available = settingsRowsForDisplayCapabilities(browserDisplayCapabilities({ fullscreenApiAvailable: true }));
    const fullscreenIndex = available.findIndex((row) => row.key === "fullscreenMode");
    expect(available[fullscreenIndex]).toEqual({
      kind: "choice", key: "fullscreenMode", label: "Fullscreen", options: ["windowed", "borderless"],
    });
    const state = createShellState(
      DEFAULT_SAVE.settings, "settings", undefined, undefined, undefined, undefined, available,
    );
    const result = stepShell({ ...state, settingsIndex: fullscreenIndex }, "right");
    expect(result.state.settings.fullscreenMode).toBe("borderless");
    expect(result.effects).toEqual([{ type: "set-setting", key: "fullscreenMode", value: "borderless" }]);
  });

  it("adds desktop monitor selection and preserves typed frame-cap values", () => {
    const rows = settingsRowsForDisplayCapabilities(desktopDisplayCapabilities([
      { id: "primary", label: "Main display" },
      { id: "deck", label: "Steam Deck display" },
    ]));
    const displayIndex = rows.findIndex((row) => row.key === "selectedDisplayId");
    const frameCapIndex = rows.findIndex((row) => row.key === "frameCap");
    expect(rows[displayIndex]).toEqual({
      kind: "choice", key: "selectedDisplayId", label: "Display", options: ["primary", "deck"],
    });
    expect(rows[frameCapIndex]).toEqual({
      kind: "choice", key: "frameCap", label: "Frame cap", options: ["60", "120", "144", "display"],
    });

    const state = createShellState(
      { ...DEFAULT_SAVE.settings, selectedDisplayId: "primary", frameCap: 60 },
      "settings", undefined, undefined, undefined, undefined, rows,
    );
    const selectedDisplay = stepShell({ ...state, settingsIndex: displayIndex }, "right");
    expect(selectedDisplay.state.settings.selectedDisplayId).toBe("deck");
    expect(selectedDisplay.effects).toEqual([
      { type: "set-setting", key: "selectedDisplayId", value: "deck" },
    ]);

    const selectedCap = stepShell({ ...state, settingsIndex: frameCapIndex }, "right");
    expect(selectedCap.state.settings.frameCap).toBe(120);
    expect(selectedCap.effects).toEqual([{ type: "set-setting", key: "frameCap", value: 120 }]);
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
    expect(pages[0]!.body).toContain("F / Y rolls");
  });

  it("launches lab routes as URL effects", () => {
    const state = drive(boot("lab"), ["down", "down"]);
    const result = stepShell(state, "confirm");
    expect(result.effects).toEqual([{ type: "open-url", url: LAB_ROUTES[2]!.url }]);
  });

  it("purchases and equips affordable Armory nodes but blocks unmet prerequisites", () => {
    const progress = { ...DEFAULT_SAVE.progress, commandMarksLifetime: 13 };
    const state = createShellState(DEFAULT_SAVE.settings, "armory", progress);
    const root = stepShell(state, "confirm");
    expect(root.effects).toEqual([{ type: "purchase-armory-node", nodeId: "armory-scattergun" }]);
    expect(root.state.commandMarksBalance).toBe(8);
    expect(root.state.selectedArmoryNodeId).toBe("armory-scattergun");

    const arc = stepShell(stepShell(root.state, "down").state, "confirm");
    expect(arc.effects).toEqual([{ type: "purchase-armory-node", nodeId: "armory-arc-carbine" }]);
    expect(arc.state.commandMarksBalance).toBe(0);
    const reequipped = stepShell({ ...arc.state, armoryIndex: 0 }, "confirm");
    expect(reequipped.effects).toEqual([{ type: "select-armory-node", nodeId: "armory-scattergun" }]);

    const locked = createShellState(DEFAULT_SAVE.settings, "armory", {
      ...DEFAULT_SAVE.progress, commandMarksLifetime: 20,
    });
    expect(stepShell({ ...locked, armoryIndex: 1 }, "confirm").effects).toEqual([]);
  });

  it("starts a run only for a playable and unlocked hero", () => {
    const state = boot("character-select");
    expect(ROSTER[0]!.status).toBe("playable");
    const threat = stepShell(state, "confirm").state;
    expect(threat.screen).toBe("threat-select");
    expect(stepShell(threat, "confirm").effects).toEqual([
      { type: "start-run", heroId: "marine", perkId: "perk-veteran", threatTier: 0 },
    ]);

    const medic = stepShell(state, "right").state;
    const medicThreat = stepShell(medic, "confirm").state;
    expect(stepShell(medicThreat, "confirm").effects).toEqual([
      { type: "start-run", heroId: "medic", perkId: "perk-veteran", threatTier: 0 },
    ]);

    const locked = stepShell(medic, "right").state;
    expect(ROSTER[locked.rosterIndex]!.status).toBe("playable");
    expect(stepShell(locked, "confirm").effects).toEqual([]);
    expect(stepShell(locked, "confirm").state.screen).toBe("character-select");

    const assaultProgress: typeof DEFAULT_SAVE.progress = {
      ...DEFAULT_SAVE.progress,
      commandMarksLifetime: 35,
      purchasedArmoryNodeIds: [
        "armory-scattergun", "armory-patrol-blade", "armory-assault-clearance",
      ],
    };
    const assault = createShellState(DEFAULT_SAVE.settings, "character-select", assaultProgress, "perk-veteran", "assault");
    const assaultThreat = stepShell(assault, "confirm").state;
    expect(assaultThreat.screen).toBe("threat-select");
    expect(stepShell(assaultThreat, "confirm").effects).toEqual([
      { type: "start-run", heroId: "assault", perkId: "perk-veteran", threatTier: 0 },
    ]);

    const tacticianProgress: typeof DEFAULT_SAVE.progress = {
      ...DEFAULT_SAVE.progress,
      commandMarksLifetime: 35,
      purchasedArmoryNodeIds: [
        "armory-scattergun", "armory-arc-carbine", "armory-tactician-clearance",
      ],
    };
    const tactician = createShellState(
      DEFAULT_SAVE.settings, "character-select", tacticianProgress, "perk-veteran", "tactician",
    );
    const tacticianThreat = stepShell(tactician, "confirm").state;
    expect(tacticianThreat.screen).toBe("threat-select");
    expect(stepShell(tacticianThreat, "confirm").effects).toEqual([
      { type: "start-run", heroId: "tactician", perkId: "perk-veteran", threatTier: 0 },
    ]);

    const scoutProgress: typeof DEFAULT_SAVE.progress = {
      ...DEFAULT_SAVE.progress,
      commandMarksLifetime: 45,
      purchasedArmoryNodeIds: [
        "armory-scattergun", "armory-arc-carbine", "armory-patrol-blade", "armory-scout-clearance",
      ],
    };
    const scout = createShellState(
      DEFAULT_SAVE.settings, "character-select", scoutProgress, "perk-veteran", "scout",
    );
    const scoutThreat = stepShell(scout, "confirm").state;
    expect(scoutThreat.screen).toBe("threat-select");
    expect(stepShell(scoutThreat, "confirm").effects).toEqual([
      { type: "start-run", heroId: "scout", perkId: "perk-veteran", threatTier: 0 },
    ]);

    const craftedThreat = { ...locked, screen: "threat-select" as const };
    expect(stepShell(craftedThreat, "confirm").effects).toEqual([]);
  });

  it("derives Scout's roster state from the deployment release authority", () => {
    expect(ROSTER.find(({ id }) => id === "scout")?.status)
      .toBe(SCOUT_DEPLOYMENT_RELEASED ? "playable" : "in-development");
  });

  it("fits the expanded perk catalog into two rows above the roster rail", () => {
    const positions = PERK_CATALOG.map((_perk, index) => perkTilePosition(index));
    expect(new Set(positions.map(({ y }) => y))).toEqual(new Set([380, 424]));
    for (const { x, y } of positions) {
      expect(x).toBeGreaterThanOrEqual(473);
      expect(x).toBeLessThanOrEqual(849);
      expect(y + 22).toBeLessThanOrEqual(446);
    }
  });

  it("returns from every sub-screen to the menu with back", () => {
    for (const screen of ["how-to-play", "settings", "lab", "records", "armory", "character-select"] as const) {
      expect(stepShell(boot(screen), "back").state.screen).toBe("menu");
    }
    expect(stepShell({ ...boot("character-select"), screen: "threat-select" }, "back").state.screen).toBe("character-select");
    expect(stepShell(boot("controls"), "back").state.screen).toBe("settings");
  });

  it("blocks locked threat tiers and unlocks a tier from the prior victory", () => {
    const locked = stepShell(boot("character-select"), "confirm").state;
    const selectedTierOne = stepShell(locked, "down").state;
    expect(stepShell(selectedTierOne, "confirm").effects).toEqual([]);

    const progress = {
      ...DEFAULT_SAVE.progress,
      threatTierVictories: { 0: 1, 1: 0, 2: 0 } as const,
    };
    const unlocked = createShellState(DEFAULT_SAVE.settings, "character-select", progress);
    const tierScreen = stepShell(unlocked, "confirm").state;
    const tierOne = stepShell(tierScreen, "down").state;
    expect(stepShell(tierOne, "confirm").effects).toEqual([
      { type: "start-run", heroId: "marine", perkId: "perk-veteran", threatTier: 1 },
    ]);
  });
});
