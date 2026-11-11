import type {WallDoc,WallNode} from './wall-model';
type Layout=readonly [number,number,number,number,number];
type Clue={id:string;src:string;title:string;layout:Layout;mobile:Layout;layer:number;kind?:'print'|'photo'|'magazine'|'profile';clip?:string;pin?:readonly[number,number]};
export const clueWallSources=[
 {title:'Spidey-daysoff · 蜘蛛侠线索墙',url:'https://www.xiaohongshu.com/explore/6a9bdad00000000011036bd4'},
 {title:'一把名叫西西的伞 · 蜘蛛侠线索墙',url:'https://www.xiaohongshu.com/explore/67c735f20000000029010221'},
 {title:'爱喝豆本豆 · 心心念念的线索墙',url:'https://www.xiaohongshu.com/explore/698db9b7000000000a02d0c2'}
];
export const legacyClues:Clue[]=[
 {id:'oscorp',src:'/wall/oscorp-letter.jpg',title:'Oscorp · 理查德·帕克研究函',layout:[1,2,17,34,-2],mobile:[1,1,29,25,-2],layer:1,pin:[.14,.025]},
 {id:'magazine',src:'/wall/andrew-magazine.jpg',title:'帖子原素材 · 加菲版蜘蛛侠杂志剪报',layout:[18,3,23,28,-1],mobile:[30,2,39,21,1],layer:3,kind:'print',clip:'#bc3345'},
 {id:'physics',src:'/wall/physics-notes.jpg',title:'帖子原素材 · 黑底物理推演',layout:[41,1,26,22,2],mobile:[68,1,31,13,-1],layer:2,pin:[.85,.015]},
 {id:'fluid',src:'/wall/web-fluid.jpg',title:'帖子原素材 · Web Fluid 蛛丝配方',layout:[67,1,19,37,-2],mobile:[68,14,30,25,-2],layer:2,pin:[.11,.015]},
 {id:'gene',src:'/wall/oscorp-gene-chart.jpg',title:'帖子原素材 · Oscorp 基因序列',layout:[85,4,13,37,1],mobile:[73,63,25,23,1],layer:1,clip:'#c8b635'},
 {id:'tower',src:'/wall/oscorp-tower.jpg',title:'超凡蜘蛛侠 · Oscorp 大厦',layout:[79,38,19,17,-4],mobile:[70,38,28,16,-3],layer:5,kind:'photo',clip:'#3492a9'},
 {id:'connors',src:'/wall/connors.jpg',title:'超凡蜘蛛侠 · 柯特·康纳斯博士',layout:[1,29,18,18,3],mobile:[1,28,31,15,3],layer:4,kind:'photo',clip:'#c4a935'},
 {id:'sequence',src:'/wall/sequence-report.jpg',title:'帖子原素材 · 跨物种研究记录',layout:[0,44,16,31,-1],mobile:[0,42,29,25,-2],layer:1,pin:[.18,.01]},
 {id:'suit',src:'/wall/suit-study.jpg',title:'帖子原素材 · 蜘蛛战衣结构草图',layout:[16,48,19,37,0],mobile:[29,58,33,30,0],layer:2,pin:[.17,.015]},
 {id:'peter',src:'/images/peter-portrait.jpg',title:'彼得·帕克 · 卸下面罩的瞬间',layout:[40,21,16,28,3],mobile:[22,34,24,21,-4],layer:5,kind:'photo',clip:'#bd343e'},
 {id:'double',src:'/wall/peter-double.jpg',title:'帖子原素材 · 彼得·帕克黑白双联照',layout:[25,35,24,17,-6],mobile:[31,45,41,13,-5],layer:6,kind:'photo',clip:'#cc8638'},
 {id:'spiderman',src:'/images/spider-city.jpg',title:'超凡蜘蛛侠 · 纽约夜巡',layout:[35,48,22,36,3],mobile:[38,20,29,28,2],layer:4,kind:'photo',pin:[.88,.035]},
 {id:'equations',src:'/wall/field-equations.jpg',title:'帖子原素材 · 手写演算笔记',layout:[56,48,18,45,-3],mobile:[48,51,26,31,2],layer:2,pin:[.92,.02]},
 {id:'harry',src:'/wall/harry.jpg',title:'超凡蜘蛛侠 · 哈利·奥斯本',layout:[71,33,11,24,5],mobile:[76,50,21,20,5],layer:6,kind:'photo',clip:'#b42c34'},
 {id:'subject',src:'/images/peter-camera.jpg',title:'彼得·帕克 · 私人线索档案',layout:[55,26,19,21,-1],mobile:[2,21,35,12,-2],layer:5,kind:'profile',pin:[.85,.02]},
 {id:'night',src:'/wall/oscorp-night.jpg',title:'Oscorp · 纽约夜间调查',layout:[75,58,11,28,4],mobile:[2,55,25,23,3],layer:3,kind:'photo',clip:'#326a90'},
 {id:'memo',src:'/wall/oscorp-letter.jpg',title:'Oscorp · 基因实验档案',layout:[84,59,15,39,1],mobile:[73,77,25,22,1],layer:2,pin:[.83,.02]},
 {id:'spiderbody',src:'/wall/spider-micrograph.jpg',title:'帖子原素材 · 蜘蛛显微摄影',layout:[1,73,25,25,-2],mobile:[1,76,36,20,-2],layer:3,pin:[.12,.03]},
 {id:'eye',src:'/wall/spider-eye-scan.jpg',title:'帖子原素材 · 蜘蛛头部扫描',layout:[38,78,27,21,-1],mobile:[31,86,39,13,-1],layer:5,pin:[.92,.025]},
 {id:'dna',src:'/wall/dna-research.jpg',title:'帖子原素材 · 实验影像',layout:[24,61,21,26,-1],mobile:[29,53,31,19,-1],layer:3,pin:[.3,.025]},
 {id:'hulkbuster',src:'/wall/hulkbuster-schematic.jpg',title:'帖子原素材 · Hulkbuster 工程图',layout:[22,83,19,15,2],mobile:[32,72,28,12,2],layer:4,clip:'#3d839b'},
 {id:'electro',src:'/wall/electro.jpg',title:'超凡蜘蛛侠 · 麦克斯·狄龙 / 电光人',layout:[72,75,15,18,-7],mobile:[59,85,27,13,5],layer:6,kind:'photo',clip:'#c64972'},
 {id:'room',src:'/wall/peter-room.png',title:'超凡蜘蛛侠 · 彼得的房间',layout:[58,84,17,15,5],mobile:[4,66,31,15,-5],layer:6,kind:'photo',clip:'#cc477e'}
];
export const clueWallPhotos=legacyClues.map(c=>({url:c.src,title:c.title}));
const defaultEdges=[['oscorp','magazine'],['oscorp','suit'],['suit','spiderbody'],['spiderbody','peter'],['peter','fluid'],['fluid','gene'],['fluid','equations'],['equations','subject'],['subject','connors'],['connors','dna'],['dna','eye'],['eye','memo'],['memo','tower'],['tower','physics'],['physics','double'],['double','night'],['night','electro'],['electro','room'],['room','hulkbuster'],['hulkbuster','sequence'],['sequence','subject'],['subject','gene']];

export function createDefaultWall():WallDoc{return {version:1,background:'cork',frame:'wood',desktopAspect:1.5,mobileAspect:.56,nodes:legacyClues.map(c=>{const geo=(a:Layout)=>({x:a[0],y:a[1],w:a[2],h:a[3],r:a[4]});return {id:c.id,src:c.src,title:c.title,kind:c.kind==='profile'?'profile':'image',style:c.kind==='photo'?'photo':'print',fit:c.kind==='photo'?'cover':'fill',focus:[50,50],imageZoom:1,text:'',noteColor:'#f2e6b6',decoration:{type:c.clip?'clip':'pin',color:c.clip||'#79523b',anchor:c.pin?[...c.pin]:[.5,.025]},desktop:geo(c.layout),mobile:geo(c.mobile),layer:c.layer,locked:false,hidden:false,keepRatio:false} as WallNode}),edges:defaultEdges.map(([from,to],i)=>({id:'default-line-'+i,from,to,color:i%4===0?'#b33443':'#9c2533',width:1.6}))}};
