"""Normalize retained Tactician C3 masters into stable runtime candidates."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent
LANCZOS = Image.Resampling.LANCZOS


def normalize_body() -> None:
    source = Image.open(ROOT / "tactician-base-spritesheet-v1-alpha-master.png").convert("RGBA")
    if source.size != (1448, 1086):
        raise RuntimeError(f"Unexpected Tactician master size: {source.size}")

    columns = 4
    rows = 3
    cell_width = source.width // columns
    cell_height = source.height // rows
    if cell_width != cell_height:
        raise RuntimeError(f"Tactician master cells are not square: {cell_width}x{cell_height}")

    atlas = Image.new("RGBA", (columns * 96, rows * 96))
    for row in range(rows):
        for column in range(columns):
            cell = source.crop((
                column * cell_width,
                row * cell_height,
                (column + 1) * cell_width,
                (row + 1) * cell_height,
            ))
            bounds = cell.getchannel("A").getbbox()
            if bounds is None:
                raise RuntimeError(f"Empty Tactician body frame {row * columns + column}")
            art = cell.crop(bounds)
            scale = min(88 / art.width, 88 / art.height)
            art = art.resize(
                (max(1, round(art.width * scale)), max(1, round(art.height * scale))),
                LANCZOS,
            )
            x = column * 96 + (96 - art.width) // 2
            y = row * 96 + 92 - art.height
            atlas.alpha_composite(art, (x, y))

    atlas.save(ROOT / "tactician-base-spritesheet-v1-96.png", optimize=True)


def normalize_portrait() -> None:
    portrait = Image.open(ROOT / "tactician-select-portrait-v1-1024x1536.png").convert("RGB")
    if portrait.size != (1024, 1536):
        raise RuntimeError(f"Unexpected Tactician portrait size: {portrait.size}")
    portrait.save(
        ROOT / "tactician-select-portrait-v1-1024x1536.webp",
        "WEBP",
        quality=86,
        method=6,
    )
    tile = portrait.crop((192, 96, 832, 736)).resize((128, 128), LANCZOS)
    tile.save(ROOT / "tactician-roster-tile-v1-128.png", optimize=True)


def main() -> None:
    normalize_body()
    normalize_portrait()


if __name__ == "__main__":
    main()
