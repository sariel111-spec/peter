'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {ImagePlus,Music2,Heart,ArrowLeftRight,Plus,X,PencilLine,Eye,Download,Shuffle,ArrowUp,ArrowDown,Ruler,RotateCw,ChevronLeft,ChevronRight,GripVertical} from 'lucide-react';
import {daysTogether,parseHeight,type DuoSide} from './chronology-model';
import {exportDuoCard} from './duo-export';
import {useDuo,shrinkPhoto,type DuoHost} from './duo-store';
import './duo-sheet.css';

type Props=DuoHost&{notify:(s:string)=>void};
type SideKey='left'|'right';

// A row of small labels you can add to (Enter) and remove from.
function Chips({items,onChange,placeholder,max,limit=24,label}:{items:string[];onChange:(v:string[])=>void;placeholder:string;max:number;limit?:number;label:string}){
 const [draft,setDraft]=useState('');
 const add=()=>{const v=draft.trim();if(!v)return;if(!items.includes(v)&&items.length<max)onChange([...items,v]);setDraft('')};
 return <div className="duo-chips" role="group" aria-label={label}>{items.map((t,i)=><span key={t+i}>{t}<button type="button" aria-label={`删除 ${t}`} onClick={()=>onChange(items.filter((_,j)=>j!==i))}><X size={11}/></button></span>)}{items.length<max&&<input value={draft} maxLength={limit} placeholder={items.length?'再加一个':placeholder} aria-label={`添加${label}`} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();add()}if(e.key==='Backspace'&&!draft&&items.length)onChange(items.slice(0,-1))}} onBlur={add}/>}</div>
}

