// Draws the duo sheet as one shareable picture (设卡). Canvas is used directly so the result looks the same in every browser.
import {daysTogether,parseHeight,type Duo,type DuoSide} from './chronology-model';
const W=1400,PAD=70,INK='#263545',RED='#a72f3b',NAVY='#23374c',FORM='#8a7447',SERIF="'Noto Serif SC','Songti SC',Georgia,serif",SANS="'DM Sans','PingFang SC','Microsoft YaHei',sans-serif";
const picture=(src:string)=>new Promise<HTMLImageElement|null>(resolve=>{if(!src)return resolve(null);const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=src});
function wrap(ctx:CanvasRenderingContext2D,text:string,max:number,limit=99){const lines:string[]=[];for(const para of text.split('\n')){let line='';for(const ch of para){if(ctx.measureText(line+ch).width>max){lines.push(line);line=ch}else line+=ch}lines.push(line)}return lines.slice(0,limit)}
function cover(ctx:CanvasRenderingContext2D,im:HTMLImageElement,x:number,y:number,w:number,h:number){const s=Math.max(w/im.naturalWidth,h/im.naturalHeight),sw=w/s,sh=h/s;ctx.drawImage(im,(im.naturalWidth-sw)/2,(im.naturalHeight-sh)*.3,sw,sh,x,y,w,h)}
function chip(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,fill:string,color:string){ctx.font=`26px ${SERIF}`;const w=ctx.measureText(text).width+36;ctx.fillStyle=fill;ctx.fillRect(x,y,w,48);ctx.fillStyle=color;ctx.fillText(text,x+18,y+33);return w}
export async function exportDuoCard(duo:Duo){
 await (document.fonts?.ready??Promise.resolve());
 const [left,right,photo]=await Promise.all([picture(duo.left.portrait),picture(duo.right.portrait),picture(duo.photo)]);
 const him=duo.left.name||'他',me=duo.right.name||'我',days=daysTogether(duo.since),tags=duo.tags.split(/[,，、\s]+/).filter(Boolean),scales=duo.scales.filter(s=>s.label.trim()),qa=duo.qa.filter(x=>x.q.trim()&&x.a.trim()).slice(0,4);
 const measure=document.createElement('canvas').getContext('2d')!;
 const facts=(d:DuoSide)=>[['年龄',d.age],['身高',d.height],['生日',d.birthday],['类型',d.type],['印象物',d.motif],['动物塑',d.animal],...d.extras.map(f=>[f.k,f.v]),['喜欢',d.likes],['雷点',d.dislikes]].filter(([k,v])=>k.trim()&&v.trim()) as [string,string][];
 const colW=(W-PAD*2-60)/2;measure.font=`28px ${SERIF}`;
 const factLines=(d:DuoSide)=>facts(d).map(([k,v])=>({k,lines:wrap(measure,v,colW-150,3)}));
 const fl=factLines(duo.left),fr=factLines(duo.right),factH=Math.max(...[fl,fr].map(list=>list.reduce((n,f)=>n+f.lines.length*42+14,0)),0);
 const anchorsH=(duo.left.anchors.length||duo.right.anchors.length)?90:0;
 measure.font=`30px ${SERIF}`;const worldLines=duo.world.trim()?wrap(measure,duo.world.trim(),W-PAD*2-80,6):[];
 const viewL=duo.left.view.trim()?wrap(measure,duo.left.view.trim(),colW-70,4):[],viewR=duo.right.view.trim()?wrap(measure,duo.right.view.trim(),colW-70,4):[];
 const bubbleH=(viewL.length||viewR.length||duo.left.calls||duo.right.calls)?Math.max(viewL.length,viewR.length)*44+150:0;
 const blocks={head:210,portraits:640,facts:factH+(factH?40:0)+anchorsH,stage:190,bubbles:bubbleH,roles:duo.roles.length?150:0,scales:scales.length?scales.length*70+90:0,qa:qa.length?qa.length*118+80:0,world:worldLines.length?worldLines.length*48+120:0,foot:120};
 const H=Object.values(blocks).reduce((a,b)=>a+b,0)+PAD;
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d');if(!ctx)throw Error('浏览器暂时无法导出图片');
 ctx.fillStyle='#f0e3c4';ctx.fillRect(0,0,W,H);ctx.fillStyle='#fbf5e6';ctx.fillRect(28,28,W-56,H-56);ctx.strokeStyle='#d9c79d';ctx.lineWidth=2;ctx.strokeRect(28,28,W-56,H-56);
 ctx.textBaseline='alphabetic';let y=PAD+40;
 ctx.fillStyle=FORM;ctx.font=`600 22px ${SANS}`;ctx.textAlign='center';ctx.fillText('T H E   T W O   O F   U S',W/2,y);y+=78;
 ctx.fillStyle=INK;ctx.font=`56px ${SERIF}`;const title=`${him}  ♥  ${me}`;ctx.fillText(title,W/2,y);y+=56;
 ctx.fillStyle='#8a7b65';ctx.font=`26px ${SANS}`;ctx.fillText(days?`在一起的第 ${days} 天${duo.since?' · '+duo.since:''}`:(duo.since||''),W/2,y);y=PAD+blocks.head;
 // portraits
 const pw=400,ph=pw*4/3,gap=photo?40:120,total=photo?pw*2+gap*2+360:pw*2+gap,start=(W-total)/2;
 const polaroid=(im:HTMLImageElement|null,x:number,rot:number,tone:string,name:string,w=pw,h=ph)=>{ctx.save();ctx.translate(x+w/2,y+h/2+20);ctx.rotate(rot*Math.PI/180);ctx.shadowColor='#35271840';ctx.shadowBlur=26;ctx.shadowOffsetY=12;ctx.fillStyle='#fffdf6';ctx.fillRect(-w/2-16,-h/2-16,w+32,h+32);ctx.shadowColor='transparent';if(im)cover(ctx,im,-w/2,-h/2,w,h);else{ctx.fillStyle=tone+'22';ctx.fillRect(-w/2,-h/2,w,h);ctx.fillStyle=tone;ctx.font=`120px ${SERIF}`;ctx.textAlign='center';ctx.fillText(name.slice(0,1),0,40)}ctx.restore()};
 polaroid(left,start,-1.6,RED,him);
 if(photo){const cw=360,ch=cw*.7;ctx.save();ctx.translate(start+pw+gap+cw/2,y+ph/2+20);ctx.rotate(-.6*Math.PI/180);ctx.shadowColor='#35271840';ctx.shadowBlur=22;ctx.shadowOffsetY=10;ctx.fillStyle='#fffdf6';ctx.fillRect(-cw/2-12,-ch/2-12,cw+24,ch+24);ctx.shadowColor='transparent';cover(ctx,photo,-cw/2,-ch/2,cw,ch);ctx.restore()}
 polaroid(right,start+total-pw,1.4,NAVY,me);y+=blocks.portraits;
 // facts
 const drawFacts=(list:{k:string;lines:string[]}[],x:number,anchors:string[])=>{let fy=y;ctx.textAlign='left';for(const f of list){ctx.fillStyle=FORM;ctx.font=`600 20px ${SANS}`;ctx.fillText(f.k,x,fy);ctx.fillStyle=INK;ctx.font=`28px ${SERIF}`;f.lines.forEach((l,i)=>ctx.fillText(l,x+150,fy+i*42));const end=fy+(f.lines.length-1)*42+14;ctx.strokeStyle='#d9cba6';ctx.setLineDash([3,5]);ctx.beginPath();ctx.moveTo(x+150,end);ctx.lineTo(x+colW,end);ctx.stroke();ctx.setLineDash([]);fy+=f.lines.length*42+14}
  if(anchors.length){let ax=x;const ay=y+factH+30;for(const a of anchors){ctx.font=`26px ${SERIF}`;const w=ctx.measureText(a).width+36;if(ax+w>x+colW)break;ctx.fillStyle='#fffdf6';ctx.strokeStyle='#dccfae';ctx.beginPath();ctx.roundRect(ax,ay,w,48,24);ctx.fill();ctx.stroke();ctx.fillStyle='#5f4f2c';ctx.fillText(a,ax+18,ay+33);ax+=w+10}}};
 if(blocks.facts){drawFacts(fl,PAD+10,duo.left.anchors);drawFacts(fr,PAD+colW+50,duo.right.anchors);y+=blocks.facts}
 // stage
 ctx.textAlign='left';ctx.fillStyle=FORM;ctx.font=`600 20px ${SANS}`;ctx.fillText('关系进程',PAD+10,y+10);if(duo.ending){ctx.textAlign='right';ctx.fillStyle=RED;ctx.font=`italic 30px Georgia,serif`;ctx.fillText(duo.ending,W-PAD-10,y+12)}
 const tx=PAD+90,tw=W-PAD*2-180,ty=y+74;ctx.strokeStyle='#d9cba6';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(tx+tw,ty);ctx.stroke();const at=duo.stages.length>1?duo.stage/(duo.stages.length-1):0;ctx.strokeStyle=RED;ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(tx+tw*at,ty);ctx.stroke();
 duo.stages.forEach((s,i)=>{const x=tx+tw*(duo.stages.length>1?i/(duo.stages.length-1):0),on=i<=duo.stage;ctx.beginPath();ctx.arc(x,ty,i===duo.stage?15:10,0,Math.PI*2);ctx.fillStyle=on?RED:'#fbf5e6';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=on?RED:'#cbbd98';ctx.stroke();ctx.textAlign='center';ctx.fillStyle=i===duo.stage?RED:'#9a8d78';ctx.font=`${i===duo.stage?'600 ':''}26px ${SANS}`;ctx.fillText(s||'未命名',x,ty+56)});y+=blocks.stage;
 // bubbles
 if(blocks.bubbles){const bubble=(x:number,tone:string,from:string,to:string,calls:string,lines:string[])=>{const h=blocks.bubbles-40;ctx.fillStyle=tone;ctx.beginPath();ctx.roundRect(x,y,colW,h,24);ctx.fill();ctx.textAlign='left';ctx.fillStyle='#ffffffb0';ctx.font=`600 20px ${SANS}`;ctx.fillText(`${from}叫${to}`,x+34,y+46);ctx.fillStyle='#fffaf0';ctx.font=`34px ${SERIF}`;ctx.fillText(calls||'—',x+34,y+92);ctx.font=`30px ${SERIF}`;lines.forEach((l,i)=>ctx.fillText(l,x+34,y+146+i*44))};bubble(PAD+10,RED,him,me,duo.left.calls,viewL);bubble(PAD+colW+50,NAVY,me,him,duo.right.calls,viewR);y+=blocks.bubbles}
 if(blocks.roles){ctx.textAlign='left';ctx.fillStyle=FORM;ctx.font=`600 20px ${SANS}`;ctx.fillText('关系定位',PAD+10,y+10);let x=PAD+10;for(const r of duo.roles){ctx.font=`26px ${SERIF}`;if(x+ctx.measureText(r).width+36>W-PAD)break;x+=chip(ctx,r,x,y+36,RED,'#fff8ea')+12}y+=blocks.roles}
 if(blocks.scales){ctx.textAlign='left';ctx.fillStyle=FORM;ctx.font=`600 20px ${SANS}`;ctx.fillText('谁更……',PAD+10,y+10);ctx.textAlign='right';ctx.font=`24px ${SERIF}`;ctx.fillStyle=NAVY;ctx.fillText(me,W-PAD-10,y+10);ctx.fillStyle=RED;ctx.fillText(him,PAD+330+40,y+10);let sy=y+70;for(const s of scales){ctx.textAlign='left';ctx.fillStyle=INK;ctx.font=`28px ${SERIF}`;ctx.fillText(s.label,PAD+10,sy+10);const bx=PAD+330,bw=W-PAD-10-bx,g=ctx.createLinearGradient(bx,0,bx+bw,0);g.addColorStop(0,RED);g.addColorStop(.5,'#e6dcc6');g.addColorStop(1,NAVY);ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(bx,sy-4,bw,8,4);ctx.fill();const cx=bx+bw*s.value/100;ctx.beginPath();ctx.arc(cx,sy,17,0,Math.PI*2);ctx.fillStyle='#fffdf6';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=s.value<50?RED:s.value>50?NAVY:'#9a8d78';ctx.stroke();ctx.fillStyle=ctx.strokeStyle;ctx.font='20px serif';ctx.textAlign='center';ctx.fillText('♥',cx,sy+7);sy+=70}y+=blocks.scales}
 if(blocks.qa){ctx.textAlign='left';ctx.fillStyle=FORM;ctx.font=`600 20px ${SANS}`;ctx.fillText('问答',PAD+10,y+10);let qy=y+60;for(const x of qa){ctx.fillStyle=RED;ctx.font=`italic 34px Georgia,serif`;ctx.fillText('Q',PAD+10,qy+6);ctx.fillStyle=INK;ctx.font=`28px ${SERIF}`;ctx.fillText(wrap(ctx,x.q,W-PAD*2-80,1)[0],PAD+60,qy+4);ctx.fillStyle='#6f685b';ctx.font=`26px ${SERIF}`;ctx.fillText(wrap(ctx,x.a.replace(/\n/g,' '),W-PAD*2-80,1)[0],PAD+60,qy+48);qy+=118}y+=blocks.qa}
 if(blocks.world){ctx.textAlign='center';ctx.fillStyle=FORM;ctx.font=`600 20px ${SANS}`;ctx.fillText('我们的世界观',W/2,y+10);ctx.fillStyle=INK;ctx.font=`30px ${SERIF}`;worldLines.forEach((l,i)=>ctx.fillText(l,W/2,y+70+i*48));y+=blocks.world}
 ctx.textAlign='left';let tgx=PAD+10;ctx.font=`24px ${SANS}`;for(const t of tags){const w=ctx.measureText('#'+t).width+28;if(tgx+w>W-PAD-260)break;ctx.fillStyle='#efe2c2';ctx.fillRect(tgx,y+20,w,40);ctx.fillStyle='#7d6a45';ctx.fillText('#'+t,tgx+14,y+48);tgx+=w+10}
 ctx.textAlign='right';ctx.fillStyle='#b3a37e';ctx.font=`600 20px ${SANS}`;ctx.fillText(duo.song?`♪ ${duo.song}`:'AFTER CLASS',W-PAD-10,y+48);
 const h1=parseHeight(duo.left.height),h2=parseHeight(duo.right.height);void h1;void h2;
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('导出未完成')),'image/png'));
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`设定卡-${him}-${me}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
