import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertAchievementId,
  assertCloudContents,
  assertCloudPath,
  CLOUD_SAVE_SLOT,
  MAX_CLOUD_SAVE_BYTES,
} from "./BridgeValidation.js";

describe("desktop bridge validation", () => {
  it("accepts only current achievement ids", () => {
    assert.doesNotThrow(() => assertAchievementId("first-drop"));
    assert.throws(() => assertAchievementId("future-id"), /achievement id/);
    assert.throws(() => assertAchievementId(1), /achievement id/);
  });

  it("confines cloud I/O to the versioned save slot", () => {
    assert.doesNotThrow(() => assertCloudPath(CLOUD_SAVE_SLOT));
    assert.throws(() => assertCloudPath("../save.json"), /cloud path/);
  });

  it("bounds serialized cloud payloads", () => {
    assert.doesNotThrow(() => assertCloudContents("{}"));
    assert.doesNotThrow(() => assertCloudContents("x".repeat(MAX_CLOUD_SAVE_BYTES)));
    assert.throws(() => assertCloudContents("x".repeat(MAX_CLOUD_SAVE_BYTES + 1)), /cloud contents/);
    assert.throws(() => assertCloudContents({}), /cloud contents/);
  });
});
