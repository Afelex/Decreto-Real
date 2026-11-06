import test from 'node:test';
import assert from 'node:assert/strict';
import {V3_FILES,isV3Complete} from './prologueV3.ts';

test('activate corrected prologue images only after all six transparent PNG assets arrive',()=>{
 assert.equal(isV3Complete({version:3,completed:6,files:V3_FILES}),true);
 assert.equal(isV3Complete({version:3,completed:5,files:V3_FILES}),false);
 assert.equal(isV3Complete({version:2,completed:6,files:V3_FILES}),false);
 assert.equal(isV3Complete({version:3,completed:6,files:{...V3_FILES,N03:'bad.png'}}),false);
 assert.equal(isV3Complete(null),false);
});
test('v3 assets have distinct child, ring, enraged guard, card and duel-ready sprite',()=>{
 assert.deepEqual(Object.keys(V3_FILES),['N03','N04','X05','D07','G01','D08']);
 assert.ok(Object.values(V3_FILES).every(path=>path.endsWith('.png')));
 assert.match(V3_FILES.X05,/anillo_energia/);
 assert.match(V3_FILES.D08,/invocacion_combate/);
});
