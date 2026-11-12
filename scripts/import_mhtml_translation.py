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


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('source', type=pathlib.Path)
    parser.add_argument('--surah', type=int, required=True)
    parser.add_argument('--output', type=pathlib.Path, required=True)
    args = parser.parse_args()
    source_page, verses = extract(args.source, args.surah)
    document = {
        'surah': args.surah,
        'source_page': source_page,
        'source_archive': args.source.name,
        'license': 'Public domain, as confirmed by the project owner on 2026-11-12.',
        'note': 'Urdu and Roman Urdu were extracted from same-ID source rows. Roman Urdu remains a review field until verse-by-verse review is completed.',
        'verses': verses,
    }
    args.output.write_text(json.dumps(document, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Imported {len(verses)} aligned records into {args.output}')
