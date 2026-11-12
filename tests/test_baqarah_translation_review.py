import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class BaqarahTranslationReviewTest(unittest.TestCase):
    def test_review_sample_has_all_aligned_baqarah_records(self):
        document = json.loads((ROOT / 'data/al-baqarah.translation.review.json').read_text(encoding='utf-8'))
        verses = document['verses']
        self.assertEqual(document['surah'], 2)
        self.assertEqual(len(verses), 286)
        self.assertEqual([verse['id'] for verse in verses], [f'2:{ayah}' for ayah in range(1, 287)])
        self.assertTrue(all(verse['urdu'] and verse['roman_urdu'] for verse in verses))
        self.assertTrue(all(verse['review_status'] == 'source_roman_review_required' for verse in verses))
