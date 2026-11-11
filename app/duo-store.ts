'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {emptyDuo,validateDuo,type Chronology,type Duo,type DuoSide} from './chronology-model';
export type DuoHost={doc:Chronology;busy:boolean;ready:boolean;onSave:(d:Chronology)=>Promise<Chronology>};
export type SaveState='saved'|'dirty'|'saving'|'failed';
// One editing session for the shared two-person sheet: local edits first, one debounced save behind them.
export function useDuo(p:DuoHost){
 const [duo,setDuoState]=useState<Duo>(()=>p.doc.duo||emptyDuo()),[state,setState]=useState<SaveState>('saved');
 const ref=useRef(duo),docRef=useRef(p.doc),dirty=useRef(false),saving=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|null>(null),busyRef=useRef(p.busy),readyRef=useRef(p.ready);
 docRef.current=p.doc;busyRef.current=p.busy;readyRef.current=p.ready;ref.current=duo;
 useEffect(()=>{if(!dirty.current&&!saving.current)setDuoState(p.doc.duo||emptyDuo())},[p.doc]);
 const flush=useCallback(async()=>{
  if(!dirty.current||saving.current)return;
  if(busyRef.current||!readyRef.current){timer.current=setTimeout(flush,500);return}
  saving.current=true;setState('saving');const snapshot=ref.current;
  try{await p.onSave({...docRef.current,duo:validateDuo(snapshot)});if(ref.current===snapshot){dirty.current=false;setState('saved')}else setState('dirty')}
  catch{setState('failed')}
  finally{saving.current=false;if(dirty.current&&ref.current!==snapshot){if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(flush,500)}}
 },[p.onSave]);
 const set=useCallback((next:Duo)=>{ref.current=next;setDuoState(next);dirty.current=true;setState('dirty');if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(flush,750)},[flush]);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);if(dirty.current)flush()},[flush]);
 useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(dirty.current){flush();e.preventDefault()}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[flush]);
 const top=useCallback((patch:Partial<Duo>)=>set({...ref.current,...patch}),[set]);
 const side=useCallback((k:'left'|'right',patch:Partial<DuoSide>)=>set({...ref.current,[k]:{...ref.current[k],...patch}}),[set]);
 const retry=useCallback(()=>{dirty.current=true;flush()},[flush]);
 const status=state==='saving'||p.busy?'正在保存…':state==='dirty'?'有改动，稍后自动保存':state==='failed'?'保存没有成功':'已同步';
 return {duo,ref,top,side,state,status,retry};
}
export async function shrinkPhoto(file:File,w:number,h:number,limit=180000){
 if(!file.type.startsWith('image/'))throw Error('请选择一张图片');
 const bitmap=await createImageBitmap(file),scale=Math.max(w/bitmap.width,h/bitmap.height),sw=w/scale,sh=h/scale,canvas=document.createElement('canvas');
 canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');if(!ctx)throw Error('浏览器暂时无法处理这张图片');
 ctx.drawImage(bitmap,(bitmap.width-sw)/2,(bitmap.height-sh)*.3,sw,sh,0,0,w,h);bitmap.close?.();
 let q=.84,url=canvas.toDataURL('image/jpeg',q);while(url.length>limit&&q>.4){q-=.1;url=canvas.toDataURL('image/jpeg',q)}
 return url;
}
