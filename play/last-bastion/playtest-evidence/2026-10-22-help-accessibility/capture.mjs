import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
const out='play/last-bastion/playtest-evidence/2026-10-22-help-accessibility';
fs.mkdirSync(out,{recursive:true});
const port=44274,origin=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['scripts/serve-static.mjs'],{env:{...process.env,PORT:String(port)},stdio:'ignore'});
let browser; const results=[];
try {
 for(let i=0;i<80;i++){try{if((await fetch(origin+'/play/last-bastion/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch();
 for(const [name,width,height,dpr] of [['minimum',960,540,1],['letterbox',1280,800,2],['4k',3840,2160,1]]){
  const p=await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(origin+'/play/last-bastion/?flow=how-to-play',{waitUntil:'networkidle'});
  await p.getByRole('button',{name:'Next page',exact:true}).waitFor();
  for(let page=0;page<4;page++){
   if(name==='minimum'||page===0||page===3){
    await p.screenshot({path:`${out}/${name}-page-${page+1}.png`});
    results.push({name,width,height,dpr,page:page+1,errors:[...errors],semantics:await p.locator('.semantic-shell').ariaSnapshot(),canvas:await p.locator('#game-root canvas').boundingBox()});
   }
   if(page<3)await p.getByRole('button',{name:'Next page',exact:true}).click();
  }
  await p.close();
 }
 fs.writeFileSync(out+'/capture-results.json',JSON.stringify({checkedAt:new Date().toISOString(),identity:'web-2026.10.22-help-accessibility',source:'a58f17ff plus the scoped help implementation',limitations:'Headless Chromium; sampled layouts and accessibility-tree exposure, not actual AT/controller or hardware acceptance.',results},null,2));
 console.log(JSON.stringify(results.map(({name,page,errors})=>({name,page,errors}))));
}finally{await browser?.close();server.kill();}
