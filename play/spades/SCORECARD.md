# Spades — new game scorecard

- **Game and public name:** Spades (`/play/spades/`). Public-domain partnership card game; the name is generic.
- **Independent name-search evidence and date:** 2026-10-17. One of the most-searched card games in the US; no measured figure was available in this session. Review real demand after 28 days.
- **Competition assessment:** Crowded with ad-heavy and sign-in sites. The angle: calm, no ads, no sign-in, offline, daily deal, a computer partner.
- **Source engine and test coverage:** Ported from Brain Games Vol 1's `components/games/spades/engine.ts` (bidding, spades trump and broken, nil, bags, partnership scoring). 1,500 all-computer games / 26,530 rounds in Node: 13 tricks every round, no illegal plays, every game ends. Played end to end in Playwright at both widths with resume. Two deliberate differences from the app: a computer seat that bids nil now plays low and ducks (the app's AI played to win tricks even on a nil), and a tie at or past the target plays another round instead of awarding it to your team.
- **Web interaction and accessibility risks:** Bids and cards are buttons with full names; the suggested bid is marked; unplayable cards disabled. Written keyboard waiver.
- **Existing art to reuse:** Painted suit icons, CSS cards.
- **New 144×144 tile and 1200×630 social card:** Interim composites; final art briefed to Codex.
- **Maintenance cost:** Low.
- **Naming/trademark review:** Generic name.
- **Fit with calm, ad-free, no-sign-in play:** Strong.
- **Daily mode:** Supported — every round's deal seeded from the date.
- **Decision and measurement window:** Ship. Review after 28 days with `/go/arcade/spades/braingames/` clicks.
