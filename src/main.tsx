import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BookOpen, Search, Bookmark, Moon, Sun, Copy, PanelLeftClose, PanelLeftOpen, Check, AlertTriangle, ArrowLeft, ChevronLeft, ChevronRight, ListBookmark} from 'lucide-react';
import surahs from '../data/surahs.json';
import sample from '../data/an-nur.sample.json';
import {BISMILLAH, hasOpeningBismillah, isSajdahAyah} from '../data/quran-metadata';
import './styles.css';
import './reader-enhancements.css';

type Ayah = {id:string; surah:number; ayah:number; arabic:string; roman_urdu:string; review_status:string};
const verses = sample.verses as Ayah[];

function App(){
  const [surahId,setSurahId]=useState(24);
  const [query,setQuery]=useState('');
  const [readerQuery,setReaderQuery]=useState('');
  const [mode,setMode]=useState<'both'|'arabic'|'roman'>('both');
  const [size,setSize]=useState(31);
  const [dark,setDark]=useState(false);
  const [sidebar,setSidebar]=useState(true);
  const [saved,setSaved]=useState<string[]>(()=>{try{return JSON.parse(localStorage.getItem('quran-bookmarks')||'[]')}catch{return []}});
  const [copied,setCopied]=useState<string|null>(null);
  const [showBookmarks,setShowBookmarks]=useState(false);
  const current=surahs.find(s=>s.id===surahId)!;
  const visibleSurahs=useMemo(()=>surahs.filter(s=>`${s.id} ${s.name} ${s.arabic}`.toLowerCase().includes(query.toLowerCase())),[query]);
  const visibleVerses=(surahId===24?verses:[]).filter(v=>`${v.id} ${v.roman_urdu} ${v.arabic}`.toLowerCase().includes(readerQuery.toLowerCase()));
  useEffect(()=>{const match=location.hash.match(/^#(\d{1,3})(?::\d+)?$/);const id=Number(match?.[1]);if(surahs.some(s=>s.id===id))setSurahId(id)},[]);
  useEffect(()=>{history.replaceState(null,'',`#${surahId}`);localStorage.setItem('quran-last-surah',String(surahId))},[surahId]);
  const toggleBookmark=(id:string)=>setSaved(prev=>{let next=prev.includes(id)?prev.filter(x=>x!==id):[...prev,id];localStorage.setItem('quran-bookmarks',JSON.stringify(next));return next});
  const copyVerse=async(v:Ayah)=>{try {await navigator.clipboard.writeText(`${v.id}\n${v.arabic}\n${v.roman_urdu}`);setCopied(v.id);setTimeout(()=>setCopied(null),1700)}catch {alert('Clipboard is unavailable in this browser context.')}};
  const selectSurah=(id:number)=>{setSurahId(id);setReaderQuery('');if(innerWidth<800)setSidebar(false)};
  const moveSurah=(direction:-1|1)=>{const target=surahs.find(s=>s.id===surahId+direction);if(target)selectSurah(target.id)};
  return <div className={`app ${dark?'dark':''}`}>
    <aside className={`sidebar ${sidebar?'':'collapsed'}`}>
      <header className="brand"><div className="brand-icon"><BookOpen size={23}/></div><div><strong>Al Quran</strong><small>Arabic · Roman Urdu</small></div></header>
      <div className="side-heading">EXPLORE THE QURAN</div>
      <label className="search-field"><Search size={16}/><input aria-label="Find surah" placeholder="Search all 114 surahs" value={query} onChange={e=>setQuery(e.target.value)}/></label>
      <div className="surah-list">{visibleSurahs.map(s=><button key={s.id} className={`surah-link ${surahId===s.id?'active':''}`} onClick={()=>selectSurah(s.id)}><span className="surah-index">{s.id}</span><span className="surah-info"><strong>{s.name}</strong><small>{s.verses} Ayat</small></span><span className="surah-arabic" dir="rtl">{s.arabic}</span></button>)}</div>
      <footer className="side-footer">Source-aware · Ayat-indexed<br/>Private proof of concept</footer>
    </aside>
    <div className="content">
      <nav className="topbar"><div className="nav-left"><button className="icon-button" aria-label="Toggle sidebar" onClick={()=>setSidebar(!sidebar)}>{sidebar?<PanelLeftClose size={20}/>:<PanelLeftOpen size={20}/>}</button><span className="crumb">Quran <span>/</span> Surah {current.id}</span></div><div className="nav-right"><span className="status-pill">PROOF OF CONCEPT</span><button className="icon-button" aria-label="Show bookmarks" onClick={()=>setShowBookmarks(!showBookmarks)}><ListBookmark size={19}/></button><button className="icon-button" aria-label="Toggle theme" onClick={()=>setDark(!dark)}>{dark?<Sun size={19}/>:<Moon size={19}/>}</button></div></nav>
      <main>
        <div className="hero"><div className="hero-decoration">۞</div><span className="eyebrow">SURAH {current.id} · {current.verses} AYAT</span><div className="hero-arabic" lang="ar" dir="rtl">{current.arabic}</div><h1>{current.name}</h1><p>{surahId===24?'Juz 18 · Source alignment demonstration':'Index available · Verse content not imported yet'}</p><span className="ornament">✦　◇　✦</span></div>
        <div className="reader-tools"><div className="mode-group" role="group" aria-label="Reader language"><button onClick={()=>setMode('both')} className={mode==='both'?'selected':''}>Arabic + Roman</button><button onClick={()=>setMode('arabic')} className={mode==='arabic'?'selected':''}>Arabic</button><button onClick={()=>setMode('roman')} className={mode==='roman'?'selected':''}>Roman Urdu</button></div><div className="font-control"><span>Arabic size</span><button aria-label="Decrease Arabic font size" onClick={()=>setSize(x=>Math.max(22,x-3))}>−</button><span>{size}</span><button aria-label="Increase Arabic font size" onClick={()=>setSize(x=>Math.min(52,x+3))}>+</button></div></div>
        <div className="notice"><AlertTriangle size={17}/><span><strong>Sample data only:</strong> Two source excerpts are displayed for layout testing. Verse associations have not been manually verified. A full 64-Ayat dataset has not been imported.</span></div>
        {showBookmarks&&<section className="bookmark-panel"><div><ListBookmark size={18}/><strong>Saved Ayat</strong></div>{saved.length?saved.map(id=><button key={id} onClick={()=>{const [surah]=id.split(':').map(Number);selectSurah(surah);setShowBookmarks(false)}}>{id}</button>):<p>No saved ayat yet.</p>}</section>}
        {surahId===24?<><label className="verse-search"><Search size={18}/><input placeholder="Search within displayed sample verses..." value={readerQuery} onChange={e=>setReaderQuery(e.target.value)}/></label><div className="ayah-list">{hasOpeningBismillah(surahId)&&mode!=='roman'&&<div className="bismillah" lang="ar" dir="rtl"><span>Opening Bismillah</span><p>{BISMILLAH}</p></div>}{visibleVerses.map(v=><article className="ayah-card" key={v.id}><div className="ayah-header"><span className="ayah-number">{v.id}</span><div className="ayah-actions">{isSajdahAyah(v.id)&&<span className="sajdah-mark" title="Sajdah al-tilawah location">۩ Sajdah</span>}<span className="unverified">Needs review</span><button title="Copy Ayat" aria-label={`Copy ${v.id}`} onClick={()=>copyVerse(v)}>{copied===v.id?<Check size={18}/>:<Copy size={18}/>}</button><button title="Bookmark" aria-label={`Bookmark ${v.id}`} onClick={()=>toggleBookmark(v.id)}><Bookmark size={18} fill={saved.includes(v.id)?'currentColor':'none'}/></button></div></div>{mode!=='roman'&&<p className="ayah-arabic" lang="ar" dir="rtl" style={{fontSize:`${size}px`}}>{v.arabic} <span className="arabic-numeral">۞</span></p>}{mode==='both'&&<div className="verse-divider"/>}{mode!=='arabic'&&<div className="translation"><span className="translation-label">KANZUL IMAN · ROMAN URDU</span><p>{v.roman_urdu}</p></div>}</article>)}{visibleVerses.length===0&&<p className="empty">No matching sample verses.</p>}</div></>:<section className="coming-soon"><BookOpen size={36}/><h2>{current.name} is indexed</h2><p>Arabic and authorized Roman Urdu content for Surah {current.id} is not yet imported. The reader deliberately does not substitute unrelated translations or generate religious text.</p><button onClick={()=>selectSurah(24)}><ArrowLeft size={16}/> View An-Nur sample</button></section>}
        <div className="surah-pagination"><button onClick={()=>moveSurah(-1)} disabled={surahId===1}><ChevronLeft size={17}/> Previous</button><span>Surah {surahId} of 114</span><button onClick={()=>moveSurah(1)} disabled={surahId===114}>Next <ChevronRight size={17}/></button></div>
        <div className="attribution">Arabic canonical source planned: <a href="https://tanzil.net" target="_blank" rel="noreferrer">Tanzil Project</a> (attribution required). Roman Urdu excerpts: <a href="https://www.alahazratnetwork.org/surah/an-nur-%d8%a7%d9%84%d9%86%d9%88%d8%b1/" target="_blank" rel="noreferrer">Alahazrat Network</a> (reuse permission not established). Not a verified religious reference.</div>
      </main>
    </div>
  </div>
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);

