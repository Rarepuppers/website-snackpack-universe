import { test, expect } from "@playwright/test";

for (const device of ["pointer", "simulated-pad", "simulated-pad-blur"]) {
  test(`shop page transition does not sell on held ${device} confirmation`, async ({ page }) => {
    await page.setViewportSize({width:960,height:540});
    if (device !== "pointer") await page.addInitScript(() => {
      const pad = { id:"Standard test controller", index:0, connected:true, mapping:"standard", timestamp:1,
        axes:[0,0,0,0], buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0})) };
      window.__testPad = pad;
      Object.defineProperty(navigator,"getGamepads",{value:()=>{pad.timestamp=performance.now();return [pad];}});
    });
    await page.goto("/play/last-bastion/?scenario=scrap-shop&weapons=12&seed=61061&sound=0");
    await page.waitForFunction(()=>window.__combatDecisionOverlay?.kind==="scrap-shop");
    const select = async id => {
      const target=await page.evaluate(id=>window.__combatDecisionOverlay.optionIds.indexOf(id),id);
      expect(target).toBeGreaterThanOrEqual(0);
      for(let step=0;step<15;step++) {
        if(await page.evaluate(()=>window.__combatDecisionOverlay.selectedIndex)===target) break;
        await page.keyboard.press("ArrowDown",{delay:80});
      }
      expect(await page.evaluate(()=>window.__combatDecisionOverlay.selectedIndex)).toBe(target);
    };
    for(const id of ["shop-manage","shop-sell-menu"]) { await select(id);await page.keyboard.press("Enter",{delay:80}); }
    const original=await page.evaluate(()=>window.__combatDecisionOverlay.optionIds);
    await select("decision-page-next");
    const canvas=await page.locator("#game-root canvas").boundingBox();
    if(device==="pointer") {
      await page.mouse.move(canvas.x+canvas.width*705/960,canvas.y+canvas.height*414/540);
      await page.mouse.down();
    } else await page.evaluate(()=>{window.__testPad.buttons[0]={pressed:true,touched:true,value:1};});
    await page.waitForFunction(()=>window.__combatDecisionOverlay?.pageIndex===1);
    const destination=await page.evaluate(()=>window.__combatDecisionOverlay.optionIds);
    expect(destination.filter(id=>id.startsWith("shop-sell:"))).toHaveLength(5);
    if(device==="pointer") await page.mouse.move(canvas.x+canvas.width*400/960,canvas.y+canvas.height*165/540);
    if(device==="simulated-pad-blur") {
      await page.evaluate(()=>window.dispatchEvent(new Event("blur")));
      await page.waitForTimeout(120);
      await page.evaluate(()=>window.dispatchEvent(new Event("focus")));
    }
    await page.waitForTimeout(250); // Hold across multiple production input polls.
    expect(await page.evaluate(()=>window.__combatDecisionOverlay.optionIds)).toEqual(destination);
    if(device==="pointer") await page.mouse.up();
    else await page.evaluate(()=>{window.__testPad.buttons[0]={pressed:false,touched:false,value:0};});
    await page.waitForTimeout(120);
    expect(await page.evaluate(()=>window.__combatDecisionOverlay.optionIds)).toEqual(destination);
    await select("decision-page-previous");await page.keyboard.press("Enter",{delay:80});
    expect(await page.evaluate(()=>window.__combatDecisionOverlay.optionIds)).toEqual(original);
  });
}

test("shop pagination survives resizing an open decision", async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 540 });
  await page.goto("/play/last-bastion/?scenario=scrap-shop&weapons=12&seed=61061&sound=0");
  await page.waitForFunction(() => window.__combatDecisionOverlay?.kind === "scrap-shop");
  const activate = async (id) => {
    const target = await page.evaluate(id => window.__combatDecisionOverlay.optionIds.indexOf(id), id);
    expect(target).toBeGreaterThanOrEqual(0);
    for (let step = 0; step < 15; step++) {
      if (await page.evaluate(() => window.__combatDecisionOverlay.selectedIndex) === target) break;
      await page.keyboard.press("ArrowDown", { delay: 80 });
    }
    expect(await page.evaluate(() => window.__combatDecisionOverlay.selectedIndex)).toBe(target);
    await page.keyboard.press("Enter", { delay: 80 });
  };
  await activate("shop-manage");
  await activate("shop-sell-menu");
  await activate("decision-page-next");
  const before = await page.evaluate(() => window.__combatDecisionOverlay);
  expect(before.pageIndex).toBe(1);
  for (const viewport of [{width:1280,height:800},{width:3840,height:2160},{width:960,height:540}]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await expect.poll(() => page.evaluate(() => {
      const b = window.__combatDecisionOverlay.panelBounds;
      return b.width <= b.availableWidth && b.height <= b.availableHeight;
    })).toBe(true);
    const after = await page.evaluate(() => window.__combatDecisionOverlay);
    expect(after.pageIndex).toBe(1);
    expect(after.optionIds).toEqual(before.optionIds);
    expect(after.selectedIndex).toBe(before.selectedIndex);
  }
  await activate("shop-back");
  await page.waitForFunction(() => window.__combatDecisionOverlay?.optionIds.includes("shop-manage"));
});

test("full shop racks page without spending and keep Back reachable", async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 540 });
  await page.goto("/play/last-bastion/?scenario=scrap-shop&weapons=12&seed=61061&sound=0");
  await page.waitForFunction(() => window.__combatDecisionOverlay?.kind === "scrap-shop");
  const activate = async (id) => {
    const index = await page.evaluate(id => window.__combatDecisionOverlay.optionIds.indexOf(id), id);
    expect(index).toBeGreaterThanOrEqual(0);
    for (let n = 0; n < 15; n++) {
      if (await page.evaluate(() => window.__combatDecisionOverlay.selectedIndex) === index) break;
      await page.keyboard.press("ArrowDown", { delay: 50 });
    }
    expect(await page.evaluate(() => window.__combatDecisionOverlay.selectedIndex)).toBe(index);
    if (id === "decision-page-next") {
      await page.keyboard.down("Enter");
      await page.waitForFunction(() => window.__combatDecisionOverlay?.pageIndex === 1);
      // Explicit repeated keydowns emulate an OS repeat while the key stays held.
      for (let repeat = 0; repeat < 3; repeat++) await page.keyboard.down("Enter");
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.keyboard.up("Enter");
    } else {
      await page.keyboard.press("Enter", { delay: 50 });
    }
  };
  await activate("shop-manage");
  await activate("shop-sell-menu");
  await page.waitForFunction(() => window.__combatDecisionOverlay?.optionIds.includes("decision-page-next"));
  const first = await page.evaluate(() => window.__combatDecisionOverlay);
  expect(first.panelBounds.height).toBeLessThanOrEqual(516);
  expect(first.optionIds).toContain("shop-back");
  expect(first.optionIds.filter(id => id.startsWith("shop-sell:"))).toHaveLength(7);
  await activate("decision-page-next");
  await page.waitForFunction(() => window.__combatDecisionOverlay?.pageIndex === 1);
  expect(await page.evaluate(() => window.__combatDecisionOverlay.optionIds.filter(id => id.startsWith("shop-sell:")).length)).toBe(5);
  await activate("decision-page-previous");
  expect(await page.evaluate(() => window.__combatDecisionOverlay.optionIds)).toEqual(first.optionIds);
  await activate("decision-page-next");
  await activate("shop-back");
  await page.waitForFunction(() => window.__combatDecisionOverlay?.optionIds.includes("shop-manage"));
});

test("shop offers and management fit the camera and remain keyboard operable", async ({ page }) => {
  for (const viewport of [{ width: 960, height: 540 }, { width: 1280, height: 800 }, { width: 3840, height: 2160 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/play/last-bastion/?scenario=scrap-shop&sound=0");
    await page.waitForFunction(() => window.__combatDecisionOverlay?.kind === "scrap-shop");
    const assertFit = async () => {
      await expect.poll(() => page.evaluate(() => {
        const b = window.__combatDecisionOverlay?.panelBounds;
        return !!b && b.width <= b.availableWidth - 23 && b.height <= b.availableHeight - 23;
      })).toBe(true);
    };
    await assertFit();
    const manage = await page.evaluate(() => window.__combatDecisionOverlay.optionIds.indexOf("shop-manage"));
    await page.keyboard.press(String(manage + 1), { delay: 80 });
    await page.waitForFunction(() => window.__combatDecisionOverlay?.optionIds.includes("shop-back"));
    await assertFit();
    const back = await page.evaluate(() => window.__combatDecisionOverlay.optionIds.indexOf("shop-back"));
    for (let i = 0; i < 15; i++) {
      if (await page.evaluate(() => window.__combatDecisionOverlay.selectedIndex) === back) break;
      const previous = await page.evaluate(() => window.__combatDecisionOverlay.selectedIndex);
      await page.keyboard.press("ArrowDown", { delay: 80 });
      await page.waitForFunction(previous => window.__combatDecisionOverlay.selectedIndex !== previous, previous);
    }
    expect(await page.evaluate(() => window.__combatDecisionOverlay.selectedIndex)).toBe(back);
    await page.keyboard.press("Enter", { delay: 80 });
    await page.waitForFunction(() => window.__combatDecisionOverlay?.optionIds.includes("shop-manage"));
  }
});

test("event results require a fresh confirmation and block underlying choices", async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 540 });
  await page.goto("/play/last-bastion/?screen=event&eventdemo=1");
  await page.waitForFunction(() => window.__expeditionEvent !== undefined);
  const clickGame = async (x, y) => {
    const box = await page.locator("#game-root canvas").boundingBox();
    await page.mouse.click(box.x + x * box.width / 960, box.y + y * box.height / 540, { delay: 80 });
  };
  await page.keyboard.down("Enter");
  await expect.poll(() => page.evaluate(() => window.__expeditionEvent.outcomeShown)).toBe(true);
  const choice = await page.evaluate(() => window.__expeditionEvent.choiceId);
  await page.keyboard.down("Enter"); // Real repeat keydown while the opener is still held.
  await expect.poll(() => page.evaluate(() => window.__expeditionEvent.outcomeShown)).toBe(true);
  await page.keyboard.up("Enter");
  await clickGame(100, 295); // A different choice beneath the result overlay.
  expect(await page.evaluate(() => window.__expeditionEvent.choiceId)).toBe(choice);
  await page.keyboard.press("ArrowDown");
  expect(await page.evaluate(() => window.__expeditionEvent.outcomeShown)).toBe(true);
  await page.keyboard.press("Enter");
  await expect.poll(() => page.evaluate(() => window.__expeditionEvent.outcomeShown)).toBe(false);
  await page.keyboard.press("Enter");
  await expect.poll(() => page.evaluate(() => window.__expeditionEvent.outcomeShown)).toBe(true);
  await clickGame(480, 344);
  await expect.poll(() => page.evaluate(() => window.__expeditionEvent.outcomeShown)).toBe(false);
});

