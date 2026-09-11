import { describe, expect, it } from "vitest";
import type { ExpeditionNodeType } from "../expedition/ExpeditionMap";
import { NODE_ICON_KINDS } from "./NodeIconCatalog";

const TYPES = ["combat", "elite", "mini-boss", "supply-depot", "weapon-cache", "shrine", "event", "liberation", "boss"] as const satisfies readonly ExpeditionNodeType[];

describe("map node icon catalog", () => {
  it("gives every node type its own non-colour shape", () => {
    expect(Object.keys(NODE_ICON_KINDS).sort()).toEqual([...TYPES].sort());
    expect(new Set(Object.values(NODE_ICON_KINDS)).size).toBe(TYPES.length);
  });
});
