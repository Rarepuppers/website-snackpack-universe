import { describe, expect, it } from "vitest";
import {
  REPLAY_FIXED_DELTA_SECONDS,
  REPLAY_FORMAT_VERSION,
  SIMULATION_COMPATIBILITY_VERSION,
  runCombatReplay,
  type CombatReplayFixture,
} from "./ReplayFixture";
import type { CombatScenario } from "./CombatSimulation";

/**
 * QA-05's remaining corpus: the paths the existing fixtures did not reach.
 *
 * `ReplayFixture.test.ts` already covers seeded determinism, weapon placement,
 * expedition chains and build continuity. The audit named four gaps — shop
 * purchase and ban, objective completion and failure, hero abilities, and defeat
 * — and those are the ones that matter most before `CombatSimulation.ts` is
 * split, because they are the branches a refactor is most likely to reroute
 * without any current test noticing.
 *
 * ## What a matching digest does and does not prove
 *
 * The digest covers observable run state: health, shield, progression, scrap,
 * weapons, upgrades, transformation, relics, items, shop bans, enemies and
 * projectiles. Two runs agreeing on it agree on everything the player can act
 * on. It is **not** proof of behavioural equivalence — nothing here certifies
 * rendering, audio, or any field the digest omits — and the 7 September audit
 * was right to say so. These cases are a net, not a certificate.
 */
function fixture(
  scenario: CombatScenario,
  seed: number,
  inputSpans: CombatReplayFixture["inputSpans"],
): CombatReplayFixture {
  return {
    formatVersion: REPLAY_FORMAT_VERSION,
    simulationVersion: SIMULATION_COMPATIBILITY_VERSION,
    seed,
    scenario,
    fixedDeltaSeconds: REPLAY_FIXED_DELTA_SECONDS,
    inputSpans,
  };
}

/** Stand still and shoot: enough to drive most scenarios to an outcome. */
const HOLD_AND_FIRE = [{ frames: 1800, aim: { x: 1, y: 0 }, fireHeld: true }] as const;

/** Run away without firing: the reliable way to lose an objective or a life. */
const FLEE = [{ frames: 1800, move: { x: -1, y: 0 }, fireHeld: false }] as const;

