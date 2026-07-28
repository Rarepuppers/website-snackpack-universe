import { describe, expect, it } from "vitest";
import { FRIENDLY_PROJECTILE_HARD_CAP, FriendlyProjectileBudget } from "./FriendlyProjectileBudget";

describe("FriendlyProjectileBudget", () => {
  it("admits below the emergency cap and counts deterministic suppression by weapon", () => {
    const budget = new FriendlyProjectileBudget();
    expect(budget.admit(FRIENDLY_PROJECTILE_HARD_CAP - 1, "bastion-service-rifle")).toBe(true);
    expect(budget.admit(FRIENDLY_PROJECTILE_HARD_CAP, "bastion-service-rifle")).toBe(false);
    expect(budget.admit(FRIENDLY_PROJECTILE_HARD_CAP, "bastion-service-rifle")).toBe(false);
    expect(budget.snapshot()).toEqual({ "bastion-service-rifle": 2 });
  });
});
