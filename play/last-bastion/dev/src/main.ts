import Phaser from "phaser";
import "./style.css";
import { gameConfig } from "./game/config";
import { planDisplayScale, setUiDeviceScale } from "./game/rendering/DisplayScaling";

/**
 * Snaps the canvas to whole physical pixels. `?size=` previews the planned
 * game-size setting (100–300); it is a review hook until the settings screen
 * owns the preference.
 */
function applyDisplayScale(target: Phaser.Game): void {
  const requested = Number(new URLSearchParams(window.location.search).get("size"));
  const sizeMultiplier = Number.isFinite(requested) && requested >= 50 && requested <= 300
    ? requested / 100
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

const game = new Phaser.Game({
  ...gameConfig,
  callbacks: {
    // postBoot runs after Phaser's own scale setup, so our zoom survives.
    postBoot: (booted) => {
      const apply = () => applyDisplayScale(booted);
      apply();
      // Some browsers report a provisional devicePixelRatio during boot and
      // settle on the real one a frame or two later, so re-apply once things
      // have stabilised rather than trusting the boot-time value.
      requestAnimationFrame(apply);
      window.setTimeout(apply, 250);
      trackDevicePixelRatio(apply);
      window.addEventListener("resize", apply);
    },
  },
});

export default game;
