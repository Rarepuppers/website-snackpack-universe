import { describe, expect, it } from "vitest";
import { createIronhideAdaptiveArmour, recordIronhideDamageType } from "./IronhideAdaptiveArmour";

describe("Ironhide adaptive armour", () => {
  it("hardens on repeated pairs but resets the pair when damage types alternate", () => {
    let state = createIronhideAdaptiveArmour();
    ({ state } = recordIronhideDamageType(state, "physical"));
    let result = recordIronhideDamageType(state, "physical");
    expect(result.armourGained).toBe(1);
    ({ state } = result);
    ({ state } = recordIronhideDamageType(state, "fire"));
    result = recordIronhideDamageType(state, "shock");
    expect(result.armourGained).toBe(0);
  });

  it("caps adaptive armour", () => {
    let state = createIronhideAdaptiveArmour();
    for (let hit = 0; hit < 12; hit += 1) ({ state } = recordIronhideDamageType(state, "toxic"));
    expect(state.bonusArmour).toBe(4);
  });
});
