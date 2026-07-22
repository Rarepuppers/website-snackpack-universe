import type { GameProgress, GameSettings } from "../save/LocalSaveStore";
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
  | "character-select";

export type ShellIntent = "up" | "down" | "left" | "right" | "confirm" | "back";

export type ShellEffect =
  | { type: "start-run"; heroId: string; perkId: PerkId }
  | { type: "open-url"; url: string }
  | { type: "set-setting"; key: keyof GameSettings; value: boolean }
  | { type: "capture-binding"; device: "keyboard" | "gamepad"; action: KeyboardBindableAction | GamepadBindableAction };

export interface MenuCard {
  id: "expedition" | "how-to-play" | "settings" | "codex" | "lab" | "records";
  label: string;
}

export const MENU_CARDS: readonly MenuCard[] = Object.freeze([
  { id: "expedition", label: "EXPEDITION" },
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

export interface SettingsRow {
  key: keyof GameSettings | "controls";
  label: string;
}

export const SETTINGS_ROWS: readonly SettingsRow[] = Object.freeze([
  { key: "screenShakeEnabled", label: "Screen shake" },
  { key: "reducedFlashEnabled", label: "Reduced flash" },
  { key: "soundEnabled", label: "Sound" },
  { key: "damageNumbersEnabled", label: "Damage numbers" },
  { key: "cooldownTimersEnabled", label: "Cooldown timers" },
  { key: "autoFireEnabled", label: "Auto-fire" },
  { key: "controls", label: "Control bindings" },
]);

export interface RosterEntry {
  id: string;
  name: string;
  status: "playable" | "in-development" | "silhouette";
}

export const ROSTER: readonly RosterEntry[] = Object.freeze([
  { id: "marine", name: "MARINE", status: "playable" },
  { id: "medic", name: "MEDIC", status: "playable" },
  { id: "assault", name: "ASSAULT", status: "silhouette" },
  { id: "tactician", name: "TACTICIAN", status: "silhouette" },
  { id: "scout", name: "SCOUT", status: "silhouette" },
]);

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
  labIndex: number;
  rosterIndex: number;
  perkIndex: number;
  unlockedPerkIds: readonly PerkId[];
  settings: GameSettings;
  controls: ControlBindings;
  controlIndex: number;
  controlDevice: "keyboard" | "gamepad";
}

export function createShellState(
  settings: GameSettings,
  screen: ShellScreen = "title",
  progress: GameProgress = {
    runsFinished: 0, victories: 0, bestWaveReached: 0, nodesCleared: 0,
    bestNodesCleared: 0, totalKills: 0, totalDamage: 0, totalScrapEarned: 0,
    bestiary: {},
  },
  selectedPerkId: PerkId | null = "perk-veteran",
  selectedHeroId: "marine" | "medic" = "marine",
  controls: ControlBindings = DEFAULT_CONTROL_BINDINGS,
): ShellState {
  const unlocked = unlockedPerkIds(progress);
  const selectedIndex = Math.max(0, PERK_CATALOG.findIndex((perk) => perk.id === selectedPerkId));
  return {
    screen,
    menuIndex: 0,
    howToPlayPage: 0,
    settingsIndex: 0,
    labIndex: 0,
    rosterIndex: Math.max(0, ROSTER.findIndex((hero) => hero.id === selectedHeroId)),
    perkIndex: selectedIndex,
    unlockedPerkIds: unlocked,
    settings: { ...settings },
    controls: { keyboard: { ...controls.keyboard }, gamepad: { ...controls.gamepad } },
    controlIndex: 0,
    controlDevice: "keyboard",
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
      return intent === "back" || intent === "confirm"
        ? { state: { ...state, screen: "menu" }, effects: [] }
        : { state, effects: [] };
    case "character-select":
      return stepCharacterSelect(state, intent);
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
      case "how-to-play":
        return { state: { ...state, screen: "how-to-play", howToPlayPage: 0 }, effects: [] };
      case "settings":
        return { state: { ...state, screen: "settings", settingsIndex: 0 }, effects: [] };
      case "codex":
        return { state, effects: [{ type: "open-url", url: "last-bastion-codex.html" }] };
      case "lab":
        return { state: { ...state, screen: "lab", labIndex: 0 }, effects: [] };
      case "records":
        return { state: { ...state, screen: "records" }, effects: [] };
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
    return { state: { ...state, settingsIndex: wrap(state.settingsIndex - 1, SETTINGS_ROWS.length) }, effects: [] };
  }
  if (intent === "down") {
    return { state: { ...state, settingsIndex: wrap(state.settingsIndex + 1, SETTINGS_ROWS.length) }, effects: [] };
  }
  if (intent === "left" || intent === "right" || intent === "confirm") {
    const row = SETTINGS_ROWS[state.settingsIndex]!;
    if (row.key === "controls") {
      return { state: { ...state, screen: "controls", controlIndex: 0 }, effects: [] };
    }
    const value = !state.settings[row.key];
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
    if (hero.status !== "playable" || !state.unlockedPerkIds.includes(perk.id)) {
      return { state, effects: [] };
    }
    return { state, effects: [{ type: "start-run", heroId: hero.id, perkId: perk.id }] };
  }
  return { state, effects: [] };
}

function wrap(index: number, length: number): number {
  return (index + length) % length;
}
