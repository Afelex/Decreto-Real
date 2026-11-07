import React from 'react';

type Props=Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>,'value'|'onChange'>&{
  /** Texto actual en el documento (o el original si no hay texto propio). */
  value:string;
  /** Texto original del guion: un campo vacío equivale a «sin cambios» en el documento. */
  original:string;
  onLive:(text:string)=>void;
  testid?:string;
};

/**
 * Campo de texto largo con borrador local: se puede vaciar y reescribir desde
 * cero (sin que reaparezca el original) y conserva los saltos de línea (Enter).
 * Si el documento cambia por otra vía (negrita, deshacer…), se sincroniza.
 */
export const StudioTextArea=React.forwardRef<HTMLTextAreaElement,Props>(function StudioTextArea(
  {value,original,onLive,testid,onFocus,onBlur,...rest},ref){
  const [text,setText]=React.useState(value);
  const emitted=React.useRef(value);
  React.useEffect(()=>{
    const blankDraft=emitted.current.trim()===''&&value===original;
    if(value!==emitted.current&&!blankDraft){setText(value);emitted.current=value;}
  },[value,original]);
  return <textarea {...rest} ref={ref} data-testid={testid} value={text}
    onFocus={onFocus}
    onBlur={e=>{if(text.trim()===''){setText(value);emitted.current=value;}onBlur?.(e);}}
    onChange={e=>{setText(e.target.value);emitted.current=e.target.value;onLive(e.target.value);}}/>;
});