test("combat audio settings control the live output and encounter retry stops old voices", async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 540 });
  await page.addInitScript(() => {
    const Native = window.AudioContext;
    window.__audioProbe = [];
    window.AudioContext = class extends Native {
      constructor(...args) { super(...args); this.probe = { context: this, outputs: [], stops: 0, sources: 0 }; window.__audioProbe.push(this.probe); }
      createGain() {
        const node = super.createGain(), connect = node.connect.bind(node);
        const hold = node.gain.cancelAndHoldAtTime.bind(node.gain);
        node.ramps = [];
        const ramp = node.gain.linearRampToValueAtTime.bind(node.gain);
        node.gain.linearRampToValueAtTime = (...args) => { node.ramps.push(args); return ramp(...args); };
        node.gain.cancelAndHoldAtTime = (...args) => { node.liveOutput = true; return hold(...args); };
        node.connect = (...args) => { if (args[0] === this.destination) this.probe.outputs.push(node); return connect(...args); };
        return node;
      }
      track(node) {
        this.probe.sources++; const stop = node.stop.bind(node);
        node.stop = (...args) => { this.probe.stops++; return stop(...args); }; return node;
      }
      createBufferSource() { return this.track(super.createBufferSource()); }
      createOscillator() { return this.track(super.createOscillator()); }
    };
  });
  await page.goto("/play/last-bastion/?screen=game&scenario=weapon-review&loadout=bulwark&sound=1");
  await page.waitForFunction(() => window.__combatAccessibilityAudit !== undefined);
  await page.locator("#game-root canvas").click({ position: { x: 600, y: 300 } });
  await page.waitForFunction(() => window.__audioProbe.some(p => p.sources > 0));
  await page.mouse.click(850, 25, { delay: 80 }); // Open pause explicitly (focus loss may already have paused).
  await page.waitForFunction(() => window.__combatAccessibilityAudit.paused);
  await page.mouse.click(480, 212, { delay: 80 }); // Settings
  await page.waitForFunction(() => window.__combatPauseMode === "settings");
  const output = () => page.evaluate(() => window.__audioProbe.flatMap(p => p.outputs.filter(n => n.liveOutput).map(n => n.ramps.at(-1)[0])));
  await page.mouse.click(480, 217, { delay: 80 }); // Master: 1 -> 0
  await expect.poll(output).toEqual([0]);
  await page.mouse.click(480, 217, { delay: 80 }); // Master: 0 -> .25
  await expect.poll(output).toEqual([0.25]);
  await page.mouse.click(480, 195, { delay: 80 }); // Sound off
  await expect.poll(output).toEqual([0]);
  await page.mouse.click(480, 195, { delay: 80 }); // Sound on
  await expect.poll(output).toEqual([0.25]);
  await page.keyboard.press("Escape", { delay: 80 });
  await page.waitForFunction(() => window.__combatPauseMode === "root");
  await page.keyboard.press("Escape", { delay: 80 }); // Resume and create fresh voices for retry.
  await page.waitForFunction(() => !window.__combatAccessibilityAudit.paused);
  await page.waitForTimeout(300);
  await page.mouse.click(850, 25, { delay: 80 });
  await page.waitForFunction(() => window.__combatAccessibilityAudit.paused);
  const stops = await page.evaluate(() => window.__audioProbe.filter(p => p.outputs.some(n => n.liveOutput)).reduce((sum,p) => sum+p.stops,0));
  await page.mouse.click(480, 255, { delay: 80 });
  await page.waitForFunction(() => window.__combatPauseMode === "confirm-restart");
  await page.mouse.click(480, 164, { delay: 80 });
  await page.waitForFunction(() => window.__combatAccessibilityAudit.paused === false);
  await page.waitForFunction(count => window.__audioProbe.filter(p => p.outputs.some(n => n.liveOutput)).reduce((sum,p) => sum+p.stops,0) > count, stops);
  await expect.poll(output).toEqual([0.25]);
});

