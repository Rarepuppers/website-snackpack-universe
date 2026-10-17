"""Import a free SnackPack ABC featured story into /read/ as a read-aloud picture book.

    python scripts/import-abc-story.py                                        # dry run
    python scripts/import-abc-story.py --id=ted-e-bear-pocketful-of-sounds --write

Nothing here writes prose or art. Title, subtitle, page titles and text, each
page's sound-to-find (letterHook) and say-it-together line (readAloud), and the
opening question with its answer (introPrompt / revealText) all come verbatim
from apps/snackpack-1-abcs-alphabet/constants/curatedFeaturedStories.ts. Page
art resolves the way the app's reader does it: getMiniStoryHeroArtwork(id,
pageIndex) in constants/miniStoryHeroArtwork.ts; the cover comes from
constants/miniStoryCovers.ts. Images are WebP in the app, so they are written
as JPEG for the PDF builder. The only web editorial is BOOKS below: the public
slug, a one-line lead, the shelf blurb and alt text written from the pictures.

Like import-counting-book.mjs, each entry pins the image files it was
quality-read against. If the app maps a different file to a page, the import
refuses until someone views the new picture and updates `art` and `alts`.

Quality read, 2026-10-17: ted-e-bear-pocketful-of-sounds passes. Its seven
missing pages and the off-model page 3 were drawn by Codex (monorepo
docs/ART-BRIEF-STORY-GAPS-2026-10-16.md, delivered 3572e1a31); Ted and Corgi
match the cover on all eight pages, and every picture shows its own page.

Then: build-webp.mjs, build-read-pdfs.mjs --slug=<slug> --write, add to SHELF in
build-read-shelf.mjs (group "more"), build-read-shelf.mjs, build-read-responsive.mjs,
build-read-social-cards.py, build-breadcrumbs.mjs, build-play-links.mjs,
build-go-links.mjs, build-sitemap.mjs.
"""
import html
import json
import os
import re
import sys

from PIL import Image, ImageOps

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
APP = os.path.join(ROOT, "..", "apps", "snackpack-1-abcs-alphabet")
SITE = "https://www.snackpackuniverse.com"
PLAY = "https://play.google.com/store/apps/details?id=com.snackpackuniverse.abcalphabet"

BOOKS = {
    "ted-e-bear-pocketful-of-sounds": {
        "slug": "ted-e-bear-and-the-pocketful-of-sounds",
        "lead": "An eight-page read-aloud story about a nervous reader who learns to begin with one small sound.",
        "blurb": "Ted must read the picnic welcome, and every word looks enormous. Corgi helps him listen for the first sound.",
        "ages": [4, 6],
        "cover": "ted-e-bear-pocketful-of-sounds.webp",
        "art": ["ted-e-bear-pocketful-of-sounds-p%d.webp" % i for i in range(1, 9)],
        "alts": [
            "Ted-E-Bear, in a green waistcoat and red neckerchief, holds a large welcome card beside the picnic gate, looking worried.",
            "Ted-E-Bear sits on a log folding the card into his pocket while Corgi-on-the-Cob sits close beside him.",
            "Ted-E-Bear holds up a pinecone on a woodland path scattered with pinecones and pebbles while Corgi sniffs the ground.",
            "Ted-E-Bear and Corgi lean on a little wooden bridge as golden leaves drift down onto the creek.",
            "Ted-E-Bear gazes at a picnic sign swinging in the breeze while Corgi sits beside him in the long grass.",
            "Ted-E-Bear stands by the bun table, one paw on his pocket, as the shadows of guests gather beyond the gate and Corgi leans in.",
            "Ted-E-Bear holds up the welcome card in front of rabbits, a hedgehog, squirrels and ducklings, with Corgi sitting at his side.",
            "Ted-E-Bear cheers with the card in his paw as Corgi leaps beside him and the picnic friends clap.",
        ],
    },
}


def esc(s):
    return html.escape(s, quote=True)


def curly(s):
    s = re.sub(r"(^|[\s(—])'", "\\1\u2018", s).replace("'", "\u2019")
    return re.sub(r'(^|[\s(—])"', "\\1\u201c", s).replace('"', "\u201d")


def sfield(blk, name):
    m = re.search(r"\b" + name + r":\s*'((?:[^'\\]|\\.)*)'", blk) or re.search(r"\b" + name + r':\s*"((?:[^"\\]|\\.)*)"', blk)
    return re.sub(r"\\(.)", r"\1", m.group(1)) if m else None


