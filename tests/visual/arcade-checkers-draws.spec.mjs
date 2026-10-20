import { test, expect } from '@playwright/test';

test('checkers: repetition survives reload and undo without recording a loss', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('ck_draw_fixture')) return;
    localStorage.setItem('ck_draw_fixture','1');
    localStorage.setItem('sp_checkers_players','2');
    const board=Array(64).fill(0);board[56]=2;board[7]=-2;
    localStorage.setItem('sp_checkers_save_local',JSON.stringify({
      schemaVersion:1,gameVersion:1,variant:'local',updatedAt:Date.now(),
      payload:{board,currentSide:1,undoStack:[]}
    }));
  });
  const move=async (from,to)=>{
    await page.locator(`#ck-board .ck-sq[data-i="${from}"]`).click();
    await page.locator(`#ck-board .ck-sq.move[data-i="${to}"]`).click();
  };
  await page.goto('/play/checkers/');
  await page.locator('.sp-resume [data-resume]').click();
  const cycle=[[56,49],[7,14],[49,56],[14,7]];
  for(const [from,to] of cycle)await move(from,to);
  await page.waitForTimeout(700);
  await page.reload();
  await page.locator('.sp-resume [data-resume]').click();
  for(const [from,to] of cycle)await move(from,to);
  await expect(page.locator('#ck-status')).toContainText('Draw');
  await expect(page.locator('#ck-record')).toHaveText('0–0');
  await page.locator('#ck-undo').click();
  await expect(page.locator('#ck-status')).toContainText("Player 2's turn");
  await move(14,7);
  await expect(page.locator('#ck-status')).toContainText('Draw');
  await expect(page.locator('#ck-record')).toHaveText('0–0');
});
