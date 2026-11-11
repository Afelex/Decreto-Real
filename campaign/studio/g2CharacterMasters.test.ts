import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {publishedG2GeneralMasters} from './g2CharacterMasters.ts';

test('los seis maestros G2 publicados conservan hash, formato y dimensiones de su archivo original',()=>{
  const all=publishedG2GeneralMasters();
  assert.equal(all.length,6);
  assert.equal(new Set(all.map(x=>x.characterId)).size,6);
  const catalog=JSON.parse(readFileSync('art-reference/personajes-oficiales/catalogo.json','utf8'));
  for(const item of all){
    const character=catalog.personajes.find(p=>p.id===item.characterId);
    assert.ok(character?.imagenEnRepositorio,'Maestro no publicado: '+item.characterId);
    assert.equal(character.archivoPendiente,item.path);
    assert.equal(item.status,'master_only');
    assert.ok(item.url.endsWith('/'+item.path)&&item.url.startsWith('https://raw.githubusercontent.com/Afelex/Decreto-Real/main/'));
    const data=readFileSync(item.path);
    assert.equal(statSync(item.path).size,item.bytes);
    assert.equal(createHash('sha256').update(data).digest('hex'),item.sha256);
    if(item.mime==='image/png'){
      assert.deepEqual([...data.subarray(0,8)],[137,80,78,71,13,10,26,10]);
      assert.equal(data.readUInt32BE(16),item.width);
      assert.equal(data.readUInt32BE(20),item.height);
      assert.equal(data[25],6);
      assert.equal(item.transparent,true);
    }else{
      assert.deepEqual([...data.subarray(0,3)],[255,216,255]);
      assert.equal(item.transparent,false);
    }
  }
});
