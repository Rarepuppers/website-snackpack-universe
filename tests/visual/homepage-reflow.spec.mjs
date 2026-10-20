import {test,expect} from '@playwright/test';

for(const theme of ['cream','dark','light'])for(const width of [320,390,1280])for(const zoom of [1,2]){
 test(`homepage reflows ${width}px at ${zoom*100}% in ${theme}`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.addInitScript(theme=>localStorage.setItem('snackpack.theme.v1',theme),theme);
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await page.evaluate(zoom=>document.documentElement.style.zoom=String(zoom),zoom);
  await page.evaluate(()=>document.fonts.ready);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  // Check actual text/control boxes, including those inside overflow:hidden cards.
  const clipped=await page.locator('main h1,main h2,main h3,main p,main .eyebrow,.storybook-card strong,.featured-actions,.featured-qr,.sib-optin label,main button').evaluateAll(nodes=>nodes.filter(e=>e.clientWidth&&e.scrollWidth>e.clientWidth+2).map(e=>({tag:e.tagName,text:e.textContent.trim().slice(0,60),client:e.clientWidth,scroll:e.scrollWidth})));
  expect(clipped).toEqual([]);
  for(const target of ['.hero-actions a','.featured-actions a','.free-web-card a','#sib-container button','.sib-optin a']){
   for(const link of await page.locator(target).all()){
    await link.focus();await expect(link).toBeFocused();
    expect(await link.evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1;})).toBe(true);
   }
  }
  const consent=page.locator('#GDPR_CONSENT');await consent.check();await expect(consent).toBeChecked();await consent.uncheck();
  // The compact navigation intentionally scrolls; keyboard focus must reveal each link.
  for(const link of await page.locator('.topbar nav a').all()){
   await link.focus();await expect(link).toBeFocused();
   await expect.poll(()=>link.evaluate(e=>{const r=e.getBoundingClientRect(),n=e.closest('nav').getBoundingClientRect();return r.left>=n.left-1&&r.right<=n.right+1;})).toBe(true);
  }
 });
}

test('homepage text enlargement and newsletter errors remain within the page',async({page})=>{
 await page.setViewportSize({width:320,height:900});await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>document.documentElement.style.fontSize='200%');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.locator('#sib-form button[type=submit]').click();
 await expect(page.locator('.sib-input .entry__error')).toContainText('email');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
