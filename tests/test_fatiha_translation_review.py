import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class FatihaTranslationReviewTest(unittest.TestCase):
    def test_review_sample_has_aligned_urdu_and_roman_records(self):
        document = json.loads((ROOT / 'data/al-fatiha.translation.review.json').read_text(encoding='utf-8'))
        verses = document['verses']
        self.assertEqual(document['surah'], 1)
        self.assertEqual([verse['id'] for verse in verses], [f'1:{ayah}' for ayah in range(1, 8)])
        self.assertTrue(all(verse['urdu'] and verse['roman_urdu'] for verse in verses))
        self.assertTrue(all(verse['review_status'] == 'roman_transliteration_review_required' for verse in verses))
