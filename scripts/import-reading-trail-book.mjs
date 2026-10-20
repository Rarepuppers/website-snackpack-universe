// Imports a Reading Trail book from SnackPack Sentences & Spelling into /read/.
//
// Nothing here generates art or prose. Titles, page text, prompts and the quiz
// all come from apps/snackpack-3-spelling-sentences/constants/reading-trail-drafts.ts,
// and the page art from that app's assets/book-page-art/. What lives here is
// only the web editorial that has no source in the app: the page alt text
// (written from the actual illustrations, which sometimes differ in detail
// from the story text) and a one-line lead. See READ-PLAN-2026-10.md.
//
// Usage (from the website repo root):
//   node scripts/import-reading-trail-book.mjs --id=stripe-scout-blend-bridge          # dry run
//   node scripts/import-reading-trail-book.mjs --id=stripe-scout-blend-bridge --write
//   node scripts/import-reading-trail-book.mjs --all --write
//
// Then: build-webp, build-read-pdfs --slug=<slug> --write, add the book to
// SHELF in build-read-shelf.mjs, build-read-shelf, build-breadcrumbs,
// build-play-links, build-go-links, build-sitemap.
//
// Mark approved publishing Reading Trail steps 3-6 (Pro in the app) on the
// free web shelf on 2026-10-15. Any other Pro book still needs his approval.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP = path.resolve(ROOT, "../apps/snackpack-3-spelling-sentences");
const SITE = "https://www.snackpackuniverse.com";
const PLAY = "https://play.google.com/store/apps/details?id=com.snackpackuniverse.sentencesspelling";

