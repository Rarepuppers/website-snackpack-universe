import fs from "node:fs";
import path from "node:path";

const root = path.resolve(".");
const play = path.join(root, "play");
const baseline = new Set(JSON.parse(fs.readFileSync(path.join(root, "data", "arcade-baseline.json"), "utf8")));
const reserved = new Set(["daily", "stats", "last-bastion", "shared-assets", "social", "sprites", "tiles"]);
const candidates = fs.readdirSync(play, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !reserved.has(entry.name) && fs.existsSync(path.join(play, entry.name, "index.html")))
  .map((entry) => entry.name)
  .filter((slug) => !baseline.has(slug));

const problems = [];
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const hub = fs.readFileSync(path.join(play, "index.html"), "utf8");

for (const slug of candidates) {
  const dir = path.join(play, slug);
  const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  const textWords = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").trim().split(/\s+/).length;
  const checks = [
    [html.includes('"@type": "VideoGame"'), "VideoGame JSON-LD"],
    [html.includes('"@type": "FAQPage"'), "FAQPage JSON-LD"],
    [html.includes('<footer class="foot"'), "site footer"],
    [html.includes("funnel-card"), "download funnel"],
    [textWords >= 350, "350 words of page copy"],
    [/keyboard-grid\.js|data-no-keyboard-reason/.test(html), "keyboard support or written waiver"],
    [html.includes("share-result.js"), "result sharing"],
    [!/(requestAnimationFrame|<canvas)/.test(html) || html.includes("pause.js"), "pause support for continuous/canvas play"],
    [/audio\.js|game-ui-assets\.js/.test(html), "shared audio"],
    [html.includes("resume.js"), "saved progress"],
    [/_best_|bestKey|SnackPackStore/.test(html), "persisted best result"],
    [/daily|data-no-daily-reason/.test(html), "daily mode or written waiver"],
    [html.includes("related-games:generated"), "related games block"],
    [hub.includes(`./${slug}/`), "hub tile"],
    [fs.existsSync(path.join(play, "tiles", `${slug}.png`)) || fs.existsSync(path.join(play, "tiles", `${slug}.svg`)), "144×144 hub art"],
    [fs.existsSync(path.join(play, "social", `${slug}.png`)), "1200×630 social card"],
    [fs.existsSync(path.join(dir, "SCORECARD.md")), "completed search/naming scorecard"],
    [sitemap.includes(`/play/${slug}/`), "sitemap entry"],
    [sw.includes(`/play/${slug}/`) || sw.includes("cache itself the first time"), "offline-cache coverage"]
  ];
  for (const [ok, label] of checks) if (!ok) problems.push(`${slug}: missing ${label}`);
}

if (problems.length) {
  console.error(`New arcade game quality gate failed (${problems.length}):\n\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log(candidates.length ? `New-game quality gate passed for: ${candidates.join(", ")}` : "New-game quality gate passed; no unreviewed game ports detected.");
