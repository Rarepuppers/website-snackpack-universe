# Last Bastion — product, design and distribution plan

Date: 11 September 2026. **Status: PROPOSAL. Nothing here is implemented.**
Companion to `implementation-plan-2026-09-11.md`, which covers code quality. That document
asks "is this built correctly?" This one asks "is this the right thing to build, and can
anyone find it?"

Read §1 first. It changes what the rest of the plan is for.

---

## 1. The finding that reframes everything

**Last Bastion has no route by which a human being can discover it.**

Verified today, four independent ways:

| Check | Result |
| --- | --- |
| Pages on the site linking to `/play/last-bastion/` | **Zero.** Not one `<a href>` anywhere. |
| Listed in the arcade hub at `/play/` | **No.** The hub links 37 games. This is not one of them. |
| Present in `sitemap.xml` | **No** (119 URLs, none of them this). Fixed today; see §8. |
| Present in `data/arcade-baseline.json` / `game-counts.json` | **No.** |

The URL works. Anyone you send it to can play. But Google has never been told the page
exists, and no visitor to the site can navigate to it. It is reachable only by someone who
already knows the exact address.

Set that against what is behind the URL: **1,642 tests, 152 combat event types, 34 weapons,
38 enemy types, 47 items, 29 world objects, 4 GB of source art, an Electron Steam host with
Steamworks bindings, a SteamPipe config, and a 500 KB engineering log.** This is, by a wide
margin, the most developed thing in the portfolio.

It has been built to a commercial standard and shipped into a sealed room.

I want to be precise about blame, because there is none to assign: this is not a mistake
anyone made, it is a mistake nobody *could* make visibly. There is no error, no failing
test, no red CI. A page with no inbound links looks exactly like a page with inbound links
from the inside. The only symptom is silence, and silence is indistinguishable from "the
game isn't good enough yet" — which is the far more demoralising explanation, and the wrong
one.

**This is also the portfolio's known pattern, repeating.** The August portfolio review found
$0 lifetime revenue across thirteen apps and concluded that the three most content-patched
apps were the three declining fastest, with distribution — not content — as the default
answer. Last Bastion is that finding in its purest form: maximum content investment, zero
distribution investment.

### What follows from this

Every judgement about the *game* made in the last six months rests on no evidence. Nobody
has played it, because nobody could arrive at it. So:

- "Does the first session work?" — unknown.
- "Is 34 weapons too many?" — unknown, and unknowable.
- "Should we build more content?" — **almost certainly not, and this is the one we can
  answer**: more content cannot help a game with no arrival path.

Do not read this as "the work was wasted." The game is real and the engineering is
unusually good. Read it as: the constraint was never the thing being worked on.

---

## 2. Honest assessment of the thing itself

I reviewed the code, not screenshots, so treat visual judgements as provisional.

### Genuinely strong — protect this

- **Engineering discipline is exceptional.** 1,642 tests, zero TODOs in the source, pure
  simulation separated from Phaser, deterministic seeded replay, content catalogues with
  drift guards. I have reviewed commercial games with a fraction of this rigour.
- **Display handling is better than most shipped indie games.** Whole-device-pixel scaling
  with a derived fractional zoom, text rasterised at native density, dpr-change tracking.
  The crisp/fill/expanded-frame model is the correct three-mode answer.
- **The content model is coherent.** Damage types, status buildup, dual armour, weapon
  tiers, transformation paths, threat ladder — these interlock rather than sitting beside
  each other.
- **The documentation culture is real.** Plans carry status banners; the README says which
  docs to trust. That is rarer than the code quality.

### Over-built relative to evidence

- **Content volume.** 34 weapons and 38 enemies is a *late* number for a roguelite, reached
  after the core loop has been validated by players. Reached before, it multiplies the cost
  of every balance change and every art batch by 34 and 38.
- **Documentation volume.** Eighteen `.md` files, ~1.3 MB, including a 500 KB log and a
  176 KB systems model. Planning has outpaced validation. The README exists to tell you
  which of your own documents to believe, which is itself the signal.
- **Steam infrastructure timing.** SteamPipe, Steamworks host, Steam Input manifest and
  achievement plumbing exist. Correct to build eventually; built before there is an
  audience, they are inventory rather than progress. More on this in §5.

