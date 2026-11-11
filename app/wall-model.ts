export type WallLayout='desktop'|'mobile';
export type Geometry={x:number;y:number;w:number;h:number;r:number};
export type WallAsset={id:string;name:string;type:string;size:number;url:string};
export type WallNode={id:string;title:string;src:string;file?:WallAsset;kind:'image'|'note'|'profile';style:'print'|'photo';fit:'contain'|'cover'|'fill';focus:[number,number];imageZoom:number;natural?:[number,number];text:string;noteColor:string;decoration:{type:'pin'|'clip'|'tape'|'none';color:string;anchor:[number,number]};desktop:Geometry;mobile:Geometry;layer:number;locked:boolean;hidden:boolean;keepRatio:boolean};
export type WallEdge={id:string;from:string;to:string;color:string;width:number};
export type WallDoc={version:1;nodes:WallNode[];edges:WallEdge[];background:'cork'|'paper'|'slate';frame:'wood'|'dark'|'navy';desktopAspect:number;mobileAspect:number};
export type WallResponse={doc:WallDoc|null;revision:number;updated:string|null;scope:string};
export const cloneWall=(d:WallDoc):WallDoc=>structuredClone(d);
export const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
export const uid=()=>crypto.randomUUID();
export const wallImages=(d:WallDoc)=>d.nodes.filter(n=>n.kind!=='note'&&!n.hidden).map(n=>({url:n.src,title:n.title}));
export const wallAssets=(d:WallDoc)=>d.nodes.flatMap(n=>n.file?[n.file]:[]).filter((f,i,a)=>a.findIndex(v=>v.id===f.id)===i);
export function anchorPoint(n:WallNode,mode:WallLayout,aspect:number):[number,number]{
 const g=n[mode],a=n.decoration.anchor,t=g.r*Math.PI/180;
 const dx=(a[0]-.5)*g.w*aspect,dy=(a[1]-.5)*g.h;
 return [(g.x+g.w/2)+(dx*Math.cos(t)-dy*Math.sin(t))/aspect,(g.y+g.h/2)+dx*Math.sin(t)+dy*Math.cos(t)];
}
export function localAnchor(g:Geometry,x:number,y:number,aspect:number):[number,number]{
 const t=-g.r*Math.PI/180,dx=(x-g.x-g.w/2)*aspect,dy=y-g.y-g.h/2;
 return [clamp((dx*Math.cos(t)-dy*Math.sin(t))/(g.w*aspect)+.5,0,1),clamp((dx*Math.sin(t)+dy*Math.cos(t))/g.h+.5,0,1)];
}
export function resizeGeometry(g:Geometry,corner:string,dx:number,dy:number,boardW:number,boardH:number,keepRatio=false):Geometry{
 const t=g.r*Math.PI/180,c=Math.cos(t),s=Math.sin(t);let lx=dx*c+dy*s,ly=-dx*s+dy*c;
 const sx=corner.includes('e')?1:-1,sy=corner.includes('s')?1:-1;
 const oldW=g.w*boardW/100,oldH=g.h*boardH/100;
 let w=clamp(oldW+sx*lx,boardW*.025,boardW),h=clamp(oldH+sy*ly,boardH*.025,boardH);
 if(keepRatio){const ratio=oldW/oldH;if(Math.abs(lx)/oldW>=Math.abs(ly)/oldH)h=w/ratio;else w=h*ratio;const scale=Math.min(1,boardW/w,boardH/h);w*=scale;h*=scale;}
 lx=sx*(w-oldW)/2;ly=sy*(h-oldH)/2;
 const cx=(g.x+g.w/2)*boardW/100+lx*c-ly*s,cy=(g.y+g.h/2)*boardH/100+lx*s+ly*c;
 return {...g,x:clamp((cx-w/2)/boardW*100,-50,150),y:clamp((cy-h/2)/boardH*100,-50,150),w:w/boardW*100,h:h/boardH*100};
}
export function deleteNodes(d:WallDoc,ids:string[]):WallDoc{const set=new Set(ids);return {...d,nodes:d.nodes.filter(n=>!set.has(n.id)),edges:d.edges.filter(e=>!set.has(e.from)&&!set.has(e.to))};}
export function duplicateNodes(d:WallDoc,ids:string[]):{doc:WallDoc;ids:string[]}{
 const map=new Map(ids.map(id=>[id,uid()]));let layer=Math.max(0,...d.nodes.map(n=>n.layer));
 const added=d.nodes.filter(n=>map.has(n.id)).map(n=>({...structuredClone(n),id:map.get(n.id)!,title:n.title+' · 副本',layer:++layer,locked:false,desktop:{...n.desktop,x:clamp(n.desktop.x+3,0,100-n.desktop.w),y:clamp(n.desktop.y+3,0,100-n.desktop.h)},mobile:{...n.mobile,x:clamp(n.mobile.x+3,0,100-n.mobile.w),y:clamp(n.mobile.y+3,0,100-n.mobile.h)}}));
 const edges=d.edges.filter(e=>map.has(e.from)&&map.has(e.to)).map(e=>({...e,id:uid(),from:map.get(e.from)!,to:map.get(e.to)!}));
 return {doc:{...d,nodes:[...d.nodes,...added],edges:[...d.edges,...edges]},ids:added.map(n=>n.id)};
}
export function reorderNode(d:WallDoc,id:string,top:boolean):WallDoc{const sorted=[...d.nodes].sort((a,b)=>a.layer-b.layer),item=sorted.find(n=>n.id===id);if(!item)return d;const rest=sorted.filter(n=>n.id!==id);const order=top?[...rest,item]:[item,...rest];return {...d,nodes:order.map((n,i)=>({...n,layer:i+1}))};}
export function alignNodes(d:WallDoc,ids:string[],mode:WallLayout,align:string):WallDoc{
 const selected=d.nodes.filter(n=>ids.includes(n.id)&&!n.locked);if(selected.length<2)return d;
 const left=Math.min(...selected.map(n=>n[mode].x)),right=Math.max(...selected.map(n=>n[mode].x+n[mode].w)),top=Math.min(...selected.map(n=>n[mode].y)),bottom=Math.max(...selected.map(n=>n[mode].y+n[mode].h));
 return {...d,nodes:d.nodes.map(n=>{if(!selected.includes(n))return n;const g={...n[mode]};if(align==='left')g.x=left;if(align==='center')g.x=(left+right-g.w)/2;if(align==='right')g.x=right-g.w;if(align==='top')g.y=top;if(align==='middle')g.y=(top+bottom-g.h)/2;if(align==='bottom')g.y=bottom-g.h;return {...n,[mode]:g}})};
}
const hex=/^#[0-9a-fA-F]{6}$/;
export function validateWall(raw:unknown):WallDoc{
 const fail=():never=>{throw new Error('线索墙文件格式不正确，或超过 200 个素材 / 500 条连线上限。')};
 if(!raw||typeof raw!=='object')return fail();const d=raw as WallDoc;
 if(d.version!==1||!Array.isArray(d.nodes)||d.nodes.length>200||!Array.isArray(d.edges)||d.edges.length>500||!['cork','paper','slate'].includes(d.background)||!['wood','dark','navy'].includes(d.frame))return fail();
 if(![d.desktopAspect,d.mobileAspect].every(v=>Number.isFinite(v)&&v>=.4&&v<=2.4))return fail();
 const idset=new Set<string>();
 for(const n of d.nodes){
  if(!n||typeof n.id!=='string'||!n.id||n.id.length>100||idset.has(n.id))return fail();idset.add(n.id);
  if(typeof n.title!=='string'||n.title.length>180||typeof n.text!=='string'||n.text.length>5000||!['image','note','profile'].includes(n.kind)||!['print','photo'].includes(n.style)||!['contain','cover','fill'].includes(n.fit)||!hex.test(n.noteColor))return fail();
  if(typeof n.src!=='string'||(n.kind!=='note'&&!/^\/(?:images|wall)\/[a-zA-Z0-9_.-]+\.(?:jpg|jpeg|png|webp|avif|gif)$|^\/api\/assets\/[0-9a-f-]{36}$/.test(n.src)))return fail();
  for(const g of [n.desktop,n.mobile])if(!g||![g.x,g.y,g.w,g.h,g.r].every(Number.isFinite)||g.x< -50||g.x>150||g.y< -50||g.y>150||g.w<1||g.w>100||g.h<1||g.h>100||g.r< -360||g.r>360)return fail();
  if(!n.decoration||!['pin','clip','tape','none'].includes(n.decoration.type)||!hex.test(n.decoration.color)||!Array.isArray(n.decoration.anchor)||n.decoration.anchor.length!==2||!n.decoration.anchor.every(v=>Number.isFinite(v)&&v>=0&&v<=1))return fail();
  if(!Array.isArray(n.focus)||n.focus.length!==2||!n.focus.every(v=>Number.isFinite(v)&&v>=0&&v<=100)||!Number.isFinite(n.imageZoom)||n.imageZoom<.5||n.imageZoom>3||!Number.isInteger(n.layer)||n.layer<0||n.layer>10000||![n.locked,n.hidden,n.keepRatio].every(v=>typeof v==='boolean'))return fail();
  if(n.natural&&(!Array.isArray(n.natural)||n.natural.length!==2||!n.natural.every(v=>Number.isFinite(v)&&v>0&&v<1000000)))return fail();
  if(n.file&&(!/^[0-9a-f-]{36}$/.test(n.file.id)||n.file.url!==`/api/assets/${n.file.id}`||n.src!==n.file.url||typeof n.file.name!=='string'||typeof n.file.type!=='string'||!n.file.type.startsWith('image/')||!Number.isFinite(n.file.size)))return fail();
  if(n.src.startsWith('/api/assets/')&&!n.file)return fail();
 }
 const edges=new Set<string>();for(const e of d.edges){if(!e||typeof e.id!=='string'||!e.id||e.id.length>100||edges.has(e.id)||!idset.has(e.from)||!idset.has(e.to)||e.from===e.to||!hex.test(e.color)||!Number.isFinite(e.width)||e.width<.5||e.width>5)return fail();edges.add(e.id);}
 if(JSON.stringify(d).length>600000)return fail();return structuredClone(d);
}

/** Move one row in the top-to-bottom layer list, without changing any layout. */
export function moveWallLayer(d:WallDoc,id:string,targetId:string,placement:'before'|'after'):WallDoc{
 if(id===targetId)return d;const order=[...d.nodes].sort((a,b)=>b.layer-a.layer),item=order.find(n=>n.id===id);if(!item||!order.some(n=>n.id===targetId))return d;
 const rest=order.filter(n=>n.id!==id),at=rest.findIndex(n=>n.id===targetId);rest.splice(at+(placement==='after'?1:0),0,item);
 const ranks=new Map(rest.map((n,i)=>[n.id,rest.length-i]));return {...d,nodes:d.nodes.map(n=>({...n,layer:ranks.get(n.id)!}))};
}
