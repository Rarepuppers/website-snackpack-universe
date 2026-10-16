"""Read-only alpha/frame audit. Run after inventory-production-assets.mjs. Never edits art."""
from pathlib import Path
from PIL import Image
import json
root = Path(__file__).resolve().parents[2]
data = json.loads((root / "asset-inventory.json").read_text(encoding="utf-8"))
rows = []
for asset in data["assets"]:
    source = next((s for s in asset["sources"] if s["path"].endswith(".png")), asset["sources"][0])
    with Image.open(root / source["path"]) as image:
        width, height = image.size
        fw, fh = asset["sourceFrameWidth"], asset["sourceFrameHeight"]
        cols = max(1, width // fw)
        alpha = image.convert("RGBA").getchannel("A")
        bounds = []
        for index in range(asset["frameCount"]):
            x, y = index % cols * fw, index // cols * fh
            if x + fw > width or y + fh > height:
                raise ValueError(f"Out-of-bounds frame {asset['id']}:{index}")
            bounds.append(alpha.crop((x, y, x + fw, y + fh)).getbbox())
        rows.append({"id": asset["id"], "source": source["path"], "pixels": [width, height],
                     "rgbaMiB": round(width * height * 4 / 1048576, 3), "frameAlphaBounds": bounds,
                     "anchorContract": "MarineHelmetRegistration.ts per-pose offsets" if asset["id"] == "marine-helmet-v1" else "manifest pivot; attachment offsets remain consumer-owned"})
(root / "asset-geometry.json").write_text(json.dumps({"schemaVersion": 1, "warning": "Alpha bounds are source-frame coordinates; RGBA estimate excludes mipmaps, engine backing textures and duplicate residency.", "assets": rows}, indent=2) + "\n", encoding="utf-8")
print(f"Audited {len(rows)} asset frame contracts")
