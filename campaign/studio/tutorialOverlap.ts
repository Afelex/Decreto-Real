/** Geometría del director narrativo: análisis visual puro, sin alterar combate. */
export type SafetyRect={left:number;top:number;right:number;bottom:number};
export type SafetyZone={id:string;name:string;rect:SafetyRect;weight?:number;threshold?:number};
export type NarrativeBox={id:string;name:string;rect:SafetyRect};
export type SafetyFinding={subjectId:string;subjectName:string;zoneId:string;zoneName:string;fraction:number};
export type SuggestedMove={dx:number;dy:number;before:number;after:number};

export const rectArea=(r:SafetyRect):number=>
  Math.max(0,r.right-r.left)*Math.max(0,r.bottom-r.top);
export const intersectionArea=(a:SafetyRect,b:SafetyRect):number=>
  Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*
  Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
/** Fracción de la zona funcional tapada, no del diálogo enorme. */
export const occludedFraction=(overlay:SafetyRect,zone:SafetyRect):number=>{
  const area=rectArea(zone);
  return area>0?intersectionArea(overlay,zone)/area:0;
};
export const moveRect=(r:SafetyRect,dx:number,dy:number):SafetyRect=>({
  left:r.left+dx,right:r.right+dx,top:r.top+dy,bottom:r.bottom+dy,
});
export function analyzeNarrativeLayout(subjects:readonly NarrativeBox[],
  zones:readonly SafetyZone[]):SafetyFinding[]{
  const findings:SafetyFinding[]=[];
  for(const subject of subjects)for(const zone of zones){
    const fraction=occludedFraction(subject.rect,zone.rect);
    if(fraction>(zone.threshold??.16)){
      findings.push({subjectId:subject.id,subjectName:subject.name,
        zoneId:zone.id,zoneName:zone.name,fraction});
    }
  }
  return findings.sort((a,b)=>b.fraction-a.fraction||
    a.subjectId.localeCompare(b.subjectId));
}
const overflow=(r:SafetyRect,stage:SafetyRect):number=>{
  if(rectArea(r)<=0)return 0;
  const outside=rectArea(r)-intersectionArea(r,stage);
  return Math.max(0,outside/rectArea(r));
};
export const layoutCost=(subject:SafetyRect,zones:readonly SafetyZone[],stage:SafetyRect):number=>
  zones.reduce((total,z)=>total+Math.pow(occludedFraction(subject,z.rect),2)*
    (z.weight??1)*10,total=0)+overflow(subject,stage)*24;
/** Explora desplazamientos breves, en píxeles reales. Solo propone una
 * mejora significativa; nunca mueve nada por sí sola. */
export function suggestClearance(subject:SafetyRect,zones:readonly SafetyZone[],
  stage:SafetyRect):SuggestedMove|null{
  if(rectArea(subject)<=0||rectArea(stage)<=0)return null;
  const before=layoutCost(subject,zones,stage);
  if(before<.06)return null;
  const width=stage.right-stage.left,height=stage.bottom-stage.top;
  const candidates=[0,-.045,.045,-.09,.09,-.14,.14,-.20,.20,-.27,.27];
  let best={dx:0,dy:0,score:before};
  for(const fx of [0,-.06,.06,-.12,.12,-.20,.20])
    for(const fy of candidates){
      const dx=fx*width,dy=fy*height;
      const moved=moveRect(subject,dx,dy);
      const score=layoutCost(moved,zones,stage)+
        .022*(Math.abs(dx)/width+Math.abs(dy)/height);
      if(score<best.score-.00001)best={dx,dy,score};
    }
  if(best.score>=before-.06)return null;
  return {dx:best.dx,dy:best.dy,before,after:best.score};
}
