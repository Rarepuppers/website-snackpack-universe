/* Accurate, repeatable social art for the country-shape guide. */
import { writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'guides/social/guess-the-country-by-shape');
// Italy from the project's Natural Earth-derived 110m country topology,
// projected once for this composition. Geographic reference art is never AI generated.
const italy = 'M191.114,74.409L216.005,80.226L220.718,72.401L261.074,65.338L270.206,79.533L328.825,90.128L324.259,110.278L334.127,127.659L301.577,121.704L268.291,136.246L270.5,156.535L265.492,168.168L278.895,189.011L317.337,209.646L337.956,243.438L383.467,276.399L415.428,276.191L425.443,285.193L413.955,293.364L450.629,308.183L480.675,320.509L515.729,341.837L520,349.523L512.341,364.134L489.659,345.022L454.017,338.305L436.932,364.757L466.388,379.922L461.528,401.319L444.443,403.742L422.645,438.781L405.56,441.966L405.707,429.433L414.102,407.482L422.94,398.757L407.033,375.075L394.514,354.439L377.576,349.315L365.499,331.657L339.135,324.248L321.461,307.768L291.12,305.136L259.159,286.648L221.749,260.057L193.912,236.514L181.246,196.005L160.921,191.296L127.634,177.793L108.782,183.333L85.069,202.306L68.131,205.284L72.844,187.557L50.604,182.363L40,150.718L54.287,138.254L42.209,122.881L43.829,111.317L61.504,120.042L81.24,118.103L104.216,104.254L111.286,110.763L130.727,109.447L139.564,92.898L169.905,98.091L187.874,91.167ZM367.855,432.341L398.932,428.809L384.204,461.009L390.242,473.681L381.7,494.662L350.328,479.29L329.561,474.858L272.562,454.084L278.159,433.033L326.026,436.773ZM120.27,319.609L140.743,306.937L165.192,335.951L159.448,390.101L140.89,387.47L124.247,401.111L108.782,390.309L107.162,340.936L97.736,317.531Z';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs>
  <radialGradient id="bg" cx="32%" cy="35%" r="85%"><stop stop-color="#18325d"/><stop offset="1" stop-color="#070b16"/></radialGradient>
  <linearGradient id="land" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffd66b"/><stop offset="1" stop-color="#78d9ff"/></linearGradient>
  <filter id="glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="12" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="1200" height="630" fill="url(#bg)"/>
<g opacity=".16" fill="none" stroke="#8ebce9"><circle cx="285" cy="315" r="235"/><ellipse cx="285" cy="315" rx="100" ry="235"/><path d="M50 315h470M75 210h420M75 420h420"/></g>
<path d="${italy}" transform="translate(45 48) scale(.9)" fill="url(#land)" stroke="#f8f1df" stroke-width="4" stroke-linejoin="round" filter="url(#glow)"/>
<g font-family="Segoe UI,Arial,sans-serif"><text x="630" y="175" fill="#5fd0ff" font-size="26" font-weight="700" letter-spacing="3">ATLAS QUEST</text>
<text x="630" y="260" fill="#faf5e8" font-size="62" font-weight="800">Which country</text><text x="630" y="330" fill="#faf5e8" font-size="62" font-weight="800">is this?</text>
<text x="630" y="405" fill="#c7d3e7" font-size="28">Guess by shape. Learn the map.</text>
<rect x="630" y="462" width="390" height="64" rx="16" fill="#5fd0ff" fill-opacity=".1" stroke="#5fd0ff" stroke-opacity=".55"/>
<text x="825" y="503" text-anchor="middle" fill="#5fd0ff" font-size="25" font-weight="700">Play free · No account</text></g></svg>`;

const executablePath = [
  process.env.ATLAS_QA_BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean).find(existsSync);
const browser = await chromium.launch({ headless: true, executablePath });
try {
  const page = await browser.newPage();
  const encoded = await page.evaluate(async ({ source }) => {
    const image = new Image();
    const loaded = new Promise((ok, fail) => { image.onload = ok; image.onerror = fail; });
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
    await loaded;
    const canvas = document.createElement('canvas');
    canvas.width = 1200; canvas.height = 630;
    canvas.getContext('2d').drawImage(image, 0, 0);
    return {
      png: canvas.toDataURL('image/png').split(',')[1],
      webp: canvas.toDataURL('image/webp', 0.9).split(',')[1],
    };
  }, { source: svg });
  await Promise.all([
    writeFile(`${output}.png`, Buffer.from(encoded.png, 'base64')),
    writeFile(`${output}.webp`, Buffer.from(encoded.webp, 'base64')),
  ]);
} finally {
  await browser.close();
}
console.log('Composed accurate 1200x630 Atlas guide social card (PNG + WebP)');
