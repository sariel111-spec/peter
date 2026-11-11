import type {Entry} from './archive';
import type {Chronology} from './chronology-model';
type RecordsPayload={records:Entry[];initialized:boolean};
type ChronologyPayload={doc:Chronology;revision:number};
type Pending<T>={created:number;promise:Promise<T>;timer?:ReturnType<typeof setTimeout>};
// Short-lived, one-use memory only. Private records never go into web storage.
const cache=new Map<string,Pending<unknown>>();
const freshFor=8000;
async function request<T>(path:string):Promise<T>{const r=await fetch(path,{cache:'no-store',credentials:'same-origin'});let data:unknown;try{data=await r.json()}catch{throw Error('云端暂时无法读取，请稍后重试。')}if(!r.ok)throw Error(data&&typeof data==='object'&&'error'in data&&typeof data.error==='string'?data.error:'操作未完成，请重试');return data as T}
function warm<T>(path:string){const old=cache.get(path);if(old&&Date.now()-old.created<freshFor)return;if(old?.timer)clearTimeout(old.timer);const item:Pending<T>={created:Date.now(),promise:request<T>(path)};cache.set(path,item);item.timer=setTimeout(()=>{if(cache.get(path)===item)cache.delete(path)},freshFor);item.promise.catch(()=>{if(item.timer)clearTimeout(item.timer);if(cache.get(path)===item)cache.delete(path)})}
async function consume<T>(path:string):Promise<T>{const item=cache.get(path);cache.delete(path);if(item?.timer)clearTimeout(item.timer);if(item&&Date.now()-item.created<freshFor){try{return await item.promise as T}catch{}}return request<T>(path)}
export function warmArchive(){if(typeof window==='undefined')return;warm<RecordsPayload>('/api/records');warm<ChronologyPayload>('/api/chronology')}
export const readArchiveRecords=()=>consume<RecordsPayload>('/api/records');
export const readArchiveChronology=()=>consume<ChronologyPayload>('/api/chronology');
let hero:HTMLImageElement|undefined;
export function warmArchiveImage(){if(typeof window==='undefined'||hero)return;hero=new Image();hero.decoding='async';hero.src='/images/peter-rooftop.jpg';hero.decode?.().catch(()=>{})}

