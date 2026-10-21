import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { openOptions } from './helpers/options.mjs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../../play/soccer-trivia-sprint/index.html',import.meta.url),'utf8');
const bank=vm.runInNewContext(html.match(/var questions = (\[[\s\S]*?\n  \]);/)[1]);
test.beforeEach(async({page})=>{
 await page.route('https://static.cloudflareinsights.com/**',route=>route.fulfill({status:200,body:''}));
});
test('penalty-shootout: restarting during flight cancels the old result and next phase',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('/play/penalty-shootout/');
 await page.locator('#pk-pad button').first().click();
 await page.locator('#pk-new').click();
 await page.waitForTimeout(1800);
 await expect(page.locator('#pk-status')).toHaveText("You're shooting first — pick a corner.");
 await expect(page.locator('#pk-you')).toHaveText('0');await expect(page.locator('#pk-cpu')).toHaveText('0');
 await expect(page.locator('#pk-round')).toHaveText('1');
 await expect(page.locator('#pk-pad button').first()).toBeEnabled();expect(errors).toEqual([]);
});
test('soccer-trivia-sprint: a complete category sprint keeps unique questions and correct shuffled answers',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('/play/soccer-trivia-sprint/');
 // The topic has fewer Legend questions than the sprint length; its fallback
 // must remain inside the selected topic and avoid repeated questions.
 await openOptions(page);
 await page.locator('[data-category="teams2026"]').click();
 await page.locator('[data-difficulty="legend"]').click();
 const options=page.locator('.sp-options-toggle');
 if(await options.isVisible() && await options.getAttribute('aria-expanded')==='true')await options.click();
 const seen=new Set();
 for(let round=0;round<12;round++){
  const text=await page.locator('#trivia-question').textContent();expect(seen.has(text)).toBe(false);seen.add(text);
  const entry=bank.find(q=>q.q===text);expect(entry.topic).toBe('World Cup 2026 Teams');
  await page.locator('#trivia-options').getByRole('button',{name:entry.a[entry.correct],exact:true}).click();
  await expect(page.locator('#trivia-status')).toContainText(/Fast answer|Correct\./);
  await page.locator('#trivia-next').click();
 }
 await expect(page.locator('#trivia-question')).toContainText('Full time:');
 await expect(page.locator('#trivia-streak')).toHaveText('12');expect(errors).toEqual([]);
});
test('soccer-trivia-sprint: expired questions cannot earn a late correct answer',async({page})=>{
 await page.clock.install();await page.goto('/play/soccer-trivia-sprint/');
 await page.clock.runFor(15010);
 await expect(page.locator('#trivia-status')).toContainText('Time. The answer was');
 await expect(page.locator('#trivia-score')).toHaveText('0');
 await expect(page.locator('#trivia-options button').first()).toBeDisabled();
});
