import surahs from '../data/surahs.json';

export const RECITER = 'Mishary Rashid Alafasy';
export function recitationUrl(id:string):string {
  const match=id.match(/^(\d{1,3}):(\d{1,3})$/);
  const surah=surahs.find(s=>s.id===Number(match?.[1]));
  const ayah=Number(match?.[2]);
  if(!surah||ayah<1||ayah>surah.verses)throw new Error('Invalid ayat');
  return `https://everyayah.com/data/Alafasy_128kbps/${String(surah.id).padStart(3,'0')}${String(ayah).padStart(3,'0')}.mp3`;
}
export function adjacentAyah(ids:string[],id:string,direction:-1|1):string|null {
  const index=ids.indexOf(id);
  return index<0?null:ids[index+direction]??null;
}
