"""Combine existing approved PDFs verbatim, with a printable contents page and bookmarks."""
from pathlib import Path
import json,re,html,io,hashlib,subprocess,sys
from pypdf import PdfReader,PdfWriter
ROOT=Path(__file__).resolve().parent.parent
collections=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {READ_COLLECTIONS} from './scripts/lib/read-collections.mjs'; console.log(JSON.stringify(READ_COLLECTIONS));"],cwd=ROOT,text=True))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
if '--check' in sys.argv:
 metadata=json.loads((ROOT/'data/read-collections.json').read_text(encoding='utf-8'))
 assert len(metadata)==len(collections)
 for collection,record in zip(collections,metadata):
  assert record['id']==collection['id']
  assert collection['books']==[s['slug'] for s in record['sources']]
  p=ROOT/'read/collections'/record['id']/(record['id']+'.pdf');assert sha(p)==record['sha256'];reader=PdfReader(p);assert len(reader.pages)==record['pages'];assert p.stat().st_size==record['bytes']
  for source in record['sources']:
   original=ROOT/'read'/source['slug']/(source['slug']+'.pdf');assert sha(original)==source['sha256'],source['slug']+' PDF changed; rebuild collection'
   for i,page in enumerate(PdfReader(original).pages):assert page.extract_text()==reader.pages[source['start']-1+i].extract_text()
 print(f'Collection PDFs current: {len(metadata)} collections / {sum(c["pages"] for c in metadata)} printed pages; all source PDF hashes/text match.');sys.exit(0)
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import simpleSplit
metadata=[]
for collection in collections:
 sources=[];next_page=2
 for slug in collection['books']:
  p=ROOT/'read'/slug/(slug+'.pdf');reader=PdfReader(p);doc=(ROOT/'read'/slug/'index.html').read_text(encoding='utf-8');title=html.unescape(re.search(r'<meta property="og:title" content="([^"]*)"',doc)[1]);sources.append(dict(slug=slug,title=title,file=p,pages=len(reader.pages),start=next_page,sha256=sha(p)));next_page+=len(reader.pages)
 buf=io.BytesIO();c=canvas.Canvas(buf,pagesize=A4);c.setTitle(collection['title']);left=40;y=785;c.setFont('Helvetica-Bold',21);c.drawString(left,y,collection['title']);y-=40;c.setFont('Helvetica',12)
 for line in simpleSplit(collection['description'],'Helvetica',12,510):c.drawString(left,y,line);y-=18
 y-=25;c.setFont('Helvetica-Bold',13);c.drawString(left,y,'Contents');y-=26
 for source in sources:
  c.setFont('Helvetica-Bold',12)
  for line in simpleSplit(source['title'],'Helvetica-Bold',12,440):c.drawString(left,y,line);y-=17
  c.setFont('Helvetica',11);c.drawString(left+12,y,f"Starts on page {source['start']} - {source['pages']} printed pages");y-=28
 c.setFont('Helvetica',10)
 for line in ['Read together where needed. Choose the pages you want to print.','Print at actual size (100%) on A4 or US Letter.','Individual books and more: snackpackuniverse.com/read/']:
  c.drawString(left,y,line);y-=17
 c.showPage();c.save();buf.seek(0);writer=PdfWriter();writer.append(PdfReader(buf))
 for source in sources:writer.append(str(source['file']),outline_item=source['title'])
 writer.add_metadata({'/Title':collection['title'],'/Author':'SnackPack Studios','/Subject':'Complete free story books and questions for home printing'})
 dest=ROOT/'read/collections'/collection['id']/(collection['id']+'.pdf');dest.parent.mkdir(parents=True,exist_ok=True)
 with dest.open('wb') as f:writer.write(f)
 combined=PdfReader(dest);assert len(combined.pages)==next_page-1
 for source in sources:
  original=PdfReader(source['file'])
  for i,page in enumerate(original.pages):assert page.extract_text()==combined.pages[source['start']-1+i].extract_text()
 metadata.append(dict(id=collection['id'],pages=len(combined.pages),bytes=dest.stat().st_size,sha256=sha(dest),sources=[{k:v for k,v in s.items() if k!='file'} for s in sources]))
 print(collection['id'],len(combined.pages),'pages',round(dest.stat().st_size/1048576,2),'MB')
(ROOT/'data/read-collections.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
