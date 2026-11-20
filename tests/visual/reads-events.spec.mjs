import fs from 'node:fs';
import { test, expect } from '@playwright/test';
import { renderReadEventActivity } from '../../scripts/lib/read-event-activities.mjs';

const registry = JSON.parse(fs.readFileSync(new URL('../../data/web-originals.json', import.meta.url), 'utf8'));
const books = [
  ['thanksgiving', 'everybody-brought-potatoes', 26],
  ['thanksgiving', 'corgi-on-the-cob-and-the-harvest-table', 24],
  ['new-year', 'ted-e-bear-and-the-jar-of-good-things', 26],
  ['new-year', 'cluck-oclock-and-the-midnight-that-came-early', 24],
];

async function openActivity(page, event, activity) {
  const url = `/read/events/${event}/`;
  if (!fs.existsSync(new URL(`../..${url}index.html`, import.meta.url))) {
    await page.route(url, route => route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/site.css"><link rel="stylesheet" href="/read/activities/events.css"></head><body><main>${renderReadEventActivity(activity)}</main></body></html>`,
    }));
  }
  await page.goto(url);
}

for (const [event, slug, count] of books) {
  test(`${slug}: complete artwork and event navigation`, async ({ page }) => {
    test.skip(!registry[slug], 'Runs when the reviewed book has been imported.');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/read/${slug}/`);
    await expect(page.locator('.story-page-card')).toHaveCount(count);
    await expect(page.locator('.read-event-chip a')).toHaveAttribute('href', `/read/events/${event}/`);
    const sources = await page.locator('.story-title-section picture, .story-page-card picture').evaluateAll(pictures =>
      pictures.flatMap(picture => [picture.querySelector('img').src, picture.querySelector('source').srcset.split(',').map(source =>
        new URL(source.trim().split(/\s+/)[0], location.href).href)].flat()));
    for (const source of new Set(sources)) expect((await page.request.get(source)).ok(), source).toBe(true);
    await page.locator('.read-event-chip a').click();
    await expect(page).toHaveURL(new RegExp(`/read/events/${event}/$`));
  });
}

const corgi = '/read/corgi-on-the-cob-and-the-harvest-table/';
test('Corgi asks the five Count Together questions', async ({ page, browser }) => {
  test.skip(!registry['corgi-on-the-cob-and-the-harvest-table'], 'Runs after Corgi is imported.');
  await page.goto(corgi);
  await expect(page.locator('.math-question')).toHaveCount(5);
  const question = page.locator('#page-2 .math-question');
  await question.getByRole('button', { name: '5', exact: true }).click();
  await expect(question).toContainText(/have another go/i);
  await expect(question.getByRole('button', { name: '5', exact: true })).toHaveClass(/is-tried/);
  await question.getByRole('button', { name: '6', exact: true }).click();
  await expect(question).toContainText('Yes!');
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const staticPage = await context.newPage();
    await staticPage.goto(new URL(corgi, page.url()).href);
    const fallback = staticPage.locator('#page-2 details.math-answer');
    await fallback.getByText('Show the answer').click();
    await expect(fallback).toContainText('One for each friend at the table.');
  } finally {
    await context.close();
  }
});

test('Thank-you Leaves keeps names in memory until explicitly saved', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openActivity(page, 'thanksgiving', 'thank-you-leaves');
  const input = page.getByRole('textbox', { name: 'Who are you thankful for?' });
  const list = page.getByRole('list', { name: 'Thank-you leaves' });
  const keep = page.getByRole('checkbox', { name: 'Keep my leaves on this device' });
  const key = 'snackpack.read.thank-you-leaves.v1';
  await expect(keep).not.toBeChecked();
  await input.fill('<b>Grandma</b>');
  await page.getByRole('radio', { name: 'Gold' }).check();
  await input.press('Enter');
  await expect(input).toBeFocused();
  await expect(list.getByRole('listitem')).toHaveText('<b>Grandma</b>');
  await expect(list.locator('b')).toHaveCount(0);
  await expect(page.locator('[data-activity] [role="status"]')).toHaveText('Leaf added for <b>Grandma</b>');
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(null);

  await page.evaluate(() => { window.print = () => {}; });
  await page.getByRole('button', { name: 'Print my branch' }).click();
  await page.emulateMedia({ media: 'print' });
  await expect(list).toBeVisible();
  await expect(input).toBeHidden();
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await page.emulateMedia({ media: 'screen' });

  await keep.check();
  await page.reload();
  await expect(keep).toBeChecked();
  await expect(list.getByRole('listitem')).toHaveText('<b>Grandma</b>');
  await keep.uncheck();
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(null);
  for (let i = 1; i <= 12; i++) {
    await input.fill('Friend ' + i);
    await input.press('Enter');
  }
  await expect(list.getByRole('listitem')).toHaveCount(12);
  await expect(list.getByText('<b>Grandma</b>')).toHaveCount(0);
  await keep.check();
  await page.getByRole('button', { name: 'Clear the branch' }).click();
  await expect(list.getByRole('listitem')).toHaveCount(0);
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(null);
});

test.describe('Midnight clocks in story order', () => {
  test.use({ timezoneId: 'Europe/London' });

  test('Dubai reaches midnight before Nairobi', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-12-31T19:59:50Z') });
    await openActivity(page, 'new-year', 'midnight-clocks');
    const dubai = page.locator('[data-zone="Asia/Dubai"]');
    const countdown = page.locator('[data-countdown]');
    await expect(dubai.getByText('New Year!')).toBeHidden();
    await expect(countdown).toContainText('Dubai');
    await page.clock.runFor(11000);
    await expect(dubai.getByText('New Year!')).toBeVisible();
    await expect(dubai.locator('[data-clock-date]')).toHaveText('1 Jan');
    await expect(countdown).toContainText('Nairobi');
    await expect(page.locator('[data-activity] [role="status"]')).toHaveText('It’s New Year in Dubai.');
  });

  test('off-season clocks show the current date', async ({ page }) => {
    await page.clock.install({ time: new Date('2027-06-07T12:00:00Z') });
    await openActivity(page, 'new-year', 'midnight-clocks');
    await expect(page.getByRole('img', { name: /Kiritimati.*8 Jun/ })).toBeVisible();
    await expect(page.getByText('New Year!', { exact: true }).filter({ visible: true })).toHaveCount(0);
    await expect(page.locator('[data-countdown]')).toContainText('Come back on New Year’s Eve');
  });
});

for (const width of [320, 390]) {
  test(`event activity pages fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 780 });
    for (const [event, activity] of [['thanksgiving', 'thank-you-leaves'], ['new-year', 'midnight-clocks']]) {
      await openActivity(page, event, activity);
      if (activity === 'thank-you-leaves') {
        await page.getByRole('textbox', { name: 'Who are you thankful for?' }).fill('X'.repeat(40));
        await page.getByRole('button', { name: 'Hang my leaf' }).click();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth), activity).toBeLessThanOrEqual(width);
    }
  });
}

test.describe('without scripts', () => {
  test.use({ javaScriptEnabled: false });
  test('Thanksgiving offers a printable and New Year shows time differences', async ({ page }) => {
    await openActivity(page, 'thanksgiving', 'thank-you-leaves');
    await expect(page.getByRole('link', { name: 'Print the Thank-you Leaves sheet (PDF)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hang my leaf' })).toBeHidden();
    await openActivity(page, 'new-year', 'midnight-clocks');
    await expect(page.getByRole('table', { name: 'Time differences on 31 December' })).toBeVisible();
    await expect(page.getByRole('row', { name: 'Kiritimati UTC+14' })).toBeVisible();
  });
});