### The thing I am most concerned about, after §1

**The game has zero remote telemetry.** No analytics call, no beacon, nothing leaves the
browser. Combined with §1, this means: nobody can arrive, and if they did, you would not
know. Every content decision for six months has been made blind.

This exact gap was closed across the mobile portfolio in August using RevenueCat subscriber
attributes, and it immediately paid out — Brain Games learned that *every* user had one
session and zero games won, which reframed a content patch as a first-session patch. Last
Bastion has no equivalent and needs one before, not after, the next content decision.

---

## 3. Strategy — what this product actually is

The current implicit strategy is "build a great game, then put it on Steam." That fails at
the second step, and it is worth being precise about why.

**Steam does not distribute unknown games. It distributes wishlists.** Visibility at launch
is driven overwhelmingly by wishlist count accumulated *before* launch; the launch-day
algorithmic surfaces are gated on it. A page that goes live with a few dozen wishlists
receives approximately no impressions and cannot recover, because the launch window does not
come back. "Finish the game, then market it" is how technically excellent indie games die.

So the strategy has to invert:

> **The browser game is not a demo of the Steam game. The browser game is the wishlist
> engine, and it is also the only place you can learn anything about the product.**

That reframes the free web build from "a nice thing we also have" to the single most
commercially important asset — and it makes §1 a revenue problem, not a housekeeping one.

Three consequences, in order of how much they change:

1. **Distribution work outranks content work until the funnel measurably exists.** Not
   forever. Until there is traffic.
2. **The web build needs a Steam call-to-action.** Right now a player who loves it has
   nowhere to go. There is no Steam page, no wishlist link, no mailing-list capture.
3. **Steam launch moves behind an audience gate**, not a feature gate. A specific number,
   proposed in §5.

---

## 4. What to do — distribution

This is the top of the plan because it is the binding constraint. Items are ordered by
value per hour.

### D1 — Make the game reachable at all (P0, hours)

- **Sitemap.** Missing entirely. *Fixed today* — see §8.
- **Arcade hub listing.** Add a card at `/play/` linking to the game. It will need a
  different treatment from the 37 casual puzzles: this is a 20-minute roguelite next to
  two-minute solitaire, and burying it in the same grid undersells it. Recommend a
  distinct "Featured" slot above the grid.
- **A real landing page** at `/play/last-bastion/` is currently the game itself — the
  canvas boots immediately. That is correct for players and useless for search: there is no
  indexable text beyond the meta description. Add a proper page with the game embedded or
  one click away, carrying genuine copy: what it is, how it plays, what makes it different,
  screenshots with alt text, a FAQ. This is the single highest-value SEO asset available,
  and it costs no art.
- **Internal links** from the arcade index, the home page, and the site's game-related
  guides. The recorded position is that self-owned links are exhausted — they are not,
  because the biggest self-owned page on the site has never linked here.

### D2 — Give the game a destination for the people who like it (P0, hours)

There is currently no next step for a delighted player. Add, in priority order:

1. **A Steam "Coming Soon" page and wishlist link.** This can and should exist long before
   the game is finished — that is what the page is *for*. Every hour the browser game runs
   without it is wishlist volume permanently lost. This needs a Steamworks account and the
   $100 app fee, which is the one hard cost in this plan and is the best-value spend in it.
2. **An email capture on the debrief screen**, not on the title. Ask after a run, when the
   player has demonstrated interest, never before. The site already has a newsletter CTA
   pattern and a Brevo integration to reuse.
3. **A share affordance on the run summary.** This depends on QA-09's run report and QA-17's
   seeded arena, both of which are now either done or unblocked — the seed is what makes a
   shared run meaningful rather than a screenshot.

### D3 — Go where the audience already is (P1, ongoing)

The site's own reach is small and, per the August measurement, concentrated in two utility
subdomains rather than the games. Browser roguelites, though, have a specific and reachable
audience:

- **r/WebGames, r/incremental_games, r/roguelites** — these subreddits actively want exactly
  this and are among the few places a free browser game still spreads. One good post with a
  GIF is worth more than six months of on-site SEO here.
- **itch.io.** A free browser build on itch is a second storefront, a second discovery
  surface, and a legitimate inbound link from a high-authority domain. The game already
  builds to static files; this is close to zero engineering.
