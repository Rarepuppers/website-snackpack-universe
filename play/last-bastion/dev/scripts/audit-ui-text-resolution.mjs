import fs from "node:fs";
import path from "node:path";

const releaseSceneFiles = [
  "src/game/shell/ShellScene.ts",
  "src/game/scenes/ExpeditionScene.ts",
  "src/game/scenes/RunSummaryScene.ts",
  "src/game/scenes/EncounterEventScene.ts",
  "src/game/scenes/ExpeditionEventScene.ts",
  "src/game/scenes/TransformationDecisionScene.ts",
];

const failures = [];
for (const relativePath of releaseSceneFiles) {
  const source = fs.readFileSync(path.resolve(relativePath), "utf8");
  const textCreationCount = source.match(/this\.add\.text\(/g)?.length ?? 0;
  const resolutionCount = source.match(/\.setResolution\(uiTextResolution\(\)\)/g)?.length ?? 0;
  if (textCreationCount === 0) failures.push(`${relativePath}: no text creation found`);
  if (resolutionCount !== textCreationCount) {
    failures.push(`${relativePath}: ${textCreationCount} text creation site(s), ${resolutionCount} resolution policy call(s)`);
  }
}

if (failures.length > 0) {
  console.error("UI text-resolution audit failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`UI text-resolution audit passed for ${releaseSceneFiles.length} release scenes.`);
