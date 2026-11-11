'use client';
import {useCallback,useEffect,useMemo,useRef,useState,type PointerEvent as ReactPointerEvent} from 'react';
import {Plus,Trash2,Maximize2,ZoomIn,ZoomOut,Undo2,Redo2,ArrowLeftRight,ImagePlus,X,Spline,Scan,ChevronRight,Users} from 'lucide-react';
import {emptyCast,removePerson,validateCast,type Cast,type CastLink,type CastPerson,type Chronology} from './chronology-model';
import {createPortal} from 'react-dom';
import './cast-map.css';

type Props={doc:Chronology;busy:boolean;ready:boolean;onSave:(d:Chronology)=>Promise<Chronology>;notify:(s:string)=>void};
type Pick={type:'person'|'link';id:string}|null;
type View={x:number;y:number;k:number};
const tones=['#a72f3b','#23374c','#b0763a','#5f7a63','#6c5a86','#8a8577'];
const CARD_W=112,CARD_H=150;
const uid=(prefix:string)=>prefix+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const tilt=(id:string)=>{let h=0;for(const c of id)h=(h*31+c.charCodeAt(0))%997;return (h%50)/10-2.5};
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));

// Trim a thread to the edge of a card so arrowheads and knots sit outside the photo.
function edgePoint(cx:number,cy:number,tx:number,ty:number){
 const dx=tx-cx,dy=ty-cy;if(!dx&&!dy)return {x:cx,y:cy};
 const s=Math.min((CARD_W/2+6)/Math.abs(dx||1e-6),(CARD_H/2+6)/Math.abs(dy||1e-6));
 return {x:cx+dx*Math.min(s,1),y:cy+dy*Math.min(s,1)};
}
function threadGeometry(a:CastPerson,b:CastPerson,bend:number){
 const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
 const cx=mx+nx*bend,cy=my+ny*bend+Math.min(26,len*.06);
 const s=edgePoint(a.x,a.y,cx,cy),e=edgePoint(b.x,b.y,cx,cy);
 const lx=.25*s.x+.5*cx+.25*e.x,ly=.25*s.y+.5*cy+.25*e.y;
 return {d:`M${s.x} ${s.y}Q${cx} ${cy} ${e.x} ${e.y}`,s,e,cx,cy,lx,ly};
}
function arrowHead(tip:{x:number;y:number},fromX:number,fromY:number){
 const a=Math.atan2(tip.y-fromY,tip.x-fromX),l=11,w=.42;
 return `M${tip.x} ${tip.y}L${tip.x-l*Math.cos(a-w)} ${tip.y-l*Math.sin(a-w)}M${tip.x} ${tip.y}L${tip.x-l*Math.cos(a+w)} ${tip.y-l*Math.sin(a+w)}`;
}
async function portrait(file:File){
 if(!file.type.startsWith('image/'))throw Error('请选择一张图片作为头像');
 const bitmap=await createImageBitmap(file),side=Math.min(bitmap.width,bitmap.height),canvas=document.createElement('canvas');
 canvas.width=canvas.height=240;const ctx=canvas.getContext('2d');if(!ctx)throw Error('浏览器暂时无法处理这张图片');
 ctx.drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,240,240);bitmap.close?.();
 let quality=.84,url=canvas.toDataURL('image/jpeg',quality);while(url.length>80000&&quality>.4){quality-=.1;url=canvas.toDataURL('image/jpeg',quality)}
 return url;
}

