import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { validateAlphabetBook } from './lib/alphabet-book.mjs';

// Exercise the publication boundary with mutations: incomplete art must never
// turn into a partial alphabet, and a changed app word/image needs a new read.
const digest = crypto.createHash('sha256').update('reviewed art').digest('hex');
const pages = Array.from({ length: 26 }, (_, i) => ({ letter: String.fromCharCode(65 + i), word: `Word${i}`, sentence: `A sentence containing Word${i}.` }));
const data = { book: { isFree: true }, pages, files: pages.map(p => `${p.letter}.webp`) };
const review = { pages: pages.map(p => ({ ...p, art: `${p.letter}.webp`, alt: `A picture for ${p.letter}`, sha256: digest })) };
const check = (d = data, r = review, read = () => 'reviewed art') => validateAlphabetBook(d, r, read);
check();
assert.throws(() => check({ ...data, book: { isFree: false } }), /free/);
assert.throws(() => check({ ...data, book: { isFree: true, isComingSoon: true } }), /available/);
assert.throws(() => check({ ...data, pages: pages.slice(0, 25) }), /26 pages/);
assert.throws(() => check({ ...data, files: data.files.map((f, i) => i === 8 ? null : f) }), /Page I/);
assert.throws(() => check({ ...data, files: data.files.map((f, i) => i === 9 ? 'wrong.webp' : f) }), /Page J/);
assert.throws(() => check({ ...data, pages: pages.map((p, i) => i === 4 ? { ...p, word: 'Changed' } : p) }), /quality review/);
assert.throws(() => check({ ...data, pages: [pages[1], pages[0], ...pages.slice(2)] }), /quality review/);
assert.throws(() => check(data, review, () => 'changed art'), /bytes changed/);
assert.throws(() => check(data, { pages: review.pages.map((p, i) => i === 2 ? { ...p, alt: '' } : p) }), /alt text/);
console.log('Alphabet publication guards pass: completeness, ordering, words, free tier, art pins and hashes.');
