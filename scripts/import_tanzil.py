#!/usr/bin/env python3
"""Import licensed, verbatim Tanzil simple-text 'surah|ayah|text' source.
Download yourself from https://tanzil.net/download/ after accepting license.
Never normalize, edit, remove diacritics, or paraphrase the Arabic text.
"""
import argparse, json, pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parents[1]
METADATA = json.loads((ROOT/'data/surahs.json').read_text(encoding='utf-8'))

def parse_tanzil(path):
    result={}
    for line_number,line in enumerate(path.read_text(encoding='utf-8-sig').splitlines(),1):
        line=line.strip()
        if not line or line.startswith('#'):continue
        parts=line.split('|',2)
        if len(parts)!=3:raise ValueError(f'Unexpected Tanzil line {line_number}: expected surah|ayah|Arabic')
        surah,ayah=map(int,parts[:2]); key=f'{surah}:{ayah}'
        if key in result:raise ValueError(f'Duplicate {key}')
        result[key]=parts[2]   # preserve verbatim text, including marks
    expected={f'{s["id"]}:{n}' for s in METADATA for n in range(1,s['verses']+1)}
    if set(result)!=expected:
        missing=sorted(expected-set(result));extra=sorted(set(result)-expected)
        raise ValueError(f'Expected 6236 distinct Ayat; got {len(result)}. Missing {missing[:5]}, unexpected {extra[:5]}')
    return result

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('source',type=pathlib.Path);p.add_argument('--output',type=pathlib.Path,default=ROOT/'private-data/arabic-tanzil.json');a=p.parse_args()
    values=parse_tanzil(a.source);a.output.parent.mkdir(parents=True,exist_ok=True)
    a.output.write_text(json.dumps(values,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Imported {len(values)} Ayat; retained exact Arabic strings in {a.output}')
