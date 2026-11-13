#!/usr/bin/env python3
"""Import one saved Alahazrat Network MHTML surah by exact row ID.

The importer refuses partial, duplicate, missing, or marker-mismatched rows.
It does not infer alignment from row position alone.
"""
import argparse
from email import policy
from email.parser import BytesParser
from html import unescape
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
METADATA = json.loads((ROOT / 'data/surahs.json').read_text(encoding='utf-8'))
JUZ_BOUNDARIES = json.loads((ROOT / 'data/juz-boundaries.json').read_text(encoding='utf-8'))
VERSE_COUNTS = {item['id']: item['verses'] for item in METADATA}
ROMAN_OVERRIDES = {
    '6:164': 'Tum farmao kya Allah ke siwa aur Rab chahun halaanke woh har cheez ka Rab hai, aur jo koi kuch kamaye woh usi ke zimmah hai, aur koi bojh uthane wali jaan doosre ka bojh na uthayegi, phir tumhein apne Rab ki taraf phirna hai, woh tumhein bata dega jis mein ikhtilaf karte the.',
    '6:165': 'Aur wohi hai jis ne zameen mein tumhein naib kiya aur tum mein ek ko doosre par darjon bulandi di ke tumhein aazmaye us cheez mein jo tumhein ata ki. Beshak tumhare Rab ko azaab karte der nahin lagti aur beshak woh zaroor bakhshne wala meherban hai.',
}
WORD_ROMANIZATION = {
    'اللہ': 'Allah', 'رب': 'Rab', 'ہے': 'hai', 'ہیں': 'hain', 'تھا': 'tha', 'تھی': 'thi',
    'تھے': 'the', 'اور': 'aur', 'کو': 'ko', 'کی': 'ki', 'کا': 'ka', 'کے': 'ke', 'میں': 'mein',
    'سے': 'se', 'پر': 'par', 'نے': 'ne', 'نہ': 'na', 'جو': 'jo', 'یہ': 'yeh', 'وہ': 'woh',
    'ہم': 'hum', 'تم': 'tum', 'آپ': 'aap', 'تو': 'to', 'بھی': 'bhi', 'اگر': 'agar', 'پھر': 'phir',
    'اب': 'ab', 'کہ': 'ke', 'ایک': 'ek', 'کوئی': 'koi', 'سب': 'sab', 'ہر': 'har', 'بیشک': 'beshak',
    'اپنے': 'apne', 'اپنا': 'apna', 'اپنی': 'apni', 'ہمارے': 'hamare', 'ہمیں': 'humein',
    'تمہیں': 'tumhein', 'ان': 'un', 'انہیں': 'unhein', 'انھیں': 'unhein', 'اس': 'is', 'اسے': 'use',
    'فرماؤ': 'farmao', 'فرمایا': 'farmaya', 'کہا': 'kaha', 'کہتے': 'kehte', 'کرو': 'karo',
    'کریں': 'karein', 'کری': 'kari', 'کیا': 'kiya', 'ہوگا': 'hoga', 'ہوگی': 'hogi', 'ہوئے': 'huay',
    'ہوا': 'hua', 'ہو': 'ho', 'نہیں': 'nahin', 'آج': 'aaj', 'بعد': 'baad', 'دن': 'din',
}
CHAR_ROMANIZATION = str.maketrans({
    'ا': 'a', 'آ': 'aa', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ٹ': 't', 'ث': 's', 'ج': 'j', 'چ': 'ch',
    'ح': 'h', 'خ': 'kh', 'د': 'd', 'ڈ': 'd', 'ذ': 'z', 'ر': 'r', 'ڑ': 'r', 'ز': 'z', 'ژ': 'zh',
    'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': '', 'غ': 'gh', 'ف': 'f',
    'ق': 'q', 'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ں': 'n', 'و': 'o', 'ہ': 'h',
    'ھ': 'h', 'ء': '', 'ی': 'i', 'ے': 'e', 'ئ': 'e', 'ؤ': 'o', 'ۃ': 't', 'ة': 't', 'ۂ': 'e',
})


def romanize_urdu(text):
    """Readable, provisional Hinglish transliteration for source blanks only."""
    text = re.sub(r'\s*\(ف[۰-۹\d]+\)', '', text)
    tokens = re.findall(r'[\u0600-\u06ff]+|[^\u0600-\u06ff]+', text)
    return ''.join(WORD_ROMANIZATION.get(token, token.translate(CHAR_ROMANIZATION)) if re.fullmatch(r'[\u0600-\u06ff]+', token) else token for token in tokens).strip()


def paragraph(block, css_class):
    match = re.search(r'<div class="' + re.escape(css_class) + r'"[^>]*>.*?<p[^>]*>(.*?)</p>', block, re.S)
    if not match:
        return None
    return re.sub(r'<[^>]+>', '', unescape(match.group(1))).strip()


