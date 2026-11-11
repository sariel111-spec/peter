'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {emptyChronology,validateChronology,type Chronology} from './chronology-model';
import {readArchiveChronology} from './archive-preload';
export type ChronologyResponse={doc:Chronology;revision:number;error?:string};
export function useChronology(notify:(s:string)=>void){
 const [doc,setDoc]=useState<Chronology>(emptyChronology),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');const ref=useRef(doc),revision=useRef(0),lock=useRef(false);
 const read=useCallback(async()=>{setError('');try{const b=await readArchiveChronology();const d=validateChronology(b.doc);ref.current=d;setDoc(d);revision.current=b.revision;setReady(true)}catch(e){setError((e as Error).message);setReady(false)}},[]);
 useEffect(()=>{read();const reload=()=>read();window.addEventListener('after-class:chronology-reload',reload);return()=>window.removeEventListener('after-class:chronology-reload',reload)},[read]);
 const save=async(next:Chronology)=>{if(lock.current)throw Error('目录正在保存，请稍候');if(!ready)throw Error('请先重新读取时间目录');const safe=validateChronology(next);lock.current=true;setBusy(true);try{const r=await fetch('/api/chronology',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({doc:safe,revision:revision.current})}),b=await r.json() as ChronologyResponse;if(!r.ok){if(r.status===409)await read();throw Error(b.error||'目录保存失败')}ref.current=b.doc;setDoc(b.doc);revision.current=b.revision;setError('');return b.doc as Chronology}catch(e){notify((e as Error).message);throw e}finally{lock.current=false;setBusy(false)}};
 return {doc,ref,ready,busy,error,read,save};
}
