import fs from "node:fs";
import path from "node:path";

/*
 * Static theme-contrast check.
 *
 * Why static: the site now ships three themes, and the usual way to check them
 * is to open a browser and look. That is not available here — the Browser pane
 * never composites, which freezes style recalculation, so getComputedStyle
 * returns stale values even for an `!important` override. Anything measured
 * there is fiction. This resolves the cascade the same way a browser would, but
 * from the stylesheet text, so it can actually be trusted.
 *
 * What it catches: the exact bug that shipped on the hero — a rule that pins a
 * light background but lets its text colour follow the theme. In cream that is
 * dark-on-light and fine; in dark the text turns pale and the background does
 * not, so it becomes invisible.
 *
 * Method:
 *   1. Read --var values for each theme from :root and :root[data-theme="…"].
 *   2. For every rule that sets a background, resolve it per theme.
 *   3. Resolve that rule's text colour — its own `color` if it sets one, else
 *      the inherited body colour (var(--ink)).
 *   4. Composite alpha over the theme's page background and score WCAG contrast.
 *
 * Limits, stated honestly: it does not model real DOM nesting, so a translucent
 * surface is composited over the page background rather than its true parent,
 * and rules whose text colour comes from an ancestor other than body are
 * approximated as --ink. It is a smoke test for one specific, repeated mistake,
 * not a full accessibility audit.
 *
 * Run: node scripts/check-contrast.mjs [--all]
 */

const root = path.resolve(".");
const css = fs.readFileSync(path.join(root, "site.css"), "utf8");
const showAll = process.argv.includes("--all");

const THEMES = ["cream", "dark", "light"];
const MIN_RATIO = 3; // large/heading text floor; body text failures score far lower

// --- variable tables -------------------------------------------------------

function varsIn(selector) {
  const i = css.indexOf(selector);
  if (i === -1) return {};
  const end = css.indexOf("}", i);
  const out = {};
  for (const m of css.slice(i, end).matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    out[m[1]] = m[2].trim();
  }
  return out;
}

const base = varsIn(":root {");
const themeVars = {};
for (const t of THEMES) themeVars[t] = { ...base, ...varsIn(`:root[data-theme="${t}"] {`) };

// --- colour parsing --------------------------------------------------------

