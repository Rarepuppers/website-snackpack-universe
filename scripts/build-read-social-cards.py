"""Build a 1200x630 share card for every book under /read/ and point its tags at it.

    python scripts/build-read-social-cards.py          # write cards + update tags
    python scripts/build-read-social-cards.py --check  # exit 1 if any page or card is stale

Why: /read/ grows through links shared in chat apps (Telegram, WhatsApp), and
every book used its portrait cover as og:image. Chat previews are landscape, so
the cover was cropped to a strip of sky or a pair of ears. Each card now shows
the whole cover beside the title and "free to read or print".

Inputs come from the page itself: og:title, the eyebrow, and the art in the
title section. Output: read/<slug>/social-card.jpg (JPEG, kept well under
300 KB because some chat apps skip previews of larger images) plus og:image,
og:image:width/height/alt and twitter:image in the page head.
Run after adding a book (scripts/import-*.mjs) and after build-read-shelf.
"""
import html as htmllib
import io
import os
import re
import sys

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
READ = os.path.join(ROOT, "read")
SITE = "https://www.snackpackuniverse.com"
FONTS = os.environ.get("WINDIR", r"C:\Windows") + r"\Fonts"
W, H = 1200, 630
BG = (255, 246, 230)
INK = (32, 23, 19)
MUTED = (103, 93, 85)
ACCENT = (31, 111, 92)
CHECK = "--check" in sys.argv


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


def wrap(draw, text, fnt, width):
    lines, line = [], ""
    for word in text.split():
        trial = (line + " " + word).strip()
        if draw.textlength(trial, font=fnt) <= width:
            line = trial
        else:
            lines.append(line)
            line = word
    lines.append(line)
    return lines


def card(title, eyebrow, art_path):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    # Art on the right, whole and uncropped, on a soft panel.
    art = Image.open(art_path).convert("RGB")
    box_w, box_h = 430, H - 80
    art = ImageOps.contain(art, (box_w, box_h), Image.LANCZOS)
    ax, ay = W - 60 - art.width, (H - art.height) // 2
    shadow = Image.new("L", (art.width + 24, art.height + 24), 0)
    ImageDraw.Draw(shadow).rounded_rectangle((12, 12, art.width + 12, art.height + 12), 26, fill=60)
    img.paste((214, 196, 170), (ax - 6, ay + 4), shadow)
    mask = Image.new("L", art.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, art.width, art.height), 22, fill=255)
    img.paste(art, (ax, ay), mask)
    # Text on the left.
    left, text_w = 64, ax - 64 - 48
    d.rounded_rectangle((left, 70, left + d.textlength(eyebrow.upper(), font=font("segoeuib.ttf", 20)) + 36, 112), 21, fill=(225, 243, 236))
    d.text((left + 18, 79), eyebrow.upper(), font=font("segoeuib.ttf", 20), fill=ACCENT)
    size = 64
    while True:
        tf = font("georgiab.ttf", size)
        lines = wrap(d, title, tf, text_w)
        if len(lines) <= 3 or size <= 44:
            break
        size -= 4
    y = 150
    for ln in lines:
        d.text((left, y), ln, font=tf, fill=INK)
        y += int(size * 1.18)
    y += 18
    for ln in wrap(d, "Free to read or print. No sign-up, no ads.", font("segoeui.ttf", 28), text_w):
        d.text((left, y), ln, font=font("segoeui.ttf", 28), fill=MUTED)
        y += 38
    d.text((left, H - 92), "snackpackuniverse.com/read", font=font("segoeuib.ttf", 26), fill=ACCENT)
    out = io.BytesIO()
    img.save(out, "JPEG", quality=84, optimize=True, progressive=True)
    return out.getvalue()


def meta(page, prop):
    m = re.search(r'<meta (?:property|name)="%s" content="([^"]*)"' % re.escape(prop), page)
    return htmllib.unescape(m.group(1)) if m else None


def set_tags(page, slug, title):
    url = f"{SITE}/read/{slug}/social-card.jpg"
    alt = f"{title}: a free illustrated story from SnackPack, to read online or print."
    # Drop any previous image tags, then write one consistent set after og:url.
    page = re.sub(r'<meta property="og:image(?::[a-z]+)?" content="[^"]*">', "", page)
    page = re.sub(r'<meta name="twitter:image(?::alt)?" content="[^"]*">', "", page)
    tags = (f'<meta property="og:image" content="{url}"><meta property="og:image:width" content="{W}">'
            f'<meta property="og:image:height" content="{H}"><meta property="og:image:alt" content="{htmllib.escape(alt)}">'
            f'<meta name="twitter:image" content="{url}">')
    m = re.search(r'<meta property="og:url" content="[^"]*">', page)
    if not m:
        raise SystemExit(f"read/{slug}/index.html: no og:url to anchor the image tags")
    return page[:m.end()] + tags + page[m.end():]


stale = []
for slug in sorted(os.listdir(READ)):
    path = os.path.join(READ, slug, "index.html")
    if slug == "sound-cards" or not os.path.isfile(path):
        continue
    page = open(path, encoding="utf-8").read()
    if 'class="story-page-card"' not in page:
        continue  # Collection/utility pages have their own sharing metadata.
    title = meta(page, "og:title")
    eyebrow_m = re.search(r'<section class="story-title-section">.*?<span class="eyebrow">([^<]*)</span>', page, re.S)
    art_m = re.search(r'<section class="story-title-section">.*?<img src="\./([^"]+)"', page, re.S)
    if not (title and eyebrow_m and art_m):
        raise SystemExit(f"read/{slug}/index.html: missing og:title, eyebrow or title art")
    eyebrow = htmllib.unescape(eyebrow_m.group(1)).replace(" · Free", "").strip()
    eyebrow = "Free " + eyebrow[0].lower() + eyebrow[1:] if not eyebrow.lower().startswith("free") else eyebrow
    jpg = card(title, eyebrow, os.path.join(READ, slug, art_m.group(1)))
    out = os.path.join(READ, slug, "social-card.jpg")
    new_page = set_tags(page, slug, title)
    old_jpg = open(out, "rb").read() if os.path.exists(out) else None
    if new_page != page:
        stale.append(f"read/{slug}/index.html")
    if old_jpg != jpg:
        stale.append(f"read/{slug}/social-card.jpg")
    if not CHECK:
        open(path, "w", encoding="utf-8", newline="").write(new_page)
        open(out, "wb").write(jpg)
        print(f"  {slug}: {len(jpg) // 1024} KB")

if CHECK and stale:
    print("build-read-social-cards: stale:\n  " + "\n  ".join(stale))
    sys.exit(1)
print("build-read-social-cards: " + ("all current." if CHECK else "done."))
