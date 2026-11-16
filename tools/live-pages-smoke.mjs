/**
 * Verify the exact commit that GitHub Pages serves, not just an old cached
 * index.html. Runs after actions/deploy-pages in the publish workflow.
 * GitHub Pages may briefly serve the previous release: retry the manifest.
 */
import assert from 'node:assert/strict';

const origin='https://afelex.github.io/Decreto-Real/';
const commit=process.env.GITHUB_SHA;
assert.ok(commit&&/^[a-f\d]{40}$/.test(commit),'Need GITHUB_SHA of deploying commit');

const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const get=async (path,{head=false}={})=>{
  const url=new URL(path,origin);
  url.searchParams.set('release',commit.slice(0,12));
  const response=await fetch(url,{
    method:head?'HEAD':'GET',
    headers:{'Cache-Control':'no-cache'},
    signal:AbortSignal.timeout(14000),
  });
  if(!response.ok)throw new Error(path+': HTTP '+response.status);
  return response;
};

let deployed=false;
for(let attempt=1;attempt<=12;attempt++){
  try{
    const manifest=await (await get('release.json')).json();
    if(manifest.commit===commit){deployed=true;break;}
    console.log('Página anterior todavía visible: intento '+attempt+'/12');
  }catch(error){
    console.log('GitHub Pages todavía propagándose: '+String(error.message)+' ('+attempt+'/12)');
  }
  if(attempt<12)await wait(10000);
}
assert.ok(deployed,'GitHub Pages no sirve todavía la revisión '+commit);

const response=await get('index.html');
const html=await response.text();
assert.match(html,/<title>Decreto Real/);
const js=html.match(/src="(\/Decreto-Real\/assets\/[^"]+\.js)"/)?.[1];
assert.ok(js,'Index sin JS compilado de Vite');
const urls=[
  js.replace(/^\/Decreto-Real\//,''),
  'portada/portada-poster.jpg',
  'portada/portada-loop.mp4',
  'portada/decreto-real-logo.png',
  'escenarios/partida-inicial-poster.jpg',
  'escenarios/partida-inicial-loop.mp4',
  'interfaz/banner-tu-turno.webp',
  'interfaz/banner-turno-rival.webp',
  'animaciones/banner-jugador-rojo.webm',
  'animaciones/banner-rival-azul.webm',
  'efectos/ataque.webm',
  'efectos/defensa.webm',
  'efectos/orden.webm',
  'efectos/combo-ataque-x2.webm',
  'efectos/combo-ataque-x3.webm',
  'efectos/combo-defensa-x2.webm',
  'efectos/combo-defensa-x3.webm',
];

const failures=[];
for(const name of urls){
  try{
    const r=await get(name,{head:true});
    console.log('[Pages OK]',name,'HTTP',r.status);
  }catch(error){failures.push(String(error.message));}
}
assert.deepEqual(failures,[],'Faltan recursos publicados o inaccesibles');
console.log('RELEASE VERIFICADO:',commit,urls.length,'recursos y archivo HTML de la misma revisión.');
