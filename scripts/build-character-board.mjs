import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const site = new URL("../", import.meta.url);
const check = process.argv.includes("--check");
const from = process.argv.find(arg => arg.startsWith("--source="))?.slice(9);
const read = file => fs.readFileSync(file, "utf8");
const local = file => new URL(file, site);
const json = data => JSON.stringify(data, null, 2) + "\n";
const snapshot = "data/character-board.json";
const fields = ["id", "name", "kind", "greeting", "moment", "book", "alt", "family", "animal", "fact"];

function output(file, text) {
  const destination = local(file);
  if (check) {
    assert(fs.existsSync(destination) && read(destination) === text, `Regenerate ${file}`);
    return;
  }
  fs.mkdirSync(new URL("./", destination), { recursive: true });
  fs.writeFileSync(destination, text);
}

const pick = (object, keys) => Object.fromEntries(keys.filter(key => Object.hasOwn(object, key)).map(key => [key, object[key]]));
const data = from ? JSON.parse(read(path.join(from, "shared-assets/text/characters/pilot.json"))) : JSON.parse(read(local(snapshot)));
if (from) {
  for (const record of data.characters) {
    assert(fs.existsSync(path.join(from, record.source)), record.source);
    assert(fs.existsSync(path.join(from, "shared-assets", record.portrait)), record.portrait);
  }
}

const characters = data.characters.map(record => ({
  ...pick(record, fields),
  ...(record.art && {art: pick(record.art, ["page", "caption"])}),
}));
const animals = data.animals.map(animal => pick(animal, ["id", "name", "fact", "sourceName", "source"]));
const rounds = data.rounds;
assert(rounds.length > 0, "Publish at least one complete clue round");
assert.equal(new Set(rounds.map(round => round.answer)).size, rounds.length);
const byId = new Map(characters.map(record => [record.id, record]));
const animalById = new Map(animals.map(record => [record.id, record]));
const portrait = (id, width) => `/characters/media/${id}-${width}.webp`;
assert.equal(byId.size, characters.length);
assert.equal(animalById.size, animals.length);
for (const record of characters) {
  assert.match(record.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert(fs.existsSync(local(`read/${record.book[0]}/index.html`)), record.book[0]);
  for (const relative of record.family ?? []) assert(byId.has(relative) && relative !== record.id);
  if (record.animal) assert(animalById.has(record.animal));
  if (record.art) {
    assert.match(record.art.page, /^p\d{2}$/);
    assert(record.art.caption?.trim());
    for (const size of ["480w", "800w"]) {
      assert(fs.existsSync(local(`read/${record.book[0]}/pages/${record.art.page}-${size}.webp`)), record.id);
    }
  }
  for (const width of [240, 480, 960]) assert(fs.existsSync(local(portrait(record.id, width).slice(1))), portrait(record.id, width));
}
for (const round of rounds) {
  assert(byId.has(round.answer));
  assert.equal(round.clues.length, 3);
  const [firstClue] = round.clues;
  const candidates = firstClue[1];
  assert.equal(candidates.length, 6, "Each mystery needs six candidates");
  assert(candidates.every(id => byId.has(id)));
  let preceding = candidates;
  for (const [clue, matches] of round.clues) {
    assert(clue.trim());
    assert.equal(new Set(matches).size, matches.length);
    assert(matches.every(id => preceding.includes(id)), clue);
    assert(matches.includes(round.answer), clue);
    preceding = matches;
  }
  assert.deepEqual(preceding, [round.answer]);
}
output(snapshot, json({
  characters,
  animals,
  rounds: rounds.map(({answer, clues, explanation}) => ({answer, clues, explanation})),
}));

const escape = value => String(value).replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[character]);
const heading = (label, title, lead) => `<p class="cast-kicker">${label}</p><h1>${title}</h1><p class="cast-lead">${lead}</p>`;
const button = (href, name, primary = false) => `<a class="cast-button${primary ? " cast-button-primary" : ""}" href="${href}">${name}</a>`;
const profileHref = id => `/characters/${id}/`;
const animalHref = id => `/animals/${id}/`;
const link = (href, label) => `<a href="${href}">${escape(label)}</a>`;
const brand = `<a class="cast-brand" href="/"><img src="/assets/snackpack-mark-96.png" width="38" height="38" alt="">SnackPack Studios</a>`;
const bookLink = record => link(`/read/${record.book[0]}/`, record.book[1]);
function storyArt(record) {
  const base = `/read/${record.book[0]}/pages/${record.art.page}`;
  return `<details class="cast-detail cast-art"><summary>See a picture from the story</summary>
<figure><img src="${base}-480w.webp" srcset="${base}-480w.webp 480w, ${base}-800w.webp 800w" sizes="(max-width: 680px) 90vw, 420px" width="480" height="720" alt="" loading="lazy" decoding="async"><figcaption>${escape(record.art.caption)}</figcaption></figure></details>`;
}

