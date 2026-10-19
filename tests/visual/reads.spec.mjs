import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const bookCount = JSON.parse(fs.readFileSync(new URL('../../data/read-publication-evidence.json', import.meta.url), 'utf8')).books.length;

const key = 'snackpack.reading.position.v1';
const book = '/read/ted-e-bears-blanket-fort/';
const saved = { version: 1, slug: 'ted-e-bears-blanket-fort', page: 3, total: 4, completed: false };

test('search combines filters, normalises names and safely restores URL state', async ({ page }) => {
  await page.goto('/read/?q=MEOWINARA&type=stories&age=5-6');
  const visible = page.locator('.read-library-card:visible');
  await expect(visible).toHaveCount(2); // Meow-inara also appears in Library Day's blurb.
  await expect(visible.filter({hasText:'Moonlight Story'})).toHaveCount(1);
  await page.getByRole('button',{name:'Clear search and filters',exact:true}).click();
  await expect(visible).toHaveCount(bookCount);
  await page.getByLabel('Find a book', { exact: true }).fill('cafe');
  await expect(visible).toHaveCount(1);
  await expect(visible).toContainText('Café');
  await page.getByLabel('Find a book', { exact: true }).fill('does-not-exist');
  await expect(visible).toHaveCount(0);
  await page.getByRole('button', { name: 'Show every book', exact: true }).click();
  await expect(visible).toHaveCount(bookCount);
  await expect(page).not.toHaveURL(/[?&](q|age|type)=/);
  await page.goto('/read/?type=%22%5D%3Bbad&q=%3Cscript%3E#short');
  await expect(page.locator('.read-filters')).toBeVisible();
  await expect(page.locator('[data-filter-kind="all"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('script:not([src])').filter({ hasText: 'alert(' })).toHaveCount(0);
});

test('reader saves page turns, resumes explicitly and forgets from the shelf', async ({ page }) => {
  await page.goto(book);
  await expect.poll(() => page.evaluate(k => localStorage.getItem(k), key)).toBeNull();
  await page.getByRole('button', { name: 'One page at a time', exact: true }).click();
  await page.locator('.reader-bar').getByRole('button', { name: 'Next', exact: true }).click();
  await page.locator('.reader-bar').getByRole('button', { name: 'Next', exact: true }).click();
  await expect.poll(() => page.evaluate(k => JSON.parse(localStorage.getItem(k)).page, key)).toBe(3);
  await page.goto('/read/');
  await expect(page.locator('[data-read-continue] a')).toHaveAttribute('href', './ted-e-bears-blanket-fort/#page-3');
  await page.goto(book);
  await expect(page).not.toHaveURL(/#page/);
  await page.getByRole('link', { name: 'Resume at page 3', exact: true }).click();
  await expect(page).toHaveURL(/#page-3$/);
  await page.goto(book);
  await page.getByRole('link', { name: 'Start again', exact: true }).click();
  await expect(page).toHaveURL(/#page-1$/);
  await expect.poll(() => page.evaluate(k => JSON.parse(localStorage.getItem(k)).page, key)).toBe(1);
  await page.goto('/read/');
  await page.getByRole('button', { name: 'Forget reading position' }).click();
  await expect(page.locator('[data-read-continue]')).toBeHidden();
  expect(await page.evaluate(k => localStorage.getItem(k), key)).toBeNull();
});

test('explicit shared page, scroll progress and finish state', async ({ page }) => {
  await page.addInitScript(({key,saved}) => localStorage.setItem(key, JSON.stringify(saved)), {key,saved});
  await page.goto(book + '#page-2');
  await page.getByRole('button', { name: 'One page at a time', exact: true }).click();
  await expect(page.locator('.reader-bar-label')).toHaveText('Page 2 of 4');
  await page.locator('.reader-bar').getByRole('button', {name:'Next',exact:true}).click();
  await page.locator('.reader-bar').getByRole('button', {name:'Next',exact:true}).click();
  await page.locator('.reader-bar').getByRole('button', {name:'The end',exact:true}).click();
  await expect.poll(() => page.evaluate(k => JSON.parse(localStorage.getItem(k)).completed,key)).toBe(true);
  await page.evaluate(k => localStorage.removeItem(k), key);
  await page.goto(book);
  await page.locator('#page-2').scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null')?.page,key)).toBe(2);
});

for (const value of ['broken', JSON.stringify({...saved,slug:'retired-book'}), JSON.stringify({...saved,total:99})]) {
  test('ignore malformed or stale position: '+value, async ({page}) => {
    await page.addInitScript(({key,value}) => localStorage.setItem(key,value),{key,value});
    await page.goto('/read/');
    await expect(page.locator('[data-read-continue]')).toBeHidden();
  });
}

test('blocked storage does not prevent search, reading or larger text', async ({page}) => {
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype,'getItem',{value(){throw new Error('blocked');}});
    Object.defineProperty(Storage.prototype,'setItem',{value(){throw new Error('blocked');}});
  });
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/read/');
  await page.getByLabel('Find a book',{exact:true}).fill('blanket');
  await expect(page.locator('.read-library-card:visible')).toHaveCount(1);
  await page.goto(book);
  await page.getByRole('button',{name:'Use larger story text'}).click();
  await expect(page.locator('html')).toHaveAttribute('data-read-text','larger');
  await page.getByRole('button',{name:'One page at a time',exact:true}).click();
  await expect(page.locator('.reader-bar-label')).toHaveText('Page 1 of 4');
  expect(errors).toEqual([]);
});

for (const width of [320,390,1280]) for (const theme of ['cream','dark','light']) {
  test(`larger text fits ${width}px in ${theme}`,async({page})=>{
    await page.setViewportSize({width,height:844});
    await page.addInitScript(t=>localStorage.setItem('snackpack.theme.v1',t),theme);
    for(const url of [book,'/read/animal-architects/','/read/wise-owl-festival-of-factors/']) {
      await page.goto(url);
      if(await page.locator('html').getAttribute('data-read-text')!=='larger') await page.getByRole('button',{name:'Use larger story text'}).click();
      await page.locator('#page-1').scrollIntoViewIfNeeded();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
      await page.getByRole('button',{name:'One page at a time',exact:true}).click();
      await expect(page.locator('.reader-bar .read-text-size')).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
      const bar=await page.locator('.reader-bar').boundingBox();expect(bar.x).toBeGreaterThanOrEqual(0);expect(bar.x+bar.width).toBeLessThanOrEqual(width+1);
    }
  });
}

test('no JavaScript still shows books and the start-here links',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
  await page.goto('http://127.0.0.1:4173/read/');
  await expect(page.locator('.read-library-card:visible')).toHaveCount(bookCount);
  await expect(page.locator('.read-filters')).toBeHidden();
  await page.locator('.read-start summary').click();
  await expect(page.getByRole('link',{name:'Learning letters',exact:true})).toBeVisible();await context.close();
});

test('200 percent text remains readable on a narrow reader',async({page})=>{
  await page.setViewportSize({width:320,height:844});
  await page.goto('/read/animal-architects/');
  await page.getByRole('button',{name:'Use larger story text'}).click();
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  await page.locator('#page-1').scrollIntoViewIfNeeded();
  const overflow = await page.evaluate(()=>[...document.querySelectorAll('main *,footer *')].filter(e=>e.getBoundingClientRect().right>innerWidth+2&&getComputedStyle(e).display!=='none').map(e=>({tag:e.tagName,cls:e.className,width:Math.round(e.getBoundingClientRect().width),right:Math.round(e.getBoundingClientRect().right)})).slice(0,20));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),JSON.stringify(overflow)).toBe(true);
  await page.getByRole('button',{name:'One page at a time',exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('collections keep individual downloads and truthful page counts',async({page})=>{
  await page.goto('/read/collections/');
  await expect(page.locator('main .app-card')).toHaveCount(3);
  await page.goto('/read/collections/first-phonics/');
  await expect(page.locator('main li')).toHaveCount(6);
  await expect(page.locator('main')).toContainText('57 printed pages');
  await expect(page.locator('a[download]')).toHaveCount(7);
  await page.setViewportSize({width:320,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('speech events highlight words, survive a stale end event and explain errors',async({page})=>{
  await page.addInitScript(()=>{
    window.speechCalls=[];
    window.SpeechSynthesisUtterance=function(text){this.text=text;};
    Object.defineProperty(window,'speechSynthesis',{value:{getVoices(){return [{lang:'en-GB',localService:true}];},speak(u){window.speechCalls.push(u);},cancel(){}}});
  });
  await page.goto(book);
  const card=page.locator('#page-1');
  await card.getByRole('button',{name:'Read to me',exact:true}).click();
  await page.evaluate(()=>speechCalls[0].onboundary({name:'word',charIndex:0}));
  await expect(card.locator('.read-word.is-spoken')).toHaveText('Ted-E-Bear');
  await card.getByRole('button',{name:/Reading speed:/}).click();
  expect(await page.evaluate(()=>speechCalls.length)).toBe(2);
  await page.evaluate(()=>speechCalls[0].onend());
  await expect(card.getByRole('button',{name:'Stop reading',exact:true})).toBeVisible();
  await page.evaluate(()=>speechCalls[1].onerror({error:'not-allowed'}));
  await expect(card.locator('[role="status"]')).toContainText('You can keep reading');
  await expect(card.getByRole('button',{name:'Read to me',exact:true})).toBeVisible();
});
