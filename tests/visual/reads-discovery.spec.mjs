import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {nextChoices} from '../../scripts/lib/read-recommendations.mjs';
const manifest=JSON.parse(fs.readFileSync(new URL('../../read/offline-manifest.json',import.meta.url)));
const entry=manifest.bookFiles.find(b=>b.slug==='pork-uleles-picnic-song');
const name=fs.readFileSync(new URL('../../sw.js',import.meta.url),'utf8').match(/const CACHE = "([^"]+)"/)[1];
const card=p=>p.locator('.read-library-card[href="./'+entry.slug+'/"]');
test.describe('saved shelf discovery',()=>{
 test.use({serviceWorkers:'block'});
 test.beforeEach(async({page})=>{await page.addInitScript(()=>Object.defineProperty(navigator,'serviceWorker',{value:{controller:null,ready:Promise.resolve({}),register:()=>Promise.resolve({}),addEventListener(){}}}));});
 test('save, combined filtering, removal and cached game preservation',async({page})=>{
  await page.goto('/read/'+entry.slug+'/');await page.evaluate(name=>caches.open(name),name);
  await page.getByRole('button',{name:'Save this book for offline',exact:true}).click();
  await expect(page.getByRole('button',{name:'Saved for offline',exact:true})).toBeDisabled({timeout:30000});
  await page.evaluate(async name=>{const c=await caches.open(name);await c.put('/play/discovery-preserved/',new Response('game'));},name);
  await page.goto('/read/?saved=1&type=stories&age=5-6&q=pork');
  await expect(page.locator('.read-library-card:visible')).toHaveCount(1);
  await expect(card(page).locator('[data-saved-label]')).toHaveText('Saved on this device');
  await expect(page.locator('[data-filter-status]')).toContainText('depend on this device');
  await card(page).click();await page.getByRole('button',{name:'Remove saved book',exact:true}).click();
  await expect(page.locator('[data-read-offline-status]')).toContainText('removed');
  await page.goto('/read/?saved=1');await expect(page.locator('.read-library-card:visible')).toHaveCount(0);
  await expect(page.locator('[data-filter-empty]')).toBeVisible();
  expect(await page.evaluate(async name=>!!await(await caches.open(name)).match('/play/discovery-preserved/'),name)).toBe(true);
  await page.getByRole('button',{name:'Show every book',exact:true}).click();await expect(page.locator('.read-library-card:visible')).toHaveCount(manifest.books);
 });
 for(const defect of ['image','stale HTML'])test(defect+' eviction removes saved claim on shelf return',async({page})=>{
  await page.goto('/read/');
  await page.evaluate(async({entry,shared,name})=>{const c=await caches.open(name);for(const u of [...shared,...entry.urls])await c.add(u);},{entry,shared:manifest.shared,name});
  await page.reload();await expect(card(page)).toHaveAttribute('data-saved-state','saved');
  await page.evaluate(async({entry,name,defect})=>{const c=await caches.open(name);if(defect==='image')await c.delete(entry.urls[1]);else await c.put(entry.urls[0],new Response('outdated HTML'));},{entry,name,defect});
  await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));
  await expect(card(page)).toHaveAttribute('data-saved-state','incomplete');
  await page.getByRole('button',{name:'Saved on this device',exact:true}).click();await expect(page.locator('.read-library-card:visible')).toHaveCount(0);
 });
 test('blocked Cache API permits browsing, reset and book navigation',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(window,'caches',{value:{keys:()=>Promise.reject(Error('blocked'))}}));
  await page.goto('/read/?saved=1');await expect(page.locator('[data-read-offline-status]')).toContainText('unavailable');
  await page.getByRole('button',{name:'Show every book',exact:true}).click();await expect(page.locator('.read-library-card:visible')).toHaveCount(manifest.books);
  await expect(card(page).locator('[data-saved-label]')).toHaveText('Saved status unavailable');await card(page).click();await expect(page.locator('#page-1')).toBeVisible();
 });
});
test('stage preparation preserves audited exceptions and Trail support',async({page})=>{
 for(const [slug,tricky,bridge] of [['pip-sits','a, is, the','sits, taps, tips, naps'],['nan-and-pip','a, and','pats, taps'],['ten-red-hens','a, is, the','hens, naps'],['the-cat-and-the-rat','a, is, the','none'],['bug-in-a-cup','a, to, the','spot'],['dog-in-the-fog','a, is, to, the','spot']]){
  await page.goto('/read/'+slug+'/');const prep=page.locator('.read-preparation');await expect(prep).toContainText('Prepare tricky words: '+tricky);await expect(prep).toContainText('Words needing an extra skill: '+bridge);
  expect(await prep.evaluate(e=>e.compareDocumentPosition(document.querySelector('a[href="#page-1"]'))&Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy();
 }
 await page.goto('/read/hen-berrys-digraph-dash/');await expect(page.locator('.read-preparation')).toContainText('not a controlled independent decodable stage');
 await page.goto('/read/');await expect(page.locator('#stage-1')).not.toContainText('Every word uses only');await expect(page.locator('#stage-2')).not.toContainText('sound out alone');
});
test('recommendations avoid quiet-pair trap and preserve stage progression',()=>{
 const shelf=[{slug:'a',group:'stage-1'},{slug:'b',group:'stage-2'},{slug:'c',group:'stage-3'},{slug:'t',group:'trail'},{slug:'quiet1',group:'short'},{slug:'quiet2',group:'short'},{slug:'numbers',group:'numbers'}];
 const collections=[{id:'bedtime',books:['quiet1','quiet2']}];
 expect(nextChoices(shelf,'quiet1',collections).map(x=>x.book.slug)).toEqual(['quiet2','numbers']);
 expect(nextChoices(shelf,'quiet2',collections).map(x=>x.book.slug)).toEqual(['quiet1','numbers']);
 expect(nextChoices(shelf,'a')[0]).toMatchObject({book:{slug:'b'},label:'Next phonics stage · when ready'});
 expect(nextChoices(shelf,'c')[0].label).toContain('Reading Trail practice');
 expect(nextChoices(shelf,'t').every(x=>!/^stage-/.test(x.book.group))).toBe(true);
 expect(nextChoices([{slug:'x'},{slug:'y'}],'x').map(x=>x.book.slug)).toEqual(['y']);
 expect(nextChoices([{slug:'x'}],'x')).toEqual([]);expect(nextChoices(shelf,'missing')).toEqual([]);
});
test('homepage features six shelf groups with full images and usable phone/zoom layout',async({page})=>{
 for(const width of [320,390,1280]){
  await page.setViewportSize({width,height:900});await page.goto('/');const grid=page.locator('.storybook-grid');await grid.scrollIntoViewIfNeeded();
  await expect(grid.locator('a')).toHaveCount(6);
  const links=await grid.locator('a').evaluateAll(xs=>xs.map(a=>a.getAttribute('href')));
  expect(links).toEqual(['/read/pip-sits/','/read/hen-berrys-digraph-dash/','/read/panda-cake-discovers-her-abcs/','/read/luckybugs-art-gallery/','/read/panda-cakes-market-basket/','/read/animal-architects/']);
  for(const a of await grid.locator('a').all()){await a.focus();await expect(a).toBeFocused();await expect.poll(()=>a.locator('img').evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);expect(await a.locator('img').evaluate(i=>getComputedStyle(i).objectFit)).toBe('contain');}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.evaluate(()=>document.documentElement.style.zoom='2');expect(await grid.evaluate(g=>[...g.querySelectorAll('a')].every(a=>a.getBoundingClientRect().right<=innerWidth+1))).toBe(true);
 }
});
test('new complete books and saved-only shelf work disconnected with a real worker',async({page,context})=>{
 test.setTimeout(60000);
 for(const slug of ['pork-uleles-picnic-song','captain-beakons-air-show']){
  await page.goto('/read/'+slug+'/');await page.getByRole('button',{name:'Save this book for offline',exact:true}).click();
  await expect(page.getByRole('button',{name:'Saved for offline',exact:true})).toBeDisabled({timeout:45000});
 }
 await context.setOffline(true);await page.goto('/read/?saved=1&type=stories');
 await expect(page.locator('.read-library-card:visible')).toHaveCount(2);
 for(const slug of ['pork-uleles-picnic-song','captain-beakons-air-show']){
  await page.goto('/read/'+slug+'/');for(const card of await page.locator('.story-page-card').all())await card.scrollIntoViewIfNeeded();
  await expect.poll(()=>page.locator('.story-page-card img').evaluateAll(xs=>xs.length===4&&xs.every(i=>i.complete&&i.naturalWidth>0))).toBe(true);
  await expect(page.locator('.story-finish-card details')).toHaveCount(2);
 }
});