- **Steam Next Fest**, once the Steam page exists. It is the single largest free visibility
  event available to an unknown indie, and it requires a playable demo — which you have.

I should be straight about my own limits here: I cannot create third-party links, post to
communities, or manufacture an audience. What I can do is make every asset those channels
need — the landing page, the copy, the GIF-ready build, the itch packaging, the store text.

### D4 — Learn something (P0, small)

**Add lightweight, privacy-respecting web telemetry** to answer four questions and no more:

1. Do people who land on the page start a run?
2. Do they finish wave 1? Wave 5?
3. Where do runs end, and on what?
4. Do they come back?

Four counters. Not an analytics platform. The site already carries Cloudflare Web Analytics;
the gap is game-level events, and the game already has a rich internal `RunSummary` to draw
from. Every content argument after this point should have to survive contact with these
numbers.

---

## 5. What to do — Steam

**Recommendation: keep the Steam ambition, move the launch behind an audience gate, and
ship the store page immediately.**

- **Create the Steam page now**, with the "Coming Soon" state, in parallel with everything
  else. It is a distribution asset, not a launch artefact.
- **Proposed launch gate: 1,000 wishlists**, or twelve months, whichever is first. A
  thousand is not a guarantee of success — it is roughly the floor below which launch-day
  visibility does not meaningfully engage. Launching under it converts a year of work into a
  dead page you cannot relaunch.
- **Stop adding Steam infrastructure until the page exists.** Steam Input manifests and
  achievement plumbing are finished inventory waiting on a store page that takes an
  afternoon and $100.
- **Price when you get there.** A one-time price, not free-to-play, not a subscription. The
  portfolio's one-time mobile products made Play trials impossible; on Steam a simple price
  has no such trap.
- **Keep the browser version free and current forever.** It is the funnel. Do not cripple it
  to protect the paid build — the wishlist is worth more than the withheld content.

### The display blocker is closed, and should be recorded as such

The August plan lists Steam Deck / 1440p / ultrawide as a release blocker. It is
substantially resolved: `planDisplayPresentation` implements crisp, fill and expanded-frame,
and non-combat routes have a physical-resolution path. Two caveats: `expanded-frame` is
unreachable pending Codex's U3 bezel art (`QA-20`), and none of it has been verified on
actual hardware. Update that plan's banner rather than carrying a closed blocker.

---

## 6. What to do — the game itself

Deliberately shorter than §4. That ordering is the recommendation.

### G1 — The first session is the whole product (P0)

For a free browser game, the first ninety seconds decide everything. A player arrives with
zero investment and one tab already open elsewhere.

- **Measure it first** (D4). Then fix what the numbers show, not what we imagine.
- **Measured 11 September — and the alarming first number was wrong.** An earlier
  draft of this plan reported 46.7 seconds to load combat and called startup a P0
  product defect. **Retracted.** That measurement was taken by driving the in-app
  browser pane, which was hidden; a hidden tab throttles `requestAnimationFrame`,
  and `requestAnimationFrame` is what advances Phaser's loader. The number described
  the instrument, not the game.

  Re-measured with Playwright, which does not throttle its pages
  (`npm run measure:last-bastion`, two consecutive runs):

  | Route | Canvas visible | Assets quiet | Payload |
  | --- | --- | --- | --- |
  | Title | **466 ms** | **490 ms** | 2.2 MB, 22 requests |
  | Combat | **287 ms** | **1,811 ms** | 30.3 MB, 199 requests, 1.27 s of image transfer |

  **Startup is fine.** Under half a second to a rendered title and under two seconds
  to a fully loaded combat scene, on a local server. Thirty megabytes is heavier than
  it needs to be and is worth trimming eventually for players on slow connections —
  but it is a tuning job, not the emergency the retracted figure implied, and it does
  not belong ahead of anything else in this plan.

  The measurement is now a committed test rather than a one-off, so the claim can be
  rechecked instead of re-argued. What it does **not** cover: a real network with
  latency and packet loss, a low-end device, or a cold CDN. "Assets quiet" is a proxy
  for readiness, not a claim about interactivity, because the combat route uses a
  RenderTexture presenter and never sets the readiness flag the other routes do.

  **The lesson worth more than the number: never measure a `requestAnimationFrame`-driven
  loader in a background tab.** I stated the bad figure in this plan, in the running
  log and in a commit message before catching it.

