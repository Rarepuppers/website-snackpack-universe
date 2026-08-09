"""Normalize retained Assault C3 masters into transparent Phaser atlases."""

from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parent
LANCZOS = Image.Resampling.LANCZOS


def normalize_body() -> None:
    source = Image.open(ROOT / "assault-base-spritesheet-v1-alpha-master.png").convert("RGBA")
    if source.size != (1448, 1086):
        raise RuntimeError(f"Unexpected Assault master size: {source.size}")

    columns = 4
    rows = 3
    cell_width = source.width // columns
    cell_height = source.height // rows
    if cell_width != cell_height:
        raise RuntimeError(f"Assault master cells are not square: {cell_width}x{cell_height}")

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
                raise RuntimeError(f"Empty Assault body frame {row * columns + column}")
            art = cell.crop(bounds)
            scale = min(88 / art.width, 88 / art.height)
            art = art.resize(
                (max(1, round(art.width * scale)), max(1, round(art.height * scale))),
                LANCZOS,
            )
            x = column * 96 + (96 - art.width) // 2
            # Keep every state on a stable gameplay baseline; this prevents the
            # directional roll from bobbing when the presentation frame changes.
            y = row * 96 + 92 - art.height
            atlas.alpha_composite(art, (x, y))

    atlas.save(ROOT / "assault-base-spritesheet-v1-96.png", optimize=True)


def normalize_overlay() -> None:
    source = Image.open(ROOT / "assault-breach-module-overlay-v1-alpha-master.png").convert("RGBA")
    if source.size != (1448, 1086):
        raise RuntimeError(f"Unexpected Assault overlay master size: {source.size}")
    cell_width = source.width // 4
    cell_height = source.height // 3
    atlas = Image.new("RGBA", (384, 288))
    for row in range(3):
        for column in range(4):
            cell = source.crop((
                column * cell_width,
                row * cell_height,
                (column + 1) * cell_width,
                (row + 1) * cell_height,
            ))
            # The overlay master was authored against the same full-cell grid as
            # the body. Resize the complete cell instead of fitting its visible
            # bounds or the helmet/shoulder/forearm relationship would drift.
            cell = cell.resize((96, 96), LANCZOS)
            if row == 1 and column == 0:
                # The moving-south forearm module landed one hand-width outside
                # its authored limb. Move that isolated component onto the
                # raised arm while preserving every other generated pixel.
                fragment = cell.crop((68, 44, 96, 82))
                cell.paste((0, 0, 0, 0), (68, 44, 96, 82))
                cell.alpha_composite(fragment, (55, 44))
            atlas.alpha_composite(cell, (column * 96, row * 96))
    atlas.save(ROOT / "assault-breach-module-overlay-v1-96.png", optimize=True)

    body = Image.open(ROOT / "assault-base-spritesheet-v1-96.png").convert("RGBA")
    Image.alpha_composite(body, atlas).save(ROOT / "assault-composite-preview-v1-96.png", optimize=True)


def normalize_portrait() -> None:
    portrait = Image.open(ROOT / "assault-select-portrait-v1-1024x1536.png").convert("RGB")
    if portrait.size != (1024, 1536):
        raise RuntimeError(f"Unexpected Assault portrait size: {portrait.size}")
    portrait.save(
        ROOT / "assault-select-portrait-v1-1024x1536.webp",
        "WEBP",
        quality=86,
        method=6,
    )
    # Fixed square crop around helmet and shoulders for compact roster lists.
    tile = portrait.crop((192, 96, 832, 736)).resize((128, 128), LANCZOS)
    tile.save(ROOT / "assault-roster-tile-v1-128.png", optimize=True)


def main() -> None:
    normalize_body()
    normalize_overlay()
    normalize_portrait()


if __name__ == "__main__":
    main()
