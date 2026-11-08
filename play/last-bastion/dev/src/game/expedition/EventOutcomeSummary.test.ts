import { describe, expect, it } from "vitest";
import { eventOutcomeSummary } from "./EventOutcomeSummary";
import { applyEventResolutionToBuild, encounterEventById, resolveEventChoice, type EventChoice } from "./EncounterEventCatalog";
import { resolveRelicModifiers } from "../content/relicCatalog";
import type { ExpeditionBuildSnapshot } from "./ExpeditionRun";

const build = (): ExpeditionBuildSnapshot => ({health:10,shield:0,level:1,experience:0,scrap:100,weapons:[{weaponId:"bastion-service-rifle",tier:1}],upgrades:[]});
const choice = (event: string, id: string) => encounterEventById(event)!.choices.find(row => row.id === id)!;
const resolve = (before: ExpeditionBuildSnapshot, offer: EventChoice) => resolveEventChoice(before,20,offer,0);

describe("event outcome summary", () => {
  it("shows both the lost weapon and gained affinity from a legal Cybernetics exchange", () => {
    const before=build(), result=resolve(before,choice("event-cybernetics-bay","feed-weapon"));
    const lines=eventOutcomeSummary(before,result);
    expect(lines).toContain("Bastion Service Rifle (tier 1): 1 → 0");
    expect(lines).toContain("Cybernetic Ascension affinity: 0 → 1");
    expect(lines.some(line=>line.includes("rank: 0 → 1"))).toBe(true);
    expect(before.weapons).toHaveLength(1);
  });
  it("reports a tier change as named old/new inventory counts", () => {
    const before=build();
    const lines=eventOutcomeSummary(before,resolve(before,choice("shrine-steel","forge-weapon")));
    expect(lines).toContain("Bastion Service Rifle (tier 1): 1 → 0");
    expect(lines).toContain("Bastion Service Rifle (tier 2): 0 → 1");
    expect(lines).toContain("Maximum-health bonus: 0 → -3");
  });
  it("explains a duplicate's count without inventing another combat effect", () => {
    const before={...build(),relicIds:["rel-blast-baffle"] as const};
    const offer=choice("shrine-duplication-vat","duplicate-relic");
    expect(offer.detail).toContain("Effects do not stack");
    const result=resolve(before,offer), after=applyEventResolutionToBuild(result);
    expect(eventOutcomeSummary(before,result)).toContain("Blast Baffle copies: 1 → 2");
    expect(eventOutcomeSummary(before,result).join(" ")).toContain("spare copies can be sacrificed");
    expect(resolveRelicModifiers(after.relicIds,null)).toEqual(resolveRelicModifiers(before.relicIds,null));
    const sacrifice=choice("event-designed-arrival","offer-relic");
    const one=applyEventResolutionToBuild(resolve(after,sacrifice));
    expect(one.relicIds).toEqual(["rel-blast-baffle"]);
    expect(resolveRelicModifiers(one.relicIds,null)).toEqual(resolveRelicModifiers(before.relicIds,null));
    const none=applyEventResolutionToBuild(resolve(one,sacrifice));
    expect(none.relicIds).toEqual([]);
    expect(resolveRelicModifiers(none.relicIds,null)).not.toEqual(resolveRelicModifiers(before.relicIds,null));
  });
  it("shows applied relic rewards alongside ambush routing", () => {
    const before=build(),result=resolve(before,choice("event-refugee-column","escort"));
    expect(eventOutcomeSummary(before,result).some(line=>line.includes("copies: 0 → 1"))).toBe(true);
    expect(eventOutcomeSummary(before,result)).toContain("Ambush — continue into combat.");
  });
  it("never repeats the promises of a rejected exchange", () => {
    const before=build(),result=resolve(before,choice("event-old-sergeant","buy-hunt-mark"));
    expect(eventOutcomeSummary(before,result)).toEqual([result.rejectedReason,"Nothing was spent or granted."]);
  });
  it("includes real upgrade and kit grants after they are folded into the build", () => {
    const before=build();
    const doctrine=resolve(before,choice("event-rogue-server","download"));
    expect(eventOutcomeSummary(before,doctrine).some(line=>line.endsWith("rank: 0 → 1"))).toBe(true);
    const kit=resolve(before,choice("event-blood-market","sell-blood-kit"));
    expect(eventOutcomeSummary(before,kit)).toContain("Siege Loader kits: 0 → 1");
    expect(eventOutcomeSummary(before,kit)).toContain("Health: 10 → 6");
  });
  it("does not treat added neutral save fields as a reward", () => {
    const before=build();
    expect(eventOutcomeSummary(before,resolve(before,choice("event-old-sergeant","leave")))).toEqual(["No build changes."]);
  });
});