### G2 — Close the presentation gaps that make it read as unfinished (P1)

From `presentation-defect-plan-2026-08-23.md`, rechecked today. These matter
disproportionately because a browser player judges in seconds and does not come back:

- **LB-03 — crates.** Now precisely located: `supply-chest-opened` has an audio cue and *no
  visual*. Crates are not silent, they are invisible. Opening a reward and seeing nothing is
  the worst possible moment to look broken.
- **LB-02 — power-ups cannot be inspected.** A player who cannot read what they picked up
  cannot build intent.
- **LB-11 — level-up cards clip their own text.** The decision screen is where a roguelite
  makes its case; clipped text there is the most visible possible defect.
- **LB-05 / LB-06** — menu title and perk tile overflow. Both need the screenshot matrix
  (QA-04b) before they can be judged or closed.
- The root cause of three of these is the same missing piece: **no measure-then-size layout
  primitive and no single text factory** (presentation plan §5.1/§5.2). Build those two, and
  the defect class closes rather than the instances.

### G3 — Retention, and only the cheap kind (P1)

The game has meta-progression (`ArmoryProgression`, Command Marks) and no reason to return
tomorrow. The rest of the portfolio taught this expensively: active ≈ new means zero
returning users, repeatedly.

- **A daily seeded run.** The single highest-value retention mechanic for this genre and
  nearly free now that QA-17 has made runs seed-addressable. One seed a day, everyone plays
  the same one, a local best. No server required.
- **Do not build leaderboards yet.** They need players to be worth anything, and they need a
  backend. The daily run is the 10% that delivers 90%.

### G4 — Content: stop (P0 as a decision, zero hours)

**Add no new weapons, enemies, bosses, items, relics or heroes until D4 telemetry says
something.** This is the clearest call in the document. 34 weapons and 38 enemies is already
more than most shipped roguelites, every addition multiplies balance and art cost, and there
is currently no evidence that any of it is reaching a person.

The existing content backlogs in `last-bastion-content-design-plan-2026-08-07.md` should be
explicitly parked — not deleted, banner-ed — so the next session does not pick them up by
default.

---

## 7. What to remove, park or simplify

Honest subtractions, since you asked for them:

- **Park the content design plan's proposals.** Add a banner. See G4.
- **Park asset batches 76–89** in the asset queue. Codex's next art should serve the
  *landing page and store page* — screenshots, a header capsule, a GIF — not more enemies.
  This is the highest-value art request available and it is currently nowhere in the queue.
- **Retire or archive `last-bastion-model.md` (176 KB) and prune the 500 KB log.** Both
  describe intent that the code now supersedes. The README already warns that the design
  docs predate the content; that warning is a maintenance cost paid on every read.
- **Demote QA-06**, the 10,412-line/5,740-line split. Already done in the companion plan;
  restating it because it is the largest single piece of work anyone could pick up next and
  it would produce no player-visible value.
- **Do not build the achievement set (6 → 28)** until the Steam page exists.

---

## 8a. Implementation status — 11 September 2026

Your decisions: Steam parked (not ready, no account), content freeze accepted,
telemetry accepted at the conservative posture, Codex's next art redirected to store and
landing assets. Everything Steam-related in §3 and §5 is therefore **parked, not cancelled**
— the wishlist-engine argument holds whenever a Steam page does exist, and the browser build
is still the funnel.

| Item | State |
| --- | --- |
| D1 sitemap | **Done.** `/play/last-bastion/` and the new guide are both in. |
| D1 arcade tile | **Done.** Heads the `/play/` grid. Root-relative href so the rotation parser and arcade count stay correct; verified both. |
| D1 landing page | **Done** as `/guides/free-browser-roguelite/`, following the site's guide pattern, linked from the guides index and linking back to the game. Real prose — this is the only indexable text the game has ever had. |
| D1 tile art | Studio placeholder, recorded in `play/tiles/PLACEHOLDERS.txt` for Codex. |
| D4 telemetry | **Instrumented, dormant.** See below. |
| D2 Steam CTA | **Parked** with the rest of Steam. |
| G4 content freeze | **Accepted.** Banners still to add to the content design plan. |

### D4 — what shipped, and the one step left

