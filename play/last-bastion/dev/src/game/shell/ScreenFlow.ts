import type { GameProgress, GameSettings } from "../save/LocalSaveStore";
import type { HeroDefinition } from "../hero/HeroDefinition";
import { isHeroId } from "../hero/HeroCatalog";
import type { DisplayCapabilities } from "../rendering/DisplayCapabilities";
import { PERK_CATALOG, unlockedPerkIds, type PerkId } from "../perks/perkCatalog";
import {
  DEFAULT_CONTROL_BINDINGS,
  GAMEPAD_BINDABLE_ACTIONS,
  KEYBOARD_BINDABLE_ACTIONS,
  gamepadBindingLabel,
  keyboardBindingLabel,
  type ControlBindings,
  type GamepadBindableAction,
  type KeyboardBindableAction,
} from "../input/ControlBindings";
import {
  THREAT_TIERS,
  unlockedThreatTiers,
  type ThreatTier,
} from "../expedition/ThreatTier";
import {
  ARMORY_NODES,
  canPurchaseArmoryNode,
  commandMarksBalance,
  type ArmoryNodeId,
} from "../progression/ArmoryProgression";

/**
 * Front-end shell screen flow (Task 37 behavior gate).
 *
 * A pure, unit-testable state machine: the Phaser shell scene feeds it
 * navigation intents and renders whatever state it reports. Side effects
 * (persisting a setting, starting the run, opening an external page) are
 * returned as effects so presentation and rules stay separate, matching the
 * simulation/presentation boundary used by combat.
 */
export type ShellScreen =
  | "title"
  | "menu"
  | "how-to-play"
  | "settings"
  | "controls"
  | "lab"
  | "records"
  | "armory"
  | "character-select"
  | "threat-select";

export type ShellIntent = "up" | "down" | "left" | "right" | "confirm" | "back";

export type ShellEffect =
  | { type: "start-run"; heroId: HeroDefinition["id"]; perkId: PerkId; threatTier: ThreatTier }
  | { type: "open-url"; url: string }
  | { type: "set-setting"; key: keyof GameSettings; value: GameSettings[keyof GameSettings] }
  | { type: "capture-binding"; device: "keyboard" | "gamepad"; action: KeyboardBindableAction | GamepadBindableAction }
  | { type: "purchase-armory-node"; nodeId: ArmoryNodeId }
  | { type: "select-armory-node"; nodeId: ArmoryNodeId };

export interface MenuCard {
  id: "expedition" | "armory" | "how-to-play" | "settings" | "codex" | "lab" | "records";
  label: string;
}

export const MENU_CARDS: readonly MenuCard[] = Object.freeze([
  { id: "expedition", label: "EXPEDITION" },
  { id: "armory", label: "ARMORY" },
  { id: "how-to-play", label: "HOW TO PLAY" },
  { id: "settings", label: "SETTINGS" },
  { id: "codex", label: "CODEX" },
  { id: "lab", label: "LAB" },
  { id: "records", label: "RECORDS" },
]);

export const HOW_TO_PLAY_PAGES: readonly { title: string; body: string }[] = Object.freeze([
  {
    title: "MOVE AND SURVIVE",
    body: "WASD or left stick moves. Mouse or right stick aims.\nSPACE rolls with a short invulnerability window.\nHold position for one second to Entrench for bonus armour.",
  },
  {
    title: "YOUR ARSENAL",
    body: "Weapons follow your Auto-fire / Manual setting; T or pad-R3 toggles it in combat.\nR fires the ultimate. Q uses your carried kit.\nAutonomous support weapons keep their own cadence in either mode.",
  },
  {
    title: "DAMAGE AND STATUS",
    body: "Fire builds Blaze. Shock builds Overload. Cryo builds Freeze.\nToxic builds Corrode. Buildup at the threshold applies the status.\nDamage numbers share the same colour language.",
  },
  {
    title: "THE EXPEDITION",
    body: "One life. Clear waves, choose upgrades, spend Scrap at the shop.\nElites drop caches. Mini-bosses guard arsenal rewards.\nThe run autosaves between encounters - not mid-fight.",
  },
]);

