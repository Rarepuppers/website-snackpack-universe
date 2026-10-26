import { createServer } from '../../dev/node_modules/vite/dist/node/index.js';
import { fileURLToPath } from 'node:url';
const server=await createServer({root:fileURLToPath(new URL('../../dev/',import.meta.url)),configFile:false,server:{middlewareMode:true,hmr:false,watch:null},appType:'custom',logLevel:'error'});
try {
 const {CombatSimulation}=await server.ssrLoadModule('/src/game/combat/CombatSimulation.ts');
 const {expeditionBuildFromCombatSnapshot}=await server.ssrLoadModule('/src/game/expedition/ExpeditionBuildSnapshot.ts');
 const sim=new CombatSimulation({scenario:'weapon-gate',seed:61061});
 const before=sim.snapshot();
 const choice=before.pendingDecision.options.find(o=>o.id.startsWith('place:inventory:'));
 if(!choice) throw new Error('No production stash choice');
 const accepted=sim.chooseOption(choice.id);
 const after=sim.snapshot(),build=expeditionBuildFromCombatSnapshot(after);
 const resumed=new CombatSimulation({startingBuild:build,seed:61061,autoStartWaves:false}).snapshot();
 console.log(JSON.stringify({seed:61061,choice,accepted,stashBefore:before.weaponInventory.stash,stashAfter:after.weaponInventory.stash,serializedBuildKeys:Object.keys(build),carriedWeapons:build.weapons,stashNextEncounter:resumed.weaponInventory.stash},null,2));
}finally{await server.close();}
