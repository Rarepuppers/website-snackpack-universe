import { describe, expect, it } from "vitest";
import { applyTransformationChoice, createTransformationAffinityState } from "../transformations/TransformationAffinity";
import { transformationChoiceById, type TransformationChoiceId } from "../transformations/TransformationChoiceCatalog";
import type { ExpeditionBuildSnapshot } from "./ExpeditionRun";
import { applyEventResolutionToBuild, encounterEventById, emptySideEffects, eventChoiceUnavailableReason, isChoiceAvailable, resolveEventChoice, type EventChoice } from "./EncounterEventCatalog";

const build = (): ExpeditionBuildSnapshot => ({health:10,shield:0,level:1,experience:0,scrap:100,weapons:[{weaponId:"bastion-service-rifle",tier:1}],upgrades:[{upgradeId:"rapid-cycling",level:1}]});
const choice = (event: string, id: string) => encounterEventById(event)!.choices.find(row => row.id === id)!;
function affinity(...ids: TransformationChoiceId[]) {
  let state = createTransformationAffinityState();
  for (const id of ids) {
    const result = applyTransformationChoice(state, transformationChoiceById(id).pathId, id);
    if (!result.ok) throw new Error(result.reason);
    state = result.state;
  }
  return state;
}
function expectRejected(before: ExpeditionBuildSnapshot, offer: EventChoice, roll = 0) {
  const frozenCopy = structuredClone(before);
  expect(isChoiceAvailable(before,10,offer)).toBe(false);
  const result = resolveEventChoice(before,10,offer,roll);
  expect(result.rejectedReason).toBe(eventChoiceUnavailableReason(before,10,offer));
  expect(result.rejectedReason).toBeTruthy();
  expect(result.effects).toEqual(emptySideEffects());
  expect(applyEventResolutionToBuild(result)).toEqual(frozenCopy);
  expect(before).toEqual(frozenCopy);
}

describe("event exchange integrity", () => {
  it.each([
    ["shrine-hunt","accept-hunt"],
    ["shrine-echoes","echo-upgrade"],
    ["shrine-devourers-dream","door-hunt"],
    ["event-old-sergeant","buy-hunt-mark"],
  ])("withholds unsupported %s/%s without changing its stable card or charging", (event,id) => {
    expectRejected(build(),choice(event,id));
    expect(isChoiceAvailable(build(),10,choice(event,"leave"))).toBe(true);
  });

  it("keeps Old Sergeant's working alternative available", () => {
    const result=resolveEventChoice(build(),10,choice("event-old-sergeant","hear-stories"),0);
    expect(result.rejectedReason).toBeUndefined();
    expect(result.build.experience).toBe(35);
    expect(result.build.scrap).toBe(100);
  });

  it("preserves a weapon when a different path is committed", () => {
    expectRejected({...build(),transformation:affinity("heavy-gunner","heavy-gunner","heavy-gunner")},choice("event-cybernetics-bay","feed-weapon"));
  });

  it("does not charge a max-rank or apex Serum grant", () => {
    for (const transformation of [
      affinity("heavy-gunner","heavy-gunner","heavy-gunner"),
      affinity("heavy-gunner","heavy-gunner","heavy-gunner","vanguard-conditioning","vanguard-conditioning","vanguard-conditioning","demolitions-doctrine"),
    ]) expectRejected({...build(),transformation},choice("event-super-soldier-serum","take-the-dose"));
  });

  it("charges a legal Serum once and rejects repeated spending at its cap", () => {
    const initial={...build(),transformation:affinity("heavy-gunner","heavy-gunner")};
    const result=resolveEventChoice(initial,10,choice("event-super-soldier-serum","take-the-dose"),0);
    expect(result.rejectedReason).toBeUndefined();
    const after=applyEventResolutionToBuild(result);
    expect(after.health).toBe(7);
    expect(after.scrap).toBe(70);
    expect(after.transformation?.paths[0]?.affinity).toBe(3);
    expectRejected(after,choice("event-super-soldier-serum","take-the-dose"));
  });

  it("requires a relic in both offer and resolver, and preserves it if the grant is locked", () => {
    const offer=choice("event-designed-arrival","offer-relic");
    expectRejected(build(),offer);
    expectRejected({...build(),relicIds:["rel-blast-baffle"],transformation:affinity("heavy-gunner","heavy-gunner","heavy-gunner")},offer);
    for (const relicIds of [["rel-blast-baffle"], ["rel-blast-baffle","rel-blast-baffle"]] as const) {
      const result=resolveEventChoice({...build(),relicIds},10,offer,0);
      expect(result.rejectedReason).toBeUndefined();
      expect(result.build.relicIds).toEqual(relicIds.slice(0,-1));
      expect(result.build.transformation?.paths[0]?.choiceIds).toEqual(["martyrs-resolve"]);
    }
  });

  it("rejects an entire multi-grant exchange before a partially legal grant spends anything", () => {
    const offer: EventChoice={id:"multi",label:"multi",outcomes:[{type:"scrap",delta:-30},{type:"grantTransformationAffinity",choiceId:"heavy-gunner",count:2}]};
    expectRejected({...build(),transformation:affinity("heavy-gunner","heavy-gunner")},offer);
  });

  it("does not filter or reroll a gamble with an unavailable branch", () => {
    const offer=choice("event-mutagen-pool","bathe");
    const before={...build(),transformation:affinity("regenerative-glands","regenerative-glands","regenerative-glands")};
    for (const roll of [0,0.5,0.99]) expectRejected(before,offer,roll);
    for (const [roll,id] of [[0,"regenerative-glands"],[0.5,"dense-tissue"],[0.99,"reactive-blood"]] as const) {
      const result=resolveEventChoice(build(),10,offer,roll);
      expect(result.build.transformation?.paths[0]?.choiceIds).toEqual([id]);
      expect(resolveEventChoice(build(),10,offer,roll)).toEqual(result);
    }
  });
});
