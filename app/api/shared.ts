import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../chatgpt-auth';
export const bindings = () => env as unknown as { DB: D1Database; BUCKET: R2Bucket };
export async function identity() { const u = await getChatGPTUser(); return u?.userId || null; }
export const json = (data: unknown, status=200) => Response.json(data,{status,headers:{'cache-control':'private, no-store'}});
export const unauthorized = () => json({error:'请先登录，才能读取和保存私人档案。'},401);
export type Row = {id:string;owner:string;kind:string;title:string;content:string;tags:string;data:string;date:string;favorite:number;deleted:number;revision:number;updated:string};
export const present = (r: Row) => ({...r,owner:undefined,tags:JSON.parse(r.tags),data:JSON.parse(r.data),favorite:!!r.favorite,deleted:!!r.deleted});
export const kinds = ['story','inspiration','manuscript','artwork','message','question','link','profile'];
