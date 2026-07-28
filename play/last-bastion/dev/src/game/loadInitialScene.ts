import type Phaser from "phaser";
import type { SceneRoute } from "./SceneRoute";

export async function loadInitialScene(
  route: SceneRoute,
): Promise<Phaser.Types.Scenes.SceneType> {
  switch (route) {
    case "gallery":
      return (await import("./scenes/AssetGalleryScene")).AssetGalleryScene;
    case "summary":
      return (await import("./scenes/RunSummaryScene")).RunSummaryScene;
    case "transformation":
      return (await import("./scenes/TransformationDecisionScene")).TransformationDecisionScene;
    case "event-lab":
      return (await import("./scenes/EncounterEventScene")).EncounterEventScene;
    case "expedition-event":
      return (await import("./scenes/ExpeditionEventScene")).ExpeditionEventScene;
    case "map":
      return (await import("./scenes/ExpeditionScene")).ExpeditionScene;
    case "shell":
      return (await import("./shell/ShellScene")).ShellScene;
    case "combat":
      return (await import("./scenes/PrototypeScene")).PrototypeScene;
  }
}