// Per-book web editorial. `slug` is the public URL; `alts` describe the art.
const BOOKS = {
  "pork-ulele-picnic-song": {
    source:"short", slug:"pork-uleles-picnic-song", skill:"Music", revisions:{3:2},
    lead:"A four-page picnic concert about listening to different ideas and making a song together.",
    blurb:"Pork-ulele wants his tune played his way. A slow melody and a fast beat change his mind.",
    about:"Music, listening and collaboration",
    alts:["Pork-ulele tunes his ukulele beside a music stand on a sunny picnic blanket.","Pork-ulele pauses as Coop-Accino sings and Octo-Pop taps two splashing buckets.","Pork-ulele plays his ukulele, Coop-Accino sings and Octo-Pop taps blue and orange buckets as they listen to one another.","Pork-ulele, Coop-Accino and Octo-Pop share their song as two birds join in above the picnic."]
  },
  "captain-beakon-air-show": {
    source:"short", slug:"captain-beakons-air-show", skill:"Teamwork",
    lead:"A four-page air-show rescue about a lost ribbon and helpers in the sky and on the ground.",
    blurb:"A red-and-gold ribbon drifts toward the river. Four cycling Bulldogs guide Stripe-Scout to the rescue.",
    about:"Teamwork and communication",
    alts:["Captain Beakon reaches from his red plane as a red-and-gold ribbon tears free above a river valley.","Stripe-Scout reaches from a blue helicopter toward the ribbon drifting over the river.","Four Baby Bulldogs on bicycles point toward the drifting ribbon beneath Stripe-Scout's helicopter.","Stripe-Scout holds the recovered ribbon beside her landed helicopter as the Bulldogs and Captain Beakon wave."]
  },
  "luckybug-art-gallery": {
    source: "short", slug: "luckybugs-art-gallery", skill: "Creativity",
    lead: "A four-page gallery story about an unexpected splash, a new idea and a painting made together.",
    blurb: "A blue splash ruins Luckybug's perfect sky - until her friends see a river in it.",
    about: "Creativity, adapting plans and sharing credit",
    alts: [
      "Luckybug mixes orange paint on a palette beneath the gallery's empty centre frame.",
      "Quill-Berry holds Ted's portrait beside a sunset canvas as blue paint splashes across it.",
      "Luckybug, Quill-Berry and Flutter-Butter turn the blue splash into a river through a moonlit town.",
      "Gallery visitors admire the finished river painting with Luckybug, Quill-Berry and Flutter-Butter."
    ]
  },
  "corgi-on-the-cob-countryside": {
    source: "short", slug: "corgi-on-the-cobs-countryside-run", skill: "Kindness",
    lead: "A four-page countryside race about a caught ribbon and a friend worth turning back for.",
    blurb: "Corgi takes the lead, then hears Ginger's ribbon snag. Winning can wait.",
    about: "Friendship, helping and choosing what matters",
    alts: [
      "Corgi-on-the-Cob and Ginger-Deer run through a farm gate beneath a hilltop windmill.",
      "Corgi clears a low fence while Ginger-Deer's pink race ribbon catches on a wooden splinter.",
      "Corgi returns to the fence and takes Ginger's caught ribbon gently in his mouth.",
      "Corgi rests laughing on a woven mat beside Ginger-Deer, whose pink ribbon is free."
    ]
  },

  // Step 1 was hand-built in August; the app rewrote its text afterwards, so it
  // now imports like the others (2026-10-15) and cannot drift again.
  "ted-short-vowel-kit": {
    slug: "ted-e-bears-short-vowel-kit",
    skill: "Short vowels",
    lead: "A five-page den-building story for practising short-vowel words like box, rug, map, peg and cup.",
    blurb: "A box, a rug, a map and a cup: Ted-E-Bear builds a den one short-vowel word at a time.",
    about: "CVC words with short vowels a, e, i, o and u",
    pattern: /^[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnpqrstvwxz]s?$/,
    stop: ["his", "has", "is", "it", "can", "on", "in", "of", "and", "the", "ted", "put"],
    alts: [
      "Ted-E-Bear kneels beside a big cardboard box, with a red rug and a map on the floor.",
      "The box tips onto the rug and the map slides into a gap in the floorboards.",
      "Ted props the box up with a small cup to make the walls of his den.",
      "Ted pegs the map to the den wall and kneels on the rug.",
      "Ted sits inside his finished den on the red rug, reading a book.",
    ]
  },
  "hen-berry-digraph-dash": {
    slug: "hen-berrys-digraph-dash",
    skill: "Digraphs",
    lead: "A five-page foggy-night adventure where two letters share one sound: sh, ch, th and wh.",
    blurb: "Fog hides the path home. A shell, a fish and a few sh, ch, th and wh words lead the way.",
    about: "sh, ch, th and wh digraphs",
    pattern: /sh|ch|th|wh/,
    stop: ["the", "they", "them"],
    alts: [
      "Hen-Berry closes her shop for the night while the chick sweeps beside her.",
      "Hen-Berry and the chick wonder which way to go as thick fog covers two paths.",
      "Hen-Berry points out a small shell lying on the narrow track by the pond.",
      "Hen-Berry and the chick hurry past the pond as a friendly fish pops up to say hello.",
      "The chick hugs Hen-Berry outside the shed at sunset."
    ]
  },
  "stripe-scout-blend-bridge": {
    slug: "stripe-scouts-blend-bridge",
    skill: "Consonant blends",
    lead: "A five-page bridge-building adventure for practising blends like fl, cr, dr, st and pl.",
    blurb: "A branch blocks the bridge. A frog, a crab and a lot of blends help Stripe-Scout lift it.",
    about: "Initial and final consonant blends",
    pattern: /^(bl|br|cl|cr|dr|fl|fr|gl|gr|pl|pr|sc|sk|sl|sm|sn|sp|st|str|sw|tr)|(st|nt|mp|nd|lp|ft|sk)s?$/,
    alts: [
      "Stripe-Scout the tiger holds a compass on a wooden bridge blocked by a fallen branch.",
      "Stripe-Scout tugs at the branch while a frog and a crab come to help.",
      "The frog, Stripe-Scout and the crab lift the branch high above the bridge planks.",
      "Stripe-Scout holds a flag while the frog taps a drum and the crab dances.",
      "The three friends hold up a sign in front of the bridge, with a flag flying behind them."
    ]
  },
  "sub-zero-magic-e-lantern": {
    slug: "sub-zeros-magic-e-lantern",
    skill: "Magic e",
    lead: "A five-page snowy rescue for practising silent-e words like kite, note, rope and home.",
    blurb: "A lost note, a runaway kite and a lantern made from tape, rope and a red cape.",
    about: "Silent-e (split digraph) vowel changes",
    pattern: /(^|[^aeiou])[aeiou][^aeiouwy]es?$/,
    stop: ["becomes", "message"],
    alts: [
      "Sub-Zero the penguin ties a note to a kite in the falling snow.",
      "The kite dives away on the wind and the note flutters past a large ice cube.",
      "Sub-Zero ties rope around a lantern frame next to a red cape and a roll of tape.",
      "Sub-Zero holds a glowing lantern by a snowy stone gate, lighting the path home.",
      "Sub-Zero walks a glowing path as a rabbit, an otter and a squirrel wave hello."
    ]
  },
  "meow-inara-vowel-team-duet": {
    slug: "meow-inaras-vowel-team-duet",
    skill: "Vowel teams",
    lead: "A five-page rainy-night duet for practising vowel teams: ai, ee, oa and ea.",
    blurb: "The music never arrives, so Meow-inara listens, paints the beat and plays anyway.",
    about: "Vowel teams ai, ee, oa and ea",
    pattern: /ai|ee|oa|ea/,
    alts: [
      "Meow-inara the cat waits with a basket by a green gate in the rain.",
      "Pork-ulele plays a ukulele in a small boat on the canal while Meow-inara watches from the gate.",
      "Meow-inara paints three curved sound marks on paper beside pots of paint.",
      "Meow-inara sings into a microphone as Pork-ulele plays under the full moon.",
      "Meow-inara holds up her painted music sheet beside Pork-ulele and his ukulele."
    ]
  },
  "quill-berry-ending-clues": {
    slug: "quill-berrys-ending-clues",
    skill: "Word endings",
    lead: "A five-page library puzzle for practising endings like -ing, -ed and -er, and clapping two-beat words.",
    blurb: "A poem has lost its endings. Quill-Berry adds -ing, -ed and -er and claps the beats.",
    about: "Inflectional endings -ing, -ed, -er and two-syllable words",
    pattern: /^.{2,}(ing|ings|ed|er)$/,
    stop: ["together"],
    alts: [
      "Quill-Berry the hedgehog looks surprised at an open book with blank spaces and a quill pen.",
      "Quill-Berry lines up word cards on a library desk beside an open storybook.",
      "Quill-Berry runs alongside a turtle as two bouncing balls show the beats in a word.",
      "Quill-Berry and a child clap together on a patterned library floor.",
      "Quill-Berry points to a giant open book with one page left blank for the next reader."
    ]
  },

  // ── Short reads (books.ts), chosen 2026-10-15 from all 60 free quick reads ──
  // Rejected and why: see READ-PLAN-2026-10.md (Phase B2). Five more passed
  // both reads and are held in reserve until the 2026-11-15 re-measure:
  // pita-pan-mountain-climb, octo-pop-coral-reef, luckybug-art-gallery,
  // corgi-on-the-cob-countryside, shelly-pop-slow-and-steady.
  "baby-bulldogs-playground": {
    rev: 2, // page art redrawn 2026-10-17 (ac798997c)
    source: "short", slug: "baby-bulldogs-at-the-playground", skill: "Friendship",
    lead: "A four-page playground story about a shy puppy and a welcome that needs no words.",
    blurb: "A quiet puppy, a red ball and a chalk-line game that lets everyone join in.",
    about: "Friendship and inclusion",
    alts: [
      "A small bulldog puppy sits alone beside a red ball while three Baby Bulldogs play behind.",
      "Two Baby Bulldogs talk excitedly to the quiet puppy, who sits facing away.",
      "Luckybug draws a chalk line with a star at each end while three Baby Bulldogs wait at one end and the shy puppy sits by the red ball at the other.",
      "The new puppy runs and plays with the Baby Bulldogs, chasing the red ball."
    ]
  },
  "fe-line-mignon-moonlit-cafe": {
    rev: 2, // page art redrawn 2026-10-17 (ac798997c)
    source: "short", slug: "fe-line-mignons-moonlit-cafe", skill: "Kindness",
    lead: "A four-page story about a full café and a new kitten who finds a place at the table.",
    blurb: "Every table is full, so the guests make one long table with room for a shy new kitten.",
    about: "Kindness and making room for others",
    alts: [
      "Fe-Line-Mignon lights candles on the café tables while a small grey kitten sits alone by the window.",
      "Meow-inara carries a tray of croissants past full tables as the kitten watches.",
      "The café guests have joined their tables into one long curve, and the kitten sits in the open place in the middle.",
      "Fe-Line-Mignon gives the kitten a glowing candle by the window."
    ]
  },
  "octo-pop-ocean-adventure": {
    source: "short", slug: "octo-pops-ocean-adventure", skill: "Friendship",
    lead: "A four-page undersea story about a shy swimmer, a runaway shell and a seat saved for a friend.",
    blurb: "A wave steals the welcome shell, and the shyest swimmer is the fastest to bring it back.",
    about: "Shyness, courage and friendship",
    alts: [
      "Octo-Pop sets out a coral picnic while Cereal-Swimmer peeks out from behind a rock.",
      "A swirling current carries a pink shell away from Octo-Pop's picnic.",
      "Cereal-Swimmer races after the shell towards a deep trench as Bottle-Nose the dolphin clicks directions.",
      "Octo-Pop, Cereal-Swimmer and Bottle-Nose share the picnic together."
    ]
  },
  "hen-berry-helping-day": {
    source: "short", slug: "hen-berrys-helping-day", skill: "Kindness",
    lead: "A four-page story about spilled berries and the difference between giving advice and really helping.",
    blurb: "Hen-Berry's basket breaks. Ted-E-Bear has advice; Wise Owl listens first.",
    about: "Helping and listening",
    alts: [
      "Hen-Berry holds an armful of berries as more spill from a tipped basket.",
      "Ted-E-Bear points and offers advice while Hen-Berry's wings are full of berries.",
      "Wise Owl leans in to listen as Ted gathers berries into a bowl.",
      "Hen-Berry, Ted and Wise Owl each carry a small bowl of berries."
    ]
  },
  "stripe-scout-trail": {
    source: "short", slug: "stripe-scouts-trail-clues", skill: "Adventure",
    lead: "A four-page trail adventure about a map, a clue and choosing the path that leaves no friend behind.",
    blurb: "A short muddy path or a long starry one? A clue helps Stripe-Scout choose.",
    about: "Teamwork and making choices",
    alts: [
      "Stripe-Scout the tiger and Snack-Spector study a map at a fork in a forest trail.",
      "Snack-Spector points to a clue beside a wooden post marked with a star.",
      "Stripe-Scout and Snack-Spector cross a wobbly rope bridge over a stream.",
      "The two friends stand by a picnic under a bright rainbow."
    ]
  },
  "lionnaise-dragon-quest": {
    source: "short", slug: "lionnaise-and-the-dragon", skill: "Adventure",
    lead: "A four-page fairy-tale adventure in which the bravest thing Lionnaise does is ask a kind question.",
    blurb: "A dragon blocks the bridge, and Lionnaise answers with an invitation instead of a roar.",
    about: "Courage and kindness",
    alts: [
      "Lionnaise walks through an enchanted forest holding a golden invitation and her crown.",
      "A big green dragon blocks a stone bridge, looking worried rather than fierce.",
      "Lionnaise holds up her crown and the invitation as the dragon leans down to listen.",
      "Lionnaise rides on the dragon's back above the sparkling treetops."
    ]
  },
  "polly-roger-pirate-cove": {
    source: "short", slug: "polly-rogers-pirate-cove", skill: "Adventure",
    lead: "A four-page pirate adventure about buried gold and a lighthouse that guides everyone home.",
    blurb: "A chest full of gold, and Polly Roger spends it on the one thing the whole cove needs.",
    about: "Generosity and community",
    alts: [
      "Polly Roger the parrot looks out from the ship's mast towards a dark lighthouse.",
      "Polly dreams of a mountain of crackers while Captain Beakon studies a treasure map.",
      "Polly and Captain Beakon dig at the X on the rocky shore as the sun sets.",
      "Polly holds up a gold coin beside the open chest as the repaired lighthouse shines."
    ]
  },
  "ham-and-cheese-maze": {
    source: "short", slug: "ham-and-cheeses-big-maze", skill: "Kindness",
    lead: "A four-page maze story about a record attempt and a lost little mouse.",
    blurb: "Ham-and-Cheese could beat his fastest time, or he could help a lost mouse find the way out.",
    about: "Helping others",
    alts: [
      "Ham-and-Cheese the hamster, in golden armour, runs into a cardboard maze.",
      "Ham-and-Cheese finds a small grey mouse hiding behind a cardboard flap.",
      "Ham-and-Cheese walks the mouse along a corridor, away from a ribbon of cheesy smell.",
      "Ham-and-Cheese and the mouse share a wedge of cheese at the centre of the maze."
    ]
  },
  "foxy-lox-mystery-trail": {
    source: "short", slug: "foxy-loxs-mystery-trail", skill: "Mystery",
    lead: "A four-page mystery: a forgotten picnic basket, a trail of crumbs and a kind explanation.",
    blurb: "A hoof print, a split crumb trail and a lost badge lead Foxy-Lox to the answer before the storm.",
    about: "Clues, reasoning and kindness",
    alts: [
      "Foxy-Lox looks at a small hoof print beside an uncollected picnic basket under stormy skies.",
      "Foxy follows a trail of crumbs to the place where the path divides.",
      "Foxy searches behind a mossy log on the forest floor.",
      "Foxy holds a picnic blanket over Ginger-Deer, who is planting seedlings in the rain."
    ]
  },
  "nutmeg-garden-morning": {
    source: "short", slug: "nutmegs-garden-morning", skill: "Nature",
    lead: "A four-page garden story about a seed, a lot of waiting and growth you cannot see.",
    blurb: "Nutmeg checks her seed before lunch, after lunch and every day until the seventh morning.",
    about: "Seeds, growing and patience",
    alts: [
      "Nutmeg the squirrel plants a seed in a garden bed with a small trowel.",
      "Hen-Berry kneels beside Nutmeg to cover the soil again.",
      "A green sprout pokes up from the soil next to Nutmeg and a watering can.",
      "Nutmeg sits happily in her small garden of young plants at sunset."
    ]
  },
  "captain-beakon-star-watch": {
    source: "short", slug: "captain-beakons-star-watch", skill: "Night sky",
    lead: "A four-page night-sky story about clouds, patience and spotting a planet beside the moon.",
    blurb: "Clouds hide the sky, so Captain Beakon and Luckybug give it five patient minutes.",
    about: "The night sky and patience",
    alts: [
      "Captain Beakon carries his telescope up a hill at dusk as clouds roll in.",
      "Luckybug points to a gap in the clouds while Captain Beakon sets up the telescope.",
      "Captain Beakon looks through the telescope as the sky clears beside a crescent moon.",
      "Captain Beakon and Luckybug sit together on the hilltop under the stars."
    ]
  },
  "ted-blanket-fort": {
    "source": "short",
    "rev": 2,
    "slug": "ted-e-bears-blanket-fort",
    "skill": "Friendship",
    "lead": "A four-page reading-fort story about a collapsing blanket and making room for a friend.",
    "blurb": "A blue blanket keeps sliding down. Panda-Cake helps Ted make a fort with room for two.",
    "about": "Cooperation, friendship and sharing",
    "alts": [
      "Ted-E-Bear, wearing his flower crown, halo and bee apron, stacks pillows between two chairs beside a folded blue blanket.",
      "Ted sits under a heap of blue blanket after his fort collapses.",
      "Panda-Cake holds the blue blanket while Ted sits beneath it with a lamp and an open book.",
      "Ted and Panda-Cake read together inside their warm blue-blanket fort as rain falls outside."
    ]
  },
  "wise-owl-library-day": {
    "source": "short",
    "rev": 2,
    "slug": "wise-owls-library-day",
    "skill": "Kindness",
    "lead": "A four-page library story about a windblown poem and choosing when to share your work.",
    "blurb": "A gust carries Quill-Berry’s poem away. Meow-inara offers one friendly listener.",
    "about": "Respect, confidence and sharing creative work",
    "alts": [
      "Wise Owl welcomes Quill-Berry, who holds a folded page, at the leafy library door.",
      "A sheet of paper lies on the floor beneath a library table while Quill-Berry looks worried.",
      "Meow-inara, a round tabby with a red pendant, returns a folded page to Quill-Berry in a quiet library corner.",
      "Quill-Berry shares her writing with Wise Owl, Meow-inara and a circle of listeners beside a blank display page."
    ]
  },
  "meow-inara-moonlight": {
    "source": "short",
    "rev": 2,
    "slug": "meow-inaras-moonlight-story",
    "skill": "Feelings",
    "lead": "A four-page bedtime story about concert nerves, slow breathing and a first note that can wobble.",
    "blurb": "Tomorrow’s concert keeps Meow-inara awake. Wise Owl finds a story with room for an imperfect first note.",
    "about": "Managing anticipation, breathing and accepting mistakes",
    "alts": [
      "Meow-inara, a round tabby wearing her red pendant, lies awake on plum cushions by a moonlit window.",
      "Wise Owl reads a bedtime book beside Meow-inara on the window seat.",
      "Meow-inara rests beside an open book, looking calmer in the warm lantern light.",
      "Meow-inara sleeps on the plum cushions beneath the moonlit window, her red pendant resting at her chest."
    ]
  },
  "centi-peed-garden-race": {
    "source": "short",
    "rev": 2,
    "slug": "centi-peeds-garden-race",
    "skill": "Kindness",
    "lead": "A four-page garden race about stopping to help a friend when a ribbon is within reach.",
    "blurb": "Centi-Peed races ahead, then hears Shelly-Pop call. Helping her matters more than winning.",
    "about": "Helping others, kindness and sportsmanship",
    "alts": [
      "Centi-Peed, a brown centipede in a horned helmet, ties his red racing boots beside Shelly-Pop on a flower-lined path.",
      "Wise Owl claps as Centi-Peed races ahead of Shelly-Pop and two small garden friends.",
      "Centi-Peed stops beside Shelly-Pop, whose race tag is caught under a fallen twig near the roses.",
      "Centi-Peed and Shelly-Pop dance across the finish behind a bee and a ladybird holding their ribbons."
    ]
  },
  "pita-pan-mountain-climb": {
    "source": "short",
    "rev": 2,
    "slug": "pita-pans-mountain-climb",
    "skill": "Friendship",
    "lead": "A four-page mountain adventure about a frightened climber, a blue rope and a summit reached together.",
    "blurb": "Pita-Pan wants to climb alone. Helping a younger goat changes what reaching the summit means.",
    "about": "Cooperation, listening and helping a frightened friend",
    "alts": [
      "Pita-Pan ties a blue climbing rope on a rocky ledge beneath a distant summit bell.",
      "Pita-Pan anchors the blue rope beside a worried younger goat on a narrow ledge.",
      "The younger goat points towards the sound of a bell through cloud while Pita-Pan holds their rope.",
      "The two goats stand together beside the summit bell above a golden valley."
    ]
  },
  "octo-pop-coral-reef": {
    "source": "short",
    "rev": 2,
    "slug": "octo-pops-coral-reef",
    "skill": "Teamwork",
    "lead": "A four-page reef rescue about eight strong arms, tiny helpers and a pearl passed from fin to fin.",
    "blurb": "Octo-Pop holds the reef steady. A chain of tiny fish retrieves the light he cannot reach.",
    "about": "Teamwork and different kinds of strength in a fantasy reef rescue",
    "alts": [
      "Octo-Pop, a purple octopus with an orange star, meets tiny fish beside fallen coral blocking a reef arch.",
      "Octo-Pop carries two stones while steadying the coral; helmeted Cereal-Swimmer arrives with a glowing pearl.",
      "Tiny fish form a passing chain towards a glowing pearl in a crack while Octo-Pop holds the coral.",
      "A chain of colourful fish returns the glowing pearl through the cleared reef arch."
    ]
  },
  "shelly-pop-slow-and-steady": {
    "source": "short",
    "rev": 2,
    "slug": "shelly-pops-slow-and-steady",
    "skill": "Adventure",
    "lead": "A four-page picnic story about noticing a quiet shortcut before the rain arrives.",
    "blurb": "While everyone hurries, Shelly-Pop notices ants and white pebbles that point to a careful shortcut.",
    "about": "Careful observation, calm thinking and helping at a picnic",
    "alts": [
      "Shelly-Pop stretches beside her basket of berry cakes outside a cottage under gathering clouds.",
      "Shelly-Pop notices ants beside a crack in a wall as other walkers hurry along the wide path.",
      "Shelly-Pop carries her basket along a line of pale pebbles through clover.",
      "Shelly-Pop covers the berry cakes at the picnic as rain begins and the other walkers arrive."
    ]
  },
  "nutmeg-four-seasons": {
    source: "short", slug: "nutmegs-four-seasons", skill: "Nature",
    lead: "A four-page story that follows one little oak tree through spring, summer, autumn and winter.",
    blurb: "One acorn, four seasons and a friend for every one of them.",
    about: "The seasons and caring for living things",
    alts: [
      "In spring, Nutmeg plants an acorn under a blossoming oak tree.",
      "In summer, a line of Baby Bulldogs carries buckets of water to Nutmeg's little shoot.",
      "In autumn, Nutmeg leaves an acorn beside her young tree for a blue jay.",
      "In winter, frost covers the hill and Nutmeg stands beside her small bare tree."
    ]
  }
};

