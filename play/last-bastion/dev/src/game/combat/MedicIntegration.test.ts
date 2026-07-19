import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation } from "./CombatSimulation";

const IDLE: PlayerIntent = {
  move: { x: 0, y: 0 },
  aim: { x: 1, y: 0 },
  fireHeld: false,
  evasiveMovePressed: false,
  interactPressed: false,
  ultimatePressed: false,
  kitPressed: false,
  pausePressed: false,
  restartPressed: false,
};

describe("Field Medic combat integration", () => {
  it("deploys with the Injector Carbine, light-biased rack, and Medic growth", () => {
    const medic = new CombatSimulation({ heroId: "medic", autoStartWaves: false });
    const deployed = medic.snapshot();
    expect(deployed.heroId).toBe("medic");
    expect(deployed.equippedWeapons[0]!.weaponId).toBe("injector-carbine");
    expect(deployed.weaponInventory.rack.map((slot) => slot.weaponClass)).toEqual(["light", "light", "all"]);
    expect(deployed.playerArmour).toBe(1);

    medic.addExperience(20);
    const levelled = medic.snapshot();
    expect(levelled.level).toBe(2);
    expect(levelled.playerMaxHealth).toBe(12);
    expect(levelled.playerArmour).toBe(1.5);
    expect(levelled.weaponProficiencies.light).toBe(2);
  });

  it("converts Emergency Surge overflow into temporary shield", () => {
    const medic = new CombatSimulation({ heroId: "medic", autoStartWaves: false });
    const result = medic.step({ ...IDLE, ultimatePressed: true }, 0.05);
    expect(result.playerShield).toBe(3);
    expect(result.ultimateReady).toBe(false);
    expect(result.events).toContainEqual(expect.objectContaining({
      type: "medic-surge",
      healed: 0,
      shieldGained: 2,
    }));
  });
});
