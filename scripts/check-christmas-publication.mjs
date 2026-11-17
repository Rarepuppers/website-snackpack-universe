// Web-original source verification. A scoped refresh preserves all other evidence.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const write=process.argv.includes('--write-evidence');
const sourceArg=process.argv.find(a=>a.startsWith('--source-root='));
const source=sourceArg && path.resolve(sourceArg.slice(14));
if(write) assert(source,'A reviewed local source directory is required to refresh evidence');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const norm=s=>s.replace(/&#x27;|&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[‑–—−]/g,'-').replace(/\s+/g,' ').trim();
const registry=JSON.parse(fs.readFileSync(path.join(root,'data/web-originals.json')));
const web=JSON.parse(fs.readFileSync(path.join(root,'data/web-books.json'))).books;
const evidencePath=path.join(root,'data/read-publication-evidence.json');
const evidence=JSON.parse(fs.readFileSync(evidencePath));
for(const [slug,manifest] of Object.entries(registry)){
 const book=JSON.parse(fs.readFileSync(path.join(root,manifest)));
 const owner=web.find(b=>b.id==='web-christmas-'+book.id);
 assert(owner,`${slug}: missing web source`);
 assert.equal(book.pages.length,24);
 assert.deepEqual(owner.pages.map(p=>p.text),book.pages.map(p=>p.text));
 const html=fs.readFileSync(path.join(root,'read',slug,'index.html'),'utf8');
 const cards=[...html.matchAll(/<article class="story-page-card"[^>]*>([\s\S]*?)<\/article>/g)].map(m=>m[1]);
 const text=cards.map(c=>norm(c.split('story-page-copy')[1].match(/<p>([\s\S]*?)<\/p>/)[1]));
 assert.deepEqual(text,owner.pages.map(p=>norm(p.text)),`${slug}: published prose differs`);
 const assets=[book.cover,...book.pages.map(p=>p.art)];
 for(const art of assets){
  assert.equal(art.status,'accepted');
  for(const d of art.derivatives) assert.equal(hash(path.join(root,'read',slug,'pages',d.path)),d.sha256,`${slug}: reviewed WebP differs`);
  if(source) assert.equal(hash(path.join(source,book.id,art.master)),art.sha256,`${slug}: reviewed master differs`);
 }
 for(let i=0;i<24;i++) assert.equal(norm(cards[i].match(/alt="([^"]+)"/)[1]),norm(book.pages[i].art.alt));
 const art=Object.fromEntries(cards.map(c=>{const rel=`read/${slug}/`+c.match(/<img src="\.\/([^"]+)"/)[1];return [rel,hash(path.join(root,rel))];}));
 const pdf=`read/${slug}/${slug}.pdf`;
 const record={slug,source_id:owner.id,source_art:Object.fromEntries(owner.art.map((rel,i)=>['../'+rel,assets[i].sha256])),text,teaching:owner.pages.map(()=>({sequence:null,observation:null})),expected:[],quizzes:[],art,pdf,pdf_sha256:hash(path.join(root,pdf))};
 const old=evidence.books.find(b=>b.slug===slug);
 if(write){if(old)evidence.books[evidence.books.indexOf(old)]=record;else evidence.books.push(record);}
 else assert.deepEqual(old,record,`${slug}: publication differs from reviewed evidence`);
}
if(write){evidence.books.sort((a,b)=>a.slug.localeCompare(b.slug));fs.writeFileSync(evidencePath,JSON.stringify(evidence,null,2)+'\n');}
console.log('Christmas publication: both web-original sources, 48 pages, 50 reviewed image sets and PDFs verified. Other book evidence preserved.');
