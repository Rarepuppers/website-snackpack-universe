import type { RunSummary } from "./RunSummary";

export function formatRunDetails(summary: RunSummary): string {
  const provenance = summary.provenance;
  const setup = [
    "LAST BASTION RUN DETAILS",
    `Mode: ${runModeName(summary)}`,
    ...(summary.threatTier === null ? [] : [`Threat tier: ${summary.threatTier}`]),
    `Outcome: ${summary.outcome}`,
    `Hero: ${summary.heroId}`,
    `Perk: ${summary.perkId ?? "none"}`,
    `Combat seed: ${provenance.combatSeed ?? "unknown"}`,
    ...(provenance.mapSeed === null ? [] : [`Map seed: ${provenance.mapSeed}`]),
    `Build: ${provenance.buildVersion}`,
    `Simulation: ${provenance.simulationVersion || "unknown"}`,
    `Settings: speed ${provenance.settings.gameSpeedMultiplier}x${provenance.gameSpeedModified ? " (changed during run)" : ""}, auto-fire ${provenance.settings.autoFireEnabled ? "on" : "off"}, aim assist ${Math.round(provenance.settings.aimAssistStrength * 100)}%`,
    `Duration: ${formatDuration(summary.elapsedSeconds)}`,
    summary.mode === "expedition"
      ? `Progress: ${summary.nodesCleared} nodes, map column ${summary.waveReached}, level ${summary.level}`
      : `Progress: wave ${summary.waveReached}, level ${summary.level}`,
    `Result: ${summary.kills} enemies, ${format(summary.damageTaken)} damage taken, ${format(summary.scrapBanked)} scrap banked, ${summary.commandMarksEarned} Command Marks`,
    `Dominant incoming threat: ${leadingDamageSource(summary) ?? "none recorded"}`,
    `Strongest weapon: ${leadingWeapon(summary) ?? "none recorded"}`,
  ];
  if (summary.outcome === "defeat") {
    setup.push(`What ended this run: ${summary.defeatCause ?? leadingDamageSource(summary) ?? "unknown"}`);
  }
  return setup.join("\n");
}

function leadingWeapon(summary: RunSummary): string | null {
  const weapon = Object.entries(summary.damageByWeapon)
    .filter(([, damage]) => damage > 0)
    .sort((left, right) => right[1] - left[1])[0]?.[0];
  return weapon ? weapon.replaceAll("-", " ") : null;
}

function formatDuration(seconds: number): string {
  const wholeSeconds = Math.floor(seconds);
  return `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, "0")}`;
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
  // A Daily retry stays a Daily (and scores) only while it is still that day;
  // the seed is the same either way.
  if (summary.dailyKey) params.set("daily", summary.dailyKey);
  return `?${params.toString()}`;
}

export function runModeName(summary: Pick<RunSummary, "mode" | "dailyKey">): string {
  if (summary.mode === "expedition") return "Expedition";
  return summary.dailyKey ? `Daily Drop (${summary.dailyKey})` : "Quick Drop";
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
