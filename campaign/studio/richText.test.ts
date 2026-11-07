import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRichText, plainRichText, richTextPages, toggleBold } from './richText.ts';

test('bold markers become segments; plain text stays a single segment',()=>{
  assert.deepEqual(parseRichText('Hola mundo').segments,[{text:'Hola mundo',bold:false}]);
  assert.deepEqual(parseRichText('Activo el **DECRETO REAL**!').segments,[
    {text:'Activo el ',bold:false},{text:'DECRETO REAL',bold:true},{text:'!',bold:false},
  ]);
  assert.deepEqual(parseRichText('**todo**').segments,[{text:'todo',bold:true}]);
  assert.deepEqual(parseRichText('').segments,[]);
  // Marcador sin cerrar: negrita hasta el final, sin perder texto.
  const open=parseRichText('a **b c');
  assert.deepEqual(open.segments,[{text:'a ',bold:false},{text:'b c',bold:true}]);
  assert.equal(open.endBold,true);
});

test('HTML is never interpreted, only kept as text',()=>{
  const {segments}=parseRichText('<img src=x onerror=alert(1)> **<b>**');
  assert.deepEqual(segments,[{text:'<img src=x onerror=alert(1)> ',bold:false},{text:'<b>',bold:true}]);
});

test('bold that spans a page break continues on the next page',()=>{
  const pages=richTextPages(['Uno **dos tres.','cuatro** cinco.']);
  assert.deepEqual(pages,[
    [{text:'Uno ',bold:false},{text:'dos tres.',bold:true}],
    [{text:'cuatro',bold:true},{text:' cinco.',bold:false}],
  ]);
  assert.equal(plainRichText('Uno **dos**'),'Uno dos');
});

test('toggleBold wraps, unwraps and inserts markers around the selection',()=>{
  assert.deepEqual(toggleBold('Hola mundo',5,10),{text:'Hola **mundo**',start:7,end:12});
  assert.deepEqual(toggleBold('Hola **mundo**',7,12),{text:'Hola mundo',start:5,end:10});
  assert.deepEqual(toggleBold('Hola **mundo**',5,14),{text:'Hola mundo',start:5,end:10});
  assert.deepEqual(toggleBold('Hola',4,4),{text:'Hola****',start:6,end:6});
  assert.deepEqual(toggleBold('abc',9,-3),{text:'**abc**',start:2,end:5});
});
