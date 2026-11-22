/**
 * Erzeugt css/styles.css aus den thematisch getrennten CSS-Quellen.
 * @chunk-IDs erhalten die historische Reihenfolge der Kaskade inklusive
 * nachträglicher Überschreibungen und über das Projekt verteilter Media Queries.
 * Innerhalb eines Chunks stehen die Regeln zur Lesbarkeit auf eigenen Zeilen;
 * nur diese zusätzlichen Zeilenumbrüche werden für die Ausgabe entfernt.
 *
 * npm run build:css          Ausgabe aktualisieren
 * npm run check:css          Geprüfte Ausgabe muss aktuell sein
 */
import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const sources=[
  'base/variables.css',
  'base/reset.css',
  'base/layout.css',
  'components/catalog.css',
  'components/details.css',
  'components/controls.css',
  'components/timeline.css',
  'components/bottom-sheet.css',
  'responsive.css'
];
const check=process.argv.includes('--check');
const chunks=new Map();

// Der Parser erkennt ausschließlich schließende Klammern auf oberster Ebene.
// Strings, Escapes und CSS-Kommentare bleiben dabei unverändert.
function ruleEnds(css){
  const ends=[];
  let depth=0,quote=null,comment=false;
  for(let i=0;i<css.length;i++){
    const ch=css[i],next=css[i+1];
    if(comment){if(ch==='*'&&next==='/'){comment=false;i++;}continue;}
    if(quote){if(ch==='\\'){i++;continue;}if(ch===quote)quote=null;continue;}
    if(ch==='/'&&next==='*'){comment=true;i++;continue;}
    if(ch==='"'||ch==="'"){quote=ch;continue;}
    if(ch==='{')depth++;
    else if(ch==='}'){
      if(--depth<0)throw new Error('CSS: unerwartete schließende Klammer');
      if(depth===0)ends.push(i+1);
    }
  }
  if(depth!==0||quote!==null||comment)throw new Error('CSS: nicht geschlossene Regel, Zeichenkette oder Kommentar');
  return ends;
}

function restoreChunk(text,id){
  const ends=ruleEnds(text);
  if(!ends.length)throw new Error(`Chunk ${id} enthält keine CSS-Regel`);
  // Nach jeder Regel außer der letzten wurde in der Quelle genau ein LF
  // eingefügt. Ursprüngliche Leerzeichen/Zeilenumbrüche folgen erst danach.
  for(let i=ends.length-2;i>=0;i--){
    const end=ends[i];
    if(text[end]!=='\n')throw new Error(`Chunk ${id}: Regel-Trennzeile fehlt`);
    text=text.slice(0,end)+text.slice(end+1);
  }
  return text;
}

for(const source of sources){
  const path=join(root,'css',source);
  const content=await readFile(path,'utf8');
  const marker=/\/\* @chunk (\d{4}) \*\/\n([\s\S]*?)\n\/\* @endchunk \1 \*\/\n/g;
  let match;
  while((match=marker.exec(content))!==null){
    const id=Number(match[1]);
    if(chunks.has(id))throw new Error(`Chunk ${id} ist doppelt vorhanden`);
    chunks.set(id,restoreChunk(match[2],id));
  }
  const leftover=content.replace(marker,'').replace(/^\/\*[\s\S]*?\*\//,'').trim();
  if(leftover)throw new Error(`Unerkannter Inhalt in ${source}: ${leftover.slice(0,100)}`);
}
if(!chunks.size)throw new Error('Keine CSS-Chunks gefunden');
const ids=[...chunks.keys()].sort((a,b)=>a-b);
for(let i=0;i<ids.length;i++){
  if(ids[i]!==i)throw new Error(`Fehlender CSS-Chunk ${i}`);
}
const css=ids.map(id=>chunks.get(id)).join('');
const output=join(root,'css','styles.css');
if(check){
  const current=await readFile(output,'utf8').catch(()=>null);
  if(current!==css){
    console.error('css/styles.css ist nicht aktuell. Bitte npm run build:css ausführen.');
    process.exitCode=1;
  }else console.log(`CSS aktuell: ${ids.length} Chunks, ${Buffer.byteLength(css)} Bytes`);
}else{
  await writeFile(output,css,'utf8');
  console.log(`CSS generiert: ${ids.length} Chunks, ${Buffer.byteLength(css)} Bytes`);
}
