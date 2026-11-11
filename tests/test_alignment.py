import unittest,sys,pathlib,json
ROOT=pathlib.Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts'))
from validate_alignment import validate
from import_tanzil import METADATA
class ValidationTest(unittest.TestCase):
    def test_surah_metadata(self):
        self.assertEqual(len(METADATA),114)
        self.assertEqual(sum(s['verses'] for s in METADATA),6236)
        self.assertEqual(METADATA[23]['verses'],64)
    def test_sample_is_structurally_valid_but_unverified(self):
        doc=json.loads((ROOT/'data/an-nur.sample.json').read_text(encoding='utf-8'))
        errors,warnings=validate(doc)
        self.assertEqual(errors,[])
        self.assertEqual(len(warnings),2)
    def test_duplicate_wrong_verse_and_missing_arabic(self):
        example={'surah':24,'verses':[{'id':'24:3','surah':24,'ayah':2,'arabic':'','roman_urdu':'text','review_status':'verified'}, {'id':'24:2','surah':24,'ayah':2,'arabic':'text','roman_urdu':'text','review_status':'verified'}]}
        errors,_=validate(example)
        self.assertTrue(any('does not match' in e for e in errors))
        self.assertTrue(any('duplicate' in e for e in errors))
        self.assertTrue(any('Arabic missing' in e for e in errors))
    def test_complete_requires_64(self):
        doc=json.loads((ROOT/'data/an-nur.sample.json').read_text(encoding='utf-8'))
        errors,_=validate(doc,complete=True)
        self.assertTrue(any('62 Ayat missing' in e for e in errors))
if __name__=='__main__':unittest.main()