function page(title, body, script = "") {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${escape(title)} | SnackPack Universe</title>
<link rel="stylesheet" href="/assets/fonts/fonts.css">
<link rel="stylesheet" href="/site.css">
<link rel="stylesheet" href="/characters/characters.css">
<script>
try {
  const saved = localStorage.getItem("snackpack.theme.v1");
  if (["cream", "light", "dark"].includes(saved)) document.documentElement.dataset.theme = saved;
} catch {}
document.documentElement.dataset.themeDefault = "cream";
</script>
<script src="/theme.js" defer></script>${script}
</head>
<body class="cast-site">
<header class="cast-header"><div class="cast-shell">${brand}<nav aria-label="Primary"><a href="/characters/">Characters</a><a href="/animals/">Animals</a><a href="/read/">Reads</a></nav><div data-theme-slot></div></div></header>
<main class="cast-shell">
${body}
</main>
<footer class="cast-footer"><div class="cast-shell"><a href="/characters/">Meet the Characters</a><a href="/characters/colouring/">Colouring pages</a><a href="/read/events/">Holiday stories</a></div></footer>
</body>
</html>
`;
}

const picture = (record, {large = false, eager = false} = {}) => `<img src="${portrait(record.id, large ? 480 : 240)}" srcset="${[240,480,960].map(width => `${portrait(record.id, width)} ${width}w`).join(", ")}" sizes="${large ? "(max-width: 680px) 90vw, 420px" : "(max-width: 540px) 45vw, 300px"}" width="${large ? 480 : 240}" height="${large ? 480 : 240}" alt="${large ? escape(record.alt) : ""}" ${eager ? "fetchpriority=\"high\"" : "loading=\"lazy\""} decoding="async">`;
const cards = characters.map(record => `<li><a class="cast-card" href="${profileHref(record.id)}">${picture(record)}<span><strong>${escape(record.name)}</strong><small>${escape(record.kind)}</small></span></a></li>`).join("\n");
output("characters/index.html", page("Meet the Characters", `<section class="cast-welcome">
<div class="cast-welcome-copy">${heading("SnackPack character board", "Hi! Come meet<br>the SnackPack crew.", "Find the friends from your favourite stories. Then see if you can guess who’s behind the library door.")}
<div class="cast-actions">${button("#crew", "Meet the crew", true)}${button("/characters/clues/", "Play the clue game")}</div></div>
<picture class="cast-welcome-art"><source srcset="/characters/media/library-720.webp 720w, /characters/media/library-1200.webp 1200w" sizes="(max-width: 680px) 94vw, 620px"><img src="/characters/media/library-720.webp" alt="Professor Hooten shows Hen-Berry and the twins the library’s five clocks" width="720" height="648" fetchpriority="high"></picture>
</section>
<section id="crew" class="cast-section"><div class="cast-section-top"><div><p class="cast-kicker">From the storybooks</p><h2>Pick a face to say hello</h2></div><p>Find their stories, favourite props and family.</p></div><ul class="cast-board">${cards}</ul></section>
<section aria-label="More to explore" class="cast-extras"><a href="/animals/"><strong>Meet the animals</strong><span>Explore real animals, from quiet owls to swimming penguins.</span></a><a href="/characters/colouring/"><strong>Print and colour</strong><span>Three scenes from the SnackPack stories.</span></a></section>`));

for (const record of characters) {
  const family = record.family?.map(id => link(profileHref(id), byId.get(id).name)).join(", ");
  const animal = animalById.get(record.animal);
  output(`characters/${record.id}/index.html`, page(record.name, `<p class="cast-crumb"><a href="/characters/">Meet the Characters</a> / ${escape(record.name)}</p>
<section class="cast-profile">
<div class="cast-profile-art">${picture(record, {large:true, eager:true})}</div>
<div>${heading(escape(record.kind), escape(record.name), escape(record.greeting))}
<section class="cast-detail"><h2>In the stories</h2><p>${escape(record.moment)}</p><p>${bookLink(record)}</p></section>
${record.fact ? `<section class="cast-detail"><h2>Something to spot</h2><p>${escape(record.fact)}</p></section>` : ""}
${record.art ? storyArt(record) : ""}
${family ? `<section class="cast-detail"><h2>Family</h2><p>${family}</p></section>` : ""}
${animal ? `<section class="cast-detail"><h2>Meet the animal</h2><p>${link(animalHref(animal.id), animal.name)}</p></section>` : ""}
<div class="cast-actions">${button("/characters/clues/", "Play the clue game", true)}${button("/characters/colouring/", "Find colouring pages")}</div></div></section>`));
}

output("animals/index.html", page("Meet the Animals", `<p class="cast-crumb"><a href="/characters/">Meet the Characters</a> / Animals</p>
<section class="cast-banner">${heading("Animal field notes", "Meet the animals", "Explore the real animals that inspire SnackPack characters.")}</section>
<div class="cast-extras">${animals.map(animal => `<a href="${animalHref(animal.id)}"><strong>${escape(animal.name)}</strong><span>${escape(animal.fact)}</span></a>`).join("")}</div>`));
for (const animal of animals) {
  const counterparts = characters.filter(record => record.animal === animal.id);
  output(`animals/${animal.id}/index.html`, page(animal.name, `<p class="cast-crumb"><a href="/animals/">Meet the Animals</a> / ${escape(animal.name)}</p>
<section class="cast-banner">${heading("Real animal fact", escape(animal.name), escape(animal.fact))}<p>Source ${link(animal.source, animal.sourceName)}</p></section>
<section class="cast-section"><h2>Meet the story ${counterparts.length === 1 ? "character" : "characters"}</h2><ul class="cast-board">${counterparts.map(record => `<li><a class="cast-card" href="${profileHref(record.id)}">${picture(record)}<span><strong>${escape(record.name)}</strong><small>SnackPack character</small></span></a></li>`).join("")}</ul></section>`));
}

const scenes = [["harvest-cobs", "Corgi and his basket of corn"], ["clock-wall", "The library clock wall"], ["twins-at-home", "Cluck and Coop at home"]];
output("characters/colouring/index.html", page("Colouring Pages", `<p class="cast-crumb"><a href="/characters/">Meet the Characters</a> / Colouring</p>
<section class="cast-banner">${heading("Print and colour", "Colour the story scenes", "Pick a black-and-white scene. Choose the paper size that fits your printer.")}</section>
<ul class="cast-board cast-colouring">${scenes.map(([id, label]) => `<li><article><img src="/characters/media/${id}-preview.webp" alt="" width="360" height="510" loading="lazy"><div><h2>${escape(label)}</h2><div class="cast-actions">${button(`/characters/colouring/files/${id}-a4.pdf`, "A4 PDF")}${button(`/characters/colouring/files/${id}-letter.pdf`, "US Letter PDF")}</div></div></article></li>`).join("")}</ul>`));

const fallback = rounds[0];
output("characters/clues/index.html", page("Who’s at the Door?", `<p class="cast-crumb"><a href="/characters/">Meet the Characters</a> / Clue game</p>
<section class="cast-game">
<div class="cast-game-heading">${heading("The library clue game", "Who’s at the door?", "Read the clues and pick the SnackPack guest you think is behind the door.")}</div>
<div data-cast-fallback class="cast-clues"><h2>A mystery to try</h2><ol>${fallback.clues.map(([clue]) => `<li>${escape(clue)}</li>`).join("")}</ol><details><summary>Show me the answer</summary><p>${escape(fallback.explanation)} ${link(profileHref(fallback.answer), "Meet Cluck O’Clock")}</p></details></div>
<div data-cast-game hidden>
<div class="cast-clues"><h2 data-clue-title tabindex="-1">Clue 1 of 3</h2><ol data-clue-list></ol><div class="cast-actions"><button type="button" class="cast-button cast-button-primary" data-next-clue>Read another clue</button><button type="button" class="cast-button" data-show-answer>Show me the answer</button></div></div>
<ul class="cast-board cast-candidates" aria-label="Choose a guest">${characters.map(record => `<li><button type="button" class="cast-card" data-guess="${record.id}">${picture(record)}<span><strong>${escape(record.name)}</strong><small>${escape(record.kind)}</small></span></button></li>`).join("")}</ul>
<div class="cast-result" data-result><p role="status" data-feedback></p><div class="cast-actions" data-reveal hidden><a class="cast-button cast-button-primary" data-visit>Meet this character</a><button type="button" class="cast-button" data-next-round>Another mystery</button></div></div>
</div></section>`, "\n<script src=\"/characters/clues.js\" defer></script>"));
output("characters/clue-rounds.json", json(rounds.map(({ answer, clues, explanation }) => ({
  answer, candidates: clues[0][1], clues: clues.map(([text]) => text), explanation, name: byId.get(answer).name,
}))));
console.log(`Character board verified with ${characters.length} characters, ${animals.length} animal records and ${rounds.length} clue rounds.`);
