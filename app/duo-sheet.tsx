'use client';
import {useRef,useState} from 'react';
import {ImagePlus,Music2,Heart,ArrowLeftRight,Plus,X,PencilLine} from 'lucide-react';
import {daysTogether,type DuoSide} from './chronology-model';
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

export default function DuoSheet(p:Props){
 const {duo,ref,top,side,state,status,retry}=useDuo(p);
 const [stageEdit,setStageEdit]=useState(false),[roleEdit,setRoleEdit]=useState(false),[roleDraft,setRoleDraft]=useState('');
 const file=useRef<HTMLInputElement>(null),target=useRef<SideKey|'photo'>('left');
 const upload=async(f?:File)=>{if(!f)return;try{if(target.current==='photo')top({photo:await shrinkPhoto(f,800,560,190000)});else side(target.current,{portrait:await shrinkPhoto(f,480,640)})}catch(e){p.notify((e as Error).message)}};
 const days=daysTogether(duo.since),tags=duo.tags.split(/[,，、\s]+/).filter(Boolean);
 const him=duo.left.name||'他',me=duo.right.name||'我';
 const pick=(k:SideKey|'photo')=>{target.current=k;file.current?.click()};

 const text=(k:SideKey,f:keyof DuoSide,placeholder:string,label:string,max=40)=><input className="duo-ink" value={duo[k][f] as string} maxLength={max} placeholder={placeholder} aria-label={label} onChange={e=>side(k,{[f]:e.target.value} as Partial<DuoSide>)}/>;
 const card=(k:SideKey,tone:string)=>{const d=duo[k],who=k==='left'?him:me;return <section className={`duo-person duo-${k}`} style={{'--tone':tone} as React.CSSProperties} aria-label={`${who}的设定`}>
  <button type="button" className="duo-portrait" onClick={()=>pick(k)} aria-label={`更换${who}的照片`}>{d.portrait?<img src={d.portrait} alt=""/>:<span><ImagePlus size={22}/>放一张照片</span>}{d.portrait&&<em><ImagePlus size={13}/>更换</em>}<i/></button>
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

 return <section className="duo-sheet" aria-label="双人设定速览">
  <header className="duo-head"><div><small>THE TWO OF US</small><h2>设定速览</h2><p><PencilLine size={13}/>每一处文字都可以直接点击修改，停下后自动保存。</p></div><span role="status" data-state={state}>{status}{state==='failed'&&<button type="button" onClick={retry}>再试一次</button>}</span></header>
  <div className="duo-spread">
   {card('left','#a72f3b')}
   <div className="duo-middle">
    <div className={`duo-photo ${duo.photo?'has':''}`}><button type="button" onClick={()=>pick('photo')} aria-label="更换合照">{duo.photo?<img src={duo.photo} alt=""/>:<span><ImagePlus size={20}/>放一张合照，或代表你们的画面</span>}</button>{duo.photo&&<button type="button" className="duo-photo-clear" onClick={()=>top({photo:''})} aria-label="移除合照"><X size={13}/></button>}</div>
    <div className="duo-title"><b>{him}</b><Heart size={15} fill="currentColor"/><b>{me}</b></div>
    <div className="duo-since">{days?<><span>在一起的第</span><strong>{days}</strong><span>天</span></>:<span>写下纪念日，这里会开始数日子</span>}<input className="duo-ink" value={duo.since} maxLength={40} placeholder="纪念日，例如 2012-07-03" aria-label="纪念日" onChange={e=>top({since:e.target.value})}/></div>
    <div className="duo-progress" style={{'--at':duo.stages.length>1?duo.stage/(duo.stages.length-1):0} as React.CSSProperties}>
     <div className="duo-label-row"><span>关系进程</span><button type="button" onClick={()=>setStageEdit(v=>!v)} aria-expanded={stageEdit}>{stageEdit?'完成':'编辑阶段'}</button></div>
     <div className="duo-track" role="radiogroup" aria-label="关系进程"><i/>{duo.stages.map((s,i)=><button type="button" key={i} role="radio" aria-checked={duo.stage===i} className={i<=duo.stage?'passed':''} style={{left:(duo.stages.length>1?i/(duo.stages.length-1)*100:0)+'%'}} onClick={()=>top({stage:i})}><em/><span>{s||'未命名'}</span></button>)}</div>
     {stageEdit&&<div className="duo-stage-edit">{duo.stages.map((s,i)=><span key={i}><input value={s} maxLength={12} aria-label={`第 ${i+1} 个阶段`} onChange={e=>top({stages:duo.stages.map((x,j)=>j===i?e.target.value:x)})}/>{duo.stages.length>2&&<button type="button" aria-label={`删除阶段 ${s}`} onClick={()=>top({stages:duo.stages.filter((_,j)=>j!==i),stage:Math.min(duo.stage>i?duo.stage-1:duo.stage,duo.stages.length-2)})}><X size={12}/></button>}</span>)}{duo.stages.length<8&&<button type="button" className="duo-stage-add" onClick={()=>top({stages:[...duo.stages,'']})}><Plus size={13}/>加一个阶段</button>}</div>}
    </div>
    <div className="duo-exchange">{bubble('left','right')}<ArrowLeftRight size={16} aria-hidden="true"/>{bubble('right','left')}</div>
    <div className="duo-label-row"><span>结局倾向</span><div className="duo-ending" role="radiogroup" aria-label="结局倾向">{(['HE','BE','OE'] as const).map(v=><button type="button" key={v} role="radio" aria-checked={duo.ending===v} onClick={()=>top({ending:duo.ending===v?'':v})}>{v}</button>)}</div></div>
    <label className="duo-song"><Music2 size={16}/><input className="duo-ink" value={duo.song} maxLength={120} placeholder="我们的主题曲" aria-label="主题曲" onChange={e=>top({song:e.target.value})}/><span aria-hidden="true"><i/><i/><i/><i/></span></label>
    <label className="duo-tags"><span>TAG</span><input className="duo-ink" value={duo.tags} maxLength={300} placeholder="校园 AU、双向暗恋…用逗号或空格分开" aria-label="设定标签" onChange={e=>top({tags:e.target.value})}/>{tags.length>0&&<p>{tags.map((t,i)=><b key={i}>#{t}</b>)}</p>}</label>
   </div>
   {card('right','#23374c')}
  </div>
  <div className="duo-more">
   <section className="duo-roles" aria-label="关系定位">
    <div className="duo-label-row"><span>关系定位</span><button type="button" onClick={()=>setRoleEdit(v=>!v)} aria-expanded={roleEdit}>{roleEdit?'完成':'增删选项'}</button></div>
    <p className="duo-help">{roleEdit?'点 × 把不需要的选项删掉，或在下面写一个新的。':'点一下选中，再点一下取消。'}</p>
    <div className="duo-role-list">{duo.roleOptions.map(r=>{const on=duo.roles.includes(r);return roleEdit?<span key={r} className="duo-role editing">{r}<button type="button" aria-label={`删除选项 ${r}`} onClick={()=>top({roleOptions:duo.roleOptions.filter(x=>x!==r),roles:duo.roles.filter(x=>x!==r)})}><X size={11}/></button></span>:<button type="button" key={r} className={`duo-role ${on?'on':''}`} aria-pressed={on} onClick={()=>top({roles:on?duo.roles.filter(x=>x!==r):[...duo.roles,r]})}><i/>{r}</button>})}<input className="duo-role-new" value={roleDraft} maxLength={16} placeholder="＋ 写一个自己的" aria-label="添加关系定位" onChange={e=>setRoleDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addRole()}}} onBlur={addRole}/></div>
    <label className="duo-world"><span>我们的世界观</span><textarea className="duo-ink" rows={5} value={duo.world} maxLength={600} placeholder="这个宇宙里，故事发生在哪里、从哪一刻开始。" onChange={e=>top({world:e.target.value})}/></label>
   </section>
   <section className="duo-scales" aria-label="谁更">
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
  <input ref={file} type="file" accept="image/*" hidden onChange={e=>{upload(e.target.files?.[0]);e.target.value=''}}/>
 </section>;
}
