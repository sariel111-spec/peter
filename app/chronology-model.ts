import type {Entry} from './archive';
export type Placement={id:string;parentId:string|null;order:number};
export type CastPerson={id:string;name:string;role:string;note:string;avatar:string;tone:string;x:number;y:number};
export type CastLink={id:string;from:string;to:string;label:string;note:string;tone:string;line:'solid'|'dashed';arrow:'none'|'forward'|'both'};
export type Cast={people:CastPerson[];links:CastLink[]};
export type DuoFact={k:string;v:string};
export type DuoSide={name:string;calls:string;age:string;height:string;birthday:string;type:string;motif:string;animal:string;likes:string;dislikes:string;view:string;portrait:string;anchors:string[];extras:DuoFact[]};
export type DuoScale={label:string;value:number};
export type DuoDay={label:string;date:string};
export type Duo={left:DuoSide;right:DuoSide;photo:string;tags:string;stages:string[];stage:number;ending:''|'HE'|'BE'|'OE';since:string;song:string;world:string;roles:string[];roleOptions:string[];scales:DuoScale[];motto:string;sub:string;quotes:string[];days:DuoDay[]};
export const emptyDuoSide=():DuoSide=>({name:'',calls:'',age:'',height:'',birthday:'',type:'',motif:'',animal:'',likes:'',dislikes:'',view:'',portrait:'',anchors:[],extras:[]});
export const defaultRoleOptions=['一见钟情','日久生情','双向暗恋','青梅竹马','欢喜冤家','同班同学','秘密恋人','互相救赎','势均力敌','年上','年下','他先动心','我先动心'];
export const emptyDuo=():Duo=>({left:{...emptyDuoSide(),name:'彼得·帕克'},right:emptyDuoSide(),photo:'',tags:'',stages:['陌生','相识','暧昧','热恋','相守'],stage:0,ending:'',since:'',song:'',world:'',roles:[],roleOptions:[...defaultRoleOptions],scales:[{label:'谁先心动',value:50},{label:'谁更黏人',value:50},{label:'谁更嘴硬',value:50},{label:'谁先道歉',value:50}],motto:'',sub:'',quotes:[],days:[]});
export type Chronology={version:1;story:Placement[];message:string[];cast?:Cast;duo?:Duo};
export const emptyCast=():Cast=>({people:[],links:[]});
const castText=(v:unknown,max:number,what:string)=>{if(typeof v!=='string'||v.length>max)throw Error(what+'太长或格式不正确');return v};
const castId=(v:unknown)=>{if(typeof v!=='string'||!v||v.length>80)throw Error('人物关系图的编号不正确');return v};
const castTone=(v:unknown)=>typeof v==='string'&&/^#[0-9a-fA-F]{6}$/.test(v)?v:'#a72f3b';
const castAvatar=(v:unknown)=>{if(v===''||v==null)return '';if(typeof v!=='string'||v.length>90000||!/^(data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+|\/api\/assets\/[\w-]+|\/images\/[\w.-]+|\/wall\/[\w.-]+)$/.test(v))throw Error('人物头像格式不正确');return v};
// The cast map lives beside the timeline so one save, one backup and one undo path cover both.
export function validateCast(raw:unknown):Cast{
 const c=raw as Cast;if(!c||!Array.isArray(c.people)||!Array.isArray(c.links)||c.people.length>120||c.links.length>400)throw Error('人物关系图格式不正确');
 const ids=new Set<string>();const people=c.people.map(p=>{if(!p||typeof p!=='object')throw Error('人物信息不正确');const id=castId(p.id);if(ids.has(id))throw Error('人物编号重复');ids.add(id);if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>20000||Math.abs(p.y)>20000)throw Error('人物位置不正确');return {id,name:castText(p.name,60,'人物名字'),role:castText(p.role??'',80,'人物身份'),note:castText(p.note??'',6000,'人物详情'),avatar:castAvatar(p.avatar),tone:castTone(p.tone),x:Math.round(p.x),y:Math.round(p.y)}});
 const linkIds=new Set<string>();const links=c.links.map(l=>{if(!l||typeof l!=='object')throw Error('关系信息不正确');const id=castId(l.id);if(linkIds.has(id))throw Error('关系编号重复');linkIds.add(id);if(!ids.has(l.from)||!ids.has(l.to)||l.from===l.to)throw Error('关系连接的人物不存在');return {id,from:l.from,to:l.to,label:castText(l.label??'',40,'关系名称'),note:castText(l.note??'',3000,'关系详情'),tone:castTone(l.tone),line:l.line==='dashed'?'dashed' as const:'solid' as const,arrow:l.arrow==='forward'||l.arrow==='both'?l.arrow:'none' as const}});
 return {people,links};
}
const duoPortrait=(v:unknown)=>{if(v===''||v==null)return '';if(typeof v!=='string'||v.length>200000||!/^(data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+|\/api\/assets\/[\w-]+|\/images\/[\w.-]+)$/.test(v))throw Error('设定照片格式不正确');return v};
const duoList=<T,>(v:unknown,max:number,each:(x:unknown)=>T):T[]=>{if(v===undefined||v===null)return [];if(!Array.isArray(v)||v.length>max)throw Error('设定里的条目太多或格式不正确');return v.map(each)};
function validateDuoSide(raw:unknown):DuoSide{const d=raw as DuoSide;if(!d||typeof d!=='object')throw Error('双人设定格式不正确');const t=(v:unknown,max:number)=>castText(v??'',max,'设定内容');return {name:t(d.name,60),calls:t(d.calls,60),age:t(d.age,40),height:t(d.height,40),birthday:t(d.birthday,40),type:t(d.type,40),motif:t(d.motif,60),animal:t(d.animal,60),likes:t(d.likes,400),dislikes:t(d.dislikes,400),view:t(d.view,400),portrait:duoPortrait(d.portrait),anchors:duoList(d.anchors,16,x=>t(x,24)),extras:duoList(d.extras,12,x=>{const f=x as DuoFact;if(!f||typeof f!=='object')throw Error('设定条目格式不正确');return {k:t(f.k,16),v:t(f.v,120)}})}}
export function validateDuo(raw:unknown):Duo{const d=raw as Duo;if(!d||typeof d!=='object'||!Array.isArray(d.stages)||d.stages.length<2||d.stages.length>8)throw Error('双人设定格式不正确');const t=(v:unknown,max:number,what='设定内容')=>castText(v??'',max,what);const stages=d.stages.map(x=>t(x,12,'关系阶段'));
 return {left:validateDuoSide(d.left),right:validateDuoSide(d.right),photo:duoPortrait(d.photo),tags:t(d.tags,300,'标签'),stages,stage:Number.isInteger(d.stage)?Math.max(0,Math.min(stages.length-1,d.stage)):0,ending:d.ending==='HE'||d.ending==='BE'||d.ending==='OE'?d.ending:'',since:t(d.since,40,'纪念日'),song:t(d.song,120,'主题曲'),world:t(d.world,600,'世界观'),
  roles:duoList(d.roles,30,x=>t(x,16,'关系定位')),roleOptions:d.roleOptions===undefined?[...defaultRoleOptions]:duoList(d.roleOptions,40,x=>t(x,16,'关系定位')),
  scales:d.scales===undefined?emptyDuo().scales:duoList(d.scales,14,x=>{const c=x as DuoScale;if(!c||typeof c!=='object')throw Error('设定条目格式不正确');return {label:t(c.label,20),value:Number.isFinite(c.value)?Math.max(0,Math.min(100,Math.round(c.value))):50}}),
  motto:t(d.motto,60),sub:t(d.sub,120),quotes:duoList(d.quotes,60,x=>t(x,200,'语录')),days:duoList(d.days,30,x=>{const c=x as DuoDay;if(!c||typeof c!=='object')throw Error('设定条目格式不正确');return {label:t(c.label,30),date:t(c.date,40)}})}}
