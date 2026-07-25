import { describe, expect, it } from "vitest";
import { CombatSimulation } from "./CombatSimulation";
import { isLevelStatCardId } from "../content/levelStatCatalog";

/**
 * Phase 3C: level-ups draw the authored weapon upgrades *and* one stat card from
 * the unified `PlayerStatBlock`, so the shop, items and level-ups all speak one
 * stat language.
 */
describe("level-up stat cards", () => {
  function levelUp(simulation: CombatSimulation): void {
    simulation.addExperience(simulation.snapshot().experienceForNextLevel);
  }

  it("offers a stat card alongside the upgrades and applies it to the shared stat block", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    levelUp(simulation);

    const decision = simulation.snapshot().pendingDecision;
    expect(decision?.kind).toBe("upgrade");
    expect(decision!.options).toHaveLength(4);
    // Three authored upgrades, then exactly one stat card.
    const statCards = decision!.options.filter((option) => isLevelStatCardId(option.id));
    expect(statCards).toHaveLength(1);
    // A mixed list reads as one list: every option carries a [CATEGORY] prefix.
    for (const option of decision!.options) expect(option.description.startsWith("[")).toBe(true);

    expect(simulation.chooseOption(statCards[0]!.id)).toBe(true);
    // Grants land in the same carrier shop items use, so they persist on the run
    // build across a node transition rather than dying with the simulation.
    expect(simulation.snapshot().itemStats.damagePercent).toBe(5);
  });

  it("routes a max-HP card through refreshPlayerStats so the bonus is live immediately", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    levelUp(simulation);
    expect(simulation.chooseOption(simulation.snapshot().pendingDecision!.options[0]!.id)).toBe(true);

    const before = simulation.snapshot().playerMaxHealth;
    levelUp(simulation);
    const card = simulation.snapshot().pendingDecision!.options.find((option) => isLevelStatCardId(option.id));
    expect(card?.id).toBe("lvl-max-hp");
    expect(simulation.chooseOption(card!.id)).toBe(true);

    const after = simulation.snapshot();
    // Level growth also raises max HP, so assert the card's own +5 on top of it.
    expect(after.itemStats.maxHpFlat).toBe(5);
    expect(after.playerMaxHealth).toBeGreaterThanOrEqual(before + 5);
  });
});