const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const ALL = args.includes("--all");
const ONE = (args.find((a) => a.startsWith("--id=")) || "").slice(5);
const ids = ALL ? Object.keys(BOOKS) : [ONE];
if (!ids[0] || ids.some((id) => !BOOKS[id])) {
  console.error(`Usage: --id=<${Object.keys(BOOKS).join("|")}> or --all; add --write to write.`);
  process.exit(1);
}

// ── Parse the app's TS source ────────────────────────────────────────────
// A regex parse, same reasoning as import-decodable-book.mjs: importing the TS
// would drag in the app's bundler-only require() calls.
const SRC = fs.readFileSync(path.join(APP, "constants/reading-trail-drafts.ts"), "utf8");
// Short reads (2026-10-15): the free four-page stories in books.ts (STORY_BOOKS
// and EXTRA_STORY_BOOKS). Same page shape as the trail, but no trail step or
// target words, art named <id>-pN.jpg, and quizzes without a "why" line.
const SRC_SHORT = fs.readFileSync(path.join(APP, "constants/books.ts"), "utf8");
// Web page-image name. `rev` (per BOOKS entry) adds -r2 etc. once a live book's
// art is replaced: sw.js serves images cache-first, so a new picture at an old
// URL would stay stale for every returning reader. Bump it when pictures change.
const webPage = (art, ed, n) => `${art}-p${n}${ed.revisions?.[n] ? `-r${ed.revisions[n]}` : ed.rev ? `-r${ed.rev}` : ""}`;
const artPrefix = (id, ed) => (ed.source === "short" ? id : `reading-trail-${id}`);

