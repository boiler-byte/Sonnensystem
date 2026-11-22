// Existing v2-v63 source-inspection tests refer to the former single-file
// application. Read the modular controllers (v64 onward) in source order;
// executable assertions (including VM-extracted handlers) remain unchanged.
// New tests should import and exercise the individual controllers directly.
import {readFile} from 'node:fs/promises';

const appParts = [
  'src/app/state.js',
  'src/ui/catalog-controller.js',
  'src/app/view-mode.js',
  'src/ui/layer-panel.js',
  'src/app/animation-controls.js',
  'src/ui/display-controls.js',
  'src/app/horizons-controller.js',
  'src/app/camera-controller.js',
  'src/ui/event-handlers.js',
  'src/app/service-worker-registration.js',
  'src/app/animation-loop.js',
  'src/app/runtime.js',
  'src/app/ar-controller.js',
  'src/app.js'
];

export async function readAppSource(){
  const chunks=await Promise.all(appParts.map(relative =>
    readFile(new URL('../../'+relative,import.meta.url),'utf8')));
  return chunks.map(chunk => chunk
    .replace(/^import\s+[^\n]+\n/gm,'')
    .replace(/^export\s+(?=(?:async\s+)?(?:const|let|function)\b)/gm,'')
  ).join('\n');
}

export function readProjectSource(path){
  return path==='src/app.js' || path==='../src/app.js' ? readAppSource()
    : readFile(new URL('../../'+path.replace(/^\.\.\//,''),import.meta.url),'utf8');
}
