import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { replaceMarkerBlock } from "./lib/marker-block.mjs";
import { withBreadcrumbs } from "./lib/breadcrumbs.mjs";

const site = new URL("../", import.meta.url);
const check = process.argv.includes("--check");
const from = process.argv.find(arg => arg.startsWith("--source="))?.slice(9);
const read = file => fs.readFileSync(file, "utf8");
const local = file => new URL(file, site);
const json = data => JSON.stringify(data, null, 2) + "\n";
const snapshot = "data/character-board.json";
const releasedApps = {
  "snackpack-1-abcs-alphabet": "SnackPack ABC",
  "snackpack-2-123s-counting": "SnackPack 123",
  "snackpack-3-spelling-sentences": "Sentences & Spelling",
  "snackpack-4-math-arithmetic": "Basic Math",
  "snackpack-7-mathematics": "SnackPack Mathematics",
  "snackpack-8-earth-science": "Earth Science",
  "snackpack-9-space-math": "Space Math",
  "snackpack-11-prehistoric-pals": "Prehistoric Pals",
  "snackpack-12-zoo-world": "Zoo World",
  "snackpack-13-garden-world": "Garden World",
};
const appRoutes = {
  "snackpack-prehistoric-pals": "snackpack-11-prehistoric-pals",
  "snackpack-zoo-world": "snackpack-12-zoo-world",
  "snackpack-garden-world": "snackpack-13-garden-world",
};
const fields = ["id", "name", "kind", "greeting", "moment", "book", "alt", "family", "animal", "fact", "aliases", "app", "colouring", "status", "pronouns", "greetings", "group"];

function output(file, text) {
  if (/^(characters|animals)\/.*index\.html$/.test(file)) {
    const route = "/" + file.slice(0, -"index.html".length);
    const description = text.match(/<p class="cast-lead">([^<]+)<\/p>/)?.[1];
    assert(description, `Missing page description for ${route}`);
    text = text.replace("<title>", `<link rel="canonical" href="https://www.snackpackuniverse.com${route}">\n<meta name="description" content="${description}">\n<title>`);
    const id = file.match(/^(?:characters|animals)\/([^/]+)\/index\.html$/)?.[1];
    if (id && !["clues", "colouring"].includes(id)) {
      const media = `characters/media/${id}-share.jpg`;
      assert(fs.existsSync(local(media)) && fs.statSync(local(media)).size <= 120_000, `Missing or oversized ${media}`);
      const title = text.match(/<title>(.*?) \| SnackPack Universe<\/title>/)?.[1];
      assert(title, route);
      const origin = "https://www.snackpackuniverse.com";
      const tags = [
        `<meta property="og:title" content="${title}">`,
        `<meta property="og:description" content="${description}">`,
        `<meta property="og:image" content="${origin}/${media}">`,
        `<meta property="og:image:width" content="1200">`,
        `<meta property="og:image:height" content="630">`,
        `<meta property="og:url" content="${origin}${route}">`,
        `<meta name="twitter:card" content="summary_large_image">`,
      ];
      text = text.replace("</head>", tags.join("\n") + "\n</head>");
    }
    text = withBreadcrumbs(text, file);
  }
  const destination = local(file);
  if (check) {
    assert(fs.existsSync(destination) && read(destination) === text, `Regenerate ${file}`);
    return;
  }
  fs.mkdirSync(new URL("./", destination), { recursive: true });
  fs.writeFileSync(destination, text);
}

const pick = (object, keys) => Object.fromEntries(keys.filter(key => Object.hasOwn(object, key)).map(key => [key, object[key]]));
const data = from ? JSON.parse(read(path.join(from, "shared-assets/text/characters/catalog.json"))) : JSON.parse(read(local(snapshot)));
const publicRecords = data.characters.filter(record => data.version === 2 ? record.status === "public" : (record.status ?? "public") === "public");
if (from) {
  for (const record of publicRecords) {
    assert(fs.existsSync(path.join(from, record.source)), record.source);
    assert(fs.existsSync(path.join(from, record.portrait)), record.portrait);
    if (record.variant) assert(fs.existsSync(path.join(from, record.variant.source)), record.variant.source);
  }
}

