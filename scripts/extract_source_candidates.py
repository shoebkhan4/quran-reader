#!/usr/bin/env python3
"""Conservative local HTML inspection for candidate Ayat/translation pairs.
Uses a manually saved HTML file, not automated downloading/crawling.

The source page exposes verse markers ﴿n﴾ and five-language rows; candidate
Roman Urdu is the fourth text after Arabic (Urdu, English, Hindi, Roman),
not proof of alignment. Parsing failure MUST NOT silently shift indices.
"""
import argparse, pathlib, json, re
from bs4 import BeautifulSoup
MARKER=re.compile(r'﴿\s*([0-9٠-٩۰-۹]+)\s*﴾')
def to_ascii_number(t):
    return int(t.translate(str.maketrans('٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹','01234567890123456789')))
def inspect(html,surah=24):
    soup=BeautifulSoup(html,'html.parser')
    for tag in soup(['script','style','nav','footer','header']):tag.decompose()
    # Work on visible text blocks: exact DOM selectors may be refined after full HTML inspection.
    lines=[re.sub(r'\s+',' ',s).strip() for s in soup.stripped_strings]
    records=[]; alerts=[]
    for i,line in enumerate(lines):
        match=MARKER.search(line)
        if not match or not re.search(r'[\u0600-\u06ff]',line):continue
        n=to_ascii_number(match.group(1))
        # Work strictly on local text neighbourhood. Never assert row ordering is correct.
        context=lines[i+1:i+10]
        roman=[x for x in context if re.search(r'[A-Za-z]',x) and not re.search(r'[\u0600-\u06ff\u0900-\u097f]',x) and len(x)>25]
        candidate=roman[1] if len(roman)>1 else '' # likely English then Roman
        if len(roman)!=2:alerts.append(f'{surah}:{n} found {len(roman)} Latin-script candidates; inspect source HTML manually')
        records.append({'id':f'{surah}:{n}','surah':surah,'ayah':n,'arabic_candidate':line[:match.start()].strip(), 'roman_urdu_candidate':candidate,'review_status':'unverified_candidate'})
    ids=[r['ayah'] for r in records]
    if len(ids)!=len(set(ids)):alerts.append('Duplicate verse markers found: extraction cannot be trusted')
    return {'surah':surah,'candidate_count':len(records),'candidates':records,'alerts':alerts,'policy':'All candidates require manual review. Do not publish as verified.'}
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('html',type=pathlib.Path);p.add_argument('--surah',type=int,default=24);p.add_argument('--out',type=pathlib.Path,default=pathlib.Path('private-data/an-nur.candidates.json'));a=p.parse_args()
    output=inspect(a.html.read_text(encoding='utf-8'),a.surah)
    a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_text(json.dumps(output,ensure_ascii=False,indent=2),encoding='utf-8')
    print('Candidates:',output['candidate_count'],'Alerts:',len(output['alerts']),'Output:',a.out)
