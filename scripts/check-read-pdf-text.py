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
 doc=(ROOT/'read'/b['slug']/'index.html').read_text(encoding='utf-8')
 assert f'{len(reader.pages)} printed pages' in doc,(b['slug'],'incorrect printed page count')
 assert f'{(ROOT/b["pdf"]).stat().st_size/1048576:.1f} MB' in doc,(b['slug'],'incorrect PDF download size')
 assert len(texts)>=len(b['text']),(b['slug'],'missing printable pages')
 cursor=0
 for i,sentence in enumerate(b['text']):
  matches=[j for j in range(cursor,len(texts)) if norm(sentence) in norm(texts[j])]
  assert matches,(b['slug'],i+1,'story prose missing or out of order')
  teaching=(b.get('teaching') or [None]*len(b['text']))[i]
  if teaching:
   if teaching.get('sequence'):
    model='Sequence: '+', '.join('?' if n==-1 else str(n) for n in teaching['sequence'])
    assert norm(model) in norm(texts[matches[0]]),(b['slug'],i+1,'actual PDF story page omits source sequence')
    assert norm(model) in norm(' '.join(texts[len(b['text']):])),(b['slug'],i+1,'printable questions omit sequence')
   if teaching.get('observation'):
    assert norm(teaching['observation']) in norm(texts[matches[0]]),(b['slug'],i+1,'actual PDF omits observation alternative')
  cursor=matches[0]+1 # Some printables have a separate cover before page 1.
 doc=(ROOT/'read'/b['slug']/'index.html').read_text(encoding='utf-8')
 finish=doc.split('class="shell story-finish-card"')[-1]
 questions=list(re.finditer(r'<h[23](?:\s[^>]*)?>([\s\S]*?)</h[23]>\s*<details class="story-answer"[^>]*>[\s\S]*?<p>([\s\S]*?)</p>',finish))
 for question in questions:
  q=norm(re.sub('<[^>]*>','',question[1]));a=norm(re.sub('<[^>]*>','',question[2]))
  assert q in norm(' '.join(texts[cursor:])),(b['slug'],'end question missing from printable',q)
  assert a in norm(' '.join(texts[cursor:])),(b['slug'],'end answer missing from printable',a)
 pages+=len(texts)
print(f'PDF text check passed: {len(books)} real PDFs / {pages} printed pages; all story prose and both source questions present where supplied.')
