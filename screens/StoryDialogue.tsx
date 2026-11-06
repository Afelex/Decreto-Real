import React from 'react';

/** Narrative text remains in the DOM; decorative dialogue assets are CSS/SVG. */
export type DialogueTone = 'character' | 'narrator' | 'thought';
export type NameplateTone = 'player' | 'authority' | 'neutral' | 'system';

export function dialoguePages(input: string, limit=150): string[] {
  const text=input.trim();
  if(!text)return [''];
  const sentences=text.split(/(?<=[.!?])\s+/u);
  const result:string[]=[];
  let page='';
  const push=()=>{if(page.trim())result.push(page.trim());page='';};
  for(const sentence of sentences){
    if(sentence.length>limit){
      push();
      const words=sentence.split(/\s+/u);
      for(const word of words){
        if(page && page.length+word.length+1>limit)push();
        page+=(page?' ':'')+word;
      }
      push();
    } else if(page && page.length+sentence.length+1>limit){
      push();page=sentence;
    } else {
      page+=(page?' ':'')+sentence;
    }
  }
  push();
  return result;
}
export function nameplateFor(speaker:string):NameplateTone{
  if(speaker==='Xervias')return 'player';
  if(speaker==='Zhinchi')return 'authority';
  if(speaker==='Crónica'||speaker==='Sistema')return 'system';
  return 'neutral';
}

type Props={
  sceneTitle:string;
  speaker:string;
  text:string;
  beatKey:string;
  progress:string;
  tone:DialogueTone;
  onAdvance:()=>void;
  lastBeforeDuel?:boolean;
};

/**
 * A Duel Links-inspired (not copied) two-part panel: nameplate + ivory body.
 * Long speeches paginate without losing a word or increasing the story beat count.
 * Single accessible arrow controls page advance or the next story beat.
 */
export default function StoryDialogue({
  sceneTitle,speaker,text,beatKey,progress,tone,onAdvance,lastBeforeDuel=false
}:Props){
  const pages=React.useMemo(()=>dialoguePages(text),[text]);
  const [page,setPage]=React.useState(0);
  React.useEffect(()=>setPage(0),[beatKey]);
  const safePage=Math.min(page,pages.length-1);
  const finalPage=safePage===pages.length-1;
  const next=()=>{
    if(!finalPage)setPage(v=>v+1);
    else onAdvance();
  };
  const finalLabel=lastBeforeDuel?'Comenzar duelo':'Continuar';
  const speakerLabel=tone==='thought'?'Xervias · Pensamiento':speaker;
  const plate=nameplateFor(speaker);
  return <section className={'dcop-narrative dcop-dialog-'+tone} aria-label="Diálogo del prólogo" data-testid="prologue-dialogue">
    <div className="dcop-chapter-title">
      <small>DECRETO REAL · PRÓLOGO</small>
      <h1>{sceneTitle}</h1>
    </div>
    <div className="dcop-dialog-box">
      <div className={'dcop-nameplate dcop-nameplate-'+plate} aria-label={'Habla '+speaker}>
        {speakerLabel}
      </div>
      <div className="dcop-dialog-body" aria-live="polite" aria-atomic="true">
        <p key={beatKey+'-'+safePage}>{pages[safePage]}</p>
        <footer>
          <span aria-label="Progreso del diálogo">{progress}{pages.length>1?' · '+(safePage+1)+'/'+pages.length:''}</span>
          <button type="button" onClick={next} aria-label={finalPage?finalLabel:'Continuar diálogo'}
            title={finalPage?finalLabel:'Continuar diálogo'}>
            <span>{finalPage&&lastBeforeDuel?'Comenzar duelo':'Continuar'}</span>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 4l10 8-10 8V4z"/>
            </svg>
          </button>
        </footer>
      </div>
    </div>
  </section>;
}
