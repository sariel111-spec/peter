// Stand-in for next/navigation on the static build: same calls, driven by the History API.
import {useSyncExternalStore} from 'react';
const base=import.meta.env.BASE_URL.replace(/\/$/,'');
const listeners=new Set<()=>void>();
const emit=()=>listeners.forEach(l=>l());
export const currentPath=()=>{const p=location.pathname.startsWith(base)?location.pathname.slice(base.length):location.pathname;return (p.replace(/\/+$/,'')||'/')};
export function navigate(href:string,replace=false){const url=new URL(href,location.origin),target=base+(url.pathname==='/'?'/':url.pathname)+url.search+url.hash;if(replace)history.replaceState(null,'',target);else history.pushState(null,'',target);window.scrollTo(0,0);emit();if(url.hash)window.dispatchEvent(new HashChangeEvent('hashchange'))}
window.addEventListener('popstate',emit);
export const usePath=()=>useSyncExternalStore(cb=>{listeners.add(cb);return()=>listeners.delete(cb)},currentPath);
const router={push:(href:string,_o?:unknown)=>navigate(href),replace:(href:string,_o?:unknown)=>navigate(href,true),prefetch:(_href:string)=>{},back:()=>history.back(),refresh:()=>emit()};
export const useRouter=()=>router;
export const usePathname=()=>usePath();
