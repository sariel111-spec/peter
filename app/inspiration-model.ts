import type {Entry} from './archive';
export function inspirationPool(entries:Entry[]){return entries.filter(e=>e.kind==='inspiration'&&!e.deleted)}
export function drawInspiration(entries:Entry[],previousId:string|null=null,random=Math.random):Entry|null{const pool=inspirationPool(entries);if(!pool.length)return null;const next=pool.length>1?pool.filter(e=>e.id!==previousId):pool;const value=Math.min(.999999999999,Math.max(0,random()));return next[Math.floor(value*next.length)]||next[0]}
