import {test,expect} from '@playwright/test';
const books=[
 ['nutmeg-and-the-tree-that-wouldnt-come','Tree That',24],
 ['vincent-van-mouse-and-the-christmas-shadow-show','Christmas Shadow',24],
 ['one-more-story-before-santa','One More Story Before Santa',24,'Ages 5–7 · Read together'],
 ['the-last-parcel-under-the-tree','The Last Parcel Under the Tree',26,'Ages 7–9 · Newly independent'],
 ['sub-zero-and-the-great-snowball-truce','Great Snowball Truce',24,'Ages 5–7 · Read together'],
 ['captain-beakon-and-the-bell-across-the-bay','Bell Across the Bay',44,'Ages 12–14 · Independent reading'],
];
for(const [slug,query,storyPages,audience] of books)test(`${slug}: mobile reader, page turns and complete artwork`,async({page})=>{
 await page.setViewportSize({width:390,height:844});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/read/'+slug+'/');
 await expect(page.locator('.story-page-card')).toHaveCount(storyPages);
 if(audience) await expect(page.getByText(audience)).toBeVisible();
 if(slug==='one-more-story-before-santa'){
   await expect(page.locator('#page-1 .story-page-copy > p')).toHaveCount(2);
   await page.getByRole('button',{name:'Use larger story text'}).click();
   await expect(page.locator('html')).toHaveAttribute('data-read-text','larger');
 }
 await page.getByRole('button',{name:'One page at a time',exact:true}).click();
 await expect(page.locator('#page-1')).toBeVisible();
 await page.locator('.reader-bar').getByRole('button',{name:'Next',exact:true}).click();
 await expect(page.locator('#page-2')).toBeVisible();
 await page.keyboard.press('Escape');
 const images=await page.locator('.story-page-card img').evaluateAll(imgs=>imgs.map(i=>i.src));
 for(const src of images){const response=await page.request.get(src);expect(response.status()).toBe(200);expect(response.headers()['content-type']).toContain('image');}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
 await page.goto('/read/?q='+encodeURIComponent(query));
 await expect(page.locator('.read-library-card:visible')).toHaveCount(1);
});

test('the harbour mystery is discoverable by age and can open a chapter directly',async({page})=>{
 await page.goto('/read/?type=stories');
 await page.getByRole('button',{name:'13–14',exact:true}).click();
 await expect(page.locator('.read-library-card:visible')).toHaveCount(1);
 await page.locator('.read-library-card:visible').click();
 const chapters=page.getByRole('navigation',{name:'Chapters'});
 await expect(chapters.getByRole('link')).toHaveCount(7);
 await chapters.getByRole('link',{name:'The blue boathouse'}).click();
 await expect(page).toHaveURL(/#page-31$/);
 await expect(page.locator('#page-31').getByRole('heading')).toHaveText('The blue boathouse');
});

test('the Christmas event page lists the six books in reading order and books link back to it',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/read/events/christmas/');
 await expect(page.locator('.read-event-book')).toHaveCount(6);
 await expect(page.locator('.read-event-book h3').first()).toHaveText('Nutmeg and the Tree That Wouldn’t Come');
 await expect(page.locator('.read-event-book h3').last()).toHaveText('The Last Parcel Under the Tree');
 await expect(page.locator('[data-tonight]:visible')).toHaveCount(1);
 await page.goto('/read/events/');
 await expect(page.locator('a.read-event-card[data-read-event="christmas"]')).toHaveCount(1);
 await expect(page.locator('.read-event-card')).toHaveCount(5);
 await page.goto('/read/one-more-story-before-santa/');
 await page.locator('.read-event-chip a').click();
 await expect(page).toHaveURL(/\/read\/events\/christmas\/$/);
 expect(errors).toEqual([]);
});

test.describe('Christmas reading picks in Auckland',()=>{
 test.use({timezoneId:'Pacific/Auckland'});

 test('Christmas Eve changes to the Christmas Day pick at local midnight',async({page})=>{
   const beforeMidnight=new Date('2026-12-24T10:59:55Z');
   await page.clock.install({time:beforeMidnight});
   await page.clock.pauseAt(beforeMidnight);
   await page.goto('/read/events/christmas/');
   const pick=page.locator('[data-tonight]:visible');
   await expect(pick).toHaveCount(1);
   await expect(pick).toContainText('Christmas Eve pick');
   await expect(pick).toContainText('One More Story Before Santa');
   await page.clock.fastForward(6_000);
   await expect(pick).toHaveCount(1);
   await expect(pick).toContainText('Christmas Day pick');
   await expect(pick).toContainText('The Last Parcel Under the Tree');
 });

 test('ordinary days keep the rotation and both guide PDFs are downloadable',async({page})=>{
   await page.clock.setFixedTime(new Date('2026-12-26T05:00:00Z'));
   await page.setViewportSize({width:320,height:700});
   await page.goto('/read/events/christmas/');
   const pick=page.locator('[data-tonight]:visible');
   await expect(pick).toHaveCount(1);
   await expect(pick).toContainText('Read together tonight');
   const guide=page.getByRole('region',{name:'Christmas reading guide'});
   await expect(guide).toBeVisible();
   await expect(guide.getByRole('link',{name:'Captain Beakon and the Bell Across the Bay'})).toBeVisible();
   for(const size of ['A4','US Letter']){
     const href=await guide.getByRole('link',{name:new RegExp(size)}).getAttribute('href');
     const response=await page.request.get(new URL(href,page.url()).href);
     expect(response.ok()).toBe(true);
     expect((await response.body()).subarray(0,5).toString()).toBe('%PDF-');
   }
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
});
