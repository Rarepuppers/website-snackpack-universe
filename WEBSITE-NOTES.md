### `website-notes.md`

```md
# WEBSITE-NOTES.md

This file applies only to:

`website-snackpack-universe/`
porkbun domain www.snackpackuniverse.com
repo linked to https://github.com/Rarepuppers/snackpack-universe

The SnackPack website is separate from the apps, but should stay aligned with the current product lineup.

---

## Purpose

Use the website for:

- marketing
- support
- privacy policies matches both apple ios and google playstore requirements
- legal pages
- app discovery
- newsletter signup
- brand presence

---

## Core Rules

- Keep app names current.
- Remove unreleased apps unless intentionally listed as coming soon.
- Match branding, logos, tone, and colors used across apps.
- Ensure all store links and support links work.

---

## Must Stay Updated

- homepage app lineup
- privacy policy links
- support contact info
- footer links
- legal pages
- screenshots / artwork
- app descriptions

---

## Newsletter Signup (Brevo)

### Always use HTML embed, never iframe.

Reason:

- iframe embeds can fail under CSP on static hosts like GitHub Pages.
- May appear locally but fail live.

### Use:

- HTML form embed
- Brevo CSS in `<head>`
- Brevo JS before `</body>`

### Keep Required Hidden Fields

- `email_address_check`
- `locale`

Do not replace Brevo logic with custom fetch unless intentionally rebuilding the flow.

---

## Hosting Rules

- Test production build, not only localhost.
- Check mobile responsiveness.
- Check CSP / external scripts.
- Validate forms after deployment.

---

## SEO Basics

Each page should have:

- unique title
- meta description
- open graph image
- clean headings
- working canonical links if used

---

## Performance

- Compress images
- Lazy load large media where practical
- Avoid excessive scripts
- Keep pages fast on mobile

---

## Legal

Every released app should have:

- privacy policy page links to www.snackpackuniverse.com/privacy
- support contact path
- accurate company / publisher info if needed

---

## Final Check Before Publish

- no broken links
- no placeholder copy
- no outdated lineup
- forms work
- mobile layout works
- policies open correctly


# Learned Lessons — Website

## Brevo Newsletter Signup Embedding
- **Always use the HTML form embed, never the iframe embed**
- The iframe is blocked by browser Content Security Policy (CSP) when served from GitHub Pages (and most static hosts) — it renders as a blank line on the live site but works locally, making it hard to diagnose
- Brevo provides three embed options: Link, iFrame, and HTML form — always choose **HTML form**
- Found under: Brevo → Contacts → Forms → Your Form → Share → "HTML form" tab
- The HTML form posts directly to Brevo's endpoint via `method="POST" action="https://...sibforms.com/..."` — no CORS issues, works on any static host
- Include Brevo's stylesheet in `<head>`: `<link rel="stylesheet" href="https://sibforms.com/forms/end-form/build/sib-styles.css">`
- Include Brevo's JS before `</body>`: `<script defer src="https://sibforms.com/forms/end-form/build/main.js"></script>`
- Required hidden fields: `email_address_check` (empty, honeypot) and `locale`
- Brevo's JS handles validation, the loading spinner, and success/error message display — do not replace this with a custom fetch() implementation
