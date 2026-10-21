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

// ── Questions page (READ-PLAN C3, 2026-10-15) ─────────────────────────────
// Teachers print these books, and the PDFs used to be pictures only. The last
// page now lists each page's talk prompt (or maths question with its choices)
// and the end-of-book question, with every answer grouped at the bottom under
// a fold line, so a printed copy works as a quiz.
//
// Still zero dependencies: Helvetica is one of the PDF "standard 14" fonts
// every reader already has, so nothing is embedded. Text uses WinAnsiEncoding
// (Latin-1 plus curly quotes and dashes); the few characters outside it are
// mapped to plain equivalents below. Wrapping uses Helvetica's published
// character widths, with a small safety margin.

const HELV = (() => {
  // Helvetica advance widths (per 1000 em) for ASCII 32-126, from the AFM.
  const w = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
  const m = new Map();
  w.forEach((v, i) => m.set(String.fromCharCode(32 + i), v));
  return m;
})();
const WIN_ANSI = { "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97, "…": 0x85 };
const PLAIN = { "−": "-", "‑": "-", "→": "->", "←": "<-", " ": " ", "×": "x" };

function toAnsi(s) {
  let out = "";
  for (const ch of s) {
    const c = PLAIN[ch] ?? ch;
    for (const d of c) {
      const code = d.codePointAt(0);
      if (WIN_ANSI[d]) out += String.fromCharCode(WIN_ANSI[d]);
      else if (code < 256) out += d;
      else { out += "?"; if (!toAnsi.warned?.has(d)) { (toAnsi.warned ??= new Set()).add(d); console.warn(`  WARN: no WinAnsi glyph for U+${code.toString(16).toUpperCase()} (${d}); printed as "?"`); } }
    }
  }
  return out;
}
const pdfText = (s) => `(${toAnsi(s).replace(/([\\()])/g, "\\$1")})`;
function textWidth(s, size, bold) {
  let w = 0;
  for (const ch of toAnsi(s)) w += HELV.get(ch) ?? 556;
  return (w / 1000) * size * (bold ? 1.08 : 1) * 1.02;
}
function wrap(s, size, bold, maxW) {
  const lines = [];
  let line = "";
  for (const word of s.split(/\s+/).filter(Boolean)) {
    const trial = line ? `${line} ${word}` : word;
    if (textWidth(trial, size, bold) <= maxW || !line) line = trial;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

const ENTITIES = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ", ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’", mdash: "—", ndash: "–", middot: "·", hellip: "…", minus: "−" };
const decode = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
const strip = (h) => decode(h.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();

// Each page's prompt or maths question, and the end question, from the page
// readers see. Answers are pulled out so they can sit below the fold line.
function questionsFor(html) {
  const items = [];
  const answers = [];
  for (const m of html.matchAll(/<article class="story-page-card" id="page-(\d+)">([\s\S]*?)<\/article>/g)) {
    const n = m[1], body = m[2];
    const label = strip((body.match(/<span>([\s\S]*?)<\/span>/) || [, ""])[1]).replace(/^Page \d+ of \d+\s*·?\s*/, "");
    const math = body.match(/<p class="math-q">([\s\S]*?)<\/p>/);
    if (math) {
      const model = [...body.matchAll(/<p class="counting-(?:sequence|observation)"[^>]*>([\s\S]*?)<\/p>/g)].map(m => strip(m[1])).join(" ");
      const choices = [...body.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((c) => strip(c[1]));
      const ans = body.match(/<details class="story-answer math-answer">[\s\S]*?<p>([\s\S]*?)<\/p>/);
      items.push({ head: `Page ${n}${label ? ` · ${label}` : ""}`, text: strip(math[1]).replace(/^Try it:\s*/, ""), extra: [model, choices.length ? `Choices: ${choices.join("  ·  ")}` : ""].filter(Boolean).join(" ") });
      if (ans) answers.push(`Page ${n}: ${strip(ans[1])}`);
      continue;
    }
    const aside = body.match(/<aside>([\s\S]*?)<\/aside>/);
    if (!aside) continue;
    let text = aside[1];
    const inline = text.match(/<strong>\s*Answer:\s*([\s\S]*?)<\/strong>/i);
    if (inline) { answers.push(`Page ${n}: ${strip(inline[1])}`); text = text.replace(inline[0], ""); }
    items.push({ head: `Page ${n}`, text: strip(text) });
  }
  const fin = html.match(/<div class="shell story-finish-card">([\s\S]*?)<!-- read-next:generated -->/);
  if (fin) {
    const questions = [...fin[1].matchAll(/<h[23](?:\s[^>]*)?>([\s\S]*?)<\/h[23]>\s*<details class="story-answer">[\s\S]*?<p>([\s\S]*?)<\/p>/g)];
    for (const [i,q] of questions.entries()) {
      const heading = questions.length > 1 ? `After reading ${i+1}` : 'After reading';
      items.push({ head: heading, text: strip(q[1]), end: true });
      answers.push(`${heading}: ${strip(q[2])}`);
    }
  }
  return { items, answers };
}

// Lay the questions out in the shared A4/Letter safe box; spill onto further
// pages if a long maths story needs it. Returns one content stream per page.
function questionPages(title, { items, answers }) {
  const left = (PAGE_W - BOX_W) / 2, top = (PAGE_H + BOX_H) / 2, bottom = (PAGE_H - BOX_H) / 2;
  const width = BOX_W;
  const pages = [];
  let ops = [], y = top;
  const newPage = () => { if (ops.length) pages.push(ops.join("\n")); ops = []; y = top; };
  const line = (s, size, bold, grey, gap = 0) => {
    const lh = size * 1.32;
    if (y - lh < bottom + 24) newPage();
    y -= lh + gap;
    ops.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${grey ? "0.38 0.34 0.31 rg" : "0.13 0.09 0.07 rg"} ${left.toFixed(2)} ${y.toFixed(2)} Td ${pdfText(s)} Tj ET`);
  };
  const para = (s, size, bold, grey, gap) => wrap(s, size, bold, width).forEach((l, i) => line(l, size, bold, grey, i === 0 ? gap : 0));

  para(`Questions for ${title}`, 20, true, false, 0);
  para("Read the story together first. Use the page prompts and the questions after reading. Answers are below the dotted line: fold them under or cover them while reading.", 10.5, false, true, 6);
  for (const it of items) {
    para(it.head, 11.5, true, false, it.end ? 16 : 12);
    para(it.text, 12, false, false, 2);
    if (it.extra) para(it.extra, 11, false, true, 2);
  }
  if (answers.length) {
    // Keep every answer on one page, so the fold-under line hides them all.
    const block = 22 + 6 + 11.5 * 1.32 + answers.reduce((h, a) => h + wrap(a, 10.5, false, width).length * 10.5 * 1.32 + 3, 0);
    if (y - block < bottom + 24) newPage();
    y -= 22;
    ops.push(`0.6 0.55 0.5 RG 0.8 w [4 3] 0 d ${left.toFixed(2)} ${y.toFixed(2)} m ${(left + width).toFixed(2)} ${y.toFixed(2)} l S [] 0 d`);
    para("Answers  (fold under before reading)", 11.5, true, false, 6);
    for (const a of answers) para(a, 10.5, false, true, 3);
  }
  newPage();
  // Footer on the last page only: a printed copy passed round a class still points home.
  pages[pages.length - 1] += `\nBT /F1 9 Tf 0.45 0.4 0.36 rg ${left.toFixed(2)} ${(bottom + 4).toFixed(2)} Td ${pdfText("Free to read online and print: snackpackuniverse.com/read")} Tj ET`;
  return pages;
}

// ── PDF assembly ─────────────────────────────────────────────────────────
function buildPdf(images, title, textPages = []) {
  const chunks = [];
  const offsets = [0];
  let len = 0;
  const push = (b) => { const buf = Buffer.isBuffer(b) ? b : Buffer.from(b, "latin1"); chunks.push(buf); len += buf.length; };
  const obj = (n, body) => { offsets[n] = len; push(`${n} 0 obj\n`); push(body); push("\nendobj\n"); };

  const n = images.length;
  const hasFonts = textPages.length > 0 || images.some(img => img.caption?.length);
  // 1 catalog, 2 pages, then per image: page, contents, xobject; then the two
  // fonts, then per text page: page, contents.
  const pageIds = images.map((_, i) => 3 + i * 3);
  const fontReg = 3 + n * 3, fontBold = fontReg + 1;
  const textIds = textPages.map((_, i) => fontBold + 1 + i * 2);
  const total = 2 + n * 3 + (hasFonts ? 2 : 0) + textPages.length * 2;
  const kids = [...pageIds, ...textIds];

  push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, `<< /Type /Pages /Kids [${kids.map((id) => `${id} 0 R`).join(" ")}] /Count ${kids.length} >>`);

  images.forEach((img, i) => {
    const pageId = pageIds[i], contentId = pageId + 1, imgId = pageId + 2;
    // Fit inside the shared safe box, preserving aspect, centred on the sheet.
    const copy = img.caption || [];
    const heading = copy.length ? wrap(copy[0], 16, true, BOX_W) : [];
    const lines = copy.slice(1).flatMap(p => wrap(p, 13, false, BOX_W));
    const copyH = copy.length ? heading.length * 20 + lines.length * 18 + 24 : 0;
    if (copyH > BOX_H / 2) throw new Error(`Page ${i + 1}: story copy too long for a readable picture-book page`);
    const scale = Math.min(BOX_W / img.width, (BOX_H - copyH) / img.height);
    const w = img.width * scale, h = img.height * scale;
    const x = (PAGE_W - w) / 2, y = copy.length ? (PAGE_H + BOX_H) / 2 - h : (PAGE_H - h) / 2;
    let content = `q\n${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im0 Do\nQ\n`;
    let textY = y - 26;
    for (const [font, size, lineHeight, rows] of [['F2', 16, 20, heading], ['F1', 13, 18, lines]]) {
      for (const line of rows) {
        content += `BT /${font} ${size} Tf 0.13 0.09 0.07 rg ${((PAGE_W - BOX_W) / 2).toFixed(2)} ${textY.toFixed(2)} Td ${pdfText(line)} Tj ET\n`;
        textY -= lineHeight;
      }
    }
    const contentBytes = Buffer.from(content, 'latin1');

    obj(pageId,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
      `/Resources << /XObject << /Im0 ${imgId} 0 R >> ${hasFonts ? `/Font << /F1 ${fontReg} 0 R /F2 ${fontBold} 0 R >>` : ''} >> /Contents ${contentId} 0 R >>`);
    obj(contentId, `<< /Length ${contentBytes.length} >>\nstream\n${content}endstream`);

    offsets[imgId] = len;
    push(`${imgId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} ` +
         `/ColorSpace ${colorSpace(img.components)} /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.data.length} >>\nstream\n`);
    push(img.data);
    push("\nendstream\nendobj\n");
  });

  if (hasFonts) {
    obj(fontReg, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
    obj(fontBold, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
    textPages.forEach((content, i) => {
      const pageId = textIds[i], contentId = pageId + 1;
      obj(pageId,
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
        `/Resources << /Font << /F1 ${fontReg} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${contentId} 0 R >>`);
      const body = Buffer.from(content, "latin1");
      offsets[contentId] = len;
      push(`${contentId} 0 obj\n<< /Length ${body.length} >>\nstream\n`);
      push(body);
      push("\nendstream\nendobj\n");
    });
  }

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
  const captions = new Map();
  const prints = new Map();
  for (const m of html.matchAll(/<article class="story-page-card"[^>]*>([\s\S]*?)<\/article>/g)) {
    const file = m[1].match(/<img src="\.\/pages\/([^"/]+\.jpg)"/);
    const copy = m[1].match(/<div class="story-page-copy">([\s\S]*)/);
    if (!file || !copy) continue;
    const model = m[1].match(/data-print-model="\.\/([^"<>]+)"/);
    if (model) prints.set(file[1], model[1]);
    const label = copy[1].match(/<span>([\s\S]*?)<\/span>/);
    const letterHeading = copy[1].match(/<h2>([\s\S]*?)<\/h2>/);
    // Story paragraphs only; questions and answers keep their own final sheet.
    const storyCopy = copy[1].split(/<aside|<details|<p class="math-q"/)[0];
    const paragraphs = [...storyCopy.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/g)]
      .map(p => strip(p[1]));
    if (paragraphs.length) captions.set(file[1], [[label ? strip(label[1]) : '', letterHeading ? strip(letterHeading[1]) : ''].filter(Boolean).join(' · '), ...paragraphs]);
  }
  const cover = html.match(/<img src="\.\/pages\/(cover(?:-r\d+)?\.jpg)"/);
  if (cover) files.push(cover[1]);
  for (const m of html.matchAll(/<img src="\.\/pages\/([^"]+\.jpg)"[^>]*loading="lazy"/g)) files.push(m[1]);
  const title = (html.match(/<title>([^|<]+)/) || [, slug])[1].trim();
  return { files, captions, prints, title: decode(title), questions: questionsFor(html) };
}

const slugs = fs.readdirSync(READ)
  .filter((d) => fs.existsSync(path.join(READ, d, "index.html")) && d !== "index.html")
  .filter((d) => !only || d === only);

console.log(WRITE ? "Building PDFs:" : "Dry run (pass --write to emit):");
let built = 0;
for (const slug of slugs) {
  const { files, captions, prints, title, questions } = pagesFor(slug);
  if (files.length < 2) { console.log(`  SKIP ${slug}: found ${files.length} page(s)`); continue; }

  const images = files.map((f) => {
    const p = prints.has(f) ? path.join(READ, slug, prints.get(f)) : path.join(READ, slug, "pages", f);
    const data = fs.readFileSync(p);
    return { ...jpegInfo(data), data, caption: captions.get(f) };
  });

  const textPages = questions.items.length ? questionPages(title, questions) : [];
  const pdf = buildPdf(images, title, textPages);
  const out = path.join(READ, slug, `${slug}.pdf`);
  const mb = (pdf.length / 1048576).toFixed(2);
  console.log(`  ${slug}: ${images.length} pages + ${textPages.length} questions page(s) (${questions.items.length} questions, ${questions.answers.length} answers), ${mb} MB${pdf.length > 3 * 1048576 ? "  <- OVER 3 MB budget" : ""}`);
  if (WRITE) fs.writeFileSync(out, pdf);
  built++;
}
console.log(`\n${built} PDF(s) ${WRITE ? "written" : "ready"}.`);
