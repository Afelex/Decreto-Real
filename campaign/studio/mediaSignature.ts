/**
 * Identifica el tipo REAL de un archivo multimedia por su firma (primeros
 * bytes), sin confiar en la extensión ni en el tipo que declara el navegador.
 * Solo se admiten los formatos que Studio sabe mostrar.
 */
export type StudioMediaMime = 'image/png'|'image/jpeg'|'image/gif'|'image/webp'|'video/mp4'|'video/webm';
export const STUDIO_MEDIA_EXTENSIONS:Readonly<Record<StudioMediaMime,string>> = {
  'image/png':'png','image/jpeg':'jpg','image/gif':'gif','image/webp':'webp','video/mp4':'mp4','video/webm':'webm',
};
/** Bytes necesarios para reconocer cualquier firma admitida. */
export const STUDIO_SIGNATURE_BYTES = 16;

const ascii=(bytes:Uint8Array,offset:number,text:string)=>
  [...text].every((char,i)=>bytes[offset+i]===char.charCodeAt(0));

export function sniffStudioMedia(bytes:Uint8Array):StudioMediaMime|null {
  if(bytes.length>=8&&bytes[0]===0x89&&ascii(bytes,1,'PNG')&&bytes[4]===0x0d&&bytes[5]===0x0a&&bytes[6]===0x1a&&bytes[7]===0x0a)
    return 'image/png';
  if(bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return 'image/jpeg';
  if(bytes.length>=6&&(ascii(bytes,0,'GIF87a')||ascii(bytes,0,'GIF89a')))return 'image/gif';
  if(bytes.length>=12&&ascii(bytes,0,'RIFF')&&ascii(bytes,8,'WEBP'))return 'image/webp';
  if(bytes.length>=12&&ascii(bytes,4,'ftyp'))return 'video/mp4';
  if(bytes.length>=4&&bytes[0]===0x1a&&bytes[1]===0x45&&bytes[2]===0xdf&&bytes[3]===0xa3)return 'video/webm';
  return null;
}
