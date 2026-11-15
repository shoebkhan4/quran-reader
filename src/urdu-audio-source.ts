/** Urdu-only full-surah recordings credited to Syed Hamza Ali Qadri.
 * Catalog: https://castbox.fm/channel/Hazrat-Allama-Syed-Hamza-Ali-Qadri-R.A-id1828548
 * Embed contract: https://helpcenter.castbox.fm/portal/en/kb/articles/how-to-custom
 * No ayat timings are supplied: never use these for ayat highlighting/tracking.
 */
export const URDU_NARRATOR='Maulana Syed Hamza Ali Qadri';
export const URDU_CHANNEL='1828548';
export const urduRecordings=[
  {surah:22,name:'Al-Hajj',episode:'125721493',slug:'22-Surah-Al-Hajj-Only-Urdu-Translation-(Complete)'},
  {surah:23,name:'Al-Mu’minun',episode:'127792322',slug:'23-Surah-Al-Mu’minoon-Only-Urdu-Translation-(Complete)'},
  {surah:24,name:'An-Nur',episode:'129949301',slug:'24-Surah-Al-Noor-Only-Urdu-Translation-(Complete)'},
  {surah:25,name:'Al-Furqan',episode:'131986740',slug:'25-Surah-Al-Furqan-Only-Urdu-Translation-(Complete)'},
  {surah:26,name:'Ash-Shu‘ara',episode:'131986741',slug:'26-Surah-Ash-Shuraa-Only-Urdu-Translation-(Complete)'},
] as const;
export function urduRecording(surah:number){return urduRecordings.find(r=>r.surah===surah)}
export function urduEmbedUrl(surah:number){
  const recording=urduRecording(surah);
  return recording?`https://castbox.fm/app/castbox/player/id${URDU_CHANNEL}/id${recording.episode}?autoplay=0&hide_list=1`:null;
}
export function urduEpisodeUrl(surah:number){
  const recording=urduRecording(surah);
  return recording?`https://castbox.fm/episode/${recording.slug}-id${URDU_CHANNEL}-id${recording.episode}`:null;
}
