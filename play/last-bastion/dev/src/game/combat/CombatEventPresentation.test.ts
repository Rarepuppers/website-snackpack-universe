// `?raw` rather than node:fs, matching `content/codexDrift.test.ts`: the
// workspace carries no @types/node, and vite/client is already in tsconfig.
import COMBAT_SCENE_SOURCE from "../scenes/PrototypeScene.ts?raw";
import COMBAT_EVENT_PRESENTER_SOURCE from "../rendering/CombatEventPresenter.ts?raw";
import COMBAT_SIMULATION_SOURCE from "./CombatSimulation.ts?raw";
import COMBAT_HUD_SOURCE from "../ui/CombatHud.ts?raw";
import AUDIO_CUE_SOURCE from "../audio/AudioCueMap.ts?raw";
import PRODUCTION_AUDIO_SOURCE from "../audio/ProductionAudioFeedback.ts?raw";
import { describe, expect, it } from "vitest";
import {
  COMBAT_EVENT_PRESENTATION,
  exemptEvents,
  hudEvents,
  audioOnlyEvents,
  sceneHandledEvents,
  unpresentedEvents,
} from "./CombatEventPresentation";

/**
 * The map next door is exhaustive by construction — `tsc` enforces that every
 * union member has a row. What `tsc` cannot check is whether a row is *honest*:
 * nothing stops someone marking an event `"scene"` and never writing the
 * handler. These cases check each claim against the code that would have to
 * exist for it to be true.
 *
 * Source text is matched rather than behaviour executed. That is a deliberate
 * trade: booting Phaser to assert one `case` arm would be slow and brittle, and
 * a missing `case` is a textual fact. It catches the failure this guard exists
 * for — a new event shipping with no presentation — which is the whole point.
 */
const ALL_EVENT_TYPES = Object.keys(COMBAT_EVENT_PRESENTATION).sort();

/**
 * Combat-event presentation lives in two places: `CombatEventPresenter`, which
 * owns most of it, and `PrototypeScene`, which keeps the arms needing
 * scene-level state. A guard reading only one of them invents debt on the other
 * — which is exactly what happened when the presenter was extracted while this
 * test went on reading the scene alone.
 */
function hasSceneCase(eventType: string): boolean {
  const arm = `case "${eventType}"`;
  return COMBAT_SCENE_SOURCE.includes(arm) || COMBAT_EVENT_PRESENTER_SOURCE.includes(arm);
}

function hasAudioCue(eventType: string): boolean {
  return AUDIO_CUE_SOURCE.includes(`"${eventType}"`)
    || PRODUCTION_AUDIO_SOURCE.includes(`"${eventType}"`);
}

/** The `export type CombatEvent = ...` declaration only, brace-matched. */
function combatEventUnionSource(): string {
  const start = COMBAT_SIMULATION_SOURCE.indexOf("export type CombatEvent");
  expect(start, "CombatEvent union not found").toBeGreaterThan(-1);
  let depth = 0;
  for (let index = COMBAT_SIMULATION_SOURCE.indexOf("=", start); index < COMBAT_SIMULATION_SOURCE.length; index += 1) {
    const character = COMBAT_SIMULATION_SOURCE[index];
    if (character === "{") depth += 1;
    else if (character === "}") depth -= 1;
    else if (character === ";" && depth === 0) return COMBAT_SIMULATION_SOURCE.slice(start, index);
  }
  throw new Error("CombatEvent union is not terminated.");
}

describe("combat event presentation coverage", () => {
  it("declares a surface for every event the simulation can emit", () => {
    // Cross-checks the type-level guarantee against the source, so a future
    // refactor that widens the union's `type` to `string` cannot pass silently.
    // Scanning the whole file would be wrong: `type:` also appears on enemy and
    // scenario descriptors, and two of those share a name with a scene `case`.
    const undeclared = [...combatEventUnionSource().matchAll(/type:\s*"([a-z0-9-]+)"/g)]
      .map((match) => match[1]!)
      .filter((eventType) => !(eventType in COMBAT_EVENT_PRESENTATION));
    expect([...new Set(undeclared)], "emitted events absent from the map").toEqual([]);
    expect(ALL_EVENT_TYPES.length).toBeGreaterThan(150);
  });

  it("every event claiming a scene surface really has a handler", () => {
    const dishonest = sceneHandledEvents().filter((eventType) => !hasSceneCase(eventType));
    expect(dishonest, 'marked "scene" with no case in PrototypeScene').toEqual([]);
  });

  it("every event claiming an audio surface really has a cue", () => {
    const dishonest = audioOnlyEvents().filter((eventType) => !hasAudioCue(eventType));
    expect(dishonest, 'marked "audio-only" with no cue mapping').toEqual([]);
  });

  it("every event claiming the HUD surface is really read there", () => {
    // Added after the first pass classified scrap-spent as unpresented: the
    // detector only looked at the scene and the audio map, and CombatHud is a
    // third surface. A guard that cannot see a surface invents debt on it.
    const dishonest = hudEvents().filter((eventType) => !COMBAT_HUD_SOURCE.includes(`"${eventType}"`));
    expect(dishonest, 'marked "hud" but never read in CombatHud').toEqual([]);
  });

  it("keeps exemptions few, and never lets one hide a real gap", () => {
    // Exemptions are decisions, so they should be rare and individually argued.
    // If this number climbs, the category is being used to make the backlog look
    // shorter than it is.
    expect(exemptEvents().length).toBeLessThanOrEqual(3);
  });

  it("nothing marked unpresented has quietly gained a handler", () => {
    // The friendly failure: someone closed a backlog item and did not move the
    // row. The fix is a one-word edit, and the message says so.
    const nowPresented = unpresentedEvents().filter(
      (eventType) => hasSceneCase(eventType) || hasAudioCue(eventType),
    );
    expect(
      nowPresented,
      'these now have presentation — change their row to "scene" or "audio-only"',
    ).toEqual([]);
  });

  it("holds the unpresented backlog at or below its recorded size", () => {
    // Started at 21 on 11 September 2026 and reached zero the same day. It must
    // stay there: a new event that ships with no way for a player to perceive it
    // is exactly what this file exists to stop. If you need to add a row here,
    // the honest move is an argued "exempt", not a raised ceiling.
    expect(unpresentedEvents().length).toBe(0);
  });

  it("acknowledges the outcome of every objective mode", () => {
    // Named explicitly rather than left to the ratchet: all three objective
    // modes are a headline feature, and until 11 September 2026 a player could
    // win or lose one without the game saying so. Both halves are asserted —
    // something drawn, and something heard — because the loss in particular
    // often happens while the player is looking elsewhere on screen.
    for (const eventType of [
      "escort-objective-completed",
      "escort-objective-failed",
      "deny-objective-completed",
      "deny-objective-failed",
      "collect-objective-completed",
      "collect-objective-failed",
    ]) {
      expect(COMBAT_EVENT_PRESENTATION[eventType as keyof typeof COMBAT_EVENT_PRESENTATION], eventType)
        .toBe("scene");
      expect(hasSceneCase(eventType), `${eventType} visual`).toBe(true);
      expect(hasAudioCue(eventType), `${eventType} cue`).toBe(true);
    }
  });
});
