import type Phaser from "phaser";
import type { DisplayPresentationPlan } from "./DisplayPresentation";

const presentationGeneration = new WeakMap<Phaser.Game, number>();

/**
 * Gives non-combat routes a physical-resolution backing store while retaining
 * their 960x540 logical coordinate system. Combat owns its more elaborate
 * RenderTexture presenter; shell, gallery, map, event and debrief routes only
 * need one camera scaled over the physical canvas.
 */
export function applyDirectDisplayPresentation(
  game: Phaser.Game,
  plan: DisplayPresentationPlan,
  scheduleFrame?: (callback: FrameRequestCallback) => number,
): void {
  const generation = (presentationGeneration.get(game) ?? 0) + 1;
  presentationGeneration.set(game, generation);
  game.scale.resize(plan.renderWidth, plan.renderHeight);
  game.scale.setZoom(plan.worldRect.width / plan.renderWidth);

  const applyActiveScene = (): void => {
    if (presentationGeneration.get(game) !== generation) return;
    const activeScenes = game.scene.getScenes(true);
    if (activeScenes.length === 0) {
      (scheduleFrame ?? window.requestAnimationFrame.bind(window))(applyActiveScene);
      return;
    }
    for (const scene of activeScenes) {
      scene.cameras.main
        .setSize(plan.renderWidth, plan.renderHeight)
        .setZoom(plan.renderDeviceScale)
        // Static routes author their complete scene in the top-left 960x540
        // logical rectangle. A centred zoom shifts that rectangle out of the
        // enlarged camera's worldView; origin zero preserves its coordinates.
        .setOrigin(0)
        .setRoundPixels(true);
    }
    game.canvas.dataset.directPresentationAudit = JSON.stringify({
      mode: plan.mode,
      renderWidth: plan.renderWidth,
      renderHeight: plan.renderHeight,
      renderDeviceScale: plan.renderDeviceScale,
      worldRect: plan.worldRect,
      cameras: activeScenes.map((scene) => ({
        width: scene.cameras.main.width,
        height: scene.cameras.main.height,
        zoom: scene.cameras.main.zoom,
        originX: scene.cameras.main.originX,
        originY: scene.cameras.main.originY,
        worldView: {
          x: scene.cameras.main.worldView.x,
          y: scene.cameras.main.worldView.y,
          width: scene.cameras.main.worldView.width,
          height: scene.cameras.main.worldView.height,
        },
      })),
    });
  };
  applyActiveScene();
}
