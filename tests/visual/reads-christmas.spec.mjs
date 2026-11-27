import fs from 'node:fs';
import {test,expect} from '@playwright/test';
import {READ_EVENTS} from '../../scripts/lib/read-events.mjs';
const christmasEvent = READ_EVENTS.find(({id}) => id === 'christmas');
const webOriginals=JSON.parse(fs.readFileSync(new URL('../../data/web-originals.json',import.meta.url),'utf8'));
const sledge = ['biscuit-bouncer-and-the-great-sledge-race','Biscuit-Bouncer and the Great Sledge Race',26,'Ages 6–8 · Read together'];
const star = ['the-star-that-fell-on-the-longest-night','The Star That Fell on the Longest Night',28,'Ages 6–9 · Read together'];
const books=[
 ['nutmeg-and-the-tree-that-wouldnt-come','Tree That',24],
 ['vincent-van-mouse-and-the-christmas-shadow-show','Christmas Shadow',24],
 ['one-more-story-before-santa','One More Story Before Santa',24,'Ages 5–7 · Read together'],
 ['the-last-parcel-under-the-tree','The Last Parcel Under the Tree',26,'Ages 7–9 · Newly independent'],
 ['sub-zero-and-the-great-snowball-truce','Great Snowball Truce',24,'Ages 5–7 · Read together'],
 ['captain-beakon-and-the-bell-across-the-bay','Bell Across the Bay',44,'Ages 12–14 · Independent reading'],
];
books.push(...[
 ['the-angel-on-the-small-tree','The Angel on the Small Tree',24,'Ages 5–7 · Read together'],
 sledge,
 star,
].filter(([slug])=>Object.hasOwn(webOriginals,slug)));
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
 await expect(page.locator(`.read-library-card[href="./${slug}/"]`)).toBeVisible();
});

for(const [[slug,title],matchingAges] of [[sledge,['5-6','7-8']],[star,['5-6','7-8','9-10']]]){
 if(!Object.hasOwn(webOriginals,slug)) continue;
 test(`${title} appears in the age filters and has a colouring PDF`,async({page})=>{
   await page.goto('/read/?q='+encodeURIComponent(title));
   const card=page.locator(`.read-library-card[href="./${slug}/"]`);
   for(const age of matchingAges){
     await page.locator(`[data-filter-age="${age}"]`).click();
     await expect(card).toBeVisible();
   }
   await page.locator('[data-filter-age="11-12"]').click();
   await expect(card).toBeHidden();
   await page.goto('/read/events/christmas/');
   const printable=page.getByRole('link',{name:`Colour ${title}`,exact:true});
   const href=await printable.getAttribute('href');
   const download=await page.request.get(new URL(href,page.url()).href);
   expect(download.ok()).toBe(true);
   expect((await download.body()).subarray(0,5).toString()).toBe('%PDF-');
 });
}

if(Object.hasOwn(webOriginals,star[0])){
 test('the longest night features the Star and both books link to each other',async({page})=>{
   await page.clock.setFixedTime(new Date(2026,11,21,12));
   await page.goto('/read/events/christmas/');
   const pick=page.locator('[data-tonight]:visible');
   await expect(pick).toContainText('Longest night pick');
   await expect(pick).toContainText(star[1]);
   const advent='twenty-four-letters-before-christmas';
   for(const [from,to] of [[advent,star[0]],[star[0],advent]]){
     await page.goto(`/read/${from}/`);
     await expect(page.locator(`.story-finish-card a[href*="${to}"]`)).toHaveCount(1);
   }
 });
}

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