export function howToPlayPages(bindings: ControlBindings): readonly { title: string; body: string }[] {
  const move = [bindings.keyboard.moveUp, bindings.keyboard.moveLeft, bindings.keyboard.moveDown, bindings.keyboard.moveRight]
    .map(keyboardBindingLabel).join("");
  return [
    { title: "MOVE AND SURVIVE", body: `${move} or left stick moves. Mouse or right stick aims.\n${keyboardBindingLabel(bindings.keyboard.evade)} / ${gamepadBindingLabel(bindings.gamepad.evade)} rolls with a short invulnerability window.\nHold position for one second to Entrench for bonus armour.` },
    { title: "YOUR ARSENAL", body: `Weapons follow Auto-fire / Manual; ${keyboardBindingLabel(bindings.keyboard.toggleFireMode)} / ${gamepadBindingLabel(bindings.gamepad.toggleFireMode)} toggles it.\n${keyboardBindingLabel(bindings.keyboard.ultimate)} / ${gamepadBindingLabel(bindings.gamepad.ultimate)} fires the ultimate. ${keyboardBindingLabel(bindings.keyboard.kit)} / ${gamepadBindingLabel(bindings.gamepad.kit)} uses your carried kit.\nAutonomous support weapons keep their own cadence in either mode.` },
    ...HOW_TO_PLAY_PAGES.slice(2),
  ];
}

export type SettingsRow =
  | { kind: "toggle"; key: keyof GameSettings; label: string }
  | { kind: "choice"; key: keyof GameSettings; label: string; options: readonly string[] }
  | { kind: "range"; key: keyof GameSettings; label: string; min: number; max: number; step: number }
  | { kind: "action"; key: "controls"; label: string };

export const SETTINGS_ROWS: readonly SettingsRow[] = Object.freeze([
  { kind: "toggle", key: "screenShakeEnabled", label: "Screen shake" },
  { kind: "range", key: "screenShakeIntensity", label: "Shake intensity", min: 0, max: 1, step: 0.25 },
  { kind: "toggle", key: "reducedFlashEnabled", label: "Reduced flash" },
  { kind: "toggle", key: "soundEnabled", label: "Sound" },
  { kind: "toggle", key: "damageNumbersEnabled", label: "Damage numbers" },
  { kind: "toggle", key: "cooldownTimersEnabled", label: "Cooldown timers" },
  { kind: "toggle", key: "autoFireEnabled", label: "Auto-fire" },
  { kind: "choice", key: "enemyHealthBars", label: "Enemy health bars", options: ["off", "threats", "all"] },
  { kind: "toggle", key: "reducedMotionEnabled", label: "Reduced motion" },
  { kind: "toggle", key: "highContrastOutlinesEnabled", label: "High-contrast outlines" },
  { kind: "choice", key: "uiScale", label: "HUD scale", options: ["0.8", "1", "1.2"] },
  { kind: "range", key: "masterVolume", label: "Master volume", min: 0, max: 1, step: 0.1 },
  { kind: "range", key: "sfxVolume", label: "SFX volume", min: 0, max: 1, step: 0.1 },
  // uiVolume / musicVolume / ambienceVolume are deliberately not listed. They
  // persist in GameSettings, but nothing consumes them yet: there is no music,
  // and AudioMixer's ui/music/ambience buses are not routed. Re-list them in
  // the same breath as wiring the mixer — an inert slider is a lie.
  { kind: "range", key: "gamepadMoveDeadzone", label: "Move deadzone", min: 0, max: 1, step: 0.01 },
  { kind: "range", key: "gamepadAimDeadzone", label: "Aim deadzone", min: 0, max: 1, step: 0.01 },
  // gamepadAimSensitivity is likewise unlisted. Aiming here is absolute — the
  // right stick's direction *is* the aim vector — so there is no rate for a
  // sensitivity multiplier to scale. The field is retained so saves written by
  // earlier builds still load.
  { kind: "range", key: "gamepadVibrationStrength", label: "Controller vibration", min: 0, max: 1, step: 0.25 },
  { kind: "range", key: "aimAssistStrength", label: "Aim assist", min: 0, max: 1, step: 0.1 },
  { kind: "range", key: "displaySizePercent", label: "Display size", min: 50, max: 200, step: 5 },
  { kind: "choice", key: "presentationMode", label: "Presentation", options: ["auto", "crisp", "fill"] },
  { kind: "range", key: "brightness", label: "Brightness", min: 0.5, max: 1.5, step: 0.1 },
  { kind: "range", key: "gamma", label: "Gamma", min: 0.5, max: 2, step: 0.1 },
  { kind: "choice", key: "radarSize", label: "Radar size", options: ["0.75", "1", "1.25"] },
  { kind: "choice", key: "offscreenThreatIndicators", label: "Threat indicators", options: ["off", "threats", "all"] },
  { kind: "choice", key: "colorVisionMode", label: "Colour-vision palette", options: ["standard", "deuteranopia", "protanopia", "tritanopia"] },
  { kind: "choice", key: "effectQuality", label: "Combat effects", options: ["auto", "high", "medium", "low"] },
  { kind: "choice", key: "gameSpeedMultiplier", label: "Game speed", options: ["0.75", "1", "1.25"] },
  { kind: "action", key: "controls", label: "Control bindings" },
]);

