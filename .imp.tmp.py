p='scripts/import-reading-trail-book.mjs'; s=open(p,encoding='utf-8').read()
def rep(a,b):
    global s
    assert s.count(a)==1, a[:70]
    s=s.replace(a,b)
# 1. second source
rep('const SRC = fs.readFileSync(path.join(APP, "constants/reading-trail-drafts.ts"), "utf8");',
    '''const SRC = fs.readFileSync(path.join(APP, "constants/reading-trail-drafts.ts"), "utf8");
// Short reads (2026-10-15): the free four-page stories in books.ts (STORY_BOOKS
// and EXTRA_STORY_BOOKS). Same page shape as the trail, but no trail step or
// target words, art named <id>-pN.jpg, and quizzes without a "why" line.
const SRC_SHORT = fs.readFileSync(path.join(APP, "constants/books.ts"), "utf8");
const artPrefix = (id, ed) => (ed.source === "short" ? id : `reading-trail-${id}`);''')
# 2. optional field
rep('''function field(block, name) {
  const m = new RegExp(`\\b${name}:\\s*(['"])`).exec(block);
  if (!m) throw new Error(`missing ${name}`);''',
    '''function field(block, name, optional = false) {
  const m = new RegExp(`\\b${name}:\\s*(['"])`).exec(block);
  if (!m && optional) return "";
  if (!m) throw new Error(`missing ${name}`);''')
# 3. parseBook for short
rep('''function parseBook(id) {
  const start = SRC.indexOf(`id: 'reading-trail-${id}'`);''',
    '''function parseShort(id) {
  const start = SRC_SHORT.indexOf(`\n    id: '${id}',`);
  if (start === -1) throw new Error(`${id} not found in books.ts`);
  const next = SRC_SHORT.indexOf("\n  {\n    id: '", start + 10);
  const block = SRC_SHORT.slice(start, next === -1 ? undefined : next);
  const pagesBlock = block.slice(block.indexOf("pages: ["), block.indexOf("quiz:"));
  const pages = [];
  for (const line of pagesBlock.split("\n")) {
    if (!/\{\s*id:\s*'p\d+'/.test(line)) continue;
    pages.push({ text: field(line, "text"), prompt: field(line, "prompt"), focusWord: field(line, "focusWord") });
  }
  const quizPart = block.slice(block.indexOf("quiz:"), block.indexOf("quiz2:") === -1 ? undefined : block.indexOf("quiz2:"));
  return {
    step: null, title: field(block, "title"), subtitle: field(block, "subtitle"), targetWords: [], pages,
    quiz: { question: field(quizPart, "question"), answer: field(quizPart, "answer"), why: field(quizPart, "why", true) }
  };
}

function parseBook(id, ed) {
  if (ed && ed.source === "short") return parseShort(id);
  const start = SRC.indexOf(`id: 'reading-trail-${id}'`);''')
# 4. render tweaks
rep('''  const art = `reading-trail-${id}`;
  const url = `${SITE}/read/${slug}/`;''', '''  const art = artPrefix(id, ed);
  const short = ed.source === "short";
  const url = `${SITE}/read/${slug}/`;''')
rep('''<p>${mark(p.text, words, ed)}</p>''', '''<p>${mark(p.text, short ? [p.focusWord] : words, ed)}</p>''')
rep('''<title>${title} | Free ${titleCase} Story</title>''', '''<title>${title} | ${short ? "Free Illustrated Short Read" : `Free ${titleCase} Story`}</title>''')
rep('''<span class="eyebrow">Reading Trail · Step ${book.step} · Free</span>''', '''<span class="eyebrow">${short ? "Short read" : `Reading Trail · Step ${book.step}`} · Free</span>''')
rep('''<div class="tag-row"><span class="tag">Beginning reader</span><span class="tag">${ed.skill}</span><span class="tag">Read together</span></div>''',
    '''<div class="tag-row">${short ? `<span class="tag">Read together</span><span class="tag">${ed.skill}</span><span class="tag">4 pages</span>` : `<span class="tag">Beginning reader</span><span class="tag">${ed.skill}</span><span class="tag">Read together</span>`}</div>''')
rep('''<p>${esc(curly(book.quiz.answer))}. ${esc(curly(book.quiz.why))}</p>''', '''<p>${esc(curly(book.quiz.answer))}.${book.quiz.why ? ` ${esc(curly(book.quiz.why))}` : ""}</p>''')
rep('''<p>SnackPack Sentences &amp; Spelling has the full Reading Trail, longer stories, word packs and eight literacy games.</p>''',
    '''<p>${short ? "SnackPack Sentences &amp; Spelling has many more short reads like this one, plus the Reading Trail, word packs and literacy games." : "SnackPack Sentences &amp; Spelling has the full Reading Trail, longer stories, word packs and eight literacy games."}</p>''')
rep('''learningResourceType: "Illustrated story",''', '''learningResourceType: short ? "Illustrated short story" : "Illustrated story",''')
# 5. main loop
rep('''  const book = parseBook(id);''', '''  const book = parseBook(id, ed);''')
rep('''  const art = `reading-trail-${id}`;
  const missing''', '''  const art = artPrefix(id, ed);
  const missing''')
rep('''console.log(`${WRITE ? "write" : "dry  "} read/${ed.slug}/  step ${book.step}, ${book.pages.length} pages, "${book.title}"`);''',
    '''console.log(`${WRITE ? "write" : "dry  "} read/${ed.slug}/  ${ed.source === "short" ? "short read" : `step ${book.step}`}, ${book.pages.length} pages, "${book.title}"`);''')
# mark(): pattern may be absent for short reads
rep('''const hit = !stop.has(l) && (set.has(l) || set.has(stem) || ed.pattern.test(l));''',
    '''const hit = !stop.has(l) && (set.has(l) || set.has(stem) || (ed.pattern ? ed.pattern.test(l) : false));''')
open(p,'w',encoding='utf-8',newline='').write(s); print('patched')
