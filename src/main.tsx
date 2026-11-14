import React, {useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BookOpen, Search, Bookmark, Moon, Sun, Copy, PanelLeftClose, PanelLeftOpen, Check, AlertTriangle, ChevronLeft, ChevronRight} from 'lucide-react';
import surahs from '../data/surahs.json';
import fatihaTranslation from '../data/al-fatiha.translation.review.json';
import arabicCorpus from '../data/quran-qpc-hafs.json';
import {BISMILLAH, getJuzForAyah, getJuzRangeForSurah, hasOpeningBismillah, isSajdahAyah} from '../data/quran-metadata';
import './styles.css';
import './reader-enhancements.css';
import './para-indicators.css';
import './translation-toggle.css';

type ArabicAyah = {id:string; surah:number; ayah:number; arabic:string};
type SampleTranslation = {id:string; urdu?:string; roman_urdu:string; review_status:string};
type Ayah = ArabicAyah & {urdu?:string; roman_urdu?:string; review_status?:string};
type TranslationDocument = {verses: SampleTranslation[]};

const translationLoaders: Record<string, () => Promise<TranslationDocument>> = {
  '2': () => import('../data/al-baqarah.translation.review.json'),
  '3': () => import('../data/ale-imran.translation.review.json'),
  'para-4': () => import('../data/para-4.translation.review.json'),
  'para-5': () => import('../data/para-5.translation.review.json'),
  'para-6': () => import('../data/para-6.translation.review.json'),
  'para-7': () => import('../data/para-7.translation.review.json'),
  'para-8': () => import('../data/para-8.translation.review.json'),
  'para-9': () => import('../data/para-9.translation.review.json'),
  'para-10': () => import('../data/para-10.translation.review.json'),
  'para-11': () => import('../data/para-11.translation.review.json'),
  'para-12': () => import('../data/para-12.translation.review.json'),
  'para-13': () => import('../data/para-13.translation.review.json'),
  'para-14': () => import('../data/para-14.translation.review.json'),
  'para-15': () => import('../data/para-15.translation.review.json'),
  'para-16': () => import('../data/para-16.translation.review.json'),
  'para-17': () => import('../data/para-17.translation.review.json'),
  'para-18': () => import('../data/para-18.translation.review.json'),
  'para-19': () => import('../data/para-19.translation.review.json'),
  'para-20': () => import('../data/para-20.translation.review.json'),
  'para-21': () => import('../data/para-21.translation.review.json'),
  'para-22': () => import('../data/para-22.translation.review.json'),
  'para-23': () => import('../data/para-23.translation.review.json'),
  'para-24': () => import('../data/para-24.translation.review.json'),
  'para-25': () => import('../data/para-25.translation.review.json'),
  'para-26': () => import('../data/para-26.translation.review.json'),
  'para-27': () => import('../data/para-27.translation.review.json'),
  'para-28': () => import('../data/para-28.translation.review.json'),
  'para-29': () => import('../data/para-29.translation.review.json'),
  'para-30': () => import('../data/para-30.translation.review.json'),
};
const translationRequests = new Map<string, Promise<TranslationDocument>>();
const loadTranslation = (unit:string) => {
  const existing = translationRequests.get(unit);
  if (existing) return existing;
  const request = translationLoaders[unit]();
  translationRequests.set(unit, request);
  return request;
};
const translationUnitsForSurah = (surah:number, verseCount:number) => {
  if (surah === 1) return [];
  if (surah === 2 || surah === 3) return [String(surah)];
  return [...new Set(Array.from({length:verseCount}, (_, index) => `para-${getJuzForAyah(surah,index + 1)}`))];
};
const initialTranslationsById = new Map(([
  ...(fatihaTranslation.verses as SampleTranslation[]),
]).map(verse=>[verse.id,verse]));
const arabicBySurah = new Map<number, ArabicAyah[]>();
(arabicCorpus.verses as ArabicAyah[]).forEach(verse=>{
  const group=arabicBySurah.get(verse.surah)||[];
  group.push(verse);
  arabicBySurah.set(verse.surah,group);
});

