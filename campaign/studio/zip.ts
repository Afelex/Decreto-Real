/**
 * ZIP mínimo sin dependencias para los respaldos de Studio: entradas
 * almacenadas sin compresión («store», método 0) con CRC-32. Las imágenes y
 * videos ya vienen comprimidos, así que comprimir de nuevo apenas ahorraría
 * espacio. El lector solo acepta este formato (el que exporta Studio).
 */
export type ZipEntry = {name:string;data:Uint8Array};

export const ZIP_MAX_ENTRIES = 400;

const CRC_TABLE=(()=>{
  const table=new Uint32Array(256);
  for(let n=0;n<256;n++){
    let c=n;
    for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;
    table[n]=c>>>0;
  }
  return table;
})();
export function crc32(data:Uint8Array):number {
  let crc=0xffffffff;
  for(let i=0;i<data.length;i++)crc=CRC_TABLE[(crc^data[i])&0xff]^(crc>>>8);
  return (crc^0xffffffff)>>>0;
}

const encoder=new TextEncoder();
const decoder=new TextDecoder('utf-8',{fatal:true});

/** Nombre de entrada seguro: relativo, sin `..`, sin barras invertidas ni rutas absolutas. */
export function isSafeZipName(name:string):boolean {
  return name.length>0&&name.length<=200&&!name.startsWith('/')&&!name.includes('\\')&&
    !name.split('/').some(part=>part===''||part==='.'||part==='..')&&!/[\u0000-\u001f]/.test(name);
}

export function createZip(entries:readonly ZipEntry[]):Uint8Array {
  if(entries.length>ZIP_MAX_ENTRIES)throw new Error('Demasiados archivos para un respaldo.');
  const names=new Set<string>();
  const locals:Uint8Array[]=[];
  const centrals:Uint8Array[]=[];
  let offset=0;
  // Fecha DOS fija (1 ene 2026): el respaldo es reproducible byte a byte.
  const dosTime=0,dosDate=((2026-1980)<<9)|(1<<5)|1;
  for(const entry of entries){
    if(!isSafeZipName(entry.name)||names.has(entry.name))throw new Error('Nombre de archivo no válido en el respaldo: '+entry.name);
    names.add(entry.name);
    const name=encoder.encode(entry.name);
    const crc=crc32(entry.data);
    const size=entry.data.length;
    if(size>0xfffffffe||offset>0xfffffffe)throw new Error('El respaldo supera el tamaño máximo de ZIP.');
    const local=new Uint8Array(30+name.length);
    const lv=new DataView(local.buffer);
    lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint16(6,0x0800,true);lv.setUint16(8,0,true);
    lv.setUint16(10,dosTime,true);lv.setUint16(12,dosDate,true);lv.setUint32(14,crc,true);
    lv.setUint32(18,size,true);lv.setUint32(22,size,true);lv.setUint16(26,name.length,true);lv.setUint16(28,0,true);
    local.set(name,30);
    const central=new Uint8Array(46+name.length);
    const cv=new DataView(central.buffer);
    cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x0800,true);
    cv.setUint16(10,0,true);cv.setUint16(12,dosTime,true);cv.setUint16(14,dosDate,true);cv.setUint32(16,crc,true);
    cv.setUint32(20,size,true);cv.setUint32(24,size,true);cv.setUint16(28,name.length,true);
    cv.setUint32(42,offset,true);
    central.set(name,46);
    locals.push(local,entry.data);
    centrals.push(central);
    offset+=local.length+size;
  }
  const centralSize=centrals.reduce((n,c)=>n+c.length,0);
  const end=new Uint8Array(22);
  const ev=new DataView(end.buffer);
  ev.setUint32(0,0x06054b50,true);ev.setUint16(8,entries.length,true);ev.setUint16(10,entries.length,true);
  ev.setUint32(12,centralSize,true);ev.setUint32(16,offset,true);
  const out=new Uint8Array(offset+centralSize+end.length);
  let at=0;
  for(const part of [...locals,...centrals,end]){out.set(part,at);at+=part.length;}
  return out;
}

export function readZip(bytes:Uint8Array):ZipEntry[] {
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  let endAt=-1;
  for(let i=bytes.length-22;i>=Math.max(0,bytes.length-22-0xffff);i--){
    if(view.getUint32(i,true)===0x06054b50){endAt=i;break;}
  }
  if(endAt<0)throw new Error('El archivo no es un ZIP válido.');
  const count=view.getUint16(endAt+10,true);
  const centralOffset=view.getUint32(endAt+16,true);
  if(count>ZIP_MAX_ENTRIES)throw new Error('El respaldo contiene demasiados archivos.');
  const entries:ZipEntry[]=[];
  let p=centralOffset;
  for(let n=0;n<count;n++){
    if(p+46>bytes.length||view.getUint32(p,true)!==0x02014b50)throw new Error('ZIP dañado (directorio central).');
    const method=view.getUint16(p+10,true);
    const crc=view.getUint32(p+16,true);
    const size=view.getUint32(p+20,true);
    const uncompressed=view.getUint32(p+24,true);
    const nameLength=view.getUint16(p+28,true);
    const extraLength=view.getUint16(p+30,true);
    const commentLength=view.getUint16(p+32,true);
    const localOffset=view.getUint32(p+42,true);
    let name:string;
    try{name=decoder.decode(bytes.subarray(p+46,p+46+nameLength));}
    catch{throw new Error('Nombre de archivo no válido en el ZIP.');}
    if(!isSafeZipName(name))throw new Error('Ruta no permitida en el ZIP: '+name);
    if(method!==0||size!==uncompressed)
      throw new Error('Este ZIP está comprimido. Usa un respaldo exportado por Decreto Real Studio.');
    if(localOffset+30>bytes.length||view.getUint32(localOffset,true)!==0x04034b50)throw new Error('ZIP dañado (cabecera local).');
    const start=localOffset+30+view.getUint16(localOffset+26,true)+view.getUint16(localOffset+28,true);
    if(start+size>bytes.length)throw new Error('ZIP incompleto.');
    const data=bytes.subarray(start,start+size);
    if(crc32(data)!==crc)throw new Error('ZIP dañado: '+name+' no supera la comprobación CRC.');
    entries.push({name,data});
    p+=46+nameLength+extraLength+commentLength;
  }
  return entries;
}

export const isZip=(bytes:Uint8Array)=>bytes.length>=4&&bytes[0]===0x50&&bytes[1]===0x4b&&bytes[2]===0x03&&bytes[3]===0x04;
