// Loader check: with ?assets=dev/fixture-assets/ the stand-in Cookie and Pantry
// Box GLBs replace the code-built ones; with ?assets=dev/empty-assets/ and with
// the real assets/ folder the game still runs on its fallbacks.
//   node play/labs/snack-drop/dev/make-fixtures.mjs   (once)
//   node play/labs/snack-drop/dev/assets-check.mjs
import { open } from "./browser.mjs";

const { page, base, errors, close } = await open();
let fail = 0;
const ok = (cond, what) => { console.log((cond ? "ok   " : "FAIL ") + what); if (!cond) fail++; };
const state = () => page.evaluate(() => { const v = window.__snackdrop.view; return { cookie: v.fromModel[2], crumb: v.fromModel[0], crate: !!v.crateModel, codeCrate: v.crateGroup.visible }; });

await page.goto(base + "?assets=dev/fixture-assets/&bot=1");
await page.waitForFunction(() => window.__snackdrop && window.__snackdrop.view.crateModel, null, { timeout: 20000 });
await page.waitForTimeout(3000);
let s = await state();
ok(s.cookie && !s.crumb, "fixture Cookie model replaces the code-built one, other tiers keep theirs");
ok(s.crate && !s.codeCrate, "fixture container replaces the code-built crate");
ok(await page.evaluate(() => window.__snackdrop.game.drops > 0), "the game plays with the fixtures");

for (const q of ["?assets=dev/empty-assets/&bot=1", "?bot=1"]) {
  await page.goto(base + q);
  await page.waitForFunction(() => window.__snackdrop && window.__snackdrop.game.drops > 2, null, { timeout: 30000 });
  s = await state();
  ok(!s.cookie && !s.crate && s.codeCrate, `fallbacks in use with ${q}`);
}
console.log(errors.length ? "errors:\n" + errors.join("\n") : "no page errors");
await close();
process.exit(fail || errors.length ? 1 : 0);
