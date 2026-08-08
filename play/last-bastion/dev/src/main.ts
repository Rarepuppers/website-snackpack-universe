import Phaser from "phaser";
import "./style.css";
import { createGameConfig } from "./game/config";
import { planDisplayPresentation } from "./game/rendering/DisplayPresentation";
import { publishDisplayPresentation } from "./game/rendering/DisplayPresentationRuntime";
import { applyDisplayCalibration } from "./game/rendering/DisplayCalibrationRuntime";
import { initializePlatformAdapter } from "./game/platform/PlatformRuntime";
import { initializeCloudSaveRuntime } from "./game/platform/CloudSaveRuntime";
import { initializeAchievementRuntime } from "./game/platform/AchievementRuntime";
import type { SteamworksWindow } from "./game/platform/HostPlatform";
import { planDisplayScale, registerDisplayScaleReapply, setUiDeviceScale } from "./game/rendering/DisplayScaling";
import { createLocalSaveStore } from "./game/save/SaveStorage";
import { resolveSceneRoute } from "./game/SceneRoute";
import { loadInitialScene } from "./game/loadInitialScene";

/**
 * Snaps the canvas to whole physical pixels. `?size=` previews the planned
 * game-size setting (100–300); it is a review hook until the settings screen
 * owns the preference.
 */
function applyDisplayScale(target: Phaser.Game, useWorldPresentation: boolean): void {
  const requested = Number(new URLSearchParams(window.location.search).get("size"));
  const savedSettings = createLocalSaveStore(window).load().settings;
  applyDisplayCalibration(document, target.canvas, savedSettings);
  const savedSize = savedSettings.displaySizePercent;
  const sizePercent = Number.isFinite(requested) && requested >= 50 && requested <= 300 ? requested : savedSize;
  const sizeMultiplier = Number.isFinite(sizePercent) && sizePercent >= 50 && sizePercent <= 300
    ? sizePercent / 100
    : 1;
  if (useWorldPresentation) {
    const presentation = planDisplayPresentation({
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      sizeMultiplier,
      requestedMode: savedSettings.presentationMode,
    });
    setUiDeviceScale(presentation.renderDeviceScale);
    publishDisplayPresentation(presentation);
    // Before PrototypeScene registers its RenderTexture adapter, retain the
    // logical backing store and merely size its CSS box. The adapter receives
    // this same plan immediately after Scene.create() and installs the real
    // physical backing store without changing construction coordinates.
    if (target.scale.width === 960 && target.scale.height === 540) {
      target.scale.setZoom(presentation.worldRect.width / 960);
    }
    return;
  }
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
  const params = new URLSearchParams(window.location.search);
  const route = resolveSceneRoute(params);
  // T2.2 is the default combat presentation. Keep an explicit rollback hook
  // while the wider T2.3/T3 display work lands; non-combat scenes retain the
  // existing direct-canvas path.
  const useWorldPresentation = route === "combat" && params.get("rendertexture") !== "0";
  const initialScene = await loadInitialScene(route);
  return new Phaser.Game({
    ...createGameConfig(initialScene),
    callbacks: {
      // postBoot runs after Phaser's own scale setup, so our zoom survives.
      postBoot: (booted) => {
        const apply = () => applyDisplayScale(booted, useWorldPresentation);
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

async function start(): Promise<Phaser.Game> {
  const adapter = initializePlatformAdapter(window as unknown as SteamworksWindow);
  // Steam reconciliation completes before scenes read LocalSaveStore. Browser
  // builds skip immediately, and offline Steam failures preserve the local save.
  await initializeCloudSaveRuntime(window, adapter);
  await initializeAchievementRuntime(window, adapter, createLocalSaveStore(window).load());
  return boot();
}

const game = start();
export default game;
