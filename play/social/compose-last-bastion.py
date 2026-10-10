"""Compose the Last Bastion share card from approved retained game art."""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
GAME_ART = ROOT / "last-bastion" / "art" / "production-tests"
BACKDROP = GAME_ART / "ui-batch-title" / "title-menu-backdrop-v1-3840x2160.png"
MARINE = GAME_ART / "batch-character-select" / "marine-select-portrait-v1-1024x1536.png"
OUTPUT = Path(__file__).with_name("last-bastion.png")
WIDTH, HEIGHT = 1200, 630


def cover(source: Image.Image, width: int, height: int) -> Image.Image:
    scale = max(width / source.width, height / source.height)
    fitted = source.resize((round(source.width * scale), round(source.height * scale)), Image.Resampling.LANCZOS)
    left = (fitted.width - width) // 2
    top = (fitted.height - height) // 2
    return fitted.crop((left, top, left + width, top + height))


def main() -> None:
    backdrop = cover(Image.open(BACKDROP).convert("RGB"), WIDTH, HEIGHT).convert("RGBA")
    marine = Image.open(MARINE).convert("RGB")
    marine = marine.resize((480, 720), Image.Resampling.LANCZOS).crop((0, 45, 480, 675)).convert("RGBA")
    alpha = np.zeros((HEIGHT, 480), dtype=np.uint8)
    for x in range(480):
        alpha[:, x] = round(255 * max(0, min(1, (480 - x) / 115)))
    marine.putalpha(Image.fromarray(alpha, "L"))
    backdrop.alpha_composite(marine, (0, 0))

    overlay = Image.new("RGBA", (WIDTH, HEIGHT))
    shade = np.zeros((HEIGHT, WIDTH, 4), dtype=np.uint8)
    for x in range(WIDTH):
        shade[:, x] = (3, 11, 20, round(105 * max(0, min(1, (x - 360) / 220))))
    overlay.alpha_composite(Image.fromarray(shade, "RGBA"))
    backdrop.alpha_composite(overlay)

    draw = ImageDraw.Draw(backdrop)
    title_font = ImageFont.truetype(r"C:\Windows\Fonts\bahnschrift.ttf", 100)
    tagline_font = ImageFont.truetype(r"C:\Windows\Fonts\consolab.ttf", 34)
    detail_font = ImageFont.truetype(r"C:\Windows\Fonts\consola.ttf", 22)
    draw.rectangle((557, 144, 563, 454), fill=(104, 228, 232, 255))
    draw.text((590, 152), "LAST", font=title_font, fill=(244, 239, 222, 255), stroke_width=1, stroke_fill=(244, 239, 222, 255))
    draw.text((590, 254), "BASTION", font=title_font, fill=(244, 239, 222, 255), stroke_width=1, stroke_fill=(244, 239, 222, 255))
    draw.text((593, 385), "HOLD THE LINE", font=tagline_font, fill=(104, 228, 232, 255))
    draw.text((593, 461), "FREE BROWSER ROGUELITE", font=detail_font, fill=(215, 226, 231, 255))
    draw.line((593, 527, 1135, 527), fill=(104, 228, 232, 125), width=2)
    backdrop.convert("RGB").save(OUTPUT, optimize=True)
    print(f"Wrote {OUTPUT}: {WIDTH}x{HEIGHT}")


if __name__ == "__main__":
    main()
