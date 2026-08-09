import { describe, expect, it } from "vitest";
import { PRODUCTION_AUDIO_FEEDBACK_ASSETS, productionFeedbackAssetIdsForCue } from "./ProductionAudioFeedback";

describe("ProductionAudioFeedback", () => {
  it("covers the 33 encoded S2/S3/C3 stems with unique batch-qualified ids", () => {
    expect(PRODUCTION_AUDIO_FEEDBACK_ASSETS).toHaveLength(33);
    expect(new Set(PRODUCTION_AUDIO_FEEDBACK_ASSETS.map((asset) => asset.id)).size).toBe(33);
    expect(new Set(PRODUCTION_AUDIO_FEEDBACK_ASSETS.map((asset) => asset.fileStem)).size).toBe(33);
  });

  it("selects Scout reconnaissance-suit cues only for Scout", () => {
    expect(productionFeedbackAssetIdsForCue("player-hit", "scout")).toEqual(["c3-scout:scout-damage"]);
    expect(productionFeedbackAssetIdsForCue("dodge", "scout")).toEqual(["c3-scout:scout-evade"]);
    expect(productionFeedbackAssetIdsForCue("hero-death", "scout")).toEqual(["c3-scout:scout-death"]);
    expect(productionFeedbackAssetIdsForCue("dodge", "marine")).toEqual([]);
  });

  it("selects Tactician command-suit cues only for Tactician", () => {
    expect(productionFeedbackAssetIdsForCue("player-hit", "tactician")).toEqual(["c3-tactician:tactician-damage"]);
    expect(productionFeedbackAssetIdsForCue("dodge", "tactician")).toEqual(["c3-tactician:tactician-evade"]);
    expect(productionFeedbackAssetIdsForCue("hero-death", "tactician")).toEqual(["c3-tactician:tactician-death"]);
    expect(productionFeedbackAssetIdsForCue("dodge", "marine")).toEqual([]);
  });

  it("keeps production feedback optional behind the existing cue ids", () => {
    expect(productionFeedbackAssetIdsForCue("player-hit")).toEqual(["s3:player-damage-a", "s3:player-damage-b"]);
    expect(productionFeedbackAssetIdsForCue("unknown-cue")).toEqual([]);
  });

  it("selects Assault suit cues only for Assault", () => {
    expect(productionFeedbackAssetIdsForCue("player-hit", "assault")).toEqual(["c3-assault:assault-damage"]);
    expect(productionFeedbackAssetIdsForCue("dodge", "assault")).toEqual(["c3-assault:assault-evade"]);
    expect(productionFeedbackAssetIdsForCue("hero-death", "assault")).toEqual(["c3-assault:assault-death"]);
    expect(productionFeedbackAssetIdsForCue("dodge", "marine")).toEqual([]);
    expect(productionFeedbackAssetIdsForCue("hero-death", "medic")).toEqual([]);
  });
});
