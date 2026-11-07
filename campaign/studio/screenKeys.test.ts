import test from 'node:test';
import assert from 'node:assert/strict';
import { regionScreenKey, speakerLineIds, studioSlug, victoryScreenKey } from './screenKeys.ts';
import { isStudioSceneKey } from './schema.ts';
import { AFTER_VICTORY } from '../afterVictory.ts';

test('repeated speakers get distinct, stable line ids',()=>{
  assert.deepEqual(speakerLineIds(['Xervias','Zhinchi','Xervias']),['xervias-01','zhinchi-01','xervias-02']);
  assert.equal(studioSlug('Crónica Ñandú'),'cronica-nandu');
});

test('every after-victory line gets a unique valid scene key',()=>{
  for(const [mission,lines] of Object.entries(AFTER_VICTORY)){
    const ids=speakerLineIds(lines.map(l=>l.speaker));
    assert.equal(new Set(ids).size,ids.length,mission);
    for(const id of ids)assert.ok(isStudioSceneKey(victoryScreenKey(mission)+'/'+id));
  }
  assert.ok(isStudioSceneKey(regionScreenKey('3','entrada')));
  assert.ok(isStudioSceneKey(regionScreenKey('3','liberada')));
});