// Reads a single- or double-quoted JS string literal starting at s[i].
function readString(s, i) {
  const q = s[i];
  let out = "";
  for (let j = i + 1; j < s.length; j++) {
    if (s[j] === "\\") { out += s[j + 1]; j++; continue; }
    if (s[j] === q) return { value: out, end: j + 1 };
    out += s[j];
  }
  throw new Error("unterminated string");
}
function field(block, name, optional = false) {
  const m = new RegExp(`\\b${name}:\\s*(['"])`).exec(block);
  if (!m && optional) return "";
  if (!m) throw new Error(`missing ${name}`);
  return readString(block, m.index + m[0].length - 1).value;
}
function quizFrom(block, name) {
  const at = block.indexOf(name + ':');
  if (at === -1) return null;
  const start = block.indexOf('{', at);
  let depth = 0, end = start;
  for (; end < block.length; end++) {
    if (block[end] === '"' || block[end] === "'") { end = readString(block,end).end - 1; continue; }
    if (block[end] === '{') depth++;
    if (block[end] === '}' && --depth === 0) break;
  }
  if (end === block.length) throw Error('Unterminated '+name);
  const part = block.slice(start,end+1);
  return {question:field(part,'question'),answer:field(part,'answer'),why:field(part,'why',true)};
}
function parseShort(id) {
  const start = SRC_SHORT.indexOf(`\n    id: '${id}',`);
  if (start === -1) throw new Error(`${id} not found in books.ts`);
  const next = SRC_SHORT.indexOf("\n  {\n    id: '", start + 10);
  const block = SRC_SHORT.slice(start, next === -1 ? undefined : next);
  const pagesBlock = block.slice(block.indexOf("pages: ["), block.indexOf("quiz:"));
  const pages = [];
  for (const line of pagesBlock.split("\n")) {
    if (!/\{\s*id:\s*'p\d+'/.test(line)) continue;
    pages.push({ text: field(line, "text"), prompt: field(line, "prompt"), focusWord: field(line, "focusWord") });
  }
  const q2 = block.indexOf("quiz2:");
  const quizPart = block.slice(block.indexOf("quiz:"), q2 === -1 ? undefined : q2);
  return {
    step: null, title: field(block, "title"), subtitle: field(block, "subtitle"), targetWords: [], pages,
    quiz: { question: field(quizPart, "question"), answer: field(quizPart, "answer"), why: field(quizPart, "why", true) },
    quiz2: quizFrom(block,'quiz2')
  };
}

function parseBook(id, ed) {
  if (ed && ed.source === "short") return parseShort(id);
  const start = SRC.indexOf(`id: 'reading-trail-${id}'`);
  if (start === -1) throw new Error(`reading-trail-${id} not found in reading-trail-drafts.ts`);
  const next = SRC.indexOf("id: 'reading-trail-", start + 10);
  const block = SRC.slice(start, next === -1 ? undefined : next);
  const step = Number(/trailStep:\s*(\d+)/.exec(block)[1]);
  const targetWords = [...(/targetWords:\s*\[([^\]]*)\]/.exec(block)[1]).matchAll(/'([^']+)'/g)].map((m) => m[1]);
  const pagesBlock = block.slice(block.indexOf("pages: ["), block.indexOf("quiz:"));
  const pages = [];
  for (const line of pagesBlock.split("\n")) {
    if (!/\{\s*id:\s*'p\d+'/.test(line)) continue;
    pages.push({ text: field(line, "text"), prompt: field(line, "prompt"), focusWord: field(line, "focusWord") });
  }
  const quizLine = block.slice(block.indexOf("quiz:"), block.indexOf("quiz2:"));
  return {
    step,
    title: field(block, "title"),
    subtitle: field(block, "subtitle"),
    targetWords,
    pages,
    quiz: { question: field(quizLine, "question"), answer: field(quizLine, "answer"), why: field(quizLine, "why") },
    quiz2: quizFrom(block,'quiz2')
  };
}

// ── Render ───────────────────────────────────────────────────────────────
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const curly = (s) => s.replace(/"([^"]*)"/g, "“$1”").replace(/'/g, "’");

