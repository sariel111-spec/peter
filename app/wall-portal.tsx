'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import ClueWall from './clue-wall';
import type {WallResponse} from './wall-model';
import {SilkMark} from './spider-interactions';
import {enterArchive} from './archive-transition';
import {warmArchive,warmArchiveImage} from './archive-preload';
import './experience.css';
export default function WallPortal({initial,error=''}:{initial:WallResponse|null;error?:string}){
 const router=useRouter();const [ready,setReady]=useState(false),[editing,setEditing]=useState(false),[night,setNight]=useState(false),[leaving,setLeaving]=useState(false);const navigated=useRef(false),target=useRef('/archive'),codeWarm=useRef(false);
 const warm=useCallback(()=>{if(editing)return;warmArchive();warmArchiveImage();if(!codeWarm.current){codeWarm.current=true;router.prefetch('/archive');import('./archive-app').catch(()=>{codeWarm.current=false})}},[editing,router]);
 useEffect(()=>{const restore=(event:Event)=>{if(event.type==='pageshow'&&(event as PageTransitionEvent).persisted){setReady(false);window.dispatchEvent(new Event('after-class:wall-reload'))}navigated.current=false;target.current='/archive';setLeaving(false);document.querySelectorAll('.portal-picked').forEach(el=>el.classList.remove('portal-picked'))};window.addEventListener('pageshow',restore);window.addEventListener('popstate',restore);const id=location.hash.slice(1);if(id&&id!=='home')router.replace('/archive#'+(id==='manuscript'?'inspiration':id));return()=>{window.removeEventListener('pageshow',restore);window.removeEventListener('popstate',restore)}},[router]);
 useEffect(()=>{if(!ready||editing)return;const id=setTimeout(warm,120);return()=>clearTimeout(id)},[ready,editing,warm]);
 const enter=useCallback((id?:string)=>{if(navigated.current||!ready||editing)return;navigated.current=true;warm();const node=id?document.querySelector<HTMLElement>(`[data-node-id="${CSS.escape(id)}"]`):null,r=node?.getBoundingClientRect();if(node)node.classList.add('portal-picked');document.documentElement.style.setProperty('--entry-x',(r?r.left+r.width/2:innerWidth/2)+'px');document.documentElement.style.setProperty('--entry-y',(r?r.top+r.height/2:innerHeight/2)+'px');setLeaving(true);enterArchive({href:target.current,x:r?(r.left+r.width/2)/innerWidth*100:50,y:r?(r.top+r.height/2)/innerHeight*100:50})},[ready,editing,warm]);
 return <main className={`wall-entrance ${ready?'surface-ready':''} ${editing?'portal-editing':''} ${leaving?'portal-leaving':''}`} aria-label="私人线索墙首页" data-surface-ready={ready} aria-busy={leaving||!ready&&!error} inert={leaving} onPointerOver={warm} onFocusCapture={warm} onTouchStart={warm}>
 {!ready&&!error&&<div className="portal-preflight" role="status"><SilkMark/><span className="sr-only">正在打开保存的线索墙</span></div>}
 <ClueWall initial={initial} initialError={error} portal onEnter={enter} onReady={setReady} onEditingChange={setEditing} onOpen={()=>{}} onGallery={()=>{target.current='/archive#gallery';enter()}} night={night} onLight={()=>setNight(n=>!n)}/>
 </main>
}
