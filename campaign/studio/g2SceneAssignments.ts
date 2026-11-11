/** Claves estables de pantallas G2. No cambia datos de campaña ni reglas. */
import { STORY_STAGES } from '../story.ts';
import { G2_REGION_BASE, G2_REGION_BOSS, type G2AssetId } from '../g2Artwork.ts';

export type G2SceneAssignment={key:string;assetId:G2AssetId};
export function g2SceneAssignments():G2SceneAssignment[]{
  const out:G2SceneAssignment[]=[];
  const regional=(region:string,kind:string):G2AssetId=>{
    const base:G2AssetId=(G2_REGION_BASE as Record<string,G2AssetId>)[region]??'G2-FON-019';
    const boss:G2AssetId=(G2_REGION_BOSS as Record<string,G2AssetId>)[region]??'G2-FON-020';
    return kind==='boss'||kind==='final'?boss:base;
  };
  for(const stage of STORY_STAGES){
    let briefing:G2AssetId,duel:G2AssetId;
    if(stage.id==='01'){briefing='G2-FON-002';duel='G2-FON-002';}
    else if(stage.id==='02'){briefing='G2-FON-001';duel='G2-FON-001';}
    else if(stage.id==='35'){briefing='G2-M35-A';duel='G2-M35-C';}
    else if(stage.id==='36'){briefing='G2-M36-A';duel='G2-M36-B';}
    else if(stage.id==='37'){briefing='G2-FON-019';duel='G2-FON-019';}
    else if(stage.id==='38'){briefing='G2-FON-020';duel='G2-FON-020';}
    else {briefing=regional(stage.chapterId,stage.kind);duel=briefing;}
    out.push({key:'mision-'+stage.id+'/briefing',assetId:briefing},{key:'mision-'+stage.id+'/duelo',assetId:duel});
  }
  for(const region of ['1','2','3','4','5','6','7','8']){
    const assetId=regional(region,'skirmish');
    out.push({key:'region-'+region+'/entrada',assetId},{key:'region-'+region+'/liberada',assetId});
  }
  // 12 intervenciones del guion maestro: el colapso cambia en el mismo encuadre.
  for(let i=0;i<12;i++){
    const assetId:G2AssetId=i>=10?'G2-M35-C':i>=5?'G2-M35-B':'G2-M35-A';
    out.push({key:'mision-35/preludio-'+String(i+1).padStart(2,'0'),assetId});
  }
  // El acceso a las prisiones es la primera escena del preludio de M36.
  for(let i=0;i<6;i++){
    out.push({key:'mision-36/preludio-'+String(i+1).padStart(2,'0'),
      assetId:i===0?'G2-M36-A':'G2-M36-B'});
  }
  return out;
}