export function settingsRowsForDisplayCapabilities(
  capabilities: DisplayCapabilities,
): readonly SettingsRow[] {
  const insertionIndex = SETTINGS_ROWS.findIndex((row) => row.key === "presentationMode") + 1;
  const hostRows: SettingsRow[] = [];
  if (capabilities.fullscreenModes.length > 1) {
    hostRows.push({ kind: "choice", key: "fullscreenMode", label: "Fullscreen", options: capabilities.fullscreenModes });
  }
  if (capabilities.canSelectDisplay && capabilities.displays.length > 1) {
    hostRows.push({
      kind: "choice", key: "selectedDisplayId", label: "Display",
      options: capabilities.displays.map(({ id }) => id),
    });
  }
  if (capabilities.frameCaps.length > 1) {
    hostRows.push({
      kind: "choice", key: "frameCap", label: "Frame cap",
      options: capabilities.frameCaps.map(String),
    });
  }
  if (hostRows.length === 0) return SETTINGS_ROWS;
  return Object.freeze([
    ...SETTINGS_ROWS.slice(0, insertionIndex),
    ...hostRows,
    ...SETTINGS_ROWS.slice(insertionIndex),
  ]);
}

export interface RosterEntry {
  id: string;
  name: string;
  status: "playable" | "in-development" | "silhouette";
}

export const ROSTER: readonly RosterEntry[] = Object.freeze([
  { id: "marine", name: "MARINE", status: "playable" },
  { id: "medic", name: "MEDIC", status: "playable" },
  { id: "assault", name: "ASSAULT", status: "in-development" },
  { id: "tactician", name: "TACTICIAN", status: "silhouette" },
  { id: "scout", name: "SCOUT", status: "silhouette" },
]);

export function perkTilePosition(index: number): Readonly<{ x: number; y: number }> {
  const normalized = Math.max(0, Math.floor(index));
  return {
    x: 495 + (normalized % 5) * 83,
    y: 380 + Math.floor(normalized / 5) * 44,
  };
}

export interface LabRoute {
  label: string;
  url: string;
}