// Questions people like to answer about a pairing; drawing one adds it to the list, already yours to rewrite.
const questionBank=['谁先心动的？','第一次见面是在哪里？','谁先表白，怎么说的？','吵架了谁先低头？','他最常对我说的一句话？','他手机里给我的备注是？','我们最常去的地方？','他最受不了我的哪个小习惯？','我最喜欢他的哪个瞬间？','下雨天我们怎么过？','睡前的最后一句话是？','他吃醋的时候会怎样？','我生病的时候他会做什么？','最想一起去的地方？','他偷偷为我做过的事？','我们之间只有彼此懂的暗号？','第一次牵手是什么时候？','如果有一天要分开很久，他会留下什么？','他眼里我最可爱的时候？','十年后的我们在做什么？'];
// Counts up once when the number first appears, so the day count lands instead of just being there.
function CountUp({value}:{value:number}){const [shown,setShown]=useState(value),seen=useRef(false);useEffect(()=>{if(seen.current||matchMedia('(prefers-reduced-motion:reduce)').matches){setShown(value);seen.current=true;return}seen.current=true;const start=performance.now(),from=Math.max(0,value-Math.min(value,420));let frame=0;const tick=(t:number)=>{const k=Math.min(1,(t-start)/900),e=1-Math.pow(1-k,3);setShown(Math.round(from+(value-from)*e));if(k<1)frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[value]);return <>{shown}</>}
// Two plain figures drawn to scale from the heights written in the files.
function HeightPair({him,me,a,b,editable,onChange}:{him:string;me:string;a:string;b:string;editable:boolean;onChange:(k:'left'|'right',text:string)=>void}){
 const h1=parseHeight(a),h2=parseHeight(b),hold=useRef<{k:'left'|'right';y:number;start:number;scale:number}|null>(null),[fixed,setFixed]=useState<number|null>(null);
 if(!h1||!h2)return <section id="duo-height" className="duo-height duo-height-empty duo-spot" aria-label="身高差"><div className="duo-label-row"><span><Ruler size={13}/>身高差</span></div><p className="duo-help">在两人的「身高」里写上数字（例如 178cm 或 1.63m），这里会按比例画出站在一起的样子。</p></section>;
 const scale=fixed??230/Math.max(h1,h2),diff=Math.round(Math.abs(h1-h2)*10)/10;
 const grab=(k:'left'|'right',h:number)=>editable?{onPointerDown:(e:React.PointerEvent)=>{e.preventDefault();(e.currentTarget as Element).setPointerCapture(e.pointerId);const box=(e.currentTarget as SVGGElement).ownerSVGElement!.getBoundingClientRect();hold.current={k,y:e.clientY,start:h,scale:scale*box.height/270};setFixed(scale)},onPointerMove:(e:React.PointerEvent)=>{const g=hold.current;if(!g)return;const next=Math.max(100,Math.min(230,Math.round(g.start+(g.y-e.clientY)/g.scale)));onChange(g.k,next+'cm')},onPointerUp:()=>{hold.current=null;setFixed(null)},onPointerCancel:()=>{hold.current=null;setFixed(null)}}:{};
 const figure=(k:'left'|'right',h:number,tone:string,x:number)=>{const px=h*scale,head=px*.128,w=px*.2,y0=250-px;return <g transform={`translate(${x} 0)`} style={{color:tone}} className={`duo-figure ${editable?'can-drag':''}`} data-cursor={editable?'drag':undefined} {...grab(k,h)}><rect x={-w*.7} y={y0-8} width={w*1.4} height={px+8} fill="transparent"/><circle cx="0" cy={y0+head/2} r={head/2}/><path d={`M${-w/2} ${y0+head*1.18}Q0 ${y0+head*.98} ${w/2} ${y0+head*1.18}L${w*.42} ${y0+px*.56}L${w*.3} 250L${w*.04} 250L0 ${y0+px*.6}L${-w*.04} 250L${-w*.3} 250L${-w*.42} ${y0+px*.56}Z`}/>{editable&&<path className="duo-figure-grip" d={`M-9 ${y0-9}L0 ${y0-17}L9 ${y0-9}`}/>}</g>};
 return <section id="duo-height" className="duo-height duo-spot" aria-label={`身高差：${him} ${h1} 厘米，${me} ${h2} 厘米，相差 ${diff} 厘米`}>
  <div className="duo-label-row"><span><Ruler size={13}/>身高差</span>{editable&&<em className="duo-tip">按住小人上下拖，可以直接改身高</em>}</div>
  <div className="duo-height-stage"><svg viewBox="0 0 320 270" aria-hidden="true">
   <line x1="20" x2="300" y1="250" y2="250" className="duo-ground"/>
   {[h1,h2].map((h,i)=><line key={i} x1="40" x2="280" y1={250-h*scale} y2={250-h*scale} className="duo-guide"/>)}
   {figure('left',h1,'#a72f3b',118)}{figure('right',h2,'#23374c',202)}
   {diff>0&&<g className="duo-gap"><line x1="262" x2="262" y1={250-Math.max(h1,h2)*scale} y2={250-Math.min(h1,h2)*scale}/><text x="270" y={250-(h1+h2)/2*scale+4}>{diff}</text></g>}
  </svg>
  <dl><div style={{color:'#a72f3b'}}><dt>{him}</dt><dd>{h1}<small>cm</small></dd></div><div className="duo-height-diff"><dt>相差</dt><dd>{fixed?Math.round(diff):<CountUp value={Math.round(diff)}/>}<small>cm</small></dd></div><div style={{color:'#23374c'}}><dt>{me}</dt><dd>{h2}<small>cm</small></dd></div></dl></div>
 </section>;
}
// A stack of question cards: drag the top one aside to send it to the back, tap to turn it over.
function QaDeck({items}:{items:{q:string;a:string}[]}){
 const [at,setAt]=useState(0),[turned,setTurned]=useState(false),[drag,setDrag]=useState(0),[leaving,setLeaving]=useState(0),hold=useRef<{x:number;moved:boolean}|null>(null),n=items.length,index=((at%n)+n)%n;
 const go=(d:number)=>{if(n<2)return;setLeaving(d);setTimeout(()=>{setAt(v=>v+1);setTurned(false);setDrag(0);setLeaving(0)},230)};
 const down=(e:React.PointerEvent)=>{(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);hold.current={x:e.clientX,moved:false}};
 const move=(e:React.PointerEvent)=>{const g=hold.current;if(!g)return;const dx=e.clientX-g.x;if(Math.abs(dx)>6)g.moved=true;if(g.moved)setDrag(dx)};
 const up=()=>{const g=hold.current;hold.current=null;if(!g)return;if(!g.moved){setTurned(v=>!v);return}if(Math.abs(drag)>90)go(drag>0?1:-1);else setDrag(0)};
 const keys=(e:React.KeyboardEvent)=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();go(e.key==='ArrowRight'?1:-1)}if(e.key==='Enter'||e.key===' '){e.preventDefault();setTurned(v=>!v)}};
 return <div className="duo-deck">
  <div className="duo-deck-stack" style={{'--drag':drag+'px','--lean':drag/18+'deg'} as React.CSSProperties}>
   {[2,1,0].filter(d=>d<n).map(d=>{const x=items[(index+d)%n],topCard=d===0;return <div key={(index+d)%n} className={`duo-deck-card depth-${d} ${topCard&&turned?'turned':''} ${topCard&&leaving?(leaving>0?'out-right':'out-left'):''} ${topCard&&hold.current?.moved?'held':''}`} {...(topCard?{role:'button',tabIndex:0,'aria-label':`第 ${index+1} 题，共 ${n} 题：${x.q}。${turned?'回答：'+x.a:'按回车翻面'}`,onPointerDown:down,onPointerMove:move,onPointerUp:up,onPointerCancel:()=>{hold.current=null;setDrag(0)},onKeyDown:keys,'data-cursor':'drag'}:{'aria-hidden':true})}>
     <span className="duo-flip-inner"><span className="duo-flip-face duo-flip-q"><em>Q{String((index+d)%n+1).padStart(2,'0')}</em><b>{x.q||'还没写问题'}</b><small><RotateCw size={12}/>点一下翻面{n>1&&' · 左右拖动换下一张'}</small></span><span className="duo-flip-face duo-flip-a"><em>A</em><b>{x.a||'还没写回答'}</b></span></span>
    </div>})}
  </div>
  {n>1&&<div className="duo-deck-nav"><button type="button" onClick={()=>go(-1)} aria-label="上一题"><ChevronLeft size={16}/></button><span>{String(index+1).padStart(2,'0')} / {String(n).padStart(2,'0')}</span><button type="button" onClick={()=>go(1)} aria-label="下一题"><ChevronRight size={16}/></button></div>}
 </div>;
}

