import React, {useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BookOpen, Search, Bookmark, Moon, Sun, Copy, PanelLeftClose, PanelLeftOpen, Check, AlertTriangle, ChevronLeft, ChevronRight} from 'lucide-react';
import surahs from '../data/surahs.json';
import sample from '../data/an-nur.sample.json';
import fatihaTranslation from '../data/al-fatiha.translation.review.json';
import baqarahTranslation from '../data/al-baqarah.translation.review.json';
import aleImranTranslation from '../data/ale-imran.translation.review.json';
import para4Translation from '../data/para-4.translation.review.json';
import para5Translation from '../data/para-5.translation.review.json';
import para6Translation from '../data/para-6.translation.review.json';
import para7Translation from '../data/para-7.translation.review.json';
import para8Translation from '../data/para-8.translation.review.json';
import para9Translation from '../data/para-9.translation.review.json';
import para10Translation from '../data/para-10.translation.review.json';
import para11Translation from '../data/para-11.translation.review.json';
import para12Translation from '../data/para-12.translation.review.json';
import para13Translation from '../data/para-13.translation.review.json';
import para14Translation from '../data/para-14.translation.review.json';
import para15Translation from '../data/para-15.translation.review.json';
import para16Translation from '../data/para-16.translation.review.json';
import para17Translation from '../data/para-17.translation.review.json';
import para18Translation from '../data/para-18.translation.review.json';
import para19Translation from '../data/para-19.translation.review.json';
import para20Translation from '../data/para-20.translation.review.json';
import arabicCorpus from '../data/quran-qpc-hafs.json';
import {BISMILLAH, getJuzForAyah, getJuzRangeForSurah, hasOpeningBismillah, isSajdahAyah} from '../data/quran-metadata';
import './styles.css';
import './reader-enhancements.css';
import './para-indicators.css';
import './translation-toggle.css';

type ArabicAyah = {id:string; surah:number; ayah:number; arabic:string};
type SampleTranslation = {id:string; urdu?:string; roman_urdu:string; review_status:string};
type Ayah = ArabicAyah & {urdu?:string; roman_urdu?:string; review_status?:string};
const translationsById = new Map(([
  ...(sample.verses as SampleTranslation[]),
  ...(fatihaTranslation.verses as SampleTranslation[]),
  ...(baqarahTranslation.verses as SampleTranslation[]),
  ...(aleImranTranslation.verses as SampleTranslation[]),
  ...(para4Translation.verses as SampleTranslation[]),
  ...(para5Translation.verses as SampleTranslation[]),
  ...(para6Translation.verses as SampleTranslation[]),
  ...(para7Translation.verses as SampleTranslation[]),
  ...(para8Translation.verses as SampleTranslation[]),
  ...(para9Translation.verses as SampleTranslation[]),
  ...(para10Translation.verses as SampleTranslation[]),
  ...(para11Translation.verses as SampleTranslation[]),
  ...(para12Translation.verses as SampleTranslation[]),
  ...(para13Translation.verses as SampleTranslation[]),
  ...(para14Translation.verses as SampleTranslation[]),
  ...(para15Translation.verses as SampleTranslation[]),
  ...(para16Translation.verses as SampleTranslation[]),
  ...(para17Translation.verses as SampleTranslation[]),
  ...(para18Translation.verses as SampleTranslation[]),
  ...(para19Translation.verses as SampleTranslation[]),
  ...(para20Translation.verses as SampleTranslation[]),
]).map(verse=>[verse.id,verse]));
const versesBySurah = new Map<number, Ayah[]>();
(arabicCorpus.verses as ArabicAyah[]).forEach(verse=>{
  const translation=translationsById.get(verse.id);
  const group=versesBySurah.get(verse.surah)||[];
  group.push({...verse,...translation});
  versesBySurah.set(verse.surah,group);
});

