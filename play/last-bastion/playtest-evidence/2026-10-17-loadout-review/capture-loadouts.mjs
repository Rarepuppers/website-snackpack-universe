import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
const output = 'play/last-bastion/playtest-evidence/2026-10-17-loadout-review';
mkdirSync(output, { recursive: true });
const sourceCommit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
const build = readFileSync('play/last-bastion/dev/src/game/run/RunSummary.ts', 'utf8').match(/LAST_BASTION_BUILD_VERSION\s*=\s*"([^"]+)"/)[1];
const port = 44189;
const server = spawn(process.execPath, ['scripts/serve-static.mjs'], { cwd: process.cwd(), env: {...process.env, PORT: String(port)}, stdio: 'ignore' });
let browser;
const cases = [
  {id:'marine-single',hero:'marine',loadout:'bastion-service-rifle',width:1920,height:1080},
  {id:'medic-three',hero:'medic',loadout:'injector-carbine,arc-carbine,bolt-carbine',width:1920,height:1080},
  {id:'marine-four',hero:'marine',loadout:'arc-carbine,bastion-service-rifle,bulwark-rotary-cannon,grenade-tube',width:1920,height:1080},
  {id:'assault-four',hero:'assault',loadout:'marauder-ar,bolt-carbine,scattergun,patrol-blade',width:1920,height:1080},
  {id:'marine-four-4k',hero:'marine',loadout:'arc-carbine,bastion-service-rifle,bulwark-rotary-cannon,grenade-tube',width:3840,height:2160},
];
try {
  for(let i=0;i<80;i++) {try {if((await fetch(`http://127.0.0.1:${port}/play/last-bastion/`)).ok) break;}catch{} if(i===79)throw Error('Server unavailable'); await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch();
  for(const item of cases.filter(item => !process.argv[2] || item.id === process.argv[2])) {
    const context=await browser.newContext({viewport:{width:item.width,height:item.height},deviceScaleFactor:1});
    const page=await context.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    const route=`/play/last-bastion/?screen=game&scenario=weapon-review&theme=bastion-standard&seed=61061&hero=${item.hero}${item.hero === 'assault' ? '&art=c3' : ''}&loadout=${item.loadout}&sound=0`;
    await page.goto(`http://127.0.0.1:${port}${route}`);
    await page.waitForFunction(()=>window.__combatAccessibilityAudit!==undefined);
    await page.mouse.move(item.width*.75,item.height*.4);
    const initial=await page.evaluate(()=>window.__combatAccessibilityAudit.playerPosition);
    await page.keyboard.down('d'); await page.waitForTimeout(1200); await page.keyboard.up('d');
    await page.keyboard.down('w'); await page.waitForTimeout(1200); await page.keyboard.up('w');
    const final=await page.evaluate(()=>window.__combatAccessibilityAudit.playerPosition);
    if(Math.hypot(final.x-initial.x,final.y-initial.y)<.1)throw Error('No movement');
    if(errors.length)throw Error(errors.join('\n'));
    await page.screenshot({path:`${output}/${item.id}.png`});
    writeFileSync(`${output}/${item.id}.json`,JSON.stringify({...item,route,initial,final,errors,sourceCommit,build,evidence:'2.4-second isolated keyboard-driven weapon lab; legal base-rack classes, not an earned campaign or human acceptance'},null,2)+'\n');
    console.log(`Captured ${item.id}`); await context.close();
  }
} finally {await browser?.close(); server.kill();}
