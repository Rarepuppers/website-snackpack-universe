"""Generate deterministic mono 48 kHz/24-bit Scout suit-feedback masters."""

from pathlib import Path
import math
import random
import wave


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "masters"
RATE = 48_000


def envelope(index: int, count: int, decay: float, attack_ms: float = 5) -> float:
    attack = min(1.0, index / max(1.0, RATE * attack_ms / 1000)) ** 2
    release = min(1.0, (count - 1 - index) / max(1.0, RATE * 0.012)) ** 3
    return max(0.0, attack * release * math.exp(-decay * index / count))


def scout_damage() -> list[float]:
    """Light plate snap with a brief optical-sensor glitch."""
    duration = 0.16
    count = round(duration * RATE)
    rng = random.Random(0x5C017)
    samples = []
    for index in range(count):
        time = index / RATE
        x = index / max(1, count - 1)
        env = envelope(index, count, 8.2, 3)
        plate = math.sin(2 * math.pi * (260 - 90 * x) * time) * 0.22
        optic = math.sin(2 * math.pi * (1840 - 720 * x) * time) * math.exp(-((x - 0.16) / 0.09) ** 2) * 0.20
        snap = (rng.random() * 2 - 1) * (0.25 * math.exp(-time * 62) + 0.025)
        samples.append(math.tanh((plate + optic + snap) * env * 1.05) * 0.62)
    return samples


def scout_evade() -> list[float]:
    """Compressed fabric rush, fast servo sweep, and short ranging ping."""
    duration = 0.14
    count = round(duration * RATE)
    rng = random.Random(0xDA54)
    samples = []
    for index in range(count):
        time = index / RATE
        x = index / max(1, count - 1)
        env = envelope(index, count, 4.8, 2)
        servo = math.sin(2 * math.pi * (680 + 1450 * x) * time) * 0.20
        fabric = (rng.random() * 2 - 1) * 0.20 * math.sin(math.pi * x)
        ping = math.sin(2 * math.pi * 2320 * time) * math.exp(-((x - 0.68) / 0.045) ** 2) * 0.15
        samples.append(math.tanh((servo + fabric + ping) * env) * 0.60)
    return samples


def scout_death() -> list[float]:
    """Cascading sensor faults collapse into a lightweight suit power-down."""
    duration = 0.68
    count = round(duration * RATE)
    rng = random.Random(0xDE5C017)
    samples = []
    for index in range(count):
        time = index / RATE
        x = index / max(1, count - 1)
        env = envelope(index, count, 3.4, 7)
        power = math.sin(2 * math.pi * (420 * (1 - x) + 68) * time) * 0.18
        fault_a = math.sin(2 * math.pi * 2020 * time) * math.exp(-((x - 0.07) / 0.025) ** 2) * 0.15
        fault_b = math.sin(2 * math.pi * 1510 * time) * math.exp(-((x - 0.15) / 0.032) ** 2) * 0.13
        fault_c = math.sin(2 * math.pi * 980 * time) * math.exp(-((x - 0.25) / 0.045) ** 2) * 0.11
        shutdown = math.sin(2 * math.pi * 94 * time) * math.exp(-((x - 0.48) / 0.17) ** 2) * 0.24
        static = (rng.random() * 2 - 1) * 0.05 * (1 - x)
        samples.append(math.tanh((power + fault_a + fault_b + fault_c + shutdown + static) * env) * 0.64)
    return samples


def write_wav(path: Path, samples: list[float]) -> None:
    with wave.open(str(path), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(3)
        output.setframerate(RATE)
        payload = bytearray()
        for value in samples:
            sample = int(max(-1.0, min(1.0, value)) * 0x7FFFFF)
            if sample < 0:
                sample += 0x1000000
            payload.extend((sample & 255, (sample >> 8) & 255, (sample >> 16) & 255))
        output.writeframes(payload)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    cues = {
        "scout-damage": scout_damage(),
        "scout-evade": scout_evade(),
        "scout-death": scout_death(),
    }
    for stem, samples in cues.items():
        write_wav(OUT / f"{stem}.wav", samples)
    print(f"generated {len(cues)} Scout WAV masters in {OUT}")


if __name__ == "__main__":
    main()
