"""Promote retained Batch I chroma masters into stable runtime atlases."""

from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST


def extract_chroma(source_name: str) -> Image.Image:
    source = Image.open(ROOT / source_name).convert("RGB")
    output = Image.new("RGBA", source.size, (0, 0, 0, 0))
    for y in range(source.height):
        for x in range(source.width):
            red, green, blue = source.getpixel((x, y))
            distance = ((red - 255) ** 2 + green**2 + (blue - 255) ** 2) ** 0.5
            magenta_like = green < 110 and red > 145 and blue > 145 and abs(red - blue) < 115
            alpha = 0 if magenta_like else max(0, min(255, round((distance - 58) * 5.2)))
            if alpha == 0:
                continue
            spill = min(1.0, alpha / 255.0)
            output.putpixel(
                (x, y),
                (
                    round(red * (1 - 0.12 * spill)),
                    round(green * (1 - 0.06 * spill)),
                    round(blue * (1 - 0.12 * spill)),
                    alpha,
                ),
            )
    return output


def runtime_atlas(source_name: str, output_name: str, size: int) -> None:
    source = extract_chroma(source_name)
    subjects: list[Image.Image] = []
    for row in range(2):
        for column in range(4):
            cell = source.crop((
                round(column * source.width / 4),
                round(row * source.height / 2),
                round((column + 1) * source.width / 4),
                round((row + 1) * source.height / 2),
            ))
            bounds = cell.getchannel("A").getbbox()
            if bounds is None:
                raise ValueError(f"{source_name} cell {len(subjects)} is empty")
            subjects.append(cell.crop(bounds))

    scale = min(
        (size - 8) / max(subject.width for subject in subjects),
        (size - 8) / max(subject.height for subject in subjects),
    )
    atlas = Image.new("RGBA", (8 * size, size), (0, 0, 0, 0))
    for index, subject in enumerate(subjects):
        width = max(1, round(subject.width * scale))
        height = max(1, round(subject.height * scale))
        resized = subject.resize((width, height), NEAREST)
        atlas.alpha_composite(resized, (index * size + (size - width) // 2, (size - height) // 2))
    atlas.save(ROOT / output_name, optimize=True)


def fit_subject(subject: Image.Image, width: int, height: int, padding: int = 0) -> Image.Image:
    bounds = subject.getchannel("A").getbbox()
    if bounds is None:
        raise ValueError("Generated UI crop contains no visible pixels")
    subject = subject.crop(bounds)
    scale = min((width - padding * 2) / subject.width, (height - padding * 2) / subject.height)
    resized = subject.resize((max(1, round(subject.width * scale)), max(1, round(subject.height * scale))), NEAREST)
    output = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    output.alpha_composite(resized, ((width - resized.width) // 2, (height - resized.height) // 2))
    return output


def slot_ui_atlas() -> None:
    source = extract_chroma("slot-tier-ui-master-v1-chroma.png")
    atlas = Image.new("RGBA", (16 * 128, 128), (0, 0, 0, 0))
    for row in range(4):
        for column in range(4):
            crop = source.crop((
                round(column * source.width / 4),
                round(row * source.height / 4),
                round((column + 1) * source.width / 4),
                round((row + 1) * source.height / 4),
            ))
            frame = fit_subject(crop, 128, 128, 8)
            atlas.alpha_composite(frame, ((row * 4 + column) * 128, 0))
    atlas.save(ROOT / "slot-tier-ui-atlas-v1-128.png", optimize=True)


def placement_shop_ui() -> None:
    source = extract_chroma("placement-shop-ui-master-v1-chroma.png")
    width, height = source.size
    placement = source.crop((0, 0, round(width * 0.64), round(height * 0.55)))
    stat_card = source.crop((round(width * 0.64), 0, width, round(height * 0.58)))
    shop = source.crop((0, round(height * 0.54), round(width * 0.65), height))
    glyph_strip = source.crop((round(width * 0.64), round(height * 0.68), width, round(height * 0.88)))

    fit_subject(placement, 900, 560, 4).save(ROOT / "placement-modal-frame-v1-900x560.png", optimize=True)
    fit_subject(stat_card, 320, 420, 4).save(ROOT / "weapon-stat-card-v1-320x420.png", optimize=True)
    fit_subject(shop, 1200, 700, 4).save(ROOT / "shop-counter-backdrop-v1-1200x700.png", optimize=True)

    glyphs = Image.new("RGBA", (3 * 48, 48), (0, 0, 0, 0))
    for index in range(3):
        crop = glyph_strip.crop((
            round(index * glyph_strip.width / 3), 0,
            round((index + 1) * glyph_strip.width / 3), glyph_strip.height,
        ))
        glyphs.alpha_composite(fit_subject(crop, 48, 48, 2), (index * 48, 0))
    glyphs.save(ROOT / "shop-action-glyph-atlas-v1-48.png", optimize=True)


def main() -> None:
    runtime_atlas("codex-weapon-tiles-v1-96-chroma.png", "codex-weapon-tile-atlas-v1-128.png", 128)
    runtime_atlas("perk-tiles-v1-64-chroma.png", "perk-tile-atlas-v1-128.png", 128)
    runtime_atlas("hotkey-action-tiles-v1-64-chroma.png", "hotkey-action-tile-atlas-v1-128.png", 128)
    slot_ui_atlas()
    placement_shop_ui()
    print("Wrote Batch I1, I2, and I3 transparent runtime assets")


if __name__ == "__main__":
    main()