// Highlight the words that practise this book's skill: its own target words,
// plus any word matching the skill's spelling pattern. Hyphenated character
// names (Stripe-Scout, Pork-ulele) are never marked: "Stripe" is not a blend
// the reader is meant to be practising.
function mark(text, words, ed) {
  const set = new Set(words.map((w) => w.toLowerCase()));
  const stop = new Set(ed.stop || []);
  return esc(curly(text)).replace(/[A-Za-z]+(?:-[A-Za-z]+)*/g, (w) => {
    if (w.includes("-")) return w;
    const l = w.toLowerCase();
    const stem = l.replace(/(s|es|ed|ing)$/, "");
    const hit = !stop.has(l) && (set.has(l) || set.has(stem) || (ed.pattern ? ed.pattern.test(l) : false));
    return hit ? `<mark>${w}</mark>` : w;
  });
}

// The shared head blocks (pwa/theme) and header are copied from an existing
// reader so this script never drifts from the generators that own them.
const TEMPLATE = fs.readFileSync(path.join(ROOT, "read/hen-berrys-digraph-dash/index.html"), "utf8");
const SHARED = TEMPLATE.slice(TEMPLATE.indexOf("<!-- pwa:generated -->"), TEMPLATE.indexOf("</head>"));
const HEADER = TEMPLATE.slice(TEMPLATE.indexOf('<header class="topbar">'), TEMPLATE.indexOf("<main>"));

