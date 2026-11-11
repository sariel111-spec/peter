import {identity} from './api/shared';
import {readWallState} from './wall-storage';
import WallPortal from './wall-portal';
export const dynamic='force-dynamic';
export const revalidate=0;
export default async function Home(){
 try{const owner=await identity();if(!owner)return <WallPortal initial={null} error="登录后，才能打开你的私人线索墙。"/>;const wall=await readWallState(owner);return <WallPortal initial={wall}/>}
 catch{return <WallPortal initial={null} error="暂时无法读取你的线索墙，请重新连接。"/>}
}
