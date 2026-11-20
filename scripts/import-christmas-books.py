"""Import reviewed web-original event books, with the original Christmas defaults."""
from pathlib import Path
import argparse, json, html, re, shutil, subprocess
ROOT=Path(__file__).resolve().parent.parent
EVENTS = {
    'thanksgiving': ('Thanksgiving', 'docs/reads-events-bookshelf'),
    'new-year': ('New Year', 'docs/reads-events-bookshelf'),
}
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('source_root', type=Path)
parser.add_argument('--book', nargs=2, metavar=('SOURCE_FOLDER', 'WEB_SLUG'),
                    help='Import just this reviewed book, preserving other registry entries.')
args = parser.parse_args()
SOURCE=args.source_root.resolve()
BOOKS={'nutmeg-tree':'nutmeg-and-the-tree-that-wouldnt-come','vincent-shadow-show':'vincent-van-mouse-and-the-christmas-shadow-show'}
template=(ROOT/'read/hen-berrys-helping-day/index.html').read_text(encoding='utf-8')
header=template.split('<header class="topbar">')[1].split('</header>')[0]
tail=template[template.index('<footer'):].replace('Story from SnackPack Sentences &amp; Spelling.', 'An original SnackPack picture book.').replace('../../privacy/snackpack-3-spelling-sentences/', '../../privacy/')
theme=template[template.index('<!-- pwa:generated -->'):template.index('</head>')]
registry_path=ROOT/'data/web-originals.json'
registry=json.loads(registry_path.read_text(encoding='utf-8')) if registry_path.exists() else {}
selected = [args.book] if args.book else list(BOOKS.items())
e=html.escape


def render_paragraph(text, event):
    value = e(text, quote=False)
    if event != 'christmas':
        value = value.removeprefix('&gt; ')
        value = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', value)
        value = re.sub(r'\*([^*]+)\*', r'<em>\1</em>', value)
    return f'<p>{value}</p>'


def render_question(question):
    prompt = e(question['prompt'], quote=False)
    answer = e(str(question['answer']))
    explanation = e(question['explanation'], quote=False)
    choices = [str(choice) for choice in question['choices']]
    if len(choices) < 2 or len(choices) != len(set(choices)) or str(question['answer']) not in choices:
        parser.error('Each counting question requires distinct choices and an answer among them')
    items = ''.join(f'<li>{e(choice, quote=False)}</li>' for choice in choices)
    return (
        f'<div class="math-question"><p class="math-q"><strong>Count together:</strong> {prompt}</p>'
        f'<ul class="math-choices" data-answer="{answer}" aria-label="Choices">{items}</ul>'
        '<details class="story-answer math-answer"><summary>Show the answer</summary>'
        f'<p><strong>{answer}.</strong> {explanation}</p></details></div>'
    )