function App(){
  const [surahId,setSurahId]=useState(24);
  const [query,setQuery]=useState('');
  const [readerQuery,setReaderQuery]=useState('');
  const [mode,setMode]=useState<'both'|'arabic'|'translation'>('both');
  const [translationLanguage,setTranslationLanguage]=useState<'roman'|'urdu'>('roman');
  const [size,setSize]=useState(31);
  const [translationSize,setTranslationSize]=useState(21);
  const [resumeAyah,setResumeAyah]=useState<string|null>(null);
  const [dark,setDark]=useState(false);
  const [sidebar,setSidebar]=useState(true);
  const [saved,setSaved]=useState<string[]>(()=>{try{return JSON.parse(localStorage.getItem('quran-bookmarks')||'[]')}catch{return []}});
  const [copied,setCopied]=useState<string|null>(null);
  const [showBookmarks,setShowBookmarks]=useState(false);
  const lastReadId=useRef<string|null>(null);
  const current=surahs.find(s=>s.id===surahId)!;
  const reviewVerseCount=(versesBySurah.get(surahId)||[]).filter(verse=>verse.urdu&&verse.roman_urdu).length;
  const visibleSurahs=useMemo(()=>surahs.filter(s=>`${s.id} ${s.name} ${s.arabic}`.toLowerCase().includes(query.toLowerCase())),[query]);
  const visibleVerses=(versesBySurah.get(surahId)||[]).filter(v=>`${v.id} ${v.roman_urdu||''} ${v.arabic}`.toLowerCase().includes(readerQuery.toLowerCase()));
  const renderedVerses=surahId===1?visibleVerses.filter(v=>v.ayah!==1):visibleVerses;
  const bismillahTranslation=translationsById.get('1:1');
  const translationLabel=translationLanguage==='urdu'?'KANZUL IMAN · URDU':'KANZUL IMAN · ROMAN URDU';
  const translationFor=(verse:Pick<Ayah,'urdu'|'roman_urdu'>)=>translationLanguage==='urdu'?verse.urdu:verse.roman_urdu;
  const saveLastRead=(id:string)=>{lastReadId.current=id;localStorage.setItem('quran-last-read',id);history.replaceState(null,'',`#${id}`)};
  useEffect(()=>{const target=location.hash.slice(1)||localStorage.getItem('quran-last-read')||localStorage.getItem('quran-last-surah')||'';const match=target.match(/^(\d{1,3})(?::(\d+))?$/);const id=Number(match?.[1]);if(surahs.some(s=>s.id===id)){setSurahId(id);if(match?.[2]){const key=`${id}:${match[2]}`;lastReadId.current=key;setResumeAyah(key)}}},[]);
  useEffect(()=>{localStorage.setItem('quran-last-surah',String(surahId))},[surahId]);
  useEffect(()=>{if(!resumeAyah?.startsWith(`${surahId}:`))return;const frame=requestAnimationFrame(()=>document.getElementById(`ayah-${resumeAyah}`)?.scrollIntoView({block:'start'}));return()=>cancelAnimationFrame(frame)},[surahId,resumeAyah]);
  useEffect(()=>{const cards=Array.from(document.querySelectorAll<HTMLElement>('[data-ayah-id]'));const rememberVisibleAyah=()=>{const next=cards.reduce<HTMLElement|null>((closest,card)=>!closest||Math.abs(card.getBoundingClientRect().top-100)<Math.abs(closest.getBoundingClientRect().top-100)?card:closest,null);const id=next?.dataset.ayahId;if(id&&id!==lastReadId.current)saveLastRead(id)};window.addEventListener('scroll',rememberVisibleAyah,{passive:true});return()=>window.removeEventListener('scroll',rememberVisibleAyah)},[surahId]);
  const toggleBookmark=(id:string)=>setSaved(prev=>{let next=prev.includes(id)?prev.filter(x=>x!==id):[...prev,id];localStorage.setItem('quran-bookmarks',JSON.stringify(next));return next});
  const copyVerse=async(v:Ayah)=>{try {await navigator.clipboard.writeText(`${v.id}\n${v.arabic}${v.roman_urdu?`\n${v.roman_urdu}`:''}`);setCopied(v.id);setTimeout(()=>setCopied(null),1700)}catch {alert('Clipboard is unavailable in this browser context.')}};
  const selectSurah=(id:number)=>{setSurahId(id);setResumeAyah(null);saveLastRead(`${id}:1`);setReaderQuery('');if(innerWidth<800)setSidebar(false)};
  const moveSurah=(direction:-1|1)=>{const target=surahs.find(s=>s.id===surahId+direction);if(target)selectSurah(target.id)};
  return <div className={`app ${dark?'dark':''}`}>
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
        <div className="reader-tools"><div className="mode-group" role="group" aria-label="Reader language"><button onClick={()=>setMode('both')} className={mode==='both'?'selected':''}>Arabic + Translation</button><button onClick={()=>setMode('arabic')} className={mode==='arabic'?'selected':''}>Arabic</button><button onClick={()=>setMode('translation')} className={mode==='translation'?'selected':''}>Translation</button></div><div className="translation-switch" role="group" aria-label="Translation language"><button onClick={()=>setTranslationLanguage('roman')} className={translationLanguage==='roman'?'selected':''}>Roman Urdu</button><button onClick={()=>setTranslationLanguage('urdu')} className={translationLanguage==='urdu'?'selected':''}>Urdu</button></div><div className="font-control"><span>Arabic size</span><button aria-label="Decrease Arabic font size" onClick={()=>setSize(x=>Math.max(22,x-3))}>−</button><span>{size}</span><button aria-label="Increase Arabic font size" onClick={()=>setSize(x=>Math.min(52,x+3))}>+</button></div><div className="font-control"><span>Translation size</span><button aria-label="Decrease translation font size" onClick={()=>setTranslationSize(x=>Math.max(15,x-2))}>−</button><span>{translationSize}</span><button aria-label="Increase translation font size" onClick={()=>setTranslationSize(x=>Math.min(36,x+2))}>+</button></div></div>
        <div className="notice"><AlertTriangle size={17}/><span>{reviewVerseCount?<><strong>Review data:</strong> {reviewVerseCount} of {current.verses} ayahs have Urdu and Roman Urdu loaded from validated source rows. Roman Urdu remains marked for verse-by-verse review.</>:<><strong>Roman Urdu release gate:</strong> Arabic is complete and ayah-indexed. This surah's Urdu and Roman Urdu review data has not been imported yet.</>}</span></div>
        {showBookmarks&&<section className="bookmark-panel"><div><Bookmark size={18}/><strong>Saved Ayat</strong></div>{saved.length?saved.map(id=><button key={id} onClick={()=>{const [surah]=id.split(':').map(Number);selectSurah(surah);setShowBookmarks(false)}}>{id}</button>):<p>No saved ayat yet.</p>}</section>}
        <><label className="verse-search"><Search size={18}/><input placeholder="Search within this surah..." value={readerQuery} onChange={e=>setReaderQuery(e.target.value)}/></label><div className="ayah-list">{hasOpeningBismillah(surahId)&&<div className="bismillah" id={surahId===1?'ayah-1:1':undefined} data-ayah-id={surahId===1?'1:1':undefined} lang="ar" dir="rtl"><p>{BISMILLAH}</p>{mode!=='arabic'&&bismillahTranslation&&<div className={`bismillah-translation ${translationLanguage}`} dir={translationLanguage==='urdu'?'rtl':'ltr'}><span>{translationLabel}</span><p style={{fontSize:`${translationSize}px`}}>{translationFor(bismillahTranslation)}</p></div>}</div>}{renderedVerses.map(v=><article className="ayah-card" id={`ayah-${v.id}`} data-ayah-id={v.id} key={v.id}><div className="ayah-header"><div className="ayah-location"><span className="ayah-number">{v.id}</span><span className="para-number">Para {getJuzForAyah(v.surah,v.ayah)}</span></div><div className="ayah-actions">{isSajdahAyah(v.id)&&<span className="sajdah-mark" title="Sajdah al-tilawah location">۩ Sajdah</span>}{v.review_status&&<span className="unverified">{v.review_status==='automatic_romanization_review_required'?'Auto-Romanized':'Needs review'}</span>}<button title="Copy Ayat" aria-label={`Copy ${v.id}`} onClick={()=>copyVerse(v)}>{copied===v.id?<Check size={18}/>:<Copy size={18}/>}</button><button title="Bookmark" aria-label={`Bookmark ${v.id}`} onClick={()=>toggleBookmark(v.id)}><Bookmark size={18} fill={saved.includes(v.id)?'currentColor':'none'}/></button></div></div>{mode!=='translation'&&<p className="ayah-arabic" lang="ar" dir="rtl" style={{fontSize:`${size}px`}}>{v.arabic} <span className="arabic-numeral">۞</span></p>}{mode==='both'&&<div className="verse-divider"/>}{mode!=='arabic'&&<div className="translation"><span className="translation-label">{translationLabel}</span>{translationFor(v)?<p dir={translationLanguage==='urdu'?'rtl':'ltr'} style={{fontSize:`${translationSize}px`}}>{translationFor(v)}</p>:<p className="translation-pending">Awaiting an aligned {translationLanguage==='urdu'?'Urdu':'Roman Urdu'} source.</p>}</div>}</article>)}{renderedVerses.length===0&&<p className="empty">No matching ayat.</p>}</div></>
        <div className="surah-pagination"><button onClick={()=>moveSurah(-1)} disabled={surahId===1}><ChevronLeft size={17}/> Previous</button><span>Surah {surahId} of 114</span><button onClick={()=>moveSurah(1)} disabled={surahId===114}>Next <ChevronRight size={17}/></button></div>
        <div className="attribution">Arabic text: <a href="https://api.quranpedia.net/dumps/mushafs-2.json.gz" target="_blank" rel="noreferrer">Qur'anpedia QPC Hafs</a>, dump 2026-09-30 · <a href="https://api.quranpedia.net/dumps/LICENSE.md" target="_blank" rel="noreferrer">source license</a>. Urdu/Roman Urdu review source: <a href="https://www.alahazratnetwork.org/quran/" target="_blank" rel="noreferrer">Alahazrat Network</a>, public-domain status confirmed by project owner. Not a verified religious reference.</div>
      </main>
    </div>
  </div>
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);

