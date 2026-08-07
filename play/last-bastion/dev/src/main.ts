import Phaser from "phaser";
import "./style.css";
import { createGameConfig } from "./game/config";
import { planDisplayScale, registerDisplayScaleReapply, setUiDeviceScale } from "./game/rendering/DisplayScaling";
import { LocalSaveStore } from "./game/save/LocalSaveStore";
import { resolveSceneRoute } from "./game/SceneRoute";
import { loadInitialScene } from "./game/loadInitialScene";

/**
 * Snaps the canvas to whole physical pixels. `?size=` previews the planned
 * game-size setting (100–300); it is a review hook until the settings screen
 * owns the preference.
 */
function applyDisplayScale(target: Phaser.Game): void {
  const requested = Number(new URLSearchParams(window.location.search).get("size"));
  const savedSize = new LocalSaveStore(window.localStorage).load().settings.displaySizePercent;
  const sizePercent = Number.isFinite(requested) && requested >= 50 && requested <= 300 ? requested : savedSize;
  const sizeMultiplier = Number.isFinite(sizePercent) && sizePercent >= 50 && sizePercent <= 300
    ? sizePercent / 100
    : 1;
  const plan = planDisplayScale(
    window.innerWidth,
    window.innerHeight,
    window.devicePixelRatio,
    sizeMultiplier,
  );
  setUiDeviceScale(plan.deviceScale);
  target.scale.setZoom(plan.zoom);
}

/**
 * devicePixelRatio is not stable: it can settle after boot and it changes when
 * the window moves to a monitor with different scaling. Without this the
 * canvas keeps a zoom computed for the wrong ratio and lands on fractional
 * physical pixels, which is exactly what softens the picture.
 */
function trackDevicePixelRatio(onChange: () => void): void {
  window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener(
    "change",
    () => {
      onChange();
      trackDevicePixelRatio(onChange);
    },
    { once: true },
  );
}

async function boot(): Promise<Phaser.Game> {
  const route = resolveSceneRoute(new URLSearchParams(window.location.search));
  const initialScene = await loadInitialScene(route);
  return new Phaser.Game({
    ...createGameConfig(initialScene),
    callbacks: {
      // postBoot runs after Phaser's own scale setup, so our zoom survives.
      postBoot: (booted) => {
        const apply = () => applyDisplayScale(booted);
        apply();
        requestAnimationFrame(apply);
        window.setTimeout(apply, 250);
        trackDevicePixelRatio(apply);
        window.addEventListener("resize", apply);
        // Settings screens change displaySizePercent; without this the canvas
        // would not resize until the next window resize or reload.
        registerDisplayScaleReapply(apply);
      },
    },
  });
}

const game = boot();
export default game;
