from pathlib import Path
import math, random, struct, wave

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "masters"
RATE = 48000
RECIPES = {
    "marine-knife-warning": (0.22, 330, 0.38, 0.25),
    "marine-knife-whoosh": (0.19, 210, 0.24, 0.48),
    "marine-cover-impact": (0.16, 95, 0.52, 0.55),
    "marine-armour-impact": (0.19, 125, 0.58, 0.48),
    "abomination-low-windup": (0.72, 72, 0.28, 0.42),
    "abomination-heavy-slam": (0.34, 58, 0.78, 0.66),
    "abomination-exhausted-recovery": (0.46, 110, 0.22, 0.38),
    "survivor-pack-rush": (0.24, 180, 0.34, 0.46),
}

def synth(name, duration, pitch, snap, noise):
    count = round(duration * RATE); rng = random.Random(sum(ord(c) for c in name)); out = []
    for i in range(count):
        x = i / max(1, count - 1); t = i / RATE
        edge = min(1.0, i / (RATE * .003), (count - 1 - i) / (RATE * .003))
        decay = math.exp(-x * (3.5 if duration > .5 else 7.0))
        n = rng.random() * 2 - 1
        body = math.sin(2 * math.pi * pitch * (1 + .8 * math.exp(-t * 25)) * t) * .48 + n * noise
        transient = (rng.random() * 2 - 1) * snap * max(0, 1 - i / (RATE * .012))
        value = math.tanh((body * decay + transient) * .9) * .72 * max(0, edge)
        out.append(max(-1, min(1, value)))
    return out

def write_wav(path, samples):
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(1); wav.setsampwidth(3); wav.setframerate(RATE)
        payload = bytearray()
        for value in samples:
            n = int(value * 0x6FFFFF)
            if n < 0: n += 0x1000000
            payload += bytes((n & 255, (n >> 8) & 255, (n >> 16) & 255))
        wav.writeframes(payload)

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, recipe in RECIPES.items(): write_wav(OUT / f"{name}.wav", synth(name, *recipe))
    print(f"generated {len(RECIPES)} S2 WAV masters in {OUT}")

if __name__ == "__main__": main()