test("opt-in local QA session exports active frames, excludes pause, stops and resets", async ({ page }) => {
  const failures = watchRuntime(page);
  await page.goto("/play/last-bastion/?scenario=weapon-review&loadout=bastion-service-rifle&qasession=1&sound=0");
  const panel = page.getByRole("region", { name: "Local QA session" });
  await expect(panel).toHaveAttribute("data-state", "idle");
  await page.waitForFunction(() => window.__combatAccessibilityAudit !== undefined);
  const save = await page.evaluate(() => localStorage.getItem("last-bastion-save"));
  await panel.getByRole("button", { name: "Start QA", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(panel).toHaveAttribute("data-state", "recording");
  await page.waitForTimeout(500);
  await page.locator("#game-root canvas").click({ position: { x: 500, y: 300 } });
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => window.__combatAccessibilityAudit.paused);
  await page.waitForTimeout(500);
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !window.__combatAccessibilityAudit.paused);
  await page.waitForTimeout(300);
  await panel.getByRole("button", { name: "Stop QA", exact: true }).click();
  await expect(panel).toHaveAttribute("data-state", "stopped");
  const download = page.waitForEvent("download");
  await panel.getByRole("button", { name: "Export QA", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("last-bastion-qa-session.json");
  const report = JSON.parse(await panel.getByRole("textbox", { name: "QA report JSON" }).inputValue());
  expect(report.session.activeSamples).toBeGreaterThan(0);
  expect(report.session.excludedMilliseconds).toBeGreaterThan(300);
  expect(report.session.droppedSamples).toBe(0);
  expect(report.start.provenance.buildVersion).toContain("web-");
  expect(report.end.backing.width).toBeGreaterThan(0);
  expect(report.end.hardware).toBeNull();
  expect(report.end.rollingWindow.capacity).toBe(600);
  await page.waitForTimeout(200);
  await page.evaluate(() => { URL.createObjectURL = () => { throw new Error("QA download intentionally unavailable"); }; });
  await panel.getByRole("button", { name: "Export QA", exact: true }).click();
  const again = JSON.parse(await panel.getByRole("textbox", { name: "QA report JSON" }).inputValue());
  expect(again.session).toEqual(report.session);
  await page.screenshot({ path: test.info().outputPath("qa-session.png") });
  expect(await page.evaluate(() => localStorage.getItem("last-bastion-save"))).toBe(save);
  await panel.getByRole("button", { name: "Reset QA", exact: true }).click();
  await expect(panel).toHaveAttribute("data-state", "idle");
  await expect(panel.getByRole("button", { name: "Export QA", exact: true })).toBeDisabled();
  expect(failures).toEqual([]);
  await page.goto("/play/last-bastion/?scenario=weapon-review&sound=0");
  await expect(page.locator("#game-root canvas")).toBeVisible();
  await expect(page.locator(".qa-session")).toHaveCount(0);
});

function watchRuntime(page) {
  const failures = [];
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.stack ?? error.message}`));
  page.on("console", (message) => {
    const source = message.location().url;
    const text = message.text();
    const expectedAnalyticsFailure = text.includes("cloudflareinsights.com/cdn-cgi/rum");
    if (message.type() === "error" && !expectedAnalyticsFailure
      && (!source || source.includes("/play/last-bastion/"))) {
      failures.push(`console: ${text}`);
    }
  });
  page.on("requestfailed", (request) => {
    if (request.url().includes("/play/last-bastion/")) {
      failures.push(`request: ${request.url()} (${request.failure()?.errorText ?? "failed"})`);
    }
  });
  page.on("response", (response) => {
    if (response.url().includes("/play/last-bastion/") && response.status() >= 400) {
      failures.push(`response: ${response.status()} ${response.url()}`);
    }
  });
  return failures;
}

async function expectHealthyCanvas(page, failures) {
  await expect(page.locator("#game-root canvas")).toBeVisible();
  expect(failures).toEqual([]);
}

test.describe("Last Bastion executable acceptance", () => {
  test("title reaches the main menu by keyboard", async ({ page }) => {
    const failures = watchRuntime(page);
    await page.goto("/play/last-bastion/?screen=title");
    await page.waitForFunction(() => window.__shellState?.screen === "title");
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => window.__shellState?.screen === "menu");
    await expectHealthyCanvas(page, failures);
  });

  test("the menu offers Daily, Quick Drop and Expedition, hides LAB, and starts today's Daily", async ({ page }) => {
    const failures = watchRuntime(page);
    await page.goto("/play/last-bastion/?flow=menu");
    await page.waitForFunction(() => window.__shellState?.screen === "menu");
    const cards = await page.evaluate(() => window.__shellState.menuCards.map((card) => card.id));
    expect(cards.slice(0, 3)).toEqual(["daily", "quick-drop", "expedition"]);
    expect(cards).toContain("arcade");
    expect(cards).not.toContain("lab");
    // A first visit is focused on the short mode.
    expect(await page.evaluate(() => window.__shellState.menuCards[window.__shellState.menuIndex].id)).toBe("quick-drop");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => window.__shellState?.screen === "character-select"
      && window.__shellState?.runMode === "daily");
    // Character art loads on entry; input is ignored until it has.
    await page.waitForFunction(() => window.__shellAssetsReady === true);
    await page.keyboard.press("Enter");
    await page.waitForURL((url) => url.searchParams.get("screen") === "game" && url.searchParams.has("daily"));
    const today = await page.evaluate(() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    });
    expect(new URL(page.url()).searchParams.get("daily")).toBe(today);
    await expectHealthyCanvas(page, failures);
  });

  test("LAB stays reachable for QA with ?lab=1", async ({ page }) => {
    // Not ?debug=1 alone: "debug" is a combat review parameter and routes to combat.
    for (const route of ["?flow=menu&lab=1", "?screen=title&flow=menu&debug=1"]) {
      await page.goto(`/play/last-bastion/${route}`);
      await page.waitForFunction(() => window.__shellState?.screen === "menu");
      expect(await page.evaluate(() => window.__shellState.menuCards.map((card) => card.id))).toContain("lab");
    }
  });

  test("map and combat routes create their runtime state", async ({ page }) => {
    const failures = watchRuntime(page);
    await page.goto("/play/last-bastion/?screen=map&mapseed=2026&threat=2");
    await page.waitForFunction(() => window.__expeditionState?.seed === 2026);
    expect(await page.evaluate(() => window.__expeditionState)).toMatchObject({
      seed: 2026,
      threatTier: 2,
      complete: false,
      armedNodeId: null,
    });
    const mapUrl = page.url();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => Number.isInteger(window.__expeditionState?.armedNodeId));
    expect(page.url()).toBe(mapUrl);
    const armedNodeId = await page.evaluate(() => window.__expeditionState.armedNodeId);
    await page.keyboard.press("Enter");
    await page.waitForURL((url) => url.searchParams.get("screen") === "game" || url.searchParams.get("screen") === "event");
    const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem("last-bastion-save")));
    expect(persisted.expedition.currentNodeId).toBe(armedNodeId);

    await page.goto("/play/last-bastion/?scenario=powerup-identity&seed=61061");
    await page.waitForFunction(() => Number(window.__combatAssetAudit?.count) > 0);
    expect(await page.evaluate(() => window.__combatAssetAudit?.runSeed)).toBe(61061);
    await expectHealthyCanvas(page, failures);
  });

  test("the Scrap Shop does not preload unrelated encounter art", async ({ page }) => {
    const failures = watchRuntime(page);
    await page.goto("/play/last-bastion/?scenario=scrap-shop&loadout=vertical&seed=61061");
    await page.waitForFunction(() => Number(window.__combatAssetAudit?.count) > 0);
    const ids = await page.evaluate(() => window.__combatAssetAudit.ids);
    expect(ids).toContain("scrap-shop-panel-v1");
    expect(ids).toContain("quartermaster-v1");
    expect(ids).not.toContain("bastion-eater-v1");
    expect(ids).not.toContain("assembly-prime-effects-v1");
    await expectHealthyCanvas(page, failures);
  });

  test("settings can export a versioned save backup", async ({ page }) => {
    const failures = watchRuntime(page);
    await page.goto("/play/last-bastion/?flow=settings");
    await page.waitForFunction(() => window.__shellState?.screen === "settings");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    const downloadPromise = page.waitForEvent("download");
    await page.keyboard.press("Enter");
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("last-bastion-save-v17.json");
    await expectHealthyCanvas(page, failures);
  });

  test("settings exposes the game privacy policy without overflowing the minimum viewport", async ({ page }) => {
    const failures = watchRuntime(page);
    await page.setViewportSize({ width: 960, height: 540 });
    await page.goto("/play/last-bastion/?flow=settings");
    await page.waitForFunction(() => window.__shellState?.screen === "settings");
    await page.keyboard.press("ArrowUp");
    expect(await page.evaluate(() => {
      const state = window.__shellState;
      return state.settingsRows[state.settingsIndex];
    })).toMatchObject({ kind: "action", key: "privacy", label: "Privacy policy" });
    const canvas = await page.locator("#game-root canvas").boundingBox();
    expect(canvas).not.toBeNull();
    expect(canvas.width).toBeLessThanOrEqual(960);
    expect(canvas.height).toBeLessThanOrEqual(540);
    await expectHealthyCanvas(page, failures);

    await page.keyboard.press("Enter");
    await page.waitForURL("**/privacy/last-bastion/");
    await expect(page.getByRole("heading", { name: "Last Bastion privacy policy" })).toBeVisible();
  });

  test("debrief keyboard navigation updates the selected action", async ({ page }) => {
    const failures = watchRuntime(page);
    await page.goto("/play/last-bastion/?screen=summary&summarydemo=1");
    await page.waitForFunction(() => window.__runSummaryNavigation?.selectedIndex === 1);
    await page.keyboard.press("ArrowLeft");
    await page.waitForFunction(() => window.__runSummaryNavigation?.selectedIndex === 0);
    expect(await page.evaluate(() => window.__runSummaryNavigation)).toEqual({
      selectedIndex: 0,
      selectedShortcut: "Q",
    });
    await expectHealthyCanvas(page, failures);
  });

  test("run details remain selectable when clipboard access is blocked", async ({ page }) => {
    const failures = watchRuntime(page);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.reject(new DOMException("Clipboard blocked", "NotAllowedError")) },
      });
    });
    await page.goto("/play/last-bastion/?screen=summary&summarydemo=1");
    await page.waitForFunction(() => window.__runSummary?.provenance?.combatSeed === 61061);
    await page.keyboard.press("c");
    await page.waitForFunction(() => window.__runSummaryCopy?.fallback === true);
    const details = page.locator("#run-details-fallback textarea");
    await expect(details).toBeVisible();
    await expect(details).toHaveValue(/Combat seed: 61061/);
    await expect(details).toHaveValue(/Simulation: 3/);
    await page.keyboard.press("Escape");
    await expect(page.locator("#run-details-fallback")).toHaveCount(0);
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("CANVAS");
    await expectHealthyCanvas(page, failures);
  });

  test("debrief game link remains selectable when clipboard access is blocked", async ({ page }) => {
    const failures = watchRuntime(page);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.reject(new DOMException("Clipboard blocked", "NotAllowedError")) },
      });
    });
    await page.goto("/play/last-bastion/?screen=summary&summarydemo=1");
    await page.waitForFunction(() => Boolean(window.__runSummary));
    await page.keyboard.press("l");
    const link = page.locator("#run-details-fallback textarea");
    await expect(link).toHaveValue("https://www.snackpackuniverse.com/play/last-bastion/");
    await expect(page.getByText("Select and copy this game link:", { exact: false })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#run-details-fallback")).toHaveCount(0);
    await expectHealthyCanvas(page, failures);
  });

  test("focus loss clears a held irreversible confirmation", async ({ page }) => {
    const failures = watchRuntime(page);
    await page.goto("/play/last-bastion/?screen=transformation-lab");
    await page.waitForFunction(() => Boolean(window.__transformationDecisionLab));
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => Boolean(window.__transformationDecisionLab?.state?.pending));

    await page.keyboard.down("Enter");
    await page.waitForFunction(() => window.__transformationDecisionLab.state.pending.holdElapsedMs > 0);
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await page.waitForFunction(() => window.__transformationDecisionLab.state.pending.holdElapsedMs === 0);
    await page.waitForTimeout(500);
    expect((await page.evaluate(() => window.__transformationDecisionLab.state.pending)).holdElapsedMs).toBe(0);
    await page.keyboard.up("Enter");
    await expectHealthyCanvas(page, failures);
  });

  test("maximum HUD scale, reduced motion, and remapped movement work at the minimum viewport", async ({ page }) => {
    const failures = watchRuntime(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/play/last-bastion/?screen=title");
    await page.waitForFunction(() => window.__shellState?.screen === "title");
    await page.evaluate(() => {
      const state = window.__shellState;
      const save = {
        version: 16,
        settings: { ...state.settings, uiScale: 1.2, reducedMotionEnabled: true },
        controls: {
          keyboard: { ...state.controls.keyboard, moveRight: "KeyZ" },
          gamepad: { ...state.controls.gamepad },
        },
        progress: {
          runsFinished: 0, victories: 0, bestWaveReached: 0, nodesCleared: 0,
          bestNodesCleared: 0, totalKills: 0, totalDamage: 0, totalScrapEarned: 0,
          bestiary: {}, threatTierBestNodes: { 0: 0, 1: 0, 2: 0 },
          threatTierVictories: { 0: 0, 1: 0, 2: 0 }, commandMarksLifetime: 0,
          purchasedArmoryNodeIds: [],
        },
        expedition: null,
        selectedPerkId: "perk-veteran",
        selectedHeroId: "marine",
        selectedThreatTier: 0,
        selectedArmoryNodeId: null,
        lastRunSummary: null,
        runHistory: [],
      };
      localStorage.setItem("last-bastion-save", JSON.stringify(save));
    });

    await page.goto("/play/last-bastion/?scenario=powerup-identity&seed=61061");
    await page.waitForFunction(() => window.__combatAccessibilityAudit?.uiScale === 1.2);
    expect(await page.evaluate(() => window.__combatAccessibilityAudit)).toMatchObject({
      uiScale: 1.2,
      reducedMotion: true,
      moveRightBinding: "KeyZ",
      paused: false,
    });
    const initialX = await page.evaluate(() => window.__combatAccessibilityAudit.playerPosition.x);
    await page.keyboard.down("z");
    await page.waitForFunction((x) => window.__combatAccessibilityAudit.playerPosition.x > x, initialX);
    await page.keyboard.up("z");

    const canvas = await page.locator("#game-root canvas").boundingBox();
    expect(canvas).not.toBeNull();
    expect(canvas.width).toBeLessThanOrEqual(1280);
    expect(canvas.height).toBeLessThanOrEqual(800);
    expect(canvas.width / canvas.height).toBeCloseTo(16 / 9, 2);
    await expectHealthyCanvas(page, failures);
  });

  test("a warmed release boots offline and an unwarmed combat theme fails visibly", async ({ page, context }) => {
    const failures = watchRuntime(page);
    await page.goto("/play/last-bastion/?screen=summary&summarydemo=1");
    await page.waitForFunction(() => Boolean(window.__runSummary));
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await page.waitForFunction(() => Boolean(window.__runSummary));

    await context.setOffline(true);
    await page.reload();
    await page.waitForFunction(() => Boolean(window.__runSummary));
    await expect(page.locator("#game-root canvas")).toBeVisible();

    await page.goto("/play/last-bastion/?scenario=powerup-identity&biome=arctic");
    await page.waitForFunction(() => window.__combatAssetFailure?.retryable === true);
    expect((await page.evaluate(() => window.__combatAssetFailure)).failed.length).toBeGreaterThan(0);
    await context.setOffline(false);
    expect(failures.filter((failure) => failure.startsWith("pageerror:"))).toEqual([]);
  });

  test("storage read failure stays visible and retryable", async ({ page }) => {
    const failures = watchRuntime(page);
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        value: {
          getItem() {
            throw new DOMException("Storage blocked for acceptance test", "SecurityError");
          },
          setItem() {},
        },
      });
    });
    await page.goto("/play/last-bastion/?screen=title");
    await page.waitForFunction(() => window.__savePersistence?.kind === "failed");
    expect(await page.evaluate(() => window.__savePersistence)).toEqual({
      kind: "failed",
      operation: "read",
    });
    await page.keyboard.press("p");
    await page.waitForFunction(() => window.__savePersistence?.operation === "read");
    await expectHealthyCanvas(page, failures);
  });

  test("repeated renderer boots and scene transitions remain crash-free", async ({ page }) => {
    const failures = watchRuntime(page);
    for (let cycle = 0; cycle < 2; cycle += 1) {
      await page.goto("/play/last-bastion/?screen=title");
      await page.waitForFunction(() => window.__shellState?.screen === "title");
      await page.keyboard.press("Enter");
      await page.waitForFunction(() => window.__shellState?.screen === "menu");
      await expectHealthyCanvas(page, failures);

      await page.goto(`/play/last-bastion/?screen=map&mapseed=${7000 + cycle}&threat=1`);
      await page.waitForFunction(() => Boolean(window.__expeditionState));
      await page.keyboard.press("Enter");
      await page.waitForFunction(() => Number.isInteger(window.__expeditionState?.armedNodeId));
      await page.keyboard.press("Enter");
      await page.waitForURL((url) => url.searchParams.get("screen") === "game" || url.searchParams.get("screen") === "event");
      await expectHealthyCanvas(page, failures);

      await page.goto("/play/last-bastion/?scenario=powerup-identity");
      await page.waitForFunction(() => Number(window.__combatAssetAudit?.count) > 0);
      await expectHealthyCanvas(page, failures);

      await page.goto("/play/last-bastion/?screen=summary&summarydemo=1");
      await page.waitForFunction(() => Number.isInteger(window.__runSummaryNavigation?.selectedIndex));
      await expectHealthyCanvas(page, failures);
    }
  });

  test("combat decisions remain keyboard-operable after overlay extraction", async ({ page }) => {
    const failures = watchRuntime(page);
    await page.goto("/play/last-bastion/?scenario=weapon-gate");
    await page.waitForFunction(() => window.__combatDecisionOverlay?.kind === "weapon-placement");
    const initial = await page.evaluate(() => window.__combatDecisionOverlay);
    expect(initial.visible).toBe(true);
    expect(initial.selectedIndex).toBe(0);
    expect(initial.optionIds.length).toBeGreaterThan(1);
    const discardIndex = initial.optionIds.indexOf("place:discard");
    expect(discardIndex).toBeGreaterThanOrEqual(0);
    expect(discardIndex).toBeLessThan(9);

    await page.keyboard.press("ArrowDown");
    await page.waitForFunction(() => Number(window.__combatDecisionOverlay?.selectedIndex) > 0);
    await page.keyboard.press(String(discardIndex + 1));
    await page.waitForFunction(() => window.__combatDecisionOverlay?.visible === false);
    await expectHealthyCanvas(page, failures);
  });

  test("level-up stat cards fit their rendered text inside the choices", async ({ page }) => {
    const failures = watchRuntime(page);
    for (const viewport of [{ width: 960, height: 540 }, { width: 1920, height: 1080 }, { width: 3840, height: 2160 }]) {
      await page.setViewportSize(viewport);
      await page.goto("/play/last-bastion/?scenario=stat-card-review");
      await page.waitForFunction(() => window.__combatDecisionOverlay?.kind === "level-stat");
      const cards = await page.evaluate(() => window.__combatDecisionOverlay.statCardBounds);
      expect(cards).toHaveLength(4);
      for (const card of cards) {
        expect(card.overflowed, card.id).toBe(false);
        expect(card.width, card.id).toBeLessThanOrEqual(328);
        expect(card.height, card.id).toBeLessThanOrEqual(100);
        expect(card.fontSize, card.id).toBeGreaterThanOrEqual(10);
      }
      await expectHealthyCanvas(page, failures);
    }
  });
});

test.describe("Last Bastion on a touch-only phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("explains the keyboard requirement before boot and still lets a player continue", async ({ page }) => {
    await page.goto("/play/last-bastion/?screen=title");
    const notice = page.getByRole("dialog", { name: "Last Bastion needs a keyboard or controller" });
    await expect(notice).toBeVisible();
    await expect(notice.getByRole("link", { name: "Browse the arcade" })).toHaveAttribute("href", "/play/");
    await expect(page.locator("#game-root canvas")).toHaveCount(0);
    await notice.getByRole("button", { name: "I have a keyboard or controller" }).click();
    await expect(notice).toHaveCount(0);
    await page.waitForFunction(() => window.__shellState?.screen === "title");
    // The choice lasts for the tab, so the next screen boots straight away.
    await page.reload();
    await page.waitForFunction(() => window.__shellState?.screen === "title");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

test.describe("October reliability regressions", () => {
  test.use({ serviceWorkers: "block" });
  test("failed character art stops loading and can recover on explicit retry", async ({ page }) => {
    await page.route("**/sw.js", route => route.abort());
    let fail = true;
    let requests = 0;
    await page.route("**/*", route => {
      const url = route.request().url();
      if (!url.includes("assault-select-portrait") || !(url.endsWith(".png") || url.endsWith(".webp"))) return route.fallback();
      requests++;
      return fail ? route.fulfill({ status: 404, body: "missing" }) : route.continue();
    });
    await page.goto("/play/last-bastion/?flow=menu");
    await page.waitForFunction(() => window.__shellState?.screen === "menu");
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => window.__shellState?.screen === "character-select");
    await expect.poll(() => requests).toBeGreaterThan(0);
    await page.waitForFunction(() => window.__shellLoadFailed === true);
    const settledRequests = requests;
    // A bounded observation window verifies there is no automatic reload cycle.
    await page.waitForTimeout(1000);
    expect(requests).toBe(settledRequests);
    fail = false;
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => window.__shellAssetsReady === true);
    expect(requests).toBeGreaterThan(settledRequests);
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => window.__shellState?.screen === "menu");
  });

  test("failed entry module offers recovery without clearing saves", async ({ page }) => {
    await page.route("**/game-assets/game.js", route => route.abort());
    await page.goto("/play/last-bastion/");
    await expect(page.getByRole("button", { name: "Retry loading" })).toBeVisible();
    await expect(page.locator("#boot-message")).toContainText("Your save has not been reset");
  });

  test("Daily retry resolves the date when clicked, not when the screen was opened", async ({ page }) => {
    await page.clock.install({ time: new Date(2026, 9, 14, 23, 59, 0) });
    await page.goto("/play/last-bastion/?screen=summary&summarydemo=daily");
    await expect(page.locator("#game-root canvas")).toBeVisible();
    await page.waitForFunction(() => window.__runSummary !== undefined);
    await page.clock.setSystemTime(new Date(2026, 9, 15, 0, 1, 0));
    await page.keyboard.press("r");
    await page.waitForURL(url => url.searchParams.get("daily") === "2026-10-15");
  });
});

test("build pages are keyboard-operable and include affinity", async ({ page }) => {
  await page.goto("/play/last-bastion/?screen=game&pausepreview=build");
  await page.waitForFunction(() => window.__buildInspection?.page === 0);
  await page.keyboard.press("ArrowLeft");
  await page.waitForFunction(() => window.__buildInspection?.title.startsWith("TRANSFORMATION AFFINITY"));
  expect(await page.evaluate(() => window.__buildInspection.lines.join(" "))).toContain("Commit 3 / Ascend 5 / Apex 7");
  await page.keyboard.press("ArrowRight");
  await page.waitForFunction(() => window.__buildInspection?.page === 0);
});

for (const viewport of [{ width: 1920, height: 1080 }, { width: 3840, height: 2160 }]) {
  test(`build controls stay onscreen at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/play/last-bastion/?screen=game&pausepreview=build");
    await page.waitForFunction(() => window.__buildInspection?.page === 0);
    const canvas = await page.locator("#game-root canvas").boundingBox();
    // Exercise the visible NEXT control, not a programmatic page transition.
    await page.mouse.click(canvas.x + canvas.width * 630 / 960, canvas.y + canvas.height * 430 / 540);
    await page.waitForFunction(() => window.__buildInspection?.page === 1);
  });
}

