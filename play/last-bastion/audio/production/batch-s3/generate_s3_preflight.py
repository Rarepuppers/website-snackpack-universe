from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "batch-s2"))
from generate_s2_preflight import synth, write_wav

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "masters"
RECIPES = {
    "flesh-impact-a": (0.12, 170, 0.42, 0.50), "flesh-impact-b": (0.13, 205, 0.38, 0.46),
    "armour-impact-a": (0.14, 115, 0.55, 0.36), "armour-impact-b": (0.15, 145, 0.50, 0.34),
    "shield-impact-a": (0.18, 620, 0.34, 0.24), "shield-impact-b": (0.19, 710, 0.30, 0.22),
    "brittle-cover-impact": (0.16, 90, 0.62, 0.58), "reinforced-cover-impact": (0.20, 68, 0.68, 0.42),
    "pickup-confirm": (0.22, 540, 0.36, 0.18), "xp-tick": (0.14, 760, 0.26, 0.16),
    "level-up-stinger": (0.62, 430, 0.34, 0.16), "chest-shop-confirm": (0.30, 300, 0.42, 0.20),
    "player-damage-a": (0.16, 105, 0.58, 0.44), "player-damage-b": (0.17, 125, 0.52, 0.40),
    "boss-warning-stinger": (0.52, 78, 0.32, 0.26), "reward-stinger": (0.58, 510, 0.34, 0.14),
}

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, recipe in RECIPES.items(): write_wav(OUT / f"{name}.wav", synth(name, *recipe))
    print(f"generated {len(RECIPES)} S3 WAV masters in {OUT}")

if __name__ == "__main__": main()
