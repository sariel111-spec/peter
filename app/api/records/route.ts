import type { Entry, Asset } from '../../archive';
import { bindings, identity, json, unauthorized, present, kinds, type Row } from '../shared';
export async function GET() {
 const owner=await identity(); if(!owner)return unauthorized();
 const {results}=await bindings().DB.prepare('SELECT * FROM records WHERE owner = ? ORDER BY date DESC, updated DESC').bind(owner).all<Row>();
 const p=await bindings().DB.prepare('SELECT initialized FROM preferences WHERE owner = ?').bind(owner).first();
 return json({records:results.map(present),initialized:!!p?.initialized});
}
export async function POST(req:Request) {
 const owner=await identity();if(!owner)return unauthorized();
 let b:Partial<Entry>; try {const raw=await req.json();if(!raw||typeof raw!=='object')throw new Error();b=raw as Partial<Entry>;}catch{return json({error:'无法读取档案内容'},400);}
 if(!b.kind||!kinds.includes(b.kind)||typeof b.title!=='string'||!b.title.trim()||b.title.length>180)return json({error:'请输入 1–180 字的标题'},400);
 if(typeof b.content!=='string'||b.content.length>250000)return json({error:'正文最多支持 25 万字'},400);
 if(!Array.isArray(b.tags)||b.tags.length>30||b.tags.some((t:unknown)=>typeof t!=='string'||t.length>80))return json({error:'标签格式不正确'},400);
 const data:Entry['data']=b.data&&typeof b.data==='object'?b.data:{};
 if(b.date&&!/^\d{4}-\d{2}-\d{2}$/.test(b.date))return json({error:'日期格式不正确'},400);
 if(data.category&&typeof data.category!=='string'||data.status&&typeof data.status!=='string')return json({error:'档案属性格式不正确'},400);
 if(data.timeLabel!==undefined&&(typeof data.timeLabel!=='string'||data.timeLabel.length>160))return json({error:'时间刻度文字最多 160 字'},400);
 if(data.nodeType!==undefined&&!['era','moment'].includes(data.nodeType))return json({error:'时间点类型不正确'},400);
 if(data.parentId!==undefined&&data.parentId!==null){if(typeof data.parentId!=='string'||data.parentId===b.id)return json({error:'上级时间点不正确'},400);if(!b.id){const parent=await bindings().DB.prepare('SELECT id FROM records WHERE id=? AND owner=? AND kind=? AND deleted=0').bind(data.parentId,owner,'story').first();if(!parent)return json({error:'请选择你故事线里的有效上级时间点'},400);}}
 if(data.cover&&!/^\/(images\/[a-z-]+\.jpg|api\/assets\/[0-9a-f-]+)$/.test(data.cover))return json({error:'请选择站内封面'},400);
 if(data.files){
  if(!Array.isArray(data.files)||data.files.length>100)return json({error:'每则档案最多 100 个附件'},400);
  const safeFiles:Asset[]=[];
  for(const f of data.files){if(!f||typeof f.id!=='string')return json({error:'附件信息不完整'},400);const asset=await bindings().DB.prepare('SELECT id,name,type,size FROM assets WHERE owner=? AND id=?').bind(owner,f.id).first<{id:string;name:string;type:string;size:number}>();if(!asset)return json({error:'附件不存在，请重新上传'},400);safeFiles.push({...asset,url:`/api/assets/${asset.id}`});}
  data.files=safeFiles;
 }
 if(JSON.stringify(data).length>250000)return json({error:'附件信息过大'},400);
 if(b.kind==='link'){try {const u=new URL(data.url||'');if(!['http:','https:'].includes(u.protocol))throw 0;}catch{return json({error:'请输入完整的 http 或 https 网站地址'},400);}}
 const id=typeof b.id==='string'&&b.id.length<180?b.id:crypto.randomUUID();
 const prev=await bindings().DB.prepare('SELECT * FROM records WHERE id = ? AND owner = ?').bind(id,owner).first<Row>();
 const now=new Date().toISOString();
 if(prev){
  if(b.revision!==prev.revision)return json({error:'这则档案已在其他页面更新，请刷新页面后重新打开。'},409);
  const updated=await bindings().DB.prepare('UPDATE records SET kind=?, title=?, content=?, tags=?, data=?, date=?, favorite=?, deleted=?, revision=revision+1, updated=? WHERE id=? AND owner=? AND revision=? RETURNING *').bind(b.kind,b.title.trim(),b.content,JSON.stringify(b.tags),JSON.stringify(data),b.date||now.slice(0,10),b.favorite?1:0,b.deleted?1:0,now,id,owner,prev.revision).first<Row>();
  if(!updated)return json({error:'档案刚刚发生变动，请重新打开。'},409);
  return json({record:present(updated)});
 }
 const created=await bindings().DB.prepare('INSERT INTO records (id,owner,kind,title,content,tags,data,date,favorite,deleted,revision,updated) VALUES (?,?,?,?,?,?,?,?,?,?,1,?) RETURNING *').bind(crypto.randomUUID(),owner,b.kind,b.title.trim(),b.content,JSON.stringify(b.tags),JSON.stringify(data),b.date||now.slice(0,10),b.favorite?1:0,b.deleted?1:0,now).first<Row>();
 return json({record:present(created!)},201);
}
export async function DELETE(req:Request){
 const owner=await identity();if(!owner)return unauthorized();
 const id=new URL(req.url).searchParams.get('id');
 const record=await bindings().DB.prepare('SELECT * FROM records WHERE id=? AND owner=? AND deleted=1').bind(id,owner).first<Row>();
 if(!record)return json({error:'只能彻底删除回收站中的档案'},404);
 const data=JSON.parse(record.data);const fileIds=(data.files||[]).map((f:{id:string})=>f.id);
 for(const fileId of fileIds){
  // Retain shared attachments referenced by another record.
  const used=await bindings().DB.prepare('SELECT id FROM records WHERE owner=? AND id<>? AND data LIKE ? LIMIT 1').bind(owner,id,`%${fileId}%`).first();
  const onWall=await bindings().DB.prepare('SELECT owner FROM walls WHERE owner=? AND doc LIKE ? LIMIT 1').bind(owner,`%${fileId}%`).first();
  if(!used&&!onWall){const asset=await bindings().DB.prepare('SELECT id FROM assets WHERE id=? AND owner=?').bind(fileId,owner).first();if(asset){await bindings().BUCKET.delete(`${owner}/${fileId}`);await bindings().DB.prepare('DELETE FROM assets WHERE id=? AND owner=?').bind(fileId,owner).run();}}
 }
 await bindings().DB.prepare('DELETE FROM records WHERE id=? AND owner=?').bind(id,owner).run();
 return json({ok:true});
}
