import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { READ_COLLECTIONS } from './lib/read-collections.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),check=process.argv.includes('--check');
const evidence=JSON.parse(fs.readFileSync(path.join(root,'data/read-publication-evidence.json'),'utf8'));
const meta=JSON.parse(fs.readFileSync(path.join(root,'data/read-collections.json'),'utf8'));
const template=fs.readFileSync(path.join(root,'read/ted-e-bears-blanket-fort/index.html'),'utf8').replace(/\r\n/g,'\n');
const shared=template.slice(template.indexOf('<!-- pwa:generated -->'),template.indexOf('</head>'));
const header=template.slice(template.indexOf('<header class="topbar">'),template.indexOf('<main>'));
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const titleFor=slug=>fs.readFileSync(path.join(root,'read',slug,'index.html'),'utf8').match(/<meta property="og:title" content="([^\"]*)"/)[1];
const page=(title,desc,url,body)=>`<!DOCTYPE html>\n<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | Free Printable Collections</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="https://www.snackpackuniverse.com${url}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="https://www.snackpackuniverse.com/read/ted-e-bears-blanket-fort/social-card.jpg"><meta property="og:url" content="https://www.snackpackuniverse.com${url}"><meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/assets/favicon-32.png"><link rel="stylesheet" href="/assets/fonts/fonts.css"><link rel="stylesheet" href="/site.css"><!-- breadcrumbs:generated -->\n<!-- /breadcrumbs:generated -->\n${shared}</head><body>${header}<main><section><div class="shell"><span class="eyebrow">Free printable collections</span><h1>${esc(title)}</h1><p class="lead">${esc(desc)}</p>${body}<p><a class="text-link" href="/read/">Back to all books</a> · <a class="text-link" href="/guides/free-printable-decodable-readers/">Printing guide</a></p></div></section></main><footer class="foot"><div class="shell"><p>Free to read and print. No account, sign-up or ads.</p><a href="/privacy/">Privacy</a></div></footer><script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"0e57cfb3eb86422ca40e5fac02b1cf94"}'></script></body></html>\n`;
const changed=[];
function write(rel,html){const f=path.join(root,rel);const before=fs.existsSync(f)?fs.readFileSync(f,'utf8').replace(/\r\n/g,'\n'):'';
 // Breadcrumbs are owned by their generator; preserve its current block.
 const crumb=before.match(/<!-- breadcrumbs:generated -->[\s\S]*?<!-- \/breadcrumbs:generated -->/);
 if(crumb)html=html.replace(/<!-- breadcrumbs:generated -->[\s\S]*?<!-- \/breadcrumbs:generated -->/,crumb[0]);
 if(before!==html){changed.push(rel);if(!check){fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,html);}}}
for(const c of READ_COLLECTIONS){const m=meta.find(m=>m.id===c.id);if(!m)throw Error('Missing collection PDF metadata: '+c.id);
 const rows=c.books.map(slug=>{if(!evidence.books.some(b=>b.slug===slug))throw Error('Unpublished collection member '+slug);return `<li><h2><a href="/read/${slug}/">${titleFor(slug)}</a></h2><a class="text-link" href="/read/${slug}/${slug}.pdf" download>Download this book (PDF)</a></li>`;}).join('\n');
 const body=`<p><a class="btn btn-primary" href="./${c.id}.pdf" download>Download the collection (PDF)</a></p><p>${c.books.length} complete books · ${m.pages} printed pages · ${(m.bytes/1048576).toFixed(1)} MB. Includes contents and every book’s questions. PDFs are not included in Save the bookshelf for offline.</p><p>Print at actual size (100%) on A4 or US Letter. Pages fit the shared safe area. Choose only the books or pages you want; individual PDFs are below.</p><ol class="read-collection-books">${rows}</ol><p><a href="/read/collections/">All printable collections</a></p>`;
 write(`read/collections/${c.id}/index.html`,page(c.title,c.description,`/read/collections/${c.id}/`,body));}
write('read/collections/index.html',page('Choose a printable collection','Small sets of complete books for phonics practice, quiet reading together and kindness. Individual books remain free to read and print.','/read/collections/',`<div class="grid app-grid">${READ_COLLECTIONS.map(c=>`<article class="app-card"><div class="app-card-top"><h2>${esc(c.title)}</h2><p>${esc(c.description)}</p><p>${c.books.length} complete books</p><a class="btn btn-secondary" href="./${c.id}/">See books and download</a></div></article>`).join('')}</div>`));
if(check&&changed.length)throw Error('Stale collection pages: '+changed.join(', '));
console.log(`Printable collection pages ${check?'current': 'written'}: ${READ_COLLECTIONS.length} collections; ${changed.length} changes.`);
