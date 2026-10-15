"""Import a free SnackPack Basic Math story into /read/ as a "Number story".

    python scripts/import-math-story-book.py                     # dry run, all approved books
    python scripts/import-math-story-book.py --write
    python scripts/import-math-story-book.py --id=hop-tart-stepping-stone-switch --write

Nothing here writes prose or art. Title, page text, question, choices, answer
and explanation come from apps/snackpack-4-math-arithmetic/constants/*.ts;
page art is resolved exactly the way the app's reader does it
(getBookPageImage(illustrationId ?? page.id) in constants/bookPageImages.ts).
The only web editorial here is BOOKS below: the public slug, a one-line lead,
and alt text written from the pictures themselves.

Which books, and why only these four (quality read, 2026-10-15, READ-PLAN-2026-10.md):
all nine FREE_BOOK_IDS were read in full and every page of art viewed.
  * Included: Luckybug (Y1), Biscuit-Bouncer (Y2), Hop-Tart (Y3), Centi-Peed (Y4).
  * Held back, app fixes owed:
      pork-ulele-clockwork-concert   page 1 says "quarter past three"; the clock shows quarter past four
      wise-owl-festival-of-factors   page 1 asks "which pair" but offers single numbers; page 2 muddles primes
      ted-e-bear-lantern-half        Ted and Honey-Beats change design mid-book (two art batches)
      booklava-number-nest           Booklava alternates between a brown and a purple owl
      vincent-van-mouse-mural-...    only 4 of 7 pages illustrated
All four are free in the app, so no monetisation decision is involved.

Then: build-webp.mjs, build-read-pdfs.mjs --slug=<slug> --write, add to SHELF in
build-read-shelf.mjs, build-read-shelf.mjs, build-read-social-cards.py,
build-breadcrumbs.mjs, build-play-links.mjs, build-go-links.mjs, build-sitemap.mjs.
"""
import html
import os
import re
import sys

from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
APP = os.path.join(ROOT, "..", "apps", "snackpack-4-math-arithmetic")
SITE = "https://www.snackpackuniverse.com"
PLAY = "https://play.google.com/store/apps/details?id=com.snackpackuniverse.basicmath"
DATA_FILES = ["curatedMathBooks.ts", "expandedCuratedMathBooks.ts", "pendingCuratedMathBooks.ts",
              "pendingQuickTales.ts", "year6MathBooks.ts"]

