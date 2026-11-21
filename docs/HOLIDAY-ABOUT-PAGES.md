# Holiday About pages

The [editorial plan](https://github.com/Rarepuppers/snackpack-universe/blob/main/docs/reads-events-bookshelf/EVENT-ABOUT-PAGES.md) sets the audience, source and community-review guidance. The website’s source is [read-event-about.json](../data/read-event-about.json). The event builder renders each page at `/read/events/<id>/about/`.

The [Christmas](../read/events/christmas/about/index.html) and [Easter](../read/events/easter/about/index.html) pages were the pilots. The published set also includes [New Year](../read/events/new-year/about/index.html), [Lunar New Year](../read/events/lunar-new-year/about/index.html), [Ramadan and Eid al-Fitr](../read/events/ramadan/about/index.html), [Diwali and Deepavali](../read/events/diwali/about/index.html), [Hanukkah](../read/events/hanukkah/about/index.html) and [Thanksgiving](../read/events/thanksgiving/about/index.html).

Each page uses existing Codex portraits. The speaker’s name and thumbnail form one link to the character’s profile. Fun facts and answer choices use native disclosures so readers can open them by touch or keyboard with JavaScript disabled. Learn more links identify the source or related story.

## Publication and review

- Review each page’s wording, traditions, date explanation, sources and pictures with the communities represented. Keep the review record and credit reviewers only with their permission.
- Use `publishedOn` for editorial approval to publish. Its ISO date enables indexing and links the page from Holidays and events and from the event landing page where one exists. Record completed community review separately in `review` with its ISO date and public scope. The November launch has editorial approval. Community review is pending.
- Regenerate the event pages, breadcrumbs and sitemap. Review any sitemap or breadcrumb changes outside the affected routes before staging. Check the new public link, character profiles, mobile layout, keyboard interaction and reading with JavaScript disabled.

```sh
node scripts/build-read-events.mjs
node scripts/build-breadcrumbs.mjs
node scripts/build-sitemap.mjs
node scripts/build-read-events.mjs --check
node scripts/check-site.mjs
```
