import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
const out='play/last-bastion/playtest-evidence/2026-10-22-controls-records';fs.mkdirSync(out,{recursive:true});
const port=44277,origin=`http://127.0.0.1:${port}`;const server=spawn(process.execPath,['scripts/serve-static.mjs'],{env:{...process.env,PORT:String(port)},stdio:'ignore'});let browser;const results=[];
async function capture(p,name,width,height,dpr){
 await p.screenshot({path:`${out}/${name}.png`});
 results.push({name,width,height,dpr,semantics:await p.locator('.semantic-shell').ariaSnapshot(),canvas:await p.locator('#game-root canvas').boundingBox()});
}
try{
 for(let i=0;i<80;i++){try{if((await fetch(origin+'/play/last-bastion/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch();const errors=[];
 for(const [size,width,height,dpr] of [['minimum',960,540,1],['4k',3840,2160,1],['letterbox',1280,800,2]]){
  const p=await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr});p.on('pageerror',e=>errors.push({size,message:e.message}));
  await p.goto(origin+'/play/last-bastion/?flow=controls',{waitUntil:'networkidle'});await p.getByRole('heading',{name:'CONTROL BINDINGS',exact:true}).waitFor();
  if(size!=='letterbox')await capture(p,`controls-${size}`,width,height,dpr);
  await p.getByRole('button',{name:'ROLL / EVADE: SPACE',exact:true}).click();await capture(p,`capture-${size}`,width,height,dpr);
  await p.keyboard.press('Escape');await p.getByRole('button',{name:'Controller',exact:true}).click();
  if(size==='minimum')await capture(p,'controller-minimum',width,height,dpr);
  if(size==='minimum'){
   await p.getByRole('button',{name:'ROLL / EVADE: A',exact:true}).click();await capture(p,'controller-capture-minimum',width,height,dpr);await p.keyboard.press('Escape');
  }
  await p.goto(origin+'/play/last-bastion/?flow=records',{waitUntil:'networkidle'});await p.getByRole('heading',{name:'RECORDS',exact:true}).waitFor();
  if(size==='minimum')await capture(p,'records-empty-minimum',width,height,dpr);
  if(size!=='letterbox'){
   await p.goto(origin+'/play/last-bastion/?flow=settings');await p.getByRole('checkbox',{name:'Screen shake',exact:true}).uncheck();
   await p.goto(origin+'/play/last-bastion/?screen=summary&summarydemo=1');await p.waitForFunction(()=>Boolean(window.__runSummary));
   await p.evaluate(()=>{const save=JSON.parse(localStorage.getItem('last-bastion-save'));save.runHistory=Array.from({length:8},(_,index)=>({id:`record-capture-${index}`,completedAtMs:index===7?0:Date.now()-index*86400000,summary:{...window.__runSummary,mode:index===7?'expedition':'quick-drop',threatTier:index===7?2:null,nodesCleared:index===7?17:0,waveReached:10-index,heroId:'medic',outcome:index===0?'victory':'defeat',defeatCause:'arc-warden',commandMarksEarned:index+1}}));save.progress.runsFinished=8;save.progress.totalDamage=1234.5;localStorage.setItem('last-bastion-save',JSON.stringify(save));});
   await p.goto(origin+'/play/last-bastion/?flow=records',{waitUntil:'networkidle'});await p.getByRole('button',{name:'Older runs',exact:true}).click();await p.getByRole('button',{name:'Older runs',exact:true}).click();await capture(p,`records-populated-${size}`,width,height,dpr);
  }
  await p.close();
 }
 fs.writeFileSync(out+'/capture-results.json',JSON.stringify({checkedAt:new Date().toISOString(),identity:'web-2026.10.22-controls-records',source:'5974c948 plus scoped implementation',limitations:'Headless Chromium, disposable seeded history, semantic tree exposure only; no human/AT/hardware acceptance.',errors,results},null,2));console.log(JSON.stringify({captures:results.length,errors}));
}finally{await browser?.close();server.kill()}