BOOKS = {
    "luckybug-market-morning": {
        "slug": "luckybugs-market-morning",
        "lead": "A seven-page market story for practising addition and subtraction to 20, with a question on every page.",
        "blurb": "Berries roll, eggs run low and signs need string. Seven quick sums get the market open by noon.",
        "alts": [
            "Hen-Berry's basket tips and berries roll across the market path while Luckybug the ladybird hurries over.",
            "Hen-Berry counts the eggs left in a wooden tray as Luckybug looks on.",
            "Luckybug and Hen-Berry with baskets of yellow and purple flowers.",
            "Luckybug and Hen-Berry sort wooden tokens at the stall.",
            "Hen-Berry sets out jam jars on two matching shelves.",
            "Luckybug and Hen-Berry hang painted picture signs above the stalls.",
            "Woodland friends arrive at the busy market as the noon bell rings.",
        ],
    },
    "biscuit-bouncer-parcel-parade": {
        "slug": "biscuit-bouncers-parcel-parade",
        "lead": "A nine-page delivery adventure for practising adding, subtracting, measuring and sharing, with a question on every page.",
        "blurb": "The fastest route misses the quiet homes. Biscuit-Bouncer and Ginger-Deer find a better one, sum by sum.",
        "alts": [
            "Biscuit-Bouncer the puppy bounds along a meadow path beside a basket of invitations.",
            "Ginger-Deer points to a pencilled path on the map while Biscuit-Bouncer looks.",
            "Biscuit-Bouncer posts letters into little painted mailboxes by the creek as Ginger-Deer watches.",
            "Biscuit-Bouncer and Ginger-Deer split the invitations into two bags at the foot of a muddy hill.",
            "The friends tie ribbon across a wobbly plank bridge to mark a safe crossing.",
            "Biscuit-Bouncer sniffs one of three fern paths while Ginger-Deer checks another.",
            "Ginger-Deer and Biscuit-Bouncer tie ribbon bows on five little wagons.",
            "Biscuit-Bouncer and a crowd of woodland friends gather at the parade field.",
            "Ginger-Deer leads the parade with Biscuit-Bouncer beside her.",
        ],
    },
    "hop-tart-stepping-stone-switch": {
        "slug": "hop-tarts-stepping-stone-switch",
        "lead": "A four-page pond crossing for practising the 3, 4 and 8 times tables, sharing and remainders.",
        "blurb": "A current twists the stepping stones. Hop-Tart builds a path that waits for Centi-Peed.",
        "alts": [
            "Hop-Tart the rabbit and Centi-Peed look out at stepping stones swirling in a rainy pond.",
            "Flutter-Butter brings bundles of reeds as Hop-Tart and Centi-Peed build handrails.",
            "Hop-Tart and Centi-Peed place glowing seeds beside the stepping stones at dusk.",
            "A lit path of stones and rails leads Hop-Tart and Centi-Peed to a glowing home.",
        ],
    },
    "centi-peed-below-zero-burrow": {
        "slug": "centi-peeds-below-zero-burrow",
        "lead": "A four-page frosty rescue for practising negative numbers, temperature, sequences and coordinates.",
        "blurb": "Firefly footprints lead below zero. Centi-Peed and Sub-Zero count every step through the cold.",
        "alts": [
            "Centi-Peed stands at the entrance of a frosty burrow lit by tiny fireflies.",
            "Sub-Zero the penguin shelters a small firefly while Centi-Peed looks up the warm tunnel.",
            "Four ice lanterns glow from cold blue to warm gold along the burrow floor.",
            "Centi-Peed and Sub-Zero lead the fireflies through a clear tunnel to the moonlit roots.",
        ],
    },
}


def read_sources():
    return {f: open(os.path.join(APP, "constants", f), encoding="utf-8").read() for f in DATA_FILES}


def sfield(blk, name):
    m = re.search(r"\b" + name + r":\s*'((?:[^'\\]|\\.)*)'", blk) or re.search(r"\b" + name + r':\s*"((?:[^"\\]|\\.)*)"', blk)
    return re.sub(r"\\(.)", r"\1", m.group(1)) if m else None


def parse(book_id, sources):
    for src in sources.values():
        i = src.find("id: '%s'" % book_id)
        if i == -1:
            continue
        p = src.find("pages:", i)
        head = src[i:p]
        start = src.find("[", p)
        depth = 0
        for k in range(start, len(src)):
            depth += src[k] == "["
            depth -= src[k] == "]"
            if depth == 0:
                arr = src[start:k + 1]
                break
        pages, d, cur = [], 0, ""
        for ch in arr[1:-1]:
            if ch == "{":
                d += 1
            if d > 0:
                cur += ch
            if ch == "}":
                d -= 1
                if d == 0:
                    pages.append(cur)
                    cur = ""
        out = []
        for pg in pages:
            choices = re.search(r"choices:\s*\[([^\]]*)\]", pg).group(1)
            out.append({
                "id": sfield(pg, "id"), "title": sfield(pg, "title"), "body": sfield(pg, "body"),
                "prompt": sfield(pg, "prompt"), "explanation": sfield(pg, "explanation"),
                "answer": re.search(r"answer:\s*(-?[\d.]+)", pg).group(1),
                "choices": [c.strip() for c in choices.split(",") if c.strip()],
                "illustration": sfield(pg, "illustrationId"),
            })
        return {"title": sfield(head, "title"), "year": sfield(head, "ukYear"), "grade": sfield(head, "usGrade"),
                "topic": sfield(head, "curriculumTopic"), "hook": sfield(head, "hook"), "pages": out}
    raise SystemExit("book %s not found" % book_id)


