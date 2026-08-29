# Water Sort release scorecard

- **Game and public name:** Water Sort. Page title expands this to “Play Water Sort Online Free” for the play-intent query while keeping the familiar two-word name in the arcade.
- **Independent name-search evidence and date:** Search review on 29 August 2026 found dedicated results for “water sort game,” “water sort puzzle,” “play water sort online free,” “water sort strategy” and “water sort no ads.” Competitors consistently use *Water Sort* or *Water Sort Puzzle*, confirming the public vocabulary.
- **Competition assessment:** Competitive but fragmented. Many results are thin game portals or ad-supported apps. The useful differentiation is explicit: guaranteed-solvable construction, no extra-tube gate, no forced ads, daily seeded boards, local resume, unlimited undo and non-colour patterns.
- **Source engine and test coverage:** Rules and four difficulty sizes follow the existing Snackpack Brain Games Vol 2 implementation. The web generator starts solved and applies only reversible moves, preserving a constructive solution. Playwright covers deterministic daily generation, legal/illegal pours, undo, refresh resume, patterns and representative desktop/mobile screenshots.
- **Web interaction and accessibility risks:** The board can wrap differently by viewport and twelve colours are not safely distinguishable by hue alone. Tubes are semantic buttons with roving arrow-key navigation, full accessible labels, visible focus, large touch targets and optional patterns.
- **Existing art to reuse:** Canonical Water Sort icon from `apps/snackpack-brain-games-vol-2/assets/game-icons/water-sort.png`.
- **New 144×144 tile and 1200×630 social card:** `play/tiles/water-sort.png` and `play/social/water-sort.png`, both complete and checked at exact dimensions.
- **Maintenance cost:** Low. Vanilla HTML/CSS/JS with shared audio, resume, keyboard, daily, sharing, funnel and theme helpers. Procedural boards need no content pack.
- **Naming/trademark review:** “Water Sort” is descriptive genre vocabulary used broadly by unrelated publishers; no distinctive competitor subtitle or visual identity is copied.
- **Fit with calm, ad-free, no-sign-in play:** Strong. Untimed logic, unlimited undo, no lives, no forced video, local-only persistence and optional audio.
- **Daily mode:** Supported. Date plus difficulty creates a deterministic seed, and daily completion feeds the shared streak hub.
- **Decision and measurement window:** Ship as the first new-game pilot. Review Search Console impressions/click-through, `/go/arcade/water-sort/braingames2/` outbound clicks and Water Sort’s share/resume use after 28 days before commissioning further ports.
