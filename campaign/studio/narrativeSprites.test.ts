import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  NARRATIVE_SPRITES,isNarrativeSpriteId,narrativeSpriteOptions,
  resolveNarrativeCardSprite,resolveNarrativeSprite,
} from './narrativeSprites.ts';
import {GUIDED_STEPS} from '../guidedOpeningDuel.ts';
import {normalizeStudioDocumentV3} from './schema.ts';

test('all narrative sprite references exist in the versioned art catalog',()=>{
  const catalog=JSON.parse(readFileSync(new URL('../../public/artes/catalogo.json',import.meta.url),'utf8')) as
    {items:{path:string}[]};
  const entries=new Set(catalog.items.map(item=>item.path));
  const ids=new Set<string>();
  for(const sprite of NARRATIVE_SPRITES){
    assert.ok(!ids.has(sprite.id),'duplicate sprite id: '+sprite.id);
    ids.add(sprite.id);
    assert.ok(entries.has('public/'+sprite.path),'missing catalog entry: '+sprite.path);
    assert.ok(!sprite.path.startsWith('/'));
    assert.ok(!sprite.path.includes('..'));
    assert.equal(isNarrativeSpriteId(sprite.id),true);
  }
  assert.equal(isNarrativeSpriteId('https://example.com/image.png'),false);
  assert.equal(isNarrativeSpriteId('../../secret'),false);
  assert.ok(narrativeSpriteOptions('Xervias').length>=4);
  assert.ok(narrativeSpriteOptions('Domingo Quispe').length>=4);
});

test('every guided intervention selects a sprite matching the speaking character',()=>{
  const published=JSON.parse(readFileSync(new URL('../../public/studio/composiciones.json',import.meta.url),'utf8'));
  for(const step of GUIDED_STEPS){
    const card=published.scenes['tutorial/'+step.id]?.narrative;
    const selected=resolveNarrativeCardSprite(card,step.speaker);
    if((card?.speaker??step.speaker)==='Sistema')assert.equal(selected,undefined);
    else assert.equal(selected?.speaker,card?.speaker??step.speaker);
  }
  assert.equal(resolveNarrativeSprite('Xervias','decidido')?.id,'xervias-objecion');
  assert.equal(resolveNarrativeSprite('Domingo Quispe','enojado')?.id,'domingo-furioso');
  assert.equal(resolveNarrativeSprite('Domingo Quispe','preocupado')?.id,'domingo-derrotado');
});

test('only registered, same-character overrides are accepted; unsafe ids are discarded',()=>{
  const doc=normalizeStudioDocumentV3({version:3,scenes:{
    'tutorial/g01':{narrative:{speaker:'Xervias',tone:'neutral',spriteId:'domingo-furioso'}},
    'tutorial/g02':{narrative:{speaker:'Xervias',tone:'neutral',spriteId:'https://attacker.invalid/img'}},
    'tutorial/g10':{narrative:{speaker:'Domingo Quispe',tone:'neutral',spriteId:'domingo-burlon'}},
  }});
  assert.equal(doc.scenes['tutorial/g02'].narrative?.spriteId,undefined);
  assert.equal(resolveNarrativeCardSprite(doc.scenes['tutorial/g01'].narrative,'Xervias')?.id,'xervias-tutorial');
  assert.equal(resolveNarrativeCardSprite(doc.scenes['tutorial/g10'].narrative,'Domingo Quispe')?.id,'domingo-burlon');
  assert.equal(resolveNarrativeCardSprite({speaker:'Sistema',tone:'enojado',spriteId:'domingo-furioso'},'Sistema'),undefined);
  const restored=normalizeStudioDocumentV3(JSON.parse(JSON.stringify(doc)));
  assert.deepEqual(restored,doc);
});
