import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const module={exports:{}};
const source=fs.readFileSync(new URL('../src/urdu-audio-source.ts',import.meta.url),'utf8');
vm.runInNewContext(ts.transpile(source,{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}),{exports:module.exports});
const {urduRecordings,urduEmbedUrl,urduEpisodeUrl,urduRecording}=module.exports;
assert.deepEqual(Array.from(urduRecordings,r=>r.surah),[22,23,24,25,26]);
assert.equal(urduEmbedUrl(25),'https://castbox.fm/app/castbox/player/id1828548/id131986740?autoplay=0&hide_list=1');
assert.match(urduEpisodeUrl(24),/-id1828548-id129949301$/);
for(const number of [0,1,2,21,27,114,115,NaN]){
  assert.equal(urduRecording(number),undefined);
  assert.equal(urduEmbedUrl(number),null,'Unsupported surahs must never receive guessed URLs');
  assert.equal(urduEpisodeUrl(number),null);
}
for(const r of urduRecordings){
  const embed=new URL(urduEmbedUrl(r.surah));
  assert.equal(embed.origin,'https://castbox.fm');
  assert.equal(embed.searchParams.get('autoplay'),'0','Loading the player must not autoplay');
  assert.equal('ayah' in r,false,'Full-surah sources carry no claimed ayat timing');
}
console.log('Urdu source tests passed: verified catalogue, exact episode mapping, no guessed coverage or autoplay.');