def extract(source, surah):
    message = BytesParser(policy=policy.default).parsebytes(source.read_bytes())
    html_part = next((part for part in message.walk() if part.get_content_type() == 'text/html' and 'alahazratnetwork.org/surah/' in (part.get('Content-Location') or '')), None)
    if html_part is None:
        raise ValueError('No Alahazrat Network surah HTML part found')
    html = html_part.get_payload(decode=True).decode('utf-8')
    starts = list(re.finditer(r'<article class="q-row-item" id="v(\d+)">', html))
    expected_count = next(item['verses'] for item in METADATA if item['id'] == surah)
    if len(starts) != expected_count:
        raise ValueError(f'Expected {expected_count} rows, found {len(starts)}')

    verses = []
    for index, start in enumerate(starts):
        block = html[start.end():starts[index + 1].start() if index + 1 < len(starts) else len(html)]
        row_ayah = int(start.group(1))
        marker = re.search(r'<div class="q-arabic-text">.*?<span class="q-symbol">﴿(\d+)﴾', block, re.S)
        urdu = paragraph(block, 'q-urdu-content')
        roman = paragraph(block, 'q-roman-content')
        if marker is None or int(marker.group(1)) != row_ayah:
            raise ValueError(f'Arabic marker does not match row v{row_ayah}')
        if not urdu or not roman:
            raise ValueError(f'Row {row_ayah} is missing Urdu or Roman Urdu')
        verses.append({'id': f'{surah}:{row_ayah}', 'surah': surah, 'ayah': row_ayah, 'urdu': urdu, 'roman_urdu': roman, 'review_status': 'source_roman_review_required'})

    expected = [f'{surah}:{ayah}' for ayah in range(1, expected_count + 1)]
    if [verse['id'] for verse in verses] != expected:
        raise ValueError('Rows are not continuous ayah IDs')
    return html_part.get('Content-Location'), verses


def next_ayah(surah, ayah):
    if ayah < VERSE_COUNTS[surah]:
        return surah, ayah + 1
    return surah + 1, 1


def juz_ids(juz):
    index = next((index for index, boundary in enumerate(JUZ_BOUNDARIES) if boundary['juz'] == juz), None)
    if index is None:
        raise ValueError(f'Unknown juz {juz}')
    start = JUZ_BOUNDARIES[index]
    end = JUZ_BOUNDARIES[index + 1] if index + 1 < len(JUZ_BOUNDARIES) else None
    surah, ayah = start['surah'], start['ayah']
    result = []
    while end is None or (surah, ayah) < (end['surah'], end['ayah']):
        result.append((surah, ayah))
        if surah == 114 and ayah == VERSE_COUNTS[114]:
            break
        surah, ayah = next_ayah(surah, ayah)
    return result


def extract_juz(source, juz):
    message = BytesParser(policy=policy.default).parsebytes(source.read_bytes())
    html_part = next((part for part in message.walk() if part.get_content_type() == 'text/html' and 'alahazratnetwork.org/surah/' in (part.get('Content-Location') or '')), None)
    if html_part is None:
        raise ValueError('No Alahazrat Network juz HTML part found')
    html = html_part.get_payload(decode=True).decode('utf-8')
    starts = list(re.finditer(r'<div class="q-row-item"(?: id="v\d+")?>', html))
    expected = juz_ids(juz)
    if len(starts) != len(expected):
        raise ValueError(f'Juz {juz} expected {len(expected)} rows, found {len(starts)}')

    verses = []
    for index, start in enumerate(starts):
        block = html[start.end():starts[index + 1].start() if index + 1 < len(starts) else len(html)]
        surah, ayah = expected[index]
        marker = re.search(r'<div class="q-arabic-text">.*?<span class="q-symbol">﴿(\d+)﴾', block, re.S)
        urdu = paragraph(block, 'q-urdu-content')
        roman = paragraph(block, 'q-roman-content')
        if marker is None or int(marker.group(1)) != ayah:
            raise ValueError(f'Juz {juz} row {index + 1}: Arabic marker does not match {surah}:{ayah}')
        key = f'{surah}:{ayah}'
        if not urdu:
            raise ValueError(f'Juz {juz} row {index + 1}: Urdu missing for {key}')
        if not roman:
            roman = ROMAN_OVERRIDES.get(key)
            if not roman:
                roman = romanize_urdu(urdu)
                status = 'automatic_romanization_review_required'
            else:
                status = 'roman_transliteration_review_required'
        else:
            status = 'source_roman_review_required'
        verses.append({'id': key, 'surah': surah, 'ayah': ayah, 'urdu': urdu, 'roman_urdu': roman, 'review_status': status})
    return html_part.get('Content-Location'), verses


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('source', type=pathlib.Path)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--surah', type=int)
    group.add_argument('--juz', type=int)
    parser.add_argument('--output', type=pathlib.Path, required=True)
    args = parser.parse_args()
    source_page, verses = extract(args.source, args.surah) if args.surah else extract_juz(args.source, args.juz)
    document = {
        **({'surah': args.surah} if args.surah else {'juz': args.juz}),
        'source_page': source_page,
        'source_archive': args.source.name,
        'license': 'Public domain, as confirmed by the project owner on 2026-11-12.',
        'note': 'Urdu and Roman Urdu were extracted from source rows whose Arabic markers matched their expected ayah IDs. Roman Urdu remains a review field until verse-by-verse review is completed.',
        'verses': verses,
    }
    args.output.write_text(json.dumps(document, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Imported {len(verses)} aligned records into {args.output}')