test("restart resets the attempt's settings provenance", async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 540 });
  await page.goto("/play/last-bastion/?screen=game&pausepreview=settings");
  await page.waitForFunction(() => window.__combatAccessibilityAudit?.paused);
  await page.mouse.click(480, 304, { delay: 80 }); // Game speed: 1 -> 1.25
  await page.waitForFunction(() => window.__combatAccessibilityAudit?.gameSpeedModified);
  await page.keyboard.press("Escape", { delay: 80 });
  await page.waitForFunction(() => window.__combatPauseMode === "root");
  await page.mouse.click(480, 255, { delay: 80 }); // Restart encounter
  await page.waitForFunction(() => window.__combatPauseMode === "confirm-restart");
  await page.mouse.click(480, 164, { delay: 80 }); // Confirm restart
  await page.waitForFunction(() => window.__combatAccessibilityAudit?.paused === false);
  expect(await page.evaluate(() => window.__combatAccessibilityAudit)).toMatchObject({ initialGameSpeed: 1.25, gameSpeedModified: false });
});

for (const action of ["evade", "pause"]) {
  test(`physical B goes back once with ${action} rebound to B`, async ({ page }) => {
    await page.addInitScript((binding) => {
      localStorage.setItem("last-bastion-save", JSON.stringify({ version: 16, controls: { gamepad: { [binding]: "east", kit: binding === "evade" ? "south" : "start" } } }));
      const pad = { id: "Standard test controller", index: 0, connected: true, mapping: "standard", timestamp: 1, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) };
      window.__testPad = pad;
      Object.defineProperty(navigator, "getGamepads", { value: () => { pad.timestamp = performance.now(); return [pad]; } });
    }, action);
    await page.goto("/play/last-bastion/?screen=game&pausepreview=build");
    await page.waitForFunction(() => window.__buildInspection?.page === 0);
    const button = async (index) => {
      await page.evaluate(i => { window.__testPad.buttons[i] = { pressed: true, touched: true, value: 1 }; window.__testPad.timestamp++; }, index);
      await page.waitForTimeout(120);
      await page.evaluate(i => { window.__testPad.buttons[i] = { pressed: false, touched: false, value: 0 }; window.__testPad.timestamp++; }, index);
      await page.waitForTimeout(120);
    };
    await button(15);
    await page.waitForFunction(() => window.__buildInspection?.page === 1);
    await button(1);
    expect(await page.evaluate(() => window.__combatAccessibilityAudit.paused)).toBe(true);
    await button(0); // Root Resume
    await page.waitForFunction(() => window.__combatAccessibilityAudit?.paused === false);
  });
}

for (const variant of ["a", "b"]) {
  test(`floor pilot ${variant} boots through its real texture loader`, async ({ page }) => {
    const failures = [];
    page.on("pageerror", error => failures.push(error.message));
    const loaded = [];
    page.on("response", response => { if (response.url().includes("pilot") && response.url().endsWith(".png")) loaded.push({ url: response.url(), status: response.status() }); });
    await page.goto(`/play/last-bastion/?screen=game&theme=bastion-standard&seed=61061&floorpilot=${variant}`);
    await page.waitForFunction(() => window.__combatAccessibilityAudit !== undefined);
    expect(loaded.some(row => row.url.includes(`floor-pilot-${variant}-runtime`) && row.status === 200)).toBe(true);
    expect(loaded.some(row => row.url.includes("scuff-pilot-runtime") && row.status === 200)).toBe(true);
    expect(failures).toEqual([]);
  });
}

 test("expanded floor kit and affinity inspect load through real combat", async ({ page }) => {
   const failures = [];
   page.on("pageerror", error => failures.push(error.message));
   const loaded = [];
   page.on("response", response => { if (response.url().includes("kit-runtime")) loaded.push(response.status()); });
   await page.goto("/play/last-bastion/?screen=game&theme=bastion-standard&seed=61061&floorpilot=kit&transformation=gravity-adept");
   await page.waitForFunction(() => window.__combatAccessibilityAudit !== undefined);
   expect(loaded).toEqual([200, 200]);
   const canvas = await page.locator("#game-root canvas").boundingBox();
   expect(canvas).toBeTruthy();
   await page.mouse.click(canvas.x + canvas.width * 880 / 960, canvas.y + canvas.height * 110 / 540);
   await page.waitForFunction(() => window.__buildInspection?.title === "TRANSFORMATION AFFINITY");
   expect(await page.evaluate(() => window.__buildInspection.lines.join(" "))).toContain("Void Initiation");
   expect(failures).toEqual([]);
 });


