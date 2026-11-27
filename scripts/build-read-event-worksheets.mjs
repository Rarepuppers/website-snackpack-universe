// Build the A4 event worksheets and use the same local fonts as Reads.
// Usage: node scripts/build-read-event-worksheets.mjs <source-assets-dir>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = process.argv[2];
if (!output) throw new Error('Provide the target directory for the PDFs.');
const out = path.resolve(output);
fs.mkdirSync(out, { recursive: true });
const preview = path.join(out, '.event-worksheet.html');
const fonts = fs.readFileSync(path.join(root, 'assets/fonts/fonts.css'), 'utf8')
  .replace(/url\(\/assets\//g, `url(${pathToFileURL(root).href}/assets/`);

const maple = 'M46 2l8 14 11-6-2 13 14-4-3 9 11 5-7 10-27 14v9h-7v-9L17 44l-7-11 11-5-3-9 14 4-2-13 11 6z';
const oak = 'M47 3C56 3 61 11 59 17c10-5 20 0 17 8 14 0 15 12 3 17 9 5 4 12-8 13l-20 4v8h-7v-8l-22-4c-11-1-17-9-6-13C4 36 8 25 19 25c-3-7 6-13 17-8C34 10 38 3 47 3z';
const leaf = (d) => `<div class="leaf"><svg viewBox="0 0 94 68" aria-hidden="true"><path d="${d}" fill="none" stroke="#211e1a" stroke-width="1.1"/><path d="M23 39h48" stroke="#555" stroke-dasharray="1.5 2"/></svg><span>I’m thankful for …</span></div>`;
const paw = '<svg viewBox="0 0 25 22" width="18" height="16" aria-hidden="true"><ellipse cx="12.5" cy="15.5" rx="5.5" ry="4"/><circle cx="4.5" cy="9.2" r="2.8"/><circle cx="9.4" cy="4.3" r="2.8"/><circle cx="15.6" cy="4.3" r="2.8"/><circle cx="20.5" cy="9.2" r="2.8"/></svg>';
const leaves = Array.from({ length: 8 }, (_, i) => leaf(i % 2 === 0 ? maple : oak)).join('');
const slips = Array.from({ length: 20 }, (_, i) => `<div class="slip">${[0, 6, 13, 19].includes(i) ? paw : ''}</div>`).join('');
const centre = [250, 250];
const circle = (radius, angle) => centre.map((value, i) =>
  value + radius * (i === 0 ? Math.cos(angle) : Math.sin(angle)));
const along = (a, b, t) => a.map((value, i) => value + t * (b[i] - value));
const angle = i => (i / 5 - 1 / 4) * Math.PI * 2;
const tips = Array.from({ length: 5 }, (_, i) => circle(232, angle(i)));
const valleys = Array.from({ length: 5 }, (_, i) => circle(102, angle(i + 0.5)));
const coord = point => point.map(n => n.toFixed(2)).join(',');
const number = (point, label) => `<text x="${point[0]}" y="${point[1]}">${label}</text>`;
const line = (a, b) => `<path d="M${coord(a)}L${coord(b)}"/>`;
const pointCuts = tips.map((tip, i) => {
  const left = valleys[(i + 4) % 5];
  const right = valleys[i];
  const bands = [0.24, 0.47, 0.7];
  const cuts = bands.map(t => line(along(left, tip, t), along(right, tip, t))).join('');
  const numbers = [0.12, 0.355, 0.585, 0.8].map((t, j) =>
    number(along(along(left, right, 0.5), tip, t), i * 4 + j + 1)).join('');
  return line(left, right) + cuts + numbers;
}).join('');
const centreCuts = [0, 2, 4].map(i => line(circle(22, angle(i + 0.5)), valleys[i])).join('');
const centreLabels = [1.5, 3.5, 5].map((i, index) => number(circle(53, angle(i)), 21 + index)).join('');
const outline = tips.flatMap((tip, i) => [tip, valleys[i]]).map(coord).join(' ');
const star = `<svg class="piece-star" viewBox="0 0 500 465" role="img" aria-label="A cutting template with 24 numbered pieces, including a round centre">
  <polygon points="${outline}"/>${pointCuts}${centreCuts}<circle cx="250" cy="250" r="22"/>${centreLabels}${number(centre, 24)}
</svg>`;
const paperStar = 'M0 -4 1.1 -1.3 4 -1.3 1.9 .5 2.7 3.5 0 1.8 -2.7 3.5 -1.9 .5 -4 -1.3 -1.1 -1.3Z';
const parcelPapers = [
  ['Stripes', '#edf4ec', '<path d="M14 13v22m8-22v22m8-22v22m8-22v22m8-22v22" stroke="#386a49" stroke-width="3"/>'],
  ['Stars', '#28527b', [[17, 20], [31, 20], [45, 20], [24, 29], [38, 29]].map(([x, y]) =>
    `<path d="${paperStar}" fill="#f4cd70" transform="translate(${x} ${y})"/>`).join('')],
  ['Dots', '#9a454b', [[17, 20], [31, 20], [45, 20], [24, 29], [38, 29]].map(([x, y]) =>
    `<circle cx="${x}" cy="${y}" r="2.4" fill="#fff"/>`).join('')],
  ['Plain', '#dbc5a8', '<path d="M8 24h46m-23-11v22m0-22c-9-2-10-9-5-7 3 1 5 7 5 7m0 0c9-2 10-9 5-7-3 1-5 7-5 7" fill="none" stroke="#386a49" stroke-width="1.7"/>'],
];
const parcelFriends = [
  ['Professor Hooten', '<path d="M10 32V13l8 4q13-9 26 0l8-4v19q-5 10-21 10T10 32Z"/><circle cx="23" cy="26" r="5"/><circle cx="39" cy="26" r="5"/><path d="m28 32 3 4 3-4"/>'],
  ['Hen-Berry', '<path d="M13 36q-4-20 11-21c-3-8 5-10 7-4 4-7 12-3 10 5q5 4 5 10l8 3-8 5q-3 9-16 9-12 0-17-7Z"/><circle cx="39" cy="25" r="2"/>'],
  ['Pork-ulele', '<path d="M12 32 9 14q8-1 13 4 9-5 18 0 5-5 13-4l-3 18q-2 10-19 10T12 32Z"/><ellipse cx="31" cy="33" rx="8" ry="5"/><path d="M21 26h2m16 0h2m-13 7h1m4 0h1"/>'],
  ['Luckybug', '<path d="M24 18q-6-11-10-9m24 9q6-11 10-9"/><circle cx="31" cy="20" r="7"/><ellipse cx="31" cy="32" rx="14" ry="11"/><path d="M31 22v21"/><circle cx="24" cy="30" r="2"/><circle cx="38" cy="30" r="2"/><circle cx="26" cy="36" r="1.5"/><circle cx="36" cy="36" r="1.5"/>'],
];
const puzzleGrid = `<table class="parcel-grid" aria-label="Match each friend to one parcel">
  <thead><tr><td></td>${parcelPapers.map(([label, fill, design]) => `<th scope="col">
    <svg viewBox="0 0 62 48" aria-hidden="true"><rect x="8" y="13" width="46" height="22" rx="2" fill="${fill}" stroke="#211e1a"/>${design}</svg>${label}</th>`).join('')}</tr></thead>
  <tbody>${parcelFriends.map(([friend, portrait]) => `<tr><th scope="row">
    <svg viewBox="0 0 62 48" aria-hidden="true"><g fill="none" stroke="#211e1a" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${portrait}</g></svg>${friend}</th>
    <td></td><td></td><td></td><td></td></tr>`).join('')}</tbody>
</table>`;
const parcelPuzzle = `<section class="parcel-clues" aria-label="Four clues">
  <h2>Four clues</h2><ol>
    <li>Professor Hooten’s present is long.</li><li>Hen-Berry’s present is very heavy.</li>
    <li>Pork-ulele’s present jingles.</li><li>Vincent wrapped Luckybug’s present and painted a paw print on it.</li>
  </ol></section>${puzzleGrid}
  <section class="parcel-tests" aria-label="Three tests">
    <div><h2>Shape</h2><p>Stripes is long and thin. Stars and Dots are small boxes. Plain is a large box. Dots and Plain have paw prints.</p></div>
    <div><h2>Sound</h2><p>Stars and Plain jingle. Stripes and Dots are silent.</p></div>
    <div><h2>Weight</h2><p>Stars and Dots are light. Stripes is a bit heavier. Plain is the heaviest by far.</p></div>
  </section>
  <p class="parcel-answer"><strong>Answer</strong> · Professor Hooten: Stripes · Hen-Berry: Plain · Pork-ulele: Stars · Luckybug: Dots</p>`;
const worksheet = [
  ['thank-you-leaves.pdf', 'Thank-you Leaves',
    'Write a name on each leaf. Colour and cut out the leaves, then put them on the branch.',
    `<div class="leaves">${leaves}</div><svg class="branch" viewBox="0 0 650 95" aria-hidden="true"><path d="M18 74 Q220 34 423 54 Q533 55 632 12 L635 22 Q572 51 537 56 L583 75 L579 82 L516 60 Q442 68 390 62 L401 87 L390 89 L373 63 Q276 55 237 59 L185 88 L179 82 L216 61 Q108 69 20 83Z" fill="none" stroke="#211e1a" stroke-width="2"/></svg>`],
  ['jar-of-good-things.pdf', 'Jar of Good Things',
    'Colour the jar. Write or draw a good thing on a slip, cut it out and fold it along the dashed line.',
    `<svg class="jar" viewBox="0 0 190 210" aria-hidden="true"><g fill="none" stroke="#211e1a" stroke-width="2.5"><rect x="40" y="14" width="110" height="24" rx="7"/><path d="M49 38v15C49 67 20 66 20 90v83c0 18 12 24 25 24h100c13 0 25-6 25-24V90c0-24-29-23-29-37V38M40 26h110M49 52h92M37 91c0-8 8-10 13-13"/></g></svg><div class="slips">${slips}</div>`],
  ['twenty-four-piece-star.pdf', 'Twenty-Four Piece Star',
    'Cut one piece each day. The middle is yours.', star],
  ['parcel-puzzle.pdf', 'Parcel Puzzle',
    'Read the clues and use all three tests. Cross out parcels that can’t belong to each friend. Put one tick in each row and each column.', parcelPuzzle],
];

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const [file, title, directions, body] of worksheet) {
    fs.writeFileSync(preview, `<!doctype html><html lang="en-GB"><meta charset="utf-8"><title>${title}</title>
<style>${fonts}
@page { size: A4; margin: 13mm; }
* { box-sizing: border-box; }
body { font: 12pt "DM Sans", Arial, sans-serif; margin: 0; color: #211e1a; }
header { margin-bottom: 5mm; border-bottom: 1pt solid #211e1a; }
h1 { font: 700 27pt Fraunces, Georgia, serif; margin: 0; }
p { margin: 2mm 0 4mm; }
.leaves { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm 8mm; }
.leaf { position: relative; text-align: center; }
.leaf svg { display: block; width: 68mm; height: 44mm; margin: auto; }
.leaf span { position: absolute; top: 59%; left: 0; right: 0; font-size: 10pt; }
.branch { width: 100%; height: 27mm; margin-top: 6mm; }
.jar { width: 100%; height: 66mm; margin-bottom: 4mm; display: block; }
.slips { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; }
.slip { height: 26mm; border: 1pt solid; position: relative; }
.slip::before { content: ""; position: absolute; top: 50%; left: 0; right: 0; border-bottom: .75pt dashed #666; }
.slip::after { content: ""; position: absolute; top: 79%; left: 8%; right: 8%; border-bottom: .75pt dotted #444; }
.slip svg { position: absolute; top: 2mm; right: 2mm; fill: #333; }
.piece-star { display: block; width: 100%; margin: 12mm auto 0; }
.piece-star polygon, .piece-star path, .piece-star circle { fill: none; stroke: #211e1a; stroke-width: 1.5; }
.piece-star text { fill: #211e1a; font-size: 13px; text-anchor: middle; dominant-baseline: central; }
.parcel-clues, .parcel-tests, .parcel-grid { break-inside: avoid; }
.parcel-clues h2, .parcel-tests h2 { font: 700 15pt Fraunces, Georgia, serif; margin: 0 0 2mm; }
.parcel-clues ol { margin: 0 0 6mm; padding-left: 6mm; }
.parcel-clues li { margin-bottom: 1.5mm; padding-left: 2mm; }
.parcel-grid { border-collapse: collapse; table-layout: fixed; width: 100%; text-align: center; }
.parcel-grid th { font-size: 10.5pt; }
.parcel-grid thead th { padding-bottom: 2mm; }
.parcel-grid thead td { width: 47mm; }
.parcel-grid svg { display: block; width: 12mm; height: 10mm; margin: 0 auto .6mm; }
.parcel-grid tbody th { text-align: left; padding-right: 2mm; white-space: nowrap; }
.parcel-grid tbody th svg { display: inline-block; vertical-align: middle; margin: 0 .8mm 0 0; width: 9mm; }
.parcel-grid tbody td { border: 1pt solid #211e1a; height: 18mm; }
.parcel-tests { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; margin-top: 6mm; }
.parcel-tests div { border: 1pt solid #211e1a; border-radius: 2mm; padding: 3mm; }
.parcel-tests p { font-size: 10.5pt; margin: 0; }
.parcel-answer { transform: rotate(180deg); text-align: center; font-size: 9pt; margin: 35mm 0 0; }
</style><header><h1>${title}</h1><p>${directions}</p></header><main>${body}</main></html>`);
    await page.goto(pathToFileURL(preview).href);
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: path.join(out, file), preferCSSPageSize: true, printBackground: true });
  }
} finally {
  await browser.close();
  fs.rmSync(preview, { force: true });
}
