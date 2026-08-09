import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const simulationPath = fileURLToPath(new URL("../src/game/combat/CombatSimulation.ts", import.meta.url));
const source = readFileSync(simulationPath, "utf8");
const starts = [...source.matchAll(/^  private (update[A-Z][A-Za-z0-9]*)\(enemy[^\n]*$/gm)];
const failures = [];

for (const match of starts) {
  const name = match[1];
  const start = match.index ?? 0;
  const end = source.indexOf("\n  private ", start + match[0].length);
  const body = source.slice(start, end > start ? end : source.length);
  if (/\bswitch\s*\(/.test(body)) failures.push(`${name}: contains an inline switch state machine`);
  if (!/\b(?:step|resolve|arm|apply)[A-Z][A-Za-z0-9]*\(/.test(body)) {
    failures.push(`${name}: has no explicit behavior/lifecycle delegate`);
  }
}

for (const obsolete of ["updateBastionEaterLegacy", "beginBastionEaterAction", "finishBastionEaterAction"]) {
  if (source.includes(obsolete)) failures.push(`obsolete inline helper remains: ${obsolete}`);
}

if (starts.length < 30) failures.push(`expected at least 30 enemy adapters, found ${starts.length}`);
if (failures.length > 0) {
  console.error("Combat boundary audit failed:\n" + failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`PASS ${starts.length} enemy adapters delegate policy with no inline switch state machines.`);
console.log("First shared-state seam: ordinary projectile volley geometry; runtime mutation and world effects remain simulation-owned.");
