import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../../play/hearts/index.html',import.meta.url),'utf8');
// Execute the actual self-contained engine portion, stopping before DOM wiring.
const engine=html.slice(html.indexOf('  var SUIT_NAME'),html.indexOf('  // ════ UI'));
const context=vm.createContext({});vm.runInContext(engine,context);
const legal=(hand,trick,firstTrick=true)=>JSON.parse(JSON.stringify(context.legalMoves({hands:[hand],trick,firstTrick,heartsBroken:false},0)));
test('first-trick legal fallback agrees with visible help and FAQ metadata',async({page})=>{
 const club={s:0,r:2},heart={s:3,r:7},queen={s:2,r:12},diamond={s:1,r:8};
 expect(legal([heart,queen,diamond],[{p:1,c:club}])).toEqual([diamond]);
 expect(legal([heart,queen],[{p:1,c:club}])).toEqual([heart,queen]);
 expect(legal([heart,club,diamond],[{p:1,c:{s:0,r:8}}])).toEqual([club]);
 expect(legal([heart,queen,diamond],[])).toEqual([queen,diamond]);
 expect(legal([heart,club,diamond],[])).toEqual([club]);
 expect(legal([heart],[])).toEqual([heart]);
 expect(legal([heart,queen,diamond],[{p:1,c:club}],false)).toEqual([heart,queen,diamond]);
 await page.goto('/play/hearts/');await page.getByText('Can I play points on the first trick?',{exact:true}).click();
 await expect(page.locator('.faq-item').filter({hasText:'Can I play points on the first trick?'})).toContainText('If every legal card has points, you must play one of them.');
 const faq=await page.locator('script[type="application/ld+json"]').allTextContents();expect(faq.join('\n')).toContain('If every legal card has points, you must play one of them.');expect(faq.join('\n')).not.toContain('No points may be played on the first trick.');
});