/** Surfaced review routes; the full list stays in dev/README.md. */
export const LAB_ROUTES: readonly LabRoute[] = Object.freeze([
  { label: "Normal ten-wave run", url: "?screen=game" },
  { label: "Expedition map (scout mode)", url: "?screen=map" },
  { label: "Readability stress (4 weapons)", url: "?stress=4" },
  { label: "Capacity stress (12 weapons)", url: "?stress=12" },
  { label: "Siege Crusher lab", url: "?scenario=siege-crusher&loadout=vertical" },
  { label: "Brood Warden lab", url: "?scenario=brood-warden&loadout=vertical" },
  { label: "Rift Stalker lab", url: "?scenario=rift-stalker&loadout=vertical" },
  { label: "Synapse Herald lab", url: "?scenario=synapse-herald&loadout=scattergun&autofire=0" },
  { label: "Assembly Prime lab", url: "?scenario=assembly-prime&loadout=scattergun&autofire=0" },
  { label: "Storm Regent lab", url: "?scenario=storm-regent&loadout=scattergun&autofire=0" },
  { label: "Abomination Prime lab", url: "?scenario=abomination-prime&loadout=scattergun&autofire=0" },
  { label: "Infected Survivor lab", url: "?scenario=infected-survivor&loadout=vertical" },
  { label: "Corrupted Marine lab", url: "?scenario=corrupted-marine&loadout=vertical" },
  { label: "Abomination lab", url: "?scenario=abomination&loadout=vertical" },
  { label: "Corrupted Human mixed lab", url: "?scenario=corrupted-human&loadout=vertical" },
  { label: "Nest Weaver lab", url: "?scenario=nest-weaver&loadout=vertical" },
  { label: "Storm Savant lab", url: "?scenario=storm-savant&loadout=vertical" },
  { label: "Scrap Skitterer lab", url: "?scenario=scrap-skitterer&loadout=vertical" },
  { label: "Arc Warden lab", url: "?scenario=arc-warden&loadout=vertical" },
  { label: "Cyborg Reclaimer lab", url: "?scenario=cyborg-reclaimer&loadout=vertical" },
  { label: "Foundry Fabricator lab", url: "?scenario=foundry-fabricator&loadout=vertical" },
  { label: "Bastion Eater lab", url: "?scenario=bastion-eater&loadout=vertical" },
  { label: "Scrap Shop lab", url: "?scenario=scrap-shop&loadout=vertical" },
  { label: "Weapon placement lab", url: "?scenario=weapon-gate" },
  { label: "Production art gallery", url: "?mode=gallery" },
]);

export interface ShellState {
  screen: ShellScreen;
  menuIndex: number;
  howToPlayPage: number;
  settingsIndex: number;
  settingsRows: readonly SettingsRow[];
  labIndex: number;
  rosterIndex: number;
  perkIndex: number;
  unlockedPerkIds: readonly PerkId[];
  threatTierIndex: number;
  unlockedThreatTiers: readonly ThreatTier[];
  settings: GameSettings;
  controls: ControlBindings;
  controlIndex: number;
  controlDevice: "keyboard" | "gamepad";
  armoryIndex: number;
  commandMarksLifetime: number;
  commandMarksBalance: number;
  purchasedArmoryNodeIds: readonly ArmoryNodeId[];
  selectedArmoryNodeId: ArmoryNodeId | null;
  recordsOffset: number;
  runHistoryCount: number;
}

export function createShellState(
  settings: GameSettings,
  screen: ShellScreen = "title",
  progress: GameProgress = {
    runsFinished: 0, victories: 0, bestWaveReached: 0, nodesCleared: 0,
    bestNodesCleared: 0, totalKills: 0, totalDamage: 0, totalScrapEarned: 0,
    bestiary: {},
    threatTierBestNodes: { 0: 0, 1: 0, 2: 0 },
    threatTierVictories: { 0: 0, 1: 0, 2: 0 },
    commandMarksLifetime: 0, purchasedArmoryNodeIds: [],
  },
  selectedPerkId: PerkId | null = "perk-veteran",
  selectedHeroId: HeroDefinition["id"] = "marine",
  controls: ControlBindings = DEFAULT_CONTROL_BINDINGS,
  settingsRows: readonly SettingsRow[] = SETTINGS_ROWS,
  selectedThreatTier: ThreatTier = 0,
  selectedArmoryNodeId: ArmoryNodeId | null = null,
  runHistoryCount = 0,
): ShellState {
  const unlocked = unlockedPerkIds(progress);
  const selectedIndex = Math.max(0, PERK_CATALOG.findIndex((perk) => perk.id === selectedPerkId));
  return {
    screen,
    menuIndex: 0,
    howToPlayPage: 0,
    settingsIndex: 0,
    settingsRows,
    labIndex: 0,
    rosterIndex: Math.max(0, ROSTER.findIndex((hero) => hero.id === selectedHeroId)),
    perkIndex: selectedIndex,
    unlockedPerkIds: unlocked,
    threatTierIndex: selectedThreatTier,
    unlockedThreatTiers: unlockedThreatTiers(progress.threatTierVictories),
    settings: { ...settings },
    controls: { keyboard: { ...controls.keyboard }, gamepad: { ...controls.gamepad } },
    controlIndex: 0,
    controlDevice: "keyboard",
    armoryIndex: 0,
    commandMarksLifetime: progress.commandMarksLifetime,
    commandMarksBalance: commandMarksBalance(progress.commandMarksLifetime, progress.purchasedArmoryNodeIds),
    purchasedArmoryNodeIds: [...progress.purchasedArmoryNodeIds],
    selectedArmoryNodeId: selectedArmoryNodeId !== null && progress.purchasedArmoryNodeIds.includes(selectedArmoryNodeId)
      ? selectedArmoryNodeId
      : null,
    recordsOffset: 0,
    runHistoryCount: Math.max(0, Math.floor(runHistoryCount)),
  };
}

