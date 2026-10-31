import React from 'react';

/** Small, editable original vector busts for the eight campaign generals.
 * Concept art only. Every general uses the same space on mobile. */
export const GENERAL_PORTRAIT_IDS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;
type GeneralId = typeof GENERAL_PORTRAIT_IDS[number];
const COATS: Record<GeneralId, [string, string]> = {
  '1': ['#31576c', '#ddc69a'],
  '2': ['#9c3c34', '#f6c784'],
  '3': ['#646375', '#cfcbce'],
  '4': ['#76553b', '#f3c876'],
  '5': ['#326a52', '#b5bf83'],
  '6': ['#85465b', '#f4d5b0'],
  '7': ['#375876', '#e8ebdf'],
  '8': ['#726b53', '#f5d9a1'],
};
const isGeneral = (id: string): id is GeneralId => GENERAL_PORTRAIT_IDS.some(valid => valid === id);

export const GeneralPortrait: React.FC<{ chapterId: string; className?: string }> = ({ chapterId, className }) => {
  if (!isGeneral(chapterId)) return null;
  const [coat, trim] = COATS[chapterId];
  return <svg className={className} data-general-portrait={chapterId} viewBox="0 0 120 120" aria-hidden="true"
    focusable="false" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="61" r="57" fill="#263442" stroke={trim} strokeWidth="3"/>
    <circle cx="60" cy="61" r="50" fill="none" stroke="#f5e2b044" strokeWidth="2"/>
    <path d="M6 120Q11 87 37 79L60 86 83 79Q109 86 114 120Z" fill={coat} stroke={trim} strokeWidth="3"/>
    <path d="M43 82 59 103 77 82 87 120H32Z" fill="#ebe0be" stroke="#6e543e" strokeWidth="2"/>
    <path d="M50 72V87Q59 95 69 87V72" fill="#b98765" stroke="#7d543c" strokeWidth="2"/>
    <path d="M40 42Q42 22 60 23 78 23 80 42V60Q77 79 60 81 42 78 40 60Z" fill="#d09b70" stroke="#7b523a" strokeWidth="2.3"/>
    <path d="M43 43Q42 28 51 25 61 19 76 31L78 45Q68 41 62 33 55 42 43 43Z" fill="#322c2b"/>
    <path d="M49 55h5m15 0h5" stroke="#40332c" strokeLinecap="round" strokeWidth="2.5"/>
    <path d="M55 68q5 3 11 0" stroke="#754c3b" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M61 87v30M41 90l-6 28M80 90l6 28" fill="none" stroke={trim} strokeWidth="3"/>

    {chapterId === '1' && <>
      <path d="M27 31q-9-9-10-13 16 4 31-13 12 17 24 1 15 15 32 13-7 14-13 15Q58 21 27 31Z" fill="#313c49" stroke="#e7c486" strokeWidth="3"/>
      <path d="M36 20q24 11 50 0" fill="none" stroke="#dec58b" strokeWidth="2"/>
      <path d="M17 92l11-23 13 7-8 29Z" fill="#2b5573" stroke="#e2c490" strokeWidth="2"/>
      <path d="M98 93l-12-24-12 7 8 27Z" fill="#2b5573" stroke="#e2c490" strokeWidth="2"/>
      <path d="M91 108l12-13M97 99l-9-5" stroke="#ffe2a5" strokeWidth="3"/>
    </>}

    {chapterId === '2' && <>
      <path d="M32 43 27 26Q50 14 80 25l-4 20Q58 36 32 43Z" fill="#882e32" stroke="#e7ac68" strokeWidth="3"/>
      <path d="M59 27Q39 4 42-3Q76 5 73 31Z" fill="#c7473c" stroke="#f5ce86" strokeWidth="2"/>
      <path d="M20 104Q13 66 32 59" stroke="#e6be7b" strokeWidth="7" fill="none"/>
      <path d="M102 105Q109 68 89 58" stroke="#e6be7b" strokeWidth="7" fill="none"/>
      <path d="M43 95h34M50 104h20" stroke="#c84b39" strokeWidth="4"/>
    </>}

    {chapterId === '3' && <>
      <path d="M29 44Q33 15 61 15q29 1 32 29l-14 7-40-1Z" fill="#737584" stroke="#e2ddd5" strokeWidth="3"/>
      <path d="M28 42h66" stroke="#eee4d6" strokeWidth="8"/>
      <circle cx="61" cy="25" r="11" fill="#f2d27e" stroke="#61534f" strokeWidth="3"/>
      <path d="M91 74l15 28-14 9-13-27" fill="#5e5c66" stroke="#b7b5b8" strokeWidth="2"/>
      <path d="M22 110l13-31" stroke="#d5c3a3" strokeWidth="5"/>
      <path d="M17 100l15 9m-9-25 18 11" stroke="#d5c3a3" strokeWidth="3"/>
    </>}

    {chapterId === '4' && <>
      <path d="M24 45q0-35 35-37t36 37l-20 5-36-1Z" fill="#55483d" stroke="#f0c47b" strokeWidth="4"/>
      <path d="M58 12l8-21 7 34-13 10Z" fill="#c7a568" stroke="#f4d699" strokeWidth="2"/>
      <path d="M30 45h64" stroke="#f7d38c" strokeWidth="7"/>
      <path d="M92 95l-6-20 21 4 9 25Z" fill="#5c4c3d" stroke="#f0c47b" strokeWidth="3"/>
      <path d="M99 76v-13m-9 5 13 13m-1-18-12 16" stroke="#ffe5ae" strokeWidth="3"/>
    </>}

    {chapterId === '5' && <>
      <path d="M35 49Q20 23 49 10l31 1q29 21 7 41L76 38Q59 18 43 39Z" fill="#2b6349" stroke="#c1d3a0" strokeWidth="3"/>
      <path d="M32 25Q17-1 13 4q0 22 21 29M86 20q21-24 27-19-3 27-27 30" fill="#739768" stroke="#d5d3a6" strokeWidth="2"/>
      <path d="M33 95q-17-24-23-19 6 27 30 34M88 92q18-23 24-19-4 29-27 36" fill="#4a7c57" stroke="#b8c59b" strokeWidth="3"/>
    </>}

    {chapterId === '6' && <>
      <path d="M37 43Q30 20 51 13q22-8 39 16l-8 22-5-14q-3-18-16-17-15 0-20 20Z" fill="#40303c"/>
      <path d="M30 20l10-12 12 9 9-14 11 13 14-9 5 15Z" fill="#d7af69" stroke="#f5dfad" strokeWidth="2"/>
      <circle cx="60" cy="15" r="5" fill="#8d4265"/>
      <path d="M98 116V11" stroke="#f3d6ad" strokeWidth="5"/>
      <path d="M99 13l19 10-19 17Z" fill="#a34c5e" stroke="#f1d5a1" strokeWidth="2"/>
      <path d="M20 110q8-17 19-19l9 25" fill="#854d66" stroke="#e4bf92" strokeWidth="2"/>
    </>}

    {chapterId === '7' && <>
      <path d="M33 44q-9-28 17-36 24-9 40 23l-9 18-6-17q-14-10-36 14Z" fill="#343c47" stroke="#e8e6d6" strokeWidth="3"/>
      <path d="M45 20l9-35 8 31 17-29-5 39" fill="#c3cbd1" stroke="#f6ece0" strokeWidth="3"/>
      <path d="M27 77Q4 47 0 34q27 9 43 42M93 77q22-26 27-40-28 10-43 39" fill="#3c536d" stroke="#e8e4cf" strokeWidth="3"/>
      <path d="M17 72l16 7m63-7-16 7" stroke="#a5b7c5" strokeWidth="3"/>
      <path d="M54 91l7-8 7 8-7 20Z" fill="#dfbf81"/>
    </>}

    {chapterId === '8' && <>
      <path d="M29 43Q28 7 61 5q33 2 33 37l-17 9-37-7Z" fill="#7e795e" stroke="#f4d69d" strokeWidth="4"/>
      <path d="M60 9v33M33 40h56" stroke="#e9c985" strokeWidth="4"/>
      <path d="M39 49q19-18 42 0v22q-19 22-42 0Z" fill="#6e6653" stroke="#f0d49d" strokeWidth="3" opacity=".82"/>
      <path d="M52 52h17m-17 9h17" stroke="#322f2c" strokeWidth="3"/>
      <path d="M20 102l11-32 12 16-12 28M100 102 89 70 77 86l12 28" fill="#7b7456" stroke="#e7ca92" strokeWidth="3"/>
      <path d="M56 98l5-11 5 11-5 12Z" fill="#c69c57"/>
    </>}
  </svg>;
};
