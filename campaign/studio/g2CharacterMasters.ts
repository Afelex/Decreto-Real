/**
 * Seis referencias maestras G2 del bloque 02. Son ORIGINALES conservados,
 * no expresiones aprobadas ni sprites activos en la campaña.
 * GitHub Pages publica public/, por lo que las fuentes de art-reference/
 * se muestran como vistas de solo lectura del repositorio público.
 */
export type G2GeneralMaster = {
  id:string;
  characterId:string;
  label:string;
  mission:string;
  path:string;
  url:string;
  mime:'image/png'|'image/jpeg';
  width:number;
  height:number;
  bytes:number;
  sha256:string;
  transparent:boolean;
  status:'master_only';
};
const RAW_REPO='https://raw.githubusercontent.com/Afelex/Decreto-Real/main/';
const originalMasters:readonly Omit<G2GeneralMaster,'url'>[]=[
  {id:'G2-PER-LEANDRO-MASTER',characterId:'leandro-valcazar',label:'Leandro Valcázar',
    mission:'M10',path:'art-reference/personajes-oficiales/imagenes/leandro-valcazar.jpg',mime:'image/jpeg',
    width:1152,height:1536,bytes:431399,sha256:'0bcfe3a9c18aa1062f77fb0f9040d788686482077939de82d7b6f9d3694de25f',transparent:false,status:'master_only'},
  {id:'G2-PER-OCTAVIO-MASTER',characterId:'octavio-argento',label:'Octavio Argento',
    mission:'M14',path:'art-reference/personajes-oficiales/imagenes/octavio-argento.png',mime:'image/png',
    width:1125,height:1398,bytes:2522755,sha256:'531bb124d8779caa67323336c9e03b3ee561a6118a150bfd3cf463f9e831bb1d',transparent:true,status:'master_only'},
  {id:'G2-PER-JERONIMO-MASTER',characterId:'jeronimo-arrellano',label:'Jerónimo Arrellano',
    mission:'M18',path:'art-reference/personajes-oficiales/imagenes/jeronimo-arrellano.png',mime:'image/png',
    width:1125,height:1398,bytes:2543659,sha256:'d9f6a440f102e5354e7dbcac4a0bf21bb6019c91898224ceb5e483da4d14c821',transparent:true,status:'master_only'},
  {id:'G2-PER-ISABELA-MASTER',characterId:'isabela-valdierra',label:'Isabela Valdierra',
    mission:'M26',path:'art-reference/personajes-oficiales/imagenes/isabela-valdierra.png',mime:'image/png',
    width:1125,height:1398,bytes:2734491,sha256:'9e6f72964d6db122d038dda3446ade3792c2d3fbcbd5910af74f8e2c60652d0a',transparent:true,status:'master_only'},
  {id:'G2-PER-AUKAN-MASTER',characterId:'aukan-del-condor',label:'Aukan del Cóndor',
    mission:'M30',path:'art-reference/personajes-oficiales/imagenes/aukan-del-condor.jpg',mime:'image/jpeg',
    width:1229,height:1536,bytes:462757,sha256:'b1d93fabf62a18f7451697cc170d8f210ed8995538968b40a971cf730a814c7e',transparent:false,status:'master_only'},
  {id:'G2-PER-GONZALO-MASTER',characterId:'gonzalo-de-montes',label:'Gonzalo de Montes',
    mission:'M34',path:'art-reference/personajes-oficiales/imagenes/gonzalo-de-montes.jpg',mime:'image/jpeg',
    width:1229,height:1536,bytes:436040,sha256:'ad52f79a641eb0cd699f984ac118c90f47ae47c5ed8b7e78804da80a0982fced',transparent:false,status:'master_only'},
];

/** Solo rutas canon registradas; nunca incorpora expresiones a la campaña. */
export function publishedG2GeneralMasters():G2GeneralMaster[]{
  return originalMasters.map(master=>({...master,url:RAW_REPO+master.path}));
}