export default function DuoSheet(p:Props){
 const live=useDuo(p),{duo,ref,state,status,retry}=live;
 const [stageEdit,setStageEdit]=useState(false),[roleEdit,setRoleEdit]=useState(false),[roleDraft,setRoleDraft]=useState('');
 const has=(d=p.doc.duo)=>!!(d&&(d.right.name||d.since||d.left.portrait||d.right.portrait||d.world||d.qa.length||d.roles.length));
 const [mode,setModeState]=useState<'view'|'edit'>(has()?'view':'edit'),chosen=useRef(false),setMode=(m:'view'|'edit')=>{chosen.current=true;setModeState(m)},[flipped,setFlipped]=useState<Set<number>>(new Set()),[exporting,setExporting]=useState(false);
 useEffect(()=>{if(!chosen.current&&p.ready&&has())setModeState('view')},[p.ready]);// eslint-disable-line react-hooks/exhaustive-deps
 const view=mode==='view';
 const [develop,setDevelop]=useState(0),[dossier,setDossier]=useState<{k:SideKey;from:DOMRect}|null>(null),[closing,setClosing]=useState(false),[spot,setSpot]=useState('duo-top');
 useEffect(()=>{if(view)setDevelop(n=>n+1)},[view]);
 // While showing, the setters do nothing: every field is controlled, so the sheet cannot be changed by accident.
 const top:typeof live.top=view?()=>{}:live.top,side:typeof live.side=view?()=>{}:live.side;
 const grip=useRef<{x:number;y:number;moved:boolean;id:number}|null>(null);
 const printMove=(e:React.PointerEvent<HTMLElement>)=>{const el=e.currentTarget,g=grip.current;
  if(g&&g.id===e.pointerId){const dx=e.clientX-g.x,dy=e.clientY-g.y;if(!g.moved&&Math.hypot(dx,dy)>6){g.moved=true;el.classList.add('dragging')}if(g.moved){el.style.setProperty('--dx',dx+'px');el.style.setProperty('--dy',dy+'px');el.style.setProperty('--dr',Math.max(-14,Math.min(14,dx/14))+'deg')}return}
  if(e.pointerType==='touch')return;const r=el.getBoundingClientRect();el.style.setProperty('--tx',String((e.clientX-r.left)/r.width-.5));el.style.setProperty('--ty',String((e.clientY-r.top)/r.height-.5))};
 const printDown=(e:React.PointerEvent<HTMLElement>)=>{if(e.button!==0||e.pointerType==='touch')return;e.currentTarget.setPointerCapture(e.pointerId);grip.current={x:e.clientX,y:e.clientY,moved:false,id:e.pointerId}};
 const printUp=(e:React.PointerEvent<HTMLElement>,k:SideKey)=>{const el=e.currentTarget,g=grip.current;grip.current=null;el.classList.remove('dragging');for(const v of ['--dx','--dy','--dr'])el.style.removeProperty(v);if(g?.moved)el.dataset.dragged='1'};
 const printLeave=(e:React.PointerEvent<HTMLElement>)=>{if(grip.current)return;e.currentTarget.style.removeProperty('--tx');e.currentTarget.style.removeProperty('--ty')};
 const printClick=(e:React.MouseEvent<HTMLElement>,k:SideKey)=>{const el=e.currentTarget;if(el.dataset.dragged){delete el.dataset.dragged;return}if(view)setDossier({k,from:el.getBoundingClientRect()});else pick(k)};
 const closeDossier=()=>{setClosing(true);setTimeout(()=>{setDossier(null);setClosing(false)},260)};
 useEffect(()=>{if(!dossier)return;const esc=(e:KeyboardEvent)=>{if(e.key==='Escape')closeDossier()};window.addEventListener('keydown',esc);return()=>window.removeEventListener('keydown',esc)},[dossier]);
 // Light that follows the pointer across a panel, and a button that leans toward it.
 const light=(e:React.PointerEvent<HTMLElement>)=>{const el=(e.target as HTMLElement).closest<HTMLElement>('.duo-spot');if(!el||e.pointerType==='touch')return;const r=el.getBoundingClientRect();el.style.setProperty('--sx',e.clientX-r.left+'px');el.style.setProperty('--sy',e.clientY-r.top+'px')};
 const pull=(e:React.PointerEvent<HTMLElement>)=>{if(e.pointerType==='touch')return;const el=e.currentTarget,r=el.getBoundingClientRect();el.style.setProperty('--mx',(e.clientX-r.left-r.width/2)*.28+'px');el.style.setProperty('--my',(e.clientY-r.top-r.height/2)*.34+'px')};
 const release=(e:React.PointerEvent<HTMLElement>)=>{e.currentTarget.style.removeProperty('--mx');e.currentTarget.style.removeProperty('--my')};
 // The dock at the bottom tracks which part of the sheet is on screen.
 const parts=[['duo-top','档案'],['duo-height','身高'],['duo-more','关系'],['duo-qa','问答']] as const;
 useEffect(()=>{const seen=new Map<string,number>(),io=new IntersectionObserver(list=>{for(const en of list)seen.set(en.target.id,en.isIntersecting?en.intersectionRatio:0);let best='',top=0;for(const [id,r] of seen)if(r>top){top=r;best=id}if(best)setSpot(best)},{threshold:[0,.2,.5,.8],rootMargin:'-20% 0px -30% 0px'});for(const [id] of parts){const el=document.getElementById(id);if(el)io.observe(el)}return()=>io.disconnect()},[]);// eslint-disable-line react-hooks/exhaustive-deps
 const dock=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{const el=dock.current,on=el?.querySelector<HTMLElement>('[aria-current=true]');if(el&&on){el.style.setProperty('--dock-x',on.offsetLeft+'px');el.style.setProperty('--dock-w',on.offsetWidth+'px')}},[spot,mode]);
 // Drag along the relationship line; it settles on the nearest stage.
 const track=(e:React.PointerEvent<HTMLElement>)=>{if(view||(e.type==='pointermove'&&!(e.buttons&1)))return;const r=e.currentTarget.getBoundingClientRect(),n=duo.stages.length,i=Math.max(0,Math.min(n-1,Math.round((e.clientX-r.left)/r.width*(n-1))));if(i!==duo.stage)top({stage:i})};
 const savePicture=async()=>{setExporting(true);try{await exportDuoCard(duo);p.notify('设定卡已保存为图片')}catch(e){p.notify((e as Error).message||'图片没有导出成功')}finally{setExporting(false)}};
 const drawQuestion=()=>{const used=new Set(duo.qa.map(x=>x.q)),left=questionBank.filter(q=>!used.has(q));if(duo.qa.length>=80){p.notify('问答最多 80 条');return}const q=left.length?left[Math.floor(Math.random()*left.length)]:'';live.top({qa:[...duo.qa,{q,a:''}]});setMode('edit')};
 const moveQa=(i:number,d:number)=>{const j=i+d;if(j<0||j>=duo.qa.length)return;const next=[...duo.qa];[next[i],next[j]]=[next[j],next[i]];top({qa:next})};
 const file=useRef<HTMLInputElement>(null),target=useRef<SideKey|'photo'>('left');
 const upload=async(f?:File)=>{if(!f)return;try{if(target.current==='photo')top({photo:await shrinkPhoto(f,800,560,190000)});else side(target.current,{portrait:await shrinkPhoto(f,480,640)})}catch(e){p.notify((e as Error).message)}};
 const days=daysTogether(duo.since),tags=duo.tags.split(/[,，、\s]+/).filter(Boolean);
 const him=duo.left.name||'他',me=duo.right.name||'我';
 const pick=(k:SideKey|'photo')=>{target.current=k;file.current?.click()};

 const text=(k:SideKey,f:keyof DuoSide,placeholder:string,label:string,max=40)=><input className="duo-ink" value={duo[k][f] as string} maxLength={max} placeholder={placeholder} aria-label={label} onChange={e=>side(k,{[f]:e.target.value} as Partial<DuoSide>)}/>;
 const card=(k:SideKey,tone:string)=>{const d=duo[k],who=k==='left'?him:me;return <section className={`duo-person duo-${k}`} style={{'--tone':tone} as React.CSSProperties} aria-label={`${who}的设定`}>
  <button type="button" className="duo-portrait" onPointerMove={printMove} onPointerDown={printDown} onPointerUp={e=>printUp(e,k)} onPointerCancel={e=>printUp(e,k)} onPointerLeave={printLeave} onClick={e=>printClick(e,k)} aria-label={view?`打开${who}的档案`:`更换${who}的照片`} data-cursor={view?'view':undefined}>{d.portrait?<img key={develop} className={view?'developing':''} src={d.portrait} alt="" draggable={false}/>:<span><ImagePlus size={22}/>{view?'还没有照片':'放一张照片'}</span>}{d.portrait&&!view&&<em><ImagePlus size={13}/>更换</em>}<b className="duo-glare"/><i/></button>
  {d.portrait&&<button type="button" className="duo-portrait-clear" onClick={()=>side(k,{portrait:''})} aria-label={`移除${who}的照片`}><X size={13}/></button>}
  <input className="duo-ink duo-name" value={d.name} maxLength={60} placeholder={k==='left'?'他的名字':'我的名字'} aria-label="名字" onChange={e=>side(k,{name:e.target.value})}/>
  <dl className="duo-facts">
   <div><dt>年龄</dt><dd>{text(k,'age','—','年龄')}</dd></div><div><dt>身高</dt><dd>{text(k,'height','—','身高')}</dd></div>
   <div><dt>生日</dt><dd>{text(k,'birthday','—','生日')}</dd></div><div><dt>类型</dt><dd>{text(k,'type','MBTI / 星座','类型')}</dd></div>
   <div><dt>印象物</dt><dd>{text(k,'motif','—','印象物',60)}</dd></div><div><dt>动物塑</dt><dd>{text(k,'animal','—','动物塑',60)}</dd></div>
   {d.extras.map((f,i)=><div className="wide duo-extra" key={i}><dt><input className="duo-ink" value={f.k} maxLength={16} placeholder="项目" aria-label={`自定义项目 ${i+1} 的名称`} onChange={e=>side(k,{extras:d.extras.map((x,j)=>j===i?{...x,k:e.target.value}:x)})}/></dt><dd><input className="duo-ink" value={f.v} maxLength={120} placeholder="内容" aria-label={`${f.k||'自定义项目'}的内容`} onChange={e=>side(k,{extras:d.extras.map((x,j)=>j===i?{...x,v:e.target.value}:x)})}/><button type="button" aria-label={`删除 ${f.k||'这一项'}`} onClick={()=>side(k,{extras:d.extras.filter((_,j)=>j!==i)})}><X size={12}/></button></dd></div>)}
   {d.extras.length<12&&<div className="wide"><button type="button" className="duo-add-line" onClick={()=>side(k,{extras:[...d.extras,{k:'',v:''}]})}><Plus size={13}/>加一项，比如 香水 / 口头禅 / 专业</button></div>}
   <div className="wide"><dt>喜欢</dt><dd><textarea className="duo-ink" rows={2} value={d.likes} maxLength={400} placeholder="喜欢的东西、小习惯" aria-label="喜欢" onChange={e=>side(k,{likes:e.target.value})}/></dd></div>
   <div className="wide"><dt>雷点</dt><dd><textarea className="duo-ink" rows={2} value={d.dislikes} maxLength={400} placeholder="不喜欢的、会难过的" aria-label="雷点" onChange={e=>side(k,{dislikes:e.target.value})}/></dd></div>
   <div className="wide duo-anchor"><dt>锚点</dt><dd><Chips items={d.anchors} max={16} label={`${who}的锚点`} placeholder="一看就是 TA 的细节，回车添加" onChange={v=>side(k,{anchors:v})}/></dd></div>
  </dl>
 </section>};
 const bubble=(k:SideKey,other:SideKey)=>{const from=k==='left'?him:me,to=other==='left'?him:me;return <div className={`duo-bubbles duo-bubbles-${k}`}>
  <label><span>{from}叫{to}</span><input className="duo-ink" value={duo[k].calls} maxLength={60} placeholder="称呼 / 昵称" onChange={e=>side(k,{calls:e.target.value})}/></label>
  <label><span>{from}眼里的{to}</span><textarea className="duo-ink" rows={3} value={duo[k].view} maxLength={400} placeholder="一句话印象" onChange={e=>side(k,{view:e.target.value})}/></label>
 </div>};
 const addRole=()=>{const v=roleDraft.trim();if(!v)return;if(!duo.roleOptions.includes(v)&&duo.roleOptions.length<40)top({roleOptions:[...duo.roleOptions,v],roles:[...duo.roles,v]});else if(!duo.roles.includes(v))top({roles:[...duo.roles,v]});setRoleDraft('')};

 return <section className={`duo-sheet duo-mode-${mode}`} aria-label="双人设定速览" onPointerMove={light}>
  <header className="duo-head"><div><small>THE TWO OF US</small><h2>设定速览</h2><p>{view?<><Eye size={13}/>正在展示。想改内容，切到「编辑」。</>:<><PencilLine size={13}/>每一处文字都可以直接点击修改，停下后自动保存。</>}</p></div>
   <div className="duo-head-tools"><span role="status" data-state={state}>{status}{state==='failed'&&<button type="button" onClick={retry}>再试一次</button>}</span>
    <div className="duo-switch" role="radiogroup" aria-label="展示或编辑" data-mode={mode}><i aria-hidden="true"/><button type="button" role="radio" aria-checked={view} onClick={()=>setMode('view')}><Eye size={14}/>展示</button><button type="button" role="radio" aria-checked={!view} onClick={()=>setMode('edit')}><PencilLine size={14}/>编辑</button></div>
    <button type="button" className="duo-export" disabled={exporting} onClick={savePicture} onPointerMove={pull} onPointerLeave={release}><Download size={14}/>{exporting?'正在生成…':'存为设定卡图片'}</button></div></header>
  <div className="duo-spread" id="duo-top">
   {card('left','#a72f3b')}
   <div className="duo-middle">
    <div className={`duo-photo ${duo.photo?'has':''}`}><button type="button" onClick={()=>pick('photo')} aria-label="更换合照">{duo.photo?<img src={duo.photo} alt=""/>:<span><ImagePlus size={20}/>放一张合照，或代表你们的画面</span>}</button>{duo.photo&&<button type="button" className="duo-photo-clear" onClick={()=>top({photo:''})} aria-label="移除合照"><X size={13}/></button>}</div>
    <div className="duo-title"><b>{him}</b><Heart size={15} fill="currentColor"/><b>{me}</b></div>
    <div className="duo-since">{days?<><span>在一起的第</span><strong><CountUp value={days}/></strong><span>天</span></>:<span>写下纪念日，这里会开始数日子</span>}<input className="duo-ink" value={duo.since} maxLength={40} placeholder="纪念日，例如 2012-07-03" aria-label="纪念日" onChange={e=>top({since:e.target.value})}/></div>
    <div className="duo-progress" style={{'--at':duo.stages.length>1?duo.stage/(duo.stages.length-1):0} as React.CSSProperties}>
     <div className="duo-label-row"><span>关系进程</span><button type="button" onClick={()=>setStageEdit(v=>!v)} aria-expanded={stageEdit}>{stageEdit?'完成':'编辑阶段'}</button></div>
     <div className="duo-track" role="radiogroup" aria-label="关系进程" onPointerDown={e=>{if(!view){e.currentTarget.setPointerCapture(e.pointerId);track(e)}}} onPointerMove={track}><i/><b className="duo-track-heart" aria-hidden="true"><Heart size={11} fill="currentColor"/></b>{duo.stages.map((s,i)=><button type="button" key={i} role="radio" aria-checked={duo.stage===i} className={i<=duo.stage?'passed':''} style={{left:(duo.stages.length>1?i/(duo.stages.length-1)*100:0)+'%'}} onClick={()=>top({stage:i})}><em/><span>{s||'未命名'}</span></button>)}</div>
     {stageEdit&&<div className="duo-stage-edit">{duo.stages.map((s,i)=><span key={i}><input value={s} maxLength={12} aria-label={`第 ${i+1} 个阶段`} onChange={e=>top({stages:duo.stages.map((x,j)=>j===i?e.target.value:x)})}/>{duo.stages.length>2&&<button type="button" aria-label={`删除阶段 ${s}`} onClick={()=>top({stages:duo.stages.filter((_,j)=>j!==i),stage:Math.min(duo.stage>i?duo.stage-1:duo.stage,duo.stages.length-2)})}><X size={12}/></button>}</span>)}{duo.stages.length<8&&<button type="button" className="duo-stage-add" onClick={()=>top({stages:[...duo.stages,'']})}><Plus size={13}/>加一个阶段</button>}</div>}
    </div>
    <div className="duo-exchange">{bubble('left','right')}<ArrowLeftRight size={16} aria-hidden="true"/>{bubble('right','left')}</div>
    <div className="duo-label-row"><span>结局倾向</span><div className="duo-ending" role="radiogroup" aria-label="结局倾向">{(['HE','BE','OE'] as const).map(v=><button type="button" key={v} role="radio" aria-checked={duo.ending===v} onClick={()=>top({ending:duo.ending===v?'':v})}>{v}</button>)}</div></div>
    <label className="duo-song"><Music2 size={16}/><input className="duo-ink" value={duo.song} maxLength={120} placeholder="我们的主题曲" aria-label="主题曲" onChange={e=>top({song:e.target.value})}/><span aria-hidden="true"><i/><i/><i/><i/></span></label>
    <label className="duo-tags"><span>TAG</span><input className="duo-ink" value={duo.tags} maxLength={300} placeholder="校园 AU、双向暗恋…用逗号或空格分开" aria-label="设定标签" onChange={e=>top({tags:e.target.value})}/>{tags.length>0&&<p>{tags.map((t,i)=><b key={i}>#{t}</b>)}</p>}</label>
   </div>
   {card('right','#23374c')}
  </div>
  <HeightPair him={him} me={me} a={duo.left.height} b={duo.right.height} editable={!view} onChange={(k,text)=>side(k,{height:text})}/>
  <div className="duo-more" id="duo-more">
   <section className="duo-roles duo-spot" aria-label="关系定位">
    <div className="duo-label-row"><span>关系定位</span><button type="button" onClick={()=>setRoleEdit(v=>!v)} aria-expanded={roleEdit}>{roleEdit?'完成':'增删选项'}</button></div>
    <p className="duo-help">{roleEdit?'点 × 把不需要的选项删掉，或在下面写一个新的。':'点一下选中，再点一下取消。'}</p>
    <div className="duo-role-list">{(view?duo.roleOptions.filter(r=>duo.roles.includes(r)):duo.roleOptions).map(r=>{const on=duo.roles.includes(r);return roleEdit?<span key={r} className="duo-role editing">{r}<button type="button" aria-label={`删除选项 ${r}`} onClick={()=>top({roleOptions:duo.roleOptions.filter(x=>x!==r),roles:duo.roles.filter(x=>x!==r)})}><X size={11}/></button></span>:<button type="button" key={r} className={`duo-role ${on?'on':''}`} aria-pressed={on} onClick={()=>top({roles:on?duo.roles.filter(x=>x!==r):[...duo.roles,r]})}><i/>{r}</button>})}<input className="duo-role-new" value={roleDraft} maxLength={16} placeholder="＋ 写一个自己的" aria-label="添加关系定位" onChange={e=>setRoleDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addRole()}}} onBlur={addRole}/></div>
    <label className="duo-world"><span>我们的世界观</span><textarea className="duo-ink" rows={5} value={duo.world} maxLength={600} placeholder="这个宇宙里，故事发生在哪里、从哪一刻开始。" onChange={e=>top({world:e.target.value})}/></label>
   </section>
   <section className="duo-scales duo-spot" aria-label="谁更">
    <div className="duo-label-row"><span>谁更……</span><b><em style={{color:'#a72f3b'}}>{him}</em><em style={{color:'#23374c'}}>{me}</em></b></div>
    <p className="duo-help">拖动每一行的小爱心，偏向谁就靠近谁。问题可以改，也可以增删。</p>
    {duo.scales.map((s,i)=><div className="duo-scale" key={i} style={{'--v':s.value} as React.CSSProperties}>
     <input className="duo-ink" value={s.label} maxLength={20} placeholder="谁更……" aria-label={`第 ${i+1} 个问题`} onChange={e=>top({scales:duo.scales.map((x,j)=>j===i?{...x,label:e.target.value}:x)})}/>
     <div className="duo-slide"><input type="range" min={0} max={100} step={5} value={s.value} aria-label={`${s.label||'谁更'}：0 是${him}，100 是${me}`} aria-valuetext={s.value===50?'一样':s.value<50?`偏${him}`:`偏${me}`} data-cursor="drag" onChange={e=>top({scales:ref.current.scales.map((x,j)=>j===i?{...x,value:+e.target.value}:x)})}/><i aria-hidden="true"><Heart size={12} fill="currentColor"/></i></div>
     <span>{s.value===50?'一样':s.value<50?him:me}</span>
     <button type="button" aria-label={`删除 ${s.label||'这一行'}`} onClick={()=>top({scales:duo.scales.filter((_,j)=>j!==i)})}><X size={13}/></button>
    </div>)}
    {duo.scales.length<14&&<button type="button" className="duo-add-line" onClick={()=>top({scales:[...duo.scales,{label:'',value:50}]})}><Plus size={13}/>加一个问题</button>}
   </section>
  </div>
  <section className="duo-qa duo-spot" id="duo-qa" aria-label="问答卡">
   <div className="duo-label-row"><span>问答卡</span><b className="duo-qa-tools"><button type="button" onClick={drawQuestion}><Shuffle size={13}/>抽一题</button><button type="button" onClick={()=>{live.top({qa:[...duo.qa,{q:'',a:''}]});setMode('edit')}}><Plus size={13}/>自己写一题</button></b></div>
   <p className="duo-help">{view?'点一下卡片翻面看回答。':'问题和回答都可以改；用箭头调整顺序。'}</p>
   {duo.qa.length===0?<p className="duo-qa-empty">还没有问答。点「抽一题」，从常见的问题里随机来一个，或者自己写。</p>
   :view?<QaDeck items={duo.qa}/>:<div className="duo-qa-grid">{duo.qa.map((x,i)=>
     <div key={i} className="duo-qa-edit"><em>Q{String(i+1).padStart(2,'0')}</em><input className="duo-ink" value={x.q} maxLength={80} placeholder="问题" aria-label={`第 ${i+1} 题的问题`} onChange={e=>top({qa:duo.qa.map((y,j)=>j===i?{...y,q:e.target.value}:y)})}/><textarea className="duo-ink" rows={3} value={x.a} maxLength={600} placeholder="回答" aria-label={`第 ${i+1} 题的回答`} onChange={e=>top({qa:duo.qa.map((y,j)=>j===i?{...y,a:e.target.value}:y)})}/><div><button type="button" disabled={i===0} onClick={()=>moveQa(i,-1)} aria-label="上移"><ArrowUp size={13}/></button><button type="button" disabled={i===duo.qa.length-1} onClick={()=>moveQa(i,1)} aria-label="下移"><ArrowDown size={13}/></button><button type="button" onClick={()=>top({qa:duo.qa.filter((_,j)=>j!==i)})} aria-label={`删除第 ${i+1} 题`}><X size={13}/></button></div></div>)}</div>}
  </section>
  <nav className="duo-dock" aria-label="设定速览导航"><div ref={dock}><i aria-hidden="true"/>{parts.map(([id,label])=><button type="button" key={id} aria-current={spot===id} onClick={()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:id==='duo-top'?'start':'center'})}>{label}</button>)}</div></nav>
  {dossier&&createPortal((()=>{const d=duo[dossier.k],who=dossier.k==='left'?him:me,other=dossier.k==='left'?me:him,tone=dossier.k==='left'?'#a72f3b':'#23374c',rows=[['年龄',d.age],['身高',d.height],['生日',d.birthday],['类型',d.type],['印象物',d.motif],['动物塑',d.animal],...d.extras.map(f=>[f.k,f.v])].filter(([k,v])=>k.trim()&&v.trim());
   return <div className={`duo-dossier-shade ${closing?'closing':''}`} onPointerDown={e=>{if(e.target===e.currentTarget)closeDossier()}}><div className="duo-dossier" role="dialog" aria-modal="true" aria-label={`${who}的档案`} style={{'--tone':tone,'--from-x':dossier.from.left+dossier.from.width/2-innerWidth/2+'px','--from-y':dossier.from.top+dossier.from.height/2-innerHeight/2+'px','--from-s':String(dossier.from.width/Math.min(innerWidth*.9,860))} as React.CSSProperties}>
    <button type="button" className="duo-dossier-close" onClick={closeDossier} aria-label="合上档案" autoFocus><X size={18}/></button>
    <div className="duo-dossier-photo">{d.portrait?<img src={d.portrait} alt=""/>:<b>{who.slice(0,1)}</b>}</div>
    <div className="duo-dossier-body"><small>PERSONAL FILE</small><h3>{who}</h3>{d.anchors.length>0&&<p className="duo-dossier-chips">{d.anchors.map((x,i)=><span key={i} style={{'--i':i} as React.CSSProperties}>{x}</span>)}</p>}
     {rows.length>0&&<dl>{rows.map(([k,v],i)=><div key={i} style={{'--i':i} as React.CSSProperties}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>}
     {d.likes&&<section><h4>喜欢</h4><p>{d.likes}</p></section>}{d.dislikes&&<section><h4>雷点</h4><p>{d.dislikes}</p></section>}
     {(d.calls||d.view)&&<blockquote>{d.calls&&<em>{who}叫{other}「{d.calls}」</em>}{d.view&&<span>{d.view}</span>}</blockquote>}
     {!rows.length&&!d.likes&&!d.dislikes&&!d.calls&&!d.view&&!d.anchors.length&&<p className="duo-dossier-empty">这份档案还是空的。切到「编辑」把 TA 写下来。</p>}
    </div></div></div>})(),document.body)}
  <input ref={file} type="file" accept="image/*" hidden onChange={e=>{upload(e.target.files?.[0]);e.target.value=''}}/>
 </section>;
}
