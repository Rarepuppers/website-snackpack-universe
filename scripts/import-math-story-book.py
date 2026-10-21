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
  * Added 2026-10-16: Wise Owl (Y5), after app fixes 1cf18e520 (page 1 question, page 2 primes)
    and 768ec8149 (page 4 said 36 cushions; the picture shows 16).
  * Added 2026-10-17: Lantern (Y2), Number Nest (Y2), Clockwork Concert (Y2) and the Mural (Y6),
    after Codex redrew their off-model, portrait and missing pages, and app fix (Stripe-Scout is "she",
    matching the Spelling books on the shelf).
All of them are free in the app, so no monetisation decision is involved.

Then: build-webp.mjs, build-read-pdfs.mjs --slug=<slug> --write, add to SHELF in
build-read-shelf.mjs, build-read-shelf.mjs, build-read-social-cards.py,
build-breadcrumbs.mjs, build-play-links.mjs, build-go-links.mjs, build-sitemap.mjs.
"""
import html
import os
import json, shutil, hashlib
import re
import sys

from PIL import Image, ImageOps

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
APP = os.path.join(ROOT, "..", "apps", "snackpack-4-math-arithmetic")
SITE = "https://www.snackpackuniverse.com"
PLAY = "https://play.google.com/store/apps/details?id=com.snackpackuniverse.basicmath"
DATA_FILES = ["curatedMathBooks.ts", "expandedCuratedMathBooks.ts", "pendingCuratedMathBooks.ts",
              "pendingQuickTales.ts", "year6MathBooks.ts"]

BOOKS = {
    "luckybug-market-morning": {
        "slug": "luckybugs-market-morning",
        "rev": 2,  # pages 2, 3, 5 and 6 redrawn 2026-10-17 (ac798997c)
        "lead": "A seven-page market story for practising addition and subtraction to 20, with a question on every page.",
        "blurb": "Berries roll, eggs run low and signs need string. Seven quick sums get the market open by noon.",
        "alts": [
            "Hen-Berry's basket tips and berries roll across the market path while Luckybug the ladybird hurries over.",
            "Hen-Berry looks at a tray of eighteen egg cups holding twelve eggs, with six cups empty, while Luckybug points.",
            "Luckybug adds a flower to a basket of nine yellow flowers beside a basket of eight purple ones, as Hen-Berry smiles.",
            "Luckybug and Hen-Berry sort wooden tokens at the stall.",
            "Hen-Berry and Luckybug check two shelves with six jam jars on each.",
            "Nine picture signs hang above the stalls and six more wait on the bench while Luckybug holds the string and Hen-Berry hangs one up.",
            "Woodland friends arrive at the busy market as the noon bell rings.",
        ],
    },
    "biscuit-bouncer-parcel-parade": {
        "slug": "biscuit-bouncers-parcel-parade",
        "rev": 2,  # page 6 redrawn 2026-10-17 (ac798997c)
        "lead": "A nine-page delivery adventure for practising adding, subtracting, measuring and sharing, with a question on every page.",
        "blurb": "The fastest route misses the quiet homes. Biscuit-Bouncer and Ginger-Deer find a better one, sum by sum.",
        "alts": [
            "Biscuit-Bouncer the puppy bounds along a meadow path beside a basket of invitations.",
            "Ginger-Deer points to a pencilled path on the map while Biscuit-Bouncer looks.",
            "Biscuit-Bouncer posts letters into little painted mailboxes by the creek as Ginger-Deer watches.",
            "Biscuit-Bouncer and Ginger-Deer split the invitations into two bags at the foot of a muddy hill.",
            "The friends tie ribbon across a wobbly plank bridge to mark a safe crossing.",
            "Biscuit-Bouncer sniffs the start of one of three fern paths while Ginger-Deer looks along the shortest one towards a cottage.",
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
    "wise-owl-festival-of-factors": {
        "slug": "wise-owl-festival-of-factors",
        "lead": "A four-page lantern festival for practising factors, multiples, prime numbers and square numbers, with a question on every page.",
        "blurb": "Twenty-four flags and a gatepost in the way. Wise Owl and Booklava find more than one right answer.",
        "alts": [
            "Wise Owl, Booklava and Quill-Berry study a row of lanterns and tiles under purple and gold flags at the festival gate.",
            "Wise Owl, Booklava and Quill-Berry look over rows of gold and purple chimes on a long table.",
            "Wise Owl points to purple and gold ribbons tied round the lamp posts as Booklava and Quill-Berry listen.",
            "Festival friends gather round a square of 16 purple and gold cushions in the reading garden.",
        ],
    },
    # Added 2026-10-17 after Codex redrew their off-model and missing pages
    # (monorepo docs/ART-BRIEF-STORY-GAPS-2026-10-16.md, delivered 3572e1a31);
    # every page viewed against its text, counts and clock faces checked.
    "ted-e-bear-lantern-half": {
        "slug": "ted-e-bear-and-the-lantern-that-needed-a-half",
        "lead": "A seven-page walk home in the dark for practising halves, doubles and sharing, with a question on every page.",
        "blurb": "Eight lanterns, two dark paths and one worried friend. Ted shares the light so everyone gets home.",
        "alts": [
            "Ted-E-Bear, in a flower crown and apron, kneels at a fork in the woodland path with a basket of eight glowing lanterns as Honey-Beats looks on.",
            "Ted-E-Bear turns back on the windy path towards Honey-Beats, who stands beside her lanterns, two of them gone dark.",
            "Ted-E-Bear sets a lantern on one side of a little wooden bridge while Honey-Beats holds up her two glowing lanterns.",
            "Ted-E-Bear and Honey-Beats lean on a footbridge over a creek between two lanterns, each with three fireflies beside it.",
            "Ted-E-Bear pulls a wagon of six glowing lanterns up the hill path towards a lit cottage window, with Honey-Beats beside him.",
            "Honey-Beats sets glowing lanterns outside the round tree-cottage door while Ted-E-Bear places one in the window.",
            "At the cottage door, Honey-Beats holds out a plate of honey biscuits and Ted-E-Bear takes two for his walk home.",
        ],
    },
    "booklava-number-nest": {
        "slug": "booklava-and-the-number-that-lost-its-place",
        "lead": "A seven-page library mystery for practising place value: hundreds, tens, ones and the zero that holds a place.",
        "blurb": "A runaway zero, a shrinking shelf label and a little owl who proves that every place matters.",
        "alts": [
            "Booklava, a small brown owl in a purple jumper, lifts the reading rug to find Zero, a glowing golden 0 with a worried face.",
            "Booklava stands on a spiral staircase beside six tied bundles of books and three single books.",
            "Booklava points across an echoing hall of empty arched shelves towards Zero glowing on the floor.",
            "Three tall stacks of books stand beside a little ladder where Zero stands proudly, with seven single books on the other side and Booklava holding the ladder.",
            "Booklava flies alongside a rolling book cart, steering it towards the nearer bookcase.",
            "Zero, glowing and smiling, stands beside Booklava in front of a carved shelf with a golden 0 in its third arch.",
            "Booklava lays a ribbon bookmark beside an open book as Zero steps back into the page and waves.",
        ],
    },
    "pork-ulele-clockwork-concert": {
        "slug": "pork-ulele-and-the-clockwork-concert",
        "lead": "A seven-page concert countdown for telling the time: quarter past, half past, quarter to and how long things take.",
        "blurb": "The concert clock has stopped. Pork-ulele and Cluck O'Clock get every act on stage on time.",
        "alts": [
            "Pork-ulele the piglet plays the ukulele on a forest stage while Cluck O'Clock points at the big clock showing quarter past three.",
            "Pork-ulele taps a drum kit as the stage clock shows half past four and Cluck O'Clock watches.",
            "Pork-ulele and Cluck O'Clock wait by the red stage curtain as the lamp-post clock shows quarter to five.",
            "Pork-ulele sings at a microphone with the band behind while Cluck O'Clock checks a small brass clock.",
            "A rabbit, a goose and a lamb take a bow under the clock at half past four while Pork-ulele plays and Cluck O'Clock claps.",
            "Backstage, Pork-ulele holds the ukulele and Cluck O'Clock holds a brass pocket watch, with the lit stage beyond the curtain.",
            "Woodland friends cheer as Pork-ulele plays and Cluck O'Clock conducts under a full moon.",
        ],
    },
    "vincent-van-mouse-mural-in-proportion": {
        "slug": "vincent-van-mouse-and-the-mural",
        "lead": "A seven-page festival mural for practising ratio, proportion and scale, with a question on every page.",
        "blurb": "A postcard-sized sketch, an enormous wall and a sunset that only works if every part grows by the same factor.",
        "alts": [
            "Vincent Van Mouse holds up his small sunset sketch beside a long blank wall as Sail-Affe the giraffe and Stripe-Scout the tiger cub look on.",
            "Stripe-Scout waits with a brush beside a tub of red paint and eight empty red pots while Vincent opens a crate of yellow.",
            "Stripe-Scout looks worried beside yesterday's paint tub while Vincent mixes colours in front of the half-painted sunset.",
            "Sail-Affe stretches up to paint a top square of the chalk grid on the wall while Stripe-Scout paints a low square and Vincent watches.",
            "Grey clouds roll in as Sail-Affe and Stripe-Scout paint the last bare squares of the sunset and Vincent checks his sketch.",
            "Vincent pours gold paint into three cups of different sizes for himself, Sail-Affe and Stripe-Scout as the first raindrops fall.",
            "The town gathers before the finished sunset mural as Professor Hooten the owl holds up a postcard and the painters celebrate.",
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
    models = json.load(open(os.path.join(APP, 'constants', 'storyTeachingModels.json'), encoding='utf-8'))
    for i, p in enumerate(book["pages"], 1):
        choices = "".join('<li>%s</li>' % esc(c) for c in p["choices"])
        model = models.get(p['id'])
        model_html = ('<figure class="story-teaching-model" data-model-id="%s" data-print-model="./print-models/page-%d-r1.jpg"><img src="./pages/model-%s-r1.png" alt="%s" width="1200" height="600"><figcaption>%s</figcaption></figure>' % (p['id'], i, p['id'], esc(model['alt']), esc(model['instruction']))) if model else ''
        cards.append(
            '<article class="story-page-card" id="page-%d"><picture><source srcset="./pages/%s.webp" type="image/webp">'
            '<img src="./pages/%s.jpg" alt="%s" loading="lazy" width="1200" height="800"></picture>'
            '<div class="story-page-copy"><span>Page %d of %d · %s</span><p>%s</p>'
            '%s<div class="math-question"><p class="math-q"><strong>Try it:</strong> %s</p>'
            '<ul class="math-choices" data-answer="%s" aria-label="Choices">%s</ul>'
            '<details class="story-answer math-answer"><summary>Show the answer</summary><p><strong>%s.</strong> %s</p></details>'
            '</div></div></article>' % (
                i, page_name(ed, i), page_name(ed, i), esc(ed["alts"][i - 1]), i, n, esc(p["title"]), esc(p["body"].replace("'", "’")),
                model_html, esc(p["prompt"].replace("'", "’")), esc(p["answer"]), choices, esc(p["answer"]),
                esc(p["explanation"].replace("'", "’"))))
    ld = ('{"@context":"https://schema.org","@type":"Book","name":%s,"author":{"@type":"Organization","name":"SnackPack Studios"},'
          '"isAccessibleForFree":true,"educationalLevel":%s,"learningResourceType":"Illustrated maths story","about":%s,'
          '"image":"%spages/%s.jpg","url":"%s"}') % (
        html.escape('"%s"' % title, quote=False), '"%s (UK) / %s (US)"' % (book["year"], book["grade"]),
        '"%s"' % book["topic"], url, page_name(ed, 1), url)
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


def page_name(ed, i):
    """page-3, or page-3-r2 once a book's art is replaced (BOOKS "rev"): sw.js
    serves images cache-first, so new art at an old URL stays stale for every
    returning reader. Bump "rev" whenever a live book's pictures change."""
    return "page-%d%s" % (i, "-r%d" % ed["rev"] if ed.get("rev") else "")


