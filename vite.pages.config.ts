// Static build for GitHub Pages: the same app, with next/navigation swapped for a History-API stand-in
// and the server API answered by ghpages/sw.js. Output goes to docs/ (Pages source: main → /docs).
import {defineConfig,type Plugin} from 'vite';
import react from '@vitejs/plugin-react';
import {copyFileSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const base=process.env.PAGES_BASE||'/peter/';
const pagesFiles=():Plugin=>({name:'after-class-pages',enforce:'pre',
 transform(code,id){if(!id.includes('/app/'))return;return code.replaceAll("location.assign('/')",'location.assign(import.meta.env.BASE_URL)').replaceAll('location.assign(entry.href)',"location.assign(import.meta.env.BASE_URL+entry.href.replace(/^\\//,''))")},
 closeBundle(){const out=resolve(__dirname,'docs');writeFileSync(resolve(out,'sw.js'),readFileSync(resolve(__dirname,'ghpages/sw.js')));copyFileSync(resolve(out,'index.html'),resolve(out,'404.html'));writeFileSync(resolve(out,'.nojekyll'),'')}});
export default defineConfig({root:resolve(__dirname,'ghpages'),base,publicDir:resolve(__dirname,'public'),plugins:[pagesFiles(),react()],
 resolve:{alias:{'next/navigation':resolve(__dirname,'ghpages/next-navigation.ts')}},
 build:{outDir:resolve(__dirname,'docs'),emptyOutDir:true,chunkSizeWarningLimit:1500}});