def art_map():
    src = open(os.path.join(APP, "constants", "bookPageImages.ts"), encoding="utf-8").read()
    return dict(re.findall(r"['\"]([\w-]+)['\"]\s*:\s*require\(\s*['\"]\.\./assets/book-page-images/([^'\"]+)['\"]", src))


def minus(s):
    """App text uses a hyphen-minus in a few negative numbers; print a real minus sign."""
    return re.sub(r"(?<![\w-])-(?=\d)", "−", s)


def esc(s):
    return html.escape(minus(s), quote=True)


def render(book_id, book, ed, template):
    shared = template[template.index("<!-- pwa:generated -->"):template.index("</head>")]
    header = template[template.index('<header class="topbar">'):template.index("<main>")]
    slug, n = ed["slug"], len(book["pages"])
    url = "%s/read/%s/" % (SITE, slug)
    title = book["title"].replace("'", "’")
    cards = []
    for i, p in enumerate(book["pages"], 1):
        choices = "".join('<li>%s</li>' % esc(c) for c in p["choices"])
        cards.append(
            '<article class="story-page-card" id="page-%d"><picture><source srcset="./pages/page-%d.webp" type="image/webp">'
            '<img src="./pages/page-%d.jpg" alt="%s" loading="lazy" width="1200" height="800"></picture>'
            '<div class="story-page-copy"><span>Page %d of %d · %s</span><p>%s</p>'
            '<div class="math-question"><p class="math-q"><strong>Try it:</strong> %s</p>'
            '<ul class="math-choices" data-answer="%s" aria-label="Choices">%s</ul>'
            '<details class="story-answer math-answer"><summary>Show the answer</summary><p><strong>%s.</strong> %s</p></details>'
            '</div></div></article>' % (
                i, i, i, esc(ed["alts"][i - 1]), i, n, esc(p["title"]), esc(p["body"].replace("'", "’")),
                esc(p["prompt"].replace("'", "’")), esc(p["answer"]), choices, esc(p["answer"]),
                esc(p["explanation"].replace("'", "’"))))
    ld = ('{"@context":"https://schema.org","@type":"Book","name":%s,"author":{"@type":"Organization","name":"SnackPack Studios"},'
          '"isAccessibleForFree":true,"educationalLevel":%s,"learningResourceType":"Illustrated maths story","about":%s,'
          '"image":"%spages/page-1.jpg","url":"%s"}') % (
        html.escape('"%s"' % title, quote=False), '"%s (UK) / %s (US)"' % (book["year"], book["grade"]),
        '"%s"' % book["topic"], url, url)
    first, _, rest = title.partition(" and ")
    h1 = ("%s<br>and %s" % (first, rest)) if rest else title
    return """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>%(title)s | Free %(year)s Maths Story</title>
<meta name="description" content="%(desc)s">
<link rel="canonical" href="%(url)s">
<meta property="og:title" content="%(title_attr)s"><meta property="og:description" content="%(blurb)s"><meta property="og:url" content="%(url)s"><meta property="og:type" content="book"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon-32.png"><link rel="preload" href="/assets/fonts/dmsans-ed656a5d.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/assets/fonts/fraunces-36024e18.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/assets/fonts/fonts.css"><link rel="stylesheet" href="../../site.css">
<script type="application/ld+json">%(ld)s</script>
<!-- breadcrumbs:generated -->
<!-- /breadcrumbs:generated -->
%(shared)s</head>
<body class="story-reader-page story-long-copy">
%(header)s<main>
<section class="story-title-section"><div class="shell story-title-grid"><div><span class="eyebrow">Number story · %(year)s · Free</span><h1>%(h1)s</h1><p class="lead">%(lead)s</p><div class="tag-row"><span class="tag">%(year)s (UK) · %(grade)s (US)</span><span class="tag">%(topic)s</span></div><a class="btn btn-primary" href="#page-1">Begin the story</a></div><picture><source srcset="./pages/cover.webp" type="image/webp"><img src="./pages/cover.jpg" alt="%(cover_alt)s" width="1024" height="1536"></picture></div></section>

<section class="story-pages story-pages-landscape" aria-label="Story pages">
%(cards)s
</section>

<section><div class="shell story-finish-card"><span class="eyebrow">The end · Great maths</span><h2>%(n)s questions, one story.</h2><p>Try the story again without peeking, or print it and work the questions on paper. SnackPack Basic Math has the rest of the story shelf, daily practice and number games.</p><!-- read-next:generated -->
<!-- /read-next:generated --><div class="stack-inline"><a class="btn btn-primary" href="%(play)s" target="_blank" rel="noopener">Get the app on Google Play</a><a class="btn btn-secondary" href="../../apps/snackpack-4-math-arithmetic/">Explore the app</a><a class="btn btn-secondary" href="./%(slug)s.pdf" download>Print this book (PDF)</a><a class="btn btn-secondary" href="../">Back to the bookshelf</a></div></div></section>
</main>
<footer class="foot"><div class="shell foot-wrap"><p class="foot-note">Story from SnackPack Basic Math.</p><div class="footer-links"><a class="text-link" href="../">Bookshelf</a><a class="text-link" href="../../privacy/snackpack-4-math-arithmetic/">Privacy</a></div></div></footer>
  <!-- Cloudflare Web Analytics -->
  <script defer src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "0e57cfb3eb86422ca40e5fac02b1cf94"}'></script>
  <!-- End Cloudflare Web Analytics -->
</body></html>
""" % {
        "title": html.escape(title), "title_attr": html.escape(title, quote=True), "url": url,
        "desc": esc("Read %s, a free %d-page illustrated maths story for %s (UK) / %s (US): %s. A question on every page, answers included, printable PDF." % (
            title, n, book["year"], book["grade"], book["topic"].lower())),
        "blurb": esc(ed["blurb"]), "ld": ld, "shared": shared, "header": header, "year": book["year"],
        "grade": book["grade"], "topic": esc(book["topic"]), "h1": html.escape(h1).replace("&lt;br&gt;", "<br>"),
        "lead": esc(ed["lead"]), "cover_alt": esc("%s book cover." % title), "cards": "\n".join(cards),
        "n": ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"][n],
        "play": PLAY, "slug": slug}


