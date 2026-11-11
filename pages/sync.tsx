import {useEffect,useRef,useState} from 'react';
import {Cloud,CloudOff,RefreshCw,Check,X,KeyRound,HardDrive,TriangleAlert} from 'lucide-react';
export type SyncStatus={configured:boolean;mode:'github'|'local'|'none';owner:string;repo:string;dirty:boolean;pendingAssets:number;lastSync:string|null;error:string;records:number};
export const readStatus=async()=>(await fetch('/api/sync')).json() as Promise<SyncStatus>;
const post=async(path:string,body?:unknown,method='POST')=>{const r=await fetch(path,{method,headers:{'content-type':'application/json'},body:body?JSON.stringify(body):undefined}),b=await r.json() as SyncStatus&{error?:string};if(!r.ok)throw Error(b.error||'操作未完成');return b};

function Connect({onDone,onLocal,compact}:{onDone:(s:SyncStatus)=>void;onLocal?:()=>void;compact?:boolean}){
 const [owner,setOwner]=useState(()=>location.hostname.endsWith('.github.io')?location.hostname.split('.')[0]:''),[repo,setRepo]=useState('peter-data'),[token,setToken]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const submit=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError('');try{onDone(await post('/api/config',{owner:owner.trim(),repo:repo.trim(),token:token.trim()}))}catch(err){setError((err as Error).message)}finally{setBusy(false)}};
 return <form className="pages-connect" onSubmit={submit}>
  {!compact&&<ol><li>在 GitHub 新建一个<b>私有</b>仓库，用来放你的内容（例如 <code>peter-data</code>）。</li><li>打开 GitHub → Settings → Developer settings → Fine-grained tokens，生成一个只对这个仓库有 <b>Contents：Read and write</b> 权限的令牌。</li><li>把仓库和令牌填在下面。令牌只保存在这台设备的浏览器里。</li></ol>}
  <div className="pages-fields"><label>GitHub 用户名<input value={owner} onChange={e=>setOwner(e.target.value)} autoComplete="off" spellCheck={false} required/></label><label>私有仓库名<input value={repo} onChange={e=>setRepo(e.target.value)} autoComplete="off" spellCheck={false} required/></label></div>
  <label>访问令牌<input type="password" value={token} onChange={e=>setToken(e.target.value)} autoComplete="off" spellCheck={false} placeholder="github_pat_…" required/></label>
  {error&&<p className="pages-error" role="alert"><TriangleAlert size={14}/>{error}</p>}
  <div className="pages-actions"><button className="primary-button" disabled={busy}>{busy?<RefreshCw size={15} className="spin"/>:<KeyRound size={15}/>}{busy?'正在连接…':'连接并同步'}</button>{onLocal&&<button type="button" className="pages-quiet" disabled={busy} onClick={onLocal}><HardDrive size={14}/>先不连接，只存在这台设备</button>}</div>
 </form>;
}
export function Setup({onDone}:{onDone:(s:SyncStatus)=>void}){
 return <main className="pages-setup"><section>
  <small>AFTER CLASS · FIRST VISIT</small><h1>这里还是空的，<em>先告诉我内容存在哪里。</em></h1>
  <p>这个网站放在 GitHub Pages 上，任何人都能打开这个地址，但看不到你的内容。你的档案会存进你自己的私有仓库，在手机和电脑之间同步。</p>
  <Connect onDone={onDone} onLocal={async()=>onDone(await post('/api/config',{local:true}))}/>
 </section></main>;
}
const ago=(iso:string|null)=>{if(!iso)return '还没有同步过';const m=Math.floor((Date.now()-new Date(iso).getTime())/60000);return m<1?'刚刚同步':m<60?`${m} 分钟前同步`:m<1440?`${Math.floor(m/60)} 小时前同步`:`${Math.floor(m/1440)} 天前同步`};
export default function SyncDock({initial,onChange}:{initial:SyncStatus;onChange:(s:SyncStatus)=>void}){
 const [status,setStatus]=useState(initial),[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[connect,setConnect]=useState(false),timer=useRef<ReturnType<typeof setInterval>|null>(null);
 useEffect(()=>{const tick=()=>readStatus().then(setStatus).catch(()=>{});timer.current=setInterval(tick,open?2500:7000);const focus=()=>tick();window.addEventListener('focus',focus);return()=>{if(timer.current)clearInterval(timer.current);window.removeEventListener('focus',focus)}},[open]);
 useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(status.mode==='github'&&status.dirty)e.preventDefault()};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[status]);
 const run=async()=>{setBusy(true);try{const s=await post('/api/sync');setStatus(s);if(!s.error&&!s.dirty)window.dispatchEvent(new Event('after-class:chronology-reload'))}catch{}finally{setBusy(false)}};
 const local=status.mode!=='github',tone=status.error?'error':local?'local':status.dirty?'dirty':'ok';
 const label=status.error?'同步出了问题':local?'只存在这台设备':status.dirty?'正在保存到 GitHub…':'已同步到 GitHub';
 return <div className={`pages-dock ${open?'open':''}`} data-tone={tone}>
  <button type="button" className="pages-dock-pill" onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-label={`同步状态：${label}`} title={label}>{status.error?<TriangleAlert size={15}/>:local?<CloudOff size={15}/>:status.dirty?<RefreshCw size={15} className="spin"/>:<Cloud size={15}/>}</button>
  {open&&<div className="pages-dock-panel" role="dialog" aria-label="同步">
   <header><b>{label}</b><button type="button" onClick={()=>{setOpen(false);setConnect(false)}} aria-label="关闭"><X size={16}/></button></header>
   {status.error&&<p className="pages-error"><TriangleAlert size={14}/>{status.error}</p>}
   {local?<><p>内容现在只保存在这台设备的浏览器里。清除浏览器数据会丢失，换设备也看不到。连接一个私有仓库后会自动同步。</p>{connect?<Connect compact onDone={s=>{setStatus(s);onChange(s);setConnect(false);location.reload()}}/>:<button className="primary-button" onClick={()=>setConnect(true)}><KeyRound size={15}/>连接 GitHub 私有仓库</button>}</>
    :<><p><Check size={13}/>{status.owner}/{status.repo} · {ago(status.lastSync)}{status.pendingAssets>0&&` · 还有 ${status.pendingAssets} 份附件在上传`}</p><div className="pages-actions"><button className="primary-button" disabled={busy} onClick={run}><RefreshCw size={15} className={busy?'spin':''}/>{busy?'正在同步…':'立即同步'}</button><button type="button" className="pages-quiet" onClick={async()=>{const s=await post('/api/config',undefined,'DELETE');setStatus(s);onChange(s)}}>在这台设备上断开</button></div><small>断开只会移除这台设备上的令牌，仓库里的内容不会动。</small></>}
  </div>}
 </div>;
}
