// Holiday and event bookshelves for /read/: the one table behind the event
// pages, the in-season band on the hub, the "Part of …" links on book pages and
// the end-of-book "Next in …" chain. Plan of record:
// docs/reads-events-bookshelf/PLAN.md in the monorepo.
//
// Every event stays readable all year. An event is *featured* from `leadDays`
// before its date to `tailDays` after it, worked out in the visitor's browser
// (read/events.js) from the concrete dates this module expands.
//
// Date rules follow Badgify's apps/badgify/constants/holidayEvents.ts so the two
// tables can be compared (scripts/build-read-events.mjs --check does so when
// the monorepo checkout is present). Listed dates come from published calendars.
//
// Books are listed by slug and must already be on the shelf in
// build-read-shelf.mjs. An event with no books is shown as "Coming up" on
// /read/events/ and gets no page of its own until it has finished titles.

import fs from "node:fs";

const originalRegistry = JSON.parse(fs.readFileSync(new URL("../../data/web-originals.json", import.meta.url), "utf8"));
const released = timeline => timeline.filter(({ slug }) => originalRegistry[slug]);
const publishedSlugs = (slugs) => slugs.filter(slug => originalRegistry[slug]);

export const READ_EVENTS = [
  {
    id: "christmas",
    icon: "christmas",
    title: "Christmas",
    heading: "Christmas stories",
    tagline: "A woodland Christmas, from choosing the tree to the last parcel on Christmas morning.",
    intro: "Six original picture books set in the SnackPack woodland in the days before Christmas. Read them in the order they happen, or pick by age: four read-alouds for ages 4 to 9 and one harbour mystery for confident readers aged 12 to 14.",
    accent: "#8C1D2B",
    dates: [{ kind: "fixed", month: 12, day: 25 }],
    leadDays: 40,
    tailDays: 6,
    // Reading order follows the season; the shelf and the "Next" chain use it.
    timeline: [
      { when: "Early December", slug: "nutmeg-and-the-tree-that-wouldnt-come" },
      { when: "The week before", slug: "vincent-van-mouse-and-the-christmas-shadow-show" },
      { when: "The first snow", slug: "sub-zero-and-the-great-snowball-truce" },
      { when: "Christmas week · older readers", slug: "captain-beakon-and-the-bell-across-the-bay" },
      { when: "Christmas Eve", slug: "one-more-story-before-santa" },
      { when: "Christmas morning", slug: "the-last-parcel-under-the-tree" },
    ],
    alsoGood: ["sub-zero-and-the-snowflake-post", "sub-zeros-magic-e-lantern", "nutmegs-four-seasons"],
    extras: [{ href: "/winter/", label: "Winter in the Woods: two short winter stories and two winter games" }],
    // Read-alouds that "Read together tonight" rotates through, in order.
    tonight: ["nutmeg-and-the-tree-that-wouldnt-come", "vincent-van-mouse-and-the-christmas-shadow-show", "sub-zero-and-the-great-snowball-truce", "one-more-story-before-santa", "the-last-parcel-under-the-tree"],
    appearance: "winter",
  },
  {
    id: "new-year",
    icon: "new-year",
    title: "New Year",
    heading: "New Year stories",
    tagline: "Countdowns, paper hats and a jar of good things.",
    intro: "Two woodland stories share one New Year’s Eve. Sort a year of memories with Ted, then follow the clock wall with Cluck and Coop.",
    activity: "midnight-clocks",
    printables: [
      { href: "/read/events/new-year/jar-of-good-things.pdf", label: "Jar of Good Things activity sheet" },
      { href: "/read/events/new-year/colouring-ted-e-bear-and-the-jar-of-good-things.pdf", label: "Colour Ted’s story" },
      { href: "/read/events/new-year/colouring-cluck-oclock-and-the-midnight-that-came-early.pdf", label: "Colour Cluck’s story" },
    ],
    accent: "#2B2F6B",
    dates: [{ kind: "fixed", month: 1, day: 1 }],
    leadDays: 14,
    tailDays: 9,
    timeline: released([
      { when: "New Year’s Eve, 6 to 9 pm", slug: "ted-e-bear-and-the-jar-of-good-things" },
      { when: "New Year’s Eve to New Year’s Day", slug: "cluck-oclock-and-the-midnight-that-came-early" },
    ]),
    tonight: publishedSlugs(["cluck-oclock-and-the-midnight-that-came-early"]),
    alsoGood: ["pork-ulele-and-the-clockwork-concert", "nutmegs-four-seasons"],
  },
  {
    id: "lunar-new-year",
    icon: "lunar-new-year",
    title: "Lunar New Year",
    heading: "Lunar New Year stories",
    tagline: "Reunion dinners, lion dances and the year of the goat.",
    accent: "#9E1B1B",
    dates: [{ kind: "listed", dates: { 2026: [2, 17], 2027: [2, 6], 2028: [1, 26], 2029: [2, 13], 2030: [2, 3] } }],
    leadDays: 25,
    tailDays: 15,
    timeline: [],
  },
  {
    id: "easter",
    icon: "easter",
    title: "Easter",
    heading: "Easter stories",
    tagline: "Egg hunts, hatching chicks and an autumn Easter in the south.",
    accent: "#5B3A7A",
    dates: [{ kind: "easter", offsetDays: 0 }],
    leadDays: 28,
    tailDays: 8,
    timeline: [],
  },
  {
    id: "thanksgiving",
    icon: "thanksgiving",
    title: "Thanksgiving",
    heading: "Thanksgiving stories",
    tagline: "Harvest tables, potluck mix-ups and saying thank you.",
    intro: "Meet the friends around two woodland tables. Share a Friendsgiving mix-up, or read aloud and count the cobs on the way to Nutmeg’s harvest feast.",
    activity: "thank-you-leaves",
    printables: [
      { href: "/read/events/thanksgiving/thank-you-leaves.pdf", label: "Thank-you Leaves activity sheet" },
      { href: "/read/events/thanksgiving/colouring-everybody-brought-potatoes.pdf", label: "Colour Everybody Brought Potatoes" },
      { href: "/read/events/thanksgiving/colouring-corgi-on-the-cob-and-the-harvest-table.pdf", label: "Colour Corgi’s harvest story" },
    ],
    accent: "#7A3B12",
    dates: [
      { kind: "nthWeekday", month: 10, weekday: 1, n: 2, region: "Canada" },
      { kind: "nthWeekday", month: 11, weekday: 4, n: 4, region: "United States" },
    ],
    leadDays: 28,
    tailDays: 3,
    timeline: released([
      { when: "The week before", slug: "everybody-brought-potatoes" },
      { when: "Thanksgiving Day", slug: "corgi-on-the-cob-and-the-harvest-table" },
    ]),
    tonight: publishedSlugs(["corgi-on-the-cob-and-the-harvest-table"]),
    alsoGood: ["nutmegs-stormy-barn", "corgi-on-the-cobs-ten-frame-picnic", "panda-cakes-market-basket"],
  },
];

