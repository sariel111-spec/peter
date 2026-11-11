import {bindings,identity,json,unauthorized} from '../shared';
import {readWallState} from '../../wall-storage';
import {validateWall,wallAssets} from '../../wall-model';
const read=async(owner:string)=>bindings().DB.prepare('SELECT doc,revision,updated FROM walls WHERE owner=?').bind(owner).first<{doc:string;revision:number;updated:string}>();
export async function GET(){const owner=await identity();if(!owner)return unauthorized();return json(await readWallState(owner));}
export async function PUT(req:Request){
 const owner=await identity();if(!owner)return unauthorized();if(req.headers.get('sec-fetch-site')==='cross-site')return json({error:'请在网站中保存线索墙'},403);
 let body:{doc:unknown;revision:number};let doc;try{body=await req.json() as typeof body;if(!Number.isInteger(body.revision)||body.revision<0)throw new Error('缺少有效的保存版本');doc=validateWall(body.doc);}catch(e){return json({error:(e as Error).message||'无法读取线索墙'},400);}
 for(const file of wallAssets(doc)){const found=await bindings().DB.prepare('SELECT id,name,type,size FROM assets WHERE id=? AND owner=?').bind(file.id,owner).first<{id:string;name:string;type:string;size:number}>();if(!found||!found.type.startsWith('image/'))return json({error:'部分图片无法读取，请重新上传后再保存。'},400);for(const n of doc.nodes)if(n.file?.id===file.id)n.file={...found,url:`/api/assets/${found.id}`};}
 const now=new Date().toISOString();const serialized=JSON.stringify(doc);let row;
 if(body.revision===0)row=await bindings().DB.prepare('INSERT OR IGNORE INTO walls (owner,doc,revision,updated) VALUES (?,?,1,?) RETURNING revision,updated').bind(owner,serialized,now).first();
 else row=await bindings().DB.prepare('UPDATE walls SET doc=?,revision=revision+1,updated=? WHERE owner=? AND revision=? RETURNING revision,updated').bind(serialized,now,owner,body.revision).first();
 if(!row){const current=await read(owner);return json({error:'另一页面或设备刚刚修改了线索墙。请先选择使用云端版本，或保留当前版本重新保存。',conflict:true,revision:current?.revision||0,doc:current?JSON.parse(current.doc):null},409);}
 return json({...row,doc});
}
