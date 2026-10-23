// Run from dev/. Existing production boss harness; no gameplay changes.
import { createServer } from '../../dev/node_modules/vite/dist/node/index.js';
import { fileURLToPath } from 'node:url';
const server = await createServer({ root: fileURLToPath(new URL('../../dev/', import.meta.url)),
  configFile: false, server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom', logLevel: 'error' });
try {
  const audit = await server.ssrLoadModule('/src/game/telemetry/RegionalBossBalanceAudit.ts');
  const rows = audit.runRegionalBossBalanceAudit(5);
  console.log(JSON.stringify({ seeds: 5, maxSeconds: 180, scope: 'Existing synthetic level-10 boss-entry fixture; not campaign balance',
    rows, summary: audit.summarizeRegionalBossBalanceAudit(rows) }, null, 2));
} finally { await server.close(); }
