import {bindings,identity,json,unauthorized} from '../shared';
export async function POST(req:Request){
 const owner=await identity();if(!owner)return unauthorized();
 const form=await req.formData();const f=form.get('file');
 if(!(f instanceof File)||!f.size)return json({error:'请选择非空文件'},400);
 if(f.size>20*1024*1024)return json({error:'每个文件最多 20MB'},413);
 const allowed=/^(image\/(jpeg|png|gif|webp|avif|heic|heif)|application\/pdf|application\/vnd.openxmlformats-officedocument.wordprocessingml.document|text\/plain|text\/markdown)$/;
 if(!allowed.test(f.type))return json({error:'支持 JPG、PNG、GIF、WebP、HEIC、PDF、DOCX、TXT、Markdown 文件'},415);
 const id=crypto.randomUUID();const db=bindings();
 await db.BUCKET.put(`${owner}/${id}`,f.stream(),{httpMetadata:{contentType:f.type}});
 try {await db.DB.prepare('INSERT INTO assets (id,owner,name,type,size,created) VALUES (?,?,?,?,?,?)').bind(id,owner,f.name,f.type,f.size,new Date().toISOString()).run();}
 catch(e){await db.BUCKET.delete(`${owner}/${id}`);throw e;}
 return json({file:{id,name:f.name,type:f.type,size:f.size,url:`/api/assets/${id}`}},201);
}
