export type Kind='story'|'inspiration'|'manuscript'|'artwork'|'message'|'question'|'link'|'profile';
export type Asset={id:string;name:string;type:string;size:number;url:string};
export type Entry={id:string;kind:Kind;title:string;content:string;tags:string[];date:string;favorite:boolean;deleted:boolean;revision:number;updated:string;data:{cover?:string;files?:Asset[];status?:string;url?:string;category?:string;timeLabel?:string;nodeType?:'era'|'moment';parentId?:string|null;order?:number;[key:string]:unknown}};
export const sections:{id:Exclude<Kind,'manuscript'>|'overview'|'gallery';label:string;en:string;sub:string}[]=[
{id:'profile',label:'我们的设定',en:'YOU, ME & THIS UNIVERSE',sub:'在这个宇宙里，故事由我们定义。'},
{id:'story',label:'故事时间线',en:'OUR CHAPTERS',sub:'那些相遇，后来都有了回声。'},
{id:'inspiration',label:'灵感剪贴簿',en:'THE IDEA BOARD',sub:'接住每一个，关于我们的突发奇想。'},
{id:'artwork',label:'画稿收藏馆',en:'THE ART ARCHIVE',sub:'把每一组画稿，收进属于我们的相册。'},
{id:'message',label:'传讯记录簿',en:'LITTLE TRANSMISSIONS',sub:'一张张保存，隔着宇宙的心动。'},
{id:'question',label:'传讯问题簿',en:'WORDS UNSAID',sub:'下次见面时，有好多话想问你。'},
{id:'link',label:'传讯网站集',en:'PLACES TO CONNECT',sub:'收藏每一个，通往你的入口。'},
{id:'gallery',label:'影像收藏室',en:'THE CONTACT SHEET',sub:'从纽约街角，到取景框里的你。'}];
const s=(id:string,kind:Kind,title:string,content:string,date:string,cover:string,tags:string[],data:Entry['data']={}):Entry=>({id,kind,title,content,date,tags:['示例',...tags],favorite:false,deleted:false,revision:1,updated:new Date().toISOString(),data:{cover,...data}});
export const seedEntries:Entry[]=[
s('s1','story','第一卷 · 借走一束光','摄影课结束时，你发现那台相机里多了一张自己的背影。\n\n“光线刚好。”彼得解释得有点快，手却还握着相机背带。\n\n【可编辑的大学 AU 示例】相遇从校园暗房开始，你可以自由改写主角、日期与每个细节。','2026-09-01','/images/peter-camera.jpg',['校园 AU','初遇'],{status:'已发生',category:'第一卷'}),
s('s2','story','第二卷 · 天台上的晚自习','图书馆闭馆后，彼得带你去了天台。\n\n书页被风吹乱，他伸手按住的那一页，恰好夹着你写给他的便签。\n\n也许那晚没有拯救世界的任务。只有两杯逐渐放凉的咖啡。','2026-09-18','/images/peter-rooftop.jpg',['校园 AU','天台'],{status:'进行中',category:'第二卷'}),
s('s3','story','第三卷 · 等纽约说晚安','他总是在夜晚消失，却会在你窗台留下热可可。\n\n这一章还没有结尾。你想把“我知道你的秘密”，留给一个更温柔的时刻。','2026-10-08','/images/spider-bridge.jpg',['夜巡','秘密'],{status:'计划中',category:'第三卷'}),
s('i1','inspiration','如果他洗坏了你的胶卷','一场暗房里的小意外。\n\n他试着用一整天的道歉，补回那些意外曝光的照片。最后你发现，最想留下的画面其实就在眼前。','2026-10-12','/images/peter-blue.jpg',['日常','摄影'],{category:'情节火花',status:'待展开'}),
s('i2','inspiration','雨落在蜘蛛网上的形状','雨天的窗边，空气里有柏油路和旧书的气味。\n\n收集这组意象：晾在暖气片上的手套 / 被雨打湿的睫毛 / 一把始终偏向你的伞。','2026-10-18','/images/spider-city.jpg',['雨天','氛围'],{category:'氛围与意象',status:'待展开'}),
s('i3','inspiration','他会把合照放在哪里？','钱包？相机包夹层？实验笔记的最后一页？\n\n也许他把你的照片，放在了蜘蛛战衣的内侧。','2026-10-22','/images/peter-portrait.jpg',['人物细节','心动'],{category:'人物细节',status:'已采用'}),
s('msg1','message','一封还没有寄出的晚安','这里可以按日期和主题整理传讯记录。编辑这则示例，上传你自己的聊天截图；每张图片都可以放大翻阅，也可以添加本次传讯的文字备注。','2026-10-21','/images/peter-rooftop.jpg',['收件箱','使用示例'],{category:'日常传讯',files:[]}),
s('q1','question','如果我们一起去摄影展，你会选哪张照片？','想听听他看世界的方式，也想知道，他会不会在展览结束后偷偷给我拍一张。','2026-10-24','',['约会','摄影'],{status:'待问',category:'想更了解你'}),
s('q2','question','今天的夜巡，有没有好好照顾自己？','记得问他有没有吃晚饭，手上的伤有没有处理。','2026-10-25','',['关心','日常'],{status:'待问',category:'日常关心'}),
s('q3','question','你第一次注意到我，是在哪个瞬间？','答案可以记录在这里，也可以把本次传讯的截图放进收件箱。','2026-10-26','',['心动'],{status:'已问',category:'关于我们'}),
s('l1','link','Character.AI','AI 角色对话网站入口。可以把你常用的角色链接、开场白与使用笔记统一保存在这里。网站功能与可用性以平台实际页面为准。','2026-10-26','',['角色对话','网站入口'],{url:'https://character.ai/',category:'角色对话'}),
s('l2','link','SillyTavern','角色扮演对话前端工具的官方主页。通常需要自行部署并连接模型服务；这里收藏的是官方入口，可改成你自己的访问地址。','2026-10-25','',['角色对话','自建工具'],{url:'https://sillytavern.app/',category:'自建工具'}),
s('p1','profile','Peter Parker · 彼得·帕克','【本网站的可编辑创作设定】\n\n梦角：《超凡蜘蛛侠》系列中的彼得·帕克。\n世界观：大学校园 AU，可按你的偏好修改。\n关键词：摄影 / 科学 / 纽约 / 笨拙而真诚的温柔。\n\n这里用于保存属于你们的设定，不会把示例当成电影官方剧情。','2026-09-01','/images/peter-camera.jpg',['梦角档案'],{category:'角色档案'}),
s('p2','profile','You · 你的角色档案','名字 / 昵称：待填写\n专业与年级：待填写\n与你的彼得相遇的地点：待填写\n你们之间的小习惯：待填写\n\n把这里写成你喜欢的样子。','2026-09-01','/images/peter-blue.jpg',['自设档案'],{category:'自设档案'})];
export const photos=[
{url:'/images/peter-camera.jpg',title:'取景框里的彼得',source:'https://www.pinterest.com/pin/422282902541097773/'},
{url:'/images/peter-rooftop.jpg',title:'天台与课间',source:'https://www.ecartelera.com.mx/fotos/galeria/imagenes-desde-el-rodaje-de-the-amazing-spider-man/andrew-garfield-como-peter-parker-en-el-set-de-the-amazing-spider-man/'},
{url:'/images/spider-city.jpg',title:'纽约的另一面',source:'https://www.pinterest.com/pin/23573598019773233/'},
{url:'/images/spider-bridge.jpg',title:'夜巡 · Williamsburg Bridge',source:'https://moviemaps.org/images/32h'},
{url:'/images/peter-portrait.jpg',title:'卸下面罩的瞬间',source:'https://cl.pinterest.com/pin/914862418166046/'},
{url:'/images/peter-blue.jpg',title:'相机与晴天',source:'https://www.pinterest.com/pin/857795060254415329/'}];