for (const [width, height] of [[960, 540], [1920, 1080], [3840, 2160]]) {
  test(`gallery logical sizes and every manifest page fit at ${width}x${height}`, async ({ page }) => {
    const failures = watchRuntime(page);
    await page.setViewportSize({ width, height });
    await page.goto("/play/last-bastion/?mode=gallery");
    await page.waitForFunction(() => window.__galleryReview?.pageCount > 0);
    const first = await page.evaluate(() => window.__galleryReview);
    expect(first.samples).toHaveLength(16);
    for (const sample of first.samples) {
      expect(sample.width).toBe(64); expect(sample.height).toBe(64);
      expect(sample.x).toBeGreaterThanOrEqual(20); expect(sample.x + sample.width).toBeLessThan(940);
      expect(sample.y).toBeGreaterThan(195); expect(sample.y + sample.height).toBeLessThan(380);
    }
    const seen = new Set();
    for (let index = 0; index < first.pageCount; index++) {
      const pageState = await page.evaluate(() => window.__galleryReview);
      expect(pageState.page).toBe(index);
      for (const row of pageState.rows) {
        expect(row.x).toBeGreaterThanOrEqual(20); expect(row.x + row.width).toBeLessThan(940);
        expect(row.y).toBeGreaterThanOrEqual(410); expect(row.y + row.height).toBeLessThan(475);
        expect(seen.has(row.text)).toBe(false); seen.add(row.text);
      }
      await page.keyboard.press("ArrowRight");
    }
    expect(seen.size).toBeGreaterThan(200);
    expect((await page.evaluate(() => window.__galleryReview)).page).toBe(first.pageCount - 1);
    await page.keyboard.press("ArrowLeft");
    expect((await page.evaluate(() => window.__galleryReview)).page).toBe(first.pageCount - 2);
    expect(failures).toEqual([]);
  });
}

test("hero gallery routes show the requested family and reject unknown heroes", async ({ page }) => {
  const failures = watchRuntime(page);
  for (const [hero, frames] of [["marine", 12], ["medic", 20], ["assault", 12], ["tactician", 12], ["scout", 12]]) {
    await page.goto(`/play/last-bastion/?mode=gallery&hero=${hero}`);
    await page.waitForFunction(hero => window.__galleryReview?.heroId === hero, hero);
    const samples = (await page.evaluate(() => window.__galleryReview)).samples;
    expect(samples.filter(sample => sample.id === `${hero}-base-v1`)).toHaveLength(frames);
    expect(samples.every(sample => sample.id.startsWith(hero))).toBe(true);
    for (const sample of samples) {
      expect(sample.x).toBeGreaterThan(20); expect(sample.x + sample.width).toBeLessThan(940);
      expect(sample.y).toBeGreaterThan(75); expect(sample.y + sample.height).toBeLessThan(495);
    }
  }
  await page.goto("/play/last-bastion/?mode=gallery&hero=unknown");
  await page.waitForFunction(() => window.__galleryReview?.error);
  expect((await page.evaluate(() => window.__galleryReview)).samples).toEqual([]);
  expect(failures).toEqual([]);
});

test("semantic menus activate once and restore focus on return", async ({ page }) => {
  const failures = watchRuntime(page);
  await page.goto("/play/last-bastion/");
  await expect(page.getByRole("button", { name: "Start game", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: /QUICK DROP/ })).toBeFocused();
  expect(await page.evaluate(() => window.__shellState.screen)).toBe("menu");
  await page.getByRole("button", { name: /SETTINGS.*Audio/ }).click();
  await expect(page.getByRole("heading", { name: "SETTINGS", exact: true })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Screen shake", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /SETTINGS.*Audio/ })).toBeFocused();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByRole("button", { name: "Start game", exact: true })).toBeFocused();
  await page.keyboard.press("Space");
  expect(await page.evaluate(() => window.__shellState.screen)).toBe("menu");
  await page.getByRole("button", { name: /QUICK DROP/ }).click();
  await page.waitForFunction(() => window.__shellState.screen === "character-select" && window.__shellAssetsReady);
  await expect(page.getByLabel("Hero", { exact: true })).toBeVisible();
  await expect(page.locator("#game-root canvas")).toHaveAttribute("aria-hidden", "true");
  expect(failures).toEqual([]);
});

test("native settings toggle once, retain input focus and persist actual values", async ({ page }) => {
  const failures = watchRuntime(page);
  await page.goto("/play/last-bastion/?flow=settings");
  const shake = page.getByRole("checkbox", { name: "Screen shake", exact: true });
  await expect(shake).toBeChecked();
  await shake.press("Space");
  await expect(shake).not.toBeChecked();
  await expect(shake).toBeFocused();
  expect(await page.evaluate(() => window.__shellState.settings.screenShakeEnabled)).toBe(false);
  await shake.press("Enter");
  await expect(shake).toBeChecked();
  await page.getByRole("combobox", { name: "HUD scale", exact: true }).selectOption("1.2");
  expect(await page.evaluate(() => window.__shellState.settings.uiScale)).toBe(1.2);
  await page.getByRole("button", { name: "Audio", exact: true }).click();
  const volume = page.getByRole("slider", { name: "Master volume", exact: true });
  await volume.focus();
  const original = Number(await volume.inputValue());
  await volume.press("ArrowLeft");
  await expect(volume).toBeFocused();
  expect(Number(await volume.inputValue())).toBeCloseTo(original - 0.1);
  expect(await page.evaluate(() => window.__shellState.settings.masterVolume)).toBeCloseTo(original - 0.1);
  await page.reload();
  await expect(page.getByRole("combobox", { name: "HUD scale", exact: true })).toHaveValue("1.2");
  await page.getByRole("button", { name: "Audio", exact: true }).click();
  expect(Number(await volume.inputValue())).toBeCloseTo(original - 0.1);
  expect(failures).toEqual([]);
});

test("semantic controls follow the actual canvas box after resize", async ({ page }) => {
  await page.goto("/play/last-bastion/?flow=settings");
  await expect(page.getByRole("heading", { name: "SETTINGS", exact: true })).toBeVisible();
  for (const [width, height] of [[960, 540], [1280, 800], [1920, 1080], [3840, 2160]]) {
    await page.setViewportSize({ width, height });
    // Measure one layout snapshot; separate round trips can straddle Phaser's
    // resize and ResizeObserver updates and compare old canvas/new controls.
    await expect.poll(() => page.evaluate(() => {
      const canvas = document.querySelector("#game-root canvas").getBoundingClientRect();
      const layer = document.querySelector(".semantic-shell").getBoundingClientRect();
      const alignment = Math.max(Math.abs(canvas.x - layer.x), Math.abs(canvas.y - layer.y), Math.abs(canvas.width - layer.width), Math.abs(canvas.height - layer.height));
      const controls = [...document.querySelectorAll(".semantic-shell button, .semantic-shell input, .semantic-shell select")];
      const overflow = controls.some(control => {
        const box = control.getBoundingClientRect();
        return box.left < canvas.left - 1 || box.right > canvas.right + 1 || box.top < canvas.top - 1 || box.bottom > canvas.bottom + 1;
      });
      return { aligned: alignment < 2, contained: !overflow };
    })).toEqual({ aligned: true, contained: true });
  }
});


test("native save import reports invalid files and cancellation without changing progress", async ({ page }) => {
  const failures = watchRuntime(page);
  await page.goto("/play/last-bastion/?flow=settings");
  await page.getByRole("button", { name: "Save & privacy", exact: true }).click();
  const before = await page.evaluate(() => localStorage.getItem("last-bastion-save"));
  const choose = page.waitForEvent("filechooser");
  const action = page.getByRole("button", { name: "Import save backup", exact: true });
  await action.click();
  await (await choose).setFiles({ name: "invalid.json", mimeType: "application/json", buffer: Buffer.from("not json") });
  await expect(page.getByRole("status")).not.toContainText("Changes save automatically");
  await expect(action).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem("last-bastion-save"))).toBe(before);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export save backup", exact: true }).click();
  const exported = await download;
  page.once("dialog", dialog => dialog.dismiss());
  const chooseValid = page.waitForEvent("filechooser");
  await action.click();
  await (await chooseValid).setFiles(await exported.path());
  await expect(page.getByRole("status")).toContainText("Import cancelled");
  await expect(action).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem("last-bastion-save"))).toBe(before);
  expect(failures).toEqual([]);
});

test("menu gamepad selection follows native focus and B returns exactly once", async ({ page }) => {
  await page.addInitScript(() => {
    const pad = { id: "Standard test controller", index: 0, connected: true, mapping: "standard", timestamp: 1, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) };
    window.__testPad = pad;
    Object.defineProperty(navigator, "getGamepads", { value: () => { pad.timestamp = performance.now(); return [pad]; } });
  });
  await page.goto("/play/last-bastion/?flow=menu");
  const button = async index => {
    await page.evaluate(i => { window.__testPad.buttons[i] = { pressed: true, touched: true, value: 1 }; }, index);
    await page.waitForTimeout(120);
    await page.evaluate(i => { window.__testPad.buttons[i] = { pressed: false, touched: false, value: 0 }; }, index);
    await page.waitForTimeout(120);
  };
  const quick = page.getByRole("button", { name: /QUICK DROP/ });
  await expect(quick).toBeFocused();
  await button(13); // Quick Drop -> Records -> Settings, retaining three-column order.
  await expect(page.getByRole("button", { name: /RECORDS/ })).toBeFocused();
  await button(13);
  await expect(page.getByRole("button", { name: /SETTINGS.*Audio/ })).toBeFocused();
  await button(0);
  await expect(page.getByRole("checkbox", { name: "Screen shake", exact: true })).toBeFocused();
  await button(1);
  await expect(page.getByRole("button", { name: /SETTINGS.*Audio/ })).toBeFocused();
  expect(await page.evaluate(() => window.__shellState.screen)).toBe("menu");
  await page.getByRole("button", { name: /QUICK DROP/ }).focus();
  await button(15);
  await expect(page.getByRole("button", { name: /EXPEDITION/ })).toBeFocused();
});


test("native help pages activate once, expose instructions and restore menu focus", async ({ page }) => {
  const failures = watchRuntime(page);
  await page.goto("/play/last-bastion/?flow=menu");
  const help = page.getByRole("button", { name: /HOW TO PLAY/ });
  await help.click();
  await expect(page.getByRole("heading", { name: "HOW TO PLAY", exact: true })).toBeVisible();
  const next = page.getByRole("button", { name: "Next page", exact: true });
  const previous = page.getByRole("button", { name: "Previous page", exact: true });
  await expect(next).toBeFocused();
  await expect(previous).toHaveAttribute("aria-disabled", "true");
  await page.locator("#game-root canvas").click({ position: { x: 480, y: 240 } });
  expect(await page.evaluate(() => window.__shellState.howToPlayPage)).toBe(0);
  await previous.click({ force: true }); // Guarded even if a caller bypasses aria-disabled.
  expect(await page.evaluate(() => window.__shellState.howToPlayPage)).toBe(0);
  await next.press("Enter");
  await expect(page.getByRole("heading", { name: "YOUR ARSENAL", exact: true })).toBeVisible();
  await expect(next).toBeFocused();
  await expect(previous).toHaveAttribute("aria-disabled", "false");
  await previous.press("Space");
  await expect(page.getByRole("heading", { name: "MOVE AND SURVIVE", exact: true })).toBeVisible();
  await expect(previous).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(next).toBeFocused();
  await next.press("Space");
  await expect(page.getByRole("heading", { name: "YOUR ARSENAL", exact: true })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("heading", { name: "DAMAGE AND STATUS", exact: true })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("heading", { name: "THREE WAYS TO PLAY", exact: true })).toBeVisible();
  const finish = page.getByRole("button", { name: "Return to menu", exact: true });
  await expect(finish).toBeFocused();
  await page.keyboard.press("ArrowRight"); // Last page clamps; confirm returns.
  await expect(finish).toBeFocused();
  await expect(page.getByRole("img", { name: /branching expedition route/ })).toBeVisible();
  await expect(page.locator('[data-shell-key="help-content"]')).toHaveAttribute("aria-live", "polite");
  await finish.press("Enter");
  await expect(help).toBeFocused();
  await help.press("Enter");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(help).toBeFocused();
  await help.press("Enter");
  await page.keyboard.press("Escape");
  await expect(help).toBeFocused();
  expect(failures).toEqual([]);
});

