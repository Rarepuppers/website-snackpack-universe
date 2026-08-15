# App 7 (Mathematics) — website launch checklist

Prepared 2026-08-15, while app7 was in Play review with production expected
around 2026-08-22. This exists because R3 of `SITE-IMPROVEMENT-PLAN.md` found
that a launch touches **nine** separate places on this site, and the count-drift
history (P6, P8, and the fourth stale count found on 2026-08-14) is what happens
when a multi-place update is done from memory on the day.

Everything below was verified against how the twelve already-live apps are
wired, not assumed. Snippets are ready to paste.

**Package id:** `com.snackpackuniverse.mathematics`
(from `apps/snackpack-7-mathematics/app.json`, `android.package`)

**Store URL, already carrying the R2 attribution tag:**

```
https://play.google.com/store/apps/details?id=com.snackpackuniverse.mathematics&referrer=utm_source%3Dwebsite%26utm_medium%3Dapp-page%26utm_campaign%3Dsnackpack-7-mathematics
```

You do not need to hand-write that tag. Paste the plain
`https://play.google.com/store/apps/details?id=com.snackpackuniverse.mathematics`
and run `node scripts/build-play-links.mjs` — it derives the surface and
campaign from the file path. The tag above is shown so you can recognise a
correct result.

---

## Do not start until the listing is actually live

Every step here puts "live on Google Play" copy and a real store link on the
public site. Publishing any of it while the app is still in review means the
site asserts something untrue and links somewhere that 404s. **Check the Play
listing resolves in a browser first**, then work down the list.

---

## 1. App page — `apps/snackpack-7-mathematics/index.html`

Currently framed as a pre-launch preview, which is correct today. Three changes:

**a) Hero eyebrow and install button.** Line ~91 reads:

```html
<span class="eyebrow">App 7 · Pre-launch preview</span>
```

Change to `App 7 · Live on Google Play`, and add the store badge below the hero
`<p class="lead">`, matching Garden World's pattern exactly:

```html
<div class="stack-inline">
  <a class="store-badge-link" href="https://play.google.com/store/apps/details?id=com.snackpackuniverse.mathematics" target="_blank" rel="noopener" aria-label="Get SnackPack Mathematics on Google Play">
    <img class="store-badge" src="../../assets/google-play-badge.svg" alt="Get it on Google Play" width="200" height="60" loading="lazy" decoding="async">
  </a>
</div>
```

**b) `SoftwareApplication` schema.** The page has none; all twelve live app
pages carry one. Add in `<head>`, modelled on Garden World's:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "SnackPack Mathematics",
  "applicationCategory": "EducationalApplication",
  "operatingSystem": "Android",
  "description": "SnackPack Mathematics is live on Google Play — character-led maths practice for ages 8–12 with 2,790 questions, 645 game rounds, 560 riddles, 86 story books and hands-on Math Lab activities across Grades 3–6.",
  "url": "https://play.google.com/store/apps/details?id=com.snackpackuniverse.mathematics",
  "downloadUrl": "https://play.google.com/store/apps/details?id=com.snackpackuniverse.mathematics",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "availability": "https://schema.org/InStock" },
  "publisher": { "@type": "Organization", "name": "SnackPack Studios", "url": "https://www.snackpackuniverse.com/" }
}
</script>
```

Note the two Play URLs in this block are **schema identity, not click targets** —
`build-play-links.mjs` skips JSON-LD deliberately and will leave them untagged.
That is correct; do not "fix" it.

**c) "Coming to Google Play" copy.** Three places still say pre-launch:

| Line | Current |
|---|---|
| 6 | `<meta name="description">` ends "Coming to Google Play." |
| 10 | `og:description` ends "Coming to Google Play." |
| ~145 | `<span class="eyebrow">Pre-launch access</span>` + "The app is ready for its final Google Play steps." |

Rewrite to live phrasing. Keep the meta description under ~160 characters and
lead with what it *is*, not that it launched — "Now live" in a meta description
spends the most valuable characters on news that stops being news in a week.

---

## 2. `apps/index.html` — the card

Around line 840. Change the tag row's `Pre-launch` tag to a live marker and add
the store link to `app-actions`:

```html
<div class="tag-row"><span class="tag">Grades 3–6</span><span class="tag">No ads</span></div>
<div class="app-actions"><a class="text-link" href="./snackpack-7-mathematics/">View app page</a><a class="text-link" href="../privacy/snackpack-7-mathematics/">Privacy</a><a class="text-link" href="https://play.google.com/store/apps/details?id=com.snackpackuniverse.mathematics" target="_blank" rel="noopener">Google Play</a></div>
```

Live apps also carry a `meta-tag meta-tag--live` pill (`● Live on Google Play`)
in the featured layout — apply it if app7 gets a featured card, skip if it stays
in the compact grid.

---

## 3. Homepage — `index.html`

Two places:

- **Line ~311**, hero eyebrow: `Now live — 12 apps on Google Play` → **13**.
- **Line ~822**, the `#pipeline` timeline card still describes app7 as a
  "Pre-launch preview". Either rewrite it as shipped or move the card out of the
  roadmap section, depending on how that section reads once app7 leaves it.