def parse(book_id):
    src = open(os.path.join(APP, "constants", "curatedFeaturedStories.ts"), encoding="utf-8").read()
    i = src.find("id: '%s'" % book_id)
    if i < 0:
        raise SystemExit("%s: not found in curatedFeaturedStories.ts" % book_id)
    j = src.find("\n  },\n", i)
    blk = src[i:j]
    head, pages_src = blk.split("pages: [", 1)
    pages = []
    for pg in re.findall(r"\{\s*\n\s*title:.*?\n\s*\},?", pages_src, re.S):
        hook = re.search(r"letterHook:\s*\{\s*letter:\s*'([^']*)',\s*word:\s*'([^']*)'\s*\}", pg)
        pages.append({"title": sfield(pg, "title"), "body": sfield(pg, "body"), "say": sfield(pg, "readAloud"),
                      "letter": hook.group(1) if hook else None, "word": hook.group(2) if hook else None})
    return {"title": sfield(head, "title"), "subtitle": sfield(head, "subtitle"), "intro": sfield(head, "introPrompt"),
            "reveal": sfield(head, "revealText"), "free": "isFree: true" in head, "pages": pages}


def art_files(book_id, n):
    src = open(os.path.join(APP, "constants", "miniStoryHeroArtwork.ts"), encoding="utf-8").read()
    i = src.find("'%s': {" % book_id)
    blk = src[i:src.find("},", i)] if i >= 0 else ""
    m = dict((int(k), f) for k, f in re.findall(r"(\d+):\s*require\('\.\./assets/story-heroes/([^']+)'\)", blk))
    return [m.get(k) for k in range(n)]


def check(book_id):
    ed, book = BOOKS[book_id], parse(book_id)
    problems = []
    if not book["free"]:
        problems.append("Pro in the app; free books only unless Mark approves")
    files = art_files(book_id, len(book["pages"]))
    if len(ed["alts"]) != len(book["pages"]):
        problems.append("%d pages but %d alt texts" % (len(book["pages"]), len(ed["alts"])))
    for k, f in enumerate(files):
        if not f or not os.path.exists(os.path.join(APP, "assets", "story-heroes", f)):
            problems.append("page %d has no art" % (k + 1))
        elif f != ed["art"][k]:
            problems.append("page %d art is %s, reviewed %s: view it, then update art and alts" % (k + 1, f, ed["art"][k]))
    if any(not p["body"] or not p["say"] or not p["letter"] for p in book["pages"]):
        problems.append("a page is missing its body, readAloud or letterHook")
    return ed, book, files, problems


def save_jpg(src, dst, size):
    ImageOps.fit(Image.open(src).convert("RGB"), size, Image.LANCZOS).save(dst, "JPEG", quality=84, optimize=True, progressive=True)


