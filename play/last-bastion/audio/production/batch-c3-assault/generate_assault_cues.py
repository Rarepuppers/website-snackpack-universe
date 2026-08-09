"""Generate deterministic mono 48 kHz/24-bit Assault suit-feedback masters."""

from pathlib import Path
import math
import random
import wave


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "masters"
RATE = 48_000


def envelope(index: int, count: int, decay: float, attack_ms: float = 12) -> float:
    # Cubic edge fades keep the first/last 3 ms under the project's -36 dBFS
    # screening threshold without adding a silent head or tail.
    attack = min(1.0, index / max(1.0, RATE * attack_ms / 1000)) ** 3
    release = min(1.0, (count - 1 - index) / max(1.0, RATE * 0.012)) ** 3
    return max(0.0, attack * release * math.exp(-decay * index / count))


def assault_damage() -> list[float]:
    duration = 0.19
    count = round(duration * RATE)
    rng = random.Random(0xA551)
    samples = []
    for index in range(count):
        time = index / RATE
        env = envelope(index, count, 7.5)
        armour = math.sin(2 * math.pi * (132 - 52 * time / duration) * time) * 0.42
        plate = math.sin(2 * math.pi * 710 * time) * math.exp(-time * 44) * 0.2
        impact = (rng.random() * 2 - 1) * (0.36 * math.exp(-time * 65) + 0.08)
        samples.append(math.tanh((armour + plate + impact) * env * 1.15) * 0.72)
    return samples


def assault_evade() -> list[float]:
    duration = 0.16
    count = round(duration * RATE)
    rng = random.Random(0xE6ADE)
    samples = []
    for index in range(count):
        time = index / RATE
        x = index / max(1, count - 1)
        env = envelope(index, count, 4.2)
        servo_frequency = 360 + 820 * x
        servo = math.sin(2 * math.pi * servo_frequency * time) * 0.3
        air = (rng.random() * 2 - 1) * 0.22 * math.sin(math.pi * x)
        latch = math.sin(2 * math.pi * 1180 * time) * math.exp(-((x - 0.72) / 0.09) ** 2) * 0.13
        samples.append(math.tanh((servo + air + latch) * env) * 0.68)
    return samples


def assault_death() -> list[float]:
    duration = 0.72
    count = round(duration * RATE)
    rng = random.Random(0xDEA7A)
    samples = []
    for index in range(count):
        time = index / RATE
        x = index / max(1, count - 1)
        env = envelope(index, count, 3.5)
        power_frequency = 260 * (1 - x) + 48
        power_down = math.sin(2 * math.pi * power_frequency * time) * 0.3
        armour_drop = math.sin(2 * math.pi * 82 * time) * math.exp(-((x - 0.28) / 0.12) ** 2) * 0.38
        relay = math.sin(2 * math.pi * 920 * time) * math.exp(-((x - 0.08) / 0.035) ** 2) * 0.12
        noise = (rng.random() * 2 - 1) * 0.1 * (1 - x)
        samples.append(math.tanh((power_down + armour_drop + relay + noise) * env) * 0.72)
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
        "assault-damage": assault_damage(),
        "assault-evade": assault_evade(),
        "assault-death": assault_death(),
    }
    for stem, samples in cues.items():
        write_wav(OUT / f"{stem}.wav", samples)
    print(f"generated {len(cues)} Assault WAV masters in {OUT}")


if __name__ == "__main__":
    main()