export interface ShellStepResult {
  state: ShellState;
  effects: readonly ShellEffect[];
}

export function stepShell(state: ShellState, intent: ShellIntent): ShellStepResult {
  switch (state.screen) {
    case "title":
      if (intent === "confirm") {
        return { state: { ...state, screen: "menu" }, effects: [] };
      }
      return { state, effects: [] };
    case "menu":
      return stepMenu(state, intent);
    case "how-to-play":
      return stepHowToPlay(state, intent);
    case "settings":
      return stepSettings(state, intent);
    case "controls":
      return stepControls(state, intent);
    case "lab":
      return stepLab(state, intent);
    case "records":
      if (intent === "up") {
        return { state: { ...state, recordsOffset: Math.max(0, state.recordsOffset - 1) }, effects: [] };
      }
      if (intent === "down") {
        return {
          state: {
            ...state,
            recordsOffset: Math.min(Math.max(0, state.runHistoryCount - 6), state.recordsOffset + 1),
          },
          effects: [],
        };
      }
      return intent === "back" || intent === "confirm"
        ? { state: { ...state, screen: "menu" }, effects: [] }
        : { state, effects: [] };
    case "armory":
      return stepArmory(state, intent);
    case "character-select":
      return stepCharacterSelect(state, intent);
    case "threat-select":
      return stepThreatSelect(state, intent);
  }
}

function stepMenu(state: ShellState, intent: ShellIntent): ShellStepResult {
  if (intent === "back") {
    return { state: { ...state, screen: "title" }, effects: [] };
  }
  if (intent === "up" || intent === "left") {
    return { state: { ...state, menuIndex: wrap(state.menuIndex - 1, MENU_CARDS.length) }, effects: [] };
  }
  if (intent === "down" || intent === "right") {
    return { state: { ...state, menuIndex: wrap(state.menuIndex + 1, MENU_CARDS.length) }, effects: [] };
  }
  if (intent === "confirm") {
    const card = MENU_CARDS[state.menuIndex]!;
    switch (card.id) {
      case "expedition":
        return { state: { ...state, screen: "character-select", rosterIndex: 0 }, effects: [] };
      case "armory":
        return { state: { ...state, screen: "armory", armoryIndex: 0 }, effects: [] };
      case "how-to-play":
        return { state: { ...state, screen: "how-to-play", howToPlayPage: 0 }, effects: [] };
      case "settings":
        return { state: { ...state, screen: "settings", settingsIndex: 0 }, effects: [] };
      case "codex":
        return { state, effects: [{ type: "open-url", url: "last-bastion-codex.html" }] };
      case "lab":
        return { state: { ...state, screen: "lab", labIndex: 0 }, effects: [] };
      case "records":
        return { state: { ...state, screen: "records", recordsOffset: 0 }, effects: [] };
    }
  }
  return { state, effects: [] };
}

