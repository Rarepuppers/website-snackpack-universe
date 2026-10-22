import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const out = 'play/last-bastion/playtest-evidence/2026-10-22-audit-review';
const port = 44243, origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['scripts/serve-static.mjs'], {env:{...process.env, PORT:String(port)},stdio:'ignore'});
let browser;
try {
  for(let i=0;i<100;i++){try{if((await fetch(origin+'/play/last-bastion/')).ok)break;}catch{} await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch();
  const results=[];
  for(const [name,query,width,height] of [
    ['menu-small','?flow=menu',960,540],
    ['help-small','?flow=how-to-play',960,540],
    ['controls-small','?flow=controls',960,540],
    ['records-4k','?flow=records',3840,2160],
    ['hero-select','?flow=hero',1920,1080],
    ['map','?screen=map&mapseed=61061',1920,1080],
    ['baseline','?screen=game&hero=marine&theme=bastion-standard&seed=61061&sound=0',1920,1080],
    ['floor-kit','?screen=game&hero=marine&theme=bastion-standard&seed=61061&floorpilot=kit&sound=0',1920,1080],
    ['medic-gallery','?mode=gallery&hero=medic',1920,1080],
    ['assault-gallery','?mode=gallery&hero=assault&art=c3',1920,1080],
    ['equipment','?scenario=weapon-review&loadout=bastion-service-rifle&sound=0',1920,1080],
    ['dense-cvd','?scenario=weapon-review&theme=bastion-standard&cvd=deuteranopia&sound=0',3840,2160],
    ['character-select-correct','?screen=title&flow=character-select&mode=expedition',1920,1080],
    ['density-capacity-correct','?screen=game&scenario=density-capacity&theme=bastion-standard&seed=61061&sound=0',1920,1080],
  ]) {
    if(process.env.AUDIT_SUPPLEMENT && !name.endsWith('-correct')) continue;
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    const errors=[],failed=[];
    await page.route('**/*', route => route.request().url().startsWith(origin) || route.request().url().startsWith('data:') ? route.continue() : route.abort());
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400 && r.url().startsWith(origin))failed.push([r.status(),r.url()]);});
    await page.goto(origin+'/play/last-bastion/'+query,{waitUntil:'domcontentloaded'});
    await page.waitForSelector('#game-root canvas',{timeout:60000});
    await page.waitForTimeout(query.includes('screen=game')?4000:1200);
    await page.screenshot({path:`${out}/${name}.png`});
    results.push({name,query,width,height,errors,failed,dom:await page.locator('body').innerText(),semantics:await page.locator('body').ariaSnapshot(),canvas:await page.locator('#game-root canvas').boundingBox()});
    await page.close();
  }
  fs.writeFileSync(`${out}/${process.env.AUDIT_SUPPLEMENT ? 'captures-supplement' : 'captures'}.json`,JSON.stringify({checkedAt:new Date().toISOString(),results},null,2));
  console.log(JSON.stringify(results.map(({name,errors,failed})=>({name,errors,failed}))));
}finally{await browser?.close();server.kill();}