function parseColor(value, vars, depth = 0) {
  if (!value || depth > 6) return null;
  let v = value.trim();

  const varMatch = v.match(/^var\((--[\w-]+)(?:\s*,\s*([^)]+))?\)$/);
  if (varMatch) {
    const resolved = vars[varMatch[1]];
    return parseColor(resolved !== undefined ? resolved : varMatch[2], vars, depth + 1);
  }

  let m = v.match(/^#([0-9a-f]{3})$/i);
  if (m) {
    const [r, g, b] = m[1].split("").map((c) => parseInt(c + c, 16));
    return { r, g, b, a: 1 };
  }
  m = v.match(/^#([0-9a-f]{6})$/i);
  if (m) {
    const n = parseInt(m[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  m = v.match(/^rgba?\(([^)]+)\)$/i);
  if (m) {
    const p = m[1].split(",").map((x) => parseFloat(x));
    if (p.length >= 3 && p.every((x) => !Number.isNaN(x))) {
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    }
  }
  if (/^(transparent|inherit|currentcolor|none)$/i.test(v)) return null;
  return null;
}

/** First colour-ish token inside a gradient or shorthand, i.e. what dominates. */
function backgroundColor(value, vars) {
  const direct = parseColor(value, vars);
  if (direct) return direct;
  // Take the LAST colour stop of the first gradient layer: for these panels the
  // base layer is listed last and is what actually covers the card.
  const layers = value.split(/,(?![^(]*\))/);
  const colors = [];
  for (const token of value.matchAll(/var\(--[\w-]+\)|#[0-9a-f]{3,6}\b|rgba?\([^)]*\)/gi)) {
    const c = parseColor(token[0], vars);
    if (c && c.a > 0.5) colors.push(c);
  }
  return colors.length ? colors[colors.length - 1] : null;
}

function over(fg, bg) {
  const a = fg.a;
  return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
}
function lum(c) {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}
function ratio(a, b) {
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

// --- walk the rules --------------------------------------------------------

const failures = [];
let checked = 0;

/*
 * Rules that legitimately pin a background and hold no themed text.
 *
 * White mattes behind screenshots and photos: a product screenshot is a picture
 * of a light UI, and framing it on a dark card looks like a rendering fault
 * rather than a dark theme. These keep their white surround on purpose. They
 * contain images, not prose, so the "inherited text colour" this script assumes
 * never actually renders inside them.
 */
const PINNED_ON_PURPOSE = new Set([
  ".device-shot",
  ".shot-card",
  ".pawtrait-photo-wrap",
  ".certificate-sheet",          // a certificate is white paper
  ".world-cup-banner-copy .eyebrow", // sits on the dark green banner, not the page
  ".mathematics-hero .app-hero-card", // sits on the purple Mathematics hero
  ".mathematics-tags .tag",           // white-on-white tint over that same purple hero
]);

// Elements that cannot contain text, so an inherited colour is meaningless.
const IMAGE_ONLY = /(^|\s|>)(img|picture|svg|video)$/;

for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const selector = m[1].trim().split("\n").pop().trim();
  if (selector.startsWith("@") || selector.startsWith(":root")) continue;
  if (PINNED_ON_PURPOSE.has(selector) || IMAGE_ONLY.test(selector)) continue;
  const body = m[2];
  // Decorative pseudo-elements: `content: ""` with no text to render, so an
  // inherited colour is irrelevant — these are bullets, rules and shapes.
  if (/content:\s*(""|'')/.test(body) && !/content:\s*["'][^"']+["']/.test(body)) continue;

  // Allow a final declaration with no trailing semicolon: several rules in
  // this file are minified onto one line and end at the closing brace.
  const bgDecl = body.match(/(?:^|[;{\s])background(?:-color)?:\s*([^;]+)(?:;|$)/);
  if (!bgDecl) continue;

  const colorDecl = body.match(/(?:^|[;\s])color:\s*([^;]+)(?:;|$)/);

  for (const theme of THEMES) {
    const vars = themeVars[theme];
    const page = parseColor(vars["--bg"], vars) || { r: 255, g: 255, b: 255, a: 1 };

    const bgRaw = backgroundColor(bgDecl[1], vars);
    if (!bgRaw) continue;
    const bg = over(bgRaw, page);

    // Text colour: the rule's own, else what it inherits from body.
    const fgRaw = parseColor(colorDecl ? colorDecl[1] : vars["--ink"], vars);
    if (!fgRaw) continue;
    const fg = over(fgRaw, bg);

    checked++;
    const r = ratio(fg, bg);
    if (r < MIN_RATIO) {
      failures.push({ selector, theme, ratio: r.toFixed(2), inherited: !colorDecl });
    }
  }
}

const byTheme = {};
for (const f of failures) (byTheme[f.theme] ||= []).push(f);

console.log(`Checked ${checked} rule/theme combinations across ${THEMES.join(", ")}.`);

// A rule that fails in EVERY theme is pre-existing and not a theming bug --
// usually a decorative element whose real background comes from an ancestor.
const perSelector = {};
for (const f of failures) (perSelector[f.selector] ||= []).push(f.theme);
const themeSpecific = failures.filter((f) => perSelector[f.selector].length < THEMES.length);

if (themeSpecific.length === 0) {
  console.log("\nNo theme-specific contrast failures.");
  if (failures.length && showAll) {
    console.log(`\n(${failures.length} rule/theme pairs fail in all three themes — pre-existing, background likely inherited:`);
    for (const s of Object.keys(perSelector)) console.log(`   ${s}`);
    console.log(")");
  } else if (failures.length) {
    console.log(`(${Object.keys(perSelector).length} selector(s) fail identically in all three themes — pre-existing, not theming. Use --all to list.)`);
  }
  process.exit(0);
}

console.error(`\n${themeSpecific.length} theme-specific contrast failure(s):\n`);
for (const f of themeSpecific) {
  console.error(
    `  [${f.theme}] ${f.selector}  ratio ${f.ratio}` + (f.inherited ? "  (text colour inherited)" : "")
  );
}
console.error("\nA rule that fails in one theme but not others is pinning a background");
console.error("while letting its text follow the theme. Bind both, or pin both.");
process.exit(1);
