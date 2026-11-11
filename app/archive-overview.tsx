'use client';
import {useMemo,useState} from 'react';
import {ArrowUpRight,BookOpen,Lightbulb,Image as ImageIcon,Mail,MessageCircle,Globe,Plus,Heart,Camera,X,Shuffle,PencilLine,CalendarHeart,Quote,Users,ShieldCheck} from 'lucide-react';
import {entryImages} from './media-model';
import type {Entry} from './archive';
import {daysTogether,nextReturn} from './chronology-model';
import {useDuo,type DuoHost} from './duo-store';
import './overview.css';
type Destination='story'|'inspiration'|'artwork'|'message'|'question'|'link'|'gallery'|'profile';
const rooms=[
 {id:'story',name:'故事时间线',en:'OUR CHAPTERS',image:'/images/peter-camera.jpg',icon:BookOpen,note:'拨动时间，走进故事的下一层。'},
 {id:'inspiration',name:'灵感剪贴簿',en:'THE IDEA BOARD',image:'/images/peter-blue.jpg',icon:Lightbulb,note:'一枚念头，和所有还没写完的可能。'},
 {id:'artwork',name:'画稿收藏馆',en:'THE ART ARCHIVE',image:'/images/peter-portrait.jpg',icon:ImageIcon,note:'把笔下的相逢，一张张收好。'},
 {id:'message',name:'传讯记录簿',en:'LITTLE TRANSMISSIONS',image:'/images/spider-bridge.jpg',icon:Mail,note:'关于今天，也关于每一次晚安。'},
 {id:'question',name:'传讯问题簿',en:'WORDS UNSAID',image:'/images/peter-rooftop.jpg',icon:MessageCircle,note:'那些想问的话，先放在这里。'},
 {id:'link',name:'传讯网站集',en:'PLACES TO CONNECT',image:'/images/spider-city.jpg',icon:Globe,note:'收藏每一个通往你的入口。'},
 {id:'gallery',name:'影像收藏室',en:'THE CONTACT SHEET',image:'/images/spider-city.jpg',icon:Camera,note:'从纽约街角，到取景框里的你。'},
 {id:'profile',name:'我们的设定',en:'YOU, ME & THIS UNIVERSE',image:'/images/peter-blue.jpg',icon:Heart,note:'在这个宇宙里，故事由我们定义。'}] as const;
