import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class JuzBoundaryTest(unittest.TestCase):
    def test_standard_hafs_boundaries_are_complete_and_ordered(self):
        boundaries = json.loads((ROOT / 'data/juz-boundaries.json').read_text(encoding='utf-8'))
        self.assertEqual([item['juz'] for item in boundaries], list(range(1, 31)))
        positions = [item['surah'] * 1000 + item['ayah'] for item in boundaries]
        self.assertEqual(positions, sorted(positions))
        self.assertEqual(boundaries[0], {'juz': 1, 'surah': 1, 'ayah': 1})
        self.assertEqual(boundaries[17], {'juz': 18, 'surah': 23, 'ayah': 1})
        self.assertEqual(boundaries[-1], {'juz': 30, 'surah': 78, 'ayah': 1})