test('the Christmas event page follows the published reading order and books link back to it',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/read/events/christmas/');
 const woodland=page.locator('ol.read-event-books h3 a');
 await expect(woodland).toHaveCount(christmasEvent.timeline.length);
 expect(await woodland.evaluateAll(links=>links.map(link=>link.getAttribute('href')))).toEqual(
   christmasEvent.timeline.map(({slug})=>`../../${slug}/`),
 );
 await expect(page.locator('[data-tonight]:visible')).toHaveCount(1);
 await page.goto('/read/events/');
 await expect(page.locator('a.read-event-card[data-read-event="christmas"]')).toHaveCount(1);
 await expect(page.locator('.read-event-card')).toHaveCount(5);
 await page.goto('/read/one-more-story-before-santa/');
 await page.locator('.read-event-chip a').click();
 await expect(page).toHaveURL(/\/read\/events\/christmas\/$/);
 expect(errors).toEqual([]);
});

for(const [timezoneId,midnight] of [
 ['Pacific/Auckland','2026-12-24T10:59:55Z'],
 ['Australia/Sydney','2026-12-24T12:59:55Z'],
])test.describe(`Christmas reading picks in ${timezoneId}`,()=>{
 test.use({timezoneId});

 test('Christmas Eve changes to the Christmas Day pick at local midnight',async({page})=>{
   const beforeMidnight=new Date(midnight);
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

const bark = {
 slug:'bark-b-q-and-the-long-christmas-table', title:'Bark-B-Q and the Long Christmas Table',
 pages:32, age:'8-11', matchingAges:['7-8','9-10','11-12'], otherAge:'5-6',
};
const foxy = {
 slug:'foxy-lox-and-the-postcard-present', title:'Foxy-Lox and the Postcard Present',
 pages:16, age:'7-9', matchingAges:['7-8','9-10'], otherAge:'11-12',
};
const summerBooks=[bark,foxy].filter(({slug})=>Object.hasOwn(webOriginals,slug));
const christmas='/read/events/christmas/';
const reader=({slug})=>`/read/${slug}/`;

test('Summer Christmas discovery reflects the released web originals',async({page})=>{
 await page.goto(christmas);
 const group=page.getByRole('region',{name:'Summer Christmas',exact:true});
 const guide=page.getByRole('region',{name:'Christmas reading guide'});
 const guideLink=guide.getByRole('link',{name:/Browse Summer Christmas stories/});
 const jsonLd=await page.locator('script[type="application/ld+json"]').first().textContent();
 expect(JSON.parse(jsonLd).mainEntity.numberOfItems).toBe(christmasEvent.timeline.length+summerBooks.length);
 await expect(group).toHaveCount(Number(summerBooks.length>0));
 await expect(guideLink).toHaveCount(Number(summerBooks.length>0));
 if(summerBooks.length){
   await guideLink.click();
   await expect(page).toHaveURL(/#summer-christmas$/);
   await expect(group.getByRole('heading',{level:3})).toHaveText(summerBooks.map(({title})=>title));
   for(const book of summerBooks){
     const entry=group.locator('li').filter({has:page.getByRole('heading',{name:book.title,exact:true})});
     const pdfLink=entry.getByRole('link',{name:'PDF',exact:true});
     const href=`${reader(book)}${book.slug}.pdf`;
     await expect(pdfLink).toHaveAttribute('href',`../../${book.slug}/${book.slug}.pdf`);
     const response=await page.request.get(href);
     expect(response.ok()).toBe(true);
     expect((await response.body()).subarray(0,5).toString()).toBe('%PDF-');
     await expect(entry.getByRole('link',{name:book.title,exact:true})).toHaveAttribute('href',`../../${book.slug}/`);
   }
 }
 await page.goto('/read/');
 const shelf=page.locator('#summer-christmas');
 await expect(shelf).toHaveCount(Number(summerBooks.length>0));
 await expect(shelf.locator('.read-library-card')).toHaveCount(summerBooks.length);
 if(summerBooks.length){
   await shelf.getByRole('link',{name:'Browse Summer Christmas'}).click();
   await expect(page).toHaveURL(/\/read\/events\/christmas\/#summer-christmas$/);
 }
});

for(const book of summerBooks){
 test(`${book.title}: Stories, ages and title search`,async({page})=>{
   await page.goto('/read/');
   const filters=page.locator('.read-filters');
   const card=page.locator(`#summer-christmas .read-library-card[href="./${book.slug}/"]`);
   await expect(card).toHaveAttribute('data-kind','stories');
   await expect(card).toHaveAttribute('data-age',book.age);
   await filters.getByRole('button',{name:'Stories',exact:true}).click();
   for(const age of book.matchingAges){
     await filters.locator(`[data-filter-age="${age}"]`).click();
     await expect(card).toBeVisible();
   }
   await filters.locator(`[data-filter-age="${book.otherAge}"]`).click();
   await expect(card).toBeHidden();
   await filters.locator(`[data-filter-age="${book.matchingAges[0]}"]`).click();
   await filters.getByRole('searchbox',{name:'Find a book'}).fill(book.title);
   await expect(page.locator('.read-library-card:visible')).toHaveCount(1);
   await card.click();
   await expect(page).toHaveURL(new RegExp(`/read/${book.slug}/$`));
   await page.locator('.read-event-chip a').click();
   await expect(page).toHaveURL(/\/read\/events\/christmas\/#summer-christmas$/);
 });

 test.describe(`${book.title} with JavaScript disabled`,()=>{
   test.use({javaScriptEnabled:false,viewport:{width:320,height:700}});
   test('cover, story, PDF and character links are readable',async({page})=>{
     await page.goto(reader(book));
     const cover=page.locator('.story-title-section picture img');
     await expect(cover).toBeVisible();
     await expect(cover).toHaveAttribute('alt',/\S/);
     await page.getByRole('link',{name:'Begin the story'}).click();
     await expect(page).toHaveURL(/#page-1$/);
     const cards=page.locator('.story-page-card');
     await expect(cards).toHaveCount(book.pages);
     for(const card of await cards.all()){
       await expect(card.locator('.story-page-copy p').first()).toHaveText(/\S/);
       await expect(card.locator('picture img')).toHaveAttribute('alt',/\S/);
     }
     await expect(page.locator('.story-finish-card a[href$=".pdf"]')).toHaveAttribute('download','');
     const cast=page.locator('.story-cast a');
     expect(await cast.count()).toBeGreaterThan(0);
     for(const link of await cast.all()) expect((await page.request.get(await link.getAttribute('href'))).ok()).toBe(true);
     expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   });
 });

 test(`${book.title}: mobile reading position and offline page turns`,async({page,context})=>{
   test.setTimeout(90_000);
   await page.setViewportSize({width:390,height:844});
   const middle=Math.ceil(book.pages/2);
   await page.goto(`${reader(book)}#page-${middle}`);
   const mode=page.getByRole('button',{name:'One page at a time',exact:true});
   const turner=page.getByRole('navigation',{name:'Page turner'});
   const next=turner.getByRole('button',{name:'Next',exact:true});
   await mode.click();
   await expect(page.locator(`#page-${middle}`)).toBeVisible();
   await expect(next).toBeFocused();
   await next.press('ArrowRight');
   await expect(page.locator(`#page-${middle+1}`)).toBeVisible();
   await next.press('ArrowLeft');
   await expect(page.locator(`#page-${middle}`)).toBeVisible();
   await next.press('Escape');

   await page.goto(reader(book));
   await expect(page.getByRole('link',{name:`Resume at page ${middle}`})).toBeVisible();
   await page.getByRole('button',{name:'Save this book for offline',exact:true}).click();
   await expect(page.getByRole('button',{name:'Saved for offline',exact:true})).toBeDisabled({timeout:45_000});
   await context.setOffline(true);
   await page.reload();
   await expect(page.getByRole('heading',{name:book.title,exact:true})).toBeVisible();
   await mode.click();
   await expect(page.locator('#page-1')).toBeVisible();
   await next.click();
   await expect(page.locator('#page-2')).toBeVisible();
   await turner.getByRole('button',{name:'Back',exact:true}).click();
   await expect(page.locator('#page-1')).toBeVisible();
   await page.keyboard.press('Escape');
   await page.goto(`${reader(book)}#page-${book.pages}`);
   await mode.click();
   const last=page.locator(`#page-${book.pages} picture img`);
   await expect(last).toBeVisible();
   await expect.poll(()=>last.evaluate(img=>img.naturalWidth)).toBeGreaterThan(0);
   await turner.getByRole('button',{name:'The end',exact:true}).click();
   await expect(page.locator('.story-finish-card')).toBeFocused();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}

test('Bark-B-Q recommends the next Summer Christmas story only after Foxy-Lox is released',async({page})=>{
 test.skip(!summerBooks.includes(bark),'Bark-B-Q has no released reader');
 await page.goto(reader(bark));
 const next=page.locator('.story-next').filter({hasText:'Next Summer Christmas story'});
 if(summerBooks.includes(foxy)){
   await expect(next.getByRole('link',{name:foxy.title})).toHaveAttribute('href',`../${foxy.slug}/`);
 }else{
   await expect(next).toHaveCount(0);
   await expect(page.locator(`.story-finish-card a[href="../${foxy.slug}/"]`)).toHaveCount(0);
 }
 await expect(page.locator('.story-finish-card .story-event-link a')).toHaveAttribute('href',`${christmas}#summer-christmas`);
});

const parcel = 'dough-mino-and-the-parcel-mix-up';
const villageBook = 'the-great-christmas-un-robbery';

for (const [slug, title, matchingAges, excludedAge] of [
  [parcel, 'Dough Mino and the Parcel Mix-Up', ['7-8', '9-10', '11-12'], '5-6'],
  [villageBook, 'The Great Christmas Un-Robbery', ['9-10', '11-12'], '7-8'],
]) {
 if (!Object.hasOwn(webOriginals, slug)) continue;
 test(`${title} is discoverable in its older-reader age bands`, async ({page}) => {
   await page.goto('/read/?q='+encodeURIComponent(title));
   const card = page.locator(`.read-library-card[href="./${slug}/"]`);
   for (const age of matchingAges) {
     await page.locator(`[data-filter-age="${age}"]`).click();
     await expect(card).toBeVisible();
   }
   await page.locator(`[data-filter-age="${excludedAge}"]`).click();
   await expect(card).toBeHidden();
 });
}

if (Object.hasOwn(webOriginals, parcel)) {
 test('Dough Mino’s end card and Christmas share the Parcel Puzzle PDF', async ({page}) => {
   await page.goto(`/read/${parcel}/`);
   const href = '/read/events/christmas/parcel-puzzle.pdf';
   const link = page.locator('.story-finish-card').getByRole('link', {name:'Parcel Puzzle activity sheet'});
   await expect(link).toHaveAttribute('href', href);
   await expect(link).toHaveAttribute('download', '');
   await page.goto(christmas);
   await expect(page.getByRole('link', {name:'Parcel Puzzle activity sheet'})).toHaveAttribute('href', href);
   const response = await page.request.get(href);
   expect(response.ok()).toBe(true);
   expect((await response.body()).subarray(0,5).toString()).toBe('%PDF-');
 });
}

if (Object.hasOwn(webOriginals, villageBook)) {
 test('the village book recommends only released stories it calls back to', async ({page}) => {
   const related = [
     'nutmeg-and-the-tree-that-wouldnt-come',
     'vincent-van-mouse-and-the-christmas-shadow-show',
     'sub-zero-and-the-great-snowball-truce',
     'corgi-on-the-cob-and-the-harvest-table',
     'shelly-pop-and-the-runaway-pumpkin',
     'snack-spector-and-the-vanishing-thank-yous',
     'biscuit-bouncer-and-the-great-sledge-race',
   ].filter(slug => Object.hasOwn(webOriginals, slug));
   await page.goto(`/read/${villageBook}/`);
   const endCard = page.locator('.story-finish-card');
   const links = endCard.locator('.story-next-link');
   await expect(links).toHaveCount(related.length);
   expect(await links.evaluateAll(elements => elements.map(link => link.getAttribute('href')))).toEqual(related.map(slug => `../${slug}/`));
   await expect(endCard.locator('.story-event-link a')).toHaveAttribute('href', christmas);
 });
}
