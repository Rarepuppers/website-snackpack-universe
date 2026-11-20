"""Package portrait and print derivatives from reviewed shared originals."""
import argparse
import json
from pathlib import Path

from PIL import Image, ImageOps
from reportlab.lib.pagesizes import A4, LETTER
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


def write_sheet(destination, art, title, paper):
    pdf = canvas.Canvas(str(destination), pagesize=paper, pageCompression=1, invariant=1)
    pdf.setTitle(title)
    width, height = paper
    scaled = min((width - 84) / art.width, (height - 116) / art.height)
    art_width, art_height = art.width * scaled, art.height * scaled
    pdf.setFont('Helvetica-Bold', 16)
    pdf.drawCentredString(width / 2, height - 47, title)
    pdf.drawImage(ImageReader(art), (width - art_width) / 2, (height - art_height) / 2 - 10,
                  width=art_width, height=art_height)
    pdf.showPage()
    pdf.save()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('monorepo', type=Path)
    args = parser.parse_args()
    site = Path(__file__).resolve().parents[1]
    media = site / 'characters/media'
    sheets = site / 'characters/colouring/files'
    for directory in [media, sheets]:
        directory.mkdir(parents=True, exist_ok=True)

    shared = args.monorepo / 'shared-assets'
    catalog = json.loads((shared / 'text/characters/pilot.json').read_text())
    for character in catalog['characters']:
        with Image.open(shared / character['portrait']) as source:
            original = source.convert('RGBA')
            sample = original.getpixel((0, 0))
            background = sample[:3] if sample[3] == 255 else '#f5e8d1'
            visible = original.getchannel('A').point(lambda alpha: 255 if alpha > 20 else 0).getbbox()
            if visible:
                original = original.crop(visible)
            square = Image.new('RGB', (960, 960), background)
            art = ImageOps.contain(original, (866, 866), Image.Resampling.LANCZOS)
            square.paste(art, ((960 - art.width) // 2, (960 - art.height) // 2), art)
            for width in (240, 480, 960):
                square.resize((width, width), Image.Resampling.LANCZOS).save(
                    media / f"{character['id']}-{width}.webp", quality=81, method=6)

    bookshelf = args.monorepo / 'docs/reads-events-bookshelf'
    book = bookshelf / 'new-year/cluck-oclock-and-the-midnight-that-came-early'
    with Image.open(book / 'p04.png') as source:
        for width in (720, 1200):
            ImageOps.fit(source.convert('RGB'), (width, width * 9 // 10),
                         Image.Resampling.LANCZOS, centering=(0.5, 0.52)).save(
                             media / f'library-{width}.webp', quality=82, method=6)

    assets = bookshelf / 'assets'
    new_year = assets / 'new-year/colouring-masters'
    scenes = [
        ('harvest-cobs', 'Corgi and his basket of corn', assets / 'proofs-2026-11-20/corgi-colouring-p02.png'),
        ('clock-wall', 'The library clock wall', new_year / 'cluck-p04-colouring.png'),
        ('twins-at-home', 'Cluck and Coop at home', new_year / 'cluck-p24-colouring.png'),
    ]
    for slug, title, original in scenes:
        with Image.open(original) as source:
            art = source.convert('L')
            preview = Image.new('L', (360, 510), 255)
            thumbnail = ImageOps.contain(art, (330, 480), Image.Resampling.LANCZOS)
            preview.paste(thumbnail, ((360 - thumbnail.width) // 2, (510 - thumbnail.height) // 2))
            preview.save(media / f'{slug}-preview.webp', quality=88)
            for size, paper in [('a4', A4), ('letter', LETTER)]:
                write_sheet(sheets / f'{slug}-{size}.pdf', art, title, paper)


if __name__ == '__main__':
    main()