def save_jpg(src, dst, size):
    # Crop to the target shape, then scale: a few app pages are 4:3 (1200x900)
    # and a plain resize to 1200x800 would squash them.
    im = ImageOps.fit(Image.open(src).convert("RGB"), size, Image.LANCZOS)
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
        save_jpg(cover, os.path.join(d, "cover-r2.jpg" if book_id == 'hop-tart-stepping-stone-switch' else "cover.jpg"), (1024, 1536))
        for i, f in enumerate(files, 1):
            save_jpg(f, os.path.join(d, page_name(ed, i) + ".jpg"), (1200, 800))
        models = json.load(open(os.path.join(APP, 'constants', 'storyTeachingModels.json'), encoding='utf-8'))
        delivery_file = os.path.join(ROOT, 'data', 'read-model-delivery.json')
        delivery = json.load(open(delivery_file, encoding='utf-8')) if os.path.exists(delivery_file) else []
        delivery = [r for r in delivery if r['slug'] != ed['slug']]
        for i, p in enumerate(book['pages'], 1):
            if p['id'] not in models:
                continue
            model = models[p['id']]
            model_file = os.path.join(APP, 'assets', 'story-models', p['id']+'.png')
            web = os.path.join(d, 'model-'+p['id']+'-r1.png')
            shutil.copyfile(model_file, web)
            scene = Image.open(os.path.join(d, page_name(ed,i)+'.jpg')).convert('RGB')
            diagram = Image.open(model_file).convert('RGB')
            diagram.thumbnail((1200,600),Image.LANCZOS)
            print_image = Image.new('RGB',(1200,800+diagram.height),'#fff9ed')
            print_image.paste(scene,(0,0))
            print_image.paste(diagram,((1200-diagram.width)//2,800))
            print_dir = os.path.join(ROOT,'read',ed['slug'],'print-models')
            os.makedirs(print_dir,exist_ok=True)
            print_file = os.path.join(print_dir,'page-%d-r1.jpg'%i)
            print_image.save(print_file,'JPEG',quality=94,optimize=True)
            delivery.append({'slug':ed['slug'],'page':i,'id':p['id'],'model':model,'image':os.path.relpath(web,ROOT).replace('\\','/'),'sha256':hashlib.sha256(open(web,'rb').read()).hexdigest(),'print':os.path.relpath(print_file,ROOT).replace('\\','/'),'print_sha256':hashlib.sha256(open(print_file,'rb').read()).hexdigest()})
        open(delivery_file,'w',encoding='utf-8').write(json.dumps(sorted(delivery,key=lambda r:r['id']),indent=2)+'\n')
        rendered = render(book_id, book, ed, template)
        if book_id == 'hop-tart-stepping-stone-switch':
            rendered = rendered.replace('./pages/cover.webp','./pages/cover-r2.webp').replace('./pages/cover.jpg','./pages/cover-r2.jpg')
        open(os.path.join(ROOT, "read", ed["slug"], "index.html"), "w", encoding="utf-8", newline="").write(rendered)


if __name__ == "__main__":
    main()
