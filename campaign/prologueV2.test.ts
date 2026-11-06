import test from 'node:test';
import assert from 'node:assert/strict';
import { isV2Complete,V2_FILES, INVOCATION_CARD_URL } from './prologueV2.ts';
test('only complete six-art v2 manifests activate replacements',()=>{
 assert.equal(isV2Complete({version:2,completed:7,files:V2_FILES}),true);
 assert.equal(isV2Complete({version:2,completed:6,files:V2_FILES}),false);
 assert.equal(isV2Complete({version:1,completed:7,files:V2_FILES}),false);
 assert.equal(isV2Complete({version:2,completed:7,files:{D01:'wrong.webp'}}),false);
});
test('ceremonial invocation card is not in the normal 28-card deck',()=>{
 assert.match(INVOCATION_CARD_URL,/carta-invocacion-real\.svg$/);
 assert.deepEqual(Object.keys(V2_FILES),['D01','D02','D03','D04','D05','F01','F02']);
});
