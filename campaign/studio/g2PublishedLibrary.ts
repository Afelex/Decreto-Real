/** Fondos G2 publicados: biblioteca virtual de DRStudio.
 * Los WebP se sirven directamente desde GitHub Pages, sin ZIP ni IndexedDB.
 * Cada ID de Studio es estable y válido para el esquema v3.
 */
import { G2_ASSET_PATHS, g2AssetIsPublished, g2AssetUrl, type G2AssetId } from '../g2Artwork.ts';

export type PublishedG2Option={id:G2AssetId;mediaId:string;label:string;url:string};
const entries=Object.keys(G2_ASSET_PATHS) as G2AssetId[];
export function g2StudioMediaId(id:G2AssetId):string {
  const position=entries.indexOf(id);
  if(position<0)throw new Error('Recurso G2 no registrado: '+id);
  return 'media-'+(position+1).toString(16).padStart(32,'0');
}
export function publishedG2Options(base?:string):PublishedG2Option[]{
  return entries.filter(g2AssetIsPublished).map(id=>({
    id,mediaId:g2StudioMediaId(id),label:id+' · '+G2_ASSET_PATHS[id].split('/').at(-1)!.replace(/\.webp$/,'').replaceAll('-',' '),
    url:g2AssetUrl(id,base)!,
  }));
}
export function publishedG2MediaUrls(base?:string):Record<string,string>{
  return Object.fromEntries(publishedG2Options(base).map(option=>[option.mediaId,option.url]));
}
