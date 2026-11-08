import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STUDIO_V3_STORAGE_KEY, actorLayerId, defaultLayerTransform, emptyStudioDocumentV3,
  normalizeStudioDocumentV3, normalizeStudioLayer, parseStudioDocumentV3,
  type StudioDocumentV3,
} from './schema.ts';

const MEDIA='media-11111111-1111-4111-8111-111111111111';
const EXTRA='extra-33333333-3333-4333-8333-333333333333';

const sample=():StudioDocumentV3=>({
  version:3,
  assets:{[MEDIA]:{name:'destello.gif',mime:'image/gif'}},
  scenes:{
    'prologo/arresto-01':{
      titleVisible:false,
      background:{assetId:MEDIA},
      layers:[
        {id:'actor-nino',kind:'actor',actor:'Niño',...defaultLayerTransform('actor','Niño'),x:12.5,mirror:true},
        {id:'bubble',kind:'bubble',...defaultLayerTransform('bubble'),text:'¡Ayuda!'},
        {id:EXTRA,kind:'effect',name:'Destello',assetId:MEDIA,...defaultLayerTransform('effect'),opacity:.5,rotation:-15},
      ],
    },
  },
});

test('v3 documents roundtrip through JSON unchanged',()=>{
  const doc=sample();
  assert.deepEqual(parseStudioDocumentV3(JSON.stringify(doc)),doc);
  assert.equal(STUDIO_V3_STORAGE_KEY,'decreto-real.studio.borradores.v3');
  assert.deepEqual(parseStudioDocumentV3(JSON.stringify(emptyStudioDocumentV3())),emptyStudioDocumentV3());
});

test('actors, images, effects and the bubble share one z plane, sorted on read',()=>{
  const doc=sample();
  doc.scenes['prologo/arresto-01'].layers!.reverse();
  const layers=parseStudioDocumentV3(JSON.stringify(doc)).scenes['prologo/arresto-01'].layers!;
  assert.deepEqual(layers.map(l=>l.id),['actor-nino','bubble',EXTRA]);
  assert.deepEqual(layers.map(l=>l.z),[16,47,49]);
});

test('v3 rejects incompatible versions and clamps every numeric field',()=>{
  assert.throws(()=>parseStudioDocumentV3(JSON.stringify({version:1,scenes:{}})),/v3 no compatible/);
  assert.throws(()=>parseStudioDocumentV3(JSON.stringify({version:3,scenes:[]})),/escenas/);
  assert.throws(()=>parseStudioDocumentV3('x'.repeat(3_000_001)),/3 MB/);
  const layer=normalizeStudioLayer({kind:'actor',actor:'Madre',x:900,y:-900,scale:9,rotation:720,
    opacity:4,z:500,mirror:'sí',visible:null});
  assert.deepEqual(layer,{id:'actor-madre',kind:'actor',actor:'Madre',
    x:100,y:-100,scale:2.75,rotation:180,opacity:1,mirror:false,z:100,visible:true});
  assert.equal(normalizeStudioLayer({kind:'actor',actor:'Madre',scale:0,opacity:-1,z:0})?.scale,.35);
});

test('actor layer ids are derived from the actor, never trusted from input',()=>{
  const layer=normalizeStudioLayer({id:'../../hack',kind:'actor',actor:'Domingo Quispe'});
  assert.equal(layer?.id,actorLayerId('Domingo Quispe'));
  assert.equal(normalizeStudioLayer({kind:'actor',actor:'Virrey'}),null);
  assert.equal(normalizeStudioLayer({kind:'script'}),null);
});

test('v3 drops hostile keys, unknown mime types and broken media references',()=>{
  const parsed=normalizeStudioDocumentV3({version:3,
    assets:{
      [MEDIA]:{name:'ok.png',mime:'image/png'},
      'media-22222222-2222-4222-8222-222222222222':{name:'x.svg',mime:'image/svg+xml'},
      'javascript:alert(1)':{name:'x',mime:'image/png'},
    },
    scenes:{
      '../../secret':{titleVisible:false},
      'opening:1':{titleVisible:false},
      'prologo/arresto-01':{
        background:{assetId:'media-22222222-2222-4222-8222-222222222222'},
        layers:[
          {kind:'actor',actor:'Madre',assetId:'media-99999999-9999-4999-8999-999999999999'},
          {id:EXTRA,kind:'image',name:'roto',assetId:'media-99999999-9999-4999-8999-999999999999'},
          {id:'bad',kind:'image',name:'x',assetId:MEDIA},
          {kind:'bubble',text:'x'.repeat(500)},
          {kind:'bubble',text:'duplicado'},
        ],
      },
    }});
  assert.deepEqual(Object.keys(parsed.assets??{}),[MEDIA]);
  assert.deepEqual(Object.keys(parsed.scenes),['prologo/arresto-01']);
  const scene=parsed.scenes['prologo/arresto-01'];
  assert.equal(scene.background,undefined);
  assert.deepEqual(scene.layers?.map(l=>l.id),['actor-madre','bubble']);
  const madre=scene.layers?.[0];
  assert.ok(madre&&madre.kind==='actor'&&madre.assetId===undefined);
  const bubble=scene.layers?.[1];
  assert.ok(bubble&&bubble.kind==='bubble'&&bubble.text?.length===140);
});

test('v3 limits media layers across the whole document',()=>{
  const scenes:Record<string,unknown>={};
  for(let s=0;s<3;s++){
    scenes['prologo/beat-'+s]={layers:Array.from({length:50},(_,i)=>({
      id:'extra-'+String(s*100+i).padStart(12,'0'),kind:'image',name:'n',assetId:MEDIA,
    }))};
  }
  const parsed=normalizeStudioDocumentV3({version:3,assets:{[MEDIA]:{name:'a',mime:'image/png'}},scenes});
  const total=Object.values(parsed.scenes).reduce((n,s)=>n+(s.layers?.length??0),0);
  assert.equal(total,100);
});

test('narrative cards survive v3 serialization and reject unknown fields',()=>{
  const intent='Explicar el combo';
  const source={version:3,scenes:{
    'tutorial/g08':{narrative:{
      speaker:'  Xervias  ',tone:'decidido',intent,direction:'Mostrar mano y menú.',
      script:'alert(1)',action:'autoWin',
    }},
    'tutorial/g09':{narrative:{speaker:'',tone:'invalid',intent:' '.repeat(5)}},
  }};
  const parsed=normalizeStudioDocumentV3(source);
  assert.deepEqual(parsed.scenes['tutorial/g08']?.narrative,{
    speaker:'Xervias',tone:'decidido',intent,direction:'Mostrar mano y menú.',
  });
  assert.equal(parsed.scenes['tutorial/g09'],undefined);
  assert.deepEqual(parseStudioDocumentV3(JSON.stringify(parsed)),parsed);
  const lengthy=normalizeStudioDocumentV3({version:3,scenes:{
    'tutorial/g11':{narrative:{speaker:'a'.repeat(200),intent:'i'.repeat(300),
      direction:'d'.repeat(800),tone:'sorprendido'}},
  }});
  assert.equal(lengthy.scenes['tutorial/g11'].narrative?.speaker?.length,80);
  assert.equal(lengthy.scenes['tutorial/g11'].narrative?.intent?.length,180);
  assert.equal(lengthy.scenes['tutorial/g11'].narrative?.direction?.length,360);
});