for source,slug in selected:
    src=(SOURCE/source).resolve()
    source_folder = src.relative_to(SOURCE).as_posix()
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug):
        parser.error('Invalid web slug')
    data=json.loads((src/'manifest.json').read_text(encoding='utf-8'))
    event = data.get('event', 'christmas')
    if event not in {*EVENTS, 'christmas'}:
        parser.error(f'Unknown book event: {event}')
    event_label = EVENTS[event][0] if event != 'christmas' else 'Christmas'
    if event != 'christmas':
        if not source_folder.startswith(event + '/'):
            parser.error('Use docs/reads-events-bookshelf as the source root for event books')
        if not (src / f'{slug}.pdf').is_file():
            parser.error('A reviewed book PDF is required')
    page_count = data['storyPageCount']
    if [p['number'] for p in data['pages']] != list(range(1, page_count + 1)):
        parser.error('Manifest page order or count is invalid')
    if any(art['status'] != 'accepted' for art in [data['cover'], *(p['art'] for p in data['pages'])]):
        parser.error('All illustration masters must be accepted before import')
    if event != 'christmas' or source_folder != data['id']:
        data['sourceFolder'] = source_folder
    folder=ROOT/'read'/slug; (folder/'pages').mkdir(parents=True,exist_ok=True)
    stored=ROOT/'data/web-originals'/slug; stored.mkdir(parents=True,exist_ok=True)
    shutil.copy2(src/'manuscript.md',stored/'manuscript.md')
    data['publicationStatus']='published';data['webSlug']=slug
    (stored/'manifest.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    registry[slug]=f'data/web-originals/{slug}/manifest.json'
    assets = [('cover', data['cover']), *((f'p{p["number"]:02}', p['art']) for p in data['pages'])]
    for key, art in assets:
        raster = str(src / art['master'])
        jpeg = str(folder / 'pages' / f'{key}.jpg')
        if shutil.which('magick'):
            subprocess.run(['magick', raster, '-strip', '-quality', '88', jpeg], check=True)
        elif event != 'christmas':
            subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '88', raster, '--out', jpeg],
                           check=True, stdout=subprocess.DEVNULL)
        elif not Path(jpeg).is_file():
            parser.error('ImageMagick is required to recreate missing Christmas JPEGs')
    # Install only reviewed printables.
    if event != 'christmas':
        shutil.copy2(src / f'{slug}.pdf', folder / f'{slug}.pdf')
    for _, art in assets:
        for d in art['derivatives']: shutil.copy2(src/d['path'],folder/'pages'/d['path'])
    def picture(key,art,lazy=False):
        cover_title = ' data-print-cover-title' if key == 'cover' and data.get('printCoverTitle') else ''
        return f'<picture><source srcset="./pages/{key}.webp" type="image/webp"><img src="./pages/{key}.jpg" alt="{e(art["alt"],quote=True)}" width="{art["width"]}" height="{art["height"]}"'+cover_title+(' loading="lazy"' if lazy else '')+'></picture>'
    title=data['title'];blurb=data['blurb'];url=f'https://www.snackpackuniverse.com/read/{slug}/'
    age_range = data['ageRange']
    reading_level = data.get('readingLevel', 'Read together')
    chapters = {chapter['firstPage']: chapter['title'] for chapter in data.get('chapters', [])}
    if chapters and (list(chapters) != sorted(chapters) or min(chapters) != 1 or max(chapters) > page_count):
        parser.error('Invalid chapter starts in manifest')
    if event == 'christmas':
        format_label = 'Christmas chapter book' if chapters else 'Christmas picture book'
    else:
        format_label = f'{event_label} picture book' if reading_level == 'Read together' else f'{event_label} story'
    resource_type = 'Illustrated chapter book' if chapters else 'Illustrated picture book'
    chapter_links = ' '.join(f'<a class="read-jump-chip" href="#page-{number}">{e(name)}</a>' for number, name in chapters.items())
    chapter_nav = f'<nav class="read-jump" aria-label="Chapters">{chapter_links}</nav>' if chapters else ''
    schema={'@context':'https://schema.org','@type':'Book','name':title,'author':{'@type':'Organization','name':'SnackPack Studios'},'isAccessibleForFree':True,'educationalLevel':reading_level,'learningResourceType':resource_type,'image':url+'pages/cover.jpg','url':url,'inLanguage':'en-GB','bookFormat':'https://schema.org/EBook','numberOfPages':page_count,'typicalAgeRange':age_range.replace('–', '-'),'encoding':{'@type':'MediaObject','encodingFormat':'application/pdf','contentUrl':url+slug+'.pdf'}}
    schema_json = json.dumps(schema, ensure_ascii=False, separators=(',', ':'))
    head=f'<!DOCTYPE html><html lang="en-GB"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(title)} | Free {format_label.title()}</title><meta name="description" content="{e(blurb,quote=True)}"><link rel="canonical" href="{url}"><meta property="og:title" content="{e(title,quote=True)}"><meta property="og:description" content="{e(blurb,quote=True)}"><meta property="og:url" content="{url}"><meta property="og:type" content="book"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/assets/favicon-32.png"><link rel="stylesheet" href="/assets/fonts/fonts.css"><link rel="stylesheet" href="../../site.css"><script type="application/ld+json">{schema_json}</script>'+theme+'</head>'
    hero=f'<section class="story-title-section"><div class="shell story-title-grid"><div><span class="eyebrow">{format_label} · Free</span><h1>{e(title)}</h1><p class="lead">{e(blurb)}</p><div class="tag-row"><span class="tag">Ages {e(age_range)} · {e(reading_level)}</span><span class="tag">{page_count} story pages</span></div><a class="btn btn-primary" href="#page-1">Begin the story</a><!-- read-share-top:generated --><!-- /read-share-top:generated --></div>{picture("cover",data["cover"])}</div></section>'
    cards = []
    for page in data['pages']:
        number = page['number']
        paragraphs = ''.join(render_paragraph(p, event) for p in re.split(r'\n\s*\n', page['text']))
        artwork = picture(f'p{number:02}', page['art'], True)
        chapter_title = f'<h2>{e(chapters[number])}</h2>' if number in chapters else ''
        question = render_question(page['question']) if 'question' in page else ''
        cards.append(f'<article class="story-page-card" id="page-{number}">{artwork}<div class="story-page-copy"><span>Page {number} of {page_count}</span>{chapter_title}{paragraphs}{question}</div></article>\n')
    finish_copy = 'A SnackPack original picture book, free to read together.' if reading_level == 'Read together' else 'A SnackPack original story, free to read online or print.'
    finish=f'<section><div class="shell story-finish-card"><span class="eyebrow">The end · Thank you for reading</span><h2>Share another story</h2><p>{finish_copy}</p><!-- read-next:generated --><!-- /read-next:generated --><div class="stack-inline"><a class="btn btn-secondary" href="./{slug}.pdf" download>Print this book (PDF)</a><a class="btn btn-secondary" href="../">Back to the bookshelf</a></div></div></section>'
    (folder/'index.html').write_text(head+'<body class="story-reader-page"><header class="topbar">'+header+'</header><main>'+hero+'<section class="story-pages" aria-label="Story pages"><div class="shell">'+chapter_nav+''.join(cards)+'</div></section>'+finish+'</main>'+tail,encoding='utf-8')
registry_path.write_text(json.dumps(registry,indent=2)+'\n',encoding='utf-8')
print('Imported',len(selected),'web-original books')

web_path=ROOT/'data/web-books.json'
web=json.loads(web_path.read_text(encoding='utf-8'))
for _, slug in selected:
    loc = registry[slug]
    d=json.loads((ROOT/loc).read_text(encoding='utf-8'))
    event = d.get('event', 'christmas')
    source_base = EVENTS[event][1] if event != 'christmas' else 'docs/christmas-picture-books-2026'
    entry={'id':f'web-{event}-'+d['id'],'title':d['title'],'art':[source_base+'/'+d.get('sourceFolder', d['id'])+'/'+a['master'] for a in [d['cover']]+[p['art'] for p in d['pages']]],'pages':[{'text':p['text']} for p in d['pages']]}
    for index, previous in enumerate(web['books']):
        if previous['id'] == entry['id']:
            web['books'][index] = entry
            break
    else:
        web['books'].append(entry)
web_path.write_text(json.dumps(web,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
