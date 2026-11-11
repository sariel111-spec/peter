import type { Metadata, Viewport } from 'next';
import './globals.css';
import './experience.css';
import './reader.css';
import SpiderInteractions from './spider-interactions';
import ArchiveTransition from './archive-transition';
import './refinement.css';
import './polish.css';
export const metadata: Metadata = {title:'AFTER CLASS · 彼得的私人宇宙',description:'把纽约的黄昏、未说完的话，和我们的故事收进一本私人校刊。超凡蜘蛛侠梦向档案。',icons:{icon:'/favicon.svg',apple:'/apple-touch-icon.png'},manifest:'/manifest.webmanifest',appleWebApp:{capable:true,title:'After Class',statusBarStyle:'default'}};
export const viewport: Viewport = {width:'device-width',initialScale:1,viewportFit:'cover'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}<ArchiveTransition/><SpiderInteractions/></body></html>}
