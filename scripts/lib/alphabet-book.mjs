import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

// Load the actual exported app data, including remix/override logic and the
// same artwork resolver used by its reader. No second alphabet in the website.
export function loadAlphabetBook(app, id) {
  const req = createRequire(path.join(app, 'package.json'));
  const ts = req('typescript');
  req.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, f);
  for (const ext of ['.webp', '.png', '.jpg', '.jpeg']) req.extensions[ext] = (m, f) => { m.exports = f; };
  globalThis.__DEV__ = false;
  const { ABC_BOOKS, getBookAlphabet } = req(path.join(app, 'constants/alphabet.ts'));
  const { getBookPageArtwork } = req(path.join(app, 'constants/bookPageArtwork.ts'));
  return { book: ABC_BOOKS.find(b => b.id === id), pages: getBookAlphabet(id), files: Array.from({ length: 26 }, (_, i) => getBookPageArtwork(id, i)) };
}

export function validateAlphabetBook({ book, pages, files }, review, read = fs.readFileSync) {
  if (!book || !book.isFree || book.isComingSoon) throw new Error('Only available free alphabet books may be imported');
  if (pages.length !== 26 || files.length !== 26 || review.pages.length !== 26) throw new Error('A complete illustrated A-Z book needs exactly 26 pages');
  pages.forEach((p, i) => {
    const letter = String.fromCharCode(65 + i), pin = review.pages[i];
    if (p.letter !== letter || pin.letter !== letter || p.word !== pin.word) throw new Error(`Page ${i + 1}: letter/word differs from quality review`);
    if (!p.sentence || !p.sentence.includes(p.word) || !pin.alt?.trim()) throw new Error(`Page ${letter}: missing text or reviewed alt text`);
    if (!files[i] || path.basename(files[i]) !== pin.art) throw new Error(`Page ${letter}: missing or changed app artwork; review it first`);
    if (crypto.createHash('sha256').update(read(files[i])).digest('hex') !== pin.sha256) throw new Error(`Page ${letter}: artwork bytes changed; review it first`);
  });
}