def save_jpg(src, dst, size):
    im = Image.open(src).convert("RGB")
    im = im.resize(size, Image.LANCZOS)
    im.save(dst, "JPEG", quality=84, optimize=True, progressive=True)


def main():
    write = "--write" in sys.argv
    only = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--id=")), None)
    ids = [only] if only else list(BOOKS)
    sources, arts = read_sources(), art_map()
    template = open(os.path.join(ROOT, "read", "hen-berrys-digraph-dash", "index.html"), encoding="utf-8").read()
    for book_id in ids:
        ed, book = BOOKS[book_id], parse(book_id, sources)
        if len(book["pages"]) != len(ed["alts"]):
            raise SystemExit("%s: %d pages but %d alt texts" % (book_id, len(book["pages"]), len(ed["alts"])))
        files = []
        for p in book["pages"]:
            key = p["illustration"] or p["id"]
            fn = arts.get(key)
            path = os.path.join(APP, "assets", "book-page-images", fn) if fn else None
            if not path or not os.path.exists(path):
                raise SystemExit("%s: page %s has no art (%s)" % (book_id, p["id"], key))
            files.append(path)
        cover = os.path.join(APP, "assets", "book-covers", book_id + ".webp")
        print("%s read/%s/  %s, %d pages, \"%s\"" % ("write" if write else "dry  ", ed["slug"], book["year"], len(files), book["title"]))
        if not write:
            continue
        d = os.path.join(ROOT, "read", ed["slug"], "pages")
        os.makedirs(d, exist_ok=True)
        save_jpg(cover, os.path.join(d, "cover.jpg"), (1024, 1536))
        for i, f in enumerate(files, 1):
            save_jpg(f, os.path.join(d, "page-%d.jpg" % i), (1200, 800))
        open(os.path.join(ROOT, "read", ed["slug"], "index.html"), "w", encoding="utf-8", newline="").write(
            render(book_id, book, ed, template))


if __name__ == "__main__":
    main()