for (const deviceScaleFactor of [1, 2]) {
  test(`native help uses saved bindings and stays within its panel at DPR ${deviceScaleFactor}`, async ({ browser }) => {
    const context = await browser.newContext({ deviceScaleFactor, viewport: { width: 960, height: 540 } });
    const page = await context.newPage();
    try {
      // Seed through the application's actual save, retaining its schema and progress.
      await page.goto("/play/last-bastion/?flow=settings");
      await expect(page.getByRole("heading", { name: "SETTINGS", exact: true })).toBeVisible();
      await page.getByRole("checkbox", { name: "Screen shake", exact: true }).uncheck();
      await page.evaluate(() => {
        const save = JSON.parse(localStorage.getItem("last-bastion-save"));
        save.controls.keyboard.evade = "KeyF";
        save.controls.gamepad.evade = "north";
        localStorage.setItem("last-bastion-save", JSON.stringify(save));
      });
      await page.goto("/play/last-bastion/?flow=how-to-play");
      await expect(page.locator('[data-shell-key="help-content"]')).toContainText("F / Y rolls");
      const before = await page.evaluate(() => localStorage.getItem("last-bastion-save"));
      // Keep the physical output at or below the declared 4K review target.
      // A 3840 CSS viewport at DPR 2 requests 8K, not a scaled 4K display.
      const viewports = deviceScaleFactor === 1
        ? [[960, 540], [1280, 800], [1920, 1080], [3840, 2160]]
        : [[960, 540], [1280, 800], [1920, 1080]];
      for (const [width, height] of viewports) {
        await page.setViewportSize({ width, height });
        for (let index = 0; index < 4; index++) {
          await expect(page.locator('[data-shell-key="help-status"]')).toHaveText(`Page ${index + 1} of 4`);
          await expect.poll(() => page.evaluate(() => {
            const canvas = document.querySelector("#game-root canvas").getBoundingClientRect();
            const layer = document.querySelector(".semantic-shell").getBoundingClientRect();
            const content = document.querySelector('[data-shell-key="help-content"]');
            const nodes = [...document.querySelectorAll('.semantic-shell button, .semantic-shell article, .semantic-shell figure, .semantic-shell h1')];
            return {
              aligned: Math.abs(canvas.width - layer.width) < 2 && Math.abs(canvas.top - layer.top) < 2,
              contained: nodes.every(node => { const box = node.getBoundingClientRect(); return box.left >= canvas.left - 1 && box.right <= canvas.right + 1 && box.top >= canvas.top - 1 && box.bottom <= canvas.bottom + 1; }),
              textFits: content.scrollHeight <= content.clientHeight,
              buttons: document.querySelectorAll('.semantic-shell button').length,
            };
          })).toEqual({ aligned: true, contained: true, textFits: true, buttons: 3 });
          await expect(page.getByRole("img")).toHaveCount(1);
          if (index < 3) await page.getByRole("button", { name: "Next page", exact: true }).click();
        }
        for (let index = 0; index < 3; index++) await page.getByRole("button", { name: "Previous page", exact: true }).click();
      }
      expect(await page.evaluate(() => localStorage.getItem("last-bastion-save"))).toBe(before);
    } finally { await context.close(); }
  });
}

test("help gamepad page controls preserve confirm and back behavior", async ({ page }) => {
  await page.addInitScript(() => {
    const pad = { id: "Help test controller", index: 0, connected: true, mapping: "standard", timestamp: 1, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) };
    window.__testPad = pad;
    Object.defineProperty(navigator, "getGamepads", { value: () => { pad.timestamp = performance.now(); return [pad]; } });
  });
  await page.goto("/play/last-bastion/?flow=menu");
  const help = page.getByRole("button", { name: /HOW TO PLAY/ });
  await help.click();
  const press = async index => {
    await page.evaluate(i => { window.__testPad.buttons[i] = { pressed: true, touched: true, value: 1 }; }, index);
    await page.waitForTimeout(120);
    await page.evaluate(i => { window.__testPad.buttons[i] = { pressed: false, touched: false, value: 0 }; }, index);
    await page.waitForTimeout(120);
  };
  await press(15);
  await expect(page.getByRole("heading", { name: "YOUR ARSENAL", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Next page", exact: true })).toBeFocused();
  await press(14);
  await expect(page.getByRole("heading", { name: "MOVE AND SURVIVE", exact: true })).toBeVisible();
  await press(0);
  await expect(page.getByRole("heading", { name: "YOUR ARSENAL", exact: true })).toBeVisible();
  await press(1);
  await expect(help).toBeFocused();
  expect(await page.evaluate(() => window.__shellState.screen)).toBe("menu");
});

async function installShellTestPad(page) {
  await page.addInitScript(() => {
    const pad = { id: "Bindings test controller", index: 0, connected: true, mapping: "standard", timestamp: 1, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) };
    window.__testPad = pad;
    Object.defineProperty(navigator, "getGamepads", { value: () => { pad.timestamp = performance.now(); return [pad]; } });
  });
}

async function shellPadPress(page, index) {
  await page.evaluate(i => { window.__testPad.buttons[i] = { pressed: true, touched: true, value: 1 }; }, index);
  await page.waitForTimeout(120);
  await page.evaluate(i => { window.__testPad.buttons[i] = { pressed: false, touched: false, value: 0 }; }, index);
  await page.waitForTimeout(120);
}

test("native rebinding swaps duplicates, owns capture input, persists and resets", async ({ page }) => {
  const failures = watchRuntime(page);
  await installShellTestPad(page);
  await page.goto("/play/last-bastion/?flow=settings");
  await page.getByRole("button", { name: "Controls", exact: true }).click();
  const entry = page.getByRole("button", { name: "Control bindings", exact: true });
  await entry.click();
  const up = page.getByRole("button", { name: "MOVE UP: W", exact: true });
  await expect(up).toBeFocused();
  const backBox = await page.getByRole("button", { name: "Back", exact: true }).boundingBox();
  const sampleBack = async () => {
    const encoded = (await page.screenshot()).toString("base64");
    return page.evaluate(async ({ encoded, box }) => {
      const image = new Image(); image.src = `data:image/png;base64,${encoded}`; await image.decode();
      const canvas = document.createElement("canvas"); canvas.width = image.width; canvas.height = image.height;
      const ctx = canvas.getContext("2d"); ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(box.x + 7, box.y + 7, 5, 5).data;
      let sum = 0; for (let i = 0; i < pixels.length; i += 4) sum += pixels[i] + pixels[i + 1] + pixels[i + 2];
      return sum / (pixels.length / 4);
    }, { encoded, box: backBox });
  };
  const backBefore = await sampleBack();
  await page.getByRole("button", { name: "ROLL / EVADE: SPACE", exact: true }).press("Enter");
  const dialog = page.getByRole("dialog", { name: "Rebind ROLL / EVADE", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog).toBeFocused();
  await expect(up).toHaveAttribute("inert", "");
  expect(await sampleBack()).toBeLessThan(backBefore * 0.7);
  await shellPadPress(page, 1); // Pad B must not navigate during keyboard capture.
  await expect(dialog).toBeVisible();
  expect(await page.evaluate(() => window.__shellState.screen)).toBe("controls");
  await page.keyboard.press("r"); // Swap existing ultimate binding with evade.
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "ROLL / EVADE: R", exact: true })).toBeFocused();
  await expect(page.getByRole("button", { name: "ULTIMATE: SPACE", exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Controls", exact: true }).click();
  await entry.click();
  await expect(page.getByRole("button", { name: "ROLL / EVADE: R", exact: true })).toBeVisible();
  const beforeCancel = await page.evaluate(() => localStorage.getItem("last-bastion-save"));
  await page.getByRole("button", { name: "ROLL / EVADE: R", exact: true }).press("Space");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Delete"); // Invalid capture key must not reset everything.
  await expect(dialog).toContainText("That key cannot be assigned");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("last-bastion-save"))).toBe(beforeCancel);
  await page.getByRole("button", { name: "ROLL / EVADE: R", exact: true }).click();
  await page.getByRole("button", { name: "Cancel capture", exact: true }).click();
  await expect(page.getByRole("button", { name: "ROLL / EVADE: R", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Reset all bindings", exact: true }).press("Enter");
  await expect(page.getByRole("button", { name: "ROLL / EVADE: SPACE", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "ULTIMATE: R", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(entry).toBeFocused();
  expect(failures).toEqual([]);
});

test("controller capture ignores keyboard navigation, cancels safely and swaps actual pad buttons", async ({ page }) => {
  await installShellTestPad(page);
  await page.goto("/play/last-bastion/?flow=controls");
  await page.getByRole("button", { name: "Controller", exact: true }).click();
  const movement = page.getByRole("button", { name: "MOVE UP: LEFT STICK", exact: true });
  await expect(movement).toHaveAttribute("aria-disabled", "true");
  await movement.click({ force: true });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const evade = page.getByRole("button", { name: "ROLL / EVADE: A", exact: true });
  await evade.click();
  await expect(page.getByRole("dialog")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Backspace");
  expect(await page.evaluate(() => window.__shellState.controlIndex)).toBe(4);
  expect(await page.evaluate(() => window.__shellState.screen)).toBe("controls");
  await page.keyboard.press("Escape");
  await expect(evade).toBeFocused();
  await evade.click();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Cancel capture", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(evade).toBeFocused();
  await shellPadPress(page, 0); // Physical A opens capture once.
  await expect(page.getByRole("dialog")).toBeVisible();
  await shellPadPress(page, 1); // Physical B is a bindable button here, not menu Back.
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "ROLL / EVADE: B", exact: true })).toBeFocused();
  await expect(page.getByRole("button", { name: "USE KIT: A", exact: true })).toBeVisible();
  await shellPadPress(page, 1); // Once capture ends, B resumes its physical menu meaning.
  await expect(page.getByRole("heading", { name: "SETTINGS", exact: true })).toBeVisible();
});

test("native capture supports Enter and Tab bindings without reopening on release", async ({ page }) => {
  await page.goto("/play/last-bastion/?flow=controls");
  await page.getByRole("button", { name: "MOVE UP: W", exact: true }).focus();
  await page.keyboard.down("Enter");
  await expect(page.getByRole("dialog")).toBeFocused();
  await page.keyboard.down("Enter"); // Held opener repeats must not become a new binding.
  await expect(page.getByRole("dialog")).toBeFocused();
  await page.keyboard.up("Enter");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "MOVE UP: ENTER", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "MOVE DOWN: S", exact: true }).click();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "MOVE DOWN: TAB", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "MOVE LEFT: A", exact: true }).click();
  await page.keyboard.press("Space");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "MOVE LEFT: SPACE", exact: true })).toBeFocused();
});

