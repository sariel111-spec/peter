'use client';
// Feel, not function: light that follows the pointer, selections that glide, and a web that gives under the hand.
// Nothing in here reads or writes archive data.
import {useEffect,useRef} from 'react';
import './craft.css';
const fine=()=>typeof matchMedia!=='undefined'&&matchMedia('(hover:hover) and (pointer:fine)').matches;
const calm=()=>typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion:reduce)').matches;
// One marker per group slides to whatever is selected, instead of the selection blinking from place to place.
function place(){
 const set=(box:HTMLElement|null,on:HTMLElement|null|undefined)=>{if(!box)return;if(!on){box.removeAttribute('data-lens');return}const s=box.style;s.setProperty('--lens-x',on.offsetLeft+'px');s.setProperty('--lens-y',on.offsetTop+'px');s.setProperty('--lens-w',on.offsetWidth+'px');s.setProperty('--lens-h',on.offsetHeight+'px');if(!box.hasAttribute('data-lens'))requestAnimationFrame(()=>box.setAttribute('data-lens',''))};
 const nav=document.querySelector<HTMLElement>('.sidebar nav');set(nav,nav?.querySelector<HTMLElement>('.nav-item.active'));
 for(const sel of ['.collection-tabs','.view-switch','.archive-tag-nav']){const box=document.querySelector<HTMLElement>(sel);set(box,box?.querySelector<HTMLElement>(':scope>button.active'))}
}
export default function Craft({section}:{section:string}){
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{place()});
 useEffect(()=>{const again=()=>place();window.addEventListener('resize',again);const t=setTimeout(again,400);document.fonts?.ready.then(again).catch(()=>{});return()=>{window.removeEventListener('resize',again);clearTimeout(t)}},[section]);
 // pointer-driven light: the ink in the main button, the lamp on the gallery wall, the question mark that leans
 useEffect(()=>{if(!fine())return;const move=(e:PointerEvent)=>{if(e.pointerType==='touch')return;const t=e.target as Element|null;if(!t?.closest)return;
   const b=t.closest<HTMLElement>('.archive-heading>.primary-button');if(b){const r=b.getBoundingClientRect();b.style.setProperty('--bx',e.clientX-r.left+'px');b.style.setProperty('--by',e.clientY-r.top+'px')}
   const wall=t.closest<HTMLElement>('.collection-artwork');if(wall){const r=wall.getBoundingClientRect();wall.style.setProperty('--lx',e.clientX-r.left+'px');wall.style.setProperty('--ly',e.clientY-r.top+'px');wall.setAttribute('data-lit','');for(const f of wall.querySelectorAll<HTMLElement>('.artwork-album')){const q=f.getBoundingClientRect(),dx=(q.left+q.width/2-e.clientX)/420,dy=(q.top+q.height/2-e.clientY)/420;f.style.setProperty('--sx',Math.max(-1,Math.min(1,dx)).toFixed(3));f.style.setProperty('--sy',Math.max(-1,Math.min(1,dy)).toFixed(3))}}
   const q=t.closest<HTMLElement>('.collection-question .archive-item');if(q){const r=q.getBoundingClientRect();q.style.setProperty('--qx',((e.clientX-r.left)/r.width-.5).toFixed(3));q.style.setProperty('--qy',((e.clientY-r.top)/r.height-.5).toFixed(3))}};
  document.addEventListener('pointermove',move,{passive:true});return()=>document.removeEventListener('pointermove',move)},[]);
 // the web behind the page title: a faint grid that is pulled toward the pointer and lets go again
 useEffect(()=>{const cv=canvas.current,host=cv?.parentElement;if(!cv||!host)return;const ctx=cv.getContext('2d');if(!ctx)return;
  let w=0,h=0,mx=0,my=0,power=0,target=0,raf=0;const gap=36,sigma=120;
  const size=()=>{const r=cv.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);w=r.width;h=r.height;cv.width=Math.round(w*d);cv.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);draw()};
  const pull=(x:number,y:number):[number,number,number]=>{const dx=x-mx,dy=y-my,g=Math.exp(-(dx*dx+dy*dy)/(2*sigma*sigma))*power;return [x-dx*g*.42,y-dy*g*.42,g]};
  const draw=()=>{ctx.clearRect(0,0,w,h);const cols=Math.ceil(w/gap)+1,rows=Math.ceil(h/gap)+1,ox=(w%gap)/2-gap/2,oy=(h%gap)/2-gap/2;
   const seg=(x1:number,y1:number,x2:number,y2:number)=>{const a=pull(x1,y1),b=pull(x2,y2),g=Math.max(a[2],b[2]);ctx.strokeStyle=g>.02?`rgba(167,47,59,${(.04+g*.3).toFixed(3)})`:'rgba(35,55,76,.045)';ctx.lineWidth=g>.02?1:.8;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke()};
   for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const x=ox+c*gap,y=oy+r*gap;if(c<cols-1)seg(x,y,x+gap,y);if(r<rows-1)seg(x,y,x,y+gap)}
   if(power>.02){ctx.fillStyle=`rgba(167,47,59,${(power*.75).toFixed(3)})`;ctx.beginPath();ctx.arc(mx,my,2.2,0,Math.PI*2);ctx.fill()}};
  const tick=()=>{power+=(target-power)*.14;draw();if(Math.abs(target-power)>.004)raf=requestAnimationFrame(tick);else{power=target;draw();raf=0}};
  const wake=()=>{if(!raf)raf=requestAnimationFrame(tick)};
  const ro=new ResizeObserver(size);ro.observe(cv);size();
  if(!fine()||calm())return()=>ro.disconnect();
  const move=(e:PointerEvent)=>{if(e.pointerType==='touch')return;const r=cv.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top;target=1;wake()},leave=()=>{target=0;wake()};
  host.addEventListener('pointermove',move,{passive:true});host.addEventListener('pointerleave',leave);
  return()=>{ro.disconnect();cancelAnimationFrame(raf);host.removeEventListener('pointermove',move);host.removeEventListener('pointerleave',leave)}},[]);
 return <canvas ref={canvas} className="craft-web" aria-hidden="true"/>;
}