function stepHowToPlay(state: ShellState, intent: ShellIntent): ShellStepResult {
  if (intent === "back") {
    return { state: { ...state, screen: "menu" }, effects: [] };
  }
  if (intent === "left") {
    return { state: { ...state, howToPlayPage: Math.max(0, state.howToPlayPage - 1) }, effects: [] };
  }
  if (intent === "right" || intent === "confirm") {
    if (state.howToPlayPage >= HOW_TO_PLAY_PAGES.length - 1) {
      return intent === "confirm"
        ? { state: { ...state, screen: "menu" }, effects: [] }
        : { state, effects: [] };
    }
    return { state: { ...state, howToPlayPage: state.howToPlayPage + 1 }, effects: [] };
  }
  return { state, effects: [] };
}

function stepSettings(state: ShellState, intent: ShellIntent): ShellStepResult {
  if (intent === "back") {
    return { state: { ...state, screen: "menu" }, effects: [] };
  }
  if (intent === "up") {
    return { state: { ...state, settingsIndex: wrap(state.settingsIndex - 1, state.settingsRows.length) }, effects: [] };
  }
  if (intent === "down") {
    return { state: { ...state, settingsIndex: wrap(state.settingsIndex + 1, state.settingsRows.length) }, effects: [] };
  }
  if (intent === "left" || intent === "right" || intent === "confirm") {
    const row = state.settingsRows[state.settingsIndex]!;
    if (row.kind === "action") {
      return { state: { ...state, screen: "controls", controlIndex: 0 }, effects: [] };
    }
    let value: GameSettings[keyof GameSettings];
    if (row.kind === "toggle") {
      value = !state.settings[row.key];
    } else if (row.kind === "choice") {
      const options = row.options;
      const current = String(state.settings[row.key]);
      const currentIndex = Math.max(0, options.indexOf(current));
      const direction = intent === "left" ? -1 : 1;
      value = options[(currentIndex + direction + options.length) % options.length] as GameSettings[keyof GameSettings];
      if (row.key === "uiScale") value = Number(value) as 0.8 | 1 | 1.2;
      if (row.key === "radarSize") value = Number(value) as 0.75 | 1 | 1.25;
      if (row.key === "frameCap" && value !== "display") value = Number(value) as 60 | 120 | 144;
    } else {
      const current = Number(state.settings[row.key]);
      const direction = intent === "left" ? -1 : 1;
      value = Math.min(row.max, Math.max(row.min, Math.round((current + direction * row.step) / row.step) * row.step));
    }
    return {
      state: { ...state, settings: { ...state.settings, [row.key]: value } },
      effects: [{ type: "set-setting", key: row.key, value }],
    };
  }
  return { state, effects: [] };
}

function stepControls(state: ShellState, intent: ShellIntent): ShellStepResult {
  if (intent === "back") return { state: { ...state, screen: "settings" }, effects: [] };
  if (intent === "up") return { state: { ...state, controlIndex: wrap(state.controlIndex - 1, KEYBOARD_BINDABLE_ACTIONS.length) }, effects: [] };
  if (intent === "down") return { state: { ...state, controlIndex: wrap(state.controlIndex + 1, KEYBOARD_BINDABLE_ACTIONS.length) }, effects: [] };
  if (intent === "left" || intent === "right") {
    return { state: { ...state, controlDevice: state.controlDevice === "keyboard" ? "gamepad" : "keyboard" }, effects: [] };
  }
  if (intent === "confirm") {
    const action = KEYBOARD_BINDABLE_ACTIONS[state.controlIndex]!;
    if (state.controlDevice === "gamepad" && !GAMEPAD_BINDABLE_ACTIONS.includes(action as GamepadBindableAction)) {
      return { state, effects: [] };
    }
    return { state, effects: [{ type: "capture-binding", device: state.controlDevice, action }] };
  }
  return { state, effects: [] };
}

function stepLab(state: ShellState, intent: ShellIntent): ShellStepResult {
  if (intent === "back") {
    return { state: { ...state, screen: "menu" }, effects: [] };
  }
  if (intent === "up") {
    return { state: { ...state, labIndex: wrap(state.labIndex - 1, LAB_ROUTES.length) }, effects: [] };
  }
  if (intent === "down") {
    return { state: { ...state, labIndex: wrap(state.labIndex + 1, LAB_ROUTES.length) }, effects: [] };
  }
  if (intent === "confirm") {
    return { state, effects: [{ type: "open-url", url: LAB_ROUTES[state.labIndex]!.url }] };
  }
  return { state, effects: [] };
}

