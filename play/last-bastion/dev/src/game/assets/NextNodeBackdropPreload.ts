import type { ExpeditionMapData, ExpeditionNode } from "../expedition/ExpeditionMap";
import { expeditionNodeById } from "../expedition/ExpeditionMap";
import type { ImageAssetDefinition } from "./GameAssetManifest";
import { mapBackdropAssetForTheme } from "./MapAssetManifest";

/**
 * Picks one deterministic candidate for a map's next backdrop. The caller may
 * pass the focused route; otherwise the first selectable route wins. Keeping
 * this decision pure prevents a preload from changing route selection.
 */
export function likelyNextNodeBackdropAsset(
  map: ExpeditionMapData,
  currentNodeId: number,
  selectableNodeIds: readonly number[],
  focusedNodeId?: number,
): ImageAssetDefinition {
  const candidateId = focusedNodeId !== undefined && selectableNodeIds.includes(focusedNodeId)
    ? focusedNodeId
    : selectableNodeIds[0];
  const candidate = candidateId === undefined ? null : expeditionNodeById(map, candidateId);
  const current = expeditionNodeById(map, currentNodeId);
  return mapBackdropAssetForTheme(candidate?.themeId ?? current?.themeId ?? "bastion-standard");
}

export function likelyNextNode(
  map: ExpeditionMapData,
  selectableNodeIds: readonly number[],
  focusedNodeId?: number,
): ExpeditionNode | null {
  const candidateId = focusedNodeId !== undefined && selectableNodeIds.includes(focusedNodeId)
    ? focusedNodeId
    : selectableNodeIds[0];
  return candidateId === undefined ? null : expeditionNodeById(map, candidateId);
}
