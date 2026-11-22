import assert from 'node:assert/strict';
import {test} from 'node:test';
import {clearSceneSelection} from '../src/app/runtime.js';
import {S,mobileSheets,setMobileSheets} from '../src/app/state.js';

test('v143: tapping an empty scene twice closes the mobile sheet without a ReferenceError',()=>{
  const previousSelection=S.selected;
  const previousSheets=mobileSheets;
  const actions=[];
  try{
    S.selected=null;
    setMobileSheets({
      selectPanel(name){actions.push(`panel:${name}`);},
      close(){actions.push('close');}
    });
    assert.doesNotThrow(()=>clearSceneSelection());
    assert.deepEqual(actions,['panel:catalog','close']);
  }finally{
    S.selected=previousSelection;
    setMobileSheets(previousSheets);
  }
});
