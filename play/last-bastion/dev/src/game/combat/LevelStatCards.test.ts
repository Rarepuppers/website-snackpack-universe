import { describe, expect, it } from "vitest";
import { CombatSimulation } from "./CombatSimulation";
import {
  LEVEL_STAT_ORDER,
  isLevelStatCardId,
  levelStatCardById,
} from "../content/levelStatCatalog";
import type { PlayerStatBlock } from "../stats/PlayerStatBlock";

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

  it("never offers a card whose stat nothing reads", () => {
    // The bug this guards: `lvl-engineering` shipped inside LEVEL_STAT_ORDER
    // while `engineering` had zero consumers, so a player could spend a level-up
    // on literally no effect. A card is only honest if something reads its stat.
    const CONSUMED_STATS = new Set<keyof PlayerStatBlock>([
      "damagePercent", "meleeDamagePercent", "rangedDamagePercent", "elementalDamagePercent",
      "critChancePercent", "critMultiplier", "attackSpeedPercent",
      "maxHpFlat", "maxHpPercent", "armourFlat", "hpRegenPerSecond", "lifestealPercent",
      "dodgePercent", "moveSpeedPercent", "harvestingPercent", "luck", "curse",
    ]);
    for (const id of LEVEL_STAT_ORDER) {
      const card = levelStatCardById(id);
      expect(card, `${id} is in LEVEL_STAT_ORDER but has no definition`).not.toBeNull();
      expect(CONSUMED_STATS.has(card!.statKey), `${id} grants unread stat ${card!.statKey}`).toBe(true);
    }
  });

  it("always offers four distinct cards regardless of level", () => {
    // The draw strides LEVEL_STAT_ORDER by 4, so its length and the stride must
    // not share a factor that starves the rack. Removing one card changed the
    // length from 15 to 14, which is exactly the kind of edit that breaks this.
    const simulation = new CombatSimulation({ autoStartWaves: false });
    for (let level = 0; level < LEVEL_STAT_ORDER.length + 2; level += 1) {
      levelUp(simulation);
      const decision = simulation.snapshot().pendingDecision;
      if (!decision) continue;
      const statCards = decision.options.filter((option) => isLevelStatCardId(option.id));
      expect(new Set(statCards.map((option) => option.id)).size).toBe(statCards.length);
      simulation.chooseOption(decision.options[0]!.id);
    }
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
