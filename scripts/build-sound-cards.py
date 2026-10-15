"""Build /read/sound-cards/ (printable phonics cards, one print page per stage).

    python scripts/build-sound-cards.py

Each sheet's letters and words come from the books it links to: the ABCs app's
decodableBooks.ts / curriculum.ts for Stages 1-3, and the Reading Trail books'
target words for the later sheets. Add a sheet by adding an entry to `sets`.
The print CSS block is appended to site.css once, guarded by its comment.
Re-run build-breadcrumbs.mjs afterwards (this rewrites the page's empty block).
See READ-PLAN-2026-10.md.
"""
import os, sys
os.chdir(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
src = open('read/hen-berrys-digraph-dash/index.html', encoding='utf-8').read()
shared = src[src.index('<!-- pwa:generated -->'):src.index('</head>')]
header = src[src.index('<header class="topbar">'):src.index('<main>')].replace('Free illustrated reader', 'Printable sound cards')
U = 'https://www.snackpackuniverse.com/read/sound-cards/'
sets = [
    ("stage-1", "Stage 1", "s a t p i n", "Start here. Six sounds that make dozens of words.",
     [("s", "sit"), ("a", "ant"), ("t", "tap"), ("p", "pan"), ("i", "it"), ("n", "nap")],
     ["sat", "sit", "pin", "pan", "tap", "tip", "tin", "nap", "pat", "taps", "sits", "naps"], ["a", "is", "the", "and"],
     ("pip-sits", "Pip Sits"), ("nan-and-pip", "Nan and Pip")),
    ("stage-2", "Stage 2", "c e h r m d", "Six more sounds, including short e.",
     [("c", "cat"), ("e", "egg"), ("h", "hen"), ("r", "rat"), ("m", "mat"), ("d", "den")],
     ["cat", "hen", "red", "ten", "net", "men", "can", "mad", "ran", "hat", "rat", "pen"], ["a", "is", "the"],
     ("ten-red-hens", "Ten Red Hens"), ("the-cat-and-the-rat", "The Cat and the Rat")),
    ("stage-3", "Stage 3", "g o u l f b", "Short o and short u complete the five short vowels.",
     [("g", "got"), ("o", "on"), ("u", "up"), ("l", "log"), ("f", "fun"), ("b", "bug")],
     ["bug", "mug", "cup", "sun", "fun", "dog", "fog", "log", "hot", "pot", "got", "but"], ["to", "the", "is"],
     ("bug-in-a-cup", "Bug in a Cup"), ("dog-in-the-fog", "Dog in the Fog")),
    ("digraphs", "Next step", "sh ch th wh", "Two letters, one sound.",
     [("sh", "shop"), ("ch", "chick"), ("th", "thin"), ("wh", "whisk")],
     ["shop", "shell", "dish", "fish", "rush", "chick", "chat", "much", "thin", "path", "with", "which"], ["the", "two"],
     ("hen-berrys-digraph-dash", "Hen-Berry’s Digraph Dash"), None),
    ("blends", "Reading Trail step 3", "bl cr dr fl st", "Two consonants side by side, and you can hear both.",
     [("fl", "flag"), ("cr", "crab"), ("dr", "drum"), ("fr", "frog"), ("st", "step"), ("pl", "plant")],
     ["flag", "crab", "drum", "frog", "step", "stop", "clap", "plant", "help", "best", "grip", "lift"], [],
     ("stripe-scouts-blend-bridge", "Stripe-Scout’s Blend Bridge"), None),
    ("magic-e", "Reading Trail step 4", "a_e i_e o_e u_e", "A silent e at the end makes the vowel say its name.",
     [("a_e", "tape"), ("i_e", "kite"), ("o_e", "note"), ("u_e", "cube")],
     ["kite", "note", "home", "hope", "wave", "cube", "tape", "rope", "cape", "gate", "safe", "line"], [],
     ("sub-zeros-magic-e-lantern", "Sub-Zero’s Magic-E Lantern"), None),
    ("vowel-teams", "Reading Trail step 5", "ai ee oa ea", "Two vowels team up to make one long sound.",
     [("ai", "rain"), ("ee", "green"), ("oa", "boat"), ("ea", "beat")],
     ["rain", "mail", "paint", "green", "sheet", "meet", "sweet", "boat", "coat", "road", "beat", "team"], [],
     ("meow-inaras-vowel-team-duet", "Meow-inara’s Vowel-Team Duet"), None),
    ("endings", "Reading Trail step 6", "-s -ing -ed -er", "Add an ending to a word you know. Clap the beats.",
     [("-s", "endings"), ("-ing", "jumping"), ("-ed", "painted"), ("-er", "faster")],
     ["jumping", "painted", "faster", "reader", "calling", "helping", "resting", "looking", "growing", "endings", "runner", "missing"], [],
     ("quill-berrys-ending-clues", "Quill-Berry’s Ending Clues"), None),
]
N = {4: "four", 8: "eight"}[len(sets)]
sec = []
for sid, label, letters, intro, sounds, words, tricky, b1, b2 in sets:
    books = f'<a class="text-link" href="../{b1[0]}/">{b1[1]}</a>'
    if b2:
        books += f' and <a class="text-link" href="../{b2[0]}/">{b2[1]}</a>'
    s_cards = ''.join(f'<li class="card card-sound"><span class="card-big">{g}</span><span class="card-hint">as in {w}</span></li>' for g, w in sounds)
    w_cards = ''.join(f'<li class="card card-word">{w}</li>' for w in words)
    t_cards = ''.join(f'<li class="card card-tricky">{w}</li>' for w in tricky)
    sec.append(
        f'<section class="sound-sheet" id="{sid}" aria-labelledby="{sid}-h"><div class="shell">\n'
        f'<div class="sound-sheet-head"><span class="eyebrow">{label}</span><h2 id="{sid}-h">{letters}</h2><p>{intro} Read them in {books}.</p></div>\n'
        f'<h3>Sound cards</h3><ul class="card-grid">{s_cards}</ul>\n'
        f'<h3>Word cards</h3><ul class="card-grid card-grid-words">{w_cards}</ul>\n'
        + (f'<h3>Tricky words <span class="h3-note">read these together; they can’t be sounded out yet</span></h3><ul class="card-grid card-grid-words">{t_cards}</ul>\n' if tricky else '')
        + f'<p class="sheet-foot">snackpackuniverse.com/read/sound-cards</p>\n'
        f'</div></section>')
ld = ('{"@context":"https://schema.org","@type":"LearningResource","name":"Free printable phonics sound cards",'
      '"isAccessibleForFree":true,"educationalLevel":"Beginning reader","learningResourceType":"Flash cards",'
      '"teaches":"Letter sounds s a t p i n, c e h r m d, g o u l f b the digraphs sh, ch, th, wh, consonant blends, magic e, vowel teams and word endings",'
      '"inLanguage":"en","url":"' + U + '","publisher":{"@type":"Organization","name":"SnackPack Studios"}}')
html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Free Printable Phonics Sound Cards | s a t p i n to Vowel Teams</title>
<meta name="description" content="Free printable phonics flash cards: sound cards, word cards and tricky-word cards for s a t p i n through digraphs, blends, magic e, vowel teams and word endings. One A4 sheet per stage, matched to free decodable readers.">
<link rel="canonical" href="{U}">
<meta property="og:title" content="Free printable phonics sound cards"><meta property="og:description" content="Sound, word and tricky-word cards for each phonics stage, matched to free decodable readers."><meta property="og:image" content="https://www.snackpackuniverse.com/read/social-card.png"><meta property="og:url" content="{U}"><meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon-32.png"><link rel="preload" href="/assets/fonts/dmsans-ed656a5d.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/assets/fonts/fraunces-36024e18.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/assets/fonts/fonts.css"><link rel="stylesheet" href="../../site.css">
<script type="application/ld+json">{ld}</script>
<!-- breadcrumbs:generated -->
<!-- /breadcrumbs:generated -->
{shared}</head>
<body class="sound-cards-page">
{header}<main>
<section class="read-hub-hero sound-cards-hero"><div class="shell"><span class="eyebrow">Free printables</span><h1>Phonics sound cards</h1><p class="lead">Sound cards, word cards and tricky-word cards for every stage on the bookshelf, from s a t p i n to vowel teams and word endings. Each stage prints on its own A4 or Letter sheet. Cut along the dashed lines.</p><div class="stack-inline"><button class="btn btn-primary" type="button" onclick="window.print()">Print all {N} sheets</button><a class="btn btn-secondary" href="../">Back to the bookshelf</a></div><p class="sound-cards-tip">Want only one stage? In the print dialogue, choose just that page: each stage is one page, in bookshelf order.</p></div></section>
{chr(10).join(sec)}
<section class="sound-cards-howto"><div class="shell"><h2>Three quick games</h2><ul><li><strong>Sound it out:</strong> lay three sound cards in a row to build a word, then read it by sliding a finger under the letters.</li><li><strong>Find the book word:</strong> hold up a word card and look for it in the matching book.</li><li><strong>Tricky-word snap:</strong> tricky words are learned by sight, so a quick game of snap works better than sounding out.</li></ul><p>Not sure why the sounds come in this order? Read <a class="text-link" href="../../guides/phonics-sound-order-satpin/">what order phonics sounds are taught in</a>.</p></div></section>
</main>
<footer class="foot"><div class="shell foot-wrap"><p class="foot-note">Free printables from SnackPack Studios.</p><div class="footer-links"><a class="text-link" href="../">Bookshelf</a><a class="text-link" href="../../privacy/">Privacy</a></div></div></footer>
  <!-- Cloudflare Web Analytics -->
  <script defer src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{{"token": "0e57cfb3eb86422ca40e5fac02b1cf94"}}'></script>
  <!-- End Cloudflare Web Analytics -->
</body></html>
'''
os.makedirs('read/sound-cards', exist_ok=True)
open('read/sound-cards/index.html', 'w', encoding='utf-8', newline='').write(html)

css = ('\n/* /read/sound-cards/ printable phonics cards */\n'
       '.sound-cards-hero{padding-bottom:40px}.sound-cards-tip{margin-top:14px;color:var(--muted)}'
       '.sound-sheet{padding:48px 0;border-top:1px solid var(--line)}'
       '.sound-sheet-head h2{margin:6px 0 8px;font-family:var(--serif);font-size:clamp(2.4rem,6vw,4rem);letter-spacing:.08em}'
       '.sound-sheet-head p{max-width:680px;color:var(--muted);line-height:1.6}'
       '.sound-sheet h3{margin:28px 0 12px;font-size:1.05rem}.h3-note{font-weight:400;color:var(--muted);font-size:.9rem}'
       '.card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin:0;padding:0;list-style:none}'
       '.card-grid-words{grid-template-columns:repeat(auto-fill,minmax(130px,1fr))}'
       '.card{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:120px;padding:12px;border:2px dashed var(--line-strong);border-radius:16px;background:var(--surface-strong);color:var(--ink);text-align:center}'
       '.card-big{font-family:var(--serif);font-size:4rem;line-height:1;font-weight:700}.card-hint{margin-top:8px;color:var(--muted);font-size:.85rem}'
       '.card-word,.card-tricky{min-height:84px;font-family:var(--serif);font-size:2rem;font-weight:700}'
       '.card-tricky{border-style:dotted}.sheet-foot{display:none}'
       '.sound-cards-howto{padding:48px 0}.sound-cards-howto ul{line-height:1.7}'
       '@media print{.sound-cards-page .topbar,.sound-cards-page .foot,.sound-cards-hero,.sound-cards-howto{display:none!important}'
       '.sound-cards-page,.sound-cards-page main{background:#fff!important;color:#000!important}'
       '.sound-sheet{break-after:page;page-break-after:always;padding:0;border:0}.sound-sheet:last-of-type{break-after:auto}'
       '.sound-sheet .shell{max-width:none;padding:0}.sound-sheet-head p{color:#333!important}.sound-sheet a{color:#000!important}'
       '.card{background:#fff!important;color:#000!important;border-color:#777!important;break-inside:avoid;min-height:28mm}'
       '.card-big{font-size:44pt}.card-word,.card-tricky{font-size:22pt;min-height:18mm}.card-hint,.h3-note{color:#444!important}'
       '.card-grid,.card-grid-words{grid-template-columns:repeat(4,1fr);gap:3mm}'
       '.sound-sheet h3{margin:4mm 0 2mm}.sheet-foot{display:block;margin-top:4mm;font-size:9pt;color:#555!important}'
       '@page{size:auto;margin:12mm}}\n')
s = open('site.css', encoding='utf-8').read()
if '/read/sound-cards/ printable phonics cards' not in s:
    open('site.css', 'w', encoding='utf-8', newline='').write(s.rstrip('\n') + '\n' + css)
print('ok')
