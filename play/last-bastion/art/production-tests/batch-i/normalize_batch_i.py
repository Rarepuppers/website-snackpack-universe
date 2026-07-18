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


def main() -> None:
    runtime_atlas("codex-weapon-tiles-v1-96-chroma.png", "codex-weapon-tile-atlas-v1-128.png", 128)
    runtime_atlas("perk-tiles-v1-64-chroma.png", "perk-tile-atlas-v1-128.png", 128)
    runtime_atlas("hotkey-action-tiles-v1-64-chroma.png", "hotkey-action-tile-atlas-v1-128.png", 128)
    print("Wrote three transparent Batch I 8 x 128 runtime atlases")


if __name__ == "__main__":
    main()
