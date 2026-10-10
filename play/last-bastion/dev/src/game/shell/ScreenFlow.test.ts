import { describe, expect, it } from "vitest";
import { DEFAULT_SAVE } from "../save/LocalSaveStore";
import {
  createShellState,
  howToPlayPages,
  HOW_TO_PLAY_PAGES,
  ARCADE_URL,
  LAB_ROUTES,
  MENU_CARDS,
  MENU_COLUMNS,
  menuCardSubtitle,
  perkGridLayout,
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

  it("navigates the three-column menu by card and by row, and opens every card's screen", () => {
    let state = { ...boot("menu"), menuIndex: 0 };
    expect(stepShell(state, "left").state.menuIndex).toBe(MENU_CARDS.length - 1);
    expect(stepShell(state, "right").state.menuIndex).toBe(1);
    state = drive(state, ["down", "down"]);
    expect(state.menuIndex).toBe(2 * MENU_COLUMNS);
    expect(stepShell({ ...state, menuIndex: 1 }, "up").state.menuIndex).toBe(MENU_COLUMNS * 2 + 1);

    const targets: Record<string, string> = {
      daily: "character-select",
      "quick-drop": "character-select",
      expedition: "character-select",
      armory: "armory",
      "how-to-play": "how-to-play",
      settings: "settings",
    };
    for (const [cardId, screen] of Object.entries(targets)) {
      const index = MENU_CARDS.findIndex((card) => card.id === cardId);
      const opened = stepShell({ ...boot("menu"), menuIndex: index }, "confirm").state;
      expect(opened.screen).toBe(screen);
    }
  });

  it("carries the chosen mode into character select", () => {
    for (const mode of ["daily", "quick-drop", "expedition"] as const) {
      const index = MENU_CARDS.findIndex((card) => card.id === mode);
      expect(stepShell({ ...boot("menu"), menuIndex: index }, "confirm").state.runMode).toBe(mode);
    }
  });

  it("starts a first visit on Quick Drop and a returning player on the Daily", () => {
    const first = createShellState(DEFAULT_SAVE.settings, "menu");
    expect(first.menuCards[first.menuIndex]!.id).toBe("quick-drop");
    const returning = createShellState(DEFAULT_SAVE.settings, "menu", { ...DEFAULT_SAVE.progress, runsFinished: 3 });
    expect(returning.menuCards[returning.menuIndex]!.id).toBe("daily");
  });

  it("keeps LAB out of the player menu and reachable only by a debug session", () => {
    expect(MENU_CARDS.map((card) => card.id)).not.toContain("lab");
    const player = boot("menu");
    expect(player.menuCards.map((card) => card.id)).not.toContain("lab");
    // A crafted jump to the lab screen without access falls back to the menu.
    expect(stepShell({ ...player, screen: "lab" }, "down").state.screen).toBe("menu");

    const debug = createShellState(
      DEFAULT_SAVE.settings, "menu", undefined, undefined, undefined, undefined, undefined, undefined, undefined, 0,
      { labEnabled: true },
    );
    const labIndex = debug.menuCards.findIndex((card) => card.id === "lab");
    expect(labIndex).toBeGreaterThan(-1);
    expect(stepShell({ ...debug, menuIndex: labIndex }, "confirm").state.screen).toBe("lab");
    // ?flow=lab is a review route in its own right.
    expect(boot("lab").labEnabled).toBe(true);
  });

  it("shows today's Daily result and streak on its card", () => {
    const daily = MENU_CARDS.find((card) => card.id === "daily")!;
    expect(menuCardSubtitle(daily, DEFAULT_SAVE.progress, true, "2026-10-11")).toBe("11 OCT  •  same waves for all");
    const progress = {
      ...DEFAULT_SAVE.progress,
      daily: {
        "2026-10-10": { bestWave: 4, bestKills: 20, cleared: false, attempts: 1 },
        "2026-10-11": { bestWave: 7, bestKills: 90, cleared: false, attempts: 2 },
      },
    };
    expect(menuCardSubtitle(daily, progress, true, "2026-10-11")).toBe("11 OCT  •  best wave 7  •  2-day streak");
  });

  it("leaves for the arcade hub from the menu", () => {
    const index = MENU_CARDS.findIndex((card) => card.id === "arcade");
    const result = stepShell({ ...boot("menu"), menuIndex: index }, "confirm");
    expect(result.effects).toEqual([{ type: "open-url", url: ARCADE_URL }]);
    expect(ARCADE_URL).toBe("/play/");
  });

  it("writes menu and help copy for players, not developers", () => {
    const copy = [
      ...MENU_CARDS.map((card) => card.label),
      ...MENU_CARDS.map((card) => menuCardSubtitle(card, DEFAULT_SAVE.progress, true, "2026-10-11")),
      ...MENU_CARDS.map((card) => menuCardSubtitle(card, DEFAULT_SAVE.progress, false, "2026-10-11")),
      ...HOW_TO_PLAY_PAGES.flatMap((page) => [page.title, page.body]),
      ...howToPlayPages(DEFAULT_SAVE.controls).flatMap((page) => [page.title, page.body]),
    ].join("\n");
    expect(copy).not.toMatch(/starchart|lands\)|persisted|\bLAB\b|placeholder|prototype|\bSIM\b/i);
    // Entrench is the Marine's passive; it is described on his dossier, not as a universal rule.
    expect(copy).not.toMatch(/Entrench/);
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
    if (row.kind === "action") throw new Error("Expected a boolean settings row");
    const result = stepShell(state, "confirm");
    expect(result.state.settings[row.key]).toBe(!DEFAULT_SAVE.settings[row.key]);
    expect(result.effects).toEqual([{ type: "set-setting", key: row.key, value: !DEFAULT_SAVE.settings[row.key] }]);
    const reverted = stepShell(result.state, "left");
    expect(reverted.state.settings[row.key]).toBe(DEFAULT_SAVE.settings[row.key]);
  });

  it("emits save transfer effects from the backup settings rows", () => {
    const state = boot("settings");
    const exportIndex = SETTINGS_ROWS.findIndex((row) => row.key === "export-save");
    const importIndex = SETTINGS_ROWS.findIndex((row) => row.key === "import-save");
    expect(stepShell({ ...state, settingsIndex: exportIndex }, "confirm").effects)
      .toEqual([{ type: "transfer-save", operation: "export" }]);
    expect(stepShell({ ...state, settingsIndex: importIndex }, "confirm").effects)
      .toEqual([{ type: "transfer-save", operation: "import" }]);
  });

  it("makes the game-specific privacy policy reachable from settings", () => {
    const state = boot("settings");
    const privacyIndex = SETTINGS_ROWS.findIndex((row) => row.key === "privacy");
    expect(privacyIndex).toBeGreaterThan(-1);
    expect(stepShell({ ...state, settingsIndex: privacyIndex }, "confirm").effects)
      .toEqual([{ type: "open-url", url: "/privacy/last-bastion/" }]);
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
    expect(LAB_ROUTES).toContainEqual({
      label: "Marine projectile visibility",
      url: "?screen=game&loadout=bastion-service-rifle&autofire=1&seed=117&helmet=0",
    });
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
    // Only Tier 0 is open, so the threat screen would offer one choice: skip it.
    expect(stepShell(state, "confirm").effects).toEqual([
      { type: "start-run", mode: "expedition", heroId: "marine", perkId: "perk-veteran", threatTier: 0 },
    ]);
    expect(stepShell({ ...state, runMode: "quick-drop" }, "confirm").effects).toEqual([
      { type: "start-run", mode: "quick-drop", heroId: "marine", perkId: "perk-veteran", threatTier: 0 },
    ]);
    expect(stepShell({ ...state, runMode: "daily" }, "confirm").effects).toEqual([
      { type: "start-run", mode: "daily", heroId: "marine", perkId: "perk-veteran", threatTier: 0 },
    ]);

    const medic = stepShell(state, "right").state;
    expect(stepShell(medic, "confirm").effects).toEqual([
      { type: "start-run", mode: "expedition", heroId: "medic", perkId: "perk-veteran", threatTier: 0 },
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
    expect(stepShell(assault, "confirm").effects).toEqual([
      { type: "start-run", mode: "expedition", heroId: "assault", perkId: "perk-veteran", threatTier: 0 },
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
    expect(stepShell(tactician, "confirm").effects).toEqual([
      { type: "start-run", mode: "expedition", heroId: "tactician", perkId: "perk-veteran", threatTier: 0 },
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
    expect(stepShell(scout, "confirm").effects).toEqual([
      { type: "start-run", mode: "expedition", heroId: "scout", perkId: "perk-veteran", threatTier: 0 },
    ]);

    const craftedThreat = { ...locked, screen: "threat-select" as const };
    expect(stepShell(craftedThreat, "confirm").effects).toEqual([]);
  });

  it("derives Scout's roster state from the deployment release authority", () => {
    expect(ROSTER.find(({ id }) => id === "scout")?.status)
      .toBe(SCOUT_DEPLOYMENT_RELEASED ? "playable" : "in-development");
  });

  it("fits the expanded perk catalog inside the dossier above the roster rail", () => {
    const layout = perkGridLayout(PERK_CATALOG.length);
    const positions = PERK_CATALOG.map((_perk, index) => perkTilePosition(index));
    expect(new Set(positions.map(({ y }) => y))).toEqual(new Set([372, 416]));
    expect(layout.bounds.top).toBeGreaterThanOrEqual(layout.descriptionY + 24);
    expect(layout.bounds.bottom).toBeLessThanOrEqual(layout.panelCenterY + layout.panelHeight / 2);
    expect(layout.panelCenterY + layout.panelHeight / 2).toBeLessThan(448);
    for (const { x, y } of positions) {
      expect(x - 22).toBeGreaterThanOrEqual(layout.bounds.left);
      expect(x + 22).toBeLessThanOrEqual(layout.bounds.right);
      expect(y - 22).toBeGreaterThanOrEqual(layout.bounds.top);
      expect(y + 22).toBeLessThanOrEqual(layout.bounds.bottom);
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
    const locked = { ...boot("character-select"), screen: "threat-select" as const };
    const selectedTierOne = stepShell(locked, "down").state;
    expect(stepShell(selectedTierOne, "confirm").effects).toEqual([]);

    const progress = {
      ...DEFAULT_SAVE.progress,
      threatTierVictories: { 0: 1, 1: 0, 2: 0 } as const,
    };
    const unlocked = createShellState(DEFAULT_SAVE.settings, "character-select", progress);
    const tierScreen = stepShell(unlocked, "confirm").state;
    expect(tierScreen.screen).toBe("threat-select");
    const tierOne = stepShell(tierScreen, "down").state;
    expect(stepShell(tierOne, "confirm").effects).toEqual([
      { type: "start-run", mode: "expedition", heroId: "marine", perkId: "perk-veteran", threatTier: 1 },
    ]);
    // Quick and Daily Drops never visit the threat ladder.
    expect(stepShell({ ...unlocked, runMode: "daily" }, "confirm").effects[0]).toMatchObject({ mode: "daily", threatTier: 0 });
  });
});