const publicIds = new Set(publicRecords.map(record => record.id));
const characters = publicRecords.map(record => ({
  ...pick(record, fields),
  ...(record.art && {art: pick(record.art, ["page", "caption"])}),
  ...(record.variant && {variant: pick(record.variant, ["caption"])}),
  ...(record.relationships && {relationships: record.relationships.filter(edge => publicIds.has(edge.to))
    .map(edge => pick(edge, ["to", "type"]))}),
  ...(record.apps || record.webApps ? {webApps: (record.apps?.map(binding => appRoutes[binding.app] ?? binding.app) ?? record.webApps)
    .filter(id => Object.hasOwn(releasedApps, id) && fs.existsSync(local(`apps/${id}/index.html`)))} : {}),
  ...(record.appearances && {appearances: record.appearances
    .filter(appearance => appearance.kind === "book" && !appearance.draft)
    .map(appearance => pick(appearance, ["kind", "id", "role"]))}),
}));
const animals = data.animals.map(animal => pick(animal, ["id", "name", "fact", "sourceName", "source"]));
const seasonal = new Map((data.seasonalRounds ?? [])
  .filter(round => !round.draft).map(round => [round.answer, round]));
const rounds = data.rounds.map(round => seasonal.get(round.answer) ?? round);
assert(rounds.length > 0, "Publish at least one complete clue round");
assert.equal(new Set(rounds.map(round => round.answer)).size, rounds.length);
assert.equal(rounds.length, characters.length);
const byId = new Map(characters.map(record => [record.id, record]));
const animalById = new Map(animals.map(record => [record.id, record]));
const portrait = (id, width) => `/characters/media/${id}-${width}.webp`;
assert.equal(byId.size, characters.length);
assert.equal(animalById.size, animals.length);
for (const record of characters) {
  assert.match(record.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  if (record.book) assert(fs.existsSync(local(`read/${record.book[0]}/index.html`)), record.book[0]);
  if (record.app) assert(fs.existsSync(local(`apps/${record.app[0]}/index.html`)), record.app[0]);
  for (const relative of record.family ?? []) assert(byId.has(relative) && relative !== record.id);
  if (record.animal) assert(animalById.has(record.animal));
  if (record.variant) assert(fs.existsSync(local(`characters/media/${record.id}-variant.webp`)), record.id);
  if (record.art) {
    assert(record.book, record.id);
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
function alternatePortrait(record) {
  return `<details class="cast-detail cast-art"><summary>See another portrait</summary>
<figure><img src="/characters/media/${record.id}-variant.webp" width="480" height="480" alt="" loading="lazy" decoding="async"><figcaption>${escape(record.variant.caption)}</figcaption></figure></details>`;
}

function page(title, body, script = "") {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
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
<footer class="cast-footer"><div class="cast-shell"><a href="/characters/">Meet the Characters</a><a href="/characters/colouring/">Colouring pages</a><a href="/read/events/">Holiday stories</a><a href="/terms/#art-and-asset-rights">Art &amp; asset rights</a><p>Original SnackPack art and assets © SnackPack Studios.</p></div></footer>
</body>
</html>
`;
}

const picture = (record, {large = false, eager = false} = {}) => `<img src="${portrait(record.id, large ? 480 : 240)}" srcset="${[240,480,960].map(width => `${portrait(record.id, width)} ${width}w`).join(", ")}" sizes="${large ? "(max-width: 680px) 90vw, 420px" : "(max-width: 540px) 45vw, 300px"}" width="${large ? 480 : 240}" height="${large ? 480 : 240}" alt="${large ? escape(record.alt) : ""}" ${eager ? "fetchpriority=\"high\"" : "loading=\"lazy\""} decoding="async">`;
const groups = {
  birds: "Birds", mammals: "Mammals", reptiles: "Reptiles",
  bugs: "Bugs and creepy-crawlies", "sea-creatures": "Sea creatures",
};
const storyTitles = new Map();
for (const character of characters) {
  for (const { id } of character.appearances ?? []) {
    if (storyTitles.has(id)) continue;
    const html = read(local(`read/${id}/index.html`));
    const title = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1] ??
      html.match(/<title>([^|<]+)/)?.[1]?.trim();
    assert(title, id);
    storyTitles.set(id, title.replace(/&amp;/g, "&").replace(/&quot;/g, '"'));
  }
}
const stories = [...storyTitles].sort((a, b) => a[1].localeCompare(b[1], "en"));
const options = (entries) => entries.map(([id, label]) => `<option value="${id}">${escape(label)}</option>`).join("");
const cards = characters.map(record => `<li data-cast-search="${escape([record.name, record.kind, ...(record.aliases ?? [])].join(" "))}" data-cast-group="${escape(record.group ?? "")}" data-cast-stories="${(record.appearances ?? []).map(appearance => escape(appearance.id)).join(" ")}"><a class="cast-card" href="${profileHref(record.id)}">${picture(record)}<span><strong>${escape(record.name)}</strong><small>${escape(record.kind)}</small></span></a></li>`).join("\n");
output("characters/index.html", page("Meet the Characters", `<section class="cast-welcome">
<div class="cast-welcome-copy">${heading("SnackPack character board", "Hi! Come meet<br>the SnackPack crew.", "Find the friends from your favourite stories. Then see if you can guess who’s behind the library door.")}
<div class="cast-actions">${button("#crew", "Meet the crew", true)}${button("/characters/clues/", "Play the clue game")}</div></div>
<picture class="cast-welcome-art"><source srcset="/characters/media/library-720.webp 720w, /characters/media/library-1200.webp 1200w" sizes="(max-width: 680px) 94vw, 620px"><img src="/characters/media/library-720.webp" alt="Professor Hooten shows Hen-Berry and the twins the library’s five clocks" width="720" height="648" fetchpriority="high"></picture>
</section>
<section id="crew" class="cast-section"><div class="cast-section-top"><div><p class="cast-kicker">From the stories and apps</p><h2>Pick a face to say hello</h2></div><p>Find their stories, favourite props and family.</p></div>
<div class="cast-search" data-cast-filter hidden><label for="cast-search">Find a character</label><input id="cast-search" type="search" placeholder="Name or animal"><label for="cast-group">Animal group</label><select id="cast-group"><option value="">All</option>${options(Object.entries(groups))}</select><label for="cast-story">Explore by story</label><select id="cast-story"><option value="">All stories</option>${options(stories)}</select><p role="status" data-cast-count></p></div>
<ul class="cast-board">${cards}</ul></section>
<section aria-label="More to explore" class="cast-extras"><a href="/animals/"><strong>Meet the animals</strong><span>Explore real animals, from quiet owls to swimming penguins.</span></a><a href="/characters/colouring/"><strong>Print and colour</strong><span>Scenes from the SnackPack stories.</span></a></section>`, "\n<script src=\"/characters/board.js\" defer></script>"));

for (const record of characters) {
  const related = [...new Set([...(record.family ?? []), ...(record.relationships ?? []).map(edge => edge.to)])];
  const family = related.map(id => {
    const name = byId.get(id).name;
    return `<a class="cast-relative" href="${profileHref(id)}"><img src="${portrait(id, 240)}" width="36" height="36" alt="" loading="lazy">${escape(name)}</a>`;
  }).join("");
  const roles = { lead: "star", support: "helper", cameo: "cameo" };
  const otherStories = (record.appearances ?? []).filter(appearance => appearance.id !== record.book?.[0]);
  const more = otherStories.map(({ id, role }) =>
    `<li>${link(`/read/${id}/`, storyTitles.get(id))} · ${roles[role]}</li>`).join("");
  const appLinks = (record.webApps ?? []).map(id => link(`/apps/${id}/`, releasedApps[id])).join(" · ");
  const greetings = (record.greetings?.length ?? 0) > 1
    ? `<button class="cast-button" type="button" data-cast-greetings="${escape(JSON.stringify(record.greetings))}" hidden>Another hello</button>`
    : "";
  const animal = animalById.get(record.animal);
  output(`characters/${record.id}/index.html`, page(record.name, `<p class="cast-crumb"><a href="/characters/">Meet the Characters</a> / ${escape(record.name)}</p>
<section class="cast-profile">
<div class="cast-profile-art">${picture(record, {large:true, eager:true})}</div>
<div>${heading(escape(record.kind), escape(record.name), escape(record.greeting))}${greetings}
<section class="cast-detail"><h2>${record.book ? "In the stories" : "Meet the character"}</h2><p>${escape(record.moment)}</p>${record.book ? `<p>${bookLink(record)}</p>` : ""}</section>
${more ? `<section class="cast-detail"><h2>Also in</h2><ul>${more}</ul></section>` : ""}
${record.fact ? `<section class="cast-detail"><h2>Something to spot</h2><p>${escape(record.fact)}</p></section>` : ""}
${record.art ? storyArt(record) : ""}
${record.variant ? alternatePortrait(record) : ""}
${family ? `<section class="cast-detail"><h2>Friends and family</h2><div class="cast-actions">${family}</div></section>` : ""}
${animal ? `<section class="cast-detail"><h2>Meet the animal</h2><p>${link(animalHref(animal.id), animal.name)}</p></section>` : ""}
${appLinks ? `<section class="cast-detail"><h2>In the apps</h2><p>${appLinks}</p></section>` :
  record.app ? `<p>${link(`/apps/${record.app[0]}/`, record.app[1])}</p>` : ""}
<div class="cast-actions">${button("/characters/clues/", "Play the clue game", true)}${record.colouring
  ? button(`/characters/colouring/#${record.id}`, "Colour this character")
  : button("/characters/colouring/", "Find colouring pages")}</div></div></section>`,
greetings ? '\n<script src="/characters/profile.js" defer></script>' : ""));
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
const sheets = characters.filter(record => record.colouring).map(record => [record.id, record.name]);
const printCard = ([id, label]) => `<li id="${id}"><article><img src="/characters/media/${id}-preview.webp" alt="" width="360" height="510" loading="lazy"><div><h2>${escape(label)}</h2><div class="cast-actions">${button(`/characters/colouring/files/${id}-a4.pdf`, "A4 PDF")}${button(`/characters/colouring/files/${id}-letter.pdf`, "US Letter PDF")}</div></div></article></li>`;
output("characters/colouring/index.html", page("Colouring Pages", `<p class="cast-crumb"><a href="/characters/">Meet the Characters</a> / Colouring</p>
<section class="cast-banner">${heading("Print and colour", "Colour the SnackPack crew", "Choose a black-and-white portrait or a picture from the stories. Both paper sizes are ready to print.")}</section>
${sheets.length ? `<section class="cast-section"><h2>Character colouring pages</h2><div class="cast-actions">${button("/characters/colouring/files/crew-a4.pdf", "Full pack · A4")}${button("/characters/colouring/files/crew-letter.pdf", "Full pack · US Letter")}</div>
<ul class="cast-board cast-colouring">${sheets.map(printCard).join("")}</ul></section>` : ""}
<section class="cast-section"><h2>Colour a story scene</h2><ul class="cast-board cast-colouring" data-scene-sheets>${scenes.map(printCard).join("")}</ul></section>
<section class="cast-section"><h2>More colouring scenes</h2><div class="cast-extras">
<a href="/read/events/thanksgiving/"><strong>Thanksgiving colouring packs</strong><span>Eight pictures from the harvest and Friendsgiving stories.</span></a>
<a href="/read/events/new-year/"><strong>New Year colouring packs</strong><span>Eight pictures from the library stories.</span></a>
</div></section>`));

const fallback = rounds[0];
output("characters/clues/index.html", page("Who’s at the Door?", `<p class="cast-crumb"><a href="/characters/">Meet the Characters</a> / Clue game</p>
<section class="cast-game">
<div class="cast-game-heading">${heading("The library clue game", "Who’s at the door?", "Read the clues and pick the SnackPack guest you think is behind the door.")}</div>
<div data-cast-fallback class="cast-clues"><h2>A mystery to try</h2><ol>${fallback.clues.map(([clue]) => `<li>${escape(clue)}</li>`).join("")}</ol><details><summary>Show me the answer</summary><p>${escape(fallback.explanation)} ${link(profileHref(fallback.answer), `Meet ${byId.get(fallback.answer).name}`)}</p></details></div>
<div data-cast-game hidden>
<div class="cast-clues"><h2 data-clue-title tabindex="-1">Clue 1 of 3</h2><ol data-clue-list></ol><div class="cast-actions"><button type="button" class="cast-button cast-button-primary" data-next-clue>Read another clue</button><button type="button" class="cast-button" data-show-answer>Show me the answer</button></div></div>
<ul class="cast-board cast-candidates" aria-label="Choose a guest">${characters.map(record => `<li><button type="button" class="cast-card" data-guess="${record.id}">${picture(record)}<span><strong>${escape(record.name)}</strong><small>${escape(record.kind)}</small></span></button></li>`).join("")}</ul>
<div class="cast-result" data-result><p role="status" data-feedback></p><div class="cast-actions" data-reveal hidden><a class="cast-button cast-button-primary" data-visit>Meet this character</a><button type="button" class="cast-button" data-next-round>Another mystery</button></div></div>
</div></section>`, "\n<script src=\"/characters/clues.js\" defer></script>"));
output("characters/clue-rounds.json", json(rounds.map(({ answer, clues, explanation }) => ({
  answer, candidates: clues[0][1], clues: clues.map(([text]) => text), explanation, name: byId.get(answer).name,
}))));
console.log(`Character board verified with ${characters.length} characters, ${animals.length} animal records and ${rounds.length} clue rounds.`);

const appCastStart = "<!-- app-cast:generated -->";
const appCastEnd = "<!-- /app-cast:generated -->";
for (const id of Object.keys(releasedApps)) {
  const cast = characters.filter(record => record.webApps?.includes(id)).slice(0, 6);
  const file = `apps/${id}/index.html`;
  if (!cast.length) continue;
  const html = read(local(file));
  const links = cast.map(record => link(profileHref(record.id), record.name)).join(" · ");
  const block = `${appCastStart}
<section class="section"><div class="shell"><h2>Meet the cast</h2><p>${links}</p></div></section>
${appCastEnd}`;
  assert(html.includes("</main>"), file);
  output(file, replaceMarkerBlock(html, appCastStart, appCastEnd, block) ??
    html.replace("</main>", `${block}\n</main>`));
}
