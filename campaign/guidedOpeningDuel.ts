export type GuidedAction =
  | 'coin' | 'attack1' | 'attack2' | 'combo2' | 'end1' | 'rival1'
  | 'attack3' | 'combo3' | 'impact1' | 'end2' | 'rival2'
  | 'order' | 'impact2' | 'end3' | 'rival3'
  | 'defense' | 'impact3' | 'end4' | 'rival4' | 'impact4';

export type GuidedStep = {
  id: string;
  speaker: 'Xervias' | 'Domingo Quispe' | 'Sistema';
  text: string;
  action?: GuidedAction;
  label?: string;
};

/** The first campaign battle is a deliberately fixed sequence, not a random PvP duel. */
export const GUIDED_STEPS: readonly GuidedStep[] = [
  { id:'g00',speaker:'Domingo Quispe',text:'¿Te atreves a invocar el Decreto Real contra mí? ¡Apenas has salido de la academia!'},
  { id:'g01',speaker:'Xervias',text:'No lucho para demostrar que soy más fuerte. Lucho para impedir que se castigue a una familia sin pruebas.' },
  { id:'g02',speaker:'Xervias',text:'Nuestros anillos convierten energía mística en cartas. Los dos tenemos 20 puntos de vida. Si los pierdes todos, o si tu rival completa los cuatro Impactos, pierdes el duelo.' },
  { id:'g03',speaker:'Xervias',text:'Primero lanzamos la moneda. Eso decide quién comienza. ¡Hazlo tú!',action:'coin',label:'Lanzar moneda'},
  { id:'g04',speaker:'Xervias',text:'¡Cara! Comenzamos nosotros. Recibimos tres cartas y robamos una más al iniciar el turno. Arrastra un Ataque al campo, o tócalo.' },
  { id:'g05',speaker:'Xervias',text:'El Ataque quita 2 puntos de vida al adversario. Usa la primera carta.',action:'attack1'},
  { id:'g06',speaker:'Xervias',text:'¡Bien hecho! Si colocamos dos cartas seguidas del mismo tipo, activamos un combo.' },
  { id:'g07',speaker:'Xervias',text:'Juega un segundo Ataque para activar el COMBO ×2.',action:'attack2'},
  { id:'g08',speaker:'Xervias',text:'COMBO ×2: puedes elegir Ataque (+1 de daño) o Curación (+1 de vida). Esta vez elige Ataque.',action:'combo2',label:'Elegir Ataque · −1 PV rival'},
  { id:'g09',speaker:'Xervias',text:'Ya conocemos el ataque y el primer combo. Ahora dejamos que el guardia responda.',action:'end1',label:'Fin de turno'},
  { id:'g10',speaker:'Domingo Quispe',text:'¡Yo también sé combatir! Recibe mi Decreto de Ataque.',action:'rival1',label:'Ver ataque del rival'},
  { id:'g11',speaker:'Xervias',text:'Nos ha quitado 2 de vida. En el nuevo turno robamos otra carta. ¡Es nuestro tercer Ataque consecutivo!' },
  { id:'g12',speaker:'Xervias',text:'Arrastra el tercer Ataque. Esta vez formarás un COMBO ×3.',action:'attack3'},
  { id:'g13',speaker:'Xervias',text:'COMBO ×3: podemos infligir 3 puntos adicionales o recuperar 3 de vida. Elige Curación.',action:'combo3',label:'Elegir Curación · +3 PV'},
  { id:'g14',speaker:'Xervias',text:'Vamos por otra victoria posible: los Impactos. Deben colocarse en orden, del I al FINAL. Solo uno por turno. Activa Impacto I.',action:'impact1'},
  { id:'g15',speaker:'Xervias',text:'¡Primer Impacto! Drena 1 de vida rival y recupera 1 de la nuestra. Terminemos el turno.',action:'end2',label:'Fin de turno'},
  { id:'g16',speaker:'Domingo Quispe',text:'¡Esto no se acaba aquí!',action:'rival2',label:'Ver ataque del rival'},
  { id:'g17',speaker:'Xervias',text:'Cada turno robamos una carta. Ahora tenemos un Decreto de Orden, que permite robar una carta adicional.' },
  { id:'g18',speaker:'Xervias',text:'Usa Orden y aparecerá otra carta en tu mano.',action:'order'},
  { id:'g19',speaker:'Xervias',text:'¡Hemos robado Defensa! La reservaremos para el siguiente turno. Ahora coloca Impacto II.' },
  { id:'g20',speaker:'Xervias',text:'Los Impactos se juegan en secuencia. Activa el segundo.',action:'impact2'},
  { id:'g21',speaker:'Xervias',text:'Llevamos dos de cuatro sellos. Le toca responder al guardia.',action:'end3',label:'Fin de turno'},
  { id:'g22',speaker:'Domingo Quispe',text:'¡No podrás mantener esa ventaja!',action:'rival3',label:'Ver ataque del rival'},
  { id:'g23',speaker:'Xervias',text:'Ha vuelto a golpearnos. Defensa recupera 1 punto de vida, sin sobrepasar los 20 iniciales.' },
  { id:'g24',speaker:'Xervias',text:'Activa Defensa.',action:'defense'},
  { id:'g25',speaker:'Xervias',text:'Muy bien. Ahora vamos a sellar el Impacto III.',action:'impact3'},
  { id:'g26',speaker:'Xervias',text:'¡Ya tenemos tres Impactos! Nuestro rival todavía tiene vida, pero estamos a un paso de ganar.',action:'end4',label:'Fin de turno'},
  { id:'g27',speaker:'Domingo Quispe',text:'¡No! ¡No pienso perder ante un novato!',action:'rival4',label:'Ver ataque del rival'},
  { id:'g28',speaker:'Domingo Quispe',text:'¡Todavía tengo fuerzas! ¡No me has derrotado!' },
  { id:'g29',speaker:'Xervias',text:'No necesito agotar tu vida. Si sello el cuarto Impacto, el Decreto Final decidirá el combate.' },
  { id:'g30',speaker:'Xervias',text:'¡Adelante! ¡Activa el Impacto FINAL!',action:'impact4'},
  { id:'g31',speaker:'Sistema',text:'¡VICTORIA POR DECRETO FINAL! Has completado los cuatro Impactos.' },
];

