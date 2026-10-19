"""Check the actual printable PDFs, not a second implementation of the PDF writer."""
from pathlib import Path
import json,re,sys,html,unicodedata
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parent.parent
def norm(s):
 s=html.unescape(str(s)).translate(str.maketrans({'’':"'",'‘':"'",'“':'"','”':'"','‑':'-','–':'-','—':'-','−':'-','\u00ad':''}))
 return re.sub(r'\s+',' ',s).strip()
books=json.loads((ROOT/'data/read-publication-evidence.json').read_text(encoding='utf-8'))['books']
pages=0
for b in books:
 reader=PdfReader(ROOT/b['pdf']);texts=[p.extract_text() or '' for p in reader.pages]
 assert len(texts)>=len(b['text']),(b['slug'],'missing printable pages')
 cursor=0
 for i,sentence in enumerate(b['text']):
  matches=[j for j in range(cursor,len(texts)) if norm(sentence) in norm(texts[j])]
  assert matches,(b['slug'],i+1,'story prose missing or out of order')
  cursor=matches[0]+1 # Some printables have a separate cover before page 1.
 doc=(ROOT/'read'/b['slug']/'index.html').read_text(encoding='utf-8')
 finish=doc.split('class="shell story-finish-card"')[-1]
 question=re.search(r'<h2>([\s\S]*?)</h2>',finish)
 if question and re.search(r'<details class="story-answer"',finish):
  q=norm(re.sub('<[^>]*>','',question[1]))
  assert q in norm(' '.join(texts[cursor:])),(b['slug'],'end question missing from printable')
  answer=re.search(r'<details class="story-answer"[^>]*>[\s\S]*?<p>([\s\S]*?)</p>',finish)
  if answer:
   a=norm(re.sub('<[^>]*>','',answer[1]))
   assert a in norm(' '.join(texts[cursor:])),(b['slug'],'primary answer missing from printable')
 pages+=len(texts)
print(f'PDF text check passed: {len(books)} real PDFs / {pages} printed pages; all story prose and primary questions present.')
