// Import a complete, quality-reviewed free A-Z book. Run from website root:
// node scripts/import-alphabet-book.mjs --id=panda-cake-alphabet [--write]
// Text is the app's exported sentence verbatim. Letters/words are rendered in
// HTML, never generated into artwork. No emoji or partial-alphabet fallback.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { loadAlphabetBook, validateAlphabetBook } from './lib/alphabet-book.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = path.resolve(ROOT, '../apps/snackpack-1-abcs-alphabet');
const id = (process.argv.find(a => a.startsWith('--id=')) || '').slice(5);
const reviewFile = path.join(ROOT, 'scripts/data/alphabet-books-reviewed.json');
const reviews = JSON.parse(fs.readFileSync(reviewFile, 'utf8'));
if (!reviews[id]) throw new Error(`Choose a reviewed --id: ${Object.keys(reviews).join(', ')}`);
const ed = reviews[id], data = loadAlphabetBook(APP, id);
validateAlphabetBook(data, ed);
console.log(`${process.argv.includes('--write') ? 'write' : 'dry run'} ${ed.slug}: 26 illustrated pages, app text and reviewed art verified`);
if (!process.argv.includes('--write')) process.exit(0);

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const SITE = 'https://www.snackpackuniverse.com', url = `${SITE}/read/${ed.slug}/`;
const title = `${data.book.title}: ${data.book.subtitle}`, dir = path.join(ROOT, 'read', ed.slug);
fs.mkdirSync(path.join(dir, 'pages'), { recursive: true });
// The existing PDF builder embeds JPEG; preserve the app's WebP bytes for web.
// ImageMagick is also the website's existing image-build dependency.
data.files.forEach((file, i) => {
  const name = `letter-${data.pages[i].letter.toLowerCase()}`;
  fs.copyFileSync(file, path.join(dir, 'pages', `${name}.webp`));
  const jpeg = path.join(dir, 'pages', `${name}.jpg`);
  // 900px is sufficient for the home-print safe box and keeps 26 pages small.
  execFileSync('magick', [file, '-resize', '900x600', '-quality', '75', jpeg]);
  const stamp = fs.statSync(jpeg).mtime;
  fs.utimesSync(path.join(dir, 'pages', `${name}.webp`), stamp, stamp);
});
const template = fs.readFileSync(path.join(ROOT, 'read/hen-berrys-digraph-dash/index.html'), 'utf8');
const shared = template.slice(template.indexOf('<!-- pwa:generated -->'), template.indexOf('</head>'));
const header = template.slice(template.indexOf('<header class="topbar">'), template.indexOf('<main>'));
const img = (i, alt, lazy = true) => `<picture><source srcset="./pages/letter-${data.pages[i].letter.toLowerCase()}.webp" type="image/webp"><img src="./pages/letter-${data.pages[i].letter.toLowerCase()}.jpg" alt="${esc(alt)}" width="1200" height="800"${lazy ? ' loading="lazy"' : ''}></picture>`;
const cards = data.pages.map((p, i) => `<article class="story-page-card" id="page-${i + 1}">${img(i, ed.pages[i].alt)}<div class="story-page-copy"><span>Page ${i + 1} of 26</span><h2>${p.letter} ${p.letter.toLowerCase()} · ${esc(p.word)}</h2><p>${esc(p.sentence)}</p></div></article>`).join('\n');
const ld = { '@context': 'https://schema.org', '@type': 'Book', name: title, author: { '@type': 'Organization', name: 'SnackPack Studios' }, isAccessibleForFree: true, educationalLevel: 'Alphabet recognition', learningResourceType: 'Illustrated alphabet book', about: 'Letter names A-Z and everyday vocabulary', image: `${url}pages/letter-a.jpg`, url };
fs.writeFileSync(path.join(dir, 'index.html'), `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} | Free Alphabet Book &amp; Printable PDF</title>
<meta name="description" content="Read all 26 letters with Panda-Cake in a fully illustrated free alphabet picture book. Read together online or print the complete A-Z PDF.">
<link rel="canonical" href="${url}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(ed.blurb)}"><meta property="og:image" content="${url}pages/letter-a.jpg"><meta property="og:url" content="${url}"><meta property="og:type" content="book"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon-32.png"><link rel="preload" href="/assets/fonts/dmsans-ed656a5d.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/assets/fonts/fraunces-36024e18.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/assets/fonts/fonts.css"><link rel="stylesheet" href="../../site.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script><!-- breadcrumbs:generated --><!-- /breadcrumbs:generated -->
${shared}</head><body class="story-reader-page">${header}<main>
<section class="story-title-section"><div class="shell story-title-grid story-hero-landscape"><div><span class="eyebrow">Alphabet picture book · Free</span><h1>${esc(title)}</h1><p class="lead">${esc(ed.lead)}</p><div class="tag-row"><span class="tag">Ages 3-5</span><span class="tag">All 26 letters</span><span class="tag">Read together</span></div><a class="btn btn-primary" href="#page-1">Begin the alphabet</a><!-- read-share-top:generated --><!-- /read-share-top:generated --></div>${img(0, '', false)}</div></section>
<section class="story-pages story-pages-landscape" aria-label="Alphabet pages">${cards}</section>
<section><div class="shell story-finish-card"><span class="eyebrow">A to Z · Great reading</span><h2>What could Panda-Cake take to a rainy picnic, and why?</h2><details class="story-answer"><summary>Show the answer</summary><p>Her umbrella would help keep her dry. What else would you pack?</p></details><p>SnackPack ABC has more alphabet books, read-aloud stories and letter games.</p><!-- read-next:generated --><!-- /read-next:generated --><div class="stack-inline"><a class="btn btn-primary" href="https://play.google.com/store/apps/details?id=com.snackpackuniverse.abcalphabet" target="_blank" rel="noopener">Get the app on Google Play</a><a class="btn btn-secondary" href="../../apps/snackpack-1-abcs-alphabet/">Explore the app</a><a class="btn btn-secondary" href="./${ed.slug}.pdf" download>Print this book (PDF)</a><a class="btn btn-secondary" href="../">Back to the bookshelf</a></div></div></section>
</main><footer class="foot"><div class="shell foot-wrap"><p class="foot-note">Alphabet book from SnackPack ABC.</p><div class="footer-links"><a class="text-link" href="../">Bookshelf</a><a class="text-link" href="../../privacy/snackpack-1-abcs-alphabet/">Privacy</a></div></div></footer>
<!-- Cloudflare Web Analytics --><script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"0e57cfb3eb86422ca40e5fac02b1cf94"}'></script><!-- End Cloudflare Web Analytics -->
</body></html>\n`);
