import {test,expect} from '@playwright/test';
const slugs=['nutmeg-and-the-tree-that-wouldnt-come','vincent-van-mouse-and-the-christmas-shadow-show'];
for(const slug of slugs)test(`${slug}: mobile reader, page turns and complete artwork`,async({page})=>{
 await page.setViewportSize({width:390,height:844});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/read/'+slug+'/');
 await expect(page.locator('.story-page-card')).toHaveCount(24);
 await page.getByRole('button',{name:'One page at a time',exact:true}).click();
 await expect(page.locator('#page-1')).toBeVisible();
 await page.locator('.reader-bar').getByRole('button',{name:'Next',exact:true}).click();
 await expect(page.locator('#page-2')).toBeVisible();
 await page.keyboard.press('Escape');
 const images=await page.locator('.story-page-card img').evaluateAll(imgs=>imgs.map(i=>i.src));
 for(const src of images){const response=await page.request.get(src);expect(response.status()).toBe(200);expect(response.headers()['content-type']).toContain('image');}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
 await page.goto('/read/?q='+encodeURIComponent(slug.startsWith('nutmeg')?'Tree That':'Christmas Shadow'));
 await expect(page.locator('.read-library-card:visible')).toHaveCount(1);
});
