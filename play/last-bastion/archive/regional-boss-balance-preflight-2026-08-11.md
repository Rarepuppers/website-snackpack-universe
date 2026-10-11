# Regional boss balance preflight — 11 August 2026

## Purpose

Catch impossible mechanics, non-viable finale strategies, density runaway, and major survival
regressions before the five observed threat-tier runs. This is a deterministic simulation preflight,
not player evidence and not final balance sign-off.

## Fixture

- Five seeded samples rotate Marine, Medic, Assault, Tactician, and Scout.
- Representative boss-entry build: level 10, three tier-2 vertical-slice weapons, +2 earned maximum
  health, modest shop-derived health/armour/dodge/regeneration, and two shield points.
- This sits inside the campaign's tested projected boss-entry band of levels 8–20.
- Fixed 50 ms simulation steps, 180-second timeout.

## Strategies

- **The Choir — warning response:** leave the warned pulse radius, then collapse back inside the
  merged flood boundary during cooldown.
- **Foundry Sovereign — core rush:** maintain firing distance and prioritize the command core.
- **Foundry Sovereign — summon control:** prioritize owned drones/turrets, returning fire to the
  core whenever the floor is clear.

## Baseline results

| Boss | Strategy | Wins | Median duration | Median damage taken | Median peak enemies |
|---|---|---:|---:|---:|---:|
| The Choir | Warning response | 4/5 | 56.15 s | 15.00 | 1 |
| Foundry Sovereign | Core rush | 5/5 | 101.95 s | 12.48 | 4 |
| Foundry Sovereign | Summon control | 5/5 | 109.60 s | 6.19 | 3 |

Both Sovereign answers are viable. Summon control takes about eight seconds longer but halves
median incoming damage, which is a meaningful choice rather than a dominant answer. The Choir is
the sharper survival check and remains the primary subject for observed pulse/flood readability.
No tuning was applied from automation alone.

## Automated acceptance

- All Choir samples must expose both collapse and merge transitions.
- Both Sovereign strategies must win at least three of five samples.
- Every strategy must reach at least 60% wins, exceed 20 seconds median duration, finish before the
  180-second timeout, and stay at or below 12 peak live enemies.

Run from `dev/`:

```powershell
npm.cmd run balance:audit:bosses
```

## Remaining observed gate

Record at least five real campaign runs across threat tiers 0–2. Capture hero, route seed, boss,
outcome, boss duration, damage source, chosen Sovereign answer, Choir pulse/flood hits, and one
free-text confusion note. Do not expand the threat ladder or claim final balance before that evidence.
