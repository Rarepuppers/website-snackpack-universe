import type { RunSummary } from "./RunSummary";

export function formatRunDetails(summary: RunSummary): string {
  const provenance = summary.provenance;
  const setup = [
    "LAST BASTION RUN DETAILS",
    `Mode: ${summary.mode === "expedition" ? "Expedition" : "Quick Drop"}`,
    `Outcome: ${summary.outcome}`,
    `Hero: ${summary.heroId}`,
    `Perk: ${summary.perkId ?? "none"}`,
    `Combat seed: ${provenance.combatSeed ?? "unknown"}`,
    ...(provenance.mapSeed === null ? [] : [`Map seed: ${provenance.mapSeed}`]),
    `Build: ${provenance.buildVersion}`,
    `Simulation: ${provenance.simulationVersion || "unknown"}`,
    `Settings: speed ${provenance.settings.gameSpeedMultiplier}x${provenance.gameSpeedModified ? " (changed during run)" : ""}, auto-fire ${provenance.settings.autoFireEnabled ? "on" : "off"}, aim assist ${Math.round(provenance.settings.aimAssistStrength * 100)}%`,
    `Progress: ${summary.nodesCleared} nodes, wave/column ${summary.waveReached}, level ${summary.level}`,
    `Result: ${summary.kills} enemies, ${format(summary.damageTaken)} damage taken, ${format(summary.scrapBanked)} scrap banked`,
  ];
  if (summary.outcome === "defeat") {
    setup.push(`What ended this run: ${summary.defeatCause ?? leadingDamageSource(summary) ?? "unknown"}`);
  }
  return setup.join("\n");
}

export function quickDropRetryUrl(summary: RunSummary): string | null {
  if (summary.mode !== "quick-drop" || summary.provenance.combatSeed === null) return null;
  const params = new URLSearchParams({
    screen: "game",
    hero: summary.heroId,
    seed: String(summary.provenance.combatSeed),
    gamespeed: String(summary.provenance.settings.gameSpeedMultiplier),
    autofire: summary.provenance.settings.autoFireEnabled ? "1" : "0",
    aimassist: String(summary.provenance.settings.aimAssistStrength),
  });
  if (summary.perkId) params.set("perk", summary.perkId);
  return `?${params.toString()}`;
}

function leadingDamageSource(summary: RunSummary): string | null {
  const source = Object.entries(summary.damageTakenBySource)
    .filter(([, damage]) => damage > 0)
    .sort((left, right) => right[1] - left[1])[0]?.[0];
  return source ? source.replaceAll("-", " ") : null;
}

function format(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}
