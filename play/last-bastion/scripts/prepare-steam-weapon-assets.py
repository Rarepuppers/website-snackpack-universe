from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "art" / "production-tests" / "legacy-weapon-refresh"
TARGET = (256, 128)


def prepare(name: str) -> None:
    source = Image.open(ROOT / f"{name}-gameplay-v2-source.png").convert("RGBA")
    pixels = source.load()
    for y in range(source.height):
        for x in range(source.width):
            r, g, b, a = pixels[x, y]
            distance = max(abs(r), abs(g - 255), abs(b))
            if g > 180 and g > r * 1.35 and g > b * 1.35:
                alpha = max(0, min(255, int((distance - 24) * 12)))
                pixels[x, y] = (0, 0, 0, alpha)
    alpha = source.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        raise RuntimeError(f"No foreground found in {name}")
    foreground = source.crop(bbox)
    scale = min((TARGET[0] - 16) / foreground.width, (TARGET[1] - 16) / foreground.height)
    resized = foreground.resize(
        (round(foreground.width * scale), round(foreground.height * scale)),
        Image.Resampling.LANCZOS,
    )
    output = Image.new("RGBA", TARGET, (0, 0, 0, 0))
    output.alpha_composite(resized, ((TARGET[0] - resized.width) // 2, (TARGET[1] - resized.height) // 2))
    output.save(ROOT / f"{name}-gameplay-v2-256x128.png", optimize=True)


for weapon in ("service-rifle", "scattergun", "arc-carbine"):
    prepare(weapon)
