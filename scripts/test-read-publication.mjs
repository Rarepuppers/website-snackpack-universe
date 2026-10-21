import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'snackpack-read-guard-'));
const temp = path.join(sandbox, 'site');
try {
  const evidence = JSON.parse(fs.readFileSync(path.join(root,'data/read-publication-evidence.json'),'utf8'));
  const pins = JSON.parse(fs.readFileSync(path.join(root,'data/decodable-art-pins.json'),'utf8'));
  const files = new Set(['data/read-publication-evidence.json','data/decodable-art-pins.json','read/index.html',...pins.map(p=>p.web)]);
  for(const b of evidence.books) for(const p of [`read/${b.slug}/index.html`,b.pdf,...Object.keys(b.art)]) files.add(p);
  for(const p of files){const out=path.join(temp,p);fs.mkdirSync(path.dirname(out),{recursive:true});fs.copyFileSync(path.join(root,p),out);}
  const run=()=>spawnSync(process.execPath,[path.join(root,'scripts/check-read-publication.mjs'),'--site-root='+temp],{encoding:'utf8'});
  assert.equal(run().status,0,'Valid committed evidence must pass without apps, explicitly in evidence-only mode.');
  function mutation(p,change,message){const f=path.join(temp,p),before=fs.readFileSync(f);change(f,before);const result=run();assert.notEqual(result.status,0,message);fs.writeFileSync(f,before);}
  const b=evidence.books.find(b=>b.slug==='ted-e-bears-blanket-fort');
  mutation(`read/${b.slug}/index.html`,(f,s)=>fs.writeFileSync(f,s.toString().replace('Ted-E-Bear stacks','A different bear stacks')),'Changed published prose must fail.');
  mutation(Object.keys(b.art)[0],f=>fs.appendFileSync(f,'changed'),'Changed art must fail.');
  mutation(b.pdf,f=>fs.writeFileSync(f,'missing story'),'Broken PDF must fail.');
  mutation(`read/${b.slug}/index.html`,(f,s)=>fs.writeFileSync(f,s.toString().replace('Why did the fort stay up when Panda-Cake helped?','An invented quiz question?')),'Changed app quiz must fail.');
  mutation(`read/${b.slug}/index.html`,(f,s)=>fs.writeFileSync(f,s.toString().replace('What did Ted and Panda-Cake do inside the finished fort?','An invented second question?')),'Changed secondary app quiz must fail.');
  mutation(`read/${b.slug}/index.html`,(f,s)=>fs.writeFileSync(f,s.toString().replace('Read a story together.</p>','Read a story together. An unrelated explanation.</p>')),'Extra invented explanation must fail.');
  const sequencePath='read/panda-cakes-market-basket/index.html';
  mutation(sequencePath,(f,s)=>fs.writeFileSync(f,s.toString().replace(/<p class="counting-sequence"[^>]*>[\s\S]*?<\/p>/,'')),'Removing source model must fail despite unchanged prose and answer.');
  mutation(sequencePath,(f,s)=>fs.writeFileSync(f,s.toString().replace('data-counting-sequence="2,3,-1,5"','data-counting-sequence="2,4,-1,5"')),'Changing source model values must fail.');
  mutation(sequencePath,(f,s)=>fs.writeFileSync(f,s.toString().replace('Sequence: 2, 3, ?, 5','Sequence: 2, 4, ?, 5')),'Changing visible teaching sequence must fail.');
  const required=spawnSync(process.execPath,[path.join(root,'scripts/check-read-publication.mjs'),'--site-root='+temp,'--require-apps'],{encoding:'utf8'});
  assert.notEqual(required.status,0,'Missing app checkout must not pass a required source comparison.');
  console.log('Publication boundary passes real-output mutations: changed prose, quiz, art, PDF and missing companion source are rejected.');
} finally {fs.rmSync(sandbox,{recursive:true,force:true});}
