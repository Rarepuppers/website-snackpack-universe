import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const desktopRoot = resolve(import.meta.dirname, "..");

describe("SteamPipe source templates", () => {
  it("keeps credentials and unassigned Steam IDs out of source control", () => {
    const appTemplate = readFileSync(resolve(desktopRoot, "steampipe/templates/app_build.vdf.in"), "utf8");
    assert.match(appTemplate, /"AppID" "__APP_ID__"/);
    assert.match(appTemplate, /"__DEPOT_ID__" "depot_build\.vdf"/);
    assert.doesNotMatch(appTemplate, /password|SetLive/i);
  });

  it("maps the complete packaged directory and excludes debug symbols", () => {
    const depotTemplate = readFileSync(resolve(desktopRoot, "steampipe/templates/depot_build.vdf.in"), "utf8");
    assert.match(depotTemplate, /"LocalPath" "\*"/);
    assert.match(depotTemplate, /"Recursive" "1"/);
    assert.match(depotTemplate, /"FileExclusion" "\*\.pdb"/);
  });
});
