/**
 * Seis variantes expresivas de control — NO aprobadas para escenas.
 * Se descubren solo si su archivo figura en el catálogo G2 publicado;
 * las rutas del catálogo se cotejan con una lista cerrada para impedir
 * referencias de red arbitrarias. NO se guardan en IndexedDB al visualizar.
 */
const RAW='https://raw.githubusercontent.com/Afelex/Decreto-Real/main/';
const TARGETS=[
 {characterId:'leandro-valcazar',label:'Leandro Valcázar · Orden de carga',mission:'M10',variant:'orden-de-carga'},
 {characterId:'octavio-argento',label:'Octavio Argento · Propuesta de pacto',mission:'M14',variant:'propuesta-de-pacto'},
 {characterId:'jeronimo-arrellano',label:'Jerónimo Arrellano · Orden de fuego',mission:'M18',variant:'orden-de-fuego'},
 {characterId:'isabela-valdierra',label:'Isabela Valdierra · Sentenciando',mission:'M26',variant:'sentenciando'},
 {characterId:'aukan-del-condor',label:'Aukan del Cóndor · Orden de avance',mission:'M30',variant:'orden-de-avance'},
 {characterId:'gonzalo-de-montes',label:'Gonzalo de Montes · Dando orden',mission:'M34',variant:'dando-orden'},
] as const;
export type G2ControlCandidate={
 id:string;characterId:string;label:string;mission:string;variant:string;
 path:string;url:string;width:1024;height:1536;status:'candidate_not_approved'
};
type ArtEntry={path:string;state?:string;generation?:string};
const pathOf=(characterId:string,variant:string)=>
 'art-reference/personajes-oficiales/candidatos/'+characterId+'/'+variant+'.png';
export function verifiedG2ControlCandidates(entries:readonly ArtEntry[]):G2ControlCandidate[]{
 const valid=new Set(entries.filter(e=>e.state==='candidato-sin-aprobar'&&
   e.generation==='DR-G2-2026').map(e=>e.path));
 return TARGETS.filter(x=>valid.has(pathOf(x.characterId,x.variant))).map(x=>{
   const path=pathOf(x.characterId,x.variant);
   return {id:'G2-PER-'+x.characterId.toUpperCase()+'-02',characterId:x.characterId,
     label:x.label,mission:x.mission,variant:x.variant,path,url:RAW+path,
     width:1024,height:1536,status:'candidate_not_approved' as const};
 });
}
export async function loadG2ControlCandidates(base:string,request:typeof fetch=fetch):Promise<G2ControlCandidate[]>{
 try{
  const response=await request(base+'artes/catalogo.json',{cache:'no-store'});
  if(!response.ok)return [];
  const payload=await response.json();
  if(payload?.version!==2||!Array.isArray(payload.items))return [];
  return verifiedG2ControlCandidates(payload.items as ArtEntry[]);
 }catch{return [];}
}