function render(id, book, ed) {
  const { slug } = ed;
  const art = artPrefix(id, ed);
  const short = ed.source === "short";
  const url = `${SITE}/read/${slug}/`;
  const title = curly(book.title);
  const n = book.pages.length;
  const words = book.targetWords;
  const [first, second] = title.split(/(?<=’s) /);
  const nb = (t) => t.replace(/-/g, "‑");
  const h1 = second ? `${nb(first)}<br>${nb(second)}` : nb(title);
  const titleCase = ed.skill.replace(/\b[a-z]/g, (c) => c.toUpperCase());
  const cards = book.pages.map((p, i) =>
    `<article class="story-page-card" id="page-${i + 1}"><picture><source srcset="./pages/${webPage(art, ed, i + 1)}.webp" type="image/webp"><img src="./pages/${webPage(art, ed, i + 1)}.jpg" alt="${esc(ed.alts[i])}" width="768" height="1152" loading="lazy"></picture><div class="story-page-copy"><span>Page ${i + 1} of ${n}</span><p>${mark(p.text, short ? [p.focusWord] : words, ed)}</p><aside><strong>Talk together:</strong> ${esc(curly(p.prompt))}</aside></div></article>`
  ).join("\n");
  const ld = JSON.stringify({
    "@context": "https://schema.org", "@type": "Book", name: title,
    author: { "@type": "Organization", name: "SnackPack Studios" },
    isAccessibleForFree: true, educationalLevel: "Beginning reader", learningResourceType: short ? "Illustrated short story" : "Illustrated story",
    about: ed.about, image: `${url}pages/${webPage(art, ed, 1)}.jpg`, url
  });
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} | ${short ? "Free Illustrated Short Read" : `Free ${titleCase} Story`}</title>
<meta name="description" content="Read ${esc(title)}, a free ${n}-page illustrated story for beginning readers. ${esc(ed.lead.replace(/^A [a-z-]+-page /, "").replace(/^./, (c) => c.toUpperCase()))} Printable PDF included.">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(ed.blurb)}"><meta property="og:image" content="${url}pages/${webPage(art, ed, 1)}.jpg"><meta property="og:url" content="${url}"><meta property="og:type" content="book"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon-32.png"><link rel="preload" href="/assets/fonts/dmsans-ed656a5d.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/assets/fonts/fraunces-36024e18.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/assets/fonts/fonts.css"><link rel="stylesheet" href="../../site.css">
<script type="application/ld+json">${ld}</script>
<!-- breadcrumbs:generated -->
<!-- /breadcrumbs:generated -->
${SHARED}</head>
<body class="story-reader-page">
${HEADER}<main>
<section class="story-title-section"><div class="shell story-title-grid"><div><span class="eyebrow">${short ? "Short read" : `Reading Trail · Step ${book.step}`} · Free</span><h1>${h1}</h1><p class="lead">${esc(ed.lead)}</p>${short ? "" : `<p class="read-preparation">Read together: practise the focus sounds with an adult. This story uses wider vocabulary and is not a controlled independent decodable stage.</p>`}<div class="tag-row">${short ? `<span class="tag">Read together</span><span class="tag">${ed.skill}</span><span class="tag">4 pages</span>` : `<span class="tag">Beginning reader</span><span class="tag">${ed.skill}</span><span class="tag">Read together</span>`}</div><a class="btn btn-primary" href="#page-1">Begin the story</a></div><picture><source srcset="./pages/${webPage(art, ed, 1)}.webp" type="image/webp"><img src="./pages/${webPage(art, ed, 1)}.jpg" alt="" width="768" height="1152"></picture></div></section>

