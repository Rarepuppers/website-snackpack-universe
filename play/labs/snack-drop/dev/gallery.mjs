import fs from "node:fs/promises";
import path from "node:path";
import { open } from "./browser.mjs";

const output = path.resolve(process.argv[2] || "snack-drop-gallery");
for (const [width, height] of [[412, 860], [1280, 800]]) {
  const dir = path.join(output, `${width}x${height}`);
  await fs.mkdir(dir, { recursive: true });
  const { page, base, errors, close } = await open({ width, height });
  try {
    for (const view of ["snacks", "containers", "cameos"]) {
      const url = new URL(`dev/gallery.html?view=${view}`, base);
      await page.goto(url.href);
      await page.waitForSelector('html[data-gallery-ready="true"]');
      await page.screenshot({ path: path.join(dir, view === "snacks" ? "gallery.png" : `gallery-${view}.png`), scale: "css" });
    }
    if (errors.length) throw new Error(errors.join("\n"));
  } finally {
    await close();
  }
}
console.log(`Saved six gallery screenshots to ${output}`);
