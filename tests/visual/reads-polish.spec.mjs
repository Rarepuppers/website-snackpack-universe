import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const delivery=JSON.parse(fs.readFileSync(new URL('../../data/read-model-delivery.json',import.meta.url)));
for(const theme of ['cream','dark','light'])for(const width of [320,390,768,1280])for(const zoom of [1,2]){
 test(`reader controls stay reachable ${theme} ${width}px zoom ${zoom}`,async({page})=>{
  await page.setViewportSize({width,height:844});
  for(const slug of ['pip-sits','vincent-van-mouse-and-the-mural'])for(const font of [100,200]){
   await page.goto('/read/'+slug+'/');
   await page.evaluate(({theme,zoom,font})=>{document.documentElement.dataset.theme=theme;document.documentElement.style.zoom=String(zoom);document.documentElement.style.fontSize=font+'%'},{theme,zoom,font});
   const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('main *,footer *')].filter(e=>e.getBoundingClientRect().width&&e.getBoundingClientRect().right>innerWidth+2).map(e=>({tag:e.tagName,class:e.className,text:e.textContent.slice(0,50),right:Math.round(e.getBoundingClientRect().right)})).slice(0,10)}));
   expect(layout.scroll<=layout.width+2,JSON.stringify({slug,font,...layout})).toBe(true);
   await page.getByRole('button',{name:'One page at a time',exact:true}).click();
   await expect.poll(()=>page.locator('.reader-bar').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1})).toBe(true);
   for(const button of await page.locator('.reader-bar button:enabled').all()){
    await button.focus();await expect(button).toBeFocused();
    expect(await button.evaluate(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.left>=-1&&r.right<=innerWidth+1&&!!hit&&(hit===e||e.contains(hit))})).toBe(true);
   }
   await page.getByRole('button',{name:'Next',exact:true}).click();await expect(page.locator('.reader-bar-label')).toContainText('Page 2');
   await page.getByRole('button',{name:'Close one-page mode'}).click();await expect(page.getByRole('button',{name:'One page at a time',exact:true})).toBeFocused();
  }
 });
}
test('guide counts and audience wording agree across visible copy and metadata',async({page})=>{
 await page.goto('/guides/free-printable-decodable-readers/');await expect(page.locator('h1')).toContainText('Twelve');
 await expect(page.locator('main .lead').first()).toContainText('54-book');
 expect(await page.locator('meta[name="description"]').getAttribute('content')).toContain('54 free illustrated books');
 for(const path of ['/guides/','/guides/phonics-sound-order-satpin/','/guides/decodable-vs-levelled-readers/']){
  await page.goto(path);expect(await page.content()).not.toMatch(/Eight free printable readers|eight free staged readers|eight free readers to try|See all eight readers/);
 }
});
test('new models preserve exact instructions and load when the complete book is offline',async({page,context})=>{
 test.setTimeout(60000);
 for(const slug of ['hop-tarts-stepping-stone-switch','centi-peeds-below-zero-burrow']){
  await page.goto('/read/'+slug+'/');
  await expect(page.locator('.story-teaching-model')).toHaveCount(4);
  for(const r of delivery.filter(r=>r.slug===slug)){
   await expect(page.locator(`[data-model-id="${r.id}"] figcaption`)).toHaveText(r.model.instruction.replace(/-(?=\d)/g,'−'));
  }
  await page.getByRole('button',{name:'Save this book for offline',exact:true}).click();
  await expect(page.getByRole('button',{name:'Saved for offline',exact:true})).toBeDisabled({timeout:45000});
 }
 await context.setOffline(true);
 for(const slug of ['hop-tarts-stepping-stone-switch','centi-peeds-below-zero-burrow']){
  await page.goto('/read/'+slug+'/');
  for(const img of await page.locator('.story-teaching-model img').all()){
   await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
  }
 }
});
test('wider choices offer variety while keeping useful static labels',async({page})=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../../read/offline-manifest.json',import.meta.url)));
 const counts=new Map();
 for(const b of manifest.bookFiles){
  const html=fs.readFileSync(new URL(`../../read/${b.slug}/index.html`,import.meta.url),'utf8');
  const link=html.match(/Explore (?:another book|a number story) · read together<\/span><a[^>]*href="([^"]+)"/);
  if(link)counts.set(link[1],(counts.get(link[1])||0)+1);
 }
 expect(counts.size).toBeGreaterThan(8);expect(Math.max(...counts.values())).toBeLessThan(15);
 await page.goto('/read/?q=place%20value');expect(await page.locator('.read-library-card:visible').count()).toBeGreaterThan(0);
 await expect(page.locator('.read-library-card[href="./booklava-and-the-number-that-lost-its-place/"] .read-topic')).toContainText('Place Value');
});
