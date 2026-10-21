import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const run=(program,args)=>execFileSync(program,args,{cwd:root,stdio:'inherit'});
const source=process.argv.includes('--require-apps')?['--require-apps']:[];
for(const name of ['check-read-publication.mjs','test-read-publication.mjs','test-alphabet-book.mjs','check-site.mjs','check-contrast.mjs','check-javascript.mjs'])run(process.execPath,['scripts/'+name,...(name==='check-read-publication.mjs'?source:[])]);
for(const name of ['build-read-shelf.mjs','build-read-collections.mjs','build-read-responsive.mjs','build-play-links.mjs','build-go-links.mjs'])run(process.execPath,['scripts/'+name,'--check']);
const python=process.env.SNACKPACK_PYTHON || 'python';
run(python,['scripts/check-read-pdf-text.py']);
run(python,['scripts/build-read-collection-pdfs.py','--check']);
run(python,['scripts/build-read-social-cards.py','--check']);
if(process.argv.includes('--roundtrip'))run(process.execPath,['scripts/test-decodable-roundtrip.mjs']);
if(source.length){run(process.execPath,['scripts/import-alphabet-book.mjs','--id=panda-cake-alphabet']);run(process.execPath,['scripts/import-zoo-book.mjs','--id=animal-architects']);}
console.log('Reads publication checks passed. Run the real-browser reads suite and review rendered PDFs before publishing new artifacts.');
run(process.execPath,['scripts/check-read-models.mjs']);