def render(book_id, ed, book, template):
    shared = template[template.index("<!-- pwa:generated -->"):template.index("</head>")]
    header = template[template.index('<header class="topbar">'):template.index("<main>")]
    slug, n = ed["slug"], len(book["pages"])
    url = "%s/read/%s/" % (SITE, slug)
    title = curly(book["title"])
    lo, hi = ed["ages"]
    letters = ", ".join(p["letter"] for p in book["pages"])
    cards = []
    for i, p in enumerate(book["pages"], 1):
        cards.append(
            '<article class="story-page-card" id="page-%d"><img src="./pages/page-%d.jpg" alt="%s" loading="lazy" width="1200" height="800">'
            '<div class="story-page-copy"><span>Page %d of %d · %s</span><p>%s</p>'
            '<aside><strong>Sound to find:</strong> %s, as in <em>%s</em>.<br><strong>Say it together:</strong> %s</aside></div></article>' % (
                i, i, esc(ed["alts"][i - 1]), i, n, esc(curly(p["title"])), esc(curly(p["body"])),
                esc(p["letter"]), esc(p["word"]), esc(curly(p["say"]))))
    ld = json.dumps({
        "@context": "https://schema.org", "@type": "Book", "name": title,
        "author": {"@type": "Organization", "name": "SnackPack Studios"},
        "isAccessibleForFree": True, "educationalLevel": "Ages %d-%d" % (lo, hi), "learningResourceType": "Read-aloud picture book",
        "about": "Listening for first sounds: " + letters, "image": url + "pages/cover.jpg", "url": url,
    }, ensure_ascii=False, separators=(",", ":"))
    first, _, rest = title.partition(" and ")
    h1 = ("%s<br>and %s" % (esc(first), esc(rest))) if rest else esc(title)
    return """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>%(title)s | Free Read-Aloud Picture Book</title>
<meta name="description" content="%(desc)s">
<link rel="canonical" href="%(url)s">
<meta property="og:title" content="%(title)s"><meta property="og:description" content="%(blurb)s"><meta property="og:url" content="%(url)s"><meta property="og:type" content="book"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon-32.png"><link rel="preload" href="/assets/fonts/dmsans-ed656a5d.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/assets/fonts/fraunces-36024e18.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/assets/fonts/fonts.css"><link rel="stylesheet" href="../../site.css">
<script type="application/ld+json">%(ld)s</script>
<!-- breadcrumbs:generated -->
<!-- /breadcrumbs:generated -->
%(shared)s</head>
<body class="story-reader-page story-long-copy">
%(header)s<main>
<section class="story-title-section"><div class="shell story-title-grid"><div><span class="eyebrow">Read-aloud story · First sounds · Free</span><h1>%(h1)s</h1><p class="lead">%(lead)s</p><div class="tag-row"><span class="tag">Ages %(lo)d–%(hi)d</span><span class="tag">Listening for first sounds</span><span class="tag">Read together</span></div><a class="btn btn-primary" href="#page-1">Begin the story</a></div><img src="./pages/cover.jpg" alt="%(cover_alt)s" width="768" height="1152"></div></section>

<section class="story-pages story-pages-landscape" aria-label="Story pages">
%(cards)s
</section>

<section><div class="shell story-finish-card"><span class="eyebrow">The end · Great listening</span><h2>%(intro)s</h2><details class="story-answer"><summary>Talk about the answer</summary><p>%(reveal)s</p></details><p>SnackPack ABC &amp; Alphabet has more read-together stories, letter tracing and first-sound games.</p><!-- read-next:generated -->
<!-- /read-next:generated --><div class="stack-inline"><a class="btn btn-primary" href="%(play)s" target="_blank" rel="noopener">Get the app on Google Play</a><a class="btn btn-secondary" href="../../apps/snackpack-1-abcs-alphabet/">Explore the app</a><a class="btn btn-secondary" href="./%(slug)s.pdf" download>Print this book (PDF)</a><a class="btn btn-secondary" href="../">Back to the bookshelf</a></div></div></section>
</main>
<footer class="foot"><div class="shell foot-wrap"><p class="foot-note">Story and illustrations from SnackPack ABC &amp; Alphabet.</p><div class="footer-links"><a class="text-link" href="../">Bookshelf</a><a class="text-link" href="../../privacy/snackpack-1-abcs-alphabet/">Privacy</a></div></div></footer>
  <!-- Cloudflare Web Analytics -->
  <script defer src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "0e57cfb3eb86422ca40e5fac02b1cf94"}'></script>
  <!-- End Cloudflare Web Analytics -->
</body></html>
""" % {
        "title": esc(title), "url": url, "blurb": esc(ed["blurb"]), "ld": ld, "shared": shared, "header": header,
        "desc": esc("Read %s, a free %d-page illustrated read-aloud story for ages %d to %d about listening for first sounds (%s). Printable PDF included." % (title, n, lo, hi, letters)),
        "h1": h1, "lead": esc(ed["lead"]), "lo": lo, "hi": hi, "cover_alt": esc("%s book cover." % title), "cards": "\n".join(cards),
        "intro": esc(curly(book["intro"])), "reveal": esc(curly(book["reveal"])), "play": PLAY, "slug": slug,
    }


def main():
    write = "--write" in sys.argv
    only = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--id=")), None)
    if only and only not in BOOKS:
        raise SystemExit("unknown --id=%s" % only)
    if write and not only:
        raise SystemExit("--write needs --id=<id>, one book at a time")
    failed = False
    for book_id in [only] if only else list(BOOKS):
        ed, book, files, problems = check(book_id)
        print("%s read/%s/  %d pages, \"%s\"" % ("write" if write else "dry  ", ed["slug"], len(book["pages"]), book["title"]))
        for p in problems:
            print("  REFUSED: " + p)
        failed = failed or bool(problems)
        if failed or not write:
            continue
        d = os.path.join(ROOT, "read", ed["slug"], "pages")
        os.makedirs(d, exist_ok=True)
        save_jpg(os.path.join(APP, "assets", "mini-story-covers", ed["cover"]), os.path.join(d, "cover.jpg"), (768, 1152))
        for i, f in enumerate(files, 1):
            save_jpg(os.path.join(APP, "assets", "story-heroes", f), os.path.join(d, "page-%d.jpg" % i), (1200, 800))
        template = open(os.path.join(ROOT, "read", "hen-berrys-digraph-dash", "index.html"), encoding="utf-8").read()
        open(os.path.join(ROOT, "read", ed["slug"], "index.html"), "w", encoding="utf-8", newline="\n").write(render(book_id, ed, book, template))
        print("  wrote read/%s/index.html, cover and %d pages" % (ed["slug"], len(files)))
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
