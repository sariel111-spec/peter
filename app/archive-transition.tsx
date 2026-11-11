'use client';
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {SilkMark} from './spider-interactions';
export type ArchiveEntry={href:string;x:number;y:number};
// In → fill → out: strands shoot from the picked clue, the web closes over the wall, then opens from the same point onto the archive.
function SilkEntry({x,y}:{x:number;y:number}){
 const w=innerWidth,h=innerHeight,cx=x/100*w,cy=y/100*h,reach=Math.hypot(Math.max(cx,w-cx),Math.max(cy,h-cy))+40,count=16;
 const angles=Array.from({length:count},(_,i)=>i*Math.PI*2/count+Math.sin(i*7.3)*.07),radii=[.07,.15,.25,.37,.52,.7,.9].map(r=>r*reach);
 const point=(a:number,r:number)=>`${(cx+r*Math.cos(a)).toFixed(1)} ${(cy+r*Math.sin(a)).toFixed(1)}`;
 return <div className="silk-entry" style={{'--silk-x':cx+'px','--silk-y':cy+'px'} as React.CSSProperties} aria-hidden="true">
  <div className="silk-entry-cover"/>
  <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
   <g className="silk-spokes">{angles.map((a,i)=><path key={i} pathLength={1} d={`M${point(a,0)}L${point(a,reach)}`} style={{animationDelay:i%4*18+'ms'}}/>)}</g>
   <g className="silk-rings">{radii.map((r,j)=><path key={r} pathLength={1} style={{animationDelay:170+j*38+'ms'}} d={angles.map((a,i)=>{const next=angles[(i+1)%count]+(i===count-1?Math.PI*2:0),mid=(a+next)/2;return (i?'':'M'+point(a,r))+'Q'+point(mid,r*.9)+' '+point(next,r)}).join('')}/>)}</g>
  </svg>
  <span className="silk-entry-mark"><SilkMark/></span>
 </div>
}
export function enterArchive(detail:ArchiveEntry){window.dispatchEvent(new CustomEvent('after-class:enter-archive',{detail}))}
export function archiveIsReady(){window.dispatchEvent(new Event('after-class:archive-ready'))}
export default function ArchiveTransition(){
 const router=useRouter(),[entry,setEntry]=useState<ArchiveEntry|null>(null),[phase,setPhase]=useState<'cover'|'waiting'|'reveal'|'failed'>('cover'),root=useRef<HTMLDivElement>(null),active=useRef(false),phaseRef=useRef(phase),timers=useRef<ReturnType<typeof setTimeout>[]>([]),generation=useRef(0),ready=useRef(false),navigated=useRef(false);phaseRef.current=phase;
 useEffect(()=>{
  const later=(fn:()=>void,ms:number)=>{const timer=setTimeout(fn,ms);timers.current.push(timer)};
  const finish=()=>{if(!active.current||!navigated.current||!ready.current||phaseRef.current==='reveal')return;phaseRef.current='reveal';setPhase('reveal');later(()=>{active.current=false;setEntry(null);document.querySelector<HTMLElement>('main h1')?.focus({preventScroll:true})},matchMedia('(prefers-reduced-motion:reduce)').matches?0:620)};
  const begin=(event:Event)=>{if(active.current)return;const detail=(event as CustomEvent<ArchiveEntry>).detail;if(!/^\/archive(?:#[a-z]+)?$/.test(detail.href))return;timers.current.forEach(clearTimeout);timers.current=[];active.current=true;ready.current=false;navigated.current=false;const id=++generation.current;setPhase('cover');setEntry(detail);later(()=>{if(id!==generation.current)return;setPhase('waiting');navigated.current=true;router.push(detail.href,{scroll:true});finish()},matchMedia('(prefers-reduced-motion:reduce)').matches?0:600);later(()=>{if(active.current&&id===generation.current&&phaseRef.current!=='reveal')setPhase('failed')},12000)};
  const loaded=()=>{ready.current=true;finish()};const reset=()=>{++generation.current;timers.current.forEach(clearTimeout);active.current=false;setEntry(null)};
  window.addEventListener('after-class:enter-archive',begin);window.addEventListener('after-class:archive-ready',loaded);window.addEventListener('popstate',reset);
  return()=>{timers.current.forEach(clearTimeout);window.removeEventListener('after-class:enter-archive',begin);window.removeEventListener('after-class:archive-ready',loaded);window.removeEventListener('popstate',reset)};
 },[router]);
 useEffect(()=>{if(!entry)return;const previous=document.activeElement as HTMLElement,old=document.body.style.overflow;document.body.style.overflow='hidden';root.current?.focus({preventScroll:true});const trap=(e:KeyboardEvent)=>{if(e.key==='Tab'&&phaseRef.current!=='failed')e.preventDefault()};document.addEventListener('keydown',trap);return()=>{document.body.style.overflow=old;document.removeEventListener('keydown',trap);if(previous?.isConnected)previous.focus({preventScroll:true})}},[!!entry]);
 if(!entry)return null;
 return <div ref={root} className={`archive-entry-overlay entry-${phase}`} tabIndex={-1} role="status" aria-label={phase==='failed'?'档案连接需要重试':'正沿着蛛丝进入档案站'} data-entry-phase={phase}>
  <SilkEntry x={entry.x} y={entry.y}/>
  <div className="entry-thread-progress" aria-hidden="true"><SilkMark/><i/><span>AFTER CLASS</span></div>
  {phase==='failed'&&<div className="entry-connection-retry"><p>档案暂时没有打开。</p><span>你的线索墙和内容仍保存在原处。</span><div><button onClick={()=>location.assign(entry.href)}>重新打开档案</button><button onClick={()=>location.assign('/')}>返回线索墙</button></div></div>}
 </div>
}
