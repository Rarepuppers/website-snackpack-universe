"""Package portrait and print derivatives from reviewed shared originals."""
import argparse
import json
from pathlib import Path

from PIL import Image, ImageOps
from reportlab.lib.pagesizes import A4, LETTER
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


def square_portrait(path, width=960):
    with Image.open(path) as source:
        original = source.convert('RGBA')
        sample = original.getpixel((0, 0))
        background = sample[:3] if sample[3] == 255 else '#f5e8d1'
        visible = original.getchannel('A').point(lambda alpha: 255 if alpha > 20 else 0).getbbox()
        if visible:
            original = original.crop(visible)
        square = Image.new('RGB', (width, width), background)
        padding = round(width * 866 / 960)
        art = ImageOps.contain(original, (padding, padding), Image.Resampling.LANCZOS)
        square.paste(art, ((width - art.width) // 2, (width - art.height) // 2), art)
        return square


def draw_sheet(pdf, art, title, paper):
    width, height = paper
    scaled = min((width - 84) / art.width, (height - 116) / art.height)
    art_width, art_height = art.width * scaled, art.height * scaled
    pdf.setFont('Helvetica-Bold', 16)
    pdf.drawCentredString(width / 2, height - 47, title)
    pdf.drawImage(ImageReader(art), (width - art_width) / 2, (height - art_height) / 2 - 10,
                  width=art_width, height=art_height)
    pdf.showPage()


def write_sheet(destination, art, title, paper):
    pdf = canvas.Canvas(str(destination), pagesize=paper, pageCompression=1, invariant=1)
    pdf.setTitle(title)
    draw_sheet(pdf, art, title, paper)
    pdf.save()


def write_preview(media, slug, art):
    preview = Image.new('L', (360, 510), 255)
    thumbnail = ImageOps.contain(art, (330, 480), Image.Resampling.LANCZOS)
    preview.paste(thumbnail, ((360 - thumbnail.width) // 2, (510 - thumbnail.height) // 2))
    preview.save(media / f'{slug}-preview.webp', quality=88)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('monorepo', type=Path)
    parser.add_argument('--portraits-only', action='store_true')
    args = parser.parse_args()
    site = Path(__file__).resolve().parents[1]
    media = site / 'characters/media'
    sheets = site / 'characters/colouring/files'
    for directory in [media, sheets]:
        directory.mkdir(parents=True, exist_ok=True)

    shared = args.monorepo / 'shared-assets'
    catalog = json.loads((shared / 'text/characters/catalog.json').read_text())
    characters = [
        character for character in catalog['characters']
        if character.get('status', 'public' if catalog.get('version', 1) == 1 else None) == 'public'
    ]
    for character in characters:
        square = square_portrait(args.monorepo / character['portrait'])
        for width in (240, 480, 960):
            square.resize((width, width), Image.Resampling.LANCZOS).save(
                media / f"{character['id']}-{width}.webp", quality=81, method=6)
        if 'variant' in character:
            square_portrait(args.monorepo / character['variant']['source'], 480).save(
                media / f"{character['id']}-variant.webp", quality=81, method=6)

    if args.portraits_only:
        return

    book = site / 'read/cluck-oclock-and-the-midnight-that-came-early/pages'
    with Image.open(book / 'p04.webp') as source:
        for width in (720, 1200):
            ImageOps.fit(source.convert('RGB'), (width, width * 9 // 10),
                         Image.Resampling.LANCZOS, centering=(0.5, 0.52)).save(
                             media / f'library-{width}.webp', quality=82, method=6)

    originals = shared / 'art-source/characters/colouring'
    scenes = [
        ('harvest-cobs', 'Corgi and his basket of corn'),
        ('clock-wall', 'The library clock wall'),
        ('twins-at-home', 'Cluck and Coop at home'),
    ]
    paper_sizes = [('a4', A4), ('letter', LETTER)]
    for slug, title in scenes:
        with Image.open(originals / f'{slug}.png') as source:
            art = source.convert('L')
            write_preview(media, slug, art)
            for size, paper in paper_sizes:
                write_sheet(sheets / f'{slug}-{size}.pdf', art, title, paper)

    collection = [character for character in characters if character.get('colouring')]
    if collection:
        packs = {}
        for size, paper in paper_sizes:
            pack = canvas.Canvas(str(sheets / f'crew-{size}.pdf'), pagesize=paper,
                                 pageCompression=1, invariant=1)
            pack.setTitle('Colour the SnackPack crew')
            packs[size] = pack
        for character in collection:
            slug, name = character['id'], character['name']
            original = originals / f'{slug}.png'
            with Image.open(original) as source:
                art = source.convert('L').point(lambda value: 255 if value > 215 else value)
                write_preview(media, slug, art)
                for size, paper in paper_sizes:
                    write_sheet(sheets / f'{slug}-{size}.pdf', art, name, paper)
                    draw_sheet(packs[size], art, name, paper)
        for pack in packs.values():
            pack.save()


if __name__ == '__main__':
    main()
