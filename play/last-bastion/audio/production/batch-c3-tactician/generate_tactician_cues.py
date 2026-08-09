"""Generate deterministic mono 48 kHz/24-bit Tactician suit-feedback masters."""

from pathlib import Path
import math
import random
import wave


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "masters"
RATE = 48_000


def envelope(index: int, count: int, decay: float, attack_ms: float = 10) -> float:
    attack = min(1.0, index / max(1.0, RATE * attack_ms / 1000)) ** 3
    release = min(1.0, (count - 1 - index) / max(1.0, RATE * 0.014)) ** 3
    return max(0.0, attack * release * math.exp(-decay * index / count))


def tactician_damage() -> list[float]:
    """Damped plate strike followed by a short broken sensor chirp."""
    duration = 0.22
    count = round(duration * RATE)
    rng = random.Random(0x7AC71C)
    samples = []
    for index in range(count):
        time = index / RATE
        x = index / max(1, count - 1)
        env = envelope(index, count, 7.0)
        plate = math.sin(2 * math.pi * (174 - 74 * x) * time) * 0.28
        sensor = math.sin(2 * math.pi * (1180 - 460 * x) * time) * math.exp(-((x - 0.18) / 0.12) ** 2) * 0.22
        crackle = (rng.random() * 2 - 1) * (0.22 * math.exp(-time * 48) + 0.035)
        samples.append(math.tanh((plate + sensor + crackle) * env * 1.1) * 0.65)
    return samples


def tactician_evade() -> list[float]:
    """Fast directional servo sweep with a clean targeting-array confirmation."""
    duration = 0.19
    count = round(duration * RATE)
    rng = random.Random(0xE7ADE)
    samples = []
    for index in range(count):
        time = index / RATE
        x = index / max(1, count - 1)
        env = envelope(index, count, 4.4, 7)
        servo = math.sin(2 * math.pi * (520 + 1040 * x) * time) * 0.25
        air = (rng.random() * 2 - 1) * 0.13 * math.sin(math.pi * x)
        confirm = math.sin(2 * math.pi * 1760 * time) * math.exp(-((x - 0.70) / 0.055) ** 2) * 0.17
        samples.append(math.tanh((servo + air + confirm) * env) * 0.62)
    return samples


def tactician_death() -> list[float]:
    """Command-link fragments collapse into a restrained suit power-down."""
    duration = 0.82
    count = round(duration * RATE)
    rng = random.Random(0xDE517)
    samples = []
    for index in range(count):
        time = index / RATE
        x = index / max(1, count - 1)
        env = envelope(index, count, 3.0)
        power = math.sin(2 * math.pi * (330 * (1 - x) + 54) * time) * 0.22
        link_a = math.sin(2 * math.pi * 1320 * time) * math.exp(-((x - 0.08) / 0.035) ** 2) * 0.16
        link_b = math.sin(2 * math.pi * 940 * time) * math.exp(-((x - 0.18) / 0.045) ** 2) * 0.13
        shutdown = math.sin(2 * math.pi * 72 * time) * math.exp(-((x - 0.46) / 0.18) ** 2) * 0.30
        static = (rng.random() * 2 - 1) * 0.065 * (1 - x)
        samples.append(math.tanh((power + link_a + link_b + shutdown + static) * env) * 0.68)
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
        "tactician-damage": tactician_damage(),
        "tactician-evade": tactician_evade(),
        "tactician-death": tactician_death(),
    }
    for stem, samples in cues.items():
        write_wav(OUT / f"{stem}.wav", samples)
    print(f"generated {len(cues)} Tactician WAV masters in {OUT}")


if __name__ == "__main__":
    main()
