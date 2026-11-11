import assert from 'node:assert/strict';
import {createDefaultWall} from '../app/wall-defaults.ts';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:4173';if(!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base))throw new Error('Local preview only');
const headers={cookie:'__sites_local_auth=1'};
const request=async(path,options={})=>{const r=await fetch(base+path,{...options,headers:{...headers,...options.headers}});return {status:r.status,body:await r.json()}};
const put=(doc,revision)=>request('/api/wall',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({doc,revision})});
const postRecord=r=>request('/api/records',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(r)});
assert.equal((await fetch(base+'/api/wall')).status,401);const before=(await request('/api/wall')).body;assert.ok(before.scope.length>=20);
let current=before,asset,record;
try{
 const d=createDefaultWall();d.nodes[0].desktop={...d.nodes[0].desktop,x:11,y:14,w:25,h:19,r:42};const changed=await put(d,current.revision);assert.equal(changed.status,200);current=changed.body;assert.deepEqual(current.doc.nodes[0].desktop,d.nodes[0].desktop);
 assert.equal((await put(d,before.revision)).status,409);const roundtrip=(await request('/api/wall')).body;assert.equal(roundtrip.doc.nodes[0].desktop.r,42);assert.equal(roundtrip.doc.nodes[0].mobile.x,1);
 const bad=structuredClone(d);bad.nodes[0].src='https://example.com/image.jpg';assert.equal((await put(bad,current.revision)).status,400);
 const broken=structuredClone(d);broken.edges[0].to='missing';assert.equal((await put(broken,current.revision)).status,400);
 const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aC1kAAAAASUVORK5CYII=','base64');const fd=new FormData();fd.append('file',new File([bytes],'qa-wall.png',{type:'image/png'}));asset=(await request('/api/assets',{method:'POST',body:fd})).body.file;
 const original=structuredClone(d.nodes[0]),originalEdges=structuredClone(d.edges);d.nodes[0]={...d.nodes[0],src:asset.url,file:asset,kind:'image'};current=(await put(d,current.revision)).body;assert.deepEqual(current.doc.nodes[0].desktop,original.desktop);assert.deepEqual(current.doc.nodes[0].decoration,original.decoration);assert.deepEqual(current.doc.edges,originalEdges);
 record=(await postRecord({kind:'message',title:'自动测试 · 线索墙共享图片',content:'本地检查',tags:['QA'],date:'2026-11-01',data:{files:[asset]}})).body.record;
 record=(await postRecord({...record,deleted:true})).body.record;assert.equal((await request('/api/records?id='+record.id,{method:'DELETE'})).status,200);record=null;
 assert.equal((await fetch(base+asset.url,{headers})).status,200,'archive delete must retain image still used by wall');
 const spoofed=structuredClone(d);spoofed.nodes[0].file.id='00000000-0000-4000-8000-000000000001';spoofed.nodes[0].src='/api/assets/'+spoofed.nodes[0].file.id;spoofed.nodes[0].file.url=spoofed.nodes[0].src;assert.equal((await put(spoofed,current.revision)).status,400);
 const empty={...createDefaultWall(),nodes:[],edges:[]};const emptySaved=await put(empty,current.revision);assert.equal(emptySaved.status,200);current=emptySaved.body;assert.equal(current.doc.nodes.length,0);
 console.log('PASS: private access, version conflicts, layout round-trip, independent mobile layout, replacement preserving geometry/decorations/wires, unsafe references rejected, shared asset retention, empty-wall persistence.');
}finally{
 const latest=(await request('/api/wall')).body;assert.equal((await put(before.doc||createDefaultWall(),latest.revision)).status,200);
 if(asset){let cleanup=(await postRecord({kind:'message',title:'自动测试 · 清理附件',content:'本地检查',tags:['QA'],date:'2026-11-01',data:{files:[asset]}})).body.record;cleanup=(await postRecord({...cleanup,deleted:true})).body.record;await request('/api/records?id='+cleanup.id,{method:'DELETE'});assert.equal((await fetch(base+asset.url,{headers})).status,404);}
}
