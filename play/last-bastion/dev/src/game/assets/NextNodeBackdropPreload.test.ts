import { describe, expect, it } from "vitest";
import { generateExpeditionMap, expeditionNodeById } from "../expedition/ExpeditionMap";
import { mapBackdropAssetForTheme } from "./MapAssetManifest";
import { likelyNextNodeBackdropAsset } from "./NextNodeBackdropPreload";

describe("likelyNextNodeBackdropAsset", () => {
  it("uses the focused route without changing route order", () => {
    const map = generateExpeditionMap(11);
    const current = expeditionNodeById(map, map.startNodeId)!;
    const routes = current.next;
    expect(routes.length).toBeGreaterThan(1);
    const focused = expeditionNodeById(map, routes[1]!)!;

    expect(likelyNextNodeBackdropAsset(map, current.id, routes, focused.id).id)
      .toBe(mapBackdropAssetForTheme(focused.themeId).id);
  });

  it("falls back to the first selectable route deterministically", () => {
    const map = generateExpeditionMap(17);
    const current = expeditionNodeById(map, map.startNodeId)!;
    const first = expeditionNodeById(map, current.next[0]!)!;
    const asset = likelyNextNodeBackdropAsset(map, current.id, current.next);
    expect(asset.id).toBe(mapBackdropAssetForTheme(first.themeId).id);
  });
});
