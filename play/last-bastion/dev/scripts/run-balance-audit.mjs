const args = process.argv.slice(2);
const valueAfter = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] ?? fallback : fallback; };
const seeds = Number(valueAfter('--seeds', 100));
const policies = valueAfter('--policies', 'cautious,greedy-damage,sustain-first,random').split(',').filter(Boolean);
console.log(JSON.stringify({ command: 'balance:audit', seeds, policies, note: 'Use the BalanceAudit module from the application test/runtime harness for seeded rows.' }, null, 2));