<section class="story-pages" aria-label="Story pages">
${cards}
</section>

<section><div class="shell story-finish-card"><span class="eyebrow">The end · Great reading</span><h2>${esc(curly(book.quiz.question))}</h2><details class="story-answer"><summary>Show the answer</summary><p>${esc(curly(book.quiz.answer))}.${book.quiz.why ? ` ${esc(curly(book.quiz.why))}` : ""}</p></details>${book.quiz2 ? `<h3 class="story-second-question">${esc(curly(book.quiz2.question))}</h3><details class="story-answer"><summary>Show the answer</summary><p>${esc(curly(book.quiz2.answer))}.${book.quiz2.why ? ` ${esc(curly(book.quiz2.why))}` : ""}</p></details>` : ""}<p>${short ? "SnackPack Sentences &amp; Spelling has many more short reads like this one, plus the Reading Trail, word packs and literacy games." : "SnackPack Sentences &amp; Spelling has the full Reading Trail, longer stories, word packs and eight literacy games."}</p><!-- read-next:generated -->
<!-- /read-next:generated --><div class="stack-inline"><a class="btn btn-primary" href="${PLAY}" target="_blank" rel="noopener">Get the app on Google Play</a><a class="btn btn-secondary" href="../../apps/snackpack-3-spelling-sentences/">Explore the app</a><a class="btn btn-secondary" href="./${slug}.pdf" download>Print this book (PDF)</a><a class="btn btn-secondary" href="../">Back to the bookshelf</a></div></div></section>
</main>
<footer class="foot"><div class="shell foot-wrap"><p class="foot-note">Story from SnackPack Sentences &amp; Spelling.</p><div class="footer-links"><a class="text-link" href="../">Bookshelf</a><a class="text-link" href="../../privacy/snackpack-3-spelling-sentences/">Privacy</a></div></div></footer>
  <!-- Cloudflare Web Analytics -->
  <script defer src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "0e57cfb3eb86422ca40e5fac02b1cf94"}'></script>
  <!-- End Cloudflare Web Analytics -->
