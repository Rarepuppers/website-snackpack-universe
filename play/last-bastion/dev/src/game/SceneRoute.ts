export type SceneRoute =
  | "gallery"
  | "summary"
  | "transformation"
  | "event-lab"
  | "expedition-event"
  | "map"
  | "shell"
  | "combat";

const REVIEW_PARAMETERS = [
  "scenario", "stress", "loadout", "weapons", "kit", "buff", "art",
  "helmet", "theme", "debug", "timers", "damage", "size", "shake", "sound",
  "flash", "autofire", "uiscale", "radarsize", "threats", "palette",
  "vibration", "effects", "rims", "expedition", "transformation", "hero",
] as const;

export function resolveSceneRoute(params: URLSearchParams): SceneRoute {
  if (params.get("mode") === "gallery") return "gallery";
  switch (params.get("screen")) {
    case "summary": return "summary";
    case "transformation-lab": return "transformation";
    case "event-lab": return "event-lab";
    case "event": return "expedition-event";
    case "map": return "map";
    case "game": return "combat";
    case "title": return "shell";
  }
  return REVIEW_PARAMETERS.some((key) => params.has(key)) ? "combat" : "shell";
}