describe("replay corpus — the branches a split is most likely to reroute", () => {
  for (const scenario of ["escort-objective", "deny-objective", "collect-objective"] as const) {
    it(`replays ${scenario} to the same state twice`, () => {
      const first = runCombatReplay(fixture(scenario, 4242, [...HOLD_AND_FIRE]));
      const second = runCombatReplay(fixture(scenario, 4242, [...HOLD_AND_FIRE]));
      expect(second.digest).toBe(first.digest);
      expect(first.framesRun).toBeGreaterThan(0);
    });

    it(`reaches a different state when ${scenario} is abandoned rather than fought`, () => {
      // Completion and failure are different branches of the objective code, and
      // a refactor that collapsed them would otherwise pass everything.
      const fought = runCombatReplay(fixture(scenario, 4242, [...HOLD_AND_FIRE]));
      const fled = runCombatReplay(fixture(scenario, 4242, [...FLEE]));
      expect(fled.digest).not.toBe(fought.digest);
    });
  }

  it("replays the shop deterministically, including what it offers", () => {
    const first = runCombatReplay(fixture("scrap-shop", 99, [...HOLD_AND_FIRE]));
    const second = runCombatReplay(fixture("scrap-shop", 99, [...HOLD_AND_FIRE]));
    expect(second.digest).toBe(first.digest);
  });

  it("gives a different shop for a different seed", () => {
    // Guards the opposite failure from the one above: a shop that is stable
    // because it is constant rather than because it is seeded.
    const a = runCombatReplay(fixture("scrap-shop", 99, [...HOLD_AND_FIRE]));
    const b = runCombatReplay(fixture("scrap-shop", 100, [...HOLD_AND_FIRE]));
    expect(b.digest).not.toBe(a.digest);
  });

  it("records a purchase, and the item actually arrives", () => {
    // The shop offers the same four options from frame 1 for a given seed, so the
    // ids here are the real ones rather than an index. Buying must move the
    // digest *and* put the item in the player's hands; a refactor that charged
    // the scrap and dropped the item would pass a digest-only check.
    const leaving = runCombatReplay(fixture("scrap-shop", 99, [
      { frames: 60, fireHeld: false, decisionOnFirstFrame: "shop-leave" },
    ]));
    const buying = runCombatReplay(fixture("scrap-shop", 99, [
      { frames: 60, fireHeld: false, decisionOnFirstFrame: "shop-item:bayonet" },
    ]));
    expect(buying.digest).not.toBe(leaving.digest);
    expect(buying.snapshot.ownedItemIds).toContain("bayonet");
    expect(leaving.snapshot.ownedItemIds).not.toContain("bayonet");
  });

  it("charges for a purchase rather than giving it away", () => {
    const leaving = runCombatReplay(fixture("scrap-shop", 99, [
      { frames: 60, fireHeld: false, decisionOnFirstFrame: "shop-leave" },
    ]));
    const buying = runCombatReplay(fixture("scrap-shop", 99, [
      { frames: 60, fireHeld: false, decisionOnFirstFrame: "shop-item:bayonet" },
    ]));
    expect(buying.snapshot.securedScrap).toBeLessThan(leaving.snapshot.securedScrap);
  });

  it("replays a shop upgrade purchase deterministically", () => {
    const spans = [{ frames: 60, fireHeld: false, decisionOnFirstFrame: "shop-upgrade:kinetic-buffer" }];
    const first = runCombatReplay(fixture("scrap-shop", 99, [...spans]));
    const second = runCombatReplay(fixture("scrap-shop", 99, [...spans]));
    expect(second.digest).toBe(first.digest);
    expect(first.snapshot.upgradeLevels.some((u) => u.id === "kinetic-buffer")).toBe(true);
  });

  it("records a shop ban, which is two decisions deep", () => {
    // Banning is not a top-level option: shop-manage opens a second decision
    // whose options are shop-lock:/shop-ban:/shop-reroll. Two-step flows are
    // exactly where a refactor loses a branch, and bannedShopIds is in the
    // digest, so this pins both the navigation and the effect.
    const banned = runCombatReplay(fixture("scrap-shop", 99, [
      { frames: 1, fireHeld: false, decisionOnFirstFrame: "shop-manage" },
      { frames: 60, fireHeld: false, decisionOnFirstFrame: "shop-ban:shop-item:bayonet" },
    ]));
    expect(banned.snapshot.bannedShopIds.length).toBeGreaterThan(0);

    const untouched = runCombatReplay(fixture("scrap-shop", 99, [
      { frames: 61, fireHeld: false },
    ]));
    expect(untouched.snapshot.bannedShopIds).toEqual([]);
    expect(banned.digest).not.toBe(untouched.digest);
  });

  it("replays the hero's evasive ability deterministically and observably", () => {
    const still = runCombatReplay(fixture("corrupted-marine", 7, [
      { frames: 600, move: { x: 1, y: 0 }, fireHeld: true },
    ]));
    const evading = runCombatReplay(fixture("corrupted-marine", 7, [
      { frames: 600, move: { x: 1, y: 0 }, fireHeld: true, evasiveMoveOnFirstFrame: true },
    ]));
    // Position is in the digest, so a dash that did nothing would fail here.
    expect(evading.digest).not.toBe(still.digest);
    const repeated = runCombatReplay(fixture("corrupted-marine", 7, [
      { frames: 600, move: { x: 1, y: 0 }, fireHeld: true, evasiveMoveOnFirstFrame: true },
    ]));
    expect(repeated.digest).toBe(evading.digest);
  });

  it("replays a defeat deterministically, and really does die", () => {
    // Standing in front of a boss without firing is the shortest reliable route
    // to the defeat branch, which nothing in the existing corpus exercised. The
    // status assertion is specific on purpose: "one of three outcomes" would
    // still pass if defeat stopped being reachable at all.
    const spans = [{ frames: 3600, move: { x: 0, y: 0 }, fireHeld: false }];
    const first = runCombatReplay(fixture("abomination-prime", 11, [...spans]));
    const second = runCombatReplay(fixture("abomination-prime", 11, [...spans]));
    expect(first.snapshot.status).toBe("defeat");
    expect(first.snapshot.playerHealth).toBe(0);
    expect(second.digest).toBe(first.digest);
  });

  it("keeps every scenario in the corpus runnable", () => {
    // Cheap breadth: a scenario that throws on boot is a broken branch nobody
    // would otherwise notice until a Lab route was opened by hand.
    const scenarios: CombatScenario[] = [
      "escort-objective", "deny-objective", "collect-objective",
      "scrap-shop", "weapon-gate", "density-capacity", "corrupted-marine",
    ];
    for (const scenario of scenarios) {
      expect(() => runCombatReplay(fixture(scenario, 3, [{ frames: 120, fireHeld: true }])), scenario)
        .not.toThrow();
    }
  });
});
