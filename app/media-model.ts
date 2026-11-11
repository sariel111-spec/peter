import type {Entry,Kind} from './archive';
export type ReadImage={url:string;title:string};
export const allowsCover=(kind:Kind)=>kind==='artwork'||kind==='profile';
export function entryImages(entry:Entry):ReadImage[]{
 const files=(entry.data.files||[]).filter(f=>f.type.startsWith('image/')).map(f=>({url:f.url,title:f.name}));
 if(allowsCover(entry.kind)&&entry.data.cover){const i=files.findIndex(f=>f.url===entry.data.cover);const chosen=i>=0?files.splice(i,1)[0]:{url:entry.data.cover,title:entry.title};files.unshift(chosen);}
 return files.filter((image,i,all)=>all.findIndex(v=>v.url===image.url)===i);
}
export function zoomScroll(left:number,top:number,width:number,height:number,before:number,after:number){return {left:Math.max(0,(left+width/2)*after/before-width/2),top:Math.max(0,(top+height/2)*after/before-height/2)}}
