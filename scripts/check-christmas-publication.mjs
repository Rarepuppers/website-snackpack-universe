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
const requested = process.argv.filter(a => a.startsWith('--book=')).map(a => a.slice(7));
if(write) assert(source,'A reviewed local source directory is required to refresh evidence');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const visible = (s, event) => event && event !== 'christmas'
 ? s.replace(/^> /gm, '').replace(/\*\*([^*]+)\*\*|\*([^*]+)\*/g, (_, bold, italic) => bold ?? italic)
 : s;
const norm=s=>s.replace(/&#x27;|&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[‑–—−]/g,'-').replace(/\s+/g,' ').trim();
const registry=JSON.parse(fs.readFileSync(path.join(root,'data/web-originals.json')));
const web=JSON.parse(fs.readFileSync(path.join(root,'data/web-books.json'))).books;
const evidencePath=path.join(root,'data/read-publication-evidence.json');
const evidence=JSON.parse(fs.readFileSync(evidencePath));
for (const slug of requested) assert(registry[slug], `Unknown web original: ${slug}`);
const selected = Object.entries(registry).filter(([slug]) => !requested.length || requested.includes(slug));
for(const [slug,manifest] of selected){
 const book=JSON.parse(fs.readFileSync(path.join(root,manifest)));
 const owner=web.find(b=>b.id===`web-${book.event ?? 'christmas'}-${book.id}`);
 assert(owner,`${slug}: missing web source`);
 assert.equal(book.pages.length,book.storyPageCount);
 assert.deepEqual(owner.pages.map(p=>p.text),book.pages.map(p=>p.text));
 const html=fs.readFileSync(path.join(root,'read',slug,'index.html'),'utf8');
 const cards=[...html.matchAll(/<article class="story-page-card"[^>]*>([\s\S]*?)<\/article>/g)].map(m=>m[1]);
 assert.equal(cards.length,book.storyPageCount,`${slug}: published page count differs`);
 const chapters=cards.flatMap((card,i)=>{
  const heading=card.match(/<h2>([^<]+)<\/h2>/);
  return heading ? [{firstPage:i+1,title:norm(heading[1])}] : [];
 });
 assert.deepEqual(chapters,(book.chapters??[]).map(c=>({firstPage:c.firstPage,title:norm(c.title)})),`${slug}: published chapters differ`);
 const paragraphs=cards.map(c=>[...c.split('story-page-copy')[1].split('<div class="math-question">')[0].matchAll(/<p>([\s\S]*?)<\/p>/g)].map(p=>norm(p[1].replace(/<\/?(?:em|strong)>/g, ''))));
 assert.deepEqual(paragraphs,book.pages.map(p=>p.text.split(/\n\s*\n/).map(text => norm(visible(text, book.event)))),`${slug}: paragraph breaks differ from the manuscript`);
 const text=paragraphs.map(page=>page.join(' '));
 assert.deepEqual(text,owner.pages.map(p=>norm(visible(p.text, book.event))),`${slug}: published prose differs`);
 const questions=cards.flatMap((card,i)=>{
  const matches=[...card.matchAll(/<div class="math-question"><p class="math-q"><strong>Count together:<\/strong> ([\s\S]+?)<\/p><ul class="math-choices" data-answer="([^"]+)" aria-label="Choices">([\s\S]+?)<\/ul><details class="story-answer math-answer"><summary>Show the answer<\/summary><p><strong>([\s\S]+?)\.<\/strong> ([\s\S]+?)<\/p><\/details><\/div>/g)];
  assert.equal(matches.length,(card.match(/class="math-question"/g) ?? []).length,`${slug}: invalid question markup on page ${i+1}`);
  return matches.map(([,prompt,answer,options,shownAnswer,explanation])=>{
   assert.equal(norm(shownAnswer),norm(answer));
   return {page:i+1,prompt:norm(prompt),answer:norm(answer),choices:[...options.matchAll(/<li>([^<]*)<\/li>/g)].map(m=>norm(m[1])),explanation:norm(explanation)};
  });
 });
 const expectedQuestions=book.pages.flatMap(({number,question:q})=>q?[{
  page:number,prompt:norm(q.prompt),answer:norm(String(q.answer)),choices:q.choices.map(c=>norm(String(c))),explanation:norm(q.explanation),
 }]:[]);
 assert.deepEqual(questions,expectedQuestions,`${slug}: published counting questions differ`);
 const coverAlt=html.match(/<section class="story-title-section">[\s\S]*?<picture>[\s\S]*?<img [^>]*alt="([^"]+)"/)?.[1];
 assert.equal(norm(coverAlt ?? ''),norm(book.cover.alt),`${slug}: published cover alt differs`);
 const assets=[book.cover,...book.pages.map(p=>p.art)];
 for(const art of assets){
  assert.equal(art.status,'accepted');
  for(const d of art.derivatives) assert.equal(hash(path.join(root,'read',slug,'pages',d.path)),d.sha256,`${slug}: reviewed WebP differs`);
  if(source) assert.equal(hash(path.join(source,book.sourceFolder ?? book.id,art.master)),art.sha256,`${slug}: reviewed master differs`);
 }
 for(let i=0;i<book.storyPageCount;i++) assert.equal(norm(cards[i].match(/alt="([^"]+)"/)[1]),norm(book.pages[i].art.alt));
 const art=Object.fromEntries(cards.map(c=>{const rel=`read/${slug}/`+c.match(/<img src="\.\/([^"]+)"/)[1];return [rel,hash(path.join(root,rel))];}));
 const pdf=`read/${slug}/${slug}.pdf`;
 if(book.event && book.event !== 'christmas') assert(fs.statSync(path.join(root,pdf)).size < 10_000_000,`${slug}: PDF exceeds 10 MB`);
 const record={slug,source_id:owner.id,source_art:Object.fromEntries(owner.art.map((rel,i)=>['../'+rel,assets[i].sha256])),text,teaching:owner.pages.map(()=>({sequence:null,observation:null})),expected:[],quizzes:questions,art,pdf,pdf_sha256:hash(path.join(root,pdf))};
 const old=evidence.books.find(b=>b.slug===slug);
 if(write){
  const localPdf=path.join(source,book.sourceFolder ?? book.id,`${slug}.pdf`);
  if(book.event && book.event !== 'christmas') assert.equal(record.pdf_sha256,hash(localPdf),`${slug}: reviewed PDF differs`);
  if(old)evidence.books[evidence.books.indexOf(old)]=record;else evidence.books.push(record);}
 else assert.deepEqual(old,record,`${slug}: publication differs from reviewed evidence`);
}
if(write){evidence.books.sort((a,b)=>a.slug.localeCompare(b.slug));fs.writeFileSync(evidencePath,JSON.stringify(evidence,null,2)+'\n');}
console.log(`Event-book publication: ${selected.length} web-original books with reviewed prose, illustrations and PDFs verified.`);