</body></html>
`;
}

for (const id of ids) {
  const ed = BOOKS[id];
  const book = parseBook(id, ed);
  if (book.pages.length !== ed.alts.length) throw new Error(`${id}: ${book.pages.length} pages but ${ed.alts.length} alt texts`);
  const art = artPrefix(id, ed);
  const missing = book.pages.map((_, i) => path.join(APP, "assets/book-page-art", `${art}-p${i + 1}.jpg`)).filter((f) => !fs.existsSync(f));
  if (missing.length) throw new Error(`${id}: missing art ${missing.join(", ")}`);
  const dir = path.join(ROOT, "read", ed.slug);
  console.log(`${WRITE ? "write" : "dry  "} read/${ed.slug}/  ${ed.source === "short" ? "short read" : `step ${book.step}`}, ${book.pages.length} pages, "${book.title}"`);
  if (!WRITE) continue;
  fs.mkdirSync(path.join(dir, "pages"), { recursive: true });
  for (let i = 1; i <= book.pages.length; i++) {
    fs.copyFileSync(path.join(APP, "assets/book-page-art", `${art}-p${i}.jpg`), path.join(dir, "pages", `${webPage(art, ed, i)}.jpg`));
  }
  fs.writeFileSync(path.join(dir, "index.html"), render(id, book, ed));
}
