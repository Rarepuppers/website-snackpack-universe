import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const records=JSON.parse(fs.readFileSync(path.join(root,'data/read-model-delivery.json'),'utf8'));
const source=path.resolve(root,'../apps/snackpack-4-math-arithmetic/constants/storyTeachingModels.json');
const models=fs.existsSync(source)?JSON.parse(fs.readFileSync(source,'utf8')):null;
const plain=s=>String(s).replace(/&quot;/g,'"').replace(/&#x27;|&#39;/g,"'").replace(/&amp;/g,'&').replace(/−/g,'-');
for(const r of records){
  assert.equal(sha(path.join(root,r.image)),r.sha256,`${r.id}: web diagram changed`);
  assert.equal(sha(path.join(root,r.print)),r.print_sha256,`${r.id}: print scene changed`);
  const pdf=fs.readFileSync(path.join(root,'read',r.slug,r.slug+'.pdf'));
  assert(pdf.includes(fs.readFileSync(path.join(root,r.print))),`${r.id}: actual PDF omits the reviewed model scene`);
  const html=fs.readFileSync(path.join(root,'read',r.slug,'index.html'),'utf8');
  const card=[...html.matchAll(/<article class="story-page-card"[^>]*>([\s\S]*?)<\/article>/g)][r.page-1]?.[1];
  assert(card?.includes(`data-model-id="${r.id}"`),`${r.id}: diagram absent from its actual page`);
  assert(card.includes(`data-print-model="./print-models/page-${r.page}-r1.jpg"`),`${r.id}: missing printable diagram`);
  const figure=card.match(/<figure class="story-teaching-model"[\s\S]*?<\/figure>/)?.[0]||'';
  assert.equal(plain(figure.match(/alt="([^"]+)"/)?.[1]),r.model.alt,`${r.id}: alternative text differs`);
  assert.equal(plain(figure.match(/<figcaption>([\s\S]*?)<\/figcaption>/)?.[1]),r.model.instruction,`${r.id}: instruction differs`);
  if(models){
    assert.deepEqual(r.model,models[r.id],`${r.id}: owning-app model differs`);
    assert.equal(sha(path.resolve(root,'../apps/snackpack-4-math-arithmetic/assets/story-models',r.id+'.png')),r.sha256,`${r.id}: app and website pixels differ`);
  }
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'read/offline-manifest.json'),'utf8'));
  assert(manifest.bookFiles.find(b=>b.slug===r.slug)?.urls.includes('/'+r.image),`${r.id}: diagram missing from offline book`);
}
console.log(`${records.length} teaching diagrams: exact app/web pixels, instructions, print scenes and offline delivery verified${models?'':' (committed evidence only)'}.`);
