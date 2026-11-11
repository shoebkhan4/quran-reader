#!/usr/bin/env python3
"""Refuse missing/mismatched/duplicated verse IDs; never shift translations by row order."""
import json,argparse,pathlib,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
META=json.loads((ROOT/'data/surahs.json').read_text(encoding='utf-8'))
COUNTS={s['id']:s['verses'] for s in META}

def validate(document,complete=False):
    errors=[];warnings=[];seen=set();verses=document.get('verses',[]);surah=document.get('surah')
    for idx,v in enumerate(verses,1):
        prefix=f'row {idx}'
        try:
            s=int(v['surah']);a=int(v['ayah']);key=f'{s}:{a}'
        except (KeyError,TypeError,ValueError):errors.append(f'{prefix}: missing/invalid surah or ayah');continue
        if v.get('id')!=key:errors.append(f'{prefix}: id {v.get("id")!r} does not match {key}')
        if s not in COUNTS or not 1<=a<=COUNTS[s]:errors.append(f'{prefix}: out-of-range {key}')
        if surah is not None and s!=surah:errors.append(f'{prefix}: wrong surah {s}')
        if key in seen:errors.append(f'{prefix}: duplicate {key}')
        seen.add(key)
        if not isinstance(v.get('arabic'),str) or not v['arabic'].strip():errors.append(f'{key}: Arabic missing')
        if not isinstance(v.get('roman_urdu'),str) or not v['roman_urdu'].strip():errors.append(f'{key}: Roman Urdu missing')
        if v.get('review_status')!='verified':warnings.append(f'{key}: translation association not manually verified')
    if complete:
        scoped=([surah] if surah in COUNTS else list(COUNTS))
        for s in scoped:
            expected={f'{s}:{a}' for a in range(1,COUNTS[s]+1)}
            absent=expected-seen
            if absent:errors.append(f'Surah {s}: {len(absent)} Ayat missing (e.g. {sorted(absent, key=lambda x:int(x.split(":")[1]))[:5]})')
    return errors,warnings

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('data',type=pathlib.Path);p.add_argument('--complete',action='store_true');args=p.parse_args()
    e,w=validate(json.loads(args.data.read_text(encoding='utf-8')),args.complete)
    for message in e:print('ERROR:',message)
    for message in w:print('REVIEW:',message)
    print(f'Errors: {len(e)}, review flags: {len(w)}');sys.exit(1 if e else 0)
