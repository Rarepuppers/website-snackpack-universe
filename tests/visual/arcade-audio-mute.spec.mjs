import { test, expect } from "@playwright/test";

// Muting must silence sound effects that are already playing, not only the
// next ones. Before the 22 October fix, setMuted() reached running loops but
// left an in-flight one-shot (a win fanfare, say) playing at volume 0.65.
// Every Audio the page creates is recorded so the test can inspect each voice.

test("muting silences a cue that is already playing, and unmuting doesn't replay it", async ({ page }) => {
  await page.addInitScript(() => {
    const t = new Date();
    localStorage.setItem("sp_donate_shown_on", t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0"));
    localStorage.removeItem("snackpack.arcade.audio.muted.v1");
    const Real = window.Audio;
    window.__voices = [];
    window.Audio = function (src) { const a = new Real(src); window.__voices.push(a); return a; };
    window.Audio.prototype = Real.prototype;
    // Headless Chromium can refuse autoplay; pretend playback started so the
    // voice is "in flight" exactly as on a real device.
    HTMLMediaElement.prototype.play = function () { Object.defineProperty(this, "paused", { value: false, configurable: true }); return Promise.resolve(); };
    HTMLMediaElement.prototype.pause = function () { Object.defineProperty(this, "paused", { value: true, configurable: true }); };
  });
  await page.goto("/play/checkers/");
  await page.waitForFunction(() => !!window.SnackPackAudio);
  await page.evaluate(() => { window.SnackPackAudio.setMuted(false); window.SnackPackAudio.play("win"); });
  const playing = await page.evaluate(() => window.__voices.filter((v) => !v.paused && v.volume > 0).length);
  expect(playing, "the cue starts").toBeGreaterThan(0);

  await page.evaluate(() => window.SnackPackAudio.setMuted(true));
  const audible = await page.evaluate(() => window.__voices.filter((v) => !v.paused && v.volume > 0).map((v) => v.src.split("/").pop()));
  expect(audible, "nothing still audible after mute").toEqual([]);

  await page.evaluate(() => window.SnackPackAudio.setMuted(false));
  const replayed = await page.evaluate(() => window.__voices.filter((v) => !v.paused).length);
  expect(replayed, "unmuting does not resume the old cue").toBe(0);
});
