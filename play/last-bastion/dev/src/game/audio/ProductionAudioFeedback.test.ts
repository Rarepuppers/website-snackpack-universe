import { describe, expect, it } from "vitest";
import { PRODUCTION_AUDIO_FEEDBACK_ASSETS, productionFeedbackAssetIdsForCue } from "./ProductionAudioFeedback";

describe("ProductionAudioFeedback", () => {
  it("covers the 24 encoded S2/S3 stems with unique batch-qualified ids", () => {
    expect(PRODUCTION_AUDIO_FEEDBACK_ASSETS).toHaveLength(24);
    expect(new Set(PRODUCTION_AUDIO_FEEDBACK_ASSETS.map((asset) => asset.id)).size).toBe(24);
    expect(new Set(PRODUCTION_AUDIO_FEEDBACK_ASSETS.map((asset) => asset.fileStem)).size).toBe(24);
  });

  it("keeps production feedback optional behind the existing cue ids", () => {
    expect(productionFeedbackAssetIdsForCue("player-hit")).toEqual(["s3:player-damage-a", "s3:player-damage-b"]);
    expect(productionFeedbackAssetIdsForCue("unknown-cue")).toEqual([]);
  });
});
