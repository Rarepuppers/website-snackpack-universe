import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sampleRate = 48_000;
const root = fileURLToPath(new URL("../../audio/production/batch-s1/", import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8"));
const mastersDir = path.join(root, "masters");
const runtimeDir = fileURLToPath(new URL("../src/game/audio/runtime/batch-s1/", import.meta.url));
const ffmpeg = process.env.FFMPEG_PATH || process.argv.find((arg) => arg.startsWith("--ffmpeg="))?.slice(9);

await mkdir(mastersDir, { recursive: true });
await mkdir(runtimeDir, { recursive: true });

const recipes = {
  "service-rifle-fire": { duration: 0.105, body: "ballistic", pitch: 155, snap: 0.72, noise: 0.42, gain: 0.56 },
  "scattergun-fire": { duration: 0.255, body: "blast", pitch: 82, snap: 0.9, noise: 0.72, gain: 0.62 },
  "arc-carbine-fire": { duration: 0.145, body: "arc", pitch: 980, snap: 0.4, noise: 0.25, gain: 0.46 },
  "patrol-blade-swing": { duration: 0.19, body: "blade", pitch: 430, snap: 0.18, noise: 0.42, gain: 0.48 },
  "bolt-carbine-fire": { duration: 0.175, body: "bolt", pitch: 420, snap: 0.62, noise: 0.28, gain: 0.53 },
  "grenade-tube-launch": { duration: 0.225, body: "launcher", pitch: 105, snap: 0.5, noise: 0.46, gain: 0.56 },
  "injector-carbine-fire": { duration: 0.125, body: "injector", pitch: 610, snap: 0.32, noise: 0.2, gain: 0.42 },
};

for (const family of manifest.families) {
  for (let index = 0; index < family.assets.length; index += 1) {
    const asset = family.assets[index];
    const samples = asset.role === "loop"
      ? rotaryLoop(0.48)
      : asset.role === "loop-start"
        ? rotaryTransition(0.21, true)
        : asset.role === "loop-end"
          ? rotaryTransition(0.25, false)
          : synthOneShot(recipes[asset.fileStem.replace(/-[abc]$/, "")], index, hash(asset.fileStem));
    await writeFile(path.join(mastersDir, `${asset.fileStem}.wav`), encodeWav24(samples));
  }
}

if (ffmpeg) {
  for (const asset of manifest.families.flatMap((family) => family.assets)) {
    const input = path.join(mastersDir, `${asset.fileStem}.wav`);
    await transcode(input, path.join(runtimeDir, `${asset.fileStem}.ogg`), ["-c:a", "libvorbis", "-q:a", "5"]);
    await transcode(input, path.join(runtimeDir, `${asset.fileStem}.mp3`), ["-c:a", "libmp3lame", "-q:a", "3"]);
  }
} else {
  console.warn("WAV masters generated; set FFMPEG_PATH or pass --ffmpeg=<path> to derive OGG/MP3.");
}

function synthOneShot(recipe, variant, seed) {
  if (!recipe) throw new Error("missing audio recipe");
  const count = Math.round(recipe.duration * sampleRate);
  const out = new Float64Array(count);
  const random = mulberry32(seed);
  let filteredNoise = 0;
  const detune = [-0.035, 0.018, 0.052][variant] ?? 0;
  for (let i = 0; i < count; i += 1) {
    const t = i / sampleRate;
    const x = i / (count - 1);
    const edge = edgeEnvelope(i, count, 0.003);
    const decay = Math.exp(-x * (recipe.body === "blast" ? 5.2 : 7.5));
    filteredNoise = filteredNoise * 0.62 + (random() * 2 - 1) * 0.38;
    const f = recipe.pitch * (1 + detune) * (1 + 0.8 * Math.exp(-t * 34));
    let body = 0;
    if (recipe.body === "ballistic") body = Math.sin(2 * Math.PI * f * t) * 0.55 + filteredNoise * recipe.noise;
    if (recipe.body === "blast") body = Math.sin(2 * Math.PI * f * t) * 0.7 + filteredNoise * recipe.noise + Math.sin(2 * Math.PI * 51 * t) * 0.22;
    if (recipe.body === "arc") body = Math.sin(2 * Math.PI * f * t + 5 * Math.sin(2 * Math.PI * 93 * t)) * 0.58 + filteredNoise * recipe.noise;
    if (recipe.body === "blade") body = Math.sin(2 * Math.PI * (f + 900 * x) * t) * (0.25 + 0.6 * Math.sin(Math.PI * x)) + filteredNoise * recipe.noise;
    if (recipe.body === "bolt") body = Math.sign(Math.sin(2 * Math.PI * f * t)) * 0.38 + Math.sin(2 * Math.PI * f * 0.5 * t) * 0.28 + filteredNoise * recipe.noise;
    if (recipe.body === "launcher") body = Math.sin(2 * Math.PI * f * t) * 0.65 + filteredNoise * recipe.noise + Math.sin(2 * Math.PI * 46 * t) * 0.2;
    if (recipe.body === "injector") body = Math.sin(2 * Math.PI * f * t) * 0.45 + Math.sin(2 * Math.PI * f * 1.51 * t) * 0.18 + filteredNoise * recipe.noise;
    const transient = i < sampleRate * 0.012 ? (random() * 2 - 1) * recipe.snap * (1 - i / (sampleRate * 0.012)) : 0;
    out[i] = softClip((body * decay + transient) * recipe.gain * edge);
  }
  return out;
}

function rotaryLoop(duration) {
  const count = Math.round(duration * sampleRate);
  const out = new Float64Array(count);
  const random = mulberry32(0xb017a4);
  let filtered = 0;
  for (let i = 0; i < count; i += 1) {
    const phase = i / (count - 1);
    filtered = filtered * 0.78 + (random() * 2 - 1) * 0.22;
    const rotor = Math.sin(2 * Math.PI * 48 * phase) * 0.3 + Math.sin(2 * Math.PI * 96 * phase) * 0.14;
    const pulse = Math.pow(Math.max(0, Math.sin(2 * Math.PI * 24 * phase)), 7) * 0.44;
    out[i] = softClip((rotor + pulse + filtered * 0.1) * 0.56) * edgeEnvelope(i, count, 0.0015);
  }
  // Exact silent splice guards keep value and slope continuous in every decoder.
  const guard = Math.round(sampleRate * 0.0015);
  for (let i = 0; i < guard; i += 1) out[i] = out[count - 1 - i] = 0;
  return out;
}

function rotaryTransition(duration, starting) {
  const count = Math.round(duration * sampleRate);
  const out = new Float64Array(count);
  const random = mulberry32(starting ? 0x51a27 : 0xe0d27);
  let filtered = 0;
  for (let i = 0; i < count; i += 1) {
    const x = i / (count - 1);
    const motion = starting ? x : 1 - x;
    const f = 28 + 95 * motion * motion;
    filtered = filtered * 0.72 + (random() * 2 - 1) * 0.28;
    const envelope = starting ? Math.pow(x, 0.7) : Math.pow(1 - x, 0.9);
    out[i] = softClip((Math.sin(2 * Math.PI * f * i / sampleRate) * 0.4 + filtered * 0.18) * envelope * 0.52 * edgeEnvelope(i, count, 0.003));
  }
  return out;
}

function edgeEnvelope(index, count, seconds) {
  const guard = Math.max(1, Math.round(sampleRate * seconds));
  const ramp = Math.round(sampleRate * 0.001);
  const distance = Math.min(index, count - 1 - index);
  return distance < guard ? 0 : Math.min(1, (distance - guard) / ramp);
}

function softClip(value) { return Math.tanh(value * 1.35) / Math.tanh(1.35); }
function hash(text) { let value = 2166136261; for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619); return value >>> 0; }
function mulberry32(seed) { return () => { seed |= 0; seed = seed + 0x6d2b79f5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function encodeWav24(samples) {
  const dataSize = samples.length * 3;
  const bytes = Buffer.alloc(44 + dataSize);
  bytes.write("RIFF", 0); bytes.writeUInt32LE(36 + dataSize, 4); bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(sampleRate, 24); bytes.writeUInt32LE(sampleRate * 3, 28);
  bytes.writeUInt16LE(3, 32); bytes.writeUInt16LE(24, 34); bytes.write("data", 36); bytes.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i += 1) {
    let value = Math.round(Math.max(-1, Math.min(1, samples[i])) * 0x6fffff);
    if (value < 0) value += 0x1000000;
    bytes[44 + i * 3] = value & 0xff; bytes[45 + i * 3] = value >>> 8 & 0xff; bytes[46 + i * 3] = value >>> 16 & 0xff;
  }
  return bytes;
}

function transcode(input, output, codecArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-i", input, "-map_metadata", "-1", "-ac", "1", "-ar", String(sampleRate), ...codecArgs, output], { stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)));
  });
}
