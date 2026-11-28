import json
from pathlib import Path
import runpy
import shutil
import sys
import tempfile
import unittest
from unittest.mock import patch


SITE = Path(__file__).resolve().parents[1]


class ImportChristmasBooksTest(unittest.TestCase):
    def setUp(self):
        scratch = tempfile.TemporaryDirectory()
        self.addCleanup(scratch.cleanup)
        self.root = Path(scratch.name)
        self.script = self.root / 'scripts/import-christmas-books.py'
        template = Path('read/hen-berrys-helping-day/index.html')
        for relative in ('scripts/import-christmas-books.py', template):
            target = self.root / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(SITE / relative, target)
        (self.root / 'data').mkdir()
        (self.root / 'data/web-books.json').write_text('{"books":[]}')

    def import_book(self, source_base, folder, slug, *, with_pdf=False):
        root = self.root / 'monorepo' / source_base
        source = root / folder
        source.mkdir(parents=True)

        def art(key):
            (source / f'{key}.png').write_bytes(b'fixture master')
            (source / f'{key}.webp').write_bytes(b'fixture derivative')
            return dict(status='accepted', master=f'{key}.png', alt='Fixture art',
                        width=1024, height=1536, derivatives=[{'path': f'{key}.webp'}])

        (source / 'manifest.json').write_text(json.dumps(dict(
            id=source.name, event='christmas', title='Christmas fixture',
            blurb='A test story.', ageRange='4–7', storyPageCount=1, cover=art('cover'),
            pages=[dict(number=1, text='**1 December**', art=art('p01'))],
        )))
        (source / 'manuscript.md').write_text('# Christmas fixture')
        if with_pdf:
            (source / f'{slug}.pdf').write_bytes(b'reviewed-printable-fixture')

        def convert_image(command, *, check):
            self.assertTrue(check)
            shutil.copyfile(command[1], command[-1])

        with patch.object(sys, 'argv', [str(self.script), str(root), '--book', folder, slug]), \
                patch('shutil.which', return_value='magick'), \
                patch('subprocess.run', side_effect=convert_image):
            runpy.run_path(str(self.script), run_name='__main__')

        catalog = json.loads((self.root / 'data/web-books.json').read_text())
        self.assertEqual(catalog['books'][0]['art'], [
            f'{source_base}/{folder}/cover.png', f'{source_base}/{folder}/p01.png',
        ])
        imported = self.root / 'read' / slug
        manifest = self.root / f'data/web-originals/{slug}/manifest.json'
        return imported, json.loads(manifest.read_text())

    def test_imports_bookshelf_christmas_book(self):
        slug = 'twenty-four-letters-before-christmas'
        folder = f'christmas/{slug}'
        imported, manifest = self.import_book(
            'docs/reads-events-bookshelf', folder, slug, with_pdf=True,
        )
        self.assertEqual(manifest['sourceFolder'], folder)
        self.assertEqual((imported / f'{slug}.pdf').read_bytes(), b'reviewed-printable-fixture')
        self.assertIn('<strong>1 December</strong>', (imported / 'index.html').read_text())

    def test_preserves_original_christmas_path(self):
        slug = 'nutmeg-and-the-tree-that-wouldnt-come'
        imported, manifest = self.import_book('docs/christmas-picture-books-2026', 'nutmeg-tree', slug)
        self.assertNotIn('sourceFolder', manifest)
        self.assertFalse((imported / f'{slug}.pdf').exists())


if __name__ == '__main__':
    unittest.main()