---

## 4. `llms.txt`

**This is the file three consecutive audits missed** (P2, P6, P8), for the
documented reason that every audit greps `--include=*.html`. Two edits:

- **Line 24** opens "Six more apps are planned or in progress and not yet
  live: Tales & Trivia, Creative Studio, **Mathematics**, …". Remove Mathematics
  and change six → five.
- **Line 80** repeats the same list under Reference. Same edit.

Then add Mathematics to the live-apps section with billing language matching the
app page — it has an optional one-time Pro unlock, so the accurate phrasing is
the one already used elsewhere: *free to download, no ads; optional one-time
purchase unlocks the full library*. **Do not write "no in-app purchases"** —
that exact false claim is what the June 2026 audit existed to remove.

---

## 5. Counts

`data/game-counts.json` only declares Brain Games Vol 1–3, and app7 is not a
game volume, so **no change is needed** unless you add a `data-game-count`
marker for it. If you do, run `node scripts/build-game-counts.mjs` — never
hand-type the number.

---

## 6. Attribution

```bash
node scripts/build-play-links.mjs
```

Tags every new Play link with the correct surface and campaign. Then confirm:

```bash
node scripts/build-play-links.mjs --check
```

---

## 7. Verify, then deploy

```bash
node scripts/check-site.mjs
```

Then build the sitemap and push:

```bash
node scripts/build-sitemap.mjs
```

After the deploy lands:

```bash
node scripts/check-live.mjs
```

`check-site.mjs` validates the repo against itself, so it cannot catch a file
that was built but never committed — that is exactly how P7 shipped two 404s.
`check-live.mjs` is the one that asks the deployed origin.

---

## 8. Search Console

- Resubmit `sitemap.xml`.
- Run URL inspection on `/apps/snackpack-7-mathematics/` and request indexing.

Worth doing deliberately rather than waiting: per R4, Google last downloaded the
sitemap on 2026-08-11 and `/play/thirteen/` went 21 days without a recrawl. This
site does not get crawled on its own schedule quickly.

---

## 9. Store release notes

Per the standing rule, update `apps/snackpack-7-mathematics/store/release-notes/en-US.txt`
(≤500 characters) and commit it as part of finishing the launch — not as a
separate follow-up, and not only reported in chat.

---

## Verified clean — no action needed

Checked while preparing this, so nobody re-checks them on the day:

- **`privacy/snackpack-7-mathematics/` is already correct.** It carries the same
  eight RevenueCat/purchase disclosures as `snackpack-11-prehistoric-pals`, the
  reference page. This is the P5 bug class (Zoo World and Garden World both
  claimed billing was not enabled when it was) and app7 does **not** have it.
- **No false "no in-app purchases" claim** anywhere on the app page or its
  privacy page.
- The privacy page, its data-deletion page, and the `/privacy/` index entry all
  already exist and resolve.
