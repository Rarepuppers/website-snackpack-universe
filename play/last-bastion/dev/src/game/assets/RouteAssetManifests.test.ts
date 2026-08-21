import { describe, expect, it } from "vitest";
import { DEBRIEF_ASSETS } from "./DebriefAssetManifest";
import { mapBackdropAssetForTheme } from "./MapAssetManifest";
import { SHELL_BASE_ASSETS, SHELL_CHARACTER_ASSETS } from "./ShellAssetManifest";

describe("route asset manifests", () => {
  it("keeps the shell base and character-select art independent", () => {
    expect(SHELL_BASE_ASSETS.map((asset) => asset.id)).toEqual([
      "bastion-logistics-map-backdrop-v1",
      "title-menu-backdrop-v1",
      "ui-panel-frame-v1",
      "ui-panel-recessed-v1",
      "ui-panel-raised-v1",
      "ui-panel-emphasis-v1",
      "ui-button-idle-v1",
      "ui-button-hover-v1",
      "ui-button-selected-v1",
      "ui-button-pressed-v1",
      "ui-button-disabled-v1",
      "ui-focus-brackets-v1",
      "ui-header-plate-v1",
      "ui-divider-rule-v1",
    ]);
    expect(SHELL_CHARACTER_ASSETS.map((asset) => asset.id)).toEqual([
      "marine-select-portrait-v1",
      "medic-select-portrait-v1",
      "assault-select-portrait-v1",
      "tactician-select-portrait-v1",
      "scout-select-portrait-v1",
      "canonical-perk-tiles-v2",
    ]);
  });

  it("keeps the debrief preload limited to visible art", () => {
    expect(DEBRIEF_ASSETS.map((asset) => asset.id)).toEqual([
      "bastion-logistics-map-backdrop-v1",
      "batch-i-weapon-tiles-v1",
      "weapon-identity-atlas-68a-v1",
      "weapon-identity-atlas-68b-v1",
      "weapon-identity-atlas-68c-v1",
      "marauder-ar-tile-v1",
      "event-horizon-tile-v1",
    ]);
  });

  it("maps expedition themes to one backdrop with a Bastion fallback", () => {
    expect(mapBackdropAssetForTheme("toxic-bloom").id).toBe("alien-hive-map-backdrop-v1");
    expect(mapBackdropAssetForTheme("arctic-relay").id).toBe("arctic-relay-map-backdrop-v1");
    expect(mapBackdropAssetForTheme("machine-foundry").id).toBe("machine-foundry-map-backdrop-v1");
    expect(mapBackdropAssetForTheme("science-wing").id).toBe("science-wing-map-backdrop-v1");
    expect(mapBackdropAssetForTheme("void-approach").id).toBe("void-approach-map-backdrop-v1");
    expect(mapBackdropAssetForTheme("unknown-theme").id).toBe("bastion-logistics-map-backdrop-v1");
  });
});
