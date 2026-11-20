import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { canStartWinter, finishWinter, migrateWinterSave, seasonProgress } from "../winter.mjs";

const SH = createRequire(import.meta.url)("../engine.js");
const date = (text) => new Date(text+"T12:00:00");
const winter = (text) => SH.activeEvent(date(text));

assert.equal(winter("2026-11-30"), null);
assert.equal(winter("2026-12-01").openDoors, 1);
assert.equal(winter("2026-12-07").openDoors, 7);
assert.equal(winter("2027-01-06").key, "winter2026");
assert.equal(winter("2027-01-06").openDoors, 24);
assert.equal(winter("2027-01-07"), null);
assert.equal(winter("2027-12-01").key, "winter2027");
assert.deepEqual([SH.REGIONS.length,SH.DELIVERIES.length,SH.TRUCKS.length,SH.CARGO_TYPES.length],[6,48,6,8]);

const save = {v:1,coins:45,trucks:["pickup"],stars:{"bakery-1":3},mastery:{}};
migrateWinterSave(save);
assert.equal(save.v,2);
assert.deepEqual(save.stars,{"bakery-1":3});
const key="winter2026", progress=seasonProgress(save,key), door3=SH.WINTER_DOORS[2];
assert.equal(canStartWinter(winter("2026-12-02"),progress,door3,false),false);
assert.equal(canStartWinter(winter("2026-12-03"),progress,door3,false),true);
assert.equal(canStartWinter(null,progress,door3,false),false);
assert.equal(canStartWinter(winter("2026-12-23"),progress,SH.WINTER_ROUTES[7],true),false);
assert.equal(canStartWinter(winter("2026-12-24"),progress,SH.WINTER_ROUTES[7],true),true);
const result={status:"done",kept:3,stars:3,earned:8,truck:"pickup",metres:150};
assert.deepEqual(finishWinter(save,key,door3,result,()=>1).rewards,["Jingle Sleigh"]);
assert.deepEqual(finishWinter(save,key,door3,result,()=>1).rewards,[]);
assert.equal(save.trucks.filter((id)=>id==="sleigh").length,1);
assert.deepEqual(seasonProgress(save,"winter2027").doors,{});
assert.deepEqual(save.stars,{"bakery-1":3});
assert.equal(canStartWinter(winter("2026-12-24"),progress,SH.WINTER_ORDERS[4],true),false);

function run(delivery,truck="pickup",upgrades={},target=5.4,drive=SH.botInput) {
  const game=SH.createGame({delivery,truck,upgrades});
  const hits=[];
  for (let ticks=0; game.status==="driving" && ticks<26000; ticks++) {
    game.step(drive(game,target));
    hits.push(...game.events.filter((e)=>e.type==="dropoff"||e.type==="missedDrop"));
    game.events.length=0;
  }
  const report=SH.report(game);
  assert.equal(hits.filter((e)=>e.type==="dropoff").length,report.kept);
  assert.equal(game.cargo.filter((cargo)=>cargo.delivered).length,report.kept);
  assert.ok(Number.isFinite(report.earned));
  return {report,game,hits};
}

const mode=process.argv[2] || "winter";
for (const [name,list,truck,modeName] of [
  ["North Pole",SH.WINTER_ROUTES,"pickup","northpole"],["Advent",SH.WINTER_DOORS,"pickup","advent"],
  ["Workshop",SH.WINTER_ORDERS,"pickup","workshop"],["Sleigh",SH.WINTER_ROUTES,"sleigh","sleigh"]
]) {
  if (mode!=="winter" && mode!==modeName) continue;
  for (const d of list) {
    const {report,game}=name==="Workshop" ? run(d,d.truck||truck,{straps:2,tank:2},4.4) : run(d,d.truck||truck);
    assert.equal(report.status,"done",d.id+" as "+(d.truck||truck));
    assert.ok(report.kept>0,d.id);
    if(d.pickup) assert.equal(game.pickupState,"loaded",d.id);
    if(name==="Workshop") assert.ok(report.stars>=2,d.id);
  }
  console.log(name,list.length,"runs complete");
}
const eve=run(SH.WINTER_DOORS[23],"pickup",{straps:5,tank:2},4.6).report;
assert.equal(eve.kept,12);
assert.equal(eve.stars,3);

// A skipped porch gets no credit even if the truck brings the load to the depot.
const skipped=run(SH.WINTER_ROUTES[0],"pickup",{},6,(g,target)=>{
  const original=g.nextDrop;
  g.nextDrop=()=>null;
  try { return SH.botInput(g,target); } finally { g.nextDrop=original; }
}).report;
assert.equal(skipped.reason,"porches");
assert.equal(skipped.kept,0);
assert.equal(skipped.stars,0);
console.log("Calendar, migration, single rewards, Christmas Eve gold-star goal and missed porches pass");
