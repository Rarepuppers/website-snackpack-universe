import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
let server;
try {
  const options = {}, seen = new Set(), args = process.argv.slice(2);
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i], value = args[i + 1];
    if (!['--seeds', '--policies', '--seconds'].includes(key) || seen.has(key) || !value || value.startsWith('--')) throw new Error('Usage: balance:audit [--seeds 1..1000] [--policies cautious,greedy-damage,sustain-first,random] [--seconds positive-seconds-up-to-3600]');
    seen.add(key);
    if (key === '--seeds') options.seeds = Number(value);
    if (key === '--seconds') options.maxSeconds = Number(value);
    if (key === '--policies') options.policies = value.split(',');
  }
  server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false,
    server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom', logLevel: 'error' });
  const audit = await server.ssrLoadModule('/src/game/telemetry/BalanceAudit.ts');
  const normalized = audit.normalizeBalanceAuditOptions(options);
  const rows = audit.runBalanceAudit(normalized);
  console.log(JSON.stringify({ schemaVersion: 2, mode: 'default-wave-simulation', options: normalized, stepSeconds: 0.05,
    limitations: ['Synthetic fixed movement/choice heuristics, not human or earned expedition evidence.',
      'Final level is not boss-entry level. Purchases, dodges, XP spawned/lost are unmeasured (null).',
      'Censored runs are unfinished; completedWinRate excludes them and may be biased.',
      'Random policy is deterministic movement, not random reward selection.',
      'Damage includes shield damage; finalScrap is secured scrap, not a full economy assessment.'],
    rows, summary: audit.summarizeBalanceAudit(rows) }, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally { await server?.close(); }
