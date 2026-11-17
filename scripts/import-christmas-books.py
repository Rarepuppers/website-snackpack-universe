"""Import reviewed web-original Christmas sources; never infer app provenance."""
from pathlib import Path
import json, html, re, shutil, subprocess, sys
ROOT=Path(__file__).resolve().parent.parent
SOURCE=Path(sys.argv[1]).resolve()
BOOKS={'nutmeg-tree':'nutmeg-and-the-tree-that-wouldnt-come','vincent-shadow-show':'vincent-van-mouse-and-the-christmas-shadow-show'}
template=(ROOT/'read/hen-berrys-helping-day/index.html').read_text(encoding='utf-8')
header=template.split('<header class="topbar">')[1].split('</header>')[0]
tail=template[template.index('<footer'):].replace('Story from SnackPack Sentences &amp; Spelling.', 'An original SnackPack picture book.').replace('../../privacy/snackpack-3-spelling-sentences/', '../../privacy/')
theme=template[template.index('<!-- pwa:generated -->'):template.index('</head>')]
registry={}
e=html.escape
for source,slug in BOOKS.items():
    src=SOURCE/source
    data=json.loads((src/'manifest.json').read_text(encoding='utf-8'))
    folder=ROOT/'read'/slug; (folder/'pages').mkdir(parents=True,exist_ok=True)
    stored=ROOT/'data/web-originals'/slug; stored.mkdir(parents=True,exist_ok=True)
    shutil.copy2(src/'manuscript.md',stored/'manuscript.md')
    data['publicationStatus']='published';data['webSlug']=slug
    (stored/'manifest.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    registry[slug]=f'data/web-originals/{slug}/manifest.json'
    for key,art in [('cover',data['cover'])]+[(f'p{p["number"]:02}',p['art']) for p in data['pages']]:
        subprocess.run(['magick',str(src/art['master']),'-strip','-quality','88',str(folder/'pages'/f'{key}.jpg')],check=True)
        for d in art['derivatives']: shutil.copy2(src/d['path'],folder/'pages'/d['path'])
    def picture(key,art,lazy=False):
        return f'<picture><source srcset="./pages/{key}.webp" type="image/webp"><img src="./pages/{key}.jpg" alt="{e(art["alt"],quote=True)}" width="1024" height="1536"'+(' loading="lazy"' if lazy else '')+'></picture>'
    title=data['title'];blurb=data['blurb'];url=f'https://www.snackpackuniverse.com/read/{slug}/'
    schema={'@context':'https://schema.org','@type':'Book','name':title,'author':{'@type':'Organization','name':'SnackPack Studios'},'isAccessibleForFree':True,'educationalLevel':'Read together','learningResourceType':'Illustrated picture book','image':url+'pages/cover.jpg','url':url,'inLanguage':'en-GB','bookFormat':'https://schema.org/EBook','numberOfPages':24,'typicalAgeRange':'4-8','encoding':{'@type':'MediaObject','encodingFormat':'application/pdf','contentUrl':url+slug+'.pdf'}}
    head=f'<!DOCTYPE html><html lang="en-GB"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(title)} | Free Christmas Picture Book</title><meta name="description" content="{e(blurb,quote=True)}"><link rel="canonical" href="{url}"><meta property="og:title" content="{e(title,quote=True)}"><meta property="og:description" content="{e(blurb,quote=True)}"><meta property="og:url" content="{url}"><meta property="og:type" content="book"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/assets/favicon-32.png"><link rel="stylesheet" href="/assets/fonts/fonts.css"><link rel="stylesheet" href="../../site.css"><script type="application/ld+json">{json.dumps(schema,ensure_ascii=False,separators=(',',':'))}</script>'+theme+'</head>'
    hero=f'<section class="story-title-section"><div class="shell story-title-grid"><div><span class="eyebrow">Christmas picture book · Free</span><h1>{e(title)}</h1><p class="lead">{e(blurb)}</p><div class="tag-row"><span class="tag">Ages 4–8 · Read together</span><span class="tag">24 story pages</span></div><a class="btn btn-primary" href="#page-1">Begin the story</a><!-- read-share-top:generated --><!-- /read-share-top:generated --></div>{picture("cover",data["cover"])}</div></section>'
    cards=''.join(f'<article class="story-page-card" id="page-{p["number"]}">{picture("p"+str(p["number"]).zfill(2),p["art"],True)}<div class="story-page-copy"><span>Page {p["number"]} of 24</span><p>{e(p["text"])}</p></div></article>\n' for p in data['pages'])
    finish=f'<section><div class="shell story-finish-card"><span class="eyebrow">The end · Thank you for reading</span><h2>Share another story</h2><p>A SnackPack original picture book, free to read together.</p><!-- read-next:generated --><!-- /read-next:generated --><div class="stack-inline"><a class="btn btn-secondary" href="./{slug}.pdf" download>Print this book (PDF)</a><a class="btn btn-secondary" href="../">Back to the bookshelf</a></div></div></section>'
    (folder/'index.html').write_text(head+'<body class="story-reader-page"><header class="topbar">'+header+'</header><main>'+hero+'<section class="story-pages" aria-label="Story pages"><div class="shell">'+cards+'</div></section>'+finish+'</main>'+tail,encoding='utf-8')
(ROOT/'data/web-originals.json').write_text(json.dumps(registry,indent=2)+'\n',encoding='utf-8')
print('Imported',len(registry),'web-original books')

web_path=ROOT/'data/web-books.json'
web=json.loads(web_path.read_text(encoding='utf-8'))
for slug,loc in registry.items():
    d=json.loads((ROOT/loc).read_text(encoding='utf-8'))
    entry={'id':'web-christmas-'+d['id'],'title':d['title'],'art':['docs/christmas-picture-books-2026/'+d['id']+'/'+a['master'] for a in [d['cover']]+[p['art'] for p in d['pages']]],'pages':[{'text':p['text']} for p in d['pages']]}
    web['books']=[b for b in web['books'] if b['id']!=entry['id']]+[entry]
web_path.write_text(json.dumps(web,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
