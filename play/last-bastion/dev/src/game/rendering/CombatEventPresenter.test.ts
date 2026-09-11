import { describe, expect, it, vi } from "vitest";
import type { CombatEvent } from "../combat/CombatSimulation";
import { CombatEventPresenter, type CombatEventPresentationContext } from "./CombatEventPresenter";

function presenterHarness() {
  const eventFeedAdd = vi.fn();
  const emitAuthoredEffect = vi.fn();
  const flashCircle = vi.fn();
  const shakeCamera = vi.fn();
  const emitBurst = vi.fn();
  const noOp = vi.fn();
  const context = new Proxy({
    eventFeed: { add: eventFeedAdd },
    effectPool: { emitBurst },
    haptics: { playForEvent: noOp },
    synth: { play: noOp },
    emitAuthoredEffect,
    flashCircle,
    shakeCamera,
  }, {
    get(target, property) {
      if (property in target) return target[property as keyof typeof target];
      return noOp;
    },
  }) as unknown as CombatEventPresentationContext;
  return {
    presenter: new CombatEventPresenter(context),
    eventFeedAdd,
    emitAuthoredEffect,
    flashCircle,
    shakeCamera,
    emitBurst,
  };
}

describe("CombatEventPresenter supply-cache feedback", () => {
  it("announces sealed and armoured cache arrivals", () => {
    const harness = presenterHarness();
    harness.presenter.play([
      { type: "supply-chest-spawned", position: { x: 2, y: 3 }, variant: "sealed" },
      { type: "supply-chest-spawned", position: { x: 4, y: 5 }, variant: "armored" },
    ]);

    expect(harness.eventFeedAdd).toHaveBeenNthCalledWith(1, "SUPPLY CACHE DETECTED", "#68e4e8");
    expect(harness.eventFeedAdd).toHaveBeenNthCalledWith(2, "ARMOURED SUPPLY CACHE DETECTED", "#68e4e8");
    expect(harness.flashCircle).toHaveBeenCalledTimes(2);
  });

  it("renders hit, opened, and destroyed feedback with explicit reward copy", () => {
    const harness = presenterHarness();
    const events: CombatEvent[] = [
      { type: "supply-chest-hit", position: { x: 2, y: 3 }, remainingHealth: 40 },
      { type: "supply-chest-opened", position: { x: 2, y: 3 } },
      { type: "supply-chest-destroyed", position: { x: 2, y: 3 } },
    ];
    harness.presenter.play(events);

    expect(harness.emitBurst).toHaveBeenCalledWith(64, 96, 0xffd36b, 4);
    expect(harness.emitBurst).toHaveBeenCalledWith(64, 96, 0xff9b5f, 10);
    expect(harness.emitAuthoredEffect).toHaveBeenCalledWith(
      5, { x: 2, y: 3 }, 480, 0.62, 1.45, 0, "batch-c-rewards-v1",
    );
    expect(harness.eventFeedAdd).toHaveBeenCalledWith(
      "SUPPLY CACHE OPENED  /  REWARDS DEPLOYED", "#68e4e8",
    );
    expect(harness.eventFeedAdd).toHaveBeenCalledWith(
      "ARMOURED SUPPLY CACHE BREACHED  /  REWARDS DEPLOYED", "#ffd36b",
    );
    expect(harness.shakeCamera).toHaveBeenCalledWith(130, 0.005);
  });

  it("makes objective outcomes and shop transactions explicit", () => {
    const harness = presenterHarness();
    harness.presenter.play([
      { type: "escort-objective-damaged", position: { x: 1, y: 1 }, health: 24.2, maxHealth: 50 },
      { type: "collect-objective-completed", position: { x: 2, y: 2 } },
      { type: "scrap-spent", amount: 18, remaining: 42, offerId: "offer-1" },
      { type: "weapon-sold", weaponId: "bastion-service-rifle", amount: 12, total: 54 },
      {
        type: "world-interaction-completed",
        objectId: "cache-1",
        worldObjectId: "supply-chest",
        effect: "open-loot",
        position: { x: 3, y: 3 },
      },
    ]);

    expect(harness.eventFeedAdd).toHaveBeenCalledWith("ESCORT UNDER FIRE  /  25 OF 50", "#ff9b5f");
    expect(harness.eventFeedAdd).toHaveBeenCalledWith("ALL PACKAGES SECURED", "#68e4e8");
    expect(harness.eventFeedAdd).toHaveBeenCalledWith("-18 SCRAP  /  42 REMAIN", "#ffd36b");
    expect(harness.eventFeedAdd).toHaveBeenCalledWith(
      "BASTION SERVICE RIFLE SOLD  /  +12 SCRAP", "#ffd36b",
    );
    expect(harness.eventFeedAdd).toHaveBeenCalledWith(
      "SUPPLY CHEST  /  OPEN LOOT", "#68e4e8",
    );
  });

  it("renders impacts for generic and authored projectile weapons", () => {
    const harness = presenterHarness();
    harness.presenter.play([
      { type: "projectile-impact", position: { x: 2, y: 3 }, weaponId: "bastion-service-rifle" },
      { type: "projectile-impact", position: { x: 4, y: 5 }, weaponId: "marauder-ar" },
    ]);

    expect(harness.emitAuthoredEffect).toHaveBeenCalledWith(
      7, { x: 2, y: 3 }, 130, 0.5, 0.92, 0, "combat-effects-v1",
    );
    expect(harness.emitAuthoredEffect).toHaveBeenCalledWith(
      2, { x: 4, y: 5 }, 115, 0.4, 0.82, 0, "marauder-ar-effects-v1",
    );
  });
});
