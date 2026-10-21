// Local: compare the real app exports. CI without the companion checkout:
// validate committed source evidence and all published files, with an explicit
// message that app-source parity was not re-established there.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const rootArg = process.argv.find(a => a.startsWith('--site-root='));
const ROOT = rootArg ? path.resolve(rootArg.slice('--site-root='.length)) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP_ROOT = path.resolve(ROOT, '../apps');
const EVIDENCE = path.join(ROOT, 'data/read-publication-evidence.json');
const WRITE = process.argv.includes('--write-evidence');
const REQUIRE_APPS = process.argv.includes('--require-apps');
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const norm = s => String(s ?? '').replace(/<[^>]*>/g, '').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&amp;/g, '&').replace(/&quot;|&ldquo;|&rdquo;/g, '"').replace(/&#39;|&apos;|&lsquo;|&rsquo;/g, "'").replace(/&nbsp;/g, ' ').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[‑–—−]/g, '-').replace(/\s+/g, ' ').trim();
const hasApps = fs.existsSync(path.join(APP_ROOT, 'snackpack-3-spelling-sentences/constants/books.ts'));
if ((WRITE || REQUIRE_APPS) && !hasApps) throw new Error('Companion app sources required; evidence-only verification cannot establish current app parity.');
let candidates = [];
let spellingIds = new Set();
let sourceArtFor = () => ({});
if (hasApps) {
  const req = createRequire(path.join(APP_ROOT, 'snackpack-1-abcs-alphabet/package.json'));
  const ts = req('typescript');
  req.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, f);
  for (const ext of ['.jpg', '.jpeg', '.png', '.webp']) req.extensions[ext] = (m, f) => m.exports = f;
  globalThis.__DEV__ = false;
  const load = (app, name) => req(path.join(APP_ROOT, app, 'constants', name + '.ts'));
  const abc = 'snackpack-1-abcs-alphabet';
  spellingIds = new Set(load('snackpack-3-spelling-sentences', 'books').ALL_STORY_BOOKS.map(b=>b.id));
  candidates = [
    ...load(abc, 'decodableBooks').DECODABLE_BOOKS,
    ...load(abc, 'curatedFeaturedStories').CURATED_FEATURED_STORIES,
    ...load('snackpack-3-spelling-sentences', 'books').ALL_STORY_BOOKS,
    ...load('snackpack-2-123s-counting', 'storyBooks').INTERACTIVE_STORY_BOOKS,
    ...load('snackpack-4-math-arithmetic', 'curatedMathBooks').CURATED_MATH_BOOKS,
    ...load('snackpack-zoo-world', 'zooData/additionalBooksData').ADDITIONAL_BOOKS,
  ];
  const { ABC_BOOKS, getBookAlphabet } = load(abc, 'alphabet');
  candidates.push(...ABC_BOOKS.map(b => ({ ...b, pages: getBookAlphabet(b.id).map(p => ({ text: p.sentence })) })));
  const spellArt = load('snackpack-3-spelling-sentences', 'bookPageArtwork').BOOK_PAGE_ARTWORK;
  const countArt = load('snackpack-2-123s-counting', 'storyPageArtwork').getStoryPageArtwork;
  const abcArt = load(abc, 'bookPageArtwork').getBookPageArtwork;
  const miniArt = load(abc, 'miniStoryHeroArtwork').getMiniStoryHeroArtwork;
  const mathArt = load('snackpack-4-math-arithmetic', 'bookPageImages').getBookPageImage;
  sourceArtFor = book => {
    const images = book.pages.map((p, i) => p.illustration || spellArt[book.id]?.[i] || countArt(book.id, i) || abcArt(book.id, i) || miniArt(book.id, i) || mathArt(p.illustrationId || p.id) ||
      (book.id === 'animal-architects' ? path.join(APP_ROOT, 'snackpack-zoo-world/assets/books', book.id, `${book.id}-p${i + 1}.jpg`) : null));
    assert(images.every(p => typeof p === 'string' && fs.existsSync(p)), `${book.id}: current app page art missing/unmapped`);
    if (typeof book.cover === 'string' && fs.existsSync(book.cover)) images.push(book.cover);
    const mathCover = path.join(APP_ROOT,'snackpack-4-math-arithmetic/assets/book-covers',book.id+'.webp');
    if (fs.existsSync(mathCover)) images.push(mathCover);
    return Object.fromEntries(images.map(p => [path.relative(APP_ROOT, p).replace(/\\/g, '/'), sha(p)]));
  };
}
const prior = fs.existsSync(EVIDENCE) ? JSON.parse(fs.readFileSync(EVIDENCE, 'utf8')) : null;
if (!WRITE && !prior) throw new Error('No publication evidence; run locally with --require-apps --write-evidence after review.');
const records = [];
for (const slug of fs.readdirSync(path.join(ROOT, 'read')).sort()) {
  const file = path.join(ROOT, 'read', slug, 'index.html');
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const cards = [...html.matchAll(/<article class="story-page-card"[^>]*>([\s\S]*?)<\/article>/g)].map(m => m[1]);
  if (!cards.length) continue;
  const text = cards.map(c => norm(c.split('story-page-copy')[1].match(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/)[1]));
  const previous = prior?.books.find(b => b.slug === slug);
  const book = hasApps ? candidates.find(b => b.pages.length === text.length && b.pages.every((p, i) => norm(p.text || p.body) === text[i])) : null;
  if (hasApps) assert(book, `${slug}: story differs from every current app export; fix source/import first`);
  if (!WRITE) { assert(previous, `${slug}: no committed app-source evidence`); assert.deepEqual(text, previous.text, `${slug}: text changed since app comparison`); }
  const plain = norm(html);
  const expected = [];
  if (book?.quiz) expected.push(...[book.quiz.question, book.quiz.answer, book.quiz.why].filter(Boolean));
  if (book?.quiz2) expected.push(...[book.quiz2.question, book.quiz2.answer, book.quiz2.why].filter(Boolean));
  book?.pages.forEach((p, i) => {
    const prompt = p.riddle?.prompt || p.prompt;
    if (prompt) expected.push(prompt);
    if (p.riddle) {
      expected.push(...p.riddle.choices, p.riddle.successText);
      assert.equal(norm(cards[i].match(/data-answer="([^"]*)"/)[1]), norm(p.riddle.choices[p.riddle.correctIndex]), `${slug}: wrong maths answer page ${i + 1}`);
    } else if (p.explanation) {
      expected.push(p.explanation);
      assert.equal(norm(cards[i].match(/data-answer="([^"]*)"/)[1]), norm(p.answer), `${slug}: wrong answer page ${i + 1}`);
    }
  });
  for (const item of hasApps ? expected : previous.expected) assert(plain.includes(norm(item)), `${slug}: missing prompt/question/answer: ${item}`);
  const quizzes = hasApps ? (spellingIds.has(book.id) ? [book.quiz,book.quiz2].filter(Boolean).map(q=>({question:norm(q.question),answer:norm(q.answer+'.'+(q.why?' '+q.why:''))})) : []) : previous.quizzes;
  if (quizzes?.length) {
    const finish = html.split('class="shell story-finish-card"')[1]?.split('<!-- read-next:generated -->')[0] || '';
    const actual = [...finish.matchAll(/<h[23](?:\s[^>]*)?>([\s\S]*?)<\/h[23]>\s*<details class="story-answer">[\s\S]*?<p>([\s\S]*?)<\/p>/g)].map(m=>({question:norm(m[1]),answer:norm(m[2])}));
    assert.deepEqual(actual,quizzes,`${slug}: app quiz text/answer/explanation differs or contains extra text`);
  }
  const art = {};
  for (const card of cards) {
    const img = card.match(/<img[^>]*src="([^\"]*)"[^>]*alt="([^\"]*)"/);
    assert(img && img[2].trim(), `${slug}: page art or alt text missing`);
    const p = path.resolve(path.dirname(file), img[1]);
    assert(p.startsWith(path.join(ROOT, 'read') + path.sep), `${slug}: art outside bookshelf`);
    art[path.relative(ROOT, p).replace(/\\/g, '/')] = sha(p);
  }
  const pdf = `read/${slug}/${slug}.pdf`;
  assert(fs.readFileSync(path.join(ROOT, pdf)).subarray(0, 5).toString() === '%PDF-', `${slug}: missing/invalid PDF`);
  const schema = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1])).find(s => s['@type'] === 'Book');
  assert.equal(schema?.numberOfPages, cards.length, `${slug}: schema page count`);
  const source_art = hasApps ? sourceArtFor(book) : previous.source_art;
  if (!WRITE && hasApps) assert.deepEqual(source_art, previous.source_art, `${slug}: owning app artwork changed since review`);
  const record = { slug, source_id: book?.id || previous.source_id, source_art, text, expected: hasApps ? expected : previous.expected, quizzes, art, pdf, pdf_sha256: sha(path.join(ROOT, pdf)) };
  if (!WRITE) { assert.deepEqual(art, previous.art, `${slug}: art changed without new reviewed evidence`); assert.equal(record.pdf_sha256, previous.pdf_sha256, `${slug}: PDF changed without text/render verification`); }
  records.push(record);
}
if (!WRITE) assert.deepEqual(records.map(b => b.slug), prior.books.map(b => b.slug), 'Published books differ from evidence');
const shelf = fs.readFileSync(path.join(ROOT, 'read/index.html'), 'utf8');
assert.equal((shelf.match(/class="read-library-card"/g) || []).length, records.length, 'Shelf/book count mismatch');
for (const pin of JSON.parse(fs.readFileSync(path.join(ROOT, 'data/decodable-art-pins.json'), 'utf8'))) {
  assert.equal(sha(path.join(ROOT, pin.web)), pin.web_sha256, `Decodable art pin changed: ${pin.web}`);
  if (hasApps) assert.equal(sha(path.join(APP_ROOT, 'snackpack-1-abcs-alphabet', pin.app)), pin.app_sha256, `App decodable art changed: ${pin.app}`);
}
if (WRITE) fs.writeFileSync(EVIDENCE, JSON.stringify({ reviewed: '2026-10-21', books: records }, null, 2) + '\n');
console.log(`Read publication: ${records.length} books / ${records.reduce((n, b) => n + b.text.length, 0)} pages; art, prompts, answers, PDFs and metadata pass.`);
console.log(hasApps ? 'Current app exports compared directly.' : 'CI evidence-only mode: validates committed app comparison; current companion app sources unavailable and NOT rechecked.');