export const FIRST_YEAR = 2026;
export const LAST_YEAR = 2030;

const iso = (y, m, d) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

// Anonymous Gregorian algorithm (Meeus/Jones/Butcher).
export function easterSunday(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return [month, day];
}

// weekday: 0 Sunday … 6 Saturday.
export function nthWeekday(y, month, weekday, n) {
  const first = new Date(Date.UTC(y, month - 1, 1)).getUTCDay();
  return [month, 1 + ((weekday - first + 7) % 7) + (n - 1) * 7];
}

function ruleDate(rule, y) {
  if (rule.kind === "fixed") return [rule.month, rule.day];
  if (rule.kind === "nthWeekday") return nthWeekday(y, rule.month, rule.weekday, rule.n);
  if (rule.kind === "easter") {
    const [m, d] = easterSunday(y);
    const t = new Date(Date.UTC(y, m - 1, d + rule.offsetDays));
    return [t.getUTCMonth() + 1, t.getUTCDate()];
  }
  if (rule.kind === "listed") return rule.dates[y] ?? null;
  throw new Error(`unknown date rule ${rule.kind}`);
}

// Every concrete date of an event from FIRST_YEAR to LAST_YEAR, sorted, as
// YYYY-MM-DD, with the region label where a rule has one.
export function eventDates(event, from = FIRST_YEAR, to = LAST_YEAR) {
  const out = [];
  for (let y = from; y <= to; y++) {
    for (const rule of event.dates) {
      const md = ruleDate(rule, y);
      if (md) out.push({ date: iso(y, md[0], md[1]), region: rule.region ?? null });
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export const eventBooks = (event) => event.timeline.map((t) => t.slug);
export const eventForBook = (slug) => READ_EVENTS.find((e) => eventBooks(e).includes(slug)) ?? null;
export const publishedEvents = () => READ_EVENTS.filter((e) => e.timeline.length);

export const eventIconPath = (event) => `/read/events/icons/${event.icon}.svg`;
export const eventIcon = (event) => `<img class="read-event-icon" src="${eventIconPath(event)}" alt="" aria-hidden="true" width="20" height="20">`;

export function releasedEventBooks() {
  const releaseDates = { thanksgiving: "2026-11-24", "new-year": "2026-12-18" };
  const releases = READ_EVENTS.filter(event => releaseDates[event.id])
    .sort((a, b) => releaseDates[a.id].localeCompare(releaseDates[b.id]));
  return releases.flatMap(event => event.timeline.map(({ slug }) => {
    const book = JSON.parse(fs.readFileSync(new URL(`../../${originalRegistry[slug]}`, import.meta.url), "utf8"));
    const label = slug === "everybody-brought-potatoes" ? "Friendsgiving" : event.title;
    const format = book.readingLevel === "Read together" ? "Read-aloud" : "Story";
    return {
      slug, group: event.id, seasonalRelease: true, age: book.ageRange.split("–").map(Number),
      readingLevel: book.readingLevel, added: releaseDates[event.id], title: book.title,
      eyebrow: `${label} · ${format} · ${book.storyPageCount} pages`, blurb: book.blurb,
      cover: "pages/cover", ext: "jpg", alt: book.cover.alt, w: book.cover.width, h: book.cover.height,
    };
  }));
}
