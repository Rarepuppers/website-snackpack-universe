# World Cup 2026 data

`world-cup-2026.json` is the data source for `/world-cup/bracket/`.

The page can run from this static JSON file, so the site keeps working even if the
automation is unavailable. Update automation writes this file, and the bracket
page recalculates group tables from `matches`.

For live automation, configure a GitHub Actions secret named
`API_FOOTBALL_KEY`. The updater uses API-FOOTBALL's fixtures endpoint when that
secret is present.