`telemetry/PlayerFunnel.ts` and `telemetry/FunnelTransport.ts` implement the four questions
and nothing else, wired into boot, combat start, wave 1 and 5, and run end. Session-scoped
across page loads, because the game is a multi-page app and a per-page counter would have
reported four "opens" for one visitor.

The privacy posture is a documented contract, not a description: no visitor id, no
fingerprint, no session token, no URL, no referrer, no timestamp finer than a local calendar
day, no free text. Outcomes are coarse buckets — `wave-5-9`, never `7` — and a test asserts
every value sent comes from a closed vocabulary. A corrupt wave count lands in the
*shallowest* bucket, so bad data can never flatter the number we are trying to raise.

**It is dormant.** Cloudflare Web Analytics, which the site already loads, has no event model
at all, so it cannot answer any of the four questions. A second, event-capable endpoint is
needed and choosing one is a privacy decision on a family-facing site. Verified in a browser:
no third-party script is injected and nothing is sent. The remaining step is:

1. Create a free GoatCounter site — no cookies, no personal data, no consent banner, which
   is why it is the recommendation.
2. Put the code in `SITE_CODE` in `FunnelTransport.ts`.
3. Disclose it on `/privacy/` before shipping, not after.

This is deliberately **not** local-only telemetry. That trap has already been sprung once in
this portfolio, in app7, where counters nobody could read made "measure then decide" dead
on arrival. A counter nobody can read never changes a decision.

---

## 8. Already done today

Before writing this I fixed the cheapest, most consequential item, because leaving it
another day had a real cost:

- **`sitemap.xml` now contains `/play/last-bastion/`.** One five-line entry, inserted by
  hand rather than by regenerating, because a full regeneration would have stamped today's
  date onto three unrelated pages left dirty in the working tree — the exact "inflated
  lastmod" defect that commit `5bd77110` was written to fix.

Everything else in this document is a proposal awaiting your decision.

---

## 9. Recommended sequence

**Now, this week — distribution and measurement. No game features.**

1. Arcade hub card + internal links + a real indexable landing page (D1).
2. Web telemetry: the four counters (D4).
3. ~~Steam "Coming Soon" page (D2).~~ **PARKED** — the game is not ready for Steam and
   there is no account. The wishlist-engine argument in §3 keeps until there is one.
   The email capture and the share affordance from D2 survive the parking and are the
   remaining "destination for a player who liked it".
4. ~~Startup time (G1).~~ **Measured and closed** — 466 ms to title, 1.8 s to combat.
   The 46.7 s figure that put this here was a measurement artefact; see G1. Trimming
   the 30 MB payload stays on the list, well below everything else.

**Next — make the first session survive contact.**

5. Read the telemetry. Decide from it.
6. Presentation: measure-then-size primitive and text factory, then LB-03, LB-02, LB-11 (G2).
7. QA-04b's screenshot matrix; close LB-05 and LB-06.
8. Daily seeded run (G3).
9. itch.io build; one honest post to r/WebGames with a GIF (D3).

**Then, and only with numbers in hand.**

10. Content, balance, heroes — whatever the data actually asks for.
11. Steam launch, at the wishlist gate (§5).

---

## 10. What I need from you

Four decisions. Everything above is reversible; these are the ones I should not make alone.

1. **Do you want the Steam page now?** It costs $100 and an afternoon, and it is the highest-
   leverage item in this plan. I cannot create the account or pay the fee.
2. **Do you accept the content freeze (G4)?** It parks a large amount of designed-but-unbuilt
   work. I think it is clearly right; it is still your call.
3. **Telemetry — how privacy-conservative?** The site is family-facing and the privacy pages
   make specific claims. I would default to anonymous counters with no identifiers, which is
   both defensible and sufficient for the four questions. Confirm and I will match the
   existing disclosures.
4. **Is Codex's next art batch the store and landing assets?** That is a redirection of the
   asset queue, and the queue is Codex's territory, not mine.

## 11. One closing note

I have spent this session finding things that were wrong, which makes for a lopsided
document. So, plainly: the engineering here is better than it needs to be, and better than
most of what ships. The problem is not quality and never was. The problem is that a very good
game has been kept in a room with no door — and that is a substantially easier problem than
the one it has probably felt like.
