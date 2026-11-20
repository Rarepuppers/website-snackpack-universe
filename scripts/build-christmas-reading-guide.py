"""Build the one-page Christmas reading guide in A4 and US Letter."""

import json
from pathlib import Path

from reportlab.lib.pagesizes import A4, LETTER
from reportlab.lib.utils import simpleSplit
from reportlab.pdfgen import canvas


SITE = "https://www.snackpackuniverse.com"
ROOT = Path(__file__).resolve().parents[1]
DESTINATION = ROOT / "read/events/christmas"
MARGIN = 42


def read_json(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def draw_guide(guide, books, size_name, size):
    width, height = size
    right = width - MARGIN
    y = height - MARGIN
    file = DESTINATION / f"christmas-reading-guide-{size_name}.pdf"
    pdf = canvas.Canvas(str(file), pagesize=size, pageCompression=1, invariant=1)
    pdf.setTitle(guide["title"])
    pdf.setAuthor("SnackPack Studios")

    def block(text, font="Helvetica", font_size=11, leading=15, gap=5, link=None):
        nonlocal y
        pdf.setFont(font, font_size)
        for line in simpleSplit(text, font, font_size, right - MARGIN):
            pdf.drawString(MARGIN, y, line)
            if link:
                end = MARGIN + pdf.stringWidth(line, font, font_size)
                pdf.linkURL(link, (MARGIN, y - 3, end, y + font_size), relative=0)
            y -= leading
        y -= gap

    block("SNACKPACK READS", "Helvetica-Bold", 10, 17)
    block(guide["title"], "Helvetica-Bold", 27, 33)
    block(guide["intro"], gap=13)

    for choice in guide["choices"]:
        slug = choice["slug"]
        book = books[slug]
        block(book["title"], "Helvetica-Bold", 12, 16, gap=0, link=f"{SITE}/read/{slug}/")
        block(f"Ages {book['ageRange']}  ·  {choice['time']}  ·  {choice['mode']}",
              font_size=10, leading=14, gap=0)
        block(choice["why"], gap=9)
    block(guide["timeNote"], "Helvetica-Oblique", 10, 14, gap=14)

    block("Talk about the story", "Helvetica-Bold", 15, 21)
    for index, question in enumerate(guide["questions"], 1):
        block(f"{index}. {question}", gap=4)
    y -= 8
    block(guide["activity"]["title"], "Helvetica-Bold", 15, 21)
    block(guide["activity"]["instruction"], gap=8)

    # Leave a full-width, unfilled drawing box with a separate writing line.
    floor = 98
    assert y - floor >= 120, "The drawing box is too small"
    pdf.setLineWidth(0.6)
    pdf.rect(MARGIN, floor, right - MARGIN, y - floor)
    pdf.line(MARGIN, 77, right, 77)
    y = 56
    block("Read more Christmas stories", font_size=9, link=f"{SITE}/read/events/christmas/")
    domain = "www.snackpackuniverse.com"
    pdf.setFont("Helvetica", 9)
    pdf.drawRightString(right, 56, domain)
    pdf.linkURL(SITE, (right - pdf.stringWidth(domain, "Helvetica", 9), 53, right, 65), relative=0)
    pdf.showPage()
    pdf.save()
    print(file.relative_to(ROOT))


def main():
    guide = read_json("data/christmas-reading-guide.json")
    registry = read_json("data/web-originals.json")
    books = {choice["slug"]: read_json(registry[choice["slug"]]) for choice in guide["choices"]}
    for name, size in [("a4", A4), ("letter", LETTER)]:
        draw_guide(guide, books, name, size)


if __name__ == "__main__":
    main()