function stepCharacterSelect(state: ShellState, intent: ShellIntent): ShellStepResult {
  if (intent === "back") {
    return { state: { ...state, screen: "menu" }, effects: [] };
  }
  if (intent === "left") {
    return { state: { ...state, rosterIndex: wrap(state.rosterIndex - 1, ROSTER.length) }, effects: [] };
  }
  if (intent === "right") {
    return { state: { ...state, rosterIndex: wrap(state.rosterIndex + 1, ROSTER.length) }, effects: [] };
  }
  if (intent === "up") {
    return { state: { ...state, perkIndex: wrap(state.perkIndex - 1, PERK_CATALOG.length) }, effects: [] };
  }
  if (intent === "down") {
    return { state: { ...state, perkIndex: wrap(state.perkIndex + 1, PERK_CATALOG.length) }, effects: [] };
  }
  if (intent === "confirm") {
    const hero = ROSTER[state.rosterIndex]!;
    const perk = PERK_CATALOG[state.perkIndex]!;
    if (hero.status !== "playable" || !isHeroId(hero.id) || !state.unlockedPerkIds.includes(perk.id)) {
      return { state, effects: [] };
    }
    return { state: { ...state, screen: "threat-select" }, effects: [] };
  }
  return { state, effects: [] };
}

function stepArmory(state: ShellState, intent: ShellIntent): ShellStepResult {
  if (intent === "back") return { state: { ...state, screen: "menu" }, effects: [] };
  if (intent === "up" || intent === "left") {
    return { state: { ...state, armoryIndex: wrap(state.armoryIndex - 1, ARMORY_NODES.length) }, effects: [] };
  }
  if (intent === "down" || intent === "right") {
    return { state: { ...state, armoryIndex: wrap(state.armoryIndex + 1, ARMORY_NODES.length) }, effects: [] };
  }
  if (intent !== "confirm") return { state, effects: [] };
  const node = ARMORY_NODES[state.armoryIndex]!;
  if (state.purchasedArmoryNodeIds.includes(node.id)) {
    return {
      state: { ...state, selectedArmoryNodeId: node.id },
      effects: [{ type: "select-armory-node", nodeId: node.id }],
    };
  }
  if (!canPurchaseArmoryNode(node.id, state.commandMarksLifetime, state.purchasedArmoryNodeIds)) {
    return { state, effects: [] };
  }
  const purchasedArmoryNodeIds = [...state.purchasedArmoryNodeIds, node.id];
  return {
    state: {
      ...state,
      purchasedArmoryNodeIds,
      selectedArmoryNodeId: node.id,
      commandMarksBalance: commandMarksBalance(state.commandMarksLifetime, purchasedArmoryNodeIds),
    },
    effects: [{ type: "purchase-armory-node", nodeId: node.id }],
  };
}

function stepThreatSelect(state: ShellState, intent: ShellIntent): ShellStepResult {
  if (intent === "back") {
    return { state: { ...state, screen: "character-select" }, effects: [] };
  }
  if (intent === "up" || intent === "left") {
    return { state: { ...state, threatTierIndex: wrap(state.threatTierIndex - 1, THREAT_TIERS.length) }, effects: [] };
  }
  if (intent === "down" || intent === "right") {
    return { state: { ...state, threatTierIndex: wrap(state.threatTierIndex + 1, THREAT_TIERS.length) }, effects: [] };
  }
  if (intent === "confirm") {
    const tier = THREAT_TIERS[state.threatTierIndex]!.tier;
    const hero = ROSTER[state.rosterIndex]!;
    const perk = PERK_CATALOG[state.perkIndex]!;
    if (hero.status !== "playable" || !isHeroId(hero.id) || !state.unlockedThreatTiers.includes(tier)) {
      return { state, effects: [] };
    }
    return { state, effects: [{ type: "start-run", heroId: hero.id, perkId: perk.id, threatTier: tier }] };
  }
  return { state, effects: [] };
}

function wrap(index: number, length: number): number {
  return (index + length) % length;
}
