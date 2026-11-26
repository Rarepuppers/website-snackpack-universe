import { eventForBook } from './read-events.mjs';

const christmasPair = [
  'twenty-four-letters-before-christmas',
  'the-star-that-fell-on-the-longest-night',
];

// Choices use the published shelf order and explicit groups; no reading history.
export function nextChoices(shelf, slug, collections = []) {
  const index = shelf.findIndex(b => b.slug === slug), book = shelf[index];
  if (!book) return [];
  const peers = collections.find(c => c.id !== 'first-phonics' && c.books.includes(slug));
  const excluded = new Set([slug, ...(peers?.books || [])]);
  const ordered = shelf.slice(index + 1).concat(shelf.slice(0, index));
  const phonics = /^stage-/.test(book.group) || book.group === 'trail';
  const appropriate = b => !book.age || !b.age || (b.age[0] <= book.age[1] && b.age[1] >= book.age[0]);
  const event = eventForBook(book.slug);
  const paired = christmasPair.includes(slug) && shelf.find(b => b.slug !== slug && christmasPair.includes(b.slug));
  let seriesOrder = book.seasonalRelease ? shelf.slice(index + 1) : ordered;
  if (book.group === 'christmas') {
    const timeline = event.timeline.map(({slug: entry}) => shelf.find(b => b.slug === entry)).filter(Boolean);
    const entryIndex = timeline.indexOf(book);
    seriesOrder = timeline.slice(entryIndex + 1).concat(book.seasonalRelease ? [] : timeline.slice(0, entryIndex));
  }
  const next = phonics ? shelf.slice(index + 1).find(b => /^stage-/.test(b.group) || b.group === 'trail') :
    paired ||
    ordered.find(b => peers?.books.includes(b.slug)) ||
    seriesOrder.find(b => b.group === book.group && (book.group !== 'christmas' || appropriate(b)));
  const choices = [];
  if (next) {
    const label = phonics ? (next.group === 'trail' ? 'Next Reading Trail practice · read together' : next.group === book.group ? 'More practice at this stage' : 'Next phonics stage · when ready') :
      event ? `Next ${book.group === "summer-christmas" ? "Summer Christmas" : event.title} story · ${next.readingLevel?.toLowerCase() ?? 'read together'}` :
      next.readingLevel ? `Related book · ${next.readingLevel.toLowerCase()}` : 'Related read-together book';
    choices.push({book:next,label}); excluded.add(next.slug);
  }
  const eligible = ordered.filter(b => !excluded.has(b.slug) && !b.seasonalRelease && b.group !== book.group && !/^stage-/.test(b.group) && b.group !== 'trail' && appropriate(b));
  // Stable variety uses the source shelf position, without random or personal
  // history. A single first-match fallback sent most stories to the same book.
  const wider = eligible.length ? eligible[index % eligible.length] : ordered.find(b => !excluded.has(b.slug) && appropriate(b));
  if (wider) choices.push({book:wider,label:wider.group === 'numbers' ? 'Explore a number story · read together' : `Explore another book · ${wider.readingLevel?.toLowerCase() ?? 'read together'}`});
  return choices;
}
