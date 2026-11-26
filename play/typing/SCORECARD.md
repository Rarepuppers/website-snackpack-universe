# Snack Typer — new game scorecard

- **Game and public name:** Snack Typer (`/play/typing/`). Page title leads with "Typing Practice for Kids Free", the generic search phrase; "Snack Typer" is the brand.
- **Independent name-search evidence and date:** 2026-11-26 web search for "Snack Typer" typing game: no game of that name (closest: Snow Typer at rapidtyping.com, an old Flash game; Typer on GitHub). No keyword tool was available.
- **Competition assessment:** Crowded and established: KidzType, TypingBird, Dance Mat Typing (BBC), Kodable, Typing.com, TypingClub. Many carry ads or need accounts. The angle: no ads, no sign-in, accuracy-first stars, a finger-coloured keyboard, a daily set a class can share, and sentences from our own free story books, each linking back to its book.
- **Why build it (evidence):** Cloudflare and GoatCounter, Nov 2026: the site's largest real audience is a Honduran school that visits on desktops in lesson time and plays short no-reading games after the books. Typing practice is the most common computer-room activity. See `ARCADE-AND-TELEMETRY-PLAN-2026-11-21.md`.
- **Source engine and test coverage:** Written for the web (no app engine). Engine block between `// ════ Engine` and `// ════ UI`, run in Node by `tests/visual/arcade-typing.spec.mjs`: every lesson's words use only that lesson's keys, every word list is long enough for a run, the daily is deterministic, scoring maths, finger map. Browser tests type a whole lesson, check a wrong key stops and counts, stars and best record, daily recording, resume and the book link.
- **Web interaction and accessibility risks:** Typing goes into a real (transparent) textarea over the text, so physical keyboards, phone keyboards and IMEs all work; Tab reaches it. Written keyboard waiver on the stage. Next key outlined and named in words ("“f” — left pointer finger"), not by colour alone. Reduced motion removes the key lift.
- **Existing art to reuse:** None in the apps. Keyboard drawn in CSS.
- **New 144×144 tile and 1200×630 social card:** Interim: SVG keycap tile (`play/tiles/typing.svg`) and a rendered card (`play/social/typing.png`). A painted tile is optional polish for Codex.
- **Maintenance cost:** Low. Word lists are static; book sentences are copied from `/read/` (straight apostrophes) and break only if a book slug is renamed — the spec checks every linked book exists.
- **Naming/trademark review:** "Snack Typer" is our brand plus a generic word. Avoided "Dance Mat", "TypingClub", "Nitro".
- **Fit with calm, ad-free, no-sign-in play:** Strong. No timer pressure; speed is shown but stars are for accuracy.
- **Daily mode:** Supported. Eight words plus one story sentence, seeded by the UTC day, recorded on the daily hub.
- **Decision and measurement window:** Ship. Read at 14 school days (~16 Dec) and 28 days: GoatCounter `arcade/typing/start`, `win`, `daily`, time bands and Honduras share; Search Console for "typing practice for kids" style queries after 28 days.