test("native records exposes empty and populated history, clamps navigation and preserves saves", async ({ page }) => {
  const failures = watchRuntime(page);
  await installShellTestPad(page);
  await page.goto("/play/last-bastion/?flow=menu");
  const records = page.getByRole("button", { name: /RECORDS/ });
  await records.click();
  await expect(page.getByRole("heading", { name: "RECORDS", exact: true })).toBeVisible();
  await expect(page.getByText("NO COMPLETED RUNS YET", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Older runs", exact: true })).toHaveAttribute("aria-disabled", "true");
  await page.getByRole("button", { name: "Back", exact: true }).press("Enter");
  await expect(records).toBeFocused();
  // Production debrief supplies a real normalized summary for disposable history fixtures.
  await page.goto("/play/last-bastion/?flow=settings");
  await page.getByRole("checkbox", { name: "Screen shake", exact: true }).uncheck();
  await page.goto("/play/last-bastion/?screen=summary&summarydemo=1");
  await page.waitForFunction(() => Boolean(window.__runSummary));
  await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("last-bastion-save"));
    const summary = window.__runSummary;
    save.runHistory = Array.from({ length: 8 }, (_, index) => ({
      id: `native-record-${index}`, completedAtMs: index === 7 ? 0 : Date.now() - index * 86400000,
      summary: { ...summary, mode: index === 7 ? "expedition" : "quick-drop", threatTier: index === 7 ? 2 : null,
        nodesCleared: index === 7 ? 17 : 0, waveReached: 10 - index, heroId: "medic",
        outcome: index === 0 ? "victory" : "defeat", defeatCause: "arc-warden", commandMarksEarned: index + 1 },
    }));
    save.progress.runsFinished = 8; save.progress.totalDamage = 1234.5;
    localStorage.setItem("last-bastion-save", JSON.stringify(save));
  });
  await page.goto("/play/last-bastion/?flow=records");
  const list = page.getByRole("list", { name: "Recent runs", exact: true });
  await expect(list.getByRole("listitem")).toHaveCount(6);
  await expect(page.getByRole("status")).toHaveText("1–6 of 8");
  await expect(list).toContainText("MEDIC");
  await expect(page.locator('[data-shell-key="career"]')).toContainText("1234.5");
  const saved = await page.evaluate(() => localStorage.getItem("last-bastion-save"));
  await page.getByRole("button", { name: "Older runs", exact: true }).press("Enter");
  await expect(page.getByRole("status")).toHaveText("2–7 of 8");
  await page.getByRole("button", { name: "Older runs", exact: true }).press("Space");
  await expect(page.getByRole("status")).toHaveText("3–8 of 8");
  await expect(list).toContainText("LEGACY SAVE");
  await expect(list).toContainText("17 NODES T2");
  await expect(list).toContainText("DOWNED BY ARC WARDEN");
  await page.getByRole("button", { name: "Older runs", exact: true }).click({ force: true });
  await expect(page.getByRole("status")).toHaveText("3–8 of 8");
  await page.getByRole("button", { name: "Back", exact: true }).focus();
  await page.keyboard.press("ArrowUp");
  await expect(page.getByRole("status")).toHaveText("2–7 of 8");
  await list.focus();
  await page.keyboard.press("ArrowDown"); // Native list scrolling does not skip history entries.
  await expect(page.getByRole("status")).toHaveText("2–7 of 8");
  await shellPadPress(page, 13);
  await expect(page.getByRole("status")).toHaveText("3–8 of 8");
  await expect(page.getByRole("button", { name: "Back", exact: true })).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem("last-bastion-save"))).toBe(saved);
  await shellPadPress(page, 1);
  expect(await page.evaluate(() => window.__shellState.screen)).toBe("menu");
  expect(failures).toEqual([]);
});

test("native controls, capture and records follow canvas bounds across resolution and DPR", async ({ browser }) => {
  for (const deviceScaleFactor of [1, 2]) {
    const context = await browser.newContext({ deviceScaleFactor, viewport: { width: 960, height: 540 } });
    const page = await context.newPage();
    try {
    for (const flow of ["controls", "records"]) {
      await page.goto(`/play/last-bastion/?flow=${flow}`);
      await expect(page.locator(".semantic-shell")).toBeVisible();
      const viewports = deviceScaleFactor === 1
        ? [[960, 540], [1280, 800], [1920, 1080], [3840, 2160]]
        : [[960, 540], [1280, 800], [1920, 1080]];
      for (const [width, height] of viewports) {
        await page.setViewportSize({ width, height });
        await expect.poll(() => page.evaluate(() => {
          const canvas = document.querySelector("#game-root canvas").getBoundingClientRect();
          const layer = document.querySelector(".semantic-shell").getBoundingClientRect();
          return Math.max(Math.abs(canvas.left - layer.left), Math.abs(canvas.top - layer.top), Math.abs(canvas.width - layer.width), Math.abs(canvas.height - layer.height)) < 2
            && [...document.querySelectorAll(".semantic-shell > *")].every(el => {
              const box = el.getBoundingClientRect();
              return box.left >= canvas.left - 1 && box.right <= canvas.right + 1 && box.top >= canvas.top - 1 && box.bottom <= canvas.bottom + 1;
            });
        })).toBe(true);
        if (flow === "controls") {
          await page.getByRole("button", { name: "ROLL / EVADE: SPACE", exact: true }).click();
          await expect(page.getByRole("dialog")).toBeVisible();
          await page.keyboard.press("Escape");
          await expect(page.getByRole("button", { name: "ROLL / EVADE: SPACE", exact: true })).toBeFocused();
        }
      }
    }
    } finally { await context.close(); }
  }
});

test("4K native foreground leaves the canvas background intact", async ({ page }) => {
  await page.setViewportSize({ width: 3840, height: 2160 });
  await page.goto("/play/last-bastion/?flow=settings");
  await expect(page.getByRole("button", { name: "Back", exact: true })).toBeVisible();
  await page.waitForTimeout(500);
  // Chromium previously painted an opaque black copy of Back's bounds into
  // the vertically mirrored canvas area. Inspect real composed pixels, not CSS.
  const screenshot = (await page.screenshot()).toString("base64");
  const blackFraction = await page.evaluate(async encoded => {
    const img = new Image();
    img.src = `data:image/png;base64,${encoded}`;
    await img.decode();
    const sample = document.createElement("canvas");
    sample.width = img.width; sample.height = img.height;
    const ctx = sample.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const back = document.querySelector('[data-shell-key="back"]').getBoundingClientRect();
    const data = ctx.getImageData(back.x + 8, img.height - back.bottom + 8, back.width - 16, back.height - 16).data;
    let black = 0;
    for (let i = 0; i < data.length; i += 4) if (data[i] < 3 && data[i + 1] < 3 && data[i + 2] < 3) black++;
    return black / (data.length / 4);
  }, screenshot);
  expect(blackFraction).toBeLessThan(0.01);
});


test("saved expedition stash is visible after renderer reload", async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 540 });
  await page.goto("/play/last-bastion/?screen=map&mapseed=2026");
  await page.waitForFunction(() => window.__expeditionState?.seed === 2026);
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => Number.isInteger(window.__expeditionState?.armedNodeId));
  const node = await page.evaluate(() => window.__expeditionState.armedNodeId);
  await page.keyboard.press("Enter");
  await page.waitForURL(url => ["game", "event"].includes(url.searchParams.get("screen")));
  await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("last-bastion-save"));
    save.expedition.build = {
      health: 10, shield: 0, level: 1, experience: 0, scrap: 0,
      weapons: [{ weaponId: "bastion-service-rifle", tier: 1 }], upgrades: [],
      ownedItemIds: ["weighted-boots", "weighted-boots"],
      relicIds: ["rel-kinetic-greaves"], equippedArtifactId: "art-last-bastion-protocol",
      weaponStash: [null, { weaponId: "scattergun", tier: 2 }, null, null],
    };
    localStorage.setItem("last-bastion-save", JSON.stringify(save));
  });
  await page.goto(`/play/last-bastion/?screen=game&expedition=1&node=${node}&ambush=10&pausepreview=build&sound=0`);
  for (let visit = 0; visit < 2; visit++) {
    await page.waitForFunction(() => window.__buildInspection?.page === 0);
    await page.keyboard.press("ArrowRight");
    await page.waitForFunction(() => window.__buildInspection?.title.startsWith("STASH"));
    expect(await page.evaluate(() => window.__buildInspection.lines.join(" "))).toContain("Scattergun T2");
    const effectLines = [];
    for (let next = 0; next < 15; next++) {
      await page.keyboard.press("ArrowRight", { delay: 80 });
      const current = await page.evaluate(() => window.__buildInspection);
      effectLines.push(...current.lines);
      if (current.title.startsWith("OWNED ITEMS")) break;
    }
    expect(effectLines.join(" ")).toContain("Weighted Boots x2 — Each: +3 armour, -8% move speed.");
    expect(effectLines.join(" ")).toContain("Your evasive move travels further, but its recovery is slightly longer.");
    expect(effectLines.join(" ")).toContain("At critical health your weapons brace into a tighter, faster formation; long cooldown.");
    if (visit === 0) {
      await page.setViewportSize({ width: 3840, height: 2160 });
      await page.reload();
    }
  }
});