// "2012-07-03", "2012.7.3" or "2012年7月3日" → a local date; anything else stays plain text.
export function parseDay(text:string):Date|null{const m=text.trim().match(/^(\d{4})[-./年](\d{1,2})[-./月](\d{1,2})日?$/);if(!m)return null;const d=new Date(+m[1],+m[2]-1,+m[3]);return d.getMonth()===+m[2]-1&&d.getDate()===+m[3]?d:null}
export function daysTogether(since:string,now=new Date()):number|null{const d=parseDay(since);if(!d)return null;const n=Math.floor((new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime()-d.getTime())/864e5)+1;return n>0?n:null}
// Days until the next yearly return of a date (0 = today), plus which anniversary that will be.
export function nextReturn(date:string,now=new Date()):{inDays:number;years:number}|null{const d=parseDay(date);if(!d)return null;const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());let next=new Date(today.getFullYear(),d.getMonth(),d.getDate());if(next<today)next=new Date(today.getFullYear()+1,d.getMonth(),d.getDate());return {inDays:Math.round((next.getTime()-today.getTime())/864e5),years:next.getFullYear()-d.getFullYear()}}
export function removePerson(cast:Cast,id:string):Cast{return {people:cast.people.filter(p=>p.id!==id),links:cast.links.filter(l=>l.from!==id&&l.to!==id)}}
// Importing the same backup twice must not double the cast: people match on name + role, links on their two ends + label.
export function mergeCast(current:Cast|undefined,incoming:Cast|undefined,stamp:string):Cast|undefined{if(!incoming||!incoming.people.length)return current;if(!current||!current.people.length)return incoming;
 const sign=(p:CastPerson)=>p.name.trim()+'\u0001'+p.role.trim(),known=new Map(current.people.filter(p=>p.name.trim()).map(p=>[sign(p),p.id])),ids=new Map<string,string>(),people=[...current.people];
 for(const p of incoming.people){const match=p.name.trim()?known.get(sign(p)):undefined;if(match){ids.set(p.id,match);continue}const id=(stamp+'-'+p.id).slice(0,80);ids.set(p.id,id);people.push({...p,id,x:p.x+40,y:p.y+40})}
 const pair=(l:{from:string;to:string;label:string})=>[l.from,l.to].sort().join('\u0001')+'\u0001'+l.label.trim(),seen=new Set(current.links.map(pair)),links=[...current.links];
 for(const l of incoming.links){const from=ids.get(l.from),to=ids.get(l.to);if(!from||!to||from===to)continue;const next={...l,id:(stamp+'-'+l.id).slice(0,80),from,to};if(seen.has(pair(next)))continue;seen.add(pair(next));links.push(next)}
 return {people,links}}
