import test from 'node:test';
import assert from 'node:assert/strict';
import {loadG2ControlCandidates,verifiedG2ControlCandidates} from './g2ControlCandidateLibrary.ts';

test('las seis expresiones de control se ocultan hasta publicarse en GitHub',()=>{
 assert.deepEqual(verifiedG2ControlCandidates([]),[]);
 assert.deepEqual(verifiedG2ControlCandidates([{path:'art-reference/personajes-oficiales/candidatos/leandro-valcazar/orden-de-carga.png',generation:'DR-G2-2026',state:'nueva-generacion'}]),[]);
});
test('catálogo cerrado permite exactamente los seis candidatos no aprobados',()=>{
 const ids=[
 ['leandro-valcazar','orden-de-carga'],['octavio-argento','propuesta-de-pacto'],
 ['jeronimo-arrellano','orden-de-fuego'],['isabela-valdierra','sentenciando'],
 ['aukan-del-condor','orden-de-avance'],['gonzalo-de-montes','dando-orden']
 ];
 const input=ids.map(([id,v])=>({path:'art-reference/personajes-oficiales/candidatos/'+id+'/'+v+'.png',generation:'DR-G2-2026',state:'candidato-sin-aprobar'}));
 input.push({path:'https://evil.invalid/image.png',generation:'DR-G2-2026',state:'candidato-sin-aprobar'});
 const actual=verifiedG2ControlCandidates(input);
 assert.equal(actual.length,6);
 assert.ok(actual.every(x=>x.url.startsWith('https://raw.githubusercontent.com/Afelex/Decreto-Real/main/art-reference/')));
 assert.ok(actual.every(x=>x.status==='candidate_not_approved'&&x.width===1024&&x.height===1536));
 assert.equal(new Set(actual.map(x=>x.path)).size,6);
});
test('versión antigua o catálogo ausente no causa regresión en DRStudio',async()=>{
 const no=(async()=>new Response('Not found',{status:404})) as typeof fetch;
 assert.deepEqual(await loadG2ControlCandidates('/Decreto-Real/',no),[]);
 const invalid=(async()=>new Response('{"version":1}',{status:200})) as typeof fetch;
 assert.deepEqual(await loadG2ControlCandidates('/Decreto-Real/',invalid),[]);
});