export default function CastMap(p:Props){
 const [cast,setCastState]=useState<Cast>(()=>p.doc.cast||emptyCast());
 const [pick,setPick]=useState<Pick>(null),[view,setView]=useState<View>({x:0,y:0,k:1}),[detail,setDetail]=useState(false),[armed,setArmed]=useState(''),[saveState,setSaveState]=useState<'saved'|'dirty'|'saving'|'failed'>('saved');
 const [undo,setUndo]=useState<Cast[]>([]),[redo,setRedo]=useState<Cast[]>([]),[thread,setThread]=useState<{from:string;x:number;y:number;over:string}|null>(null),[dragging,setDragging]=useState('');
 const castRef=useRef(cast),docRef=useRef(p.doc),dirty=useRef(false),saving=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|null>(null),busyRef=useRef(p.busy),readyRef=useRef(p.ready);
 const stage=useRef<HTMLDivElement>(null),viewRef=useRef(view),fitted=useRef(false),fileRef=useRef<HTMLInputElement>(null),nameRef=useRef<HTMLInputElement>(null);
 const gesture=useRef<{kind:'pan'|'node'|'thread';id:string;sx:number;sy:number;ox:number;oy:number;moved:boolean;before:Cast}|null>(null);
 docRef.current=p.doc;busyRef.current=p.busy;readyRef.current=p.ready;viewRef.current=view;castRef.current=cast;

 useEffect(()=>{if(!dirty.current&&!saving.current)setCastState(p.doc.cast||emptyCast())},[p.doc]);

 const flush=useCallback(async()=>{
  if(!dirty.current||saving.current)return;
  if(busyRef.current||!readyRef.current){timer.current=setTimeout(flush,500);return}
  saving.current=true;setSaveState('saving');const snapshot=castRef.current;
  try{await p.onSave({...docRef.current,cast:validateCast(snapshot)});if(castRef.current===snapshot){dirty.current=false;setSaveState('saved')}else setSaveState('dirty')}
  catch{setSaveState('failed')}
  finally{saving.current=false;if(dirty.current&&castRef.current!==snapshot){if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(flush,500)}}
 },[p.onSave]);
 const schedule=useCallback((delay=650)=>{dirty.current=true;setSaveState('dirty');if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(flush,delay)},[flush]);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);if(dirty.current)flush()},[flush]);
 useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(dirty.current){flush();e.preventDefault()}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[flush]);

 // `record` false keeps one undo step for a whole drag or a run of typing.
 const apply=useCallback((next:Cast,record=true,before?:Cast)=>{if(record){setUndo(a=>[...a.slice(-49),before||castRef.current]);setRedo([])}castRef.current=next;setCastState(next);schedule()},[schedule]);
 const typing=useRef<{key:string;at:number}>({key:'',at:0});
 const edit=(key:string,next:Cast)=>{const now=Date.now(),fresh=typing.current.key!==key||now-typing.current.at>1500;typing.current={key,at:now};apply(next,fresh)};
 const stepBack=()=>{const prev=undo.at(-1);if(!prev)return;setUndo(a=>a.slice(0,-1));setRedo(a=>[...a,castRef.current]);castRef.current=prev;setCastState(prev);schedule();setPick(null)};
 const stepForward=()=>{const next=redo.at(-1);if(!next)return;setRedo(a=>a.slice(0,-1));setUndo(a=>[...a,castRef.current]);castRef.current=next;setCastState(next);schedule();setPick(null)};

 const people=useMemo(()=>new Map(cast.people.map(x=>[x.id,x])),[cast.people]);
 const person=pick?.type==='person'?people.get(pick.id):undefined,link=pick?.type==='link'?cast.links.find(l=>l.id===pick.id):undefined;
 const related=useMemo(()=>{if(!person)return null;const ids=new Set([person.id]);for(const l of cast.links){if(l.from===person.id)ids.add(l.to);if(l.to===person.id)ids.add(l.from)}return ids},[person,cast.links]);
 useEffect(()=>{if(pick&&!person&&!link){setPick(null);setDetail(false)}},[pick,person,link]);
 useEffect(()=>{setArmed('')},[pick]);
 // On a phone the sheet covers the lower half, so slide the picked card into the part still visible.
 const pickedId=pick?.type==='person'?pick.id:'';
 useEffect(()=>{if(!pickedId||!matchMedia('(max-width:900px)').matches)return;const el=stage.current,who=castRef.current.people.find(x=>x.id===pickedId);if(!el||!who)return;const r=el.getBoundingClientRect();setView(v=>({...v,x:r.width/2-who.x*v.k,y:r.height*.2-who.y*v.k}))},[pickedId]);

 const toWorld=(cx:number,cy:number)=>{const r=stage.current!.getBoundingClientRect(),v=viewRef.current;return {x:(cx-r.left-v.x)/v.k,y:(cy-r.top-v.y)/v.k}};
 const fit=useCallback(()=>{const el=stage.current;if(!el)return;const r=el.getBoundingClientRect(),list=castRef.current.people;if(!list.length){setView({x:r.width/2,y:r.height/2,k:1});return}
  const xs=list.map(x=>x.x),ys=list.map(x=>x.y),minX=Math.min(...xs)-CARD_W,maxX=Math.max(...xs)+CARD_W,minY=Math.min(...ys)-CARD_H,maxY=Math.max(...ys)+CARD_H;
  const k=clamp(Math.min(r.width/(maxX-minX),r.height/(maxY-minY)),.35,1.15);setView({k,x:r.width/2-(minX+maxX)/2*k,y:r.height/2-(minY+maxY)/2*k})},[]);
 useEffect(()=>{if(fitted.current||!p.ready)return;fitted.current=true;requestAnimationFrame(fit)},[p.ready,fit]);
 const zoom=(factor:number,cx?:number,cy?:number)=>setView(v=>{const r=stage.current!.getBoundingClientRect(),px=(cx??r.left+r.width/2)-r.left,py=(cy??r.top+r.height/2)-r.top,k=clamp(v.k*factor,.3,2.2);return {k,x:px-(px-v.x)*(k/v.k),y:py-(py-v.y)*(k/v.k)}});
 useEffect(()=>{const el=stage.current;if(!el)return;const wheel=(e:WheelEvent)=>{e.preventDefault();if(e.ctrlKey||e.metaKey)zoom(Math.exp(-e.deltaY*.0045),e.clientX,e.clientY);else setView(v=>({...v,x:v.x-e.deltaX,y:v.y-e.deltaY}))};el.addEventListener('wheel',wheel,{passive:false});return()=>el.removeEventListener('wheel',wheel)},[]);

 const addPerson=(x?:number,y?:number)=>{
  if(cast.people.length>=120){p.notify('人物关系图最多放 120 个人物');return}
  const r=stage.current!.getBoundingClientRect(),v=viewRef.current,at=x===undefined?{x:(r.width/2-v.x)/v.k+(cast.people.length%5-2)*34,y:(r.height/2-v.y)/v.k+(cast.people.length%3-1)*30}:{x,y:y!};
  const made:CastPerson={id:uid('p'),name:'',role:'',note:'',avatar:'',tone:tones[cast.people.length%tones.length],x:Math.round(at.x),y:Math.round(at.y)};
  apply({...cast,people:[...cast.people,made]});setPick({type:'person',id:made.id});setTimeout(()=>nameRef.current?.focus(),60);
 };
 const starter=()=>{const a:CastPerson={id:uid('p'),name:'彼得·帕克',role:'',note:'',avatar:'',tone:tones[0],x:-150,y:0},b:CastPerson={id:uid('p'),name:'我',role:'',note:'',avatar:'',tone:tones[1],x:150,y:0};
  const next={people:[a,b],links:[{id:uid('l'),from:a.id,to:b.id,label:'',note:'',tone:tones[0],line:'solid' as const,arrow:'none' as const}]};apply(next);setPick({type:'person',id:b.id});requestAnimationFrame(fit)};
 const patchPerson=(id:string,patch:Partial<CastPerson>,key:string)=>edit(key+id,{...castRef.current,people:castRef.current.people.map(x=>x.id===id?{...x,...patch}:x)});
 const patchLink=(id:string,patch:Partial<CastLink>,key:string)=>edit(key+id,{...castRef.current,links:castRef.current.links.map(x=>x.id===id?{...x,...patch}:x)});
 const connect=(from:string,to:string)=>{if(from===to)return;if(cast.links.length>=400){p.notify('关系线最多 400 条');return}const made:CastLink={id:uid('l'),from,to,label:'',note:'',tone:people.get(from)?.tone||tones[0],line:'solid',arrow:'none'};apply({...cast,links:[...cast.links,made]});setPick({type:'link',id:made.id});setTimeout(()=>nameRef.current?.focus(),60)};
 const erase=()=>{if(!pick)return;if(armed!==pick.id){setArmed(pick.id);return}if(pick.type==='person')apply(removePerson(cast,pick.id));else apply({...cast,links:cast.links.filter(l=>l.id!==pick.id)});setPick(null);setDetail(false);p.notify(pick.type==='person'?'人物和相连的关系已移除，可以撤销':'这条关系已移除，可以撤销')};

 const down=(e:ReactPointerEvent,kind:'pan'|'node'|'thread',id='')=>{
  if(e.button!==0)return;if(kind!=='pan')e.stopPropagation();
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  const origin=kind==='node'?people.get(id)!:{x:view.x,y:view.y};
  gesture.current={kind,id,sx:e.clientX,sy:e.clientY,ox:origin.x,oy:origin.y,moved:false,before:castRef.current};
  if(kind==='thread'){const w=toWorld(e.clientX,e.clientY);setThread({from:id,x:w.x,y:w.y,over:''})}
 };
 const move=(e:ReactPointerEvent)=>{
  const g=gesture.current;if(!g)return;const dx=e.clientX-g.sx,dy=e.clientY-g.sy;if(!g.moved&&Math.hypot(dx,dy)<4)return;g.moved=true;
  if(g.kind==='pan')setView(v=>({...v,x:g.ox+dx,y:g.oy+dy}));
  else if(g.kind==='node'){const k=viewRef.current.k,next={...castRef.current,people:castRef.current.people.map(x=>x.id===g.id?{...x,x:Math.round(g.ox+dx/k),y:Math.round(g.oy+dy/k)}:x)};castRef.current=next;setCastState(next);setDragging(g.id)}
  else{const w=toWorld(e.clientX,e.clientY),over=document.elementsFromPoint(e.clientX,e.clientY).map(x=>(x as HTMLElement).closest<HTMLElement>('[data-cast-id]')?.dataset.castId).find(x=>x&&x!==g.id)||'';setThread({from:g.id,x:w.x,y:w.y,over})}
 };
 const up=(e:ReactPointerEvent)=>{
  const g=gesture.current;if(!g)return;gesture.current=null;try{(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)}catch{}
  if(g.kind==='pan'){if(!g.moved){setPick(null);setDetail(false)}}
  else if(g.kind==='node'){setDragging('');if(g.moved){setUndo(a=>[...a.slice(-49),g.before]);setRedo([]);schedule(300)}setPick({type:'person',id:g.id})}
  else{const target=thread?.over;setThread(null);if(target)connect(g.id,target);else if(g.moved)p.notify('把蛛丝拖到另一个人物上，就能连起关系')}
 };
 const cancel=()=>{const g=gesture.current;gesture.current=null;setThread(null);setDragging('');if(g?.kind==='node'&&g.moved){castRef.current=g.before;setCastState(g.before)}};

 const keys=(e:React.KeyboardEvent)=>{
  const field=(e.target as HTMLElement).closest('input,textarea,select');
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'&&!field){e.preventDefault();if(e.shiftKey)stepForward();else stepBack();return}
  if(field)return;
  if(e.key==='Escape'){if(detail)setDetail(false);else setPick(null)}
  if((e.key==='Delete'||e.key==='Backspace')&&pick){e.preventDefault();erase()}
  if(person&&e.key.startsWith('Arrow')){e.preventDefault();const s=e.shiftKey?24:6,dx=e.key==='ArrowLeft'?-s:e.key==='ArrowRight'?s:0,dy=e.key==='ArrowUp'?-s:e.key==='ArrowDown'?s:0;patchPerson(person.id,{x:person.x+dx,y:person.y+dy},'nudge')}
  if(e.key==='Enter'&&pick)setDetail(true);
 };
 const setAvatar=async(file?:File)=>{if(!file||!person)return;try{patchPerson(person.id,{avatar:await portrait(file)},'avatar'+Date.now())}catch(err){p.notify((err as Error).message)}};

 const pairs=new Map<string,number>();
 const threads=cast.links.map(l=>{const a=people.get(l.from),b=people.get(l.to);if(!a||!b)return null;const key=[l.from,l.to].sort().join('|'),n=pairs.get(key)||0;pairs.set(key,n+1);const flip=l.from<l.to?1:-1,bend=(n===0?0:Math.ceil(n/2)*46*(n%2?1:-1))*flip;return {l,g:threadGeometry(a,b,bend)}}).filter(Boolean) as {l:CastLink;g:ReturnType<typeof threadGeometry>}[];
 const threadFrom=thread?people.get(thread.from):undefined;
 const personLinks=person?cast.links.filter(l=>l.from===person.id||l.to===person.id):[];
 const status=saveState==='saving'||p.busy?'正在保存…':saveState==='dirty'?'有改动，稍后自动保存':saveState==='failed'?'保存没有成功':'已同步 · '+cast.people.length+' 位人物 · '+cast.links.length+' 条关系';

 const fields=(large:boolean)=>person?<>
  <div className="cast-portrait-row">
   <button type="button" className="cast-portrait" style={{'--tone':person.tone} as React.CSSProperties} onClick={()=>fileRef.current?.click()} aria-label="更换头像">{person.avatar?<img src={person.avatar} alt=""/>:<b>{(person.name||'?').slice(0,1)}</b>}<span><ImagePlus size={14}/>{person.avatar?'更换':'上传头像'}</span></button>
   <div><label>名字<input ref={large?undefined:nameRef} value={person.name} maxLength={60} placeholder="这个人叫什么" onChange={e=>patchPerson(person.id,{name:e.target.value},'name')}/></label><label>身份<input value={person.role} maxLength={80} placeholder="同班同学 / 梅婶 / 室友…" onChange={e=>patchPerson(person.id,{role:e.target.value},'role')}/></label></div>
  </div>
  <div className="cast-tones" role="radiogroup" aria-label="标记颜色">{tones.map(t=><button type="button" key={t} role="radio" aria-checked={person.tone===t} aria-label={'颜色 '+t} style={{background:t}} onClick={()=>patchPerson(person.id,{tone:t},'tone'+t)}/>)}{person.avatar&&<button type="button" className="cast-text-button" onClick={()=>patchPerson(person.id,{avatar:''},'avatar-clear')}>移除头像</button>}</div>
  <label>人物详情<textarea value={person.note} maxLength={6000} rows={large?12:5} placeholder="性格、口头禅、和故事有关的细节，都可以写在这里。" onChange={e=>patchPerson(person.id,{note:e.target.value},'note')}/></label>
 </>:link?<>
  <div className="cast-link-ends"><button type="button" onClick={()=>setPick({type:'person',id:link.from})}>{people.get(link.from)?.name||'未命名'}</button><button type="button" className="cast-swap" title="调换方向" aria-label="调换关系方向" onClick={()=>patchLink(link.id,{from:link.to,to:link.from},'swap'+Date.now())}><ArrowLeftRight size={14}/></button><button type="button" onClick={()=>setPick({type:'person',id:link.to})}>{people.get(link.to)?.name||'未命名'}</button></div>
  <label>关系<input ref={large?undefined:nameRef} value={link.label} maxLength={40} placeholder="青梅竹马 / 暗恋 / 实验搭档…" onChange={e=>patchLink(link.id,{label:e.target.value},'label')}/></label>
  <div className="cast-segments"><span>线型</span><div role="radiogroup" aria-label="线型">{(['solid','dashed'] as const).map(v=><button type="button" key={v} role="radio" aria-checked={link.line===v} onClick={()=>patchLink(link.id,{line:v},'line'+v)}>{v==='solid'?'实线':'虚线'}</button>)}</div></div>
  <div className="cast-segments"><span>方向</span><div role="radiogroup" aria-label="方向">{(['none','forward','both'] as const).map(v=><button type="button" key={v} role="radio" aria-checked={link.arrow===v} onClick={()=>patchLink(link.id,{arrow:v},'arrow'+v)}>{v==='none'?'无箭头':v==='forward'?'单向':'双向'}</button>)}</div></div>
  <div className="cast-tones" role="radiogroup" aria-label="蛛丝颜色">{tones.map(t=><button type="button" key={t} role="radio" aria-checked={link.tone===t} aria-label={'颜色 '+t} style={{background:t}} onClick={()=>patchLink(link.id,{tone:t},'tone'+t)}/>)}</div>
  <label>关系详情<textarea value={link.note} maxLength={3000} rows={large?10:4} placeholder="他们是怎么认识的，现在走到了哪一步。" onChange={e=>patchLink(link.id,{note:e.target.value},'note')}/></label>
 </>:null;

 return <div className={`cast-map ${pick?'has-pick':''}`} onKeyDown={keys}>
  <div className="cast-bar">
   <div><button type="button" className="cast-add" disabled={!p.ready} onClick={()=>addPerson()}><Plus size={15}/>添加人物</button><button type="button" disabled={!undo.length} onClick={stepBack} aria-label="撤销" title="撤销"><Undo2 size={15}/></button><button type="button" disabled={!redo.length} onClick={stepForward} aria-label="重做" title="重做"><Redo2 size={15}/></button></div>
   <small role="status" data-state={saveState}>{status}{saveState==='failed'&&<button type="button" onClick={()=>{dirty.current=true;flush()}}>再试一次</button>}</small>
   <div><button type="button" onClick={()=>zoom(1/1.25)} aria-label="缩小" title="缩小"><ZoomOut size={15}/></button><span className="cast-zoom">{Math.round(view.k*100)}%</span><button type="button" onClick={()=>zoom(1.25)} aria-label="放大" title="放大"><ZoomIn size={15}/></button><button type="button" onClick={fit} aria-label="看全部人物" title="看全部人物"><Scan size={15}/></button></div>
  </div>
  <div className="cast-body">
   <div ref={stage} className={`cast-stage ${thread?'is-threading':''} ${related?'is-focused':''}`} tabIndex={0} role="application" aria-label="人物关系图画布，可拖动人物、连线和平移" style={{backgroundPosition:`${view.x}px ${view.y}px`,backgroundSize:`${28*view.k}px ${28*view.k}px`}} onPointerDown={e=>down(e,'pan')} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} onDoubleClick={e=>{if((e.target as HTMLElement).closest('[data-cast-id],.cast-knot'))return;const w=toWorld(e.clientX,e.clientY);addPerson(w.x,w.y)}}>
    <div className="cast-world" style={{transform:`translate3d(${view.x}px,${view.y}px,0) scale(${view.k})`}}>
     <svg className="cast-threads" aria-hidden="true">
      {threads.map(({l,g})=>{const on=pick?.id===l.id,dim=related&&!(related.has(l.from)&&related.has(l.to)&&(l.from===person!.id||l.to===person!.id));return <g key={l.id} className={`cast-thread ${on?'on':''} ${dim?'dim':''}`} style={{color:l.tone}}>
       <path d={g.d} className="cast-thread-hit" onPointerDown={e=>{e.stopPropagation();setPick({type:'link',id:l.id})}}/>
       <path d={g.d} className="cast-thread-line" strokeDasharray={l.line==='dashed'?'7 6':undefined}/>
       {l.arrow!=='none'&&<path d={arrowHead(g.e,g.cx,g.cy)} className="cast-thread-line"/>}{l.arrow==='both'&&<path d={arrowHead(g.s,g.cx,g.cy)} className="cast-thread-line"/>}
       <circle cx={g.s.x} cy={g.s.y} r="2.6"/><circle cx={g.e.x} cy={g.e.y} r="2.6"/></g>})}
      {thread&&threadFrom&&<path className="cast-thread-live" d={`M${threadFrom.x} ${threadFrom.y}Q${(threadFrom.x+thread.x)/2} ${(threadFrom.y+thread.y)/2+30} ${thread.x} ${thread.y}`}/>}
     </svg>
     {threads.map(({l,g})=><button type="button" key={l.id} className={`cast-knot ${pick?.id===l.id?'on':''} ${l.label?'':'blank'} ${related&&!(l.from===person!.id||l.to===person!.id)?'dim':''}`} style={{left:g.lx,top:g.ly,'--tone':l.tone} as React.CSSProperties} data-cursor="action" onPointerDown={e=>e.stopPropagation()} onClick={()=>setPick({type:'link',id:l.id})} onDoubleClick={e=>{e.stopPropagation();setPick({type:'link',id:l.id});setDetail(true)}} aria-label={`关系：${people.get(l.from)?.name||'未命名'} 与 ${people.get(l.to)?.name||'未命名'}，${l.label||'还没有写关系'}`}>{l.label||'写下关系'}</button>)}
     {cast.people.map(x=>{const on=pick?.id===x.id;return <div key={x.id} data-cast-id={x.id} className={`cast-card ${on?'on':''} ${dragging===x.id?'lifting':''} ${thread?.over===x.id?'target':''} ${related&&!related.has(x.id)?'dim':''}`} style={{left:x.x,top:x.y,'--tilt':tilt(x.id)+'deg','--tone':x.tone} as React.CSSProperties}>
       <button type="button" className="cast-card-face" data-cursor="drag" aria-pressed={on} aria-label={`${x.name||'未命名人物'}${x.role?'，'+x.role:''}。拖动移动，回车展开详情`} onPointerDown={e=>down(e,'node',x.id)} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} onDoubleClick={e=>{e.stopPropagation();setPick({type:'person',id:x.id});setDetail(true)}}>
        <i className="cast-pin"/><span className="cast-photo">{x.avatar?<img src={x.avatar} alt="" draggable={false}/>:<b>{(x.name||'?').slice(0,1)}</b>}</span><strong>{x.name||'未命名'}</strong>{x.role&&<small>{x.role}</small>}
       </button>
       <button type="button" className="cast-spinner" data-cursor="action" title="拖出一根蛛丝，连到另一个人" aria-label={`从 ${x.name||'未命名人物'} 拖出关系线`} onPointerDown={e=>down(e,'thread',x.id)} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel}><Spline size={13}/></button>
      </div>})}
    </div>
    {!cast.people.length&&p.ready&&<div className="cast-empty" onPointerDown={e=>e.stopPropagation()}><Users size={30}/><h3>故事里都有谁？</h3><p>把人物钉上来，再用蛛丝连起他们的关系。</p><div><button type="button" className="primary-button" onClick={starter}>先放上彼得和我</button><button type="button" onClick={()=>addPerson()}>从空白开始</button></div></div>}
    {!!cast.people.length&&<p className="cast-hint">双击空白处添加人物 · 拖动卡片角上的红色蛛丝连线 · 双击卡片展开详情</p>}
   </div>
   {pick&&(person||link)&&<aside className="cast-inspector" aria-label={person?'人物信息':'关系信息'}>
    <header><span>{person?'人物':'关系'}</span><button type="button" onClick={()=>setPick(null)} aria-label="收起信息栏"><X size={16}/></button></header>
    <div className="cast-fields">{fields(false)}
     {person&&<div className="cast-ties"><span>相连的关系 <b>{personLinks.length}</b></span>{personLinks.map(l=>{const other=people.get(l.from===person.id?l.to:l.from);return <button type="button" key={l.id} onClick={()=>setPick({type:'link',id:l.id})}><i style={{background:l.tone}}/><em>{l.label||'未写关系'}</em><span>{other?.name||'未命名'}</span><ChevronRight size={13}/></button>})}{!personLinks.length&&<p>还没有连线。拖动卡片右下角的蛛丝，连到另一个人。</p>}</div>}
    </div>
    <footer><button type="button" onClick={()=>setDetail(true)}><Maximize2 size={14}/>展开详细编辑</button><button type="button" className={`danger ${armed===pick.id?'armed':''}`} onClick={erase}><Trash2 size={14}/>{armed===pick.id?'再点一次确认':'删除'}</button></footer>
   </aside>}
  </div>
  <input ref={fileRef} type="file" accept="image/*" hidden onChange={e=>{setAvatar(e.target.files?.[0]);e.target.value=''}}/>
  {detail&&pick&&(person||link)&&createPortal(<div className="cast-shade cast-map-scope" onKeyDown={keys} onPointerDown={e=>{if(e.target===e.currentTarget)setDetail(false)}}>
   <div className="cast-dialog" role="dialog" aria-modal="true" aria-label={person?'人物详细编辑':'关系详细编辑'}>
    <header><h3>{person?(person.name||'未命名人物'):`${people.get(link!.from)?.name||'未命名'} 与 ${people.get(link!.to)?.name||'未命名'}`}</h3><button type="button" onClick={()=>setDetail(false)} aria-label="关闭详细编辑"><X size={18}/></button></header>
    <div className="cast-fields cast-fields-large">{fields(true)}
     {person&&<div className="cast-ties cast-ties-edit"><span>相连的关系 <b>{personLinks.length}</b></span>{personLinks.map(l=>{const other=people.get(l.from===person.id?l.to:l.from);return <div key={l.id}><i style={{background:l.tone}}/><span>{other?.name||'未命名'}</span><input value={l.label} maxLength={40} placeholder="写下关系" aria-label={`与 ${other?.name||'未命名'} 的关系`} onChange={e=>patchLink(l.id,{label:e.target.value},'label')}/><button type="button" onClick={()=>setPick({type:'link',id:l.id})} aria-label="打开这条关系"><ChevronRight size={14}/></button></div>})}{!personLinks.length&&<p>还没有连线。</p>}</div>}
    </div>
    <footer><button type="button" className={`danger ${armed===pick.id?'armed':''}`} onClick={erase}><Trash2 size={14}/>{armed===pick.id?'再点一次确认':person?'删除人物':'删除关系'}</button><button type="button" className="primary-button" onClick={()=>setDetail(false)}>完成</button></footer>
   </div>
  </div>,document.body)}
 </div>;
}