function readStored(key:string){try{return localStorage.getItem(key)}catch{return null}}
function writeStored(key:string,value:string){try{localStorage.setItem(key,value)}catch{/* Reading remains available when storage is blocked. */}}
function initialPosition(){
  for(const value of [readStored('quran-last-read'),location.hash.slice(1),readStored('quran-last-surah')]){
    const match=value?.match(/^(\d{1,3})(?::(\d+))?$/);
    const surah=surahs.find(s=>s.id===Number(match?.[1]));
    const ayah=Number(match?.[2]||1);
    if(surah&&ayah>=1&&ayah<=surah.verses)return `${surah.id}:${ayah}`;
  }
  return '24:1';
}
function App(){
  const [openingPosition]=useState(initialPosition);
  const [surahId,setSurahId]=useState(()=>Number(openingPosition.split(':')[0]));
  const [query,setQuery]=useState('');
  const [readerQuery,setReaderQuery]=useState('');
  const [mode,setMode]=useState<'both'|'arabic'|'translation'>('both');
  const [translationLanguage,setTranslationLanguage]=useState<'roman'|'urdu'>('roman');
  const [reviewOnly,setReviewOnly]=useState(false);
  const [translationsById,setTranslationsById]=useState(()=>initialTranslationsById);
  const [translationLoading,setTranslationLoading]=useState(false);
  const [size,setSize]=useState(31);
  const [translationSize,setTranslationSize]=useState(21);
  const [resumeAyah,setResumeAyah]=useState<string|null>(openingPosition);
  const [dark,setDark]=useState(false);
  const [sidebar,setSidebar]=useState(()=>!matchMedia('(max-width: 800px)').matches);
  const [saved,setSaved]=useState<string[]>(()=>{try{const value=JSON.parse(readStored('quran-bookmarks')||'[]');return Array.isArray(value)?value.filter((id:unknown)=>typeof id==='string'&&arabicCorpus.verses.some(v=>v.id===id)):[]}catch{return []}});
  const [copied,setCopied]=useState<string|null>(null);
  const [showBookmarks,setShowBookmarks]=useState(false);
  const lastReadId=useRef<string|null>(openingPosition);
  const restoring=useRef(true);
  const current=surahs.find(s=>s.id===surahId)!;
  const versesBySurah=useMemo(()=>new Map([...arabicBySurah].map(([id,verses])=>[id,verses.map(verse=>({...verse,...translationsById.get(verse.id)}))])),[translationsById]);
  const reviewVerseCount=(versesBySurah.get(surahId)||[]).filter(verse=>verse.urdu&&verse.roman_urdu).length;
  const autoRomanizedCount=(versesBySurah.get(surahId)||[]).filter(verse=>verse.review_status==='automatic_romanization_review_required').length;
  const visibleSurahs=useMemo(()=>surahs.filter(s=>`${s.id} ${s.name} ${s.arabic}`.toLowerCase().includes(query.toLowerCase())),[query]);
  const visibleVerses=(versesBySurah.get(surahId)||[]).filter(v=>`${v.id} ${v.roman_urdu||''} ${v.arabic}`.toLowerCase().includes(readerQuery.toLowerCase())).filter(v=>!reviewOnly||v.review_status==='automatic_romanization_review_required');
  const renderedVerses=surahId===1?visibleVerses.filter(v=>v.ayah!==1):visibleVerses;
  const bismillahTranslation=translationsById.get('1:1');
  const translationLabel=translationLanguage==='urdu'?'KANZUL IMAN · URDU':'KANZUL IMAN · ROMAN URDU';
  const translationFor=(verse:Pick<Ayah,'urdu'|'roman_urdu'>)=>translationLanguage==='urdu'?verse.urdu:verse.roman_urdu;
  const saveLastRead=(id:string)=>{lastReadId.current=id;writeStored('quran-last-read',id);history.replaceState(null,'',`#${id}`)};
  useEffect(()=>{
    let cancelled=false;
    const units=translationUnitsForSurah(surahId,current.verses);
    if(!units.length)return;
    setTranslationLoading(true);
    Promise.all(units.map(loadTranslation)).then(documents=>{
      if(cancelled)return;
      setTranslationsById(previous=>new Map([...previous,...documents.flatMap(document=>document.verses).map(verse=>[verse.id,verse] as const)]));
      setTranslationLoading(false);
    }).catch(()=>{if(!cancelled)setTranslationLoading(false)});
    return()=>{cancelled=true};
  },[surahId,current.verses]);
  useEffect(()=>{writeStored('quran-last-surah',String(surahId))},[surahId]);
  useEffect(()=>{
    if(!resumeAyah?.startsWith(`${surahId}:`))return;
    restoring.current=true;
    let cancelled=false;
    let frame=0;
    const align=()=>{if(!cancelled)document.getElementById(`ayah-${resumeAyah}`)?.scrollIntoView({block:'start'})};
    frame=requestAnimationFrame(align);
    const observer=new ResizeObserver(align);
    const list=document.querySelector('.ayah-list');
    if(list)observer.observe(list);
    document.fonts.ready.then(align);
    const finish=()=>{restoring.current=false;setResumeAyah(null)};
    window.addEventListener('touchstart',finish,{once:true,passive:true});
    window.addEventListener('wheel',finish,{once:true,passive:true});
    const onKey=(event:KeyboardEvent)=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key))finish()};
    window.addEventListener('keydown',onKey);
    return()=>{cancelled=true;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('touchstart',finish);window.removeEventListener('wheel',finish);window.removeEventListener('keydown',onKey)};
  },[surahId,resumeAyah]);
  useEffect(()=>{
    const rememberVisibleAyah=()=>{
      if(restoring.current||sidebar&&matchMedia('(max-width: 800px)').matches||readerQuery||reviewOnly)return;
      const cards=Array.from(document.querySelectorAll<HTMLElement>('[data-ayah-id]'));
      const next=cards.reduce<HTMLElement|null>((closest,card)=>!closest||Math.abs(card.getBoundingClientRect().top-20)<Math.abs(closest.getBoundingClientRect().top-20)?card:closest,null);
      const id=next?.dataset.ayahId;
      if(id&&id!==lastReadId.current)saveLastRead(id);
    };
    const onHidden=()=>{if(document.visibilityState==='hidden')rememberVisibleAyah()};
    window.addEventListener('scroll',rememberVisibleAyah,{passive:true});
    window.addEventListener('pagehide',rememberVisibleAyah);
    document.addEventListener('visibilitychange',onHidden);
    return()=>{window.removeEventListener('scroll',rememberVisibleAyah);window.removeEventListener('pagehide',rememberVisibleAyah);document.removeEventListener('visibilitychange',onHidden)};
  },[surahId,sidebar,readerQuery,reviewOnly]);
  const toggleBookmark=(id:string)=>setSaved(prev=>{let next=prev.includes(id)?prev.filter(x=>x!==id):[...prev,id];writeStored('quran-bookmarks',JSON.stringify(next));return next});
  const copyVerse=async(v:Ayah)=>{try {await navigator.clipboard.writeText(`${v.id}\n${v.arabic}${v.roman_urdu?`\n${v.roman_urdu}`:''}`);setCopied(v.id);setTimeout(()=>setCopied(null),1700)}catch {alert('Clipboard is unavailable in this browser context.')}};
  const openAyah=(key:string)=>{restoring.current=true;setSurahId(Number(key.split(':')[0]));setResumeAyah(key);saveLastRead(key);setReaderQuery('');setReviewOnly(false);setShowBookmarks(false);if(matchMedia('(max-width: 800px)').matches)setSidebar(false)};
  const selectSurah=(id:number)=>openAyah(`${id}:1`);
  const moveSurah=(direction:-1|1)=>{const target=surahs.find(s=>s.id===surahId+direction);if(target)selectSurah(target.id)};
  return <div className={`app ${dark?'dark':''}`}>
    <button className={`sidebar-backdrop ${sidebar?'visible':''}`} aria-label="Close surah menu" onClick={()=>setSidebar(false)}/>
    <aside className={`sidebar ${sidebar?'':'collapsed'}`}>
      <header className="brand"><div className="brand-icon"><BookOpen size={23}/></div><div><strong>Al Quran</strong><small>Arabic · Roman Urdu</small></div></header>
      <div className="side-heading">EXPLORE THE QURAN</div>
      <label className="search-field"><Search size={16}/><input aria-label="Find surah" placeholder="Search all 114 surahs" value={query} onChange={e=>setQuery(e.target.value)}/></label>
      <div className="surah-list">{visibleSurahs.map(s=><button key={s.id} className={`surah-link ${surahId===s.id?'active':''}`} onClick={()=>selectSurah(s.id)}><span className="surah-index">{s.id}</span><span className="surah-info"><strong>{s.name}</strong><small>{s.verses} Ayat · {getJuzRangeForSurah(s.id,s.verses)}</small></span><span className="surah-arabic" dir="rtl">{s.arabic}</span></button>)}</div>
      <footer className="side-footer">Source-aware · Ayat-indexed<br/>Private proof of concept</footer>
    </aside>
    <div className="content">
      <nav className="topbar"><div className="nav-left"><button className="icon-button" aria-label="Toggle sidebar" onClick={()=>setSidebar(!sidebar)}>{sidebar?<PanelLeftClose size={20}/>:<PanelLeftOpen size={20}/>}</button><span className="crumb">Quran <span>/</span> Surah {current.id}</span></div><div className="nav-right"><span className="status-pill">PROOF OF CONCEPT</span><button className="icon-button" aria-label="Show bookmarks" onClick={()=>setShowBookmarks(!showBookmarks)}><Bookmark size={19}/></button><button className="icon-button" aria-label="Toggle theme" onClick={()=>setDark(!dark)}>{dark?<Sun size={19}/>:<Moon size={19}/>}</button></div></nav>
      <main>
        <div className="hero"><div className="hero-decoration">۞</div><span className="eyebrow">SURAH {current.id} · {current.verses} AYAT · {getJuzRangeForSurah(current.id,current.verses).toUpperCase()}</span><div className="hero-arabic" lang="ar" dir="rtl">{current.arabic}</div><h1>{current.name}</h1><p>{reviewVerseCount?'Urdu + Roman Urdu review data':'QPC Hafs Arabic corpus · Roman Urdu authorization pending'}</p><span className="ornament">✦　◇　✦</span></div>
        <div className="reader-tools"><div className="mode-group" role="group" aria-label="Reader language"><button onClick={()=>setMode('both')} className={mode==='both'?'selected':''}>Arabic + Translation</button><button onClick={()=>setMode('arabic')} className={mode==='arabic'?'selected':''}>Arabic</button><button onClick={()=>setMode('translation')} className={mode==='translation'?'selected':''}>Translation</button></div><div className="translation-switch" role="group" aria-label="Translation language"><button onClick={()=>setTranslationLanguage('roman')} className={translationLanguage==='roman'?'selected':''}>Roman Urdu</button><button onClick={()=>setTranslationLanguage('urdu')} className={translationLanguage==='urdu'?'selected':''}>Urdu</button></div><div className="translation-switch review-switch" role="group" aria-label="Auto-Romanized filter"><button onClick={()=>setReviewOnly(false)} className={!reviewOnly?'selected':''}>All ayat</button><button onClick={()=>setReviewOnly(true)} className={reviewOnly?'selected':''}>Auto {autoRomanizedCount||''}</button></div><div className="font-control"><span>Arabic size</span><button aria-label="Decrease Arabic font size" onClick={()=>setSize(x=>Math.max(22,x-3))}>−</button><span>{size}</span><button aria-label="Increase Arabic font size" onClick={()=>setSize(x=>Math.min(52,x+3))}>+</button></div><div className="font-control"><span>Translation size</span><button aria-label="Decrease translation font size" onClick={()=>setTranslationSize(x=>Math.max(15,x-2))}>−</button><span>{translationSize}</span><button aria-label="Increase translation font size" onClick={()=>setTranslationSize(x=>Math.min(36,x+2))}>+</button></div></div>
        <div className="notice"><AlertTriangle size={17}/><span>{translationLoading?<><strong>Loading translation:</strong> Arabic is ready; the selected Para data is being loaded.</>:reviewVerseCount?<><strong>Translation data:</strong> {reviewVerseCount} of {current.verses} ayahs have Urdu and Roman Urdu loaded from validated source rows. {autoRomanizedCount?`${autoRomanizedCount} ayah${autoRomanizedCount===1?' is':'s are'} marked Auto-Romanized where the source Roman text was blank.`:'All loaded Roman Urdu is source-based.'}</>:<><strong>Roman Urdu release gate:</strong> Arabic is complete and ayah-indexed. This surah's Urdu and Roman Urdu review data has not been imported yet.</>}</span></div>
        {showBookmarks&&<section className="bookmark-panel"><div><Bookmark size={18}/><strong>Saved Ayat</strong></div>{saved.length?saved.map(id=><button key={id} onClick={()=>openAyah(id)}>{surahs.find(s=>s.id===Number(id.split(':')[0]))?.name} · Ayat {id.split(':')[1]}</button>):<p>No saved ayat yet.</p>}</section>}
        <><label className="verse-search"><Search size={18}/><input placeholder="Search within this surah..." value={readerQuery} onChange={e=>setReaderQuery(e.target.value)}/></label><div className="ayah-list">{hasOpeningBismillah(surahId)&&!reviewOnly&&<div className="bismillah" id={surahId===1?'ayah-1:1':undefined} data-ayah-id={surahId===1?'1:1':undefined} lang="ar" dir="rtl"><p>{BISMILLAH}</p>{mode!=='arabic'&&bismillahTranslation&&<div className={`bismillah-translation ${translationLanguage}`} dir={translationLanguage==='urdu'?'rtl':'ltr'}><span>{translationLabel}</span><p style={{fontSize:`${translationSize}px`}}>{translationFor(bismillahTranslation)}</p></div>}</div>}{renderedVerses.map(v=><article className="ayah-card" id={`ayah-${v.id}`} data-ayah-id={v.id} key={v.id}><div className="ayah-header"><div className="ayah-location"><span className="ayah-number">{v.id}</span><span className="para-number">Para {getJuzForAyah(v.surah,v.ayah)}</span></div><div className="ayah-actions">{isSajdahAyah(v.id)&&<span className="sajdah-mark" title="Sajdah al-tilawah location">۩ Sajdah</span>}{v.review_status==='automatic_romanization_review_required'&&<span className="unverified">Auto-Romanized</span>}<button title="Copy Ayat" aria-label={`Copy ${v.id}`} onClick={()=>copyVerse(v)}>{copied===v.id?<Check size={18}/>:<Copy size={18}/>}</button><button title={saved.includes(v.id)?'Remove bookmark':'Save ayat'} aria-pressed={saved.includes(v.id)} aria-label={`Bookmark ${v.id}`} onClick={()=>toggleBookmark(v.id)}><Bookmark size={18} fill={saved.includes(v.id)?'currentColor':'none'}/></button></div></div>{mode!=='translation'&&<p className="ayah-arabic" lang="ar" dir="rtl" style={{fontSize:`${size}px`}}>{v.arabic} <span className="arabic-numeral">۞</span></p>}{mode==='both'&&<div className="verse-divider"/>}{mode!=='arabic'&&<div className="translation"><span className="translation-label">{translationLabel}</span>{translationFor(v)?<p dir={translationLanguage==='urdu'?'rtl':'ltr'} style={{fontSize:`${translationSize}px`}}>{translationFor(v)}</p>:<p className="translation-pending">Awaiting an aligned {translationLanguage==='urdu'?'Urdu':'Roman Urdu'} source.</p>}</div>}</article>)}{renderedVerses.length===0&&<p className="empty">{reviewOnly?'No Auto-Romanized ayat in this surah.':'No matching ayat.'}</p>}</div></>
        <div className="surah-pagination"><button onClick={()=>moveSurah(-1)} disabled={surahId===1}><ChevronLeft size={17}/> Previous</button><span>Surah {surahId} of 114</span><button onClick={()=>moveSurah(1)} disabled={surahId===114}>Next <ChevronRight size={17}/></button></div>
        <div className="attribution">Arabic text: <a href="https://api.quranpedia.net/dumps/mushafs-2.json.gz" target="_blank" rel="noreferrer">Qur'anpedia QPC Hafs</a>, dump 2026-09-30 · <a href="https://api.quranpedia.net/dumps/LICENSE.md" target="_blank" rel="noreferrer">source license</a>. Urdu/Roman Urdu review source: <a href="https://www.alahazratnetwork.org/quran/" target="_blank" rel="noreferrer">Alahazrat Network</a>, public-domain status confirmed by project owner. Not a verified religious reference.</div>
      </main>
    </div>
  </div>
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);

