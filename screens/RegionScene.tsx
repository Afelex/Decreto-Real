import React from 'react';
import { regionVisual } from '../campaign/regionVisuals.ts';
import { GeneralPortrait, GENERAL_PORTRAIT_IDS } from './GeneralPortrait';

/** Small original vector landscape reused by the campaign briefings.
 * All paths are decorative. Opponent stats still come from the combat engine. */
export const RegionScene: React.FC<{ chapterId?: string; formidable?: boolean }> = ({
  chapterId, formidable = false,
}) => {
  const visual = regionVisual(chapterId);
  const id = chapterId ?? 'p';
  const style = {
    '--rv-sky': visual.sky,
    '--rv-earth': visual.earth,
    '--rv-horizon': visual.horizon,
  } as React.CSSProperties;

  return <div className={`dc-story-art dc-region-scene${formidable ? ' dc-region-formidable' : ''}`}
      data-region={id} style={style} aria-hidden="true">
    <span className="dc-region-sun" />
    <svg viewBox="0 0 480 160" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true">
      <g opacity=".22" stroke="#f5dfb2" strokeWidth="2">
        <path d="M0 55Q45 35 100 57T205 53T325 58T480 50"/>
        <path d="M0 80Q80 61 160 86T320 76T480 82"/>
      </g>
      {id === 'p' && <g>
        <path d="M130 133L133 37 334 25 329 127Z" fill="#e4cd9f" stroke="#71543f" strokeWidth="5"/>
        <path d="M147 54H308M154 69H309M154 84H278M158 99H286" stroke="#82654a" strokeWidth="3" opacity=".76"/>
        <circle cx="250" cy="105" r="22" fill="#9e543e" stroke="#eecf97" strokeWidth="5"/>
        <path d="M250 91l5 10 11 2-9 7 2 12-9-6-9 6 2-12-9-7 11-2Z" fill="#f6dda1"/>
      </g>}
      {id === '1' && <g>
        <path d="M35 141Q110 132 176 143T317 138T470 144" stroke="#f3e6cc" strokeWidth="4" opacity=".72"/>
        <path d="M102 105H369L335 138H140Z" fill="#513c32" stroke="#d6b98e" strokeWidth="4"/>
        <path d="M230 105V23M310 105V48" stroke="#f2dcac" strokeWidth="5"/>
        <path d="M221 28L130 98H222Z" fill="#f3dfb7" stroke="#735943" strokeWidth="3"/>
        <path d="M239 28L295 97H239Z" fill="#d5b583" stroke="#735943" strokeWidth="3"/>
        <path d="M305 47L357 98H305Z" fill="#e4cc9e" stroke="#735943" strokeWidth="3"/>
        <path d="M230 21l30 9-30 9Z" fill="#a74d43"/>
      </g>}
      {id === '2' && <g fill="#ead0a2" stroke="#71533e" strokeWidth="3">
        <ellipse cx="233" cy="87" rx="96" ry="37"/>
        <path d="M289 75L328 39 350 40 365 73 345 86 320 68 307 100Z"/>
        <path d="M350 45l-4-25 21 22Z"/>
        <path d="M162 105l-25 40h22l37-39M238 109l-7 37h19l21-40M291 107l27 40h20l-17-46"/>
        <path d="M151 74q-36-16-40-45M190 55l26-22h27l22 22" fill="none"/>
        <path d="M210 52h53v34h-53Z" fill="#8e4038"/>
      </g>}
      {id === '3' && <g>
        <path d="M-20 159L114 38 190 117 287 15 443 157Z" fill="#93858a" stroke="#d3b8a1" strokeWidth="3"/>
        <path d="M287 15l-36 55 29-13 29 24Z" fill="#e7d6c5"/>
        <path d="M110 143q47-87 95 0Z" fill="#2f333b" stroke="#c8b397" strokeWidth="6"/>
        <path d="M119 145V106M139 145V93M161 145V99M183 145V122M118 111h67" stroke="#b59b79" strokeWidth="4"/>
        <path d="M242 126h77l-10 20h-58Z" fill="#80604b" stroke="#e0bd82" strokeWidth="4"/>
        <circle cx="258" cy="146" r="9" fill="#333a44" stroke="#d9b781" strokeWidth="3"/>
        <circle cx="302" cy="146" r="9" fill="#333a44" stroke="#d9b781" strokeWidth="3"/>
      </g>}
      {id === '4' && <g>
        <path d="M44 153V80h40V61h34v19h32V61h34v19h32v73M300 153V65h38V50h36v15h40V153Z" fill="#806e5b" stroke="#ead0a6" strokeWidth="4"/>
        <path d="M161 115L291 83 309 111 178 143Z" fill="#493d34" stroke="#edce98" strokeWidth="4"/>
        <path d="M215 116l12 38h-20l-18-29M273 104l10 46h-20l-9-39" stroke="#e1bd82" strokeWidth="6"/>
        <circle cx="203" cy="144" r="20" fill="#554738" stroke="#d8b88b" strokeWidth="6"/>
        <path d="M311 78l17-10" stroke="#fff1d1" strokeWidth="6" strokeLinecap="round"/>
        <path d="M327 67l17-15m-11 17 18-4m-23 6 5 14" stroke="#f0cc8a" strokeWidth="4"/>
      </g>}
      {id === '5' && <g>
        <path d="M0 160q65-77 150-39t170 0 160 39Z" fill="#264d42"/>
        <path d="M52 150V62M175 154V46M308 152V72M414 153V55" stroke="#5a4538" strokeWidth="16"/>
        <path d="M13 78q-26-65 39-68 50-5 55 49Q85 101 13 78M126 58q-4-76 56-63 65 8 56 68-46 40-112-5M271 83q-26-70 41-76 69-4 59 71-47 36-100 5M360 66Q366-8 429 6q62 6 47 71-50 31-116-11" fill="#537a59" stroke="#b3b18c" strokeWidth="3"/>
        <path d="M0 155q110-58 224 0t256-5" stroke="#d4cfac" strokeWidth="9" opacity=".7"/>
      </g>}
      {id === '6' && <g fill="#987c6c" stroke="#e3c59b" strokeWidth="4">
        <path d="M45 144V67h62v-22h46v22h56v77ZM282 144V77h66V52h42v25h55v67Z"/>
        <path d="M125 144v-43q23-28 46 0v43M326 144v-39q25-27 50 0v39" fill="#342f39"/>
        <path d="M158 51V16M370 53V18" stroke="#ecd3a7" strokeWidth="5"/>
        <path d="M161 18l62 17-62 14Z" fill="#9f3433" stroke="#dec29d" strokeWidth="2"/>
        <path d="M373 19l59 17-59 14Z" fill="#c5b7a0" stroke="#dec29d" strokeWidth="2"/>
        <path d="M223 145V90h50v55Z" fill="#b7a287"/>
      </g>}
      {id === '7' && <g>
        <path d="M-15 160L105 43 178 115 295 16 430 159Z" fill="#77869d" stroke="#d6d8d8" strokeWidth="3"/>
        <path d="M295 16l-52 60 42-14 39 18ZM105 43l-35 47 34-16 28 18Z" fill="#dde1e1"/>
        <path d="M200 51q-44-42-117-29 70 19 111 49 23 18 44 3 29-7 58-42-50 18-83 32l4-35-14 15Z" fill="#383b45" stroke="#e3d7c4" strokeWidth="3"/>
        <path d="M235 69l22 17-16-28" fill="#c8ad85"/>
      </g>}
      {id === '8' && <g fill="#84796b" stroke="#e1c49a" strokeWidth="4">
        <path d="M91 148V48h55V26h36v22h120V27h40v22h54v99Z"/>
        <path d="M225 148V96q31-33 60 0v52Z" fill="#342c2b"/>
        <path d="M107 76h34v24h-34M334 76h37v24h-37" fill="#463d37"/>
        <path d="M230 34q40 6 72 0v38q-38 34-72 0Z" fill="#d6b781"/>
        <path d="M265 42v30m-20-18h42" stroke="#7d4339" strokeWidth="5"/>
      </g>}
      {id === 'f' && <g>
        <path d="M-10 158L96 108 175 126 254 88 349 125 480 149" fill="#4d3c45"/>
        <path d="M155 157V54l32-32 31 32v104M244 158V71l35-41 35 41v87" fill="#5f5158" stroke="#d0a9a0" strokeWidth="4"/>
        <path d="M185 104q-24-42 0-48 25 5 0 48M279 107q-22-44 0-54 22 10 0 54" fill="#c3a17c"/>
        <circle cx="235" cy="42" r="30" fill="#f1d4a0" opacity=".54"/>
        <path d="M235-4v17m0 59v20m-48-50h19m59 0h21m-87-33 13 14m46 41 13 14m-2-69-14 14m-45 42-14 14" stroke="#ffdaa0" strokeWidth="5" opacity=".8"/>
      </g>}
    </svg>
    {formidable && GENERAL_PORTRAIT_IDS.some(general => general === id) && <div className="dc-general-portrait-seal"><GeneralPortrait chapterId={id}/></div>}
    <span className="dc-region-scene-caption"><b>{visual.symbol}</b> {visual.landmark}</span>
  </div>;
};
