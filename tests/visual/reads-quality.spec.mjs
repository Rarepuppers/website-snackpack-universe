import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const book='/read/luckybugs-art-gallery/';
const manifest=JSON.parse(fs.readFileSync(new URL('../../read/offline-manifest.json',import.meta.url),'utf8'));
const selected=manifest.bookFiles.find(b=>b.slug==='luckybugs-art-gallery');
const cacheName=fs.readFileSync(new URL('../../sw.js',import.meta.url),'utf8').match(/const CACHE = "([^"]+)"/)[1];

test.describe('offline controls with real Cache API and controlled network failures',()=>{
  test.use({serviceWorkers:'block'});
  test.beforeEach(async({page})=>{
    await page.addInitScript(name=>{
      Object.defineProperty(navigator,'serviceWorker',{value:{controller:null,ready:Promise.resolve({}),register:()=>Promise.resolve({}),addEventListener(){}}});
      window.cacheReady=caches.open(name);
    },cacheName);
    await page.goto(book);await page.evaluate(()=>window.cacheReady);
  });
  test('HTML and utility pages alone are not a saved book',async({page})=>{
    await page.evaluate(async({cacheName,book})=>{const c=await caches.open(cacheName);await c.add(book);await c.add('/read/collections/');},{cacheName,book});
    await page.goto('/read/');
    await expect(page.locator('[data-read-offline-status]')).toContainText('0 of '+manifest.books+' complete books saved');
  });
  test('save a complete book; remove only that book and retain other books and games',async({page})=>{
    await page.getByRole('button',{name:'Save this book for offline',exact:true}).click();
    await expect(page.getByRole('button',{name:'Saved for offline',exact:true})).toBeDisabled({timeout:30000});
    const other=manifest.bookFiles.find(b=>b.slug!=='luckybugs-art-gallery').urls[0];
    await page.evaluate(async({cacheName,other})=>{const c=await caches.open(cacheName);await c.put('/play/test-preserved/',new Response('game'));await c.put(other,new Response('other book'));},{cacheName,other});
    await page.getByRole('button',{name:'Remove saved book',exact:true}).click();
    await expect(page.locator('[data-read-offline-status]')).toContainText('not fully saved');
    expect(await page.evaluate(async({cacheName,other,selected})=>{const c=await caches.open(cacheName);return {game:!!await c.match('/play/test-preserved/'),other:!!await c.match(other),book:!!await c.match(selected.urls[0]),shared:!!await c.match('/site.css')};},{cacheName,other,selected})).toEqual({game:true,other:true,book:false,shared:true});
  });
  test('failed art is not complete; retry finishes it; eviction invalidates completion',async({page})=>{
    const missing=selected.urls.find(u=>u.endsWith('.webp'));
    await page.route('**'+missing,r=>r.fulfill({status:503,body:'unavailable'}));
    await page.getByRole('button',{name:'Save this book for offline',exact:true}).click();
    await expect(page.locator('[data-read-offline-status]')).toContainText('Some files could not be saved',{timeout:30000});
    await expect(page.getByRole('button',{name:'Save this book for offline',exact:true})).toBeEnabled();
    await page.unroute('**'+missing);
    await page.getByRole('button',{name:'Save this book for offline',exact:true}).click();
    await expect(page.getByRole('button',{name:'Saved for offline',exact:true})).toBeDisabled({timeout:30000});
    await page.evaluate(async({cacheName,missing})=>{await(await caches.open(cacheName)).delete(missing);},{cacheName,missing});
    await page.reload();await expect(page.locator('[data-read-offline-status]')).toContainText('not fully saved');
  });
  test('cancel keeps partial work and permits a successful retry',async({page})=>{
    await page.route('**/pages/*.webp',async r=>{await new Promise(resolve=>setTimeout(resolve,1500));await r.abort().catch(()=>{});});
    await page.getByRole('button',{name:'Save this book for offline',exact:true}).click();
    await expect(page.getByRole('button',{name:'Cancel saving',exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Cancel saving',exact:true}).click();
    await expect(page.locator('[data-read-offline-status]')).toContainText('Saving cancelled',{timeout:15000});
    await page.unroute('**/pages/*.webp');
    await page.getByRole('button',{name:'Save this book for offline',exact:true}).click();
    await expect(page.getByRole('button',{name:'Saved for offline',exact:true})).toBeDisabled({timeout:30000});
  });
  test('stale cached HTML does not count as the current saved story',async({page})=>{
    await page.getByRole('button',{name:'Save this book for offline',exact:true}).click();
    await expect(page.getByRole('button',{name:'Saved for offline',exact:true})).toBeDisabled({timeout:30000});
    await page.evaluate(async({cacheName,book})=>{await(await caches.open(cacheName)).put(book,new Response('old edition'));},{cacheName,book});
    await page.reload();await expect(page.locator('[data-read-offline-status]')).toContainText('not fully saved');
  });
});

test('real service worker serves the saved complete book with no connection',async({page,context})=>{
  test.setTimeout(60000);
  await page.goto(book);await page.getByRole('button',{name:'Save this book for offline',exact:true}).click();
  await expect(page.getByRole('button',{name:'Saved for offline',exact:true})).toBeDisabled({timeout:45000});
  await context.setOffline(true);await page.goto(book);
  for(const card of await page.locator('.story-page-card').all())await card.scrollIntoViewIfNeeded();
  await expect.poll(()=>page.locator('.story-page-card img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0))).toBe(true);
  await expect(page.locator('.story-page-card')).toHaveCount(4);
  await expect(page.locator('.story-second-question')).toHaveText('What did Luckybug learn about mistakes?');
  await page.goto('/read/corgi-on-the-cobs-countryside-run/');
  await expect(page.getByRole('heading',{name:'This book is not saved for offline',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'Back to the bookshelf',exact:true})).toHaveAttribute('href','/read/');
  await context.setOffline(false);await page.goto('/read/');
  await page.getByRole('button',{name:'Save all '+manifest.books+' books for offline',exact:true}).click();
  await expect(page.getByRole('button',{name:'Saved for offline',exact:true})).toBeDisabled({timeout:45000});
  await expect(page.locator('[data-read-offline-status]')).toContainText('All '+manifest.books+' complete books');
  await page.evaluate(async cacheName=>{await(await caches.open(cacheName)).put('/play/test-preserved/',new Response('game'));},cacheName);
  await context.setOffline(true);await page.goto('/read/corgi-on-the-cobs-countryside-run/');
  for(const card of await page.locator('.story-page-card').all())await card.scrollIntoViewIfNeeded();
  await expect.poll(()=>page.locator('.story-page-card img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0))).toBe(true);
  await page.goto('/read/');await page.getByRole('button',{name:'Remove saved bookshelf',exact:true}).click();
  await expect(page.locator('[data-read-offline-status]')).toContainText('0 of '+manifest.books+' complete books');
  expect(await page.evaluate(async cacheName=>!!await(await caches.open(cacheName)).match('/play/test-preserved/'),cacheName)).toBe(true);
});

test('keyboard respects controls and modifiers, announces pages and restores focus',async({page})=>{
  await page.goto('/read/ted-e-bears-blanket-fort/');
  const entry=page.getByRole('button',{name:'One page at a time',exact:true});await entry.click();
  const label=page.locator('.reader-bar-label');await expect(label).toHaveAttribute('aria-live','polite');
  await page.getByRole('button',{name:'Use larger story text'}).last().focus();await page.keyboard.press('ArrowRight');await expect(label).toHaveText('Page 1 of 4');
  await page.locator('.story-page-card.is-current').evaluate(el=>{el.tabIndex=-1;el.focus();});
  await page.keyboard.press('Control+ArrowRight');await expect(label).toHaveText('Page 1 of 4');
  await page.keyboard.press('ArrowRight');await expect(label).toHaveText('Page 2 of 4');
  await expect(page.locator('.reader-bar').getByRole('button',{name:'Next',exact:true})).toBeFocused();
  await page.keyboard.press('ArrowRight');await expect(label).toHaveText('Page 3 of 4');
  await page.keyboard.press('Escape');await expect(entry).toBeFocused();
  await entry.click();while(await label.textContent()!=='Page 4 of 4')await page.locator('.reader-bar').getByRole('button',{name:'Next',exact:true}).click();
  await page.locator('.reader-bar').getByRole('button',{name:'The end',exact:true}).click();
  await expect(page.locator('.story-finish-card')).toBeFocused();
});

test('phone shelf keeps every complete thumbnail inside its frame',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/read/');
  for(const card of await page.locator('.read-library-card').all()){
    await card.scrollIntoViewIfNeeded();
    await expect.poll(()=>card.locator('img').evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
    const view=await card.locator('img').evaluate(i=>{const r=i.getBoundingClientRect(),p=i.closest('picture').getBoundingClientRect();return {fit:getComputedStyle(i).objectFit,inside:r.left>=p.left-1&&r.right<=p.right+1};});
    expect(view).toEqual({fit:'contain',inside:true});
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('both app questions have collapsed answers and printable details',async({page})=>{
  await page.goto(book);
  const finish=page.locator('.story-finish-card');await expect(finish.locator('details')).toHaveCount(2);
  for(const d of await finish.locator('details').all())await expect(d).not.toHaveAttribute('open','');
  await expect(page.locator('.read-print-info')).toContainText('5 printed pages');
  await expect(page.getByRole('link',{name:'Open PDF to print',exact:true})).toHaveAttribute('href','./luckybugs-art-gallery.pdf');
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
});
