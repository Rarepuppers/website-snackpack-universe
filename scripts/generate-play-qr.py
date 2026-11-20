"""Generate a website download QR code from an Android application ID."""

import argparse
from pathlib import Path
import re


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("app_slug", help="Website app slug, such as snack-haul")
    parser.add_argument("application_id", help="Android application ID")
    args = parser.parse_args()

    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", args.app_slug):
        parser.error("app_slug must use lowercase letters, digits and hyphens")
    if not re.fullmatch(r"[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+", args.application_id):
        parser.error("application_id must be a valid dotted Android application ID")

    import qrcode

    url = f"https://play.google.com/store/apps/details?id={args.application_id}"
    target = Path(__file__).resolve().parents[1] / "assets" / "qrcodes" / f"qr-code-{args.app_slug}.png"
    target.parent.mkdir(parents=True, exist_ok=True)

    code = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=12, border=4)
    code.add_data(url)
    code.make_image(fill_color="black", back_color="white").save(target)
    print(f"{target}\n{url}")


if __name__ == "__main__":
    main()