// Two records are "the same" for import when a reader could not tell them apart.
export const recordSignature=(r:{kind:string;title:string;content:string;date?:string;deleted?:boolean})=>[r.kind,r.title.trim(),r.content.trim(),r.date||'',r.deleted?'1':'0'].join('\u0001');
export const emptyChronology=():Chronology=>({version:1,story:[],message:[]});
export function validateChronology(raw:unknown):Chronology{
 const d=raw as Chronology;if(!d||d.version!==1||!Array.isArray(d.story)||!Array.isArray(d.message)||d.story.length>5000||d.message.length>5000||JSON.stringify(d).length>1800000)throw Error('时间目录格式不正确');
 const ids=new Set<string>();for(const p of d.story){if(!p||typeof p.id!=='string'||!p.id||p.id.length>180||ids.has(p.id)||(p.parentId!==null&&(typeof p.parentId!=='string'||!p.parentId||p.parentId.length>180))||!Number.isFinite(p.order)||Math.abs(p.order)>1e9)throw Error('时间点信息不正确');ids.add(p.id)}
 const map=new Map(d.story.map(p=>[p.id,p]));for(const p of d.story){let current:Placement|undefined=p;const seen=new Set<string>();while(current){if(seen.has(current.id))throw Error('不能把时间点移到它自己的子点下');if(seen.size>=64)throw Error('时间细分最多支持 64 层');seen.add(current.id);current=current.parentId?map.get(current.parentId):undefined}}
 const messages=new Set<string>();for(const id of d.message){if(typeof id!=='string'||!id||id.length>180||messages.has(id))throw Error('传讯排序格式不正确');messages.add(id)}
 const cast=d.cast===undefined||d.cast===null?undefined:validateCast(d.cast);
 const duo=d.duo===undefined||d.duo===null?undefined:validateDuo(d.duo);
 return {version:1,story:d.story.map(p=>({id:p.id,parentId:p.parentId,order:p.order})),message:[...d.message],...(cast?{cast}:{}),...(duo?{duo}:{})};
}
// Keep placements for recycled records, so restoring a parent restores its branch.
export function projectStory(all:Entry[],doc:Chronology):Placement[]{
 const stories=all.filter(e=>e.kind==='story'),live=stories.filter(e=>!e.deleted),liveIds=new Set(live.map(e=>e.id));const map=new Map(doc.story.map(p=>[p.id,p]));
 const ordered=[...stories].sort((a,b)=>a.date.localeCompare(b.date)||a.updated.localeCompare(b.updated)||a.id.localeCompare(b.id));ordered.forEach((e,i)=>{if(!map.has(e.id))map.set(e.id,{id:e.id,parentId:typeof e.data.parentId==='string'?e.data.parentId:null,order:typeof e.data.order==='number'?e.data.order:i})});
 const projected=live.map(e=>{const p=map.get(e.id)!;let parent=p.parentId;const seen=new Set([e.id]);while(parent){if(seen.has(parent)){parent=null;break}seen.add(parent);if(liveIds.has(parent))break;parent=map.get(parent)?.parentId||null}return {...p,parentId:parent}});
 const effective=new Map(projected.map(p=>[p.id,p]));for(const point of projected){const seen=new Set<string>();let current:Placement|undefined=point;while(current){if(seen.has(current.id)||seen.size>=64){point.parentId=null;break}seen.add(current.id);current=current.parentId?effective.get(current.parentId):undefined}}return projected;
}
export function childrenOf(points:Placement[],parentId:string|null){return points.filter(p=>p.parentId===parentId).sort((a,b)=>a.order-b.order||a.id.localeCompare(b.id));}
export function descendants(points:Placement[],id:string){const result=new Set<string>();let frontier=[id];while(frontier.length){const next=points.filter(p=>p.parentId&&frontier.includes(p.parentId)&&!result.has(p.id)).map(p=>p.id);next.forEach(x=>result.add(x));frontier=next}return result;}
export function ancestry(points:Placement[],id:string){const chain:string[]=[];let p=points.find(p=>p.id===id);const seen=new Set<string>();while(p&&!seen.has(p.id)){seen.add(p.id);chain.unshift(p.id);p=points.find(x=>x.id===p!.parentId)}return chain;}
export function moveStory(doc:Chronology,points:Placement[],id:string,targetId:string|null,position:'before'|'after'|'inside'):Chronology{
 const source=points.find(p=>p.id===id),target=points.find(p=>p.id===targetId);if(!source)throw Error('找不到这个时间点');if(id===targetId||targetId&&descendants(points,id).has(targetId))throw Error('不能移动到自己或自己的子点下');
 const parentId=position==='inside'?targetId:target?.parentId??null;if(parentId&&!points.some(p=>p.id===parentId))throw Error('上级时间点不存在');
 const siblings=childrenOf(points,parentId).filter(p=>p.id!==id),index=position==='inside'?siblings.length:siblings.findIndex(p=>p.id===targetId)+(position==='after'?1:0);siblings.splice(Math.max(0,index),0,{...source,parentId});const changed=new Map(siblings.map((p,i)=>[p.id,{...p,order:i}]));const merged=new Map(doc.story.map(p=>[p.id,p]));for(const p of points)merged.set(p.id,changed.get(p.id)||p);return validateChronology({...doc,story:[...merged.values()]});
}
export function orderedMessages(all:Entry[],doc:Chronology){const ranks=new Map(doc.message.map((id,i)=>[id,i]));return all.filter(e=>e.kind==='message'&&!e.deleted).sort((a,b)=>(ranks.get(a.id)??1e8)-(ranks.get(b.id)??1e8)||a.date.localeCompare(b.date)||a.id.localeCompare(b.id));}
export function moveMessage(doc:Chronology,all:Entry[],id:string,target:string,after=false):Chronology{const order=orderedMessages(all,doc).map(e=>e.id).filter(x=>x!==id),i=order.indexOf(target);if(i<0||id===target)return doc;order.splice(i+(after?1:0),0,id);return {...doc,message:order};}

export function remapChronology(records:Entry[],doc:Chronology,map:Map<string,Entry>):Chronology{
 const oldIds=new Set(records.filter(r=>r.kind==='story').map(r=>r.id));const placements=new Map<string,Placement>(records.filter(r=>r.kind==='story').map((r,i)=>[r.id,{id:r.id,parentId:typeof r.data.parentId==='string'&&oldIds.has(r.data.parentId)?r.data.parentId:null,order:i}]));for(const p of doc.story)if(oldIds.has(p.id))placements.set(p.id,p);
 return validateChronology({version:1,story:[...placements.values()].map(p=>{const record=map.get(p.id);if(!record)throw Error('备份缺少对应的故事记录');return {id:record.id,parentId:p.parentId&&map.get(p.parentId)?.kind==='story'?map.get(p.parentId)!.id:null,order:p.order}}),message:doc.message.map(id=>map.get(id)?.kind==='message'?map.get(id)!.id:null).filter((id):id is string=>!!id),cast:doc.cast,duo:doc.duo});
}
