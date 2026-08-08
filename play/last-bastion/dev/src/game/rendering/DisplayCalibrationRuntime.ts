import type { GameSettings } from "../save/LocalSaveStore";
import { planDisplayCalibration } from "./DisplayCalibration";

const SVG_NS = "http://www.w3.org/2000/svg";
const FILTER_ID = "last-bastion-display-calibration";
const HOST_ID = `${FILTER_ID}-host`;

/**
 * Applies one real gamma transfer to the final composed canvas, including HUD.
 * Identity removes the SVG filter entirely so defaults carry no extra layer.
 */
export function applyDisplayCalibration(
  documentLike: Document,
  canvas: HTMLCanvasElement,
  settings: Pick<GameSettings, "brightness" | "gamma">,
): void {
  const plan = planDisplayCalibration(settings);
  canvas.dataset.displayCalibration = JSON.stringify(plan);
  const existingHost = documentLike.getElementById(HOST_ID);
  if (plan.identity) {
    canvas.style.removeProperty("filter");
    existingHost?.remove();
    return;
  }

  const host = existingHost ?? createFilterHost(documentLike);
  const filter = host.querySelector(`#${FILTER_ID}`);
  if (!filter) return;
  filter.querySelectorAll("feFuncR, feFuncG, feFuncB").forEach((channel) => {
    channel.setAttribute("amplitude", String(plan.brightness));
    channel.setAttribute("exponent", String(plan.exponent));
  });
  canvas.style.filter = `url("#${FILTER_ID}")`;
}

function createFilterHost(documentLike: Document): SVGSVGElement {
  const svg = documentLike.createElementNS(SVG_NS, "svg");
  svg.id = HOST_ID;
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.setAttribute("aria-hidden", "true");
  svg.style.position = "absolute";
  const filter = documentLike.createElementNS(SVG_NS, "filter");
  filter.id = FILTER_ID;
  filter.setAttribute("color-interpolation-filters", "sRGB");
  const transfer = documentLike.createElementNS(SVG_NS, "feComponentTransfer");
  for (const channel of ["R", "G", "B"] as const) {
    const fn = documentLike.createElementNS(SVG_NS, `feFunc${channel}`);
    fn.setAttribute("type", "gamma");
    fn.setAttribute("amplitude", "1");
    fn.setAttribute("exponent", "1");
    fn.setAttribute("offset", "0");
    transfer.appendChild(fn);
  }
  const alpha = documentLike.createElementNS(SVG_NS, "feFuncA");
  alpha.setAttribute("type", "identity");
  transfer.appendChild(alpha);
  filter.appendChild(transfer);
  svg.appendChild(filter);
  documentLike.body.appendChild(svg);
  return svg;
}
