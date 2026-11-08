/** Copia música entre escenas sin tocar sus diálogos, expresiones ni reglas.
 * Se puede reutilizar en el tutorial y, más adelante, en cualquier capítulo.
 */
import type {StudioDocumentV3} from './schema.ts';
import {withNarrativeCard} from './ops.ts';
import {GUIDED_STEPS} from '../guidedOpeningDuel.ts';

export function withMusicInScenes(
  source:StudioDocumentV3,keys:readonly string[],musicAssetId:string,
  onlyUnassigned=true,
):StudioDocumentV3{
  if(source.assets?.[musicAssetId]?.mime!=='audio/mpeg'&&
    source.assets?.[musicAssetId]?.mime!=='audio/wav')
    throw new Error('La canción debe existir en la biblioteca de audio.');
  let next=source;
  for(const key of new Set(keys)){
    if(onlyUnassigned&&next.scenes[key]?.narrative?.musicAssetId)continue;
    next=withNarrativeCard(next,key,{musicAssetId});
  }
  return next;
}

/** Solo los pasos posteriores al actual, en orden cronológico.
 * Nunca sobrescribe canciones escogidas expresamente en otras fichas. */
export function withMusicOnFollowingGuideSteps(
  source:StudioDocumentV3,currentStepId:string,musicAssetId:string,
  count=4,
):StudioDocumentV3{
  const index=GUIDED_STEPS.findIndex(step=>step.id===currentStepId);
  if(index<0)throw new Error('Intervención del tutorial desconocida.');
  const n=Math.max(0,Math.min(GUIDED_STEPS.length,Math.trunc(count)));
  const keys=GUIDED_STEPS.slice(index+1,index+1+n).map(step=>'tutorial/'+step.id);
  return withMusicInScenes(source,keys,musicAssetId,true);
}
