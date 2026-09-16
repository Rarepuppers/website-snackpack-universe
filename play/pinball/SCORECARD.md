# New arcade game scorecard — Pinball

- **Game and public name:** Pinball (slug `pinball`). The table carries a
  flavour name inside the game — *Cosmic Crunch*, Captain Beakon's galley —
  but it appears in no public copy, no title, no meta description and no
  search text. Per decision D6 in `docs/pinball/README.md`, all search copy
  targets the category word, never the brand.

- **Independent name-search evidence and date:** 2026-09-17, search for "play
  pinball online free browser HTML5 game". The public name is the generic
  category term, so there is nothing to conflict with and nothing
  registrable. Results confirm the space is occupied by generically-named
  entries — playpager.com/pinball-online, htmlgames.com/Pinball,
  plays.org/pinball, online-pinball.com, silvergames.com/en/pinball — none of
  which is a brand we could collide with.

- **Competition assessment:** Crowded, and honestly so. There are many free
  HTML5 pinball games and at least one browser-hosted Space Cadet port. What
  none of them appear to offer is the two things this table is built around:
  **rotating-flipper physics with real angular impulse transfer** (a tip shot
  leaves at 2,397 u/s against 1,179 off the base — measured, not claimed), and
  a **ruleset with actual depth** — twelve missions, nine ranks, three-ball
  multiball and a wizard mode. The typical competitor is a single table with
  bumpers and a score counter. We do not compete on the word "pinball"; we
  compete on being the one that is still interesting on the fourth game.

- **Source engine and test coverage:** Written from scratch for the web, not
  ported. `play/pinball/engine.js` (physics) and `rules.js` (scoring) are pure
  and shared verbatim with the future app build. 69 assertions:
  `tools/pinball/tune.test.mjs` (29 — flipper feel, containment, determinism,
  fuzz) and `tools/pinball/rules.test.mjs` (40 — every mission, multiball,
  wizard, tilt, persistence, score calibration). The old app engine was
  discarded; see decision D1.

- **Web interaction and accessibility risks:** Multi-touch is mandatory in
  pinball and is handled by tracking `pointerId` per zone. Touch zones are
  full-height columns, not buttons, because thumbs rest at the bottom of a
  phone. Hit-testing uses `getBoundingClientRect`, never `pageX` — Brain Games
  has a live defect from exactly that. Full keyboard play is provided (Z/←,
  //→, Space, comma/period); `keyboard-grid.js` does not apply because this is
  not a grid game, and the stage carries a written `data-no-keyboard-reason`
  saying so. The canvas has a live `aria-label` describing score, ball, table
  state and ball position, plus an `aria-live` status line.
  `prefers-reduced-motion` disables shake and particles and holds the lamps
  steady rather than removing them — the glow is information, not decoration.

- **Existing art to reuse:** None. The table is drawn from `table.js` geometry
  in flat colour, which has the useful property that what is on screen is
  exactly what the physics collides with — there is no separate "visual" table
  that can drift. Codex art is specified in `docs/pinball/05-codex-art-brief.md`
  and drops into the cached playfield layer without touching anything else.

- **New 144×144 tile and 1200×630 social card:** Both are **placeholders**,
  recorded in `play/tiles/PLACEHOLDERS.txt`. `og:image` points at the generic
  studio share card rather than a mismatched game image — per `AGENTS.md`,
  fallback imagery must never contradict the page subject.

- **Maintenance cost:** Low. No external dependencies, no build step, no data
  files to keep in sync. The engine and ruleset are pure and covered by fast
  headless tests, so a regression surfaces in seconds rather than by eye.
  `tools/pinball/shoot.mjs` drives the real page in headless Chromium for
  visual checks, because the in-app preview pane pauses `requestAnimationFrame`.

- **Naming/trademark review:** "Pinball" is a generic term for a game
  category and carries no trademark exposure. The flavour name is internal and
  uses established SnackPack cast from `characters.md` (Captain Beakon,
  Nutmeg, Sub-Zero, Polly Roger, Professor Hooten). No third-party table,
  manufacturer or machine name is used anywhere. The page references 3D
  Pinball Space Cadet once, comparatively and factually, in an FAQ answer — it
  does not claim to be that game or use its assets, art or trade dress.

- **Fit with calm, ad-free, no-sign-in play:** Good. Free with no account, no
  ads and no tracking. Everything is free on the web; Pro gating exists only
  in the app port. Louder than the puzzle games by nature, so audio stays
  muted by default and the arcade-wide mute preference is respected.

- **Daily mode:** **Supported.** `?daily=YYYY-MM-DD` seeds the mission draw
  order and the skill shot, giving everyone the same table. One attempt per
  day, recorded via `SnackPackStore`, shared through `share-result.js`. The
  share card reports how far you got and never which missions came up — the
  mission order *is* the daily's content, so naming it would spoil it.

- **Decision and measurement window:** Ship at P7 with placeholder art;
  Codex art lands at P4 without code changes. Review after 30 days on: plays
  per visit, whether anyone reaches rank 9, and daily-mode return rate. The
  honest question this game answers is whether depth retains anyone at all —
  the portfolio's revenue reality is that distribution, not content, is the
  constraint, and a crowded category is a real test of that.
