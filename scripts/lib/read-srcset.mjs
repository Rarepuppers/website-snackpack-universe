// Responsive WebP for /read/: which sizes exist, and the srcset/sizes to offer.
//
// Why these widths (measured 2026-10-15 in Playwright): a story picture renders
// 436 CSS px on desktop, 335 on a tablet and 364 on a phone. At the phone's
// 2.6x density that needs ~950 device px, so a lone 600 px file would never be
// chosen there. 480 serves desktop and tablet (a sixth of the pixels of a
// 1200 px original); 800 serves 2x phones; 3x phones keep the original.
//
// Variants are written by scripts/build-read-responsive.mjs as
// <name>-480w.webp / -800w / -960w beside <name>.webp. A variant is only
// made when the original is at least 15% wider, so nothing is upscaled.
// Widths come from the WebP header, so no image library is needed (CI has none).
import fs from "node:fs";
import path from "node:path";

// 960 (added after measuring): a 2.6x phone needs ~955 px for a story picture,
// so 1200 px landscape art now has a size between 800 and the original.
export const VARIANT_WIDTHS = [480, 800, 960];
export const MIN_GAIN = 1.15;

// The rendered width of each kind of picture, per breakpoint (CSS px), as
// measured on a 412 px phone (story picture 364 = 100vw - 48; hub card picture
// 168 = 50vw - 38, two cards a row since 2026-10-17), an 820 px tablet
// and a 1280 px desktop. Over-stating these makes phones skip a size they could use.
export const SIZES = {
  page: "(max-width: 760px) calc(100vw - 48px), (max-width: 1100px) 42vw, 440px",
  hero: "(max-width: 760px) min(100vw, 430px), (max-width: 1100px) 36vw, 420px",
  hub: "(max-width: 760px) calc(50vw - 38px), (max-width: 1100px) 41vw, 330px",
  home: "(max-width: 760px) 46vw, (max-width: 1100px) 31vw, 180px",
};

export const isVariant = (file) => /-\d+w\.webp$/.test(file);
export const variantPath = (webp, w) => webp.replace(/\.webp$/, `-${w}w.webp`);

// Width of a WebP from its RIFF header (lossy VP8, lossless VP8L, extended VP8X).
export function webpWidth(file) {
  const b = fs.readFileSync(file);
  if (b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WEBP") throw new Error(`${file}: not a WebP`);
  const chunk = b.toString("ascii", 12, 16);
  if (chunk === "VP8 ") return b.readUInt16LE(26) & 0x3fff;
  if (chunk === "VP8L") return 1 + (((b[22] & 0x3f) << 8) | b[21]);
  if (chunk === "VP8X") return 1 + b.readUIntLE(24, 3);
  throw new Error(`${file}: unknown WebP chunk ${chunk}`);
}

// Widths a variant should exist for, given the original's width.
export const wantedWidths = (origWidth) => VARIANT_WIDTHS.filter((w) => origWidth >= w * MIN_GAIN);

// srcset for one original, using the URL prefix the page already uses
// (e.g. "./pages/cover" or "/read/pip-sits/pages/cover"). Only lists variants
// that exist on disk, so a missing file can never become a broken candidate.
export function srcsetFor(absWebp, urlNoExt) {
  const w = webpWidth(absWebp);
  const parts = wantedWidths(w)
    .filter((vw) => fs.existsSync(variantPath(absWebp, vw)))
    .map((vw) => `${urlNoExt}-${vw}w.webp ${vw}w`);
  if (!parts.length) return null;
  parts.push(`${urlNoExt}.webp ${w}w`);
  return parts.join(", ");
}

// The full <source> tag for a picture: responsive when variants exist,
// otherwise the plain single-file form the page used before.
// No WebP at all (build-webp skips art under 120 KB) means no <source>, so the
// browser uses the <img> rather than a missing file.
export function sourceTag(absWebp, urlNoExt, sizesKey) {
  if (!fs.existsSync(absWebp)) return "";
  const set = srcsetFor(absWebp, urlNoExt);
  return set
    ? `<source srcset="${set}" sizes="${SIZES[sizesKey]}" type="image/webp">`
    : `<source srcset="${urlNoExt}.webp" type="image/webp">`;
}

export const READ_ROOT = (root) => path.join(root, "read");
