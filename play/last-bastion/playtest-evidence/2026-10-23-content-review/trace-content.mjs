import { createServer } from '../../dev/node_modules/vite/dist/node/index.js';
import { fileURLToPath } from 'node:url';
const server = await createServer({ root: fileURLToPath(new URL('../../dev/', import.meta.url)), configFile: false,
  server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom', logLevel: 'error' });
try {
  const load = path => server.ssrLoadModule('/src/game/' + path + '.ts');
  const mapApi = await load('expedition/ExpeditionMap');
  const encounters = await load('expedition/ExpeditionEncounter');
  const events = await load('expedition/EncounterEventCatalog');
  const objects = await load('arena/WorldObjectCatalog');
  const placement = await load('arena/WorldObjectPlacement');
  const { BASTION_ARENA } = await load('arena/ArenaDefinition');
  const shops = await load('content/shopProfiles');
  const { ITEM_CATALOG } = await load('content/itemCatalog');
  const counts = { nodes: {}, themes: {}, events: {}, miniBosses: {}, bosses: {}, objectives: {}, shops: {} };
  const add = (bucket, id) => { if (id) bucket[id] = (bucket[id] ?? 0) + 1; };
  let reachableNodes = 0, excludedNodes = 0;
  for (let seed = 1; seed <= 100; seed++) {
    const map = mapApi.generateExpeditionMap(seed), reached = new Set(), pending = [map.startNodeId];
    while (pending.length) {
      const id = pending.pop();
      if (reached.has(id)) continue;
      reached.add(id);
      const node = map.nodes.find(node => node.id === id);
      if (!node) throw new Error('Missing reachable node');
      pending.push(...node.next);
      const encounter = encounters.expeditionEncounterForNode(seed, node, 0);
      add(counts.nodes, node.type); add(counts.themes, node.themeId); add(counts.events, encounter.eventId);
      add(counts.miniBosses, encounter.miniBossKind); add(counts.bosses, encounter.bossKind);
      add(counts.objectives, encounter.objectiveMode); add(counts.shops, encounter.shopProfileId);
    }
    reachableNodes += reached.size; excludedNodes += map.nodes.length - reached.size;
  }
  const placed = {}, byTheme = {};
  for (const theme of objects.ARENA_THEME_FAMILY_IDS) {
    const ids = new Set();
    for (let seed = 1; seed <= 100; seed++) {
      const room = placement.placeWorldObjects({ theme, seed, widthMetres: BASTION_ARENA.widthMetres, heightMetres: BASTION_ARENA.heightMetres });
      for (const object of [...room.obstacles, ...room.hazards]) {
        if (object.worldObjectId) { add(placed, object.worldObjectId); ids.add(object.worldObjectId); }
      }
    }
    byTheme[theme] = [...ids].sort();
  }
  const held = objects.WORLD_OBJECT_CATALOG.filter(object => !objects.isInteractionImplemented(object));
  const missingEvents = new Set(events.ENCOUNTER_EVENT_CATALOG.filter(event => !counts.events[event.id]).map(event => event.id));
  const additionalEventWitnesses = [];
  for (let seed = 101; seed <= 10000 && missingEvents.size; seed++) {
    for (const node of mapApi.generateExpeditionMap(seed).nodes) {
      const encounter = encounters.expeditionEncounterForNode(seed, node, 0);
      if (missingEvents.delete(encounter.eventId)) additionalEventWitnesses.push({ seed, nodeId: node.id, eventId: encounter.eventId });
    }
  }
  console.log(JSON.stringify({ scope: '100 seeds; reachable map nodes at threat 0; placement uses production baseline dimensions per registered theme; eligibility is not player exposure',
    reachableNodes, excludedNodes, counts, additionalEventWitnesses,
    eventsNotSampled: events.ENCOUNTER_EVENT_CATALOG.filter(event => !counts.events[event.id]).map(event => ({ id: event.id, minColumn: event.minColumn })),
    worldObjects: { placed, byTheme, held: held.map(object => ({ id: object.id, effect: object.interaction.effect.type })),
      eligibleNotSampled: objects.WORLD_OBJECT_CATALOG.filter(object => objects.isInteractionImplemented(object) && !placed[object.id]).map(object => object.id) },
    shopItemEligibility: Object.fromEntries(Object.entries(shops.SHOP_PROFILES).map(([id, profile]) => [id, ITEM_CATALOG.filter(item => shops.profileStocksItem(profile, item)).map(item => item.id)])) }, null, 2));
} finally { await server.close(); }
