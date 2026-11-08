/**
 * Auditoría editorial pura del duelo guiado.
 * Los avisos son orientativos: no cambian el texto, el hablante ni las cartas.
 * Los umbrales responden al formato pequeño de teléfonos (aprox. 390 px).
 */
import type { GuidedStep } from '../guidedOpeningDuel.ts';

export type ReadingIssueCode='empty'|'very-long'|'long'|'dense'|'action-unclear';
export type ReadingIssue={
  code:ReadingIssueCode;
  level:'high'|'medium';
  message:string;
  suggestion:string;
};
export type ReadingReport={
  stepId:string;
  characters:number;
  words:number;
  estimatedLines:number;
  estimatedSeconds:number;
  issues:ReadingIssue[];
};
export type TutorialReadingSummary={
  reports:ReadingReport[];
  high:number;
  medium:number;
  affected:number;
};

/** Aproximación de líneas en el teléfono, respetando los saltos manuales.
 * No sustituye la medida real del cuadro en el navegador. */
export function estimatedMobileLines(text:string,charactersPerLine=34):number {
  const normalized=text.replace(/\r\n?/g,'\n');
  const paragraphs=normalized.split('\n');
  let lines=0;
  for(const paragraph of paragraphs){
    const words=paragraph.trim().split(/\s+/u).filter(Boolean);
    if(!words.length){lines+=1;continue;}
    let column=0;
    for(const word of words){
      const size=Array.from(word).length;
      if(!column){lines+=Math.max(1,Math.ceil(size/charactersPerLine));column=size%charactersPerLine||charactersPerLine;continue;}
      if(column+1+size<=charactersPerLine){column+=1+size;continue;}
      lines+=Math.max(1,Math.ceil(size/charactersPerLine));
      column=size%charactersPerLine||charactersPerLine;
    }
  }
  return lines;
}

const actionMentions:Readonly<Record<string,RegExp>>={
  coin:/moneda|lanza|lanzar|suerte/iu,
  attack1:/ataque|ataca|carta|arrastr|campo/iu,
  attack2:/ataque|ataca|carta|arrastr|campo/iu,
  attack3:/ataque|ataca|carta|arrastr|campo/iu,
  combo2:/combo|elige|selecciona|curaci[oó]n|daño/iu,
  combo3:/combo|elige|selecciona|curaci[oó]n|daño/iu,
  impact1:/impacto|activa|coloca|sella/iu,
  impact2:/impacto|activa|coloca|sella/iu,
  impact3:/impacto|activa|coloca|sella/iu,
  impact4:/impacto|activa|coloca|sella|final/iu,
  order:/orden|robar|roba|activa/iu,
  defense:/defensa|recupera|activa|cura/iu,
  end1:/turno|termina|deja|guardia/iu,
  end2:/turno|termina|deja|guardia/iu,
  end3:/turno|termina|deja|guardia/iu,
  end4:/turno|termina|deja|guardia/iu,
};

export function analyzeGuidedReading(step:GuidedStep,text=step.text):ReadingReport{
  const cleaned=text.replace(/\s+/gu,' ').trim();
  const characters=Array.from(cleaned).length;
  const words=cleaned?cleaned.split(' ').length:0;
  const estimatedLines=estimatedMobileLines(text);
  const estimatedSeconds=Math.max(2,Math.ceil(words/3));
  const issues:ReadingIssue[]=[];
  const action=!!step.action;
  if(!cleaned){
    issues.push({code:'empty',level:'high',message:'Intervención sin texto',
      suggestion:'Añade un diálogo breve antes de publicar; el paso seguirá existiendo.'});
  }else{
    if(characters>(action?165:200)||estimatedLines>(action?8:10)){
      issues.push({code:'very-long',level:'high',message:'Texto excesivo para una sola intervención',
        suggestion:'Resume o distribuye la explicación entre pausas narrativas. No elimines reglas importantes.'});
    }else if(characters>(action?110:145)||estimatedLines>(action?5:7)){
      issues.push({code:'long',level:'medium',message:'Texto largo en pantalla móvil',
        suggestion:'Acorta la frase y deja primero la instrucción principal. Comprueba su altura en el lienzo.'});
    }
    if(action && words>23){
      issues.push({code:'dense',level:'medium',message:'Demasiada explicación durante una acción',
        suggestion:'Deja una sola instrucción clara para que el jugador vea y utilice las cartas.'});
    }
    const rule=step.action&&actionMentions[step.action];
    if(rule&&!rule.test(cleaned)){
      issues.push({code:'action-unclear',level:'medium',message:'No menciona claramente la acción requerida',
        suggestion:'Indica qué debe tocar o arrastrar el jugador sin cambiar el disparador del combate.'});
    }
  }
  return {stepId:step.id,characters,words,estimatedLines,estimatedSeconds,issues};
}
export function analyzeGuidedSequence(
  steps:readonly GuidedStep[],textForStep:(step:GuidedStep)=>string=step=>step.text,
):TutorialReadingSummary{
  const reports=steps.map(step=>analyzeGuidedReading(step,textForStep(step)));
  return {
    reports,
    high:reports.reduce((sum,r)=>sum+r.issues.filter(i=>i.level==='high').length,0),
    medium:reports.reduce((sum,r)=>sum+r.issues.filter(i=>i.level==='medium').length,0),
    affected:reports.filter(r=>r.issues.length>0).length,
  };
}
