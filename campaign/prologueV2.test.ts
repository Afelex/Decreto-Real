import {test,expect} from 'vitest';
import { isV2Complete,V2_FILES, INVOCATION_CARD_URL } from './prologueV2';
test('only complete six-art v2 manifests activate replacements',()=>{
 expect(isV2Complete({version:2,completed:6,files:V2_FILES})).toBe(true);
 expect(isV2Complete({version:2,completed:5,files:V2_FILES})).toBe(false);
 expect(isV2Complete({version:1,completed:6,files:V2_FILES})).toBe(false);
 expect(isV2Complete({version:2,completed:6,files:{D01:'wrong.webp'}})).toBe(false);
});
test('ceremonial invocation card is not in the normal 28-card deck',()=>{
 expect(INVOCATION_CARD_URL).toMatch(/carta-invocacion-real\.svg$/);
 expect(Object.keys(V2_FILES)).toEqual(['D01','D02','D03','D04','D05','F01']);
});
