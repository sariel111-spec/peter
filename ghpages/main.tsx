import {StrictMode,useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import '../app/globals.css';
import '../app/experience.css';
import '../app/reader.css';
import '../app/refinement.css';
import '../app/polish.css';
import './pages.css';
import SpiderInteractions from '../app/spider-interactions';
import ArchiveTransition from '../app/archive-transition';
import WallPortal from '../app/wall-portal';
import Archive from '../app/archive-app';
import type {WallResponse} from '../app/wall-model';
import {navigate,usePath} from './next-navigation';
import SyncDock,{Setup,readStatus,type SyncStatus} from './sync';

const base=import.meta.env.BASE_URL;

// The worker answers every /api request, so nothing may render before it is in charge of this page.
async function worker(){
 if(!('serviceWorker' in navigator))throw Error('这个浏览器不支持离线存储（Service Worker），网站无法在这里运行。请换用 Chrome、Safari 或 Edge 的普通窗口。');
 await navigator.serviceWorker.register(base+'sw.js',{scope:base});await navigator.serviceWorker.ready;
 if(!navigator.serviceWorker.controller){if(!sessionStorage.getItem('ac-reloaded')){sessionStorage.setItem('ac-reloaded','1');location.reload();await new Promise(()=>{})}await new Promise<void>(r=>navigator.serviceWorker.addEventListener('controllerchange',()=>r(),{once:true}))}
 sessionStorage.removeItem('ac-reloaded');
}
// In-site links are written as "/…"; keep them inside the project path, and hand attachments to the worker.
document.addEventListener('click',e=>{
 const a=(e.target as HTMLElement).closest?.('a');if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey)return;const href=a.getAttribute('href')||'';
 if(href.startsWith('/api/assets/')){e.preventDefault();fetch(href).then(r=>{if(!r.ok)throw 0;return r.blob()}).then(blob=>{const url=URL.createObjectURL(blob);if(a.hasAttribute('download')||href.includes('download')){const d=document.createElement('a');d.href=url;d.download=a.getAttribute('download')||'';d.click()}else window.open(url,'_blank','noopener');setTimeout(()=>URL.revokeObjectURL(url),60000)}).catch(()=>{});return}
 if(href==='/'||(/^\/(archive)(\/|#|\?|$)/.test(href))){e.preventDefault();navigate(href)}
},true);

function Home(){
 const [wall,setWall]=useState<WallResponse|null|undefined>(undefined),[error,setError]=useState('');
 useEffect(()=>{let live=true;fetch('/api/wall').then(r=>r.json() as Promise<WallResponse>).then(w=>{if(live)setWall(w)}).catch(()=>{if(live){setError('暂时无法读取你的线索墙，请重新打开页面。');setWall(null)}});return()=>{live=false}},[]);
 if(wall===undefined)return <div className="pages-blank"/>;
 return <WallPortal initial={wall} error={error}/>;
}
function App(){
 const path=usePath(),[status,setStatus]=useState<SyncStatus|null>(null);
 useEffect(()=>{readStatus().then(setStatus).catch(()=>setStatus(null))},[]);
 if(!status)return <div className="pages-blank"/>;
 if(!status.configured)return <><Setup onDone={setStatus}/><SpiderInteractions/></>;
 return <>{path.startsWith('/archive')?<Archive/>:<Home/>}<ArchiveTransition/><SpiderInteractions/><SyncDock initial={status} onChange={setStatus}/></>;
}
worker().then(()=>createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>)).catch(e=>{document.getElementById('boot')!.textContent=(e as Error).message||'网站没能启动，请刷新重试。'});
