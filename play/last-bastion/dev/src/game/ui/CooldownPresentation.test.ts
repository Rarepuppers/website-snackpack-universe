import { describe, expect, it } from "vitest";
import type { EquippedWeaponSnapshot } from "../combat/CombatSimulation";
import { WEAPON_CATALOG } from "../content/weaponCatalog";
import {
  cadenceWeapons,
  cooldownRemainingFraction,
  formatCooldownSeconds,
  weaponTileAbbreviation,
} from "./CooldownPresentation";

describe("CooldownPresentation", () => {
  it("formats long and short cooldowns without a lingering zero", () => {
    expect(formatCooldownSeconds(15.4)).toBe("16");
    expect(formatCooldownSeconds(9.94)).toBe("9.9");
    expect(formatCooldownSeconds(0)).toBe("");
  });

  it("clamps the radial remaining fraction", () => {
    expect(cooldownRemainingFraction(1.25, 2.5)).toBe(0.5);
    expect(cooldownRemainingFraction(4, 2.5)).toBe(1);
    expect(cooldownRemainingFraction(-1, 2.5)).toBe(0);
  });

  it("selects only weapons with meaningful passive cadence", () => {
    const weapons: EquippedWeaponSnapshot[] = [
      snapshot("bastion-service-rifle"),
      snapshot("patrol-blade"),
      snapshot("bolt-carbine"),
      snapshot("bulwark-rotary-cannon"),
      snapshot("grenade-tube"),
    ];
    expect(cadenceWeapons(weapons).map((weapon) => weapon.weaponId)).toEqual([
      "patrol-blade", "bolt-carbine", "grenade-tube",
    ]);
    expect(weaponTileAbbreviation("patrol-blade")).toBe("PB");
  });
});

function snapshot(weaponId: "bastion-service-rifle" | "patrol-blade" | "bolt-carbine" | "bulwark-rotary-cannon" | "grenade-tube"): EquippedWeaponSnapshot {
  const stats = WEAPON_CATALOG[weaponId];
  return {
    instanceId: weaponId === "patrol-blade" ? 2 : 1,
    weaponId,
    stats: { ...stats },
    cooldownRemainingSeconds: 0,
    cooldownDurationSeconds: stats.fireIntervalSeconds,
  };
}
