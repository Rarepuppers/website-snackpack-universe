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

function reachesWaveThreeWithAurum(seed: number): boolean {
  const simulation = new CombatSimulation({ seed });
  for (let frame = 0; frame < 1800; frame += 1) {
    const before = simulation.snapshot();
    if (before.pendingDecision) {
      const option = before.pendingDecision.kind === "scrap-shop"
        ? before.pendingDecision.options.find((candidate) => candidate.id === "shop-leave")
        : before.pendingDecision.options.find((candidate) => candidate.affordable !== false);
      if (option) simulation.chooseOption(option.id);
    }
    const snapshot = simulation.step(IDLE, 0.05);
    for (const enemy of snapshot.enemies) {
      if (enemy.type !== "aurum-hoarder") simulation.dealDamage(enemy.id, 9999);
    }
    if (snapshot.waveNumber === 3 && snapshot.status === "combat") {
      return snapshot.enemies.some((enemy) => enemy.type === "aurum-hoarder");
    }
  }
  return false;
}

describe("Scrap Shop behavior gate", () => {
  it("draws three distinct seeded offers plus an explicit leave action", () => {
    const first = new CombatSimulation({ scenario: "scrap-shop", seed: 37 }).snapshot();
    const second = new CombatSimulation({ scenario: "scrap-shop", seed: 37 }).snapshot();

    expect(first.pendingDecision?.kind).toBe("scrap-shop");
    expect(first.pendingDecision?.title).toBe("SCRAP SHOP — 150 SCRAP");
    expect(first.pendingDecision?.options).toHaveLength(4);
    expect(first.pendingDecision?.options.map((option) => option.id))
      .toEqual(second.pendingDecision?.options.map((option) => option.id));
    const offers = first.pendingDecision!.options.slice(0, 3);
    expect(new Set(offers.map((offer) => offer.id)).size).toBe(3);
    expect(offers.every((offer) => (offer.cost ?? 0) > 0 && offer.affordable)).toBe(true);
    expect(first.pendingDecision?.options[3]?.id).toBe("shop-leave");
  });

  it("rejects unaffordable purchases without closing or mutating the shop", () => {
    const simulation = new CombatSimulation({ scenario: "scrap-shop", startingScrap: 0, seed: 8 });
    const before = simulation.snapshot();
    const blocked = before.pendingDecision!.options.find((option) => option.id !== "shop-leave")!;

    expect(blocked.affordable).toBe(false);
    expect(simulation.chooseOption(blocked.id)).toBe(false);
    expect(simulation.snapshot().securedScrap).toBe(0);
    expect(simulation.snapshot().pendingDecision?.options.map((option) => option.id))
      .toEqual(before.pendingDecision?.options.map((option) => option.id));
    expect(simulation.chooseOption("shop-leave")).toBe(true);
    expect(simulation.snapshot().pendingDecision).toBeNull();
  });

  it("spends the exact price, applies the purchase immediately, and refreshes the rack", () => {
    const simulation = new CombatSimulation({ scenario: "scrap-shop", seed: 37 });
    const before = simulation.snapshot();
    const offer = before.pendingDecision!.options.find((option) => option.id !== "shop-leave")!;
    const weaponCount = before.equippedWeapons.length;
    const upgradeCount = before.upgradeLevels.length;

    expect(simulation.chooseOption(offer.id)).toBe(true);
    const after = simulation.snapshot();
    expect(after.securedScrap).toBe(150 - offer.cost!);
    expect(after.pendingDecision?.kind).toBe("scrap-shop");
    expect(after.pendingDecision?.title).toBe(`SCRAP SHOP — ${after.securedScrap} SCRAP`);
    expect(after.events).toContainEqual({
      type: "scrap-spent",
      amount: offer.cost,
      remaining: after.securedScrap,
      offerId: offer.id,
    });

    if (offer.id === "shop-repair") expect(after.playerHealth).toBeGreaterThan(before.playerHealth);
    if (offer.id === "shop-uranium-kit") expect(after.uraniumKitAvailable).toBe(true);
    if (offer.id === "shop-armour-retrofit") expect(after.playerArmour).toBe(before.playerArmour + 3);
    if (offer.id.startsWith("shop-weapon:")) expect(after.equippedWeapons).toHaveLength(weaponCount + 1);
    if (offer.id.startsWith("shop-upgrade:")) expect(after.upgradeLevels).toHaveLength(upgradeCount + 1);
  });

  it("banks wave-clear and kill Scrap before the first reward decision", () => {
    const simulation = new CombatSimulation({ seed: 21 });
    let snapshot = simulation.snapshot();
    const events = [] as typeof snapshot.events[number][];
    for (let frame = 0; frame < 600 && !snapshot.pendingDecision; frame += 1) {
      snapshot = simulation.step(IDLE, 0.05);
      events.push(...snapshot.events);
      for (const enemy of snapshot.enemies) simulation.dealDamage(enemy.id, 9999);
    }

    expect(snapshot.pendingDecision?.kind).toBe("weapon-chest");
    expect(snapshot.securedScrap).toBeGreaterThanOrEqual(15);
    expect(events.some((event) => event.type === "scrap-secured" && event.source === "wave-clear" && event.amount === 15)).toBe(true);
  });

  it("enables deterministic ordinary-wave Aurum arrivals after the Shop exists", () => {
    const matchingSeed = Array.from({ length: 64 }, (_, index) => index + 1)
      .find((seed) => reachesWaveThreeWithAurum(seed));
    expect(matchingSeed).toBeDefined();
    expect(reachesWaveThreeWithAurum(matchingSeed!)).toBe(true);
  });
});
