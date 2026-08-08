import type { DisplayPresentationPlan, DisplayRect } from "./DisplayPresentation";
import { BASE_WIDTH } from "./DisplayScaling";

export type HudFurnitureId = "radar" | "status-tray" | "weapon-ring";
export type HudFurnitureOrientation = "horizontal" | "vertical";

export interface HudFurniturePlacement {
  readonly rect: DisplayRect;
  readonly orientation: HudFurnitureOrientation;
  readonly panel: "left" | "top" | "right" | "bottom";
}

export interface ExpandedFrameHudLayout {
  readonly complete: boolean;
  readonly placements: Readonly<Partial<Record<HudFurnitureId, HudFurniturePlacement>>>;
  readonly unplaced: readonly HudFurnitureId[];
}

export interface ExpandedFrameHudLayoutInput {
  readonly uiScale: 0.8 | 1 | 1.2;
  readonly radarSize: 0.75 | 1 | 1.25;
}

const ALL_FURNITURE: readonly HudFurnitureId[] = ["radar", "status-tray", "weapon-ring"];

/**
 * Plans frame-panel furniture in CSS pixels. Side panels use vertical trays;
 * horizontal bands retain rows. A partial result is intentional: it proves
 * when an authored frame cannot honestly advertise complete HUD relocation.
 */
export function planExpandedFrameHudLayout(
  plan: DisplayPresentationPlan,
  input: ExpandedFrameHudLayoutInput,
): ExpandedFrameHudLayout {
  if (plan.mode !== "expanded-frame") return incomplete({});

  const windowWidth = plan.worldRect.width + plan.frameInsets.left + plan.frameInsets.right;
  const windowHeight = plan.worldRect.height + plan.frameInsets.top + plan.frameInsets.bottom;
  const scale = plan.worldRect.width / BASE_WIDTH * input.uiScale;
  const margin = Math.max(4, 4 * scale);
  const radarDiameter = 48 * input.radarSize * scale;
  const statusHorizontal = { width: 254 * scale, height: 34 * scale };
  const statusVertical = { width: 34 * scale, height: 254 * scale };
  const weaponHorizontal = { width: 258 * scale, height: 54 * scale };
  const weaponVertical = { width: 54 * scale, height: 258 * scale };
  const placements: Partial<Record<HudFurnitureId, HudFurniturePlacement>> = {};

  const sidePanelsFit = plan.frameInsets.left >= statusVertical.width + margin * 2
    && plan.frameInsets.right >= Math.max(radarDiameter, weaponVertical.width) + margin * 2
    && windowHeight >= radarDiameter + weaponVertical.height + margin * 3;
  if (sidePanelsFit) {
    placements["status-tray"] = {
      panel: "left",
      orientation: "vertical",
      rect: centredInPanel(0, 0, plan.frameInsets.left, windowHeight, statusVertical.width, statusVertical.height),
    };
    placements.radar = {
      panel: "right",
      orientation: "vertical",
      rect: {
        x: windowWidth - plan.frameInsets.right + (plan.frameInsets.right - radarDiameter) / 2,
        y: margin,
        width: radarDiameter,
        height: radarDiameter,
      },
    };
    placements["weapon-ring"] = {
      panel: "right",
      orientation: "vertical",
      rect: {
        x: windowWidth - plan.frameInsets.right + (plan.frameInsets.right - weaponVertical.width) / 2,
        y: windowHeight - margin - weaponVertical.height,
        width: weaponVertical.width,
        height: weaponVertical.height,
      },
    };
    return complete(placements);
  }

  const topCanFit = plan.frameInsets.top >= Math.max(statusHorizontal.height, radarDiameter) + margin * 2
    && windowWidth >= statusHorizontal.width + radarDiameter + margin * 3;
  if (topCanFit) {
    placements["status-tray"] = {
      panel: "top",
      orientation: "horizontal",
      rect: {
        x: margin,
        y: (plan.frameInsets.top - statusHorizontal.height) / 2,
        ...statusHorizontal,
      },
    };
    placements.radar = {
      panel: "top",
      orientation: "horizontal",
      rect: {
        x: windowWidth - margin - radarDiameter,
        y: (plan.frameInsets.top - radarDiameter) / 2,
        width: radarDiameter,
        height: radarDiameter,
      },
    };
  }
  if (plan.frameInsets.bottom >= weaponHorizontal.height + margin * 2) {
    placements["weapon-ring"] = {
      panel: "bottom",
      orientation: "horizontal",
      rect: {
        x: (windowWidth - weaponHorizontal.width) / 2,
        y: windowHeight - plan.frameInsets.bottom + (plan.frameInsets.bottom - weaponHorizontal.height) / 2,
        ...weaponHorizontal,
      },
    };
  }
  return Object.keys(placements).length === ALL_FURNITURE.length
    ? complete(placements)
    : incomplete(placements);
}

function centredInPanel(
  x: number,
  y: number,
  panelWidth: number,
  panelHeight: number,
  width: number,
  height: number,
): DisplayRect {
  return { x: x + (panelWidth - width) / 2, y: y + (panelHeight - height) / 2, width, height };
}

function complete(
  placements: Partial<Record<HudFurnitureId, HudFurniturePlacement>>,
): ExpandedFrameHudLayout {
  return { complete: true, placements, unplaced: [] };
}

function incomplete(
  placements: Partial<Record<HudFurnitureId, HudFurniturePlacement>>,
): ExpandedFrameHudLayout {
  return {
    complete: false,
    placements,
    unplaced: ALL_FURNITURE.filter((id) => !placements[id]),
  };
}
