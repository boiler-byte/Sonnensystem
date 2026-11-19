import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';

const html=()=>readFile(new URL('../index.html',import.meta.url),'utf8');

test('v61: the oblique camera SVG looks to the lower-left',async()=>{
  const text=await html();
  const button=text.split('id="reset-camera"')[1]?.split('</button>')[0];
  assert.ok(button,'camera-reset button should exist');
  const icon=button.match(/<svg class="camera-perspective-icon" data-perspective="oblique"[^>]*><g transform="rotate\(([-\d.]+) 12 12\)">([\s\S]*?)<\/g><\/svg>/);
  assert.ok(icon,'oblique icon should be an SVG with a rotated lens');
  assert.match(icon[2],/<rect x="3\.2"/);
  assert.match(icon[2],/<path d="m15\.6 10\.2/);
  const angle=Number(icon[1])*Math.PI/180;
  const lensDirection=[Math.cos(angle),Math.sin(angle)];
  assert.ok(lensDirection[0]<-.5,'lens must point left');
  assert.ok(lensDirection[1]>.5,'lens must point downward');
});

test('v69: topdown, side, front-on and next-perspective action remain available',async()=>{
  const text=await html();
  const button=text.split('id="reset-camera"')[1]?.split('</button>')[0];
  assert.match(button,/data-next-perspective="topdown"/);
  assert.match(button,/data-perspective="topdown"[^>]*><g transform="rotate\(90 12 12\)"/);
  assert.match(button,/data-perspective="side"[^>]*><g transform="rotate\(180 12 12\)"/);
  assert.match(button,/data-perspective="free"[^>]*><rect x="3\.5"/);
  assert.equal((button.match(/<svg\b/g)||[]).length,4);
});
