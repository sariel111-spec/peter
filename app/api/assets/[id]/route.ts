import {bindings,identity,unauthorized} from '../../shared';
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){
 const owner=await identity();if(!owner)return unauthorized();const {id}=await params;
 const b=bindings();const file=await b.DB.prepare('SELECT * FROM assets WHERE id=? AND owner=?').bind(id,owner).first<{name:string;type:string}>();
 if(!file)return new Response('Not found',{status:404});const object=await b.BUCKET.get(`${owner}/${id}`);if(!object)return new Response('Not found',{status:404});
 const attachment=new URL(req.url).searchParams.has('download')||!(/^(image\/|application\/pdf|text\/)/.test(file.type));
 return new Response(object.body,{headers:{'content-type':file.type,'content-disposition':`${attachment?'attachment':'inline'}; filename*=UTF-8''${encodeURIComponent(file.name)}`,'cache-control':'private, no-store','x-content-type-options':'nosniff','content-security-policy':"default-src 'none'; style-src 'unsafe-inline'; sandbox"}});
}
