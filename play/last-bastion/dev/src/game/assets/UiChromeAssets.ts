import panelFramePngUrl from "../../../../art/production-tests/ui-batch-u1/ui-panel-frame-v1-256.png";
import panelFrameWebpUrl from "../../../../art/production-tests/ui-batch-u1/ui-panel-frame-v1-256.webp";
import panelRecessedPngUrl from "../../../../art/production-tests/ui-batch-u1/ui-panel-recessed-v1-256.png";
import panelRecessedWebpUrl from "../../../../art/production-tests/ui-batch-u1/ui-panel-recessed-v1-256.webp";
import panelRaisedPngUrl from "../../../../art/production-tests/ui-batch-u1/ui-panel-raised-v1-256.png";
import panelRaisedWebpUrl from "../../../../art/production-tests/ui-batch-u1/ui-panel-raised-v1-256.webp";
import panelEmphasisPngUrl from "../../../../art/production-tests/ui-batch-u1/ui-panel-emphasis-v1-256.png";
import panelEmphasisWebpUrl from "../../../../art/production-tests/ui-batch-u1/ui-panel-emphasis-v1-256.webp";
import buttonIdlePngUrl from "../../../../art/production-tests/ui-batch-u1/ui-button-idle-v1-320x120.png";
import buttonIdleWebpUrl from "../../../../art/production-tests/ui-batch-u1/ui-button-idle-v1-320x120.webp";
import buttonHoverPngUrl from "../../../../art/production-tests/ui-batch-u1/ui-button-hover-v1-320x120.png";
import buttonHoverWebpUrl from "../../../../art/production-tests/ui-batch-u1/ui-button-hover-v1-320x120.webp";
import buttonSelectedPngUrl from "../../../../art/production-tests/ui-batch-u1/ui-button-selected-v1-320x120.png";
import buttonSelectedWebpUrl from "../../../../art/production-tests/ui-batch-u1/ui-button-selected-v1-320x120.webp";
import buttonPressedPngUrl from "../../../../art/production-tests/ui-batch-u1/ui-button-pressed-v1-320x120.png";
import buttonPressedWebpUrl from "../../../../art/production-tests/ui-batch-u1/ui-button-pressed-v1-320x120.webp";
import buttonDisabledPngUrl from "../../../../art/production-tests/ui-batch-u1/ui-button-disabled-v1-320x120.png";
import buttonDisabledWebpUrl from "../../../../art/production-tests/ui-batch-u1/ui-button-disabled-v1-320x120.webp";
import focusBracketsPngUrl from "../../../../art/production-tests/ui-batch-u1/ui-focus-brackets-v1-128.png";
import focusBracketsWebpUrl from "../../../../art/production-tests/ui-batch-u1/ui-focus-brackets-v1-128.webp";
import headerPlatePngUrl from "../../../../art/production-tests/ui-batch-u1/ui-header-plate-v1-512x96.png";
import headerPlateWebpUrl from "../../../../art/production-tests/ui-batch-u1/ui-header-plate-v1-512x96.webp";
import dividerRulePngUrl from "../../../../art/production-tests/ui-batch-u1/ui-divider-rule-v1-512x16.png";
import dividerRuleWebpUrl from "../../../../art/production-tests/ui-batch-u1/ui-divider-rule-v1-512x16.webp";
import type { GameAssetId, ImageAssetDefinition } from "./GameAssetManifest";
import { runtimeImageUrl } from "./RuntimeImageFormat";

export const UI_PANEL_SLICE = Object.freeze({ left: 48, right: 48, top: 48, bottom: 48 });
export const UI_BUTTON_SLICE = Object.freeze({ left: 48, right: 48, top: 36, bottom: 36 });
export const UI_FOCUS_SLICE = Object.freeze({ left: 32, right: 32, top: 32, bottom: 32 });

export type UiButtonState = "idle" | "hover" | "selected" | "pressed" | "disabled";

export function uiButtonAssetId(state: UiButtonState): GameAssetId {
  return `ui-button-${state}-v1`;
}

const image = (
  id: GameAssetId,
  pngUrl: string,
  webpUrl: string,
  logicalWidth: number,
  logicalHeight: number,
): ImageAssetDefinition => Object.freeze({
  kind: "image",
  id,
  url: runtimeImageUrl(pngUrl, webpUrl),
  logicalWidth,
  logicalHeight,
  pivot: Object.freeze({ x: 0.5, y: 0.5 }),
});

export const UI_CHROME_ASSETS: readonly ImageAssetDefinition[] = Object.freeze([
  image("ui-panel-frame-v1", panelFramePngUrl, panelFrameWebpUrl, 256, 256),
  image("ui-panel-recessed-v1", panelRecessedPngUrl, panelRecessedWebpUrl, 256, 256),
  image("ui-panel-raised-v1", panelRaisedPngUrl, panelRaisedWebpUrl, 256, 256),
  image("ui-panel-emphasis-v1", panelEmphasisPngUrl, panelEmphasisWebpUrl, 256, 256),
  image("ui-button-idle-v1", buttonIdlePngUrl, buttonIdleWebpUrl, 320, 120),
  image("ui-button-hover-v1", buttonHoverPngUrl, buttonHoverWebpUrl, 320, 120),
  image("ui-button-selected-v1", buttonSelectedPngUrl, buttonSelectedWebpUrl, 320, 120),
  image("ui-button-pressed-v1", buttonPressedPngUrl, buttonPressedWebpUrl, 320, 120),
  image("ui-button-disabled-v1", buttonDisabledPngUrl, buttonDisabledWebpUrl, 320, 120),
  image("ui-focus-brackets-v1", focusBracketsPngUrl, focusBracketsWebpUrl, 128, 128),
  image("ui-header-plate-v1", headerPlatePngUrl, headerPlateWebpUrl, 512, 96),
  image("ui-divider-rule-v1", dividerRulePngUrl, dividerRuleWebpUrl, 512, 16),
]);

/** Review escape hatch: `?uichrome=legacy` restores code-native rectangles. */
export function uiChromeEnabled(search = browserSearch()): boolean {
  return new URLSearchParams(search).get("uichrome") !== "legacy";
}

function browserSearch(): string {
  return typeof window === "undefined" ? "" : window.location.search;
}
