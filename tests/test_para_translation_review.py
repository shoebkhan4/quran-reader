import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
EXPECTED = {
    4: (132, '3:92', '4:23'), 5: (124, '4:24', '4:147'),
    6: (111, '4:148', '5:82'), 7: (148, '5:83', '6:110'),
    8: (142, '6:111', '7:87'), 9: (159, '7:88', '8:40'),
    10: (128, '8:41', '9:93'),
    11: (150, '9:94', '11:5'), 12: (170, '11:6', '12:52'),
    13: (155, '12:53', '15:1'), 14: (226, '15:2', '16:128'),
    15: (185, '17:1', '18:74'), 16: (269, '18:75', '20:135'),
    17: (190, '21:1', '22:78'), 18: (202, '23:1', '25:20'),
    19: (343, '25:21', '27:59'), 20: (166, '27:60', '29:44'),
}


class ParaTranslationReviewTest(unittest.TestCase):
    def test_uploaded_para_records_are_complete_and_aligned(self):
        for juz, (count, first_id, last_id) in EXPECTED.items():
            document = json.loads((ROOT / f'data/para-{juz}.translation.review.json').read_text(encoding='utf-8'))
            verses = document['verses']
            self.assertEqual(document['juz'], juz)
            self.assertEqual(len(verses), count)
            self.assertEqual(verses[0]['id'], first_id)
            self.assertEqual(verses[-1]['id'], last_id)
            self.assertEqual(len({verse['id'] for verse in verses}), count)
            self.assertTrue(all(verse['urdu'] for verse in verses))
            self.assertTrue(all(verse['roman_urdu'] or verse['review_status'] == 'source_roman_missing' for verse in verses))
