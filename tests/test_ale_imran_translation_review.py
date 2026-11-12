import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class AleImranTranslationReviewTest(unittest.TestCase):
    def test_review_sample_has_all_aligned_ale_imran_records(self):
        document = json.loads((ROOT / 'data/ale-imran.translation.review.json').read_text(encoding='utf-8'))
        verses = document['verses']
        self.assertEqual(document['surah'], 3)
        self.assertEqual(len(verses), 200)
        self.assertEqual([verse['id'] for verse in verses], [f'3:{ayah}' for ayah in range(1, 201)])
        self.assertTrue(all(verse['urdu'] and verse['roman_urdu'] for verse in verses))
        self.assertTrue(all(verse['review_status'] == 'source_roman_review_required' for verse in verses))