test("native hero and threat selectors preserve locks, focus, mode and deployment", async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 540 });
  await page.goto("/play/last-bastion/?flow=menu");
  await page.getByRole("button", { name: /QUICK DROP/ }).click();
  await page.waitForFunction(() => window.__shellAssetsReady);
  const hero = page.getByLabel("Hero", { exact: true });
  const perk = page.getByLabel("Starting perk", { exact: true });
  await hero.selectOption("4");
  await expect(page.getByRole("button", { name: "Deploy", exact: true })).toHaveAttribute("aria-disabled", "true");
  await page.getByRole("button", { name: "Deploy", exact: true }).click({ force: true });
  expect(await page.evaluate(() => window.__shellState.screen)).toBe("character-select");
  await expect(page.getByRole("region", { name: "Hero abilities and starting equipment" })).toContainText("UNLOCK");
  await hero.selectOption("0");
  await perk.selectOption("9");
  await expect(page.getByRole("button", { name: "Deploy", exact: true })).toHaveAttribute("aria-disabled", "true");
  await perk.selectOption("0");
  await hero.focus();
  await hero.selectOption("1");
  await expect(hero).toBeFocused();
  await hero.selectOption("0");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByRole("button", { name: /QUICK DROP/ })).toBeFocused();
  await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("last-bastion-save")) || { version: 17 };
    save.progress = { ...save.progress, threatTierVictories: { 0: 1, 1: 0, 2: 0 } };
    localStorage.setItem("last-bastion-save", JSON.stringify(save));
  });
  await page.reload();
  await page.getByRole("button", { name: /EXPEDITION/ }).click();
  await page.waitForFunction(() => window.__shellAssetsReady);
  await page.getByRole("button", { name: "Choose threat tier", exact: true }).click();
  const threat = page.getByLabel("Expedition threat tier", { exact: true });
  await threat.selectOption("2");
  await expect(page.getByRole("button", { name: "Begin expedition", exact: true })).toHaveAttribute("aria-disabled", "true");
  await expect(page.locator('[data-shell-key="threat-detail"]')).toContainText("Clear Tier 1");
  await threat.selectOption("1");
  await page.setViewportSize({ width: 3840, height: 2160 });
  await expect(threat).toHaveValue("1");
  await page.getByRole("button", { name: "Begin expedition", exact: true }).click();
  await page.waitForURL(url => url.searchParams.get("screen") === "map");
  await page.waitForFunction(() => window.__expeditionState?.threatTier === 1);
});


test("native selection panels fit all heroes and pad confirmation respects focused Back", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const pad = { id: "Standard test controller", index: 0, connected: true, mapping: "standard", timestamp: 1,
      axes: [0,0,0,0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) };
    window.__testPad = pad;
    Object.defineProperty(navigator, "getGamepads", { value: () => { pad.timestamp = performance.now(); return [pad]; } });
  });
  await page.goto("/play/last-bastion/?flow=menu");
  await page.getByRole("button", { name: /QUICK DROP/ }).click();
  await page.waitForFunction(() => window.__shellAssetsReady);
  for (const viewport of [{ width: 960, height: 540 }, { width: 3840, height: 2160 }]) {
    await page.setViewportSize(viewport);
    for (const index of [0, 1, 2, 3, 4]) {
      await page.getByLabel("Hero", { exact: true }).selectOption(String(index));
      const issues = await page.evaluate(() => {
        const panel = document.querySelector(".semantic-shell").getBoundingClientRect();
        return [...document.querySelectorAll(".semantic-shell > *")].filter(el => {
          const box = el.getBoundingClientRect();
          return box.left < panel.left - 1 || box.right > panel.right + 1 || box.top < panel.top - 1 || box.bottom > panel.bottom + 1;
        }).map(el => el.dataset.shellKey);
      });
      expect(issues).toEqual([]);
      await expect(page.getByRole("region", { name: "Hero abilities and starting equipment" })).toContainText("WEAPON");
    }
  }
  await page.setViewportSize({ width: 960, height: 540 });
  await page.getByLabel("Hero", { exact: true }).selectOption("0");
  await page.screenshot({ path: testInfo.outputPath("hero.png") });
  await page.getByRole("button", { name: "Back", exact: true }).focus();
  await page.evaluate(() => { window.__testPad.buttons[0] = { pressed: true, touched: true, value: 1 }; });
  await page.waitForFunction(() => window.__shellState.screen === "menu");
  await page.evaluate(() => { window.__testPad.buttons[0] = { pressed: false, touched: false, value: 0 }; });
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => window.__shellState.screen)).toBe("menu");
});

test("native armory guards purchases, separates inspection and persists earned equipment", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 960, height: 540 });
  await page.goto("/play/last-bastion/?flow=menu");
  await page.getByRole("button", { name: /ARMORY/ }).click();
  const inspect = page.getByLabel("Inspect equipment or clearance", { exact: true });
  const action = page.locator('[data-shell-key="armory-action"]');
  const detail = page.locator('[data-shell-key="armory-detail"]');
  await expect(action).toHaveAttribute("aria-disabled", "true");
  await expect(detail).toContainText("Need 5 more marks");
  await action.click({ force: true });
  expect(await page.evaluate(() => window.__shellState.purchasedArmoryNodeIds)).toEqual([]);
  await inspect.selectOption("1");
  await expect(detail).toContainText("Requires: CLOSE-QUARTERS KIT");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByRole("button", { name: /ARMORY/ })).toBeFocused();
  await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("last-bastion-save")) || { version: 17 };
    save.progress = { ...save.progress, commandMarksLifetime: 100, purchasedArmoryNodeIds: [] };
    localStorage.setItem("last-bastion-save", JSON.stringify(save));
  });
  await page.reload();
  await page.getByRole("button", { name: /ARMORY/ }).click();
  await inspect.selectOption("1");
  await expect(action).toHaveAttribute("aria-disabled", "true"); // Affordable, but missing prerequisite.
  await action.click({ force: true });
  expect(await page.evaluate(() => window.__shellState.commandMarksBalance)).toBe(100);
  await inspect.selectOption("0");
  await action.focus();
  await page.keyboard.press("Enter");
  await expect(action).toHaveText("Equipped");
  await expect(action).toBeFocused();
  expect(await page.evaluate(() => window.__shellState.commandMarksBalance)).toBe(95);
  await page.keyboard.press("Enter");
  expect(await page.evaluate(() => window.__shellState.commandMarksBalance)).toBe(95);
  const ids = ["armory-scattergun", "armory-arc-carbine", "armory-patrol-blade", "armory-assault-clearance", "armory-tactician-clearance", "armory-scout-clearance"];
  for (const index of [1, 2, 3, 4, 5]) {
    const before = await page.evaluate(() => window.__shellState.commandMarksBalance);
    await inspect.focus();
    await inspect.selectOption(String(index));
    await expect(inspect).toBeFocused();
    expect(await page.evaluate(() => window.__shellState.commandMarksBalance)).toBe(before);
    await action.click();
    await expect(action).toBeFocused();
  }
  await expect(action).toHaveText("Clearance owned");
  await expect(action).toHaveAttribute("aria-disabled", "true");
  expect(await page.evaluate(() => window.__shellState.purchasedArmoryNodeIds)).toEqual(ids);
  expect(await page.evaluate(() => window.__shellState.commandMarksBalance)).toBe(15);
  await inspect.selectOption("0");
  expect(await page.evaluate(() => window.__shellState.selectedArmoryNodeId)).toBe("armory-patrol-blade");
  await page.getByRole("button", { name: "Equip kit", exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath("armory.png") });
  await page.reload();
  await page.getByRole("button", { name: /ARMORY/ }).click();
  expect(await page.evaluate(() => window.__shellState.purchasedArmoryNodeIds)).toEqual(ids);
  expect(await page.evaluate(() => window.__shellState.selectedArmoryNodeId)).toBe("armory-scattergun");
  expect(await page.evaluate(() => window.__shellState.commandMarksBalance)).toBe(15);
  for (const viewport of [{ width: 960, height: 540 }, { width: 3840, height: 2160 }]) {
    await page.setViewportSize(viewport);
    for (const index of [0, 1, 2, 3, 4, 5]) {
      await inspect.selectOption(String(index));
      expect(await page.evaluate(() => {
        const panel = document.querySelector(".semantic-shell").getBoundingClientRect();
        return [...document.querySelectorAll(".semantic-shell > *")].filter(el => {
          const box = el.getBoundingClientRect();
          return box.left < panel.left - 1 || box.right > panel.right + 1 || box.top < panel.top - 1 || box.bottom > panel.bottom + 1 || el.scrollHeight > el.clientHeight + 1;
        }).map(el => el.dataset.shellKey);
      })).toEqual([]);
    }
  }
});

test("native armory simulated pad spends once and focused Back returns once", async ({ page }) => {
  await page.addInitScript(() => {
    const pad = { id: "Standard test controller", index: 0, connected: true, mapping: "standard", timestamp: 1,
      axes: [0,0,0,0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) };
    window.__testPad = pad;
    Object.defineProperty(navigator, "getGamepads", { value: () => { pad.timestamp = performance.now(); return [pad]; } });
    localStorage.setItem("last-bastion-save", JSON.stringify({ version: 17, progress: { commandMarksLifetime: 10 } }));
  });
  await page.goto("/play/last-bastion/?flow=menu");
  await page.getByRole("button", { name: /ARMORY/ }).click();
  await page.evaluate(() => { window.__testPad.buttons[0] = { pressed: true, touched: true, value: 1 }; });
  await page.waitForFunction(() => window.__shellState.commandMarksBalance === 5);
  await page.waitForTimeout(150);
  await page.evaluate(() => { window.__testPad.buttons[0] = { pressed: false, touched: false, value: 0 }; });
  expect(await page.evaluate(() => window.__shellState.purchasedArmoryNodeIds)).toEqual(["armory-scattergun"]);
  await page.getByRole("button", { name: "Back", exact: true }).focus();
  await page.waitForTimeout(100);
  await page.evaluate(() => { window.__testPad.buttons[0] = { pressed: true, touched: true, value: 1 }; });
  await page.waitForFunction(() => window.__shellState.screen === "menu");
  await page.evaluate(() => { window.__testPad.buttons[0] = { pressed: false, touched: false, value: 0 }; });
  await expect(page.getByRole("button", { name: /ARMORY/ })).toBeFocused();
});

test("native armory exposes failed persistence and retries without charging twice", async ({ page }) => {
  await page.goto("/play/last-bastion/?flow=menu");
  await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("last-bastion-save")) || { version: 17 };
    save.progress = { ...save.progress, commandMarksLifetime: 10, purchasedArmoryNodeIds: [] };
    localStorage.setItem("last-bastion-save", JSON.stringify(save));
  });
  await page.reload();
  await page.getByRole("button", { name: /ARMORY/ }).click();
  await page.evaluate(() => {
    window.__originalStorageWrite = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === "last-bastion-save") throw new DOMException("Test storage failure", "QuotaExceededError");
      return window.__originalStorageWrite.call(this, key, value);
    };
  });
  await page.getByRole("button", { name: "Purchase for 5 marks", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save error. Retry saving", exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.__shellState.commandMarksBalance)).toBe(5);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("last-bastion-save")).progress.purchasedArmoryNodeIds)).toEqual([]);
  await page.evaluate(() => { Storage.prototype.setItem = window.__originalStorageWrite; });
  await page.getByRole("button", { name: "Save error. Retry saving", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save error. Retry saving", exact: true })).toHaveCount(0);
  await page.reload();
  await page.getByRole("button", { name: /ARMORY/ }).click();
  expect(await page.evaluate(() => window.__shellState.purchasedArmoryNodeIds)).toEqual(["armory-scattergun"]);
  expect(await page.evaluate(() => window.__shellState.commandMarksBalance)).toBe(5);
  await expect(page.locator('[data-shell-key="armory-action"]')).toHaveText("Equipped");
});