/** Order only the standard 28-card deck. Every action still goes through GameBoard. */
export const GUIDED_PLAYER_TOP = [
  'p1-atk-0','p1-atk-1','p1-imp-1','p1-imp-2',
  'p1-atk-2','p1-ord-0','p1-def-0','p1-imp-3','p1-imp-4',
] as const;
export const GUIDED_RIVAL_TOP = [
  'ai-atk-0','ai-atk-1','ai-atk-2','ai-atk-3','ai-atk-4',
] as const;
export const GUIDED_ACTION_CARDS: Readonly<Record<string,string>> = {
  attack1:'p1-atk-0',attack2:'p1-atk-1',attack3:'p1-atk-2',
  impact1:'p1-imp-1',impact2:'p1-imp-2',impact3:'p1-imp-3',impact4:'p1-imp-4',
  order:'p1-ord-0',defense:'p1-def-0',
};
export function guidedActionForCard(id:string): GuidedAction | null {
  return (Object.entries(GUIDED_ACTION_CARDS).find(([,cardId])=>cardId===id)?.[0] as GuidedAction | undefined)??null;
}
export function arrangeGuidedDeck<T extends {id:string}>(cards: readonly T[],side:'player'|'rival'): T[] {
  const top=side==='player'?GUIDED_PLAYER_TOP:GUIDED_RIVAL_TOP;
  const ids=new Set(top);
  if(cards.length!==28 || new Set(cards.map(c=>c.id)).size!==28) throw new Error('El tutorial necesita la baraja estándar de 28 cartas.');
  const arranged=top.map(id=>cards.find(c=>c.id===id));
  if(arranged.some(card=>!card))throw new Error('Falta una carta para el tutorial guiado.');
  return [...arranged as T[],...cards.filter(c=>!ids.has(c.id))];
}
