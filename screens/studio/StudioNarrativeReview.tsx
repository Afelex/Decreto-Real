import React from 'react';
import {GUIDED_STEPS} from '../../campaign/guidedOpeningDuel';
import {analyzeGuidedSequence} from '../../campaign/studio/tutorialReading';
import {useStudio} from './StudioContext';

type Props={selectedIndex:number;onSelect:(index:number)=>void};

/** El análisis es editorial y de longitud aproximada: no cambia mecánicas. */
export function StudioNarrativeReview({selectedIndex,onSelect}:Props){
  const studio=useStudio();
  const [filter,setFilter]=React.useState<'all'|'issues'>('issues');
  const summary=React.useMemo(()=>analyzeGuidedSequence(GUIDED_STEPS,step=>
    studio.doc.scenes['tutorial/'+step.id]?.dialogue?.text??step.text),[studio.doc]);
  const current=summary.reports[selectedIndex];
  const problematic=summary.reports.map((report,index)=>report.issues.length?index:-1).filter(index=>index>=0);
  const displayed=summary.reports.map((report,index)=>({report,index}))
    .filter(({report})=>filter==='all'||report.issues.length>0);
  const nextProblem=problematic.find(index=>index>selectedIndex)??problematic[0];
  return <details className="dr-studio-narrative-review" data-testid="studio-narrative-review">
    <summary>
      <strong>Recorrido narrativo · 32 pasos</strong>
      <span data-testid="studio-reading-count">{summary.affected?
        summary.affected+' pasos por revisar':'Sin avisos de texto'}</span>
    </summary>
    <div className="dr-studio-narrative-review-content">
      <p>Revisa los 32 diálogos sin jugar. Los avisos estiman la lectura en móvil: no sustituyen comprobar la pantalla ni alteran tus textos.</p>
      <div className="dr-studio-reading-navigation">
        <button type="button" data-testid="studio-reading-previous" disabled={selectedIndex<=0}
          onClick={()=>onSelect(selectedIndex-1)}>‹ Anterior</button>
        <button type="button" data-testid="studio-reading-next" disabled={selectedIndex>=GUIDED_STEPS.length-1}
          onClick={()=>onSelect(selectedIndex+1)}>Siguiente ›</button>
        <button type="button" data-testid="studio-reading-next-issue" disabled={!problematic.length}
          onClick={()=>onSelect(nextProblem)}>Siguiente aviso · {summary.affected}</button>
      </div>
      <div className="dr-studio-reading-current" data-testid="studio-reading-current">
        <strong>Paso {selectedIndex+1}/32 · {current.characters} caracteres · {current.estimatedLines} líneas estimadas · {current.estimatedSeconds} s</strong>
        {!current.issues.length
          ?<small>Sin avisos automáticos de lectura en este paso.</small>
          :current.issues.map(issue=><div key={issue.code} className={'dr-studio-reading-issue '+issue.level}
            data-testid="studio-reading-issue">
            <b>{issue.level==='high'?'Atención':'Revisar'}: {issue.message}</b>
            <span>{issue.suggestion}</span>
          </div>)}
      </div>
      <label className="dr-studio-label">Intervenciones a mostrar
        <select value={filter} onChange={e=>setFilter(e.target.value as 'all'|'issues')}
          data-testid="studio-reading-filter">
          <option value="issues">Solo las que tienen avisos</option>
          <option value="all">Las 32 intervenciones</option>
        </select>
      </label>
      <div className="dr-studio-reading-steps" data-testid="studio-reading-steps">
        {displayed.length===0&&<small>No hay avisos según las reglas automáticas. Puedes revisar todos los pasos.</small>}
        {displayed.map(({report,index})=><button key={report.stepId} type="button"
          className={index===selectedIndex?'is-current':''}
          data-testid="studio-reading-step"
          aria-current={index===selectedIndex?'step':undefined}
          onClick={()=>onSelect(index)}>
          <b>{String(index+1).padStart(2,'0')}</b>
          <span>{GUIDED_STEPS[index].speaker} · {(studio.doc.scenes['tutorial/'+report.stepId]?.dialogue?.text??GUIDED_STEPS[index].text).slice(0,61)}</span>
          <em>{report.issues.length?'Revisar':'Bien'}</em>
        </button>)}
      </div>
      <small>La longitud y las líneas son aproximadas. El editor de texto está arriba; al corregirlo, este informe se actualiza inmediatamente.</small>
    </div>
  </details>;
}
