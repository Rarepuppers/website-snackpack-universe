// Builds a printable PDF for each book under read/.
//
// Zero dependencies on purpose: this repo has no package.json and no build
// step, and a static site shouldn't grow a node_modules tree for one script.
// A PDF can embed a JPEG verbatim as a /DCTDecode stream, so no image library
// or headless browser is needed -- the source JPEGs are copied in byte-for-byte.
//
// Resolution: the art is 1200px (interiors) and 1024px (covers) wide, which
// lands at ~164 and ~140 dpi across the printable width. That is already the
// right ballpark for home printing, so nothing is rescaled or re-encoded.
//
// Paper: pages are A4, but content is confined to a box that also fits US
// Letter (186 x 255 mm -- the intersection of both sheets less a 12 mm margin),
// so one file prints without clipping on either.
//
// Usage (from the website repo root):
//   node scripts/build-read-pdfs.mjs                 # dry run, all books
//   node scripts/build-read-pdfs.mjs --write
//   node scripts/build-read-pdfs.mjs --slug=ten-red-hens --write

import fs from "node:fs";
import path from "node:path";

const READ = path.resolve("read");
const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const only = (args.find((a) => a.startsWith("--slug=")) || "").split("=")[1];

const MM = 2.834645669;           // pt per mm
const PAGE_W = 595.28, PAGE_H = 841.89;   // A4
const BOX_W = 186 * MM, BOX_H = 255 * MM; // fits A4 and Letter both

// ── Minimal JPEG header parse: dimensions + component count ───────────────
function jpegInfo(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error("not a JPEG");
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    // SOF0/1/2/9/10 carry the frame header. SOF4(0xC4)/0xC8/0xCC do not.
    if ([0xc0, 0xc1, 0xc2, 0xc9, 0xca].includes(marker)) {
      return {
        height: buf.readUInt16BE(i + 5),
        width: buf.readUInt16BE(i + 7),
        components: buf[i + 9],
      };
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  throw new Error("no SOF marker found");
}

const colorSpace = (n) => (n === 1 ? "/DeviceGray" : n === 4 ? "/DeviceCMYK" : "/DeviceRGB");

// PDF text string. Plain ASCII goes in a literal string; anything else (the
// book titles use curly apostrophes) must be UTF-16BE with a BOM, or readers
// render mojibake in the document title.
function pdfString(s) {
  if (/^[\x20-\x7E]*$/.test(s)) return `(${s.replace(/([\\()])/g, "\\$1")})`;
  const hex = Buffer.from("﻿" + s, "utf16le").swap16().toString("hex");
  return `<${hex}>`;
}

// ── PDF assembly ─────────────────────────────────────────────────────────
function buildPdf(images, title) {
  const chunks = [];
  const offsets = [0];
  let len = 0;
  const push = (b) => { const buf = Buffer.isBuffer(b) ? b : Buffer.from(b, "latin1"); chunks.push(buf); len += buf.length; };
  const obj = (n, body) => { offsets[n] = len; push(`${n} 0 obj\n`); push(body); push("\nendobj\n"); };

  const n = images.length;
  // 1 catalog, 2 pages, then per image: page, contents, xobject
  const pageIds = images.map((_, i) => 3 + i * 3);
  const total = 2 + n * 3;

  push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${n} >>`);

  images.forEach((img, i) => {
    const pageId = pageIds[i], contentId = pageId + 1, imgId = pageId + 2;
    // Fit inside the shared safe box, preserving aspect, centred on the sheet.
    const scale = Math.min(BOX_W / img.width, BOX_H / img.height);
    const w = img.width * scale, h = img.height * scale;
    const x = (PAGE_W - w) / 2, y = (PAGE_H - h) / 2;
    const content = `q\n${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im0 Do\nQ\n`;

    obj(pageId,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
      `/Resources << /XObject << /Im0 ${imgId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    obj(contentId, `<< /Length ${content.length} >>\nstream\n${content}endstream`);

    offsets[imgId] = len;
    push(`${imgId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} ` +
         `/ColorSpace ${colorSpace(img.components)} /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.data.length} >>\nstream\n`);
    push(img.data);
    push("\nendstream\nendobj\n");
  });

  const xref = len;
  push(`xref\n0 ${total + 1}\n0000000000 65535 f \n`);
  for (let i = 1; i <= total; i++) push(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
  push(`trailer\n<< /Size ${total + 1} /Root 1 0 R /Info << /Title ${pdfString(title)} /Producer (SnackPack Studios) >> >>\n` +
       `startxref\n${xref}\n%%EOF\n`);

  return Buffer.concat(chunks);
}

// ── Page order comes from the HTML, never from filename sort ──────────────
// `page-10` sorts before `page-2` lexically, which is exactly the bug this
// avoids: the rendered page is the source of truth for reading order.
function pagesFor(slug) {
  const html = fs.readFileSync(path.join(READ, slug, "index.html"), "utf8");
  const files = [];
  const cover = html.match(/<img src="\.\/pages\/(cover\.jpg)"/);
  if (cover) files.push(cover[1]);
  for (const m of html.matchAll(/<img src="\.\/pages\/([^"]+\.jpg)"[^>]*loading="lazy"/g)) files.push(m[1]);
  const title = (html.match(/<title>([^|<]+)/) || [, slug])[1].trim();
  return { files, title };
}

const slugs = fs.readdirSync(READ)
  .filter((d) => fs.existsSync(path.join(READ, d, "index.html")) && d !== "index.html")
  .filter((d) => !only || d === only);

console.log(WRITE ? "Building PDFs:" : "Dry run (pass --write to emit):");
let built = 0;
for (const slug of slugs) {
  const { files, title } = pagesFor(slug);
  if (files.length < 2) { console.log(`  SKIP ${slug}: found ${files.length} page(s)`); continue; }

  const images = files.map((f) => {
    const p = path.join(READ, slug, "pages", f);
    const data = fs.readFileSync(p);
    return { ...jpegInfo(data), data };
  });

  const pdf = buildPdf(images, title);
  const out = path.join(READ, slug, `${slug}.pdf`);
  const mb = (pdf.length / 1048576).toFixed(2);
  console.log(`  ${slug}: ${images.length} pages, ${mb} MB${pdf.length > 3 * 1048576 ? "  <- OVER 3 MB budget" : ""}`);
  if (WRITE) fs.writeFileSync(out, pdf);
  built++;
}
console.log(`\n${built} PDF(s) ${WRITE ? "written" : "ready"}.`);
