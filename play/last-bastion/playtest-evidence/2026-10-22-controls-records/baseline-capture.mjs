import {chromium} from 'playwright';
import {spawn,execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const out='play/last-bastion/playtest-evidence/2026-10-22-controls-records';fs.mkdirSync(out,{recursive:true});
const assets='play/last-bastion/game-assets/';const source='5974c948';const scripts=new Map();
for(const file of execFileSync('git',['ls-tree','-r','--name-only',source,assets],{encoding:'utf8'}).trim().split('\n')){
 if(/\.(js|css)$/.test(file))scripts.set(path.basename(file),execFileSync('git',['show',`${source}:${file}`],{maxBuffer:16*1024*1024}));
}
const port=44276,origin=`http://127.0.0.1:${port}`;const server=spawn(process.execPath,['scripts/serve-static.mjs'],{env:{...process.env,PORT:String(port)},stdio:'ignore'});let browser;
try{
 for(let i=0;i<80;i++){try{if((await fetch(origin+'/play/last-bastion/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch();const results=[];
 for(const device of ['keyboard','gamepad']){
  const p=await browser.newPage({viewport:{width:960,height:540}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/play/last-bastion/game-assets/*',route=>{const name=path.basename(new URL(route.request().url()).pathname),body=scripts.get(name);return body?route.fulfill({body,contentType:name.endsWith('.css')?'text/css':'text/javascript'}):route.continue();});
  await p.addInitScript(()=>{const pad={id:'Baseline capture pad',index:0,connected:true,mapping:'standard',timestamp:1,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};window.__testPad=pad;Object.defineProperty(navigator,'getGamepads',{value:()=>{pad.timestamp=performance.now();return[pad]}})});
  await p.goto(origin+'/play/last-bastion/?flow=controls',{waitUntil:'networkidle'});await p.waitForFunction(()=>window.__shellState?.screen==='controls');
  if(device==='gamepad'){await p.keyboard.press('ArrowRight');for(let i=0;i<4;i++)await p.keyboard.press('ArrowDown');}
  await p.keyboard.press('Enter');const before=await p.evaluate(()=>({screen:window.__shellState.screen,device:window.__shellState.controlDevice,index:window.__shellState.controlIndex}));
  if(device==='keyboard'){
   await p.evaluate(()=>{window.__testPad.buttons[1]={pressed:true,touched:true,value:1}});await p.waitForTimeout(160);
   await p.evaluate(()=>{window.__testPad.buttons[1]={pressed:false,touched:false,value:0}});
  }else await p.keyboard.press('Backspace');
  await p.waitForTimeout(150);const after=await p.evaluate(()=>({screen:window.__shellState.screen,device:window.__shellState.controlDevice,index:window.__shellState.controlIndex}));
  results.push({captureDevice:device,input:device==='keyboard'?'physical B (simulated)':'keyboard Backspace',before,after,errors});await p.close();
 }
 const report={checkedAt:new Date().toISOString(),baselineSource:source,method:'Intercepted all compiled JS/CSS with Git bytes from the baseline commit; unchanged local art. Disposable profiles, simulated pad; not AT/hardware acceptance.',results};
 fs.writeFileSync(out+'/capture-ownership-before.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser?.close();server.kill()}
