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

export const GUIDED_CARD_POOL = [
  {id:'attack1',name:'Ataque',kind:'ATTACK',effect:'−2 PV',image:'./cartas/decreto-ataque.webp'},
  {id:'attack2',name:'Ataque',kind:'ATTACK',effect:'−2 PV',image:'./cartas/decreto-ataque.webp'},
  {id:'attack3',name:'Ataque',kind:'ATTACK',effect:'−2 PV',image:'./cartas/decreto-ataque.webp'},
  {id:'impact1',name:'Impacto I',kind:'IMPACT',effect:'Drena 1',image:'./cartas/decreto-impacto.webp'},
  {id:'impact2',name:'Impacto II',kind:'IMPACT',effect:'Drena 1',image:'./cartas/decreto-impacto.webp'},
  {id:'impact3',name:'Impacto III',kind:'IMPACT',effect:'Drena 1',image:'./cartas/decreto-impacto.webp'},
  {id:'impact4',name:'Impacto FINAL',kind:'IMPACT',effect:'Victoria',image:'./cartas/decreto-impacto.webp'},
  {id:'order',name:'Orden',kind:'ORDER',effect:'Roba 1',image:'./cartas/decreto-orden.webp'},
  {id:'defense',name:'Defensa',kind:'DEFENSE',effect:'+1 PV',image:'./cartas/decreto-defensa.webp'},
] as const;

export type GuidedDuelState = {
  playerHp: number; rivalHp: number; impacts: number; turn: number;
  coin: boolean; won: boolean; hand: string[]; completed: GuidedAction[];
};

/** Pure projection: reload/repeat always reproduces the same tutorial. */
export function guidedDuelAt(stepIndex: number): GuidedDuelState {
  const state: GuidedDuelState = {
    playerHp:20, rivalHp:20, impacts:0, turn:1, coin:false, won:false,
    hand:['attack1','attack2','impact1','impact2'], completed:[],
  };
  const limit = Math.max(0, Math.min(GUIDED_STEPS.length, Math.floor(stepIndex)));
  for (const step of GUIDED_STEPS.slice(0,limit)) {
    const a = step.action;
    if (!a) continue;
    state.completed.push(a);
    if (a === 'coin') state.coin=true;
    if (a.startsWith('attack')) {state.rivalHp=Math.max(0,state.rivalHp-2); state.hand=state.hand.filter(c=>c!==a);}
    if (a === 'combo2') state.rivalHp=Math.max(0,state.rivalHp-1);
    if (a === 'combo3') state.playerHp=Math.min(20,state.playerHp+3);
    if (a.startsWith('impact')) {
      state.hand=state.hand.filter(c=>c!==a);
      state.impacts+=1;
      if (a === 'impact4') {state.won=true;state.rivalHp=0;}
      else {state.rivalHp=Math.max(0,state.rivalHp-1);state.playerHp=Math.min(20,state.playerHp+1);}
    }
    if (a === 'order') {state.hand=state.hand.filter(c=>c!==a);state.hand.push('defense');}
    if (a === 'defense') {state.hand=state.hand.filter(c=>c!==a);state.playerHp=Math.min(20,state.playerHp+1);}
    if (a.startsWith('rival')) {
      state.playerHp=Math.max(0,state.playerHp-2);
      state.turn+=1;
      const draws: Record<string,string> = {rival1:'attack3',rival2:'order',rival3:'impact3',rival4:'impact4'};
      state.hand.push(draws[a]);
    }
  }
  return state;
}
