// Run from website repository root. Loads production modules; does not edit game data.
import { createServer } from '../../dev/node_modules/vite/dist/node/index.js';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const server = await createServer({root:'play/last-bastion/dev',server:{middlewareMode:true}});
try {
  const load = path => server.ssrLoadModule('/src/game/' + path + '.ts');
  const events = await load('expedition/EncounterEventCatalog');
  const affinity = await load('transformations/TransformationAffinity');
  const choices = await load('transformations/TransformationChoiceCatalog');
  const relics = await load('content/relicCatalog');
  const { CONTENT_INVENTORY } = await load('content/ContentInventory');
  const base = {health:10,shield:0,level:1,experience:0,scrap:100,weapons:[{weaponId:'bastion-service-rifle',tier:1}],upgrades:[]};
  let transformation = affinity.createTransformationAffinityState();
  const path = choices.transformationChoiceById('heavy-gunner').pathId;
  for(let i=0;i<3;i++) { const r=affinity.applyTransformationChoice(transformation,path,'heavy-gunner'); assert(r.ok); transformation=r.state; }
  const run = (eventId,choiceId,build) => {
    const event=events.encounterEventById(eventId), choice=event.choices.find(c=>c.id===choiceId);
    assert(events.eligibleEvents(event.kind,5).includes(event));
    const result=events.resolveEventChoice(build,10,choice,0);
    return {eventId,choiceId,available:events.isChoiceAvailable(build,10,choice),before:build,after:events.applyEventResolutionToBuild(result),text:result.resultText};
  };
  const locked=run('event-cybernetics-bay','feed-weapon',{...base,transformation});
  assert(locked.available); assert.equal(locked.after.weapons.length,0); assert.deepEqual(locked.after.transformation,transformation);
  const capped=run('event-super-soldier-serum','take-the-dose',{...base,transformation});
  assert(capped.available); assert.equal(capped.after.scrap,70); assert.equal(capped.after.health,7); assert.deepEqual(capped.after.transformation,transformation);
  const free=run('event-designed-arrival','offer-relic',base);
  assert(free.available); assert.equal(free.after.transformation.paths[0].affinity,1); assert.equal(free.after.relicIds.length,0);
  const duplicate=run('shrine-duplication-vat','duplicate-relic',{...base,relicIds:['rel-blast-baffle']});
  duplicate.beforeModifiers=relics.resolveRelicModifiers(duplicate.before.relicIds,null);
  duplicate.afterModifiers=relics.resolveRelicModifiers(duplicate.after.relicIds,null);
  assert.deepEqual(duplicate.beforeModifiers,duplicate.afterModifiers);
  const hunt=run('event-old-sergeant','buy-hunt-mark',base);
  assert(hunt.available); assert.equal(hunt.after.scrap,70);
  assert(!('guaranteedEliteRelicNextNode' in hunt.after));
  const echo=run('shrine-echoes','echo-upgrade',{...base,upgrades:[{upgradeId:'rapid-cycling',level:1}]});
  assert(echo.available); assert.deepEqual(echo.after.upgrades,echo.before.upgrades);
  const {generateExpeditionMap}=await load('expedition/ExpeditionMap');
  const {expeditionEncounterForNode}=await load('expedition/ExpeditionEncounter');
  const finales=[1,42,117,61061,99999].map(seed=>{const map=generateExpeditionMap(seed);return expeditionEncounterForNode(seed,map.nodes.find(n=>n.id===map.bossNodeId),0);});
  const witnesses={locked,capped,free,duplicate,hunt,echo};
  const routes={};
  for(let seed=1;seed<=1000 && Object.keys(routes).length<6;seed++) {
    const map=generateExpeditionMap(seed);
    const paths=new Map([[map.startNodeId,[map.startNodeId]]]);
    for(const node of [...map.nodes].sort((a,b)=>a.column-b.column)) {
      const p=paths.get(node.id); if(!p) continue;
      for(const next of node.next) if(!paths.has(next)) paths.set(next,[...p,next]);
      if(node.type!=='event' && node.type!=='shrine') continue;
      const encounter=expeditionEncounterForNode(seed,node,0);
      for(const [key,w] of Object.entries(witnesses)) if(w.eventId===encounter.eventId && !routes[key]) {
        routes[key]={mapSeed:seed,currentNodeId:node.id,clearedNodeIds:p.slice(0,-1),choiceIndex:events.encounterEventById(w.eventId).choices.findIndex(c=>c.id===w.choiceId)};
      }
    }
  }
  assert.equal(Object.keys(routes).length,6);
  const report={baseline:'69914456',inventory:CONTENT_INVENTORY,eventCount:events.ENCOUNTER_EVENT_CATALOG.length,finales,routes,witnesses};
  writeFileSync('play/last-bastion/playtest-evidence/2026-11-02-audit/production-witnesses.json',JSON.stringify(report,null,2)+'\n');
  console.log('Six production-function witnesses reproduced; inventory and five finales captured. No renderer or human acceptance claimed.');
} finally { await server.close(); }
