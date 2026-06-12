# World Cup data automation

The bracket page at `/world-cup/bracket/` reads `data/world-cup-2026.json`.
That means scores and fixtures can update without editing HTML.

## Recommended setup

Use API-FOOTBALL by API-SPORTS for automated fixture and score updates.

1. Create an API-FOOTBALL account.
2. Get an API key.
3. In GitHub, open this website repo.
4. Go to Settings -> Secrets and variables -> Actions.
5. Add a repository secret:
   - Name: `API_FOOTBALL_KEY`
   - Value: your API key
6. Optional repository variables:
   - `API_FOOTBALL_LEAGUE_ID` defaults to `1`
   - `API_FOOTBALL_SEASON` defaults to `2026`

The workflow `.github/workflows/update-world-cup-data.yml` runs every 30 minutes
and can also be run manually from the Actions tab. It commits changes to
`data/world-cup-2026.json` when fixtures or scores change.

## Why not Google?

Google results pages are not a stable or permitted data API. Scraping them would
be brittle and risky. FIFA has official pages, but no stable public no-key API
that should be depended on for a static site automation.

If you want strictly official/licensed data, use a paid/licensed sports data
provider and we can add a second adapter for it.

## Manual fallback

If the API key is missing or the provider is unavailable, the update script keeps
the existing JSON and exits without breaking the site.
