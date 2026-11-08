/** Transiciones de música de campaña independientes de React y del combate.
 * Dos reproductores se solapan solo durante el fundido; una misma pista
 * conserva su posición al pasar por intervenciones consecutivas.
 */
import type {StudioNarrativeMusicMode} from './narrativeAudio.ts';

export const MUSIC_CROSSFADE_MS=700;
export const MUSIC_LEVEL_FADE_MS=320;
export const MUSIC_VOLUME_NORMAL=0.3;
export const MUSIC_VOLUME_SOFT=0.12;

export type MusicAudioLike={
  loop:boolean;
  volume:number;
  play:()=>Promise<unknown>|void;
  pause:()=>void;
};
export type MusicDirectorDependencies={
  create:(url:string)=>MusicAudioLike;
  requestFrame:(callback:(timestamp:number)=>void)=>number;
  cancelFrame:(id:number)=>void;
  now:()=>number;
};
type Track={url:string;audio:MusicAudioLike};
type Fade={from:Track|null;fromVolume:number;fromActiveVolume:number;
  startedAt:number;duration:number};
export const volumeForNarrative=(enabled:boolean,mode:StudioNarrativeMusicMode):number=>
  !enabled||mode==='silent'?0:mode==='soft'?MUSIC_VOLUME_SOFT:MUSIC_VOLUME_NORMAL;
export const smoothMusicProgress=(elapsed:number,duration:number):number=>{
  const t=Math.min(1,Math.max(0,elapsed/duration));
  return t*t*(3-2*t);
};

export class NarrativeMusicDirector {
  private current:Track|null=null;
  private outgoing:Track|null=null;
  private fade:Fade|null=null;
  private frame:number|null=null;
  private enabled=false;
  private mode:StudioNarrativeMusicMode='normal';
  private readonly deps:MusicDirectorDependencies;

  constructor(deps:MusicDirectorDependencies){this.deps=deps;}

  private play(audio:MusicAudioLike){
    try{
      const result=audio.play();
      if(result&&typeof result.catch==='function')
        result.catch(()=>{/* El navegador puede exigir una interacción del jugador. */});
    }catch{/* El navegador puede impedir el audio automático. */}
  }
  private cancelAnimation(){
    if(this.frame!==null)this.deps.cancelFrame(this.frame);
    this.frame=null;this.fade=null;
  }
  private discardOutgoing(){
    this.outgoing?.audio.pause();
    this.outgoing=null;
  }
  private animate=(timestamp:number)=>{
    this.frame=null;
    if(!this.current||!this.fade)return;
    const fade=this.fade;
    const progress=smoothMusicProgress(timestamp-fade.startedAt,fade.duration);
    const target=volumeForNarrative(this.enabled,this.mode);
    this.current.audio.volume=fade.fromActiveVolume+(target-fade.fromActiveVolume)*progress;
    if(fade.from)fade.from.audio.volume=fade.fromVolume*(1-progress);
    if(progress>=1){
      this.discardOutgoing();
      this.fade=null;
      return;
    }
    this.frame=this.deps.requestFrame(this.animate);
  };

  /** No reinicia la pista cuando solo cambia el diálogo o el volumen. */
  setSoundtrack(url:string,enabled:boolean,mode:StudioNarrativeMusicMode){
    const changed=this.current?.url!==url;
    this.enabled=enabled;this.mode=mode;
    const target=volumeForNarrative(enabled,mode);
    if(changed){
      this.cancelAnimation();
      this.discardOutgoing();
      const prior=this.current;
      const next={url,audio:this.deps.create(url)};
      next.audio.loop=true;
      next.audio.volume=0;
      this.current=next;
      if(target<=0){
        prior?.audio.pause();
        next.audio.pause();
        return;
      }
      this.play(next.audio);
      this.outgoing=prior;
      const oldVolume=prior?.audio.volume??0;
      if(prior){
        this.fade={from:prior,fromVolume:oldVolume,fromActiveVolume:0,
          startedAt:this.deps.now(),duration:MUSIC_CROSSFADE_MS};
      }else{
        this.fade={from:null,fromVolume:0,fromActiveVolume:0,
          startedAt:this.deps.now(),duration:MUSIC_LEVEL_FADE_MS};
      }
      this.frame=this.deps.requestFrame(this.animate);
      return;
    }
    if(!this.current)return;
    if(target<=0){
      this.cancelAnimation();
      this.discardOutgoing();
      this.current.audio.volume=0;
      this.current.audio.pause();
      return;
    }
    this.play(this.current.audio);
    if(this.fade){
      // La transición actual se adapta al nuevo volumen sin crear otra pista.
      return;
    }
    const previous=this.current.audio.volume;
    if(Math.abs(previous-target)<.001){
      this.current.audio.volume=target;
      return;
    }
    this.fade={from:null,fromVolume:0,fromActiveVolume:previous,
      startedAt:this.deps.now(),duration:MUSIC_LEVEL_FADE_MS};
    this.frame=this.deps.requestFrame(this.animate);
  }
  dispose(){
    this.cancelAnimation();
    this.discardOutgoing();
    this.current?.audio.pause();
    this.current=null;
  }
}