const kindName:Record<string,string>={story:'故事',inspiration:'灵感',artwork:'画稿',message:'传讯',question:'问题',link:'网站',profile:'设定'};
type Props=DuoHost&{entries:Entry[];loading:boolean;galleryCount:number;backupAge:number|null;backupBusy:boolean;onBackup:()=>void;onGo:(id:Destination)=>void;onRead:(id:string)=>void;onNew:()=>void};
export default function ArchiveOverview(p:Props){
 const {duo,top,state,status,retry}=useDuo(p);
 const [mottoEdit,setMottoEdit]=useState(false);
 const [turn,setTurn]=useState(0),[quoteEdit,setQuoteEdit]=useState(false),[dayEdit,setDayEdit]=useState(false);
 const live=useMemo(()=>p.entries.filter(e=>!e.deleted&&e.kind!=='manuscript'),[p.entries]);
 const recent=useMemo(()=>[...live].sort((a,b)=>b.updated.localeCompare(a.updated)).slice(0,5),[live]);
 const waiting=useMemo(()=>live.filter(e=>e.kind==='question'&&e.data.status!=='已问').sort((a,b)=>b.updated.localeCompare(a.updated)),[live]);
 const him=duo.left.name||'彼得',me=duo.right.name||'我',days=daysTogether(duo.since);
 const quotes=duo.quotes.filter(q=>q.trim()),today=new Date(),seed=Math.floor((Date.UTC(today.getFullYear(),today.getMonth(),today.getDate())-Date.UTC(today.getFullYear(),0,0))/864e5),quote=quotes.length?quotes[(seed+turn)%quotes.length]:'';
 const dated=[...(duo.since.trim()?[{label:'在一起的那一天',date:duo.since,fixed:true}]:[]),...duo.days.map(d=>({...d,fixed:false}))].map(d=>({...d,next:nextReturn(d.date)}));
 const upcoming=dated.filter(d=>d.next).sort((a,b)=>a.next!.inDays-b.next!.inDays)[0];
 const motto=(duo.motto.trim()||'纽约的另一面，\n是我们的故事。').split('\n').map(x=>x.trim()).filter(Boolean);
 const stageAt=duo.stages.length>1?duo.stage/(duo.stages.length-1):0;
 return <div className="archive-overview">
  <section className="overview-cover">
   <div className="overview-cover-photo"><img src="/images/peter-rooftop.jpg" alt="纽约天台上的彼得"/><span className="overview-photo-index">NEW YORK / OUR PRIVATE UNIVERSE</span></div>
   <div className="overview-cover-copy">
    <small>THE PETER PARKER PERSONAL ARCHIVE</small>
    {mottoEdit?<textarea className="overview-motto-input" autoFocus rows={2} value={duo.motto} maxLength={60} placeholder={'纽约的另一面，\n是我们的故事。'} aria-label="封面标题，换行后的第二行会显示为红色" onChange={e=>top({motto:e.target.value})} onBlur={()=>setMottoEdit(false)} onKeyDown={e=>{if(e.key==='Escape')(e.target as HTMLElement).blur()}}/>
     :<h1 tabIndex={-1}><button type="button" className="overview-motto" onClick={()=>setMottoEdit(true)} aria-label="修改封面标题">{motto[0]}{motto.length>1&&<><br/><em>{motto.slice(1).join(' ')}</em></>}</button></h1>}
    <input className="overview-sub" value={duo.sub} maxLength={120} placeholder="从一个片段，走进属于你和彼得的宇宙。" aria-label="封面副标题" onChange={e=>top({sub:e.target.value})}/>
    <div><button className="primary-button" onClick={()=>p.onGo('story')}>翻开时间线<ArrowUpRight size={16}/></button><button className="text-button" onClick={p.onNew}><Plus size={14}/>存一枚灵感</button></div>
    <button type="button" className="overview-count" onClick={()=>p.onGo('profile')} data-cursor="enter" aria-label={days?`${him}和${me}在一起的第 ${days} 天，打开设定`:'去设定里写下纪念日'}><span>{him}<Heart size={11} fill="currentColor"/>{me}</span>{days?<><strong>{days}</strong><em>DAYS</em></>:<em>写下纪念日</em>}</button>
    <p className="overview-edit-note" data-state={state}><PencilLine size={12}/>{state==='saved'?'标题和这句话可以直接点击修改':status}{state==='failed'&&<button type="button" onClick={retry}>再试一次</button>}</p>
   </div>
  </section>

  <div className="overview-now">
   <button type="button" className="overview-tile overview-stage" onClick={()=>p.onGo('profile')} data-cursor="enter">
    <small><Heart size={13}/>我们走到了</small><strong>{duo.stages[duo.stage]||'—'}</strong>
    <span className="overview-stage-track" style={{'--at':stageAt} as React.CSSProperties}><i/>{duo.stages.map((s,i)=><b key={i} className={i<=duo.stage?'on':''} style={{left:(duo.stages.length>1?i/(duo.stages.length-1)*100:0)+'%'}}/>)}</span>
    <em>{duo.stages[0]} → {duo.stages[duo.stages.length-1]}<ArrowUpRight size={13}/></em>
   </button>
   <section className="overview-tile overview-quote" aria-label="今日一句">
    <div className="overview-tile-head"><small><Quote size={13}/>今日一句</small><span>{quotes.length>1&&<button type="button" onClick={()=>setTurn(t=>t+1)} aria-label="换一句"><Shuffle size={14}/></button>}<button type="button" onClick={()=>setQuoteEdit(v=>!v)} aria-expanded={quoteEdit}>{quoteEdit?'完成':quotes.length?'管理语录':'写第一句'}</button></span></div>
    {quoteEdit?<div className="overview-list-edit">{duo.quotes.map((q,i)=><div key={i}><textarea rows={2} value={q} maxLength={200} placeholder="他说过的话，或你想对他说的话" aria-label={`第 ${i+1} 句语录`} onChange={e=>top({quotes:duo.quotes.map((x,j)=>j===i?e.target.value:x)})}/><button type="button" aria-label="删除这一句" onClick={()=>top({quotes:duo.quotes.filter((_,j)=>j!==i)})}><X size={13}/></button></div>)}{duo.quotes.length<60&&<button type="button" className="overview-add" onClick={()=>top({quotes:[...duo.quotes,'']})}><Plus size={13}/>加一句</button>}</div>
     :quote?<blockquote key={quote}>{quote}</blockquote>:<p>把他说过的话、你想对他说的话存在这里，每天打开会看到其中一句。</p>}
   </section>
   <section className="overview-tile overview-days" aria-label="纪念日">
    <div className="overview-tile-head"><small><CalendarHeart size={13}/>纪念日</small><span><button type="button" onClick={()=>setDayEdit(v=>!v)} aria-expanded={dayEdit}>{dayEdit?'完成':duo.days.length?'管理':'添加'}</button></span></div>
    {dayEdit?<div className="overview-list-edit overview-day-edit">{duo.days.map((d,i)=><div key={i}><input value={d.label} maxLength={30} placeholder="叫什么，比如 他的生日" aria-label={`第 ${i+1} 个纪念日的名称`} onChange={e=>top({days:duo.days.map((x,j)=>j===i?{...x,label:e.target.value}:x)})}/><input value={d.date} maxLength={40} placeholder="2012-08-10" aria-label={`${d.label||'纪念日'}的日期`} onChange={e=>top({days:duo.days.map((x,j)=>j===i?{...x,date:e.target.value}:x)})}/><button type="button" aria-label={`删除 ${d.label||'这个纪念日'}`} onClick={()=>top({days:duo.days.filter((_,j)=>j!==i)})}><X size={13}/></button></div>)}{duo.days.length<30&&<button type="button" className="overview-add" onClick={()=>top({days:[...duo.days,{label:'',date:''}]})}><Plus size={13}/>加一个日子</button>}<p>日期写成 2012-08-10 这样，就会自动倒数。</p></div>
     :upcoming?<><strong>{upcoming.next!.inDays===0?'就是今天':<>{upcoming.next!.inDays}<i>天后</i></>}</strong><b>{upcoming.label||'未命名的日子'}{upcoming.next!.years>0&&<> · 第 {upcoming.next!.years} 年</>}</b><ul>{dated.filter(d=>d!==upcoming&&d.next).sort((a,b)=>a.next!.inDays-b.next!.inDays).slice(0,2).map((d,i)=><li key={i}><span>{d.label||'未命名'}</span><em>{d.next!.inDays===0?'今天':d.next!.inDays+' 天后'}</em></li>)}</ul></>
     :<p>记下生日、初遇、第一次约会。下一个日子快到时，这里会提醒你。</p>}
   </section>
  </div>

  <div className="overview-section-heading"><span>EXPLORE THE ARCHIVE</span><small>{p.loading?'正在打开档案…':live.length+' 个片段，连成一个宇宙'}</small></div>
  <div className="overview-rooms">{rooms.map((room,i)=>{const Icon=room.icon,mine=live.filter(e=>e.kind===room.id),count=room.id==='gallery'?p.galleryCount:mine.length,latest=[...mine].sort((a,b)=>b.updated.localeCompare(a.updated))[0],image=(room.id==='profile'&&duo.photo)||(latest?entryImages(latest)[0]?.url:undefined)||room.image;
   return <button key={room.id} className={`overview-room room-${room.id} kinetic-card`} onClick={()=>p.onGo(room.id)} data-cursor="enter"><div className="overview-room-image"><img src={image} alt="" loading="lazy"/><span>{String(i+1).padStart(2,'0')} / {room.en}</span><i><ArrowUpRight size={24}/></i></div><div className="overview-room-copy"><Icon size={16}/><h2>{room.name}</h2><b>{p.loading?'—':String(count).padStart(2,'0')}</b></div><p>{latest&&room.id!=='gallery'?<>最近：{latest.title}</>:room.note}</p></button>})}</div>

  <div className="overview-lower">
   {recent.length>0&&<section className="overview-recent"><div><small>RECENTLY KEPT</small><h2>最近留下的片段</h2></div><div>{recent.map(r=><button key={r.id} onClick={()=>p.onRead(r.id)}><i>{kindName[r.kind]||''}</i><b>{r.title}</b><span>{(r.data.timeLabel as string)||r.date.replaceAll('-','.')}</span><ArrowUpRight size={15}/></button>)}</div></section>}
   <section className="overview-waiting"><div><small>WORDS UNSAID</small><h2>还没问出口的 <b>{waiting.length}</b></h2></div>{waiting.length?<div>{waiting.slice(0,4).map(q=><button key={q.id} onClick={()=>p.onRead(q.id)}><MessageCircle size={14}/><b>{q.title}</b></button>)}{waiting.length>4&&<button className="overview-more" onClick={()=>p.onGo('question')}>还有 {waiting.length-4} 个<ArrowUpRight size={13}/></button>}</div>:<p>没有待问的问题。想到什么，就先记到问题簿里。</p>}{(p.doc.cast?.people.length||0)>0&&<button className="overview-cast" onClick={()=>p.onGo('story')}><Users size={14}/>人物关系图里有 {p.doc.cast!.people.length} 位人物、{p.doc.cast!.links.length} 条关系<ArrowUpRight size={13}/></button>}</section>
  </div>
  {!p.loading&&live.length>=3&&(p.backupAge===null||p.backupAge>=14)&&<div className="overview-backup" role="note"><ShieldCheck size={16}/><span>{p.backupAge===null?'这台设备上还没有导出过备份。':`距离这台设备上次备份已经 ${p.backupAge} 天。`}留一份在自己手里，更安心。</span><button type="button" disabled={p.backupBusy} onClick={p.onBackup}>{p.backupBusy?'正在打包…':'现在导出一份'}<ArrowUpRight size={13}/></button></div>}
  <div className="overview-return"><a href="/">返回线索墙首页<ArrowUpRight size={13}/></a><button onClick={()=>p.onGo('profile')}>我们的设定<Heart size={13}/></button></div>
 </div>
}
