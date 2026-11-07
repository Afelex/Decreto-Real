import { layerOrDefault, withBackgroundFrame, withLayer } from '../../campaign/studio/ops';
import type { StudioDocumentV3 } from '../../campaign/studio/schema';
import { BACKGROUND_ID } from './stageGeometry';

/**
 * Desplaza varias capas (o el fondo) en una sola actualización: una entrada
 * de deshacer para alinear o mover con flechas una selección completa.
 */
export function moveLayersUpdate(sceneKey:string,moves:readonly {id:string;dx:number;dy:number}[]) {
  return (doc:StudioDocumentV3):StudioDocumentV3=>{
    let next=doc;
    for(const {id,dx,dy} of moves){
      if(!dx&&!dy)continue;
      if(id===BACKGROUND_ID){
        const bg=next.scenes[sceneKey]?.background;
        next=withBackgroundFrame(next,sceneKey,{x:(bg?.x??0)+dx,y:(bg?.y??0)+dy});
        continue;
      }
      const layer=layerOrDefault(next,sceneKey,id);
      if(layer)next=withLayer(next,sceneKey,{...layer,x:layer.x+dx,y:layer.y+dy});
    }
    return next;
  };
}

/** Ids sobre los que actúa una acción: la selección múltiple o el elemento principal. */
export const actionTargets=(selected:string|null,group:readonly string[]):string[]=>
  group.length?[...group]:selected?[selected]:[];
