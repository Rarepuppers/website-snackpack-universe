import type { ExpeditionNodeType } from "../expedition/ExpeditionMap";

export type NodeIconKind = "crosshair" | "chevrons" | "crown" | "medical-cross" | "weapon-crate" | "shrine" | "question" | "flag" | "skull";

/** Stable shape identities; map state remains expressed by ring weight and alpha. */
export const NODE_ICON_KINDS: Readonly<Record<ExpeditionNodeType, NodeIconKind>> = Object.freeze({
  combat: "crosshair",
  elite: "chevrons",
  "mini-boss": "crown",
  "supply-depot": "medical-cross",
  "weapon-cache": "weapon-crate",
  shrine: "shrine",
  event: "question",
  liberation: "flag",
  boss: "skull",
});
