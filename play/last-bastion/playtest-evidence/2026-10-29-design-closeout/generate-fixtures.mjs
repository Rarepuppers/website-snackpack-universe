import { createServer } from '../../dev/node_modules/vite/dist/node/index.js';
import {writeFileSync,mkdirSync} from 'node:fs';
const out='play/last-bastion/playtest-evidence/2026-10-29-design-closeout';mkdirSync(out,{recursive:true});
const server=await createServer({root:'play/last-bastion/dev',server:{middlewareMode:true}});
try{
const {generateExpeditionMap}=await server.ssrLoadModule('/src/game/expedition/ExpeditionMap.ts');
const {expeditionEncounterForNode,bossKindForTheme}=await server.ssrLoadModule('/src/game/expedition/ExpeditionEncounter.ts');
const {WORLD_OBJECT_CATALOG,isInteractionImplemented}=await server.ssrLoadModule('/src/game/arena/WorldObjectCatalog.ts');
const fixtures=[1,42,117,61061,99999].map(seed=>{const m=generateExpeditionMap(seed),n=m.nodes.find(n=>n.id===m.bossNodeId);return {seed,map:m,finale:expeditionEncounterForNode(seed,n,0)};});
writeFileSync(out+'/legacy-map-fixtures.json',JSON.stringify(fixtures,null,2)+'\n');
const report={finales:fixtures.map(x=>({seed:x.seed,node:x.finale.nodeId,theme:x.finale.themeId,boss:x.finale.bossKind})),regionalSelectors:['alien-hive','toxic-bloom','machine-foundry','science-wing','bastion-standard'].map(theme=>({theme,boss:bossKindForTheme(theme)})),excluded:WORLD_OBJECT_CATALOG.filter(x=>!isInteractionImplemented(x))};
writeFileSync(out+'/consumer-evidence.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await server.close();}
