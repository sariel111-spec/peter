import {bindings} from './api/shared';
import type {WallResponse} from './wall-model';
export async function readWallState(owner:string):Promise<WallResponse>{
 const row=await bindings().DB.prepare('SELECT doc,revision,updated FROM walls WHERE owner=?').bind(owner).first<{doc:string;revision:number;updated:string}>();
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(owner)),scope=Array.from(new Uint8Array(hash)).slice(0,12).map(v=>v.toString(16).padStart(2,'0')).join('');
 return {doc:row?JSON.parse(row.doc):null,revision:row?.revision||0,updated:row?.updated||null,scope};
}
