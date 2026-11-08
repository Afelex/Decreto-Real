/**
 * Auditoría de legibilidad del tutorial, independiente del motor de combate.
 * Trabaja con rectángulos reales del DOM (después de aplicar escalas Studio).
 */
export type AuditRect={x:number;y:number;width:number;height:number};
export type AuditObstacle={id:string;label:string;rect:AuditRect};
export type LayoutCollision={id:string;label:string;area:number;ratio:number};
const area=(r:AuditRect)=>Math.max(0,r.width)*Math.max(0,r.height);
export function intersectionArea(a:AuditRect,b:AuditRect):number {
  return Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*
    Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
}
export function layoutCollisions(dialogue:AuditRect,obstacles:readonly AuditObstacle[]):LayoutCollision[] {
  return obstacles.flatMap(o=>{
    const overlap=intersectionArea(dialogue,o.rect);
    const ratio=overlap/Math.max(1,Math.min(area(dialogue),area(o.rect)));
    return overlap>=120&&ratio>=.14?[{id:o.id,label:o.label,area:overlap,ratio}]:[];
  }).sort((a,b)=>b.area-a.area);
}
export type DialogueShift={dy:number;remaining:number;improved:boolean};
/** Encuentra un desplazamiento vertical legible, sin salirse del tablero.
 * Nunca cambia posiciones por sí solo: el autor confirma desde DRStudio. */
export function suggestDialogueShift(dialogue:AuditRect,obstacles:readonly AuditObstacle[],
  stage:AuditRect):DialogueShift {
  const collisions=layoutCollisions(dialogue,obstacles).length;
  if(!collisions)return {dy:0,remaining:0,improved:false};
  const maxShift=Math.min(stage.height*.48,370);
  const candidates=new Set<number>([0]);
  for(let delta=8;delta<=maxShift;delta+=8){candidates.add(delta);candidates.add(-delta);}
  for(const o of obstacles){
    candidates.add(o.rect.y-dialogue.height-10-dialogue.y);
    candidates.add(o.rect.y+o.rect.height+10-dialogue.y);
  }
  let best={dy:0,remaining:collisions,score:Number.POSITIVE_INFINITY};
  for(const dy of candidates){
    if(Math.abs(dy)>maxShift)continue;
    const moved={...dialogue,y:dialogue.y+dy};
    if(moved.y<stage.y+6||moved.y+moved.height>stage.y+stage.height-6)continue;
    const contacts=layoutCollisions(moved,obstacles);
    const score=contacts.reduce((sum,c)=>sum+c.area,0)+Math.abs(dy)*.65;
    if(score<best.score-1e-6)best={dy,remaining:contacts.length,score};
  }
  const initialArea=layoutCollisions(dialogue,obstacles).reduce((sum,c)=>sum+c.area,0);
  // No mover por un cambio insignificante o fuera del área de seguridad.
  return best.dy!==0&&best.score<initialArea*.92
    ?{dy:Math.round(best.dy*100)/100,remaining:best.remaining,improved:true}
    :{dy:0,remaining:collisions,improved:false};
}
