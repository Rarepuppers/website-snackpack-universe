import { test, expect } from '@playwright/test';
import { openOptions } from './helpers/options.mjs';
async function savedGame(page, mode) {
  await page.clock.install();
  await page.addInitScript(mode => {
    localStorage.setItem('sp_snakes_and_ladders_mode', mode);
    const players = Array.from({length: mode === '4p' ? 4 : 2}, (_, id) => ({id, name: id === 0 ? 'You' : mode === '2p' ? 'Player 2' : `CPU ${id}`, pos: id === 0 ? 98 : 0, isHuman: id === 0 || mode === '2p'}));
    localStorage.setItem(`sp_snakes_and_ladders_save_${mode}`, JSON.stringify({schemaVersion:1,gameVersion:1,variant:mode,updatedAt:Date.now(),payload:{players,current:0,snakes:{97:78},ladders:{}}}));
  }, mode);
  await page.goto('/play/snakes-and-ladders/'); await page.clock.runFor(10);
  await page.getByRole('button',{name:'Resume game',exact:true}).click();
}
const pos = page => page.locator('.sl-ppos').first();
async function roll(page,dice) {
  await page.evaluate(d=>{Math.random=()=>(d-.5)/6;},dice);
  await page.locator('#s-roll').click(); await page.clock.runFor(480);
}
for(const mode of ['classic','2p','4p','chaos']) test(`${mode}: full reflected path and final-only snake`,async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await savedGame(page,mode);await roll(page,5);
  for(const square of [99,100,99,98,97]) {await page.clock.runFor(95);await expect(pos(page)).toHaveText(`Square ${square}`);await expect(page.locator('#s-wins')).toHaveText('0');}
  await page.clock.runFor(455);await expect(pos(page)).toHaveText('Square 78');if(mode==='2p')await expect(page.locator('#s-status')).toContainText('Snake!');await expect(page.locator('#s-turn')).toHaveText(mode==='2p'?'Player 2':'CPU 1');expect(errors).toEqual([]);
});
test('same-start bounce animates and yields once',async({page})=>{
  await savedGame(page,'2p');await roll(page,4);for(const square of [99,100,99,98]){await page.clock.runFor(95);await expect(pos(page)).toHaveText(`Square ${square}`);}await page.clock.runFor(125);await expect(page.locator('#s-turn')).toHaveText('Player 2');await expect(page.locator('#s-roll')).toBeEnabled();
});
test('exact landing wins once',async({page})=>{
  await savedGame(page,'2p');await roll(page,2);await page.clock.runFor(95);await expect(pos(page)).toHaveText('Square 99');await expect(page.locator('#s-wins')).toHaveText('0');await page.clock.runFor(220);await expect(page.locator('#s-wins')).toHaveText('1');await page.clock.runFor(2000);await expect(page.locator('#s-wins')).toHaveText('1');
});
for(const stage of ['dice','move','landing'])test(`New during ${stage} cancels callbacks`,async({page})=>{
  await savedGame(page,'2p');await page.evaluate(()=>{Math.random=()=>.75;});await page.locator('#s-roll').click();await page.clock.runFor(stage==='dice'?120:stage==='move'?575:1050);await page.locator('#s-new').click();await page.clock.runFor(3000);await expect(page.locator('.sl-token')).toHaveCount(0);await expect(pos(page)).toHaveText('Square 0');await expect(page.locator('#s-turn')).toHaveText('You');await expect(page.locator('#s-roll')).toBeEnabled();await expect(page.locator('#s-wins')).toHaveText('0');
});
test('mode change retires pending CPU',async({page})=>{
  await savedGame(page,'classic');await roll(page,4);await page.clock.runFor(505);await openOptions(page);await page.locator('.seg [data-mode="2p"]').click();await page.clock.runFor(3000);await expect(page.locator('.sl-token')).toHaveCount(0);await expect(page.locator('#s-turn')).toHaveText('You');await expect(page.locator('#s-roll')).toBeEnabled();
});
