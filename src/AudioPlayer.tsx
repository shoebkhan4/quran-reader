import React,{forwardRef,useEffect,useImperativeHandle,useRef,useState} from 'react';
import {Play,Pause,SkipBack,SkipForward,X} from 'lucide-react';
import {adjacentAyah,recitationUrl,RECITER} from './audio-source';
import {URDU_NARRATOR,urduRecordings,urduRecording,urduEmbedUrl,urduEpisodeUrl} from './urdu-audio-source';
import './audio-player.css';

export type AudioHandle={playAyah:(id:string)=>void;stop:()=>void};
type Props={ids:string[];getStart:()=>string;onCurrent:(id:string|null)=>void;onFollow:(id:string)=>void};
export const AudioPlayer=forwardRef<AudioHandle,Props>(function AudioPlayer({ids,getStart,onCurrent,onFollow},ref){
  const audio=useRef<HTMLAudioElement>(null);
  const request=useRef(0);
  const current=useRef<string|null>(null);
  const [id,setId]=useState<string|null>(null);
  const [visible,setVisible]=useState(false);
  const [audioMode,setAudioMode]=useState<'arabic'|'urdu'>('arabic');
  const [urduSurah,setUrduSurah]=useState<number|null>(null);
  const [urduLoaded,setUrduLoaded]=useState(false);
  const [status,setStatus]=useState<'idle'|'loading'|'playing'|'paused'|'error'|'complete'>('idle');
  const [error,setError]=useState('');
  const [continuous,setContinuous]=useState(true);
  const [follow,setFollow]=useState(true);
  const [repeat,setRepeat]=useState(false);
  const stop=()=>{request.current++;const el=audio.current;if(el){el.pause();el.removeAttribute('src');el.load()}current.current=null;setId(null);setStatus('idle');setError('');setVisible(false);setUrduLoaded(false);onCurrent(null)};
  const playAyah=(key:string)=>{
    const el=audio.current;
    if(!el||!ids.includes(key))return;
    const token=++request.current;
    setVisible(true);setAudioMode('arabic');setUrduLoaded(false);setError('');setStatus('loading');
    if(current.current!==key||el.error||el.ended){el.src=recitationUrl(key);el.load()}
    current.current=key;setId(key);
    void el.play().catch(reason=>{
      if(token!==request.current)return;
      if(reason?.name==='AbortError'){setStatus('paused');return}
      setStatus('error');
      setError(reason?.name==='NotAllowedError'?'Tap Play to allow audio in this browser.':'Audio could not play. Check your connection and tap Retry.');
    });
  };
  useImperativeHandle(ref,()=>({playAyah,stop}));
  useEffect(()=>{const element=audio.current;return()=>{request.current++;element?.pause()}},[]);
  const toggle=()=>{
    const el=audio.current;
    if(!el)return;
    if(!el.paused){request.current++;el.pause();setStatus('paused')}
    else playAyah(current.current||getStart());
  };
  const next=(direction:-1|1)=>{const target=id&&adjacentAyah(ids,id,direction);if(target)playAyah(target)};
  const openUrdu=()=>{
    if(visible&&audioMode==='urdu')return;
    request.current++;
    audio.current?.pause();
    onCurrent(null);
    setStatus('paused');setError('');setAudioMode('urdu');setVisible(true);
    const surah=Number(getStart().split(':')[0]);
    setUrduSurah(urduRecording(surah)?surah:null);
    setUrduLoaded(false);
  };
  const openArabic=()=>{if(audioMode==='arabic')return;setUrduLoaded(false);setAudioMode('arabic');setStatus(current.current?'paused':'idle')};
  const recording=urduSurah?urduRecording(urduSurah):undefined;
  const ended=()=>{
    if(audioMode!=='arabic'||!current.current)return;
    if(repeat){playAyah(current.current);return}
    const target=continuous&&adjacentAyah(ids,current.current,1);
    if(target)playAyah(target);else setStatus('complete');
  };
  return <>
    <audio ref={audio} preload="none" controls={visible&&audioMode==='arabic'} className={visible&&audioMode==='arabic'?'recitation-native':'recitation-hidden'} aria-label="Recitation playback and seek controls"
      onPlaying={()=>{if(audioMode!=='arabic'){audio.current?.pause();return}setStatus('playing');setError('');if(current.current){onCurrent(current.current);if(follow)onFollow(current.current)}}}
      onPause={()=>setStatus(s=>s==='error'||s==='complete'||s==='idle'?s:'paused')}
      onWaiting={()=>setStatus('loading')} onEnded={ended}
      onError={()=>{if(current.current){setStatus('error');setError('Audio is unavailable. Check your connection and tap Retry.')}}}/>
    {visible?<section className={`audio-player ${audioMode==='urdu'?'urdu-player':''}`} aria-label="Quran audio player">
      <div className="audio-heading"><div><strong>{audioMode==='arabic'?RECITER:URDU_NARRATOR}</strong><span>{audioMode==='arabic'?`Arabic recitation${id?` · Ayat ${id}`:''}${status==='loading'?' · Loading…':status==='complete'?' · Finished':''}`:'Kanzul Iman · Urdu narration · Full surah'}</span></div><button aria-label="Stop and close audio" onClick={stop}><X size={19}/></button></div>
      <div className="audio-mode-switch" role="group" aria-label="Audio language"><button aria-pressed={audioMode==='arabic'} onClick={openArabic}>Arabic · Mishary</button><button aria-pressed={audioMode==='urdu'} onClick={openUrdu}>Urdu · Hamza Ali Qadri</button></div>
      {audioMode==='arabic'?<><div className="audio-controls"><button aria-label="Previous audio ayat" disabled={!id||!adjacentAyah(ids,id,-1)} onClick={()=>next(-1)}><SkipBack size={18}/></button><button className="audio-play" aria-label={status==='playing'?'Pause recitation':'Play recitation'} onClick={toggle}>{status==='playing'?<Pause size={19}/>:<Play size={19}/>} {status==='playing'?'Pause':status==='error'?'Retry':'Play'}</button><button aria-label="Next audio ayat" disabled={!id||!adjacentAyah(ids,id,1)} onClick={()=>next(1)}><SkipForward size={18}/></button><label><input type="checkbox" checked={continuous} onChange={e=>setContinuous(e.target.checked)}/> Continue</label><label><input type="checkbox" checked={repeat} onChange={e=>setRepeat(e.target.checked)}/> Repeat ayat</label><label><input type="checkbox" checked={follow} onChange={e=>setFollow(e.target.checked)}/> Follow text</label></div>
      {error&&<p className="audio-error" role="alert">{error}</p>}
      <small>Audio: <a href="https://everyayah.com/" target="_blank" rel="noreferrer">EveryAyah</a> · Internet required</small></>:<div className="urdu-audio-panel">
        <p>Full-surah Urdu listening starts from the beginning. It does not follow individual ayat or change your saved reading places. Para playback and Arabic/Urdu alternation are not available for these recordings.</p>
        <label htmlFor="urdu-audio-surah">Available recordings</label>
        <div className="urdu-audio-selection"><select id="urdu-audio-surah" value={urduSurah??''} onChange={e=>{setUrduSurah(e.target.value?Number(e.target.value):null);setUrduLoaded(false)}}><option value="">Choose a surah</option>{urduRecordings.map(r=><option key={r.surah} value={r.surah}>{r.surah}. {r.name}</option>)}</select>{recording&&!urduLoaded&&<button onClick={()=>setUrduLoaded(true)}>Load Urdu player</button>}</div>
        {!recording&&<p role="status">A verified Urdu recording for your current surah is not in this collection yet. Choose one of the five available surahs above.</p>}
        {recording&&urduLoaded&&<><iframe key={recording.surah} title={`${recording.name} — Urdu narration by ${URDU_NARRATOR}`} src={urduEmbedUrl(recording.surah)!} allow="autoplay" referrerPolicy="strict-origin-when-cross-origin"/><p>Press Play inside the Castbox player. If it stays blank, use “Open recording” below.</p></>}
        {recording&&<a href={urduEpisodeUrl(recording.surah)!} target="_blank" rel="noreferrer">Open recording on Castbox ↗</a>}
        <small>Source: <a href="https://castbox.fm/channel/Hazrat-Allama-Syed-Hamza-Ali-Qadri-R.A-id1828548" target="_blank" rel="noreferrer">Hamza Ali Qadri Urdu collection</a> · Hosted by Castbox · Internet required</small>
      </div>}
    </section>:<div className="listen-launchers"><button className="listen-start" onClick={()=>playAyah(getStart())}><Play size={17}/> Arabic · Mishary</button><button className="listen-start listen-urdu" onClick={openUrdu}><Play size={17}/> Urdu translation</button></div>}
  </>;
});
