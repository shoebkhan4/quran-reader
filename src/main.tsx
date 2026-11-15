import React, {useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BookOpen, Search, Bookmark, Moon, Sun, Copy, PanelLeftClose, PanelLeftOpen, Check, AlertTriangle, ChevronLeft, ChevronRight, Play} from 'lucide-react';
import juzBoundaries from '../data/juz-boundaries.json';
import surahs from '../data/surahs.json';
import fatihaTranslation from '../data/al-fatiha.translation.review.json';
import arabicCorpus from '../data/quran-qpc-hafs.json';
import {BISMILLAH, getJuzForAyah, getJuzRangeForSurah, hasOpeningBismillah, isSajdahAyah} from '../data/quran-metadata';
import {AudioPlayer,type AudioHandle} from './AudioPlayer';
import './styles.css';
import './reading-experience.css';
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
type ReadingMode='both'|'arabic'|'translation';
type ReadingPlace={name:string;ayah:string;view:'surah'|'para';mode:ReadingMode;language:'roman'|'urdu';updated:string};
function storedJSON(key:string,fallback:unknown){try{return JSON.parse(readStored(key)||'null')??fallback}catch{return fallback}}
const validAyah=(id:unknown):id is string=>typeof id==='string'&&arabicCorpus.verses.some(v=>v.id===id);
function loadPlaces():(ReadingPlace|null)[]{
  const value=storedJSON('quran-reading-places',[]);
  return Array.from({length:5},(_,i)=>{const p=Array.isArray(value)?value[i]:null;return p&&typeof p.name==='string'&&validAyah(p.ayah)&&(p.view==='surah'||p.view==='para')&&['both','arabic','translation'].includes(p.mode)&&['roman','urdu'].includes(p.language)?p:null});
}
function App(){
  const [openingPosition]=useState(initialPosition);
  const [surahId,setSurahId]=useState(()=>Number(openingPosition.split(':')[0]));
  const [query,setQuery]=useState('');
  const [readerQuery,setReaderQuery]=useState('');
  const [mode,setMode]=useState<ReadingMode>(()=>{const v=readStored('quran-mode');return v==='arabic'||v==='translation'?v:'both'});
  const [translationLanguage,setTranslationLanguage]=useState<'roman'|'urdu'>(()=>readStored('quran-language')==='urdu'?'urdu':'roman');
  const [reviewOnly,setReviewOnly]=useState(false);
  const [translationsById,setTranslationsById]=useState(()=>initialTranslationsById);
  const [translationLoading,setTranslationLoading]=useState(false);
  const [size,setSize]=useState(()=>Math.max(22,Math.min(52,Number(readStored('quran-arabic-size'))||31)));
  const [translationSize,setTranslationSize]=useState(()=>Math.max(15,Math.min(36,Number(readStored('quran-translation-size'))||21)));
  const [resumeAyah,setResumeAyah]=useState<string|null>(openingPosition);
  const [dark,setDark]=useState(()=>readStored('quran-dark')==='true');
  const [sidebar,setSidebar]=useState(()=>!matchMedia('(max-width: 800px)').matches);
  const [saved,setSaved]=useState<string[]>(()=>{try{const value=JSON.parse(readStored('quran-bookmarks')||'[]');return Array.isArray(value)?value.filter((id:unknown)=>typeof id==='string'&&arabicCorpus.verses.some(v=>v.id===id)):[]}catch{return []}});
  const [copied,setCopied]=useState<string|null>(null);
  const [showBookmarks,setShowBookmarks]=useState(false);
  const [view,setView]=useState<'surah'|'para'>(()=>readStored('quran-view')==='para'?'para':'surah');
  const [para,setPara]=useState(()=>getJuzForAyah(...openingPosition.split(':').map(Number) as [number,number]));
  const [indexTab,setIndexTab]=useState<'surah'|'para'>(view);
  const [places,setPlaces]=useState(loadPlaces);
  const [editingSlot,setEditingSlot]=useState<number|null>(null);
  const [placeName,setPlaceName]=useState('');
  const [placeTarget,setPlaceTarget]=useState(openingPosition);
  const [undoPlaces,setUndoPlaces]=useState<(ReadingPlace|null)[]|null>(null);
  const [activeAyah,setActiveAyah]=useState<string|null>(null);
  const [goAyah,setGoAyah]=useState('');
  const [message,setMessage]=useState('');
  const audioPlayer=useRef<AudioHandle>(null);
  const [audioAyah,setAudioAyah]=useState<string|null>(null);
  const lastReadId=useRef<string|null>(openingPosition);
  const restoring=useRef(true);
  const current=surahs.find(s=>s.id===surahId)!;
  const versesBySurah=useMemo(()=>new Map([...arabicBySurah].map(([id,verses])=>[id,verses.map(verse=>({...verse,...translationsById.get(verse.id)}))])),[translationsById]);
  const scopeVerses=useMemo(()=>view==='surah'?(versesBySurah.get(surahId)||[]):[...versesBySurah.values()].flat().filter(v=>getJuzForAyah(v.surah,v.ayah)===para),[view,surahId,para,versesBySurah]);
  const reviewVerseCount=scopeVerses.filter(v=>v.urdu&&v.roman_urdu).length;
  const autoRomanizedCount=scopeVerses.filter(v=>v.review_status==='automatic_romanization_review_required').length;
  const visibleSurahs=useMemo(()=>surahs.filter(s=>`${s.id} ${s.name} ${s.arabic}`.toLowerCase().includes(query.toLowerCase())),[query]);
  const visibleVerses=scopeVerses.filter(v=>`${v.id} ${v.urdu||''} ${v.roman_urdu||''} ${v.arabic}`.toLowerCase().includes(readerQuery.toLowerCase())).filter(v=>!reviewOnly||v.review_status==='automatic_romanization_review_required');
  const groups=Array.from(new Set(visibleVerses.map(v=>v.surah))).map(id=>({surah:surahs.find(s=>s.id===id)!,verses:visibleVerses.filter(v=>v.surah===id)}));
  useEffect(()=>{writeStored('quran-view',view);writeStored('quran-mode',mode);writeStored('quran-language',translationLanguage);writeStored('quran-arabic-size',String(size));writeStored('quran-translation-size',String(translationSize));writeStored('quran-dark',String(dark))},[view,mode,translationLanguage,size,translationSize,dark]);
  const bismillahTranslation=translationsById.get('1:1');
  const translationLabel=translationLanguage==='urdu'?'KANZUL IMAN · URDU':'KANZUL IMAN · ROMAN URDU';
  const translationFor=(verse:Pick<Ayah,'urdu'|'roman_urdu'>)=>translationLanguage==='urdu'?verse.urdu:verse.roman_urdu;
  const saveLastRead=(id:string)=>{lastReadId.current=id;writeStored('quran-last-read',id);history.replaceState(null,'',`#${id}`)};
  useEffect(()=>{
    let cancelled=false;
    const units=view==='surah'?translationUnitsForSurah(surahId,current.verses):[...new Set(scopeVerses.flatMap(v=>v.surah===1?[]:v.surah<=3?[String(v.surah)]:[`para-${para}`]))];
    if(!units.length){setTranslationLoading(false);return;}
    setTranslationLoading(true);
    Promise.all(units.map(loadTranslation)).then(documents=>{
      if(cancelled)return;
      setTranslationsById(previous=>new Map([...previous,...documents.flatMap(document=>document.verses).map(verse=>[verse.id,verse] as const)]));
      setTranslationLoading(false);
    }).catch(()=>{if(!cancelled)setTranslationLoading(false)});
    return()=>{cancelled=true};
  },[surahId,current.verses,view,para]);
  useEffect(()=>{writeStored('quran-last-surah',String(surahId))},[surahId]);
  useEffect(()=>{
    if(!resumeAyah)return;
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
  },[surahId,resumeAyah,view,para,mode,translationLanguage]);
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
  },[surahId,sidebar,readerQuery,reviewOnly,view,para,mode]);
  useEffect(()=>{
    if(editingSlot===null&&!activeAyah)return;
    const previous=document.activeElement as HTMLElement|null;
    const dialog=document.querySelector<HTMLElement>('[role="dialog"]');
    const controls=()=>Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled),input')||[]);
    controls()[0]?.focus();
    const keyboard=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){setEditingSlot(null);setActiveAyah(null)}
      if(event.key==='Tab'){const items=controls();const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}
    };
    document.addEventListener('keydown',keyboard);
    return()=>{document.removeEventListener('keydown',keyboard);previous?.focus()};
  },[editingSlot,activeAyah]);
  const toggleBookmark=(id:string)=>setSaved(prev=>{let next=prev.includes(id)?prev.filter(x=>x!==id):[...prev,id];writeStored('quran-bookmarks',JSON.stringify(next));return next});
  const copyVerse=async(v:Ayah)=>{try {await navigator.clipboard.writeText([v.id,mode!=='translation'?v.arabic:'',mode!=='arabic'?translationFor(v):''].filter(Boolean).join('\n'));setCopied(v.id);setTimeout(()=>setCopied(null),1700)}catch {alert('Clipboard is unavailable in this browser context.')}};
  const openAyah=(key:string,nextView:'surah'|'para'=view)=>{if(!validAyah(key))return;audioPlayer.current?.stop();restoring.current=true;setView(nextView);setIndexTab(nextView);setPara(getJuzForAyah(...key.split(':').map(Number) as [number,number]));setSurahId(Number(key.split(':')[0]));setResumeAyah(key);saveLastRead(key);setReaderQuery('');setReviewOnly(false);setShowBookmarks(false);setActiveAyah(null);if(matchMedia('(max-width: 800px)').matches)setSidebar(false)};
  const selectSurah=(id:number)=>openAyah(`${id}:1`,'surah');
  const selectPara=(id:number)=>{const start=juzBoundaries.find(p=>p.juz===id);if(start)openAyah(`${start.surah}:${start.ayah}`,'para')};
  const moveSurah=(direction:-1|1)=>{if(view==='para')selectPara(para+direction);else if(surahs.some(s=>s.id===surahId+direction))selectSurah(surahId+direction)};
  const nearestAyah=()=>{
    if(restoring.current)return lastReadId.current||openingPosition;
    const nodes=Array.from(document.querySelectorAll<HTMLElement>('[data-ayah-id]'));
    const node=nodes.reduce<HTMLElement|null>((a,b)=>!a||Math.abs(b.getBoundingClientRect().top-20)<Math.abs(a.getBoundingClientRect().top-20)?b:a,null);
    return node?.dataset.ayahId||lastReadId.current||openingPosition;
  };
  const followAudio=(id:string)=>{restoring.current=true;setResumeAyah(id);setReaderQuery('');setReviewOnly(false);saveLastRead(id)};
  useEffect(()=>{
    const element=audioAyah?document.getElementById(`ayah-${audioAyah}`):null;
    element?.classList.add('audio-highlight');
    return()=>{element?.classList.remove('audio-highlight')};
  },[audioAyah,mode,view,para,surahId]);
  const switchTranslation=(language:'roman'|'urdu')=>{
    if(language===translationLanguage)return;
    const ayah=nearestAyah();
    restoring.current=true;
    setResumeAyah(ayah);
    setTranslationLanguage(language);
  };
  const beginSave=(slot:number,id?:string)=>{setPlaceTarget(id||nearestAyah());setEditingSlot(slot);setPlaceName(places[slot]?.name||`Reading place ${slot+1}`);setActiveAyah(null)};
  const persistPlaces=(next:(ReadingPlace|null)[])=>{setPlaces(next);writeStored('quran-reading-places',JSON.stringify(next))};
  const savePlace=()=>{if(editingSlot===null||!placeName.trim())return;const next=[...places];next[editingSlot]={name:placeName.trim(),ayah:placeTarget,view,mode,language:translationLanguage,updated:new Date().toISOString()};setUndoPlaces(places);persistPlaces(next);setEditingSlot(null);setMessage('Reading place saved. Browsing will not change it.')};
  const continuePlace=(place:ReadingPlace)=>{setMode(place.mode);setTranslationLanguage(place.language);openAyah(place.ayah,place.view)};
  const bismillah=()=><div className="bismillah" lang="ar" dir="rtl">{mode!=='translation'&&<p>{BISMILLAH}</p>}{mode!=='arabic'&&bismillahTranslation&&<div className={`bismillah-translation ${translationLanguage}`} dir={translationLanguage==='urdu'?'rtl':'ltr'}><p style={{fontSize:`${translationSize}px`}}>{translationFor(bismillahTranslation)}</p></div>}</div>;
  const ayahNumber=(v:Ayah)=><button className={`inline-number ${saved.includes(v.id)?'is-saved':''}`} aria-label={`Actions for ayat ${v.id}`} onClick={()=>setActiveAyah(v.id)}>{mode==='arabic'?v.ayah.toLocaleString('ar-EG'):v.ayah}</button>;
  return <div className={`app ${dark?'dark':''}`}>
    {editingSlot!==null&&<div className="dialog-backdrop"><section role="dialog" aria-modal="true" aria-label="Save reading place" className="reader-dialog"><h2>Save reading place {editingSlot+1}</h2><p>{surahs.find(s=>s.id===Number(placeTarget.split(':')[0]))?.name} · Ayat {placeTarget.split(':')[1]}</p><label>Name<input autoFocus maxLength={40} value={placeName} onChange={e=>setPlaceName(e.target.value)}/></label><p>This replaces only this place. Scrolling never updates it.</p><div><button onClick={()=>setEditingSlot(null)}>Cancel</button><button disabled={!placeName.trim()} onClick={savePlace}>Save place</button></div></section></div>}
    {activeAyah&&<div className="dialog-backdrop" onClick={()=>setActiveAyah(null)}><section role="dialog" aria-modal="true" aria-label={`Ayat ${activeAyah} actions`} className="reader-dialog" onClick={e=>e.stopPropagation()}><h2>Ayat {activeAyah}</h2><button onClick={()=>{audioPlayer.current?.playAyah(activeAyah);setActiveAyah(null)}}><Play size={16}/> Listen to this ayat</button><button onClick={()=>toggleBookmark(activeAyah)}>{saved.includes(activeAyah)?'Remove bookmark':'Bookmark this ayat'}</button><button onClick={()=>{const v=scopeVerses.find(v=>v.id===activeAyah);if(v)void copyVerse(v)}}>{copied===activeAyah?'Copied':'Copy ayat'}</button><h3>Save my reading place here</h3>{places.map((p,i)=><button key={i} onClick={()=>beginSave(i,activeAyah)}>{i+1}. {p?.name||'Empty reading place'}</button>)}<button onClick={()=>setActiveAyah(null)}>Close</button></section></div>}
    <div className="sr-status" role="status">{message}</div>
    <button className={`sidebar-backdrop ${sidebar?'visible':''}`} aria-label="Close surah menu" onClick={()=>setSidebar(false)}/>
    <aside className={`sidebar ${sidebar?'':'collapsed'}`}>
      <header className="brand"><div className="brand-icon"><BookOpen size={23}/></div><div><strong>Al Quran</strong><small>Arabic · Roman Urdu</small></div></header>
      <div className="side-heading">EXPLORE THE QURAN</div><div className="index-tabs" role="group" aria-label="Browse Quran"><button className={indexTab==='surah'?'selected':''} onClick={()=>{setIndexTab('surah');setQuery('')}}>Surah</button><button className={indexTab==='para'?'selected':''} onClick={()=>{setIndexTab('para');setQuery('')}}>Para</button></div>
      <label className="search-field"><Search size={16}/><input aria-label="Search Quran index" placeholder={indexTab==='surah'?'Search all 114 surahs':'Search all 30 paras'} value={query} onChange={e=>setQuery(e.target.value)}/></label>
      <div className="surah-list">{indexTab==='para'?juzBoundaries.filter(p=>`para ${p.juz} ${surahs.find(s=>s.id===p.surah)?.name}`.toLowerCase().includes(query.toLowerCase())).map(p=><button key={p.juz} className={`surah-link ${view==='para'&&para===p.juz?'active':''}`} onClick={()=>selectPara(p.juz)}><span className="surah-index">{p.juz}</span><span className="surah-info"><strong>Para {p.juz}</strong><small>Starts {surahs.find(s=>s.id===p.surah)?.name} · {p.surah}:{p.ayah}</small></span></button>):visibleSurahs.map(s=><button key={s.id} className={`surah-link ${surahId===s.id?'active':''}`} onClick={()=>selectSurah(s.id)}><span className="surah-index">{s.id}</span><span className="surah-info"><strong>{s.name}</strong><small>{s.verses} Ayat · {getJuzRangeForSurah(s.id,s.verses)}</small></span><span className="surah-arabic" dir="rtl">{s.arabic}</span></button>)}</div>
      <footer className="side-footer"><div className="desktop-language-switch"><span className="footer-language-label">TRANSLATION</span><div className="translation-switch" role="group" aria-label="Sidebar translation language"><button aria-pressed={translationLanguage==='urdu'} className={translationLanguage==='urdu'?'selected':''} onClick={()=>switchTranslation('urdu')}>Urdu <span lang="ur" dir="rtl">اردو</span></button><button aria-pressed={translationLanguage==='roman'} className={translationLanguage==='roman'?'selected':''} onClick={()=>switchTranslation('roman')}>Roman Urdu</button></div></div><span className="mobile-footer-note">Source-aware · Ayat-indexed<br/>Private proof of concept</span></footer>
    </aside>
    <div className="content">
      <nav className="topbar"><div className="nav-left"><button className="icon-button" aria-label="Toggle sidebar" onClick={()=>setSidebar(!sidebar)}>{sidebar?<PanelLeftClose size={20}/>:<PanelLeftOpen size={20}/>}</button><span className="crumb">Quran <span>/</span> {view==='para'?`Para ${para}`:`Surah ${current.id}`}</span></div><div className="nav-right"><span className="status-pill">PROOF OF CONCEPT</span><button className="icon-button" aria-label="Show bookmarks" onClick={()=>setShowBookmarks(!showBookmarks)}><Bookmark size={19}/></button><button className="icon-button" aria-label="Toggle theme" onClick={()=>setDark(!dark)}>{dark?<Sun size={19}/>:<Moon size={19}/>}</button></div></nav>
      <AudioPlayer key={`${view}:${view==='para'?para:surahId}`} ref={audioPlayer} ids={scopeVerses.map(v=>v.id)} getStart={nearestAyah} onCurrent={setAudioAyah} onFollow={followAudio}/>
      <main>
        <div className="hero"><div className="hero-decoration">۞</div><span className="eyebrow">{view==='para'?`PARA ${para} · ${scopeVerses.length} AYAT`:`SURAH ${current.id} · ${current.verses} AYAT · ${getJuzRangeForSurah(current.id,current.verses).toUpperCase()}`}</span><div className="hero-arabic" lang="ar" dir="rtl">{view==='para'?`الجزء ${para.toLocaleString('ar-EG')}`:current.arabic}</div><h1>{view==='para'?`Para ${para}`:current.name}</h1><p>{reviewVerseCount?'Urdu + Roman Urdu review data':'QPC Hafs Arabic corpus · Roman Urdu authorization pending'}</p><span className="ornament">✦　◇　✦</span></div>
        <details className="reading-places"><summary>My reading places · {places.filter(Boolean).length}/5 saved</summary><div className="places-heading"><div><h2>My reading places</h2><p>Five places kept safe. Only “Save here” updates them.</p></div><button onClick={()=>openAyah(lastReadId.current||openingPosition)}>Last opened ayat</button></div><div className="places-grid">{places.map((place,i)=><div className="place" key={i}><span className="place-slot">{i+1}</span>{place?<><strong>{place.name}</strong><small>{surahs.find(s=>s.id===Number(place.ayah.split(':')[0]))?.name} · Ayat {place.ayah.split(':')[1]} · {place.view==='para'?`Para ${getJuzForAyah(...place.ayah.split(':').map(Number) as [number,number])}`:'Surah'}</small><small>{new Date(place.updated).toLocaleDateString()} · {place.mode==='both'?'Arabic + Translation':place.mode==='arabic'?'Arabic':place.language==='urdu'?'Urdu':'Roman Urdu'}</small><div><button onClick={()=>continuePlace(place)}>Continue</button><button onClick={()=>beginSave(i)}>Save here</button></div></>:<><strong>Reading place {i+1}</strong><small>Keep your own place here</small><button onClick={()=>beginSave(i)}>Save here</button></>}</div>)}</div><p className="save-hint">To save the ayat you are reading, tap its number and choose a place.</p>{undoPlaces&&<div className="undo-bar" role="status">{message}<button onClick={()=>{persistPlaces(undoPlaces);setUndoPlaces(null);setMessage('Previous reading places restored.')}}>Undo</button></div>}</details>
        <form className="go-ayah" onSubmit={e=>{e.preventDefault();const key=goAyah.includes(':')?goAyah:`${surahId}:${goAyah}`;if(validAyah(key)){openAyah(key);setGoAyah('')}else {setMessage('Enter a valid ayat, for example 2:142.');alert('Enter a valid ayat, for example 2:142.')}}}><label htmlFor="go-ayah">Go to ayat</label><input id="go-ayah" value={goAyah} onChange={e=>setGoAyah(e.target.value)} placeholder={view==='para'?'e.g. 2:142':`1–${current.verses} or surah:ayat`}/><button>Go</button></form>
        <div className="reader-tools"><div className="mode-group" role="group" aria-label="Reader language"><button onClick={()=>setMode('both')} className={mode==='both'?'selected':''}>Arabic + Translation</button><button onClick={()=>setMode('arabic')} className={mode==='arabic'?'selected':''}>Arabic</button><button onClick={()=>setMode('translation')} className={mode==='translation'?'selected':''}>Translation</button></div><div className="translation-switch" role="group" aria-label="Translation language"><button onClick={()=>switchTranslation('roman')} className={translationLanguage==='roman'?'selected':''}>Roman Urdu</button><button onClick={()=>switchTranslation('urdu')} className={translationLanguage==='urdu'?'selected':''}>Urdu</button></div><div className="translation-switch review-switch" role="group" aria-label="Auto-Romanized filter"><button onClick={()=>setReviewOnly(false)} className={!reviewOnly?'selected':''}>All ayat</button><button onClick={()=>setReviewOnly(true)} className={reviewOnly?'selected':''}>Auto {autoRomanizedCount||''}</button></div><div className="font-control"><span>Arabic size</span><button aria-label="Decrease Arabic font size" onClick={()=>setSize(x=>Math.max(22,x-3))}>−</button><span>{size}</span><button aria-label="Increase Arabic font size" onClick={()=>setSize(x=>Math.min(52,x+3))}>+</button></div><div className="font-control"><span>Translation size</span><button aria-label="Decrease translation font size" onClick={()=>setTranslationSize(x=>Math.max(15,x-2))}>−</button><span>{translationSize}</span><button aria-label="Increase translation font size" onClick={()=>setTranslationSize(x=>Math.min(36,x+2))}>+</button></div></div>
        <div className="notice"><AlertTriangle size={17}/><span>{translationLoading?<><strong>Loading translation:</strong> Arabic is ready; the selected Para data is being loaded.</>:reviewVerseCount?<><strong>Translation data:</strong> {reviewVerseCount} of {scopeVerses.length} ayahs have Urdu and Roman Urdu loaded from validated source rows. {autoRomanizedCount?`${autoRomanizedCount} ayah${autoRomanizedCount===1?' is':'s are'} marked Auto-Romanized where the source Roman text was blank.`:'All loaded Roman Urdu is source-based.'}</>:<><strong>Roman Urdu release gate:</strong> Arabic is complete and ayah-indexed. This surah's Urdu and Roman Urdu review data has not been imported yet.</>}</span></div>
        {showBookmarks&&<section className="bookmark-panel"><div><Bookmark size={18}/><strong>Saved Ayat</strong></div>{saved.length?saved.map(id=><button key={id} onClick={()=>openAyah(id)}>{surahs.find(s=>s.id===Number(id.split(':')[0]))?.name} · Ayat {id.split(':')[1]}</button>):<p>No saved ayat yet.</p>}</section>}
        <label className="verse-search"><Search size={18}/><input aria-label="Search ayat" placeholder={`Search within this ${view==='para'?'para':'surah'}...`} value={readerQuery} onChange={e=>setReaderQuery(e.target.value)}/></label>
        <div className={`ayah-list ${mode!=='both'?'continuous-list continuous-card':''}`}>{groups.map(group=><section key={group.surah.id} className={mode!=='both'?'continuous-section':'surah-section'} aria-label={group.surah.name}>
          {view==='para'&&<h2 className="surah-divider"><span>{group.surah.name}</span><span lang="ar" dir="rtl">{group.surah.arabic}</span></h2>}
          {group.verses[0]?.ayah===1&&group.surah.id!==1&&hasOpeningBismillah(group.surah.id)&&!reviewOnly&&bismillah()}
          {mode==='both'?group.verses.map(v=><article className="ayah-card" id={`ayah-${v.id}`} data-ayah-id={v.id} key={v.id}><div className="ayah-header"><div className="ayah-location"><button className="ayah-number" onClick={()=>setActiveAyah(v.id)} aria-label={`Actions for ayat ${v.id}`}>{v.id}</button><span className="para-number">Para {getJuzForAyah(v.surah,v.ayah)}</span></div><div className="ayah-actions"><button aria-label={`Play ayat ${v.id}`} title="Listen to this ayat" onClick={()=>audioPlayer.current?.playAyah(v.id)}><Play size={18}/></button>{isSajdahAyah(v.id)&&<span className="sajdah-mark">۩ Sajdah</span>}{v.review_status==='automatic_romanization_review_required'&&<span className="unverified">Auto-Romanized</span>}<button aria-label={`Copy ${v.id}`} onClick={()=>copyVerse(v)}>{copied===v.id?<Check size={18}/>:<Copy size={18}/>}</button><button aria-pressed={saved.includes(v.id)} aria-label={`Bookmark ${v.id}`} onClick={()=>toggleBookmark(v.id)}><Bookmark size={18} fill={saved.includes(v.id)?'currentColor':'none'}/></button></div></div><p className="ayah-arabic" lang="ar" dir="rtl" style={{fontSize:`${size}px`}}>{v.arabic}</p><div className="verse-divider"/><div className="translation"><span className="translation-label">{translationLabel}</span><p dir={translationLanguage==='urdu'?'rtl':'ltr'} style={{fontSize:`${translationSize}px`}}>{translationFor(v)||'Translation is not loaded yet.'}</p></div></article>):<div className={`continuous-text ${mode==='arabic'?'arabic-flow':translationLanguage==='urdu'?'urdu-flow':'roman-flow'}`} lang={mode==='arabic'?'ar':translationLanguage==='urdu'?'ur':undefined} dir={mode==='arabic'||translationLanguage==='urdu'?'rtl':'ltr'} style={{fontSize:`${mode==='arabic'?size:translationSize}px`}}>{group.verses.map(v=><React.Fragment key={v.id}><span className="inline-ayah" id={`ayah-${v.id}`} data-ayah-id={v.id}>{mode==='arabic'?v.arabic:translationFor(v)||'Translation is not loaded yet.'} {ayahNumber(v)}{isSajdahAyah(v.id)&&<small className="sajdah-mark">۩ Sajdah</small>}{mode==='translation'&&v.review_status==='automatic_romanization_review_required'&&<small className="auto-note"> Auto-Romanized </small>}</span>{' '}</React.Fragment>)}</div>}
        </section>)}{!visibleVerses.length&&<p className="empty">No matching ayat.</p>}</div>
        <div className="surah-pagination"><button onClick={()=>moveSurah(-1)} disabled={(view==='para'?para:surahId)===1}><ChevronLeft size={17}/> Previous</button><span>{view==='para'?`Para ${para} of 30`:`Surah ${surahId} of 114`}</span><button onClick={()=>moveSurah(1)} disabled={view==='para'?para===30:surahId===114}>Next <ChevronRight size={17}/></button></div>
        <div className="attribution">Arabic text: <a href="https://api.quranpedia.net/dumps/mushafs-2.json.gz" target="_blank" rel="noreferrer">Qur'anpedia QPC Hafs</a>, dump 2026-09-30 · <a href="https://api.quranpedia.net/dumps/LICENSE.md" target="_blank" rel="noreferrer">source license</a>. Urdu/Roman Urdu review source: <a href="https://www.alahazratnetwork.org/quran/" target="_blank" rel="noreferrer">Alahazrat Network</a>, public-domain status confirmed by project owner. Not a verified religious reference.</div>
      </main>
    </div>
  </div>
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);

