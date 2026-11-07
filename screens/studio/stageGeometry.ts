import type { StageBox } from '../../campaign/studio/grid';

/** Id del pseudo-elemento «fondo» en la selección de Studio. */
export const BACKGROUND_ID = 'background';

/** Elemento DOM que representa una capa (para medir su caja visible). */
export function elementForLayer(stage:HTMLElement,id:string):HTMLElement|null {
  if(id===BACKGROUND_ID)return stage.querySelector<HTMLElement>('.dcop-backdrop');
  const host=stage.querySelector<HTMLElement>('[data-studio-actor="'+CSS.escape(id)+'"]');
  if(!host)return null;
  // En un actor se mide su sprite (no el hueco de la columna teatral ni el niño).
  return host.querySelector<HTMLElement>(':scope > img:not(.dcop-child-sprite)')??host;
}

/** Caja de un elemento en % del escenario. */
export function stageBoxOf(stage:HTMLElement,element:Element):StageBox {
  const s=stage.getBoundingClientRect();
  const r=element.getBoundingClientRect();
  return {
    left:100*(r.left-s.left)/s.width,right:100*(r.right-s.left)/s.width,
    top:100*(r.top-s.top)/s.height,bottom:100*(r.bottom-s.top)/s.height,
  };
}

/** Cajas de varias capas presentes en el escenario. */
export function layerBoxes(stage:HTMLElement,ids:readonly string[]):Record<string,StageBox> {
  const out:Record<string,StageBox>={};
  for(const id of ids){
    const el=elementForLayer(stage,id);
    if(el)out[id]=stageBoxOf(stage,el);
  }
  return out;
}

/** Ids de todas las capas editables visibles en el escenario. */
export function presentLayerIds(stage:HTMLElement):string[] {
  return [...stage.querySelectorAll<HTMLElement>('[data-studio-actor]')]
    .map(el=>el.dataset.studioActor!).filter(Boolean);
}
