// Choices use the published shelf order and explicit groups; no reading history.
export function nextChoices(shelf, slug, collections = []) {
  const index = shelf.findIndex(b => b.slug === slug), book = shelf[index];
  if (!book) return [];
  const peers = collections.find(c => c.id !== 'first-phonics' && c.books.includes(slug));
  const excluded = new Set([slug, ...(peers?.books || [])]);
  const ordered = shelf.slice(index + 1).concat(shelf.slice(0, index));
  const phonics = /^stage-/.test(book.group) || book.group === 'trail';
  const next = phonics ? shelf.slice(index + 1).find(b => /^stage-/.test(b.group) || b.group === 'trail') :
    ordered.find(b => peers?.books.includes(b.slug)) || ordered.find(b => b.group === book.group);
  const choices = [];
  if (next) {
    const label = phonics ? (next.group === 'trail' ? 'Next Reading Trail practice · read together' : next.group === book.group ? 'More practice at this stage' : 'Next phonics stage · when ready') : 'Related read-together book';
    choices.push({book:next,label}); excluded.add(next.slug);
  }
  const appropriate = b => !book.age || !b.age || (b.age[0] <= book.age[1] && b.age[1] >= book.age[0]);
  const wider = ordered.find(b => !excluded.has(b.slug) && b.group !== book.group && !/^stage-/.test(b.group) && b.group !== 'trail' && appropriate(b)) ||
    ordered.find(b => !excluded.has(b.slug) && appropriate(b));
  if (wider) choices.push({book:wider,label:'Explore another book · read together'});
  return choices;
}
